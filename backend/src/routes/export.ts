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

// Get export templates
router.get('/templates',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('isPredefined').optional().isBoolean().withMessage('Is predefined must be a boolean'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      entityType,
      isPredefined,
      active,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (isPredefined !== undefined) {
      where.isPredefined = isPredefined === 'true';
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    // Get export templates with pagination
    const [templates, total] = await Promise.all([
      prisma.exportTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          entityType: true,
          fields: true,
          filters: true,
          format: true,
          isPredefined: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.exportTemplate.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ExportTemplate', null, {
      filters: { entityType, isPredefined, active },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: templates,
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

// Get export template by ID
router.get('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const template = await prisma.exportTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        entityType: true,
        fields: true,
        filters: true,
        format: true,
        isPredefined: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      throw notFoundErrorHandler('Export template');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ExportTemplate', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create export template
router.post('/templates',
  requireAdmin,
  [
    body('name').isString().withMessage('Name is required'),
    body('description').isString().withMessage('Description is required'),
    body('entityType').isString().withMessage('Entity type is required'),
    body('fields').isArray().withMessage('Fields must be an array'),
    body('fields.*.fieldName').isString().withMessage('Field name is required'),
    body('fields.*.displayName').isString().withMessage('Display name is required'),
    body('fields.*.dataType').isString().withMessage('Data type is required'),
    body('fields.*.isRequired').isBoolean().withMessage('Is required must be a boolean'),
    body('filters').optional().isArray().withMessage('Filters must be an array'),
    body('format').isIn(['CSV', 'Excel', 'PDF']).withMessage('Invalid format'),
    body('isPredefined').optional().isBoolean().withMessage('Is predefined must be a boolean'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const templateData = req.body;

    // Create export template
    const template = await prisma.exportTemplate.create({
      data: {
        ...templateData,
        isPredefined: templateData.isPredefined || false,
        active: templateData.active || true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        entityType: true,
        fields: true,
        filters: true,
        format: true,
        isPredefined: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ExportTemplate', template.id, {
      action: 'CREATE',
      templateData: {
        name: template.name,
        entityType: template.entityType,
        fieldsCount: template.fields.length,
        format: template.format,
      },
    });

    logger.info('Export template created:', {
      templateId: template.id,
      name: template.name,
      entityType: template.entityType,
      fieldsCount: template.fields.length,
      format: template.format,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update export template
router.put('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('entityType').optional().isString().withMessage('Entity type must be a string'),
    body('fields').optional().isArray().withMessage('Fields must be an array'),
    body('fields.*.fieldName').optional().isString().withMessage('Field name must be a string'),
    body('fields.*.displayName').optional().isString().withMessage('Display name must be a string'),
    body('fields.*.dataType').optional().isString().withMessage('Data type must be a string'),
    body('fields.*.isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    body('filters').optional().isArray().withMessage('Filters must be an array'),
    body('format').optional().isIn(['CSV', 'Excel', 'PDF']).withMessage('Invalid format'),
    body('isPredefined').optional().isBoolean().withMessage('Is predefined must be a boolean'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists
    const existingTemplate = await prisma.exportTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Export template');
    }

    // Update template
    const template = await prisma.exportTemplate.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        entityType: true,
        fields: true,
        filters: true,
        format: true,
        isPredefined: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ExportTemplate', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Export template updated:', {
      templateId: template.id,
      name: template.name,
      entityType: template.entityType,
      format: template.format,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete export template
router.delete('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.exportTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Export template');
    }

    // Delete template
    await prisma.exportTemplate.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'ExportTemplate', id, {
      action: 'DELETE',
      deletedData: {
        name: existingTemplate.name,
        entityType: existingTemplate.entityType,
        format: existingTemplate.format,
      },
    });

    logger.info('Export template deleted:', {
      templateId: id,
      name: existingTemplate.name,
      entityType: existingTemplate.entityType,
      format: existingTemplate.format,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Export template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Execute export
router.post('/execute',
  requireAdmin,
  [
    body('templateId').optional().isString().withMessage('Template ID must be a string'),
    body('entityType').isString().withMessage('Entity type is required'),
    body('fields').isArray().withMessage('Fields must be an array'),
    body('fields.*.fieldName').isString().withMessage('Field name is required'),
    body('fields.*.displayName').isString().withMessage('Display name is required'),
    body('fields.*.dataType').isString().withMessage('Data type is required'),
    body('filters').optional().isArray().withMessage('Filters must be an array'),
    body('format').isIn(['CSV', 'Excel', 'PDF']).withMessage('Invalid format'),
    body('anonymize').optional().isBoolean().withMessage('Anonymize must be a boolean'),
    body('purpose').optional().isString().withMessage('Purpose must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const exportData = req.body;

    // TODO: Implement actual export logic
    // This would involve:
    // 1. Validate entity type and fields
    // 2. Apply filters to query data
    // 3. Format data according to specified format
    // 4. Generate file (CSV, Excel, or PDF)
    // 5. Store export record
    // 6. Return download URL or file data

    // Create export record
    const exportRecord = await prisma.exportRecord.create({
      data: {
        templateId: exportData.templateId,
        entityType: exportData.entityType,
        fields: exportData.fields,
        filters: exportData.filters,
        format: exportData.format,
        anonymize: exportData.anonymize || false,
        purpose: exportData.purpose,
        requestedBy: req.user.id,
        status: 'IN_PROGRESS',
      },
      select: {
        id: true,
        templateId: true,
        entityType: true,
        fields: true,
        filters: true,
        format: true,
        anonymize: true,
        purpose: true,
        requestedBy: true,
        status: true,
        fileUrl: true,
        recordsExported: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_EXPORT, 'ExportRecord', exportRecord.id, {
      action: 'EXECUTE',
      exportData: {
        entityType: exportRecord.entityType,
        fieldsCount: exportRecord.fields.length,
        format: exportRecord.format,
        anonymize: exportRecord.anonymize,
      },
    });

    logger.info('Export executed:', {
      exportId: exportRecord.id,
      entityType: exportRecord.entityType,
      fieldsCount: exportRecord.fields.length,
      format: exportRecord.format,
      anonymize: exportRecord.anonymize,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: exportRecord,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get export records
router.get('/records',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('entityType').optional().isString().withMessage('Entity type must be a string'),
    query('format').optional().isIn(['CSV', 'Excel', 'PDF']).withMessage('Invalid format'),
    query('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'FAILED']).withMessage('Invalid status'),
    query('requestedBy').optional().isString().withMessage('Requested by must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      entityType,
      format,
      status,
      requestedBy,
      startDate,
      endDate,
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

    if (format) {
      where.format = format;
    }

    if (status) {
      where.status = status;
    }

    if (requestedBy) {
      where.requestedBy = requestedBy;
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    // Get export records with pagination
    const [records, total] = await Promise.all([
      prisma.exportRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          templateId: true,
          entityType: true,
          fields: true,
          filters: true,
          format: true,
          anonymize: true,
          purpose: true,
          requestedBy: true,
          status: true,
          fileUrl: true,
          recordsExported: true,
          createdAt: true,
          completedAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.exportRecord.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ExportRecord', null, {
      filters: { entityType, format, status, requestedBy, startDate, endDate },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: records,
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

// Get export record by ID
router.get('/records/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Export record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const record = await prisma.exportRecord.findUnique({
      where: { id },
      select: {
        id: true,
        templateId: true,
        entityType: true,
        fields: true,
        filters: true,
        format: true,
        anonymize: true,
        purpose: true,
        requestedBy: true,
        status: true,
        fileUrl: true,
        recordsExported: true,
        createdAt: true,
        completedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      throw notFoundErrorHandler('Export record');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ExportRecord', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
    });
  })
);

// Download export file
router.get('/records/:id/download',
  requireAdmin,
  [
    param('id').isString().withMessage('Export record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const record = await prisma.exportRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw notFoundErrorHandler('Export record');
    }

    if (record.status !== 'COMPLETED') {
      throw validationErrorHandler('Export is not completed yet');
    }

    if (!record.fileUrl) {
      throw validationErrorHandler('Export file not found');
    }

    // TODO: Implement actual file download logic
    // This would involve:
    // 1. Get file from storage (S3, local, etc.)
    // 2. Set appropriate headers
    // 3. Stream file to response

    // Set audit data
    setAuditData(req, AuditAction.DATA_EXPORT, 'ExportRecord', id, {
      action: 'DOWNLOAD',
    });

    logger.info('Export file downloaded:', {
      exportId: record.id,
      entityType: record.entityType,
      format: record.format,
      downloadedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'File download initiated',
      fileUrl: record.fileUrl,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete export record
router.delete('/records/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Export record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if record exists
    const record = await prisma.exportRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw notFoundErrorHandler('Export record');
    }

    // Delete record
    await prisma.exportRecord.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'ExportRecord', id, {
      action: 'DELETE',
      deletedData: {
        entityType: record.entityType,
        format: record.format,
        anonymize: record.anonymize,
        recordsExported: record.recordsExported,
      },
    });

    logger.info('Export record deleted:', {
      exportId: id,
      entityType: record.entityType,
      format: record.format,
      recordsExported: record.recordsExported,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Export record deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
