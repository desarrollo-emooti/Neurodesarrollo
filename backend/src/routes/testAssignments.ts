import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinicalStaff } from './auth';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';
import QRCode from 'qrcode';

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

// Get all test assignments
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
    query('testTitle').optional().isString().withMessage('Test title must be a string'),
    query('testStatus').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid test status'),
    query('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
    query('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    query('academicYear').optional().isString().withMessage('Academic year must be a string'),
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
      testTitle,
      testStatus,
      consentGiven,
      priority,
      academicYear,
      sortBy = 'assignedDate',
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
      // Families can only see assignments for their children
      const familyRelations = await prisma.studentFamilyRelation.findMany({
        where: { familyUserId: req.user.id },
        select: { studentId: true },
      });
      where.studentId = { in: familyRelations.map(rel => rel.studentId) };
    }

    // Apply filters
    if (search) {
      where.OR = [
        { testTitle: { contains: search, mode: 'insensitive' } },
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

    if (testTitle) {
      where.testTitle = { contains: testTitle, mode: 'insensitive' };
    }

    if (testStatus) {
      where.testStatus = testStatus;
    }

    if (consentGiven) {
      where.consentGiven = consentGiven;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get test assignments with pagination
    const [assignments, total] = await Promise.all([
      prisma.testAssignment.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          studentId: true,
          testTitle: true,
          testLink: true,
          testDate: true,
          completionDate: true,
          assignedBy: true,
          assignedDate: true,
          testStatus: true,
          consentGiven: true,
          priority: true,
          notes: true,
          active: true,
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
          testResults: {
            select: {
              id: true,
              resultId: true,
              testName: true,
              executionDate: true,
              rawScore: true,
              percentile: true,
              standardScore: true,
              interpretation: true,
              validated: true,
            },
          },
        },
      }),
      prisma.testAssignment.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'TestAssignment', undefined, {
      filters: { search, studentId, centerId, etapa, course, classGroup, testTitle, testStatus, consentGiven, priority },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: assignments,
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

// Get test assignment by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Test assignment ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const assignment = await prisma.testAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        testTitle: true,
        testLink: true,
        testDate: true,
        completionDate: true,
        assignedBy: true,
        assignedDate: true,
        testStatus: true,
        consentGiven: true,
        priority: true,
        notes: true,
        active: true,
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
        testResults: {
          select: {
            id: true,
            resultId: true,
            testName: true,
            executionDate: true,
            rawScore: true,
            percentile: true,
            standardScore: true,
            interpretation: true,
            validated: true,
            validatedBy: true,
            validationDate: true,
            observations: true,
            incidents: true,
          },
        },
      },
    });

    if (!assignment) {
      throw notFoundErrorHandler('Test assignment');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && assignment.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this test assignment',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(assignment.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test assignment',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.user.userType === 'FAMILIA') {
      const isFamilyMember = await prisma.studentFamilyRelation.findFirst({
        where: {
          studentId: assignment.studentId,
          familyUserId: req.user.id,
        },
      });
      if (!isFamilyMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test assignment',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'TestAssignment', id);

    return res.json({
      success: true,
      data: assignment,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create test assignment
router.post('/',
  requireClinicalStaff,
  [
    body('studentId').isString().withMessage('Student ID is required'),
    body('testTitle').isString().isLength({ min: 1 }).withMessage('Test title is required'),
    body('testDate').optional().isISO8601().withMessage('Test date must be a valid date'),
    body('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const assignmentData = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: assignmentData.studentId },
      include: { center: true },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Check permissions for student's center
    if (req.user.userType === 'ORIENTADOR' && student.centerId !== req.user.centerId) {
      throw validationErrorHandler('Cannot assign test to student in different center');
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(student.centerId)) {
        throw validationErrorHandler('Cannot assign test to student in unauthorized center');
      }
    }

    // Generate test link and QR code
    const testLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/public-test?student_id=${student.studentId}&test_title=${encodeURIComponent(assignmentData.testTitle)}&assignment_id=${Date.now()}`;
    
    let qrCodeUrl = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(testLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      logger.warn('Failed to generate QR code:', error);
    }

    // Create test assignment
    const assignment = await prisma.testAssignment.create({
      data: {
        ...assignmentData,
        testLink,
        assignedBy: req.user.id,
        assignedDate: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        testTitle: true,
        testLink: true,
        testDate: true,
        completionDate: true,
        assignedBy: true,
        assignedDate: true,
        testStatus: true,
        consentGiven: true,
        priority: true,
        notes: true,
        active: true,
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
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestAssignment', assignment.id, {
      action: 'CREATE',
      assignmentData: {
        studentId: assignment.studentId,
        testTitle: assignment.testTitle,
        testLink: assignment.testLink,
      },
    });

    logger.info('Test assignment created:', {
      assignmentId: assignment.id,
      studentId: assignment.studentId,
      testTitle: assignment.testTitle,
      assignedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: {
        ...assignment,
        qrCodeUrl,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Update test assignment
router.put('/:id',
  [
    param('id').isString().withMessage('Test assignment ID is required'),
    body('testTitle').optional().isString().isLength({ min: 1 }).withMessage('Test title must be a non-empty string'),
    body('testDate').optional().isISO8601().withMessage('Test date must be a valid date'),
    body('completionDate').optional().isISO8601().withMessage('Completion date must be a valid date'),
    body('testStatus').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid test status'),
    body('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
    body('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if assignment exists
    const existingAssignment = await prisma.testAssignment.findUnique({
      where: { id },
      include: { student: { include: { center: true } } },
    });

    if (!existingAssignment) {
      throw notFoundErrorHandler('Test assignment');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingAssignment.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this test assignment',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingAssignment.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this test assignment',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update assignment
    const assignment = await prisma.testAssignment.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        testTitle: true,
        testLink: true,
        testDate: true,
        completionDate: true,
        assignedBy: true,
        assignedDate: true,
        testStatus: true,
        consentGiven: true,
        priority: true,
        notes: true,
        active: true,
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
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestAssignment', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Test assignment updated:', {
      assignmentId: assignment.id,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: assignment,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete test assignment (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Test assignment ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if assignment exists
    const assignment = await prisma.testAssignment.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!assignment) {
      throw notFoundErrorHandler('Test assignment');
    }

    // Soft delete (set active to false)
    await prisma.testAssignment.update({
      where: { id },
      data: { active: false },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'TestAssignment', id, {
      action: 'DELETE',
      assignmentData: {
        studentId: assignment.studentId,
        testTitle: assignment.testTitle,
      },
    });

    logger.info('Test assignment deleted:', {
      assignmentId: id,
      studentId: assignment.studentId,
      testTitle: assignment.testTitle,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: { message: 'Test assignment deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Generate QR code for test assignment
router.get('/:id/qr',
  [
    param('id').isString().withMessage('Test assignment ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const assignment = await prisma.testAssignment.findUnique({
      where: { id },
      include: { student: { include: { center: true } } },
    });

    if (!assignment) {
      throw notFoundErrorHandler('Test assignment');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && assignment.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this test assignment',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(assignment.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test assignment',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (!assignment.testLink) {
      throw validationErrorHandler('Test link not available');
    }

    try {
      const qrCodeUrl = await QRCode.toDataURL(assignment.testLink, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return res.json({
        success: true,
        data: {
          qrCodeUrl,
          testLink: assignment.testLink,
          assignment: {
            id: assignment.id,
            testTitle: assignment.testTitle,
            student: assignment.student,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw validationErrorHandler('Failed to generate QR code');
    }
  })
);

// Bulk operations (Admin only)
router.post('/bulk',
  requireAdmin,
  [
    body('action').isIn(['update', 'delete', 'export']).withMessage('Invalid bulk action'),
    body('assignmentIds').isArray().isLength({ min: 1 }).withMessage('Assignment IDs array is required'),
    body('data').optional().isObject().withMessage('Data must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { action, assignmentIds, data } = req.body;

    switch (action) {
      case 'update':
        if (!data) {
          throw validationErrorHandler('Data is required for bulk update');
        }

        const updatedAssignments = await prisma.testAssignment.updateMany({
          where: { id: { in: assignmentIds } },
          data,
        });

        // Set audit data
        setAuditData(req, AuditAction.DATA_MODIFICATION, 'TestAssignment', undefined, {
          action: 'BULK_UPDATE',
          assignmentIds,
          updatedFields: Object.keys(data),
          affectedCount: updatedAssignments.count,
        });

        return res.json({
          success: true,
          data: {
            message: `${updatedAssignments.count} test assignments updated successfully`,
            affectedCount: updatedAssignments.count,
          },
          timestamp: new Date().toISOString(),
        });

      case 'delete':
        const deletedAssignments = await prisma.testAssignment.updateMany({
          where: { id: { in: assignmentIds } },
          data: { active: false },
        });

        // Set audit data
        setAuditData(req, AuditAction.DATA_DELETION, 'TestAssignment', undefined, {
          action: 'BULK_DELETE',
          assignmentIds,
          affectedCount: deletedAssignments.count,
        });

        return res.json({
          success: true,
          data: {
            message: `${deletedAssignments.count} test assignments deleted successfully`,
            affectedCount: deletedAssignments.count,
          },
          timestamp: new Date().toISOString(),
        });

      case 'export':
        const assignments = await prisma.testAssignment.findMany({
          where: { id: { in: assignmentIds } },
          select: {
            id: true,
            studentId: true,
            testTitle: true,
            testLink: true,
            testDate: true,
            completionDate: true,
            assignedBy: true,
            assignedDate: true,
            testStatus: true,
            consentGiven: true,
            priority: true,
            notes: true,
            active: true,
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
          },
        });

        // Set audit data
        setAuditData(req, AuditAction.DATA_EXPORT, 'TestAssignment', undefined, {
          action: 'BULK_EXPORT',
          assignmentIds,
          exportedCount: assignments.length,
        });

        return res.json({
          success: true,
          data: assignments,
          timestamp: new Date().toISOString(),
        });

      default:
        throw validationErrorHandler('Invalid bulk action');
    }
  })
);

export default router;
