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

// Get all agenda events
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('eventType').optional().isIn(['EVALUACION', 'REUNION', 'FORMACION', 'OTRO']).withMessage('Invalid event type'),
    query('approvalStatus').optional().isIn(['PENDING_APPROVAL', 'APPROVED', 'REQUEST_CANCELLATION', 'REQUEST_MODIFICATION', 'CANCELLED']).withMessage('Invalid approval status'),
    query('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('assignedExaminerId').optional().isString().withMessage('Assigned examiner ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      centerId,
      eventType,
      approvalStatus,
      priority,
      startDate,
      endDate,
      assignedExaminerId,
      sortBy = 'startDate',
      sortOrder = 'asc',
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
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (centerId) {
      where.centerId = centerId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    if (priority) {
      where.priority = priority;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (assignedExaminerId) {
      where.assignedExaminerId = assignedExaminerId;
    }

    // Get agenda events with pagination
    const [events, total] = await Promise.all([
      prisma.agendaEvent.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          centerId: true,
          startDate: true,
          endDate: true,
          location: true,
          assignedExaminerId: true,
          estimatedStudents: true,
          testsToApply: true,
          reservedDeviceIds: true,
          approvalStatus: true,
          approvedBy: true,
          approvalDate: true,
          orientadorComments: true,
          requestedChanges: true,
          createdBy: true,
          priority: true,
          recurring: true,
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
          assignedExaminer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.agendaEvent.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AgendaEvent', null, {
      filters: { search, centerId, eventType, approvalStatus, priority, startDate, endDate, assignedExaminerId },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: events,
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

// Get agenda event by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Agenda event ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const event = await prisma.agendaEvent.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        centerId: true,
        startDate: true,
        endDate: true,
        location: true,
        assignedExaminerId: true,
        estimatedStudents: true,
        testsToApply: true,
        reservedDeviceIds: true,
        approvalStatus: true,
        approvedBy: true,
        approvalDate: true,
        orientadorComments: true,
        requestedChanges: true,
        createdBy: true,
        priority: true,
        recurring: true,
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
        assignedExaminer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      throw notFoundErrorHandler('Agenda event');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && event.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this agenda event',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(event.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this agenda event',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AgendaEvent', id);

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create agenda event
router.post('/',
  requireClinicalStaff,
  [
    body('title').isString().isLength({ min: 1 }).withMessage('Title is required'),
    body('eventType').isIn(['EVALUACION', 'REUNION', 'FORMACION', 'OTRO']).withMessage('Valid event type is required'),
    body('centerId').isString().withMessage('Center ID is required'),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('endDate').isISO8601().withMessage('End date is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('assignedExaminerId').optional().isString().withMessage('Assigned examiner ID must be a string'),
    body('estimatedStudents').optional().isInt({ min: 0 }).withMessage('Estimated students must be a non-negative integer'),
    body('testsToApply').optional().isArray().withMessage('Tests to apply must be an array'),
    body('reservedDeviceIds').optional().isArray().withMessage('Reserved device IDs must be an array'),
    body('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    body('recurring').optional().isBoolean().withMessage('Recurring must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const eventData = req.body;

    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: eventData.centerId },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions for center
    if (req.user.userType === 'ORIENTADOR' && eventData.centerId !== req.user.centerId) {
      throw validationErrorHandler('Cannot create event in different center');
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(eventData.centerId)) {
        throw validationErrorHandler('Cannot create event in unauthorized center');
      }
    }

    // Check if assigned examiner exists and has access to center
    if (eventData.assignedExaminerId) {
      const examiner = await prisma.user.findUnique({
        where: { id: eventData.assignedExaminerId },
      });

      if (!examiner || (examiner.userType !== 'EXAMINADOR' && examiner.userType !== 'CLINICA')) {
        throw validationErrorHandler('Invalid assigned examiner');
      }

      if (examiner.userType === 'EXAMINADOR' && !examiner.centerIds.includes(eventData.centerId)) {
        throw validationErrorHandler('Examiner does not have access to this center');
      }
    }

    // Create agenda event
    const event = await prisma.agendaEvent.create({
      data: {
        ...eventData,
        createdBy: req.user.id,
        approvalStatus: req.user.userType === 'ORIENTADOR' ? 'APPROVED' : 'PENDING_APPROVAL',
      },
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        centerId: true,
        startDate: true,
        endDate: true,
        location: true,
        assignedExaminerId: true,
        estimatedStudents: true,
        testsToApply: true,
        reservedDeviceIds: true,
        approvalStatus: true,
        approvedBy: true,
        approvalDate: true,
        orientadorComments: true,
        requestedChanges: true,
        createdBy: true,
        priority: true,
        recurring: true,
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
        assignedExaminer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AgendaEvent', event.id, {
      action: 'CREATE',
      eventData: {
        title: event.title,
        eventType: event.eventType,
        centerId: event.centerId,
        startDate: event.startDate,
        endDate: event.endDate,
      },
    });

    logger.info('Agenda event created:', {
      eventId: event.id,
      title: event.title,
      eventType: event.eventType,
      centerId: event.centerId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update agenda event
router.put('/:id',
  [
    param('id').isString().withMessage('Agenda event ID is required'),
    body('title').optional().isString().isLength({ min: 1 }).withMessage('Title must be a non-empty string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('eventType').optional().isIn(['EVALUACION', 'REUNION', 'FORMACION', 'OTRO']).withMessage('Invalid event type'),
    body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('assignedExaminerId').optional().isString().withMessage('Assigned examiner ID must be a string'),
    body('estimatedStudents').optional().isInt({ min: 0 }).withMessage('Estimated students must be a non-negative integer'),
    body('testsToApply').optional().isArray().withMessage('Tests to apply must be an array'),
    body('reservedDeviceIds').optional().isArray().withMessage('Reserved device IDs must be an array'),
    body('priority').optional().isIn(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).withMessage('Invalid priority'),
    body('recurring').optional().isBoolean().withMessage('Recurring must be a boolean'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if event exists
    const existingEvent = await prisma.agendaEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw notFoundErrorHandler('Agenda event');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingEvent.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this agenda event',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingEvent.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this agenda event',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update event
    const event = await prisma.agendaEvent.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        centerId: true,
        startDate: true,
        endDate: true,
        location: true,
        assignedExaminerId: true,
        estimatedStudents: true,
        testsToApply: true,
        reservedDeviceIds: true,
        approvalStatus: true,
        approvedBy: true,
        approvalDate: true,
        orientadorComments: true,
        requestedChanges: true,
        createdBy: true,
        priority: true,
        recurring: true,
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
        assignedExaminer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AgendaEvent', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Agenda event updated:', {
      eventId: event.id,
      title: event.title,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  })
);

// Approve/reject agenda event (Orientador only)
router.post('/:id/approve',
  [
    param('id').isString().withMessage('Agenda event ID is required'),
    body('action').isIn(['approve', 'reject', 'request_changes']).withMessage('Invalid action'),
    body('comments').optional().isString().withMessage('Comments must be a string'),
    body('requestedChanges').optional().isString().withMessage('Requested changes must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { action, comments, requestedChanges } = req.body;

    // Check if user is orientador
    if (req.user.userType !== 'ORIENTADOR') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Only orientadores can approve agenda events',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if event exists
    const existingEvent = await prisma.agendaEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw notFoundErrorHandler('Agenda event');
    }

    // Check if event belongs to orientador's center
    if (existingEvent.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to approve this agenda event',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if event is pending approval
    if (existingEvent.approvalStatus !== 'PENDING_APPROVAL') {
      throw validationErrorHandler('Event is not pending approval');
    }

    // Update event based on action
    let updateData: any = {
      orientadorComments: comments,
    };

    switch (action) {
      case 'approve':
        updateData.approvalStatus = 'APPROVED';
        updateData.approvedBy = req.user.id;
        updateData.approvalDate = new Date();
        break;
      case 'reject':
        updateData.approvalStatus = 'CANCELLED';
        break;
      case 'request_changes':
        updateData.approvalStatus = 'REQUEST_MODIFICATION';
        updateData.requestedChanges = requestedChanges;
        break;
    }

    const event = await prisma.agendaEvent.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        eventType: true,
        centerId: true,
        startDate: true,
        endDate: true,
        approvalStatus: true,
        approvedBy: true,
        approvalDate: true,
        orientadorComments: true,
        requestedChanges: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'AgendaEvent', id, {
      action: 'APPROVE',
      approvalAction: action,
      comments,
      requestedChanges,
    });

    logger.info('Agenda event approval updated:', {
      eventId: event.id,
      title: event.title,
      action,
      approvedBy: req.user.id,
    });

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete agenda event (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Agenda event ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if event exists
    const event = await prisma.agendaEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw notFoundErrorHandler('Agenda event');
    }

    // Soft delete (set active to false)
    await prisma.agendaEvent.update({
      where: { id },
      data: { active: false },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'AgendaEvent', id, {
      action: 'DELETE',
      eventData: {
        title: event.title,
        eventType: event.eventType,
        centerId: event.centerId,
      },
    });

    logger.info('Agenda event deleted:', {
      eventId: id,
      title: event.title,
      eventType: event.eventType,
      centerId: event.centerId,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'Agenda event deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get agenda events for calendar view
router.get('/calendar/events',
  [
    query('startDate').isISO8601().withMessage('Start date is required'),
    query('endDate').isISO8601().withMessage('End date is required'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, centerId } = req.query;

    // Build where clause based on user permissions
    const where: any = {
      startDate: { gte: new Date(startDate) },
      endDate: { lte: new Date(endDate) },
      active: true,
    };

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.centerId = req.user.centerId;
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.centerId = { in: req.user.centerIds };
    }

    // Apply center filter if provided
    if (centerId) {
      where.centerId = centerId;
    }

    // Get agenda events
    const events = await prisma.agendaEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        eventType: true,
        centerId: true,
        startDate: true,
        endDate: true,
        location: true,
        assignedExaminerId: true,
        estimatedStudents: true,
        testsToApply: true,
        reservedDeviceIds: true,
        approvalStatus: true,
        priority: true,
        recurring: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedExaminer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'AgendaEvent', null, {
      action: 'CALENDAR_VIEW',
      filters: { startDate, endDate, centerId },
    });

    res.json({
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
