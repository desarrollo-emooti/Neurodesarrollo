import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinica, requireOrientador } from './auth';
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

// Get authorization requests
router.get('/',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['Pendiente', 'Enviado', 'Firmado', 'Rechazado', 'Caducado']).withMessage('Invalid status'),
    query('method').optional().isIn(['email', 'signaturit']).withMessage('Invalid method'),
    query('studentId').optional().isString().withMessage('Student ID must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      method,
      studentId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    // Get authorization requests with pagination
    const [requests, total] = await Promise.all([
      prisma.authorizationRequest.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          studentId: true,
          authorizationType: true,
          method: true,
          status: true,
          recipientEmail: true,
          recipientName: true,
          documentUrl: true,
          signatureId: true,
          sentAt: true,
          signedAt: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
              center: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.authorizationRequest.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AuthorizationRequest', null, {
      filters: { status, method, studentId, startDate, endDate },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: requests,
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

// Get authorization request by ID
router.get('/:id',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Authorization request ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        authorizationType: true,
        method: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        documentUrl: true,
        signatureId: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw notFoundErrorHandler('Authorization request');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AuthorizationRequest', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create authorization request
router.post('/',
  [requireAdmin, requireClinica, requireOrientador],
  [
    body('studentId').isString().withMessage('Student ID is required'),
    body('authorizationType').isString().withMessage('Authorization type is required'),
    body('method').isIn(['email', 'signaturit']).withMessage('Invalid method'),
    body('recipientEmail').isEmail().withMessage('Recipient email must be a valid email'),
    body('recipientName').isString().withMessage('Recipient name is required'),
    body('documentUrl').optional().isString().withMessage('Document URL must be a string'),
    body('expiresAt').optional().isISO8601().withMessage('Expires at must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const requestData = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: requestData.studentId },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Create authorization request
    const request = await prisma.authorizationRequest.create({
      data: {
        ...requestData,
        status: 'Pendiente',
        expiresAt: requestData.expiresAt ? new Date(requestData.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      select: {
        id: true,
        studentId: true,
        authorizationType: true,
        method: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        documentUrl: true,
        signatureId: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationRequest', request.id, {
      action: 'CREATE',
      requestData: {
        studentId: request.studentId,
        authorizationType: request.authorizationType,
        method: request.method,
        recipientEmail: request.recipientEmail,
      },
    });

    logger.info('Authorization request created:', {
      requestId: request.id,
      studentId: request.studentId,
      authorizationType: request.authorizationType,
      method: request.method,
      recipientEmail: request.recipientEmail,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    });
  })
);

// Send authorization request
router.post('/:id/send',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Authorization request ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if request exists
    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw notFoundErrorHandler('Authorization request');
    }

    if (request.status !== 'Pendiente') {
      throw validationErrorHandler('Request is not in pending status');
    }

    // TODO: Implement actual sending logic
    // This would involve:
    // 1. For email: Send email with authorization document
    // 2. For Signaturit: Create signature request and send

    // Update request status
    const updatedRequest = await prisma.authorizationRequest.update({
      where: { id },
      data: {
        status: 'Enviado',
        sentAt: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        authorizationType: true,
        method: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        documentUrl: true,
        signatureId: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationRequest', id, {
      action: 'SEND',
    });

    logger.info('Authorization request sent:', {
      requestId: request.id,
      studentId: request.studentId,
      method: request.method,
      recipientEmail: request.recipientEmail,
      sentBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedRequest,
      timestamp: new Date().toISOString(),
    });
  })
);

// Resend authorization request
router.post('/:id/resend',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Authorization request ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if request exists
    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw notFoundErrorHandler('Authorization request');
    }

    if (request.status === 'Firmado') {
      throw validationErrorHandler('Cannot resend a signed request');
    }

    // TODO: Implement actual resending logic
    // This would involve:
    // 1. For email: Send email with authorization document
    // 2. For Signaturit: Resend signature request

    // Update request status
    const updatedRequest = await prisma.authorizationRequest.update({
      where: { id },
      data: {
        status: 'Enviado',
        sentAt: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        authorizationType: true,
        method: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        documentUrl: true,
        signatureId: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationRequest', id, {
      action: 'RESEND',
    });

    logger.info('Authorization request resent:', {
      requestId: request.id,
      studentId: request.studentId,
      method: request.method,
      recipientEmail: request.recipientEmail,
      resentBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedRequest,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update authorization request status (webhook from Signaturit)
router.put('/:id/status',
  [
    body('status').isIn(['Pendiente', 'Enviado', 'Firmado', 'Rechazado', 'Caducado']).withMessage('Invalid status'),
    body('signatureId').optional().isString().withMessage('Signature ID must be a string'),
    body('signedAt').optional().isISO8601().withMessage('Signed at must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { status, signatureId, signedAt } = req.body;

    // Check if request exists
    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw notFoundErrorHandler('Authorization request');
    }

    // Update request status
    const updatedRequest = await prisma.authorizationRequest.update({
      where: { id },
      data: {
        status,
        signatureId,
        signedAt: signedAt ? new Date(signedAt) : undefined,
      },
      select: {
        id: true,
        studentId: true,
        authorizationType: true,
        method: true,
        status: true,
        recipientEmail: true,
        recipientName: true,
        documentUrl: true,
        signatureId: true,
        sentAt: true,
        signedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationRequest', id, {
      action: 'UPDATE_STATUS',
      status,
      signatureId,
      signedAt,
    });

    logger.info('Authorization request status updated:', {
      requestId: request.id,
      studentId: request.studentId,
      status,
      signatureId,
      signedAt,
      updatedBy: req.user?.id || 'webhook',
    });

    res.json({
      success: true,
      data: updatedRequest,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete authorization request
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Authorization request ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if request exists
    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw notFoundErrorHandler('Authorization request');
    }

    // Delete request
    await prisma.authorizationRequest.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'AuthorizationRequest', id, {
      action: 'DELETE',
      deletedData: {
        studentId: request.studentId,
        authorizationType: request.authorizationType,
        method: request.method,
        recipientEmail: request.recipientEmail,
      },
    });

    logger.info('Authorization request deleted:', {
      requestId: id,
      studentId: request.studentId,
      authorizationType: request.authorizationType,
      method: request.method,
      recipientEmail: request.recipientEmail,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Authorization request deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get authorization templates
router.get('/templates',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('templateType').optional().isString().withMessage('Template type must be a string'),
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

    // Get authorization templates with pagination
    const [templates, total] = await Promise.all([
      prisma.authorizationTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          templateType: true,
          subject: true,
          content: true,
          variables: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.authorizationTemplate.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AuthorizationTemplate', null, {
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

// Create authorization template
router.post('/templates',
  requireAdmin,
  [
    body('name').isString().withMessage('Name is required'),
    body('description').isString().withMessage('Description is required'),
    body('templateType').isString().withMessage('Template type is required'),
    body('subject').isString().withMessage('Subject is required'),
    body('content').isString().withMessage('Content is required'),
    body('variables').isArray().withMessage('Variables must be an array'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const templateData = req.body;

    // Create authorization template
    const template = await prisma.authorizationTemplate.create({
      data: {
        ...templateData,
        active: templateData.active || true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        subject: true,
        content: true,
        variables: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationTemplate', template.id, {
      action: 'CREATE',
      templateData: {
        name: template.name,
        templateType: template.templateType,
        variablesCount: template.variables.length,
      },
    });

    logger.info('Authorization template created:', {
      templateId: template.id,
      name: template.name,
      templateType: template.templateType,
      variablesCount: template.variables.length,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update authorization template
router.put('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
    body('name').optional().isString().withMessage('Name must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('templateType').optional().isString().withMessage('Template type must be a string'),
    body('subject').optional().isString().withMessage('Subject must be a string'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('variables').optional().isArray().withMessage('Variables must be an array'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists
    const existingTemplate = await prisma.authorizationTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Authorization template');
    }

    // Update template
    const template = await prisma.authorizationTemplate.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        templateType: true,
        subject: true,
        content: true,
        variables: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AuthorizationTemplate', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Authorization template updated:', {
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

// Delete authorization template
router.delete('/templates/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Template ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.authorizationTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw notFoundErrorHandler('Authorization template');
    }

    // Delete template
    await prisma.authorizationTemplate.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'AuthorizationTemplate', id, {
      action: 'DELETE',
      deletedData: {
        name: existingTemplate.name,
        templateType: existingTemplate.templateType,
      },
    });

    logger.info('Authorization template deleted:', {
      templateId: id,
      name: existingTemplate.name,
      templateType: existingTemplate.templateType,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Authorization template deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
