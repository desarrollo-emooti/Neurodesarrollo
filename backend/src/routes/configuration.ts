import { Router, Request, Response } from 'express';
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

// Get all configuration
router.get('/',
  requireAdmin,
  asyncHandler(async (req: any, res: Response) => {
    const [
      valueConfigurations,
      companyConfiguration,
      importTemplates,
      backupConfigurations,
    ] = await Promise.all([
      prisma.valueConfiguration.findMany({
        orderBy: { testTitle: 'asc' },
      }),
      prisma.companyConfiguration.findFirst({
        where: { isActive: true },
      }),
      prisma.importTemplate.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.backupConfiguration.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    const configuration = {
      valueConfigurations,
      companyConfiguration,
      importTemplates,
      backupConfigurations,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Configuration', undefined, {
      action: 'VIEW_ALL',
    });

    return res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get value configurations
router.get('/value-configurations',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('testTitle').optional().isString().withMessage('Test title must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      testTitle,
      sortBy = 'testTitle',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (testTitle) {
      where.testTitle = { contains: testTitle, mode: 'insensitive' };
    }

    // Get value configurations with pagination
    const [configurations, total] = await Promise.all([
      prisma.valueConfiguration.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          testTitle: true,
          rules: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.valueConfiguration.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'ValueConfiguration', undefined, {
      filters: { testTitle },
      pagination: { page, limit, total },
    });

    return res.json({
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

// Create value configuration
router.post('/value-configurations',
  requireAdmin,
  [
    body('testTitle').isString().withMessage('Test title is required'),
    body('rules').isArray().withMessage('Rules must be an array'),
    body('rules.*.minValue').isNumeric().withMessage('Min value must be a number'),
    body('rules.*.maxValue').isNumeric().withMessage('Max value must be a number'),
    body('rules.*.valuation').isIn(['Sin problema', 'Revisar', 'Urgente', 'Alerta']).withMessage('Invalid valuation'),
    body('rules.*.color').isString().withMessage('Color is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { testTitle, rules } = req.body;

    // Check if configuration already exists for this test
    const existingConfig = await prisma.valueConfiguration.findFirst({
      where: { testTitle },
    });

    if (existingConfig) {
      throw validationErrorHandler('Value configuration already exists for this test', {
        field: 'testTitle',
        message: 'Value configuration already exists for this test',
      });
    }

    // Create value configuration
    const configuration = await prisma.valueConfiguration.create({
      data: {
        testTitle,
        rules,
      },
      select: {
        id: true,
        testTitle: true,
        rules: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ValueConfiguration', configuration.id, {
      action: 'CREATE',
      configurationData: {
        testTitle: configuration.testTitle,
        rulesCount: rules.length,
      },
    });

    logger.info('Value configuration created:', {
      configId: configuration.id,
      testTitle: configuration.testTitle,
      rulesCount: rules.length,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update value configuration
router.put('/value-configurations/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Configuration ID is required'),
    body('testTitle').optional().isString().withMessage('Test title must be a string'),
    body('rules').optional().isArray().withMessage('Rules must be an array'),
    body('rules.*.minValue').optional().isNumeric().withMessage('Min value must be a number'),
    body('rules.*.maxValue').optional().isNumeric().withMessage('Max value must be a number'),
    body('rules.*.valuation').optional().isIn(['Sin problema', 'Revisar', 'Urgente', 'Alerta']).withMessage('Invalid valuation'),
    body('rules.*.color').optional().isString().withMessage('Color is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if configuration exists
    const existingConfig = await prisma.valueConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw notFoundErrorHandler('Value configuration');
    }

    // Update configuration
    const configuration = await prisma.valueConfiguration.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        testTitle: true,
        rules: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'ValueConfiguration', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Value configuration updated:', {
      configId: configuration.id,
      testTitle: configuration.testTitle,
      updatedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete value configuration
router.delete('/value-configurations/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Configuration ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if configuration exists
    const existingConfig = await prisma.valueConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw notFoundErrorHandler('Value configuration');
    }

    // Delete configuration
    await prisma.valueConfiguration.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'ValueConfiguration', id, {
      action: 'DELETE',
      deletedData: {
        testTitle: existingConfig.testTitle,
      },
    });

    logger.info('Value configuration deleted:', {
      configId: id,
      testTitle: existingConfig.testTitle,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      message: 'Value configuration deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get company configuration
router.get('/company',
  requireAdmin,
  asyncHandler(async (req: any, res: Response) => {
    const configuration = await prisma.companyConfiguration.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        companyName: true,
        cif: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        postalCode: true,
        city: true,
        province: true,
        country: true,
        website: true,
        bankAccount: true,
        invoiceSeries: true,
        creditNoteSeries: true,
        lastInvoiceNumber: true,
        lastCreditNoteNumber: true,
        seriesYear: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'CompanyConfiguration', undefined, {
      action: 'VIEW',
    });

    return res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update company configuration
router.put('/company',
  requireAdmin,
  [
    body('companyName').optional().isString().withMessage('Company name must be a string'),
    body('cif').optional().isString().withMessage('CIF must be a string'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('email').optional().isEmail().withMessage('Email must be a valid email'),
    body('logoUrl').optional().isString().withMessage('Logo URL must be a string'),
    body('postalCode').optional().isString().withMessage('Postal code must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('province').optional().isString().withMessage('Province must be a string'),
    body('country').optional().isString().withMessage('Country must be a string'),
    body('website').optional().isString().withMessage('Website must be a string'),
    body('bankAccount').optional().isString().withMessage('Bank account must be a string'),
    body('invoiceSeries').optional().isString().withMessage('Invoice series must be a string'),
    body('creditNoteSeries').optional().isString().withMessage('Credit note series must be a string'),
    body('lastInvoiceNumber').optional().isInt({ min: 0 }).withMessage('Last invoice number must be a non-negative integer'),
    body('lastCreditNoteNumber').optional().isInt({ min: 0 }).withMessage('Last credit note number must be a non-negative integer'),
    body('seriesYear').optional().isInt({ min: 2000, max: 2100 }).withMessage('Series year must be between 2000 and 2100'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const updateData = req.body;

    // Check if configuration exists
    let configuration = await prisma.companyConfiguration.findFirst({
      where: { isActive: true },
    });

    if (configuration) {
      // Update existing configuration
      configuration = await prisma.companyConfiguration.update({
        where: { id: configuration.id },
        data: updateData,
        select: {
          id: true,
          companyName: true,
          cif: true,
          address: true,
          phone: true,
          email: true,
          logoUrl: true,
          postalCode: true,
          city: true,
          province: true,
          country: true,
          website: true,
          bankAccount: true,
          invoiceSeries: true,
          creditNoteSeries: true,
          lastInvoiceNumber: true,
          lastCreditNoteNumber: true,
          seriesYear: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // Create new configuration
      configuration = await prisma.companyConfiguration.create({
        data: {
          ...updateData,
          isActive: true,
        },
        select: {
          id: true,
          companyName: true,
          cif: true,
          address: true,
          phone: true,
          email: true,
          logoUrl: true,
          postalCode: true,
          city: true,
          province: true,
          country: true,
          website: true,
          bankAccount: true,
          invoiceSeries: true,
          creditNoteSeries: true,
          lastInvoiceNumber: true,
          lastCreditNoteNumber: true,
          seriesYear: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'CompanyConfiguration', configuration.id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Company configuration updated:', {
      configId: configuration.id,
      companyName: configuration.companyName,
      updatedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get import templates
router.get('/import-templates',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('templateType').optional().isIn(['pruebas', 'resultados', 'usuarios']).withMessage('Invalid template type'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
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
    setAuditData(req, AuditAction.DATA_ACCESS, 'ImportTemplate', undefined, {
      filters: { templateType, active },
      pagination: { page, limit, total },
    });

    return res.json({
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

// Create import template
router.post('/import-templates',
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
  asyncHandler(async (req: any, res: Response) => {
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
        fieldsCount: Array.isArray(template.fields) ? template.fields.length : 0,
      },
    });

    logger.info('Import template created:', {
      templateId: template.id,
      name: template.name,
      templateType: template.templateType,
      fieldsCount: Array.isArray(template.fields) ? template.fields.length : 0,
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
router.put('/import-templates/:id',
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
  asyncHandler(async (req: any, res: Response) => {
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

    return res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete import template
router.delete('/import-templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
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

    return res.json({
      success: true,
      message: 'Import template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get backup configurations
router.get('/backup-configurations',
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('backupType').optional().isIn(['full', 'incremental', 'differential']).withMessage('Invalid backup type'),
    query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      backupType,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (backupType) {
      where.backupType = backupType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get backup configurations with pagination
    const [configurations, total] = await Promise.all([
      prisma.backupConfiguration.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          backupType: true,
          retentionDays: true,
          storageLocation: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.backupConfiguration.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'BackupConfiguration', undefined, {
      filters: { backupType, isActive },
      pagination: { page, limit, total },
    });

    return res.json({
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

// Create backup configuration
router.post('/backup-configurations',
  requireAdmin,
  [
    body('name').isString().withMessage('Name is required'),
    body('description').isString().withMessage('Description is required'),
    body('backupType').isIn(['full', 'incremental', 'differential']).withMessage('Invalid backup type'),
    body('retentionDays').isInt({ min: 1 }).withMessage('Retention days must be a positive integer'),
    body('storageLocation').isString().withMessage('Storage location is required'),
    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const configurationData = req.body;

    // Create backup configuration
    const configuration = await prisma.backupConfiguration.create({
      data: {
        ...configurationData,
        isActive: configurationData.isActive || true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        backupType: true,
        retentionDays: true,
        storageLocation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'BackupConfiguration', configuration.id, {
      action: 'CREATE',
      configurationData: {
        name: configuration.name,
        backupType: configuration.backupType,
      },
    });

    logger.info('Backup configuration created:', {
      configId: configuration.id,
      name: configuration.name,
      backupType: configuration.backupType,
    });

    res.status(201).json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update backup configuration
router.put('/backup-configurations/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Configuration ID is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('backupType').optional().isIn(['full', 'incremental', 'differential']).withMessage('Invalid backup type'),
    body('retentionDays').optional().isInt({ min: 1 }).withMessage('Retention days must be a positive integer'),
    body('storageLocation').optional().isString().withMessage('Storage location must be a string'),
    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if configuration exists
    const existingConfig = await prisma.backupConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw notFoundErrorHandler('Backup configuration');
    }

    // Update configuration
    const configuration = await prisma.backupConfiguration.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        backupType: true,
        storageLocation: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'BackupConfiguration', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Backup configuration updated:', {
      configId: configuration.id,
      name: configuration.name,
      backupType: configuration.backupType,
      updatedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: configuration,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete backup configuration
router.delete('/backup-configurations/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Configuration ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if configuration exists
    const existingConfig = await prisma.backupConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw notFoundErrorHandler('Backup configuration');
    }

    // Delete configuration
    await prisma.backupConfiguration.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'BackupConfiguration', id, {
      action: 'DELETE',
      deletedData: {
        name: existingConfig.name,
        backupType: existingConfig.backupType,
      },
    });

    logger.info('Backup configuration deleted:', {
      configId: id,
      name: existingConfig.name,
      backupType: existingConfig.backupType,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      message: 'Backup configuration deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
