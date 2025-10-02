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

// Get import templates
router.get('/templates',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('templateType').optional().isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      templateType,
      active,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (templateType) {
      where.templateType = templateType;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    // Get import templates with pagination
    const [templates, total] = await Promise.all([
      prisma.importTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          templateType: true,
          relatedTestId: true,
          fields: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.importTemplate.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ImportTemplate', null, {
      filters: { templateType, active },
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

// Get import template by ID
router.get('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const template = await prisma.importTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        relatedTestId: true,
        fields: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      throw notFoundErrorHandler('Import template');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ImportTemplate', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create import template
router.post('/templates',
  requireAdmin,
  [
    body('name').isString().withMessage('Name is required'),
    body('description').isString().withMessage('Description is required'),
    body('templateType').isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    body('relatedTestId').optional().isString().withMessage('Related test ID must be a string'),
    body('fields').isArray().withMessage('Fields must be an array'),
    body('fields.*.fieldName').isString().withMessage('Field name is required'),
    body('fields.*.fieldType').isString().withMessage('Field type is required'),
    body('fields.*.isRequired').isBoolean().withMessage('Is required must be a boolean'),
    body('fields.*.description').isString().withMessage('Description is required'),
    body('fields.*.options').optional().isArray().withMessage('Options must be an array'),
    body('fields.*.destinationField').isString().withMessage('Destination field is required'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const templateData = req.body;

    // Create import template
    const template = await prisma.importTemplate.create({
      data: {
        ...templateData,
        active: templateData.active || true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        relatedTestId: true,
        fields: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ImportTemplate', template.id, {
      action: 'CREATE',
      templateData: {
        name: template.name,
        templateType: template.templateType,
        fieldsCount: template.fields.length,
      },
    });

    logger.info('Import template created:', {
      templateId: template.id,
      name: template.name,
      templateType: template.templateType,
      fieldsCount: template.fields.length,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update import template
router.put('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('templateType').optional().isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    body('relatedTestId').optional().isString().withMessage('Related test ID must be a string'),
    body('fields').optional().isArray().withMessage('Fields must be an array'),
    body('fields.*.fieldName').optional().isString().withMessage('Field name must be a string'),
    body('fields.*.fieldType').optional().isString().withMessage('Field type must be a string'),
    body('fields.*.isRequired').optional().isBoolean().withMessage('Is required must be a boolean'),
    body('fields.*.description').optional().isString().withMessage('Description must be a string'),
    body('fields.*.options').optional().isArray().withMessage('Options must be an array'),
    body('fields.*.destinationField').optional().isString().withMessage('Destination field must be a string'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists
    const existingTemplate = await prisma.importTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Import template');
    }

    // Update template
    const template = await prisma.importTemplate.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        relatedTestId: true,
        fields: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ImportTemplate', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Import template updated:', {
      templateId: template.id,
      name: template.name,
      templateType: template.templateType,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete import template
router.delete('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.importTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Import template');
    }

    // Delete template
    await prisma.importTemplate.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'ImportTemplate', id, {
      action: 'DELETE',
      deletedData: {
        name: existingTemplate.name,
        templateType: existingTemplate.templateType,
      },
    });

    logger.info('Import template deleted:', {
      templateId: id,
      name: existingTemplate.name,
      templateType: existingTemplate.templateType,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Import template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Execute import
router.post('/execute',
  requireAdmin,
  [
    body('templateId').optional().isString().withMessage('Template ID must be a string'),
    body('templateType').isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    body('fileUrl').isString().withMessage('File URL is required'),
    body('fileName').isString().withMessage('File name is required'),
    body('fileSize').isInt({ min: 1 }).withMessage('File size must be a positive integer'),
    body('mapping').isObject().withMessage('Mapping must be an object'),
    body('validationRules').optional().isObject().withMessage('Validation rules must be an object'),
    body('rollbackOnError').optional().isBoolean().withMessage('Rollback on error must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const importData = req.body;

    // TODO: Implement actual import logic
    // This would involve:
    // 1. Validate file format and size
    // 2. Parse file (CSV, Excel, etc.)
    // 3. Apply field mapping
    // 4. Validate data according to rules
    // 5. Import data in batches
    // 6. Handle errors and rollback if needed
    // 7. Store import record

    // Create import record
    const importRecord = await prisma.importRecord.create({
      data: {
        templateId: importData.templateId,
        templateType: importData.templateType,
        fileUrl: importData.fileUrl,
        fileName: importData.fileName,
        fileSize: importData.fileSize,
        mapping: importData.mapping,
        validationRules: importData.validationRules,
        rollbackOnError: importData.rollbackOnError || false,
        requestedBy: req.user.id,
        status: 'IN_PROGRESS',
      },
      select: {
        id: true,
        templateId: true,
        templateType: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mapping: true,
        validationRules: true,
        rollbackOnError: true,
        requestedBy: true,
        status: true,
        recordsProcessed: true,
        recordsImported: true,
        recordsFailed: true,
        errorDetails: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ImportRecord', importRecord.id, {
      action: 'EXECUTE',
      importData: {
        templateType: importRecord.templateType,
        fileName: importRecord.fileName,
        fileSize: importRecord.fileSize,
        rollbackOnError: importRecord.rollbackOnError,
      },
    });

    logger.info('Import executed:', {
      importId: importRecord.id,
      templateType: importRecord.templateType,
      fileName: importRecord.fileName,
      fileSize: importRecord.fileSize,
      rollbackOnError: importRecord.rollbackOnError,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: importRecord,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get import records
router.get('/records',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('templateType').optional().isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    query('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK']).withMessage('Invalid status'),
    query('requestedBy').optional().isString().withMessage('Requested by must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      templateType,
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

    if (templateType) {
      where.templateType = templateType;
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

    // Get import records with pagination
    const [records, total] = await Promise.all([
      prisma.importRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          templateId: true,
          templateType: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          mapping: true,
          validationRules: true,
          rollbackOnError: true,
          requestedBy: true,
          status: true,
          recordsProcessed: true,
          recordsImported: true,
          recordsFailed: true,
          errorDetails: true,
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
      prisma.importRecord.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ImportRecord', null, {
      filters: { templateType, status, requestedBy, startDate, endDate },
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

// Get import record by ID
router.get('/records/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Import record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const record = await prisma.importRecord.findUnique({
      where: { id },
      select: {
        id: true,
        templateId: true,
        templateType: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mapping: true,
        validationRules: true,
        rollbackOnError: true,
        requestedBy: true,
        status: true,
        recordsProcessed: true,
        recordsImported: true,
        recordsFailed: true,
        errorDetails: true,
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
      throw notFoundErrorHandler('Import record');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ImportRecord', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
    });
  })
);

// Rollback import
router.post('/records/:id/rollback',
  requireAdmin,
  [
    param('id').isString().withMessage('Import record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if record exists
    const record = await prisma.importRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw notFoundErrorHandler('Import record');
    }

    if (record.status !== 'COMPLETED') {
      throw validationErrorHandler('Import is not completed yet');
    }

    // TODO: Implement actual rollback logic
    // This would involve:
    // 1. Identify all records created/updated by this import
    // 2. Delete/restore records to their previous state
    // 3. Update import record status

    // Update record status
    const updatedRecord = await prisma.importRecord.update({
      where: { id },
      data: {
        status: 'ROLLED_BACK',
        completedAt: new Date(),
      },
      select: {
        id: true,
        templateId: true,
        templateType: true,
        fileName: true,
        status: true,
        recordsProcessed: true,
        recordsImported: true,
        recordsFailed: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ImportRecord', id, {
      action: 'ROLLBACK',
    });

    logger.info('Import rolled back:', {
      importId: record.id,
      templateType: record.templateType,
      fileName: record.fileName,
      recordsImported: record.recordsImported,
      rolledBackBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedRecord,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete import record
router.delete('/records/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Import record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if record exists
    const record = await prisma.importRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw notFoundErrorHandler('Import record');
    }

    // Delete record
    await prisma.importRecord.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'ImportRecord', id, {
      action: 'DELETE',
      deletedData: {
        templateType: record.templateType,
        fileName: record.fileName,
        recordsImported: record.recordsImported,
        recordsFailed: record.recordsFailed,
      },
    });

    logger.info('Import record deleted:', {
      importId: id,
      templateType: record.templateType,
      fileName: record.fileName,
      recordsImported: record.recordsImported,
      recordsFailed: record.recordsFailed,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Import record deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
