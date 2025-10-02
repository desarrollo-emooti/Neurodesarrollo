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

// Get all subscription configurations
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('paymentType').optional().isIn(['B2B', 'B2B2C']).withMessage('Invalid payment type'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
    query('isRecurring').optional().isBoolean().withMessage('Is recurring must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      paymentType,
      centerId,
      isActive,
      isRecurring,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on user permissions
    const where: any = {};

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.centerId = req.user.centerId;
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.centerId = { in: req.user.centerIds };
    }

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (centerId) {
      where.centerId = centerId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isRecurring !== undefined) {
      where.isRecurring = isRecurring;
    }

    // Get subscription configurations with pagination
    const [configurations, total] = await Promise.all([
      prisma.subscriptionConfiguration.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          paymentType: true,
          centerId: true,
          recipientName: true,
          recipientEmail: true,
          studentIds: true,
          pricePerStudent: true,
          startDate: true,
          nextBillingDate: true,
          isRecurring: true,
          isActive: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          center: {
            select: {
              id: true,
              name: true,
              code: true,
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
            },
          },
          _count: {
            select: {
              billings: true,
            },
          },
        },
      }),
      prisma.subscriptionConfiguration.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'SubscriptionConfiguration', null, {
      filters: { search, paymentType, centerId, isActive, isRecurring },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: configurations,
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

// Get subscription configuration by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Subscription configuration ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const configuration = await prisma.subscriptionConfiguration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        paymentType: true,
        centerId: true,
        recipientName: true,
        recipientEmail: true,
        studentIds: true,
        pricePerStudent: true,
        startDate: true,
        nextBillingDate: true,
        isRecurring: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
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
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        billings: {
          select: {
            id: true,
            billingType: true,
            billingPeriod: true,
            billingDate: true,
            numberOfStudents: true,
            totalAmount: true,
            status: true,
            sentDate: true,
            paidDate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!configuration) {
      throw notFoundErrorHandler('Subscription configuration');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && configuration.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this subscription configuration',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(configuration.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this subscription configuration',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'SubscriptionConfiguration', id);

    res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create subscription configuration
router.post('/',
  requireClinicalStaff,
  [
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    body('paymentType').isIn(['B2B', 'B2B2C']).withMessage('Valid payment type is required'),
    body('recipientName').isString().isLength({ min: 1 }).withMessage('Recipient name is required'),
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
    body('studentIds').isArray().isLength({ min: 1 }).withMessage('Student IDs array is required'),
    body('pricePerStudent').isNumeric().withMessage('Price per student is required'),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('centerId').optional().isString().withMessage('Center ID must be a string'),
    body('isRecurring').optional().isBoolean().withMessage('Is recurring must be a boolean'),
    body('nextBillingDate').optional().isISO8601().withMessage('Next billing date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const configurationData = req.body;

    // Check if center exists (for B2B subscriptions)
    if (configurationData.paymentType === 'B2B' && configurationData.centerId) {
      const center = await prisma.center.findUnique({
        where: { id: configurationData.centerId },
      });

      if (!center) {
        throw notFoundErrorHandler('Center');
      }

      // Check permissions for center
      if (req.user.userType === 'ORIENTADOR' && configurationData.centerId !== req.user.centerId) {
        throw validationErrorHandler('Cannot create subscription for different center');
      }

      if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
        if (!req.user.centerIds.includes(configurationData.centerId)) {
          throw validationErrorHandler('Cannot create subscription for unauthorized center');
        }
      }
    }

    // Check if all students exist
    const students = await prisma.student.findMany({
      where: { id: { in: configurationData.studentIds } },
      select: { id: true, centerId: true },
    });

    if (students.length !== configurationData.studentIds.length) {
      throw validationErrorHandler('Some students do not exist');
    }

    // Check permissions for students
    if (req.user.userType === 'ORIENTADOR') {
      const unauthorizedStudents = students.filter(student => student.centerId !== req.user.centerId);
      if (unauthorizedStudents.length > 0) {
        throw validationErrorHandler('Cannot create subscription with students from different center');
      }
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      const unauthorizedStudents = students.filter(student => !req.user.centerIds.includes(student.centerId));
      if (unauthorizedStudents.length > 0) {
        throw validationErrorHandler('Cannot create subscription with students from unauthorized centers');
      }
    }

    // Create subscription configuration
    const configuration = await prisma.subscriptionConfiguration.create({
      data: {
        ...configurationData,
        createdBy: req.user.id,
        isRecurring: configurationData.isRecurring || false,
      },
      select: {
        id: true,
        name: true,
        paymentType: true,
        centerId: true,
        recipientName: true,
        recipientEmail: true,
        studentIds: true,
        pricePerStudent: true,
        startDate: true,
        nextBillingDate: true,
        isRecurring: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
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
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'SubscriptionConfiguration', configuration.id, {
      action: 'CREATE',
      configurationData: {
        name: configuration.name,
        paymentType: configuration.paymentType,
        centerId: configuration.centerId,
        studentCount: configuration.studentIds.length,
        pricePerStudent: configuration.pricePerStudent,
      },
    });

    logger.info('Subscription configuration created:', {
      configurationId: configuration.id,
      name: configuration.name,
      paymentType: configuration.paymentType,
      centerId: configuration.centerId,
      studentCount: configuration.studentIds.length,
      pricePerStudent: configuration.pricePerStudent,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update subscription configuration
router.put('/:id',
  [
    param('id').isString().withMessage('Subscription configuration ID is required'),
    body('name').optional().isString().isLength({ min: 1 }).withMessage('Name must be a non-empty string'),
    body('recipientName').optional().isString().isLength({ min: 1 }).withMessage('Recipient name must be a non-empty string'),
    body('recipientEmail').optional().isEmail().withMessage('Valid recipient email is required'),
    body('studentIds').optional().isArray().isLength({ min: 1 }).withMessage('Student IDs array must have at least one element'),
    body('pricePerStudent').optional().isNumeric().withMessage('Price per student must be a number'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('nextBillingDate').optional().isISO8601().withMessage('Next billing date must be a valid date'),
    body('isRecurring').optional().isBoolean().withMessage('Is recurring must be a boolean'),
    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if configuration exists
    const existingConfiguration = await prisma.subscriptionConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfiguration) {
      throw notFoundErrorHandler('Subscription configuration');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingConfiguration.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this subscription configuration',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingConfiguration.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this subscription configuration',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if students exist (if being updated)
    if (updateData.studentIds) {
      const students = await prisma.student.findMany({
        where: { id: { in: updateData.studentIds } },
        select: { id: true, centerId: true },
      });

      if (students.length !== updateData.studentIds.length) {
        throw validationErrorHandler('Some students do not exist');
      }

      // Check permissions for students
      if (req.user.userType === 'ORIENTADOR') {
        const unauthorizedStudents = students.filter(student => student.centerId !== req.user.centerId);
        if (unauthorizedStudents.length > 0) {
          throw validationErrorHandler('Cannot update subscription with students from different center');
        }
      }

      if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
        const unauthorizedStudents = students.filter(student => !req.user.centerIds.includes(student.centerId));
        if (unauthorizedStudents.length > 0) {
          throw validationErrorHandler('Cannot update subscription with students from unauthorized centers');
        }
      }
    }

    // Update configuration
    const configuration = await prisma.subscriptionConfiguration.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        paymentType: true,
        centerId: true,
        recipientName: true,
        recipientEmail: true,
        studentIds: true,
        pricePerStudent: true,
        startDate: true,
        nextBillingDate: true,
        isRecurring: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
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
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'SubscriptionConfiguration', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Subscription configuration updated:', {
      configurationId: configuration.id,
      name: configuration.name,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete subscription configuration (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Subscription configuration ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if configuration exists
    const configuration = await prisma.subscriptionConfiguration.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            billings: true,
          },
        },
      },
    });

    if (!configuration) {
      throw notFoundErrorHandler('Subscription configuration');
    }

    // Check if configuration has billings
    if (configuration._count.billings > 0) {
      throw validationErrorHandler('Cannot delete subscription configuration with existing billings', {
        billingsCount: configuration._count.billings,
      });
    }

    // Delete configuration
    await prisma.subscriptionConfiguration.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'SubscriptionConfiguration', id, {
      action: 'DELETE',
      configurationData: {
        name: configuration.name,
        paymentType: configuration.paymentType,
        centerId: configuration.centerId,
      },
    });

    logger.info('Subscription configuration deleted:', {
      configurationId: id,
      name: configuration.name,
      paymentType: configuration.paymentType,
      centerId: configuration.centerId,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'Subscription configuration deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Generate billing for subscription
router.post('/:id/generate-billing',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('Subscription configuration ID is required'),
    body('billingPeriod').isString().withMessage('Billing period is required'),
    body('billingDate').isISO8601().withMessage('Billing date is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { billingPeriod, billingDate } = req.body;

    // Check if configuration exists
    const configuration = await prisma.subscriptionConfiguration.findUnique({
      where: { id },
      include: { students: true },
    });

    if (!configuration) {
      throw notFoundErrorHandler('Subscription configuration');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && configuration.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to generate billing for this subscription',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(configuration.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to generate billing for this subscription',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if billing already exists for this period
    const existingBilling = await prisma.subscriptionBilling.findFirst({
      where: {
        subscriptionConfigId: id,
        billingPeriod,
      },
    });

    if (existingBilling) {
      throw validationErrorHandler('Billing already exists for this period', {
        billingPeriod,
        existingBillingId: existingBilling.id,
      });
    }

    // Create billing
    const billing = await prisma.subscriptionBilling.create({
      data: {
        subscriptionConfigId: id,
        billingType: 'SUBSCRIPTION',
        billingPeriod,
        billingDate: new Date(billingDate),
        recipientName: configuration.recipientName,
        recipientEmail: configuration.recipientEmail,
        studentDetails: configuration.students.map(student => ({
          id: student.id,
          name: student.fullName,
          course: student.course,
          classGroup: student.classGroup,
        })),
        numberOfStudents: configuration.students.length,
        pricePerStudent: configuration.pricePerStudent,
        totalAmount: configuration.students.length * configuration.pricePerStudent,
        status: 'PENDING',
        generatedAutomatically: false,
      },
      select: {
        id: true,
        billingType: true,
        billingPeriod: true,
        billingDate: true,
        recipientName: true,
        recipientEmail: true,
        numberOfStudents: true,
        pricePerStudent: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'SubscriptionBilling', billing.id, {
      action: 'CREATE',
      billingData: {
        subscriptionConfigId: id,
        billingPeriod,
        billingDate,
        totalAmount: billing.totalAmount,
      },
    });

    logger.info('Subscription billing generated:', {
      billingId: billing.id,
      subscriptionConfigId: id,
      billingPeriod,
      totalAmount: billing.totalAmount,
      generatedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: billing,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
