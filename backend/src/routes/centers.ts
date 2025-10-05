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

// Get all centers
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('type').optional().isIn(['PUBLICO', 'CONCERTADO', 'PRIVADO']).withMessage('Invalid center type'),
    query('province').optional().isString().withMessage('Province must be a string'),
    query('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      province,
      autonomousCommunity,
      active,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on user permissions
    const where: any = {};

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.id = req.user.centerId;
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.id = { in: req.user.centerIds };
    }

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { responsable: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (province) {
      where.province = province;
    }

    if (autonomousCommunity) {
      where.autonomousCommunity = autonomousCommunity;
    }

    if (active !== undefined) {
      where.active = active;
    }

    // Get centers with pagination
    const [centers, total] = await Promise.all([
      prisma.center.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          code: true,
          phone: true,
          email: true,
          responsable: true,
          type: true,
          totalStudents: true,
          address: true,
          country: true,
          autonomousCommunity: true,
          province: true,
          city: true,
          postalCode: true,
          contractDocumentUrl: true,
          additionalDocuments: true,
          observations: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              students: true,
              users: true,
            },
          },
        },
      }),
      prisma.center.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Center', undefined, {
      filters: { search, type, province, autonomousCommunity, active },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: centers,
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

// Get center by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Center ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const center = await prisma.center.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        email: true,
        responsable: true,
        type: true,
        totalStudents: true,
        address: true,
        country: true,
        autonomousCommunity: true,
        province: true,
        city: true,
        postalCode: true,
        contractDocumentUrl: true,
        additionalDocuments: true,
        observations: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            userType: true,
            status: true,
            active: true,
          },
        },
        students: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            etapa: true,
            course: true,
            classGroup: true,
            active: true,
          },
        },
        agendaEvents: {
          select: {
            id: true,
            title: true,
            eventType: true,
            startDate: true,
            endDate: true,
            approvalStatus: true,
          },
        },
        devices: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            usageStatus: true,
          },
        },
      },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this center',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this center',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Center', id);

    return res.json({
      success: true,
      data: center,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create center (Admin only)
router.post('/',
  requireAdmin,
  [
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    body('code').isString().isLength({ min: 1 }).withMessage('Code is required'),
    body('type').isIn(['PUBLICO', 'CONCERTADO', 'PRIVADO']).withMessage('Valid center type is required'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('responsable').optional().isString().withMessage('Responsable must be a string'),
    body('totalStudents').optional().isInt({ min: 0 }).withMessage('Total students must be a non-negative integer'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('contractDocumentUrl').optional().isString().withMessage('Contract document URL must be a string'),
    body('additionalDocuments').optional().isArray().withMessage('Additional documents must be an array'),
    body('observations').optional().isString().withMessage('Observations must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const centerData = req.body;

    // Check if code already exists
    const existingCenter = await prisma.center.findUnique({
      where: { code: centerData.code },
    });

    if (existingCenter) {
      throw validationErrorHandler('Center code already exists', {
        field: 'code',
        message: 'Center code already exists',
      });
    }

    // Create center
    const center = await prisma.center.create({
      data: {
        ...centerData,
        createdBy: req.user.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        email: true,
        responsable: true,
        type: true,
        totalStudents: true,
        address: true,
        country: true,
        autonomousCommunity: true,
        province: true,
        city: true,
        postalCode: true,
        contractDocumentUrl: true,
        additionalDocuments: true,
        observations: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Center', center.id, {
      action: 'CREATE',
      centerData: {
        name: center.name,
        code: center.code,
        type: center.type,
      },
    });

    logger.info('Center created:', {
      centerId: center.id,
      name: center.name,
      code: center.code,
      type: center.type,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: center,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update center
router.put('/:id',
  [
    param('id').isString().withMessage('Center ID is required'),
    body('name').optional().isString().isLength({ min: 1 }).withMessage('Name must be a non-empty string'),
    body('code').optional().isString().isLength({ min: 1 }).withMessage('Code must be a non-empty string'),
    body('type').optional().isIn(['PUBLICO', 'CONCERTADO', 'PRIVADO']).withMessage('Invalid center type'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('responsable').optional().isString().withMessage('Responsable must be a string'),
    body('totalStudents').optional().isInt({ min: 0 }).withMessage('Total students must be a non-negative integer'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('contractDocumentUrl').optional().isString().withMessage('Contract document URL must be a string'),
    body('additionalDocuments').optional().isArray().withMessage('Additional documents must be an array'),
    body('observations').optional().isString().withMessage('Observations must be a string'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    let updateData = req.body;

    // Check if center exists
    const existingCenter = await prisma.center.findUnique({
      where: { id },
    });

    if (!existingCenter) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingCenter.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this center',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingCenter.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this center',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Non-admin users can only update certain fields
    if (req.user.userType !== 'ADMINISTRADOR') {
      const allowedFields = [
        'phone', 'email', 'responsable', 'address', 'country',
        'autonomousCommunity', 'province', 'city', 'postalCode',
        'observations',
      ];
      
      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      updateData = filteredData;
    }

    // Check if code already exists (if being updated)
    if (updateData.code && updateData.code !== existingCenter.code) {
      const existingCode = await prisma.center.findUnique({
        where: { code: updateData.code },
      });

      if (existingCode) {
        throw validationErrorHandler('Center code already exists', {
          field: 'code',
          message: 'Center code already exists',
        });
      }
    }

    // Update center
    const center = await prisma.center.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        email: true,
        responsable: true,
        type: true,
        totalStudents: true,
        address: true,
        country: true,
        autonomousCommunity: true,
        province: true,
        city: true,
        postalCode: true,
        contractDocumentUrl: true,
        additionalDocuments: true,
        observations: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Center', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Center updated:', {
      centerId: center.id,
      name: center.name,
      code: center.code,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: center,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete center (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Center ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            users: true,
          },
        },
      },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check if center has associated students or users
    if (center._count.students > 0 || center._count.users > 0) {
      throw validationErrorHandler('Cannot delete center with associated students or users', {
        students: center._count.students,
        users: center._count.users,
      });
    }

    // Soft delete (set active to false)
    await prisma.center.update({
      where: { id },
      data: { active: false },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Center', id, {
      action: 'DELETE',
      centerName: center.name,
      centerCode: center.code,
    });

    logger.info('Center deleted:', {
      centerId: id,
      name: center.name,
      code: center.code,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: { message: 'Center deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get center statistics
router.get('/:id/statistics',
  [
    param('id').isString().withMessage('Center ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this center',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this center',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Get statistics
    const [
      totalStudents,
      activeStudents,
      totalUsers,
      activeUsers,
      totalTestResults,
      totalTestAssignments,
      studentsByEtapa,
      studentsByCourse,
      recentTestResults,
    ] = await Promise.all([
      prisma.student.count({ where: { centerId: id } }),
      prisma.student.count({ where: { centerId: id, active: true } }),
      prisma.user.count({ where: { centerId: id } }),
      prisma.user.count({ where: { centerId: id, active: true } }),
      prisma.testResult.count({
        where: {
          student: { centerId: id },
        },
      }),
      prisma.testAssignment.count({
        where: {
          student: { centerId: id },
        },
      }),
      prisma.student.groupBy({
        by: ['etapa'],
        where: { centerId: id, active: true },
        _count: { etapa: true },
      }),
      prisma.student.groupBy({
        by: ['course'],
        where: { centerId: id, active: true },
        _count: { course: true },
      }),
      prisma.testResult.findMany({
        where: {
          student: { centerId: id },
        },
        orderBy: { executionDate: 'desc' },
        take: 10,
        select: {
          id: true,
          testName: true,
          executionDate: true,
          student: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
            },
          },
        },
      }),
    ]);

    const statistics = {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
        byEtapa: studentsByEtapa,
        byCourse: studentsByCourse,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      tests: {
        totalResults: totalTestResults,
        totalAssignments: totalTestAssignments,
        recentResults: recentTestResults,
      },
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Center', id, {
      action: 'STATISTICS',
    });

    return res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
