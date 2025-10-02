import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin } from './auth';
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

// Get security dashboard data
router.get('/dashboard',
  requireAdmin,
  asyncHandler(async (req: any, res) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get security dashboard data
    const [
      todayLogs,
      activeAlerts,
      totalUsers,
      failedLogins,
      recentAlerts,
      auditLogsByAction,
      anomalyAlertsByType,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          timestamp: { gte: today },
        },
      }),
      prisma.anomalyAlert.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.user.count({
        where: { active: true },
      }),
      prisma.auditLog.count({
        where: {
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          timestamp: { gte: weekAgo },
        },
      }),
      prisma.anomalyAlert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { detectedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          severity: true,
          description: true,
          detectedAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { timestamp: { gte: weekAgo } },
        _count: { action: true },
      }),
      prisma.anomalyAlert.groupBy({
        by: ['type'],
        where: { detectedAt: { gte: weekAgo } },
        _count: { type: true },
      }),
    ]);

    const dashboardData = {
      todayLogs,
      activeAlerts,
      totalUsers,
      failedLogins,
      recentAlerts,
      auditLogsByAction: auditLogsByAction.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
      anomalyAlertsByType: anomalyAlertsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'SecurityDashboard', null, {
      action: 'DASHBOARD_VIEW',
    });

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get audit logs
router.get('/audit-logs',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('userId').optional().isString().withMessage('User ID must be a string'),
    query('action').optional().isString().withMessage('Action must be a string'),
    query('resourceType').optional().isString().withMessage('Resource type must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (startDate) {
      where.timestamp = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.timestamp = { lte: new Date(endDate) };
    }

    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          userId: true,
          action: true,
          resourceType: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          sessionId: true,
          timestamp: true,
          integrityHash: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              userType: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AuditLog', null, {
      filters: { userId, action, resourceType, startDate, endDate },
      pagination: { page, limit, total },
    });

    res.json({
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

// Get anomaly alerts
router.get('/anomaly-alerts',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity'),
    query('status').optional().isIn(['ACTIVE', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      status,
      startDate,
      endDate,
      sortBy = 'detectedAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.detectedAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.detectedAt = { lte: new Date(endDate) };
    }

    // Get anomaly alerts with pagination
    const [alerts, total] = await Promise.all([
      prisma.anomalyAlert.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          type: true,
          severity: true,
          description: true,
          userId: true,
          logId: true,
          metadata: true,
          detectedAt: true,
          status: true,
          resolvedBy: true,
          resolvedAt: true,
          resolutionNotes: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              userType: true,
            },
          },
          auditLog: {
            select: {
              id: true,
              action: true,
              resourceType: true,
              resourceId: true,
              timestamp: true,
            },
          },
        },
      }),
      prisma.anomalyAlert.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AnomalyAlert', null, {
      filters: { type, severity, status, startDate, endDate },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: alerts,
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

// Update anomaly alert status
router.put('/anomaly-alerts/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Anomaly alert ID is required'),
    body('status').isIn(['ACTIVE', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE']).withMessage('Invalid status'),
    body('resolutionNotes').optional().isString().withMessage('Resolution notes must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    // Check if alert exists
    const existingAlert = await prisma.anomalyAlert.findUnique({
      where: { id },
    });

    if (!existingAlert) {
      throw notFoundErrorHandler('Anomaly alert');
    }

    // Update alert
    const alert = await prisma.anomalyAlert.update({
      where: { id },
      data: {
        status,
        resolutionNotes,
        resolvedBy: req.user.id,
        resolvedAt: new Date(),
      },
      select: {
        id: true,
        type: true,
        severity: true,
        description: true,
        status: true,
        resolvedBy: true,
        resolvedAt: true,
        resolutionNotes: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AnomalyAlert', id, {
      action: 'UPDATE_STATUS',
      status,
      resolutionNotes,
    });

    logger.info('Anomaly alert status updated:', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      status,
      resolvedBy: req.user.id,
    });

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get data retention policies
router.get('/retention-policies',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Invalid status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      entityType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (status) {
      where.status = status;
    }

    // Get retention policies with pagination
    const [policies, total] = await Promise.all([
      prisma.retentionPolicy.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          entityType: true,
          retentionYears: true,
          triggerField: true,
          description: true,
          legalBasis: true,
          autoApply: true,
          gracePeriodDays: true,
          notifyBeforeDays: true,
          status: true,
          createdBy: true,
          lastApplied: true,
          createdAt: true,
        },
      }),
      prisma.retentionPolicy.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'RetentionPolicy', null, {
      filters: { entityType, status },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: policies,
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

// Create data retention policy
router.post('/retention-policies',
  requireAdmin,
  [
    body('entityType').isString().withMessage('Entity type is required'),
    body('retentionYears').isInt({ min: 1 }).withMessage('Retention years must be a positive integer'),
    body('triggerField').isString().withMessage('Trigger field is required'),
    body('description').isString().withMessage('Description is required'),
    body('legalBasis').isString().withMessage('Legal basis is required'),
    body('autoApply').optional().isBoolean().withMessage('Auto apply must be a boolean'),
    body('gracePeriodDays').optional().isInt({ min: 0 }).withMessage('Grace period days must be a non-negative integer'),
    body('notifyBeforeDays').optional().isInt({ min: 0 }).withMessage('Notify before days must be a non-negative integer'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const policyData = req.body;

    // Check if policy already exists for this entity type
    const existingPolicy = await prisma.retentionPolicy.findFirst({
      where: {
        entityType: policyData.entityType,
        status: 'ACTIVE',
      },
    });

    if (existingPolicy) {
      throw validationErrorHandler('Active retention policy already exists for this entity type', {
        field: 'entityType',
        message: 'Active retention policy already exists for this entity type',
      });
    }

    // Create retention policy
    const policy = await prisma.retentionPolicy.create({
      data: {
        ...policyData,
        createdBy: req.user.id,
        autoApply: policyData.autoApply || false,
        gracePeriodDays: policyData.gracePeriodDays || 30,
        notifyBeforeDays: policyData.notifyBeforeDays || 7,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        entityType: true,
        retentionYears: true,
        triggerField: true,
        description: true,
        legalBasis: true,
        autoApply: true,
        gracePeriodDays: true,
        notifyBeforeDays: true,
        status: true,
        createdBy: true,
        lastApplied: true,
        createdAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'RetentionPolicy', policy.id, {
      action: 'CREATE',
      policyData: {
        entityType: policy.entityType,
        retentionYears: policy.retentionYears,
        triggerField: policy.triggerField,
      },
    });

    logger.info('Data retention policy created:', {
      policyId: policy.id,
      entityType: policy.entityType,
      retentionYears: policy.retentionYears,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: policy,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get data retention jobs
router.get('/retention-jobs',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('status').optional().isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']).withMessage('Invalid status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      entityType,
      status,
      sortBy = 'scheduledFor',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (status) {
      where.status = status;
    }

    // Get retention jobs with pagination
    const [jobs, total] = await Promise.all([
      prisma.dataRetentionJob.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          entityType: true,
          policyApplied: true,
          recordsEligible: true,
          recordsDeleted: true,
          cutoffDate: true,
          scheduledFor: true,
          executedAt: true,
          status: true,
          createdBy: true,
          executedBy: true,
          backupId: true,
          errorDetails: true,
          createdAt: true,
        },
      }),
      prisma.dataRetentionJob.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'DataRetentionJob', null, {
      filters: { entityType, status },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: jobs,
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

// Execute data retention job
router.post('/retention-jobs/:id/execute',
  requireAdmin,
  [
    param('id').isString().withMessage('Data retention job ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if job exists
    const job = await prisma.dataRetentionJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw notFoundErrorHandler('Data retention job');
    }

    if (job.status !== 'SCHEDULED') {
      throw validationErrorHandler('Job is not in scheduled status');
    }

    // TODO: Implement actual data retention execution
    // This would involve:
    // 1. Creating backup of data to be deleted
    // 2. Deleting records based on policy
    // 3. Updating job status

    // Update job status
    const updatedJob = await prisma.dataRetentionJob.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        executedBy: req.user.id,
        executedAt: new Date(),
      },
      select: {
        id: true,
        entityType: true,
        status: true,
        executedBy: true,
        executedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'DataRetentionJob', id, {
      action: 'EXECUTE',
    });

    logger.info('Data retention job executed:', {
      jobId: job.id,
      entityType: job.entityType,
      executedBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedJob,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get anonymization logs
router.get('/anonymization-logs',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('requestedBy').optional().isString().withMessage('Requested by must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      entityType,
      requestedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (requestedBy) {
      where.requestedBy = requestedBy;
    }

    // Get anonymization logs with pagination
    const [logs, total] = await Promise.all([
      prisma.anonymizationLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          requestId: true,
          entityType: true,
          recordsProcessed: true,
          anonymizationMethod: true,
          kAnonymityScore: true,
          requestedBy: true,
          purpose: true,
          createdAt: true,
        },
      }),
      prisma.anonymizationLog.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AnonymizationLog', null, {
      filters: { entityType, requestedBy },
      pagination: { page, limit, total },
    });

    res.json({
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

// Create anonymization log
router.post('/anonymization-logs',
  requireAdmin,
  [
    body('requestId').isString().withMessage('Request ID is required'),
    body('entityType').isString().withMessage('Entity type is required'),
    body('recordsProcessed').isInt({ min: 0 }).withMessage('Records processed must be a non-negative integer'),
    body('anonymizationMethod').isString().withMessage('Anonymization method is required'),
    body('kAnonymityScore').optional().isNumeric().withMessage('K-anonymity score must be a number'),
    body('purpose').isString().withMessage('Purpose is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const logData = req.body;

    // Create anonymization log
    const log = await prisma.anonymizationLog.create({
      data: {
        ...logData,
        requestedBy: req.user.id,
      },
      select: {
        id: true,
        requestId: true,
        entityType: true,
        recordsProcessed: true,
        anonymizationMethod: true,
        kAnonymityScore: true,
        requestedBy: true,
        purpose: true,
        createdAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AnonymizationLog', log.id, {
      action: 'CREATE',
      logData: {
        requestId: log.requestId,
        entityType: log.entityType,
        recordsProcessed: log.recordsProcessed,
        anonymizationMethod: log.anonymizationMethod,
      },
    });

    logger.info('Anonymization log created:', {
      logId: log.id,
      requestId: log.requestId,
      entityType: log.entityType,
      recordsProcessed: log.recordsProcessed,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: log,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
