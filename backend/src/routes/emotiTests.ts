import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinicalStaff } from './auth';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction, EmotiTestType } from '@prisma/client';
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

// Get all EmotiTests
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('testType').optional().isIn(['BATELLE_SCR', 'CIRCUITO_LOGOPEDIA', 'CIRCUITO_SENSORIOMOTOR', 'E2P']).withMessage('Invalid test type'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('minAge').optional().isInt({ min: 0 }).withMessage('minAge must be a non-negative integer'),
    query('maxAge').optional().isInt({ min: 0 }).withMessage('maxAge must be a non-negative integer'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      testType,
      isActive,
      minAge,
      maxAge,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (testType) {
      where.testType = testType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (minAge !== undefined) {
      where.ageRangeMin = { gte: parseInt(minAge) };
    }

    if (maxAge !== undefined) {
      where.ageRangeMax = { lte: parseInt(maxAge) };
    }

    // Get EmotiTests with pagination
    const [tests, total] = await Promise.all([
      prisma.emotiTest.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          category: true,
          testType: true,
          ageRangeMin: true,
          ageRangeMax: true,
          duration: true,
          version: true,
          isActive: true,
          requiresTablet: true,
          requiresInternet: true,
          createdBy: true,
          lastModified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              testAssignments: true,
            },
          },
        },
      }),
      prisma.emotiTest.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', undefined, {
      filters: { search, category, testType, isActive, minAge, maxAge },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: tests,
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

// Get EmotiTest by ID
router.get('/:id',
  [
    param('id').isString().withMessage('EmotiTest ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const test = await prisma.emotiTest.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        testType: true,
        ageRangeMin: true,
        ageRangeMax: true,
        duration: true,
        configuration: true,
        htmlContent: true,
        version: true,
        isActive: true,
        requiresTablet: true,
        requiresInternet: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
        testAssignments: {
          select: {
            id: true,
            testTitle: true,
            testDate: true,
            testStatus: true,
            student: {
              select: {
                id: true,
                studentId: true,
                fullName: true,
                etapa: true,
                course: true,
              },
            },
          },
          orderBy: {
            testDate: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            testAssignments: true,
          },
        },
      },
    });

    if (!test) {
      throw notFoundErrorHandler('EmotiTest');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', id);

    return res.json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create EmotiTest (Admin and Clinical staff only)
router.post('/',
  requireClinicalStaff,
  [
    body('code').isString().isLength({ min: 1 }).withMessage('Code is required'),
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    body('category').isString().isLength({ min: 1 }).withMessage('Category is required'),
    body('testType').isIn(['BATELLE_SCR', 'CIRCUITO_LOGOPEDIA', 'CIRCUITO_SENSORIOMOTOR', 'E2P']).withMessage('Valid test type is required'),
    body('ageRangeMin').isInt({ min: 0 }).withMessage('Age range min must be a non-negative integer'),
    body('ageRangeMax').isInt({ min: 0 }).withMessage('Age range max must be a non-negative integer'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('configuration').isObject().withMessage('Configuration must be an object'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('htmlContent').optional().isString().withMessage('HTML content must be a string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('requiresTablet').optional().isBoolean().withMessage('requiresTablet must be a boolean'),
    body('requiresInternet').optional().isBoolean().withMessage('requiresInternet must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const testData = req.body;

    // Validate age range
    if (testData.ageRangeMin > testData.ageRangeMax) {
      throw validationErrorHandler('Age range min cannot be greater than age range max', {
        field: 'ageRangeMin',
        message: 'Age range min cannot be greater than age range max',
      });
    }

    // Check if code already exists
    const existingTest = await prisma.emotiTest.findUnique({
      where: { code: testData.code },
    });

    if (existingTest) {
      throw validationErrorHandler('EmotiTest code already exists', {
        field: 'code',
        message: 'EmotiTest code already exists',
      });
    }

    // Create EmotiTest
    const test = await prisma.emotiTest.create({
      data: {
        ...testData,
        createdBy: req.user.id,
        lastModified: new Date(),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        testType: true,
        ageRangeMin: true,
        ageRangeMax: true,
        duration: true,
        configuration: true,
        htmlContent: true,
        version: true,
        isActive: true,
        requiresTablet: true,
        requiresInternet: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', test.id, {
      action: 'CREATE',
      testData: {
        code: test.code,
        name: test.name,
        testType: test.testType,
      },
    });

    logger.info('EmotiTest created:', {
      testId: test.id,
      code: test.code,
      name: test.name,
      testType: test.testType,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update EmotiTest
router.put('/:id',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('EmotiTest ID is required'),
    body('code').optional().isString().isLength({ min: 1 }).withMessage('Code must be a non-empty string'),
    body('name').optional().isString().isLength({ min: 1 }).withMessage('Name must be a non-empty string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('category').optional().isString().isLength({ min: 1 }).withMessage('Category must be a non-empty string'),
    body('testType').optional().isIn(['BATELLE_SCR', 'CIRCUITO_LOGOPEDIA', 'CIRCUITO_SENSORIOMOTOR', 'E2P']).withMessage('Invalid test type'),
    body('ageRangeMin').optional().isInt({ min: 0 }).withMessage('Age range min must be a non-negative integer'),
    body('ageRangeMax').optional().isInt({ min: 0 }).withMessage('Age range max must be a non-negative integer'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('configuration').optional().isObject().withMessage('Configuration must be an object'),
    body('htmlContent').optional().isString().withMessage('HTML content must be a string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    body('requiresTablet').optional().isBoolean().withMessage('requiresTablet must be a boolean'),
    body('requiresInternet').optional().isBoolean().withMessage('requiresInternet must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if test exists
    const existingTest = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!existingTest) {
      throw notFoundErrorHandler('EmotiTest');
    }

    // Validate age range if both are being updated
    if (updateData.ageRangeMin !== undefined && updateData.ageRangeMax !== undefined) {
      if (updateData.ageRangeMin > updateData.ageRangeMax) {
        throw validationErrorHandler('Age range min cannot be greater than age range max', {
          field: 'ageRangeMin',
          message: 'Age range min cannot be greater than age range max',
        });
      }
    }

    // Check if code already exists (if being updated)
    if (updateData.code && updateData.code !== existingTest.code) {
      const existingCode = await prisma.emotiTest.findUnique({
        where: { code: updateData.code },
      });

      if (existingCode) {
        throw validationErrorHandler('EmotiTest code already exists', {
          field: 'code',
          message: 'EmotiTest code already exists',
        });
      }
    }

    // Update EmotiTest
    const test = await prisma.emotiTest.update({
      where: { id },
      data: {
        ...updateData,
        lastModified: new Date(),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        testType: true,
        ageRangeMin: true,
        ageRangeMax: true,
        duration: true,
        configuration: true,
        htmlContent: true,
        version: true,
        isActive: true,
        requiresTablet: true,
        requiresInternet: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('EmotiTest updated:', {
      testId: test.id,
      code: test.code,
      name: test.name,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete EmotiTest (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('EmotiTest ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            testAssignments: true,
          },
        },
      },
    });

    if (!test) {
      throw notFoundErrorHandler('EmotiTest');
    }

    // Check if test has associated assignments
    if (test._count.testAssignments > 0) {
      // Soft delete (set isActive to false)
      await prisma.emotiTest.update({
        where: { id },
        data: { isActive: false },
      });

      // Set audit data
      setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', id, {
        action: 'SOFT_DELETE',
        testCode: test.code,
        testName: test.name,
        reason: 'Has associated test assignments',
      });

      logger.info('EmotiTest soft deleted (has assignments):', {
        testId: id,
        code: test.code,
        name: test.name,
        assignmentsCount: test._count.testAssignments,
        deletedBy: req.user.id,
      });

      return res.json({
        success: true,
        data: {
          message: 'EmotiTest deactivated successfully (has associated test assignments)',
          assignmentsCount: test._count.testAssignments,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Hard delete (no assignments)
      await prisma.emotiTest.delete({
        where: { id },
      });

      // Set audit data
      setAuditData(req, AuditAction.DATA_DELETION, 'EmotiTest', id, {
        action: 'DELETE',
        testCode: test.code,
        testName: test.name,
      });

      logger.info('EmotiTest deleted:', {
        testId: id,
        code: test.code,
        name: test.name,
        deletedBy: req.user.id,
      });

      return res.json({
        success: true,
        data: { message: 'EmotiTest deleted successfully' },
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Get EmotiTest statistics
router.get('/:id/statistics',
  [
    param('id').isString().withMessage('EmotiTest ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!test) {
      throw notFoundErrorHandler('EmotiTest');
    }

    // Get statistics
    const [
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      inProgressAssignments,
      assignmentsByStatus,
      recentAssignments,
    ] = await Promise.all([
      prisma.testAssignment.count({ where: { emotiTestId: id } }),
      prisma.testAssignment.count({ where: { emotiTestId: id, testStatus: 'SI' } }),
      prisma.testAssignment.count({ where: { emotiTestId: id, testStatus: 'PENDIENTE' } }),
      prisma.testAssignment.count({ where: { emotiTestId: id, testStatus: 'NO' } }),
      prisma.testAssignment.groupBy({
        by: ['testStatus'],
        where: { emotiTestId: id },
        _count: { testStatus: true },
      }),
      prisma.testAssignment.findMany({
        where: { emotiTestId: id },
        orderBy: { assignedDate: 'desc' },
        take: 10,
        select: {
          id: true,
          testTitle: true,
          testDate: true,
          testStatus: true,
          assignedDate: true,
          student: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
              etapa: true,
              course: true,
            },
          },
        },
      }),
    ]);

    const statistics = {
      assignments: {
        total: totalAssignments,
        completed: completedAssignments,
        pending: pendingAssignments,
        inProgress: inProgressAssignments,
        byStatus: assignmentsByStatus,
        recent: recentAssignments,
      },
      test: {
        code: test.code,
        name: test.name,
        category: test.category,
        testType: test.testType,
        ageRange: `${test.ageRangeMin}-${test.ageRangeMax}`,
        duration: test.duration,
      },
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', id, {
      action: 'STATISTICS',
    });

    return res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get EmotiTests by age (helper endpoint for assignments)
router.get('/by-age/:age',
  [
    param('age').isInt({ min: 0 }).withMessage('Age must be a non-negative integer'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const age = parseInt(req.params.age);

    const tests = await prisma.emotiTest.findMany({
      where: {
        isActive: true,
        ageRangeMin: { lte: age },
        ageRangeMax: { gte: age },
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        testType: true,
        ageRangeMin: true,
        ageRangeMax: true,
        duration: true,
        requiresTablet: true,
        requiresInternet: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', undefined, {
      action: 'GET_BY_AGE',
      age,
      resultsCount: tests.length,
    });

    return res.json({
      success: true,
      data: tests,
      meta: {
        age,
        total: tests.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
