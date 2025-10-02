import { Router } from 'express';
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

// Get all users (Admin only)
router.get('/',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('userType').optional().isIn(['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA']).withMessage('Invalid user type'),
    query('status').optional().isIn(['ACTIVE', 'PENDING_INVITATION', 'INVITATION_SENT', 'INACTIVE']).withMessage('Invalid status'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      userType,
      status,
      centerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (userType) {
      where.userType = userType;
    }

    if (status) {
      where.status = status;
    }

    if (centerId) {
      where.OR = [
        { centerId: centerId },
        { centerIds: { has: centerId } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          dni: true,
          userType: true,
          status: true,
          centerId: true,
          centerIds: true,
          specialty: true,
          licenseNumber: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          center: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'User', null, {
      filters: { search, userType, status, centerId },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: users,
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

// Get user by ID
router.get('/:id',
  [
    param('id').isString().withMessage('User ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if user can access this user's data
    if (req.user.userType !== 'ADMINISTRADOR' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this user',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        dni: true,
        birthDate: true,
        nationality: true,
        userType: true,
        status: true,
        address: true,
        country: true,
        autonomousCommunity: true,
        province: true,
        city: true,
        postalCode: true,
        centerId: true,
        centerIds: true,
        specialty: true,
        licenseNumber: true,
        allowedEtapas: true,
        allowedCourses: true,
        allowedGroups: true,
        paymentMethod: true,
        bankIban: true,
        bankName: true,
        stripeCustomerId: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw notFoundErrorHandler('User');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'User', id);

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create user (Admin only)
router.post('/',
  requireAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('fullName').isString().isLength({ min: 1 }).withMessage('Full name is required'),
    body('userType').isIn(['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA']).withMessage('Invalid user type'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('dni').optional().isString().withMessage('DNI must be a string'),
    body('birthDate').optional().isISO8601().withMessage('Birth date must be a valid date'),
    body('nationality').optional().isString().withMessage('Nationality must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('centerId').optional().isString().withMessage('Center ID must be a string'),
    body('centerIds').optional().isArray().withMessage('Center IDs must be an array'),
    body('specialty').optional().isString().withMessage('Specialty must be a string'),
    body('licenseNumber').optional().isString().withMessage('License number must be a string'),
    body('allowedEtapas').optional().isArray().withMessage('Allowed etapas must be an array'),
    body('allowedCourses').optional().isArray().withMessage('Allowed courses must be an array'),
    body('allowedGroups').optional().isArray().withMessage('Allowed groups must be an array'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const userData = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw validationErrorHandler('Email already exists', {
        field: 'email',
        message: 'Email already exists',
      });
    }

    // Check if DNI already exists (if provided)
    if (userData.dni) {
      const existingDni = await prisma.user.findUnique({
        where: { dni: userData.dni },
      });

      if (existingDni) {
        throw validationErrorHandler('DNI already exists', {
          field: 'dni',
          message: 'DNI already exists',
        });
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        ...userData,
        status: 'PENDING_INVITATION',
        createdBy: req.user.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        dni: true,
        userType: true,
        status: true,
        centerId: true,
        centerIds: true,
        specialty: true,
        licenseNumber: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.USER_MANAGEMENT, 'User', user.id, {
      action: 'CREATE',
      userData: {
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
      },
    });

    logger.info('User created:', {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update user
router.put('/:id',
  [
    param('id').isString().withMessage('User ID is required'),
    body('fullName').optional().isString().isLength({ min: 1 }).withMessage('Full name must be a non-empty string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('dni').optional().isString().withMessage('DNI must be a string'),
    body('birthDate').optional().isISO8601().withMessage('Birth date must be a valid date'),
    body('nationality').optional().isString().withMessage('Nationality must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('centerId').optional().isString().withMessage('Center ID must be a string'),
    body('centerIds').optional().isArray().withMessage('Center IDs must be an array'),
    body('specialty').optional().isString().withMessage('Specialty must be a string'),
    body('licenseNumber').optional().isString().withMessage('License number must be a string'),
    body('allowedEtapas').optional().isArray().withMessage('Allowed etapas must be an array'),
    body('allowedCourses').optional().isArray().withMessage('Allowed courses must be an array'),
    body('allowedGroups').optional().isArray().withMessage('Allowed groups must be an array'),
    body('status').optional().isIn(['ACTIVE', 'PENDING_INVITATION', 'INVITATION_SENT', 'INACTIVE']).withMessage('Invalid status'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user can update this user
    if (req.user.userType !== 'ADMINISTRADOR' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this user',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw notFoundErrorHandler('User');
    }

    // Non-admin users can only update certain fields
    if (req.user.userType !== 'ADMINISTRADOR') {
      const allowedFields = [
        'fullName', 'phone', 'address', 'country', 'autonomousCommunity',
        'province', 'city', 'postalCode', 'specialty', 'licenseNumber',
      ];
      
      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }
      updateData = filteredData;
    }

    // Check if DNI already exists (if being updated)
    if (updateData.dni && updateData.dni !== existingUser.dni) {
      const existingDni = await prisma.user.findUnique({
        where: { dni: updateData.dni },
      });

      if (existingDni) {
        throw validationErrorHandler('DNI already exists', {
          field: 'dni',
          message: 'DNI already exists',
        });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        dni: true,
        userType: true,
        status: true,
        centerId: true,
        centerIds: true,
        specialty: true,
        licenseNumber: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.USER_MANAGEMENT, 'User', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('User updated:', {
      userId: user.id,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete user (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('User ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw notFoundErrorHandler('User');
    }

    // Prevent deleting own account
    if (id === req.user.id) {
      throw validationErrorHandler('Cannot delete your own account');
    }

    // Soft delete (set active to false)
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });

    // Set audit data
    setAuditData(req, AuditAction.USER_MANAGEMENT, 'User', id, {
      action: 'DELETE',
      userEmail: user.email,
    });

    logger.info('User deleted:', {
      userId: id,
      userEmail: user.email,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Bulk operations (Admin only)
router.post('/bulk',
  requireAdmin,
  [
    body('action').isIn(['update', 'delete', 'export']).withMessage('Invalid bulk action'),
    body('userIds').isArray().isLength({ min: 1 }).withMessage('User IDs array is required'),
    body('data').optional().isObject().withMessage('Data must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { action, userIds, data } = req.body;

    switch (action) {
      case 'update':
        if (!data) {
          throw validationErrorHandler('Data is required for bulk update');
        }

        const updatedUsers = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data,
        });

        // Set audit data
        setAuditData(req, AuditAction.USER_MANAGEMENT, 'User', null, {
          action: 'BULK_UPDATE',
          userIds,
          updatedFields: Object.keys(data),
          affectedCount: updatedUsers.count,
        });

        res.json({
          success: true,
          data: {
            message: `${updatedUsers.count} users updated successfully`,
            affectedCount: updatedUsers.count,
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case 'delete':
        const deletedUsers = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { active: false },
        });

        // Set audit data
        setAuditData(req, AuditAction.USER_MANAGEMENT, 'User', null, {
          action: 'BULK_DELETE',
          userIds,
          affectedCount: deletedUsers.count,
        });

        res.json({
          success: true,
          data: {
            message: `${deletedUsers.count} users deleted successfully`,
            affectedCount: deletedUsers.count,
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case 'export':
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            dni: true,
            userType: true,
            status: true,
            centerId: true,
            specialty: true,
            licenseNumber: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Set audit data
        setAuditData(req, AuditAction.DATA_EXPORT, 'User', null, {
          action: 'BULK_EXPORT',
          userIds,
          exportedCount: users.length,
        });

        res.json({
          success: true,
          data: users,
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        throw validationErrorHandler('Invalid bulk action');
    }
  })
);

export default router;
