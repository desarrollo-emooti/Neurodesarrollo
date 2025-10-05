import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinicalStaff } from './auth';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Get all test results
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('studentId').optional().isString().withMessage('Student ID must be a string'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('etapa').optional().isIn(['EDUCACION_INFANTIL', 'EDUCACION_PRIMARIA', 'ESO', 'BACHILLERATO', 'FORMACION_PROFESIONAL']).withMessage('Invalid etapa'),
    query('course').optional().isString().withMessage('Course must be a string'),
    query('classGroup').optional().isString().withMessage('Class group must be a string'),
    query('testName').optional().isString().withMessage('Test name must be a string'),
    query('academicYear').optional().isString().withMessage('Academic year must be a string'),
    query('validated').optional().isBoolean().withMessage('Validated must be a boolean'),
    query('importSource').optional().isIn(['MANUAL', 'PDF_IMPORT', 'BULK_IMPORT', 'API']).withMessage('Invalid import source'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      studentId,
      centerId,
      etapa,
      course,
      classGroup,
      testName,
      academicYear,
      validated,
      importSource,
      sortBy = 'executionDate',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on user permissions
    const where: any = {};

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.student = { centerId: req.user.centerId };
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.student = { centerId: { in: req.user.centerIds } };
    } else if (req.user.userType === 'FAMILIA') {
      // Families can only see results for their children
      const familyRelations = await prisma.studentFamilyRelation.findMany({
        where: { familyUserId: req.user.id },
        select: { studentId: true },
      });
      where.studentId = { in: familyRelations.map(rel => rel.studentId) };
    }

    // Apply filters
    if (search) {
      where.OR = [
        { testName: { contains: search, mode: 'insensitive' } },
        { testCode: { contains: search, mode: 'insensitive' } },
        { student: { fullName: { contains: search, mode: 'insensitive' } } },
        { student: { studentId: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (centerId) {
      where.student = { ...where.student, centerId };
    }

    if (etapa) {
      where.student = { ...where.student, etapa };
    }

    if (course) {
      where.student = { ...where.student, course };
    }

    if (classGroup) {
      where.student = { ...where.student, classGroup };
    }

    if (testName) {
      where.testName = { contains: testName, mode: 'insensitive' };
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (validated !== undefined) {
      where.validated = validated;
    }

    if (importSource) {
      where.importSource = importSource;
    }

    // Get test results with pagination
    const [results, total] = await Promise.all([
      prisma.testResult.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          resultId: true,
          assignmentId: true,
          studentId: true,
          testName: true,
          testCode: true,
          academicYear: true,
          originalPdfUrl: true,
          examinerId: true,
          executionDate: true,
          rawScore: true,
          percentile: true,
          standardScore: true,
          interpretation: true,
          detailedResults: true,
          observations: true,
          incidents: true,
          validated: true,
          validatedBy: true,
          validationDate: true,
          importSource: true,
          testVersion: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
              etapa: true,
              course: true,
              classGroup: true,
              center: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          examiner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignment: {
            select: {
              id: true,
              testTitle: true,
              testDate: true,
            },
          },
        },
      }),
      prisma.testResult.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'TestResult', undefined, {
      filters: { search, studentId, centerId, etapa, course, classGroup, testName, academicYear, validated, importSource },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: results,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get test result by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Test result ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const result = await prisma.testResult.findUnique({
      where: { id },
      select: {
        id: true,
        resultId: true,
        assignmentId: true,
        studentId: true,
        testName: true,
        testCode: true,
        academicYear: true,
        originalPdfUrl: true,
        examinerId: true,
        executionDate: true,
        rawScore: true,
        percentile: true,
        standardScore: true,
        interpretation: true,
        detailedResults: true,
        observations: true,
        incidents: true,
        validated: true,
        validatedBy: true,
        validationDate: true,
        importSource: true,
        testVersion: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            etapa: true,
            course: true,
            classGroup: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        examiner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        assignment: {
          select: {
            id: true,
            testTitle: true,
            testDate: true,
          },
        },
        stap2GoResult: true,
        ravens2Result: true,
      },
    });

    if (!result) {
      throw notFoundErrorHandler('Test result');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && result.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this test result',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(result.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.user.userType === 'FAMILIA') {
      const isFamilyMember = await prisma.studentFamilyRelation.findFirst({
        where: {
          studentId: result.studentId,
          familyUserId: req.user.id,
        },
      });
      if (!isFamilyMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'TestResult', id);

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create test result
router.post('/',
  requireClinicalStaff,
  [
    body('studentId').isString().withMessage('Student ID is required'),
    body('testName').isString().isLength({ min: 1 }).withMessage('Test name is required'),
    body('academicYear').isString().withMessage('Academic year is required'),
    body('executionDate').isISO8601().withMessage('Execution date is required'),
    body('rawScore').optional().isNumeric().withMessage('Raw score must be a number'),
    body('percentile').optional().isInt({ min: 0, max: 100 }).withMessage('Percentile must be between 0 and 100'),
    body('standardScore').optional().isNumeric().withMessage('Standard score must be a number'),
    body('interpretation').optional().isIn(['MUY_BAJO', 'BAJO', 'MEDIO_BAJO', 'MEDIO', 'MEDIO_ALTO', 'ALTO', 'MUY_ALTO']).withMessage('Invalid interpretation'),
    body('detailedResults').optional().isObject().withMessage('Detailed results must be an object'),
    body('observations').optional().isString().withMessage('Observations must be a string'),
    body('incidents').optional().isString().withMessage('Incidents must be a string'),
    body('examinerId').optional().isString().withMessage('Examiner ID must be a string'),
    body('assignmentId').optional().isString().withMessage('Assignment ID must be a string'),
    body('originalPdfUrl').optional().isString().withMessage('Original PDF URL must be a string'),
    body('importSource').optional().isIn(['MANUAL', 'PDF_IMPORT', 'BULK_IMPORT', 'API']).withMessage('Invalid import source'),
    body('testVersion').optional().isString().withMessage('Test version must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const resultData = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: resultData.studentId },
      include: { center: true },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Check permissions for student's center
    if (req.user.userType === 'ORIENTADOR' && student.centerId !== req.user.centerId) {
      throw validationErrorHandler('Cannot create test result for student in different center');
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(student.centerId)) {
        throw validationErrorHandler('Cannot create test result for student in unauthorized center');
      }
    }

    // Generate result ID and test code
    const lastResult = await prisma.testResult.findFirst({
      orderBy: { resultId: 'desc' },
      select: { resultId: true },
    });

    let nextNumber = 1;
    if (lastResult) {
      const lastNumber = parseInt(lastResult.resultId.replace('RES_', ''));
      nextNumber = lastNumber + 1;
    }

    const resultId = `RES_${nextNumber.toString().padStart(3, '0')}`;
    const testCode = `${resultData.testName.replace(/\s+/g, '_').toUpperCase()}_${resultId}`;

    // Create test result
    const result = await prisma.testResult.create({
      data: {
        ...resultData,
        resultId,
        testCode,
        examinerId: resultData.examinerId || req.user.id,
        importSource: resultData.importSource || 'MANUAL',
      },
      select: {
        id: true,
        resultId: true,
        assignmentId: true,
        studentId: true,
        testName: true,
        testCode: true,
        academicYear: true,
        originalPdfUrl: true,
        examinerId: true,
        executionDate: true,
        rawScore: true,
        percentile: true,
        standardScore: true,
        interpretation: true,
        detailedResults: true,
        observations: true,
        incidents: true,
        validated: true,
        validatedBy: true,
        validationDate: true,
        importSource: true,
        testVersion: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            etapa: true,
            course: true,
            classGroup: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        examiner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestResult', result.id, {
      action: 'CREATE',
      resultData: {
        resultId: result.resultId,
        testName: result.testName,
        studentId: result.studentId,
      },
    });

    logger.info('Test result created:', {
      resultId: result.id,
      resultCode: result.resultId,
      testName: result.testName,
      studentId: result.studentId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update test result
router.put('/:id',
  [
    param('id').isString().withMessage('Test result ID is required'),
    body('testName').optional().isString().isLength({ min: 1 }).withMessage('Test name must be a non-empty string'),
    body('academicYear').optional().isString().withMessage('Academic year must be a string'),
    body('executionDate').optional().isISO8601().withMessage('Execution date must be a valid date'),
    body('rawScore').optional().isNumeric().withMessage('Raw score must be a number'),
    body('percentile').optional().isInt({ min: 0, max: 100 }).withMessage('Percentile must be between 0 and 100'),
    body('standardScore').optional().isNumeric().withMessage('Standard score must be a number'),
    body('interpretation').optional().isIn(['MUY_BAJO', 'BAJO', 'MEDIO_BAJO', 'MEDIO', 'MEDIO_ALTO', 'ALTO', 'MUY_ALTO']).withMessage('Invalid interpretation'),
    body('detailedResults').optional().isObject().withMessage('Detailed results must be an object'),
    body('observations').optional().isString().withMessage('Observations must be a string'),
    body('incidents').optional().isString().withMessage('Incidents must be a string'),
    body('examinerId').optional().isString().withMessage('Examiner ID must be a string'),
    body('originalPdfUrl').optional().isString().withMessage('Original PDF URL must be a string'),
    body('testVersion').optional().isString().withMessage('Test version must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if result exists
    const existingResult = await prisma.testResult.findUnique({
      where: { id },
      include: { student: { include: { center: true } } },
    });

    if (!existingResult) {
      throw notFoundErrorHandler('Test result');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingResult.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this test result',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingResult.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update result
    const result = await prisma.testResult.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        resultId: true,
        assignmentId: true,
        studentId: true,
        testName: true,
        testCode: true,
        academicYear: true,
        originalPdfUrl: true,
        examinerId: true,
        executionDate: true,
        rawScore: true,
        percentile: true,
        standardScore: true,
        interpretation: true,
        detailedResults: true,
        observations: true,
        incidents: true,
        validated: true,
        validatedBy: true,
        validationDate: true,
        importSource: true,
        testVersion: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            etapa: true,
            course: true,
            classGroup: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        examiner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestResult', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Test result updated:', {
      resultId: result.id,
      resultCode: result.resultId,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Validate test result (Clinical staff only)
router.post('/:id/validate',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('Test result ID is required'),
    body('validated').isBoolean().withMessage('Validated must be a boolean'),
    body('observations').optional().isString().withMessage('Observations must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { validated, observations } = req.body;

    // Check if result exists
    const existingResult = await prisma.testResult.findUnique({
      where: { id },
      include: { student: { include: { center: true } } },
    });

    if (!existingResult) {
      throw notFoundErrorHandler('Test result');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingResult.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to validate this test result',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingResult.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to validate this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update validation
    const result = await prisma.testResult.update({
      where: { id },
      data: {
        validated,
        validatedBy: req.user.id,
        validationDate: new Date(),
        observations: observations || existingResult.observations,
      },
      select: {
        id: true,
        resultId: true,
        testName: true,
        validated: true,
        validatedBy: true,
        validationDate: true,
        observations: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestResult', id, {
      action: 'VALIDATE',
      validated,
      validatedBy: req.user.id,
    });

    logger.info('Test result validation updated:', {
      resultId: result.id,
      resultCode: result.resultId,
      validated,
      validatedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete test result (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Test result ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if result exists
    const result = await prisma.testResult.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!result) {
      throw notFoundErrorHandler('Test result');
    }

    // Delete related records first
    await Promise.all([
      prisma.stap2GoResult.deleteMany({ where: { testResultId: id } }),
      prisma.ravens2Result.deleteMany({ where: { testResultId: id } }),
    ]);

    // Delete test result
    await prisma.testResult.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'TestResult', id, {
      action: 'DELETE',
      resultData: {
        resultId: result.resultId,
        testName: result.testName,
        studentId: result.studentId,
      },
    });

    logger.info('Test result deleted:', {
      resultId: id,
      resultCode: result.resultId,
      testName: result.testName,
      studentId: result.studentId,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: { message: 'Test result deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get student test history
router.get('/student/:studentId/history',
  [
    param('studentId').isString().withMessage('Student ID is required'),
    query('testName').optional().isString().withMessage('Test name must be a string'),
    query('academicYear').optional().isString().withMessage('Academic year must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { studentId } = req.params;
    const { testName, academicYear } = req.query;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { center: true },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && student.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this student',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(student.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this student',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.user.userType === 'FAMILIA') {
      const isFamilyMember = await prisma.studentFamilyRelation.findFirst({
        where: {
          studentId: studentId,
          familyUserId: req.user.id,
        },
      });
      if (!isFamilyMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this student',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Build where clause
    const where: any = { studentId };

    if (testName) {
      where.testName = { contains: testName, mode: 'insensitive' };
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    // Get test results
    const results = await prisma.testResult.findMany({
      where,
      orderBy: { executionDate: 'desc' },
      select: {
        id: true,
        resultId: true,
        testName: true,
        testCode: true,
        academicYear: true,
        executionDate: true,
        rawScore: true,
        percentile: true,
        standardScore: true,
        interpretation: true,
        validated: true,
        validatedBy: true,
        validationDate: true,
        importSource: true,
        createdAt: true,
        examiner: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Group results by test name
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.testName]) {
        acc[result.testName] = [];
      }
      acc[result.testName]!.push(result);
      return acc;
    }, {} as Record<string, any[]>);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'TestResult', undefined, {
      action: 'STUDENT_HISTORY',
      studentId,
      filters: { testName, academicYear },
    });

    return res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          studentId: student.studentId,
          fullName: student.fullName,
          etapa: student.etapa,
          course: student.course,
          classGroup: student.classGroup,
        },
        results: groupedResults,
        totalResults: results.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
