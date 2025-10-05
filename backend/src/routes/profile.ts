import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken } from './auth';
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

// Get current user profile
router.get('/',
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
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
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw notFoundErrorHandler('User');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'User', userId, {
      action: 'VIEW_PROFILE',
    });

    return res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update current user profile
router.put('/',
  [
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('autonomousCommunity').optional().isString().withMessage('Autonomous community must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('specialty').optional().isString().withMessage('Specialty must be a string'),
    body('licenseNumber').optional().isString().withMessage('License number must be a string'),
    body('allowedEtapas').optional().isArray().withMessage('Allowed etapas must be an array'),
    body('allowedCourses').optional().isArray().withMessage('Allowed courses must be an array'),
    body('allowedGroups').optional().isArray().withMessage('Allowed groups must be an array'),
    body('paymentMethod').optional().isString().withMessage('Payment method must be a string'),
    body('bankIban').optional().isString().withMessage('Bank IBAN must be a string'),
    body('bankName').optional().isString().withMessage('Bank name must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const updateData = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw notFoundErrorHandler('User');
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
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
            type: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'User', userId, {
      action: 'UPDATE_PROFILE',
      updateData,
    });

    logger.info('User profile updated:', {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  })
);

// Change password
router.put('/password',
  [
    body('currentPassword').isString().withMessage('Current password is required'),
    body('newPassword').isString().isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('confirmPassword').isString().withMessage('Confirm password is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      throw validationErrorHandler('New password and confirm password do not match');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw notFoundErrorHandler('User');
    }

    // TODO: Implement password validation and hashing
    // This would involve:
    // 1. Verify current password
    // 2. Hash new password
    // 3. Update user password

    // For now, we'll just log the action
    logger.info('Password change requested:', {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'User', userId, {
      action: 'CHANGE_PASSWORD',
    });

    return res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get user activity
router.get('/activity',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = { userId };

    if (startDate) {
      where.timestamp = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.timestamp = { lte: new Date(endDate) };
    }

    // Get user activity logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          timestamp: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AuditLog', undefined, {
      action: 'VIEW_USER_ACTIVITY',
      filters: { startDate, endDate },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: logs,
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

// Get user statistics
router.get('/statistics',
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    const [
      totalLogins,
      totalDataAccess,
      totalDataModifications,
      totalDataExports,
      lastLogin,
      mostAccessedResource,
      activityByDay,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          userId,
          action: 'LOGIN',
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DATA_ACCESS',
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DATA_MODIFICATION',
        },
      }),
      prisma.auditLog.count({
        where: {
          userId,
          action: 'DATA_EXPORT',
        },
      }),
      prisma.auditLog.findFirst({
        where: {
          userId,
          action: 'LOGIN',
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
      prisma.auditLog.groupBy({
        by: ['resourceType'],
        where: {
          userId,
          action: 'DATA_ACCESS',
        },
        _count: { resourceType: true },
        orderBy: { _count: { resourceType: 'desc' } },
        take: 1,
      }),
      prisma.auditLog.groupBy({
        by: ['timestamp'],
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: { timestamp: true },
        orderBy: { timestamp: 'asc' },
      }),
    ]);

    const statistics = {
      totalLogins,
      totalDataAccess,
      totalDataModifications,
      totalDataExports,
      lastLogin: lastLogin?.timestamp,
      mostAccessedResource: mostAccessedResource[0]?.resourceType || null,
      activityByDay: activityByDay.map(item => ({
        date: item.timestamp,
        count: item._count.timestamp,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'User', userId, {
      action: 'VIEW_USER_STATISTICS',
    });

    return res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get user preferences
router.get('/preferences',
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;

    // TODO: Implement user preferences
    // This would involve creating a UserPreferences model
    // For now, we'll return default preferences

    const preferences = {
      theme: 'light',
      language: 'es',
      timezone: 'Europe/Madrid',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30,
        showCharts: true,
        showAlerts: true,
      },
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'User', userId, {
      action: 'VIEW_USER_PREFERENCES',
    });

    return res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update user preferences
router.put('/preferences',
  [
    body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
    body('language').optional().isString().withMessage('Language must be a string'),
    body('timezone').optional().isString().withMessage('Timezone must be a string'),
    body('dateFormat').optional().isString().withMessage('Date format must be a string'),
    body('timeFormat').optional().isIn(['12h', '24h']).withMessage('Time format must be 12h or 24h'),
    body('notifications').optional().isObject().withMessage('Notifications must be an object'),
    body('dashboard').optional().isObject().withMessage('Dashboard must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const preferences = req.body;

    // TODO: Implement user preferences update
    // This would involve creating a UserPreferences model
    // For now, we'll just log the action

    logger.info('User preferences updated:', {
      userId,
      preferences,
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'User', userId, {
      action: 'UPDATE_USER_PREFERENCES',
      preferences,
    });

    return res.json({
      success: true,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete user account
router.delete('/',
  [
    body('password').isString().withMessage('Password is required'),
    body('confirmDeletion').isBoolean().withMessage('Confirm deletion must be true'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const userId = req.user.id;
    const { password, confirmDeletion } = req.body;

    if (!confirmDeletion) {
      throw validationErrorHandler('Account deletion must be confirmed');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw notFoundErrorHandler('User');
    }

    // TODO: Implement password verification
    // This would involve:
    // 1. Verify password
    // 2. Check for any dependencies (students, reports, etc.)
    // 3. Soft delete or anonymize user data
    // 4. Log the deletion

    logger.info('User account deletion requested:', {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'User', userId, {
      action: 'DELETE_USER_ACCOUNT',
    });

    return res.json({
      success: true,
      message: 'Account deletion request submitted',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
