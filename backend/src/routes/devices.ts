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

// Get all devices
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('type').optional().isIn(['IPAD', 'TABLET', 'SMARTPHONE', 'LAPTOP']).withMessage('Invalid device type'),
    query('status').optional().isIn(['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']).withMessage('Invalid device status'),
    query('usageStatus').optional().isIn(['LIBRE', 'EN_USO', 'RESERVADO']).withMessage('Invalid usage status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      centerId,
      type,
      status,
      usageStatus,
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
        { serial: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (centerId) {
      where.centerId = centerId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (usageStatus) {
      where.usageStatus = usageStatus;
    }

    // Get devices with pagination
    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          type: true,
          serial: true,
          model: true,
          centerId: true,
          location: true,
          status: true,
          usageStatus: true,
          lastStatusUpdate: true,
          inventoryItemId: true,
          createdAt: true,
          updatedAt: true,
          center: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          inventoryItem: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          reservations: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
      }),
      prisma.device.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Device', undefined, {
      filters: { search, centerId, type, status, usageStatus },
      pagination: { page, limit, total },
    });

    return res.json({
      success: true,
      data: devices,
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

// Get device by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Device ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    const device = await prisma.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        serial: true,
        model: true,
        centerId: true,
        location: true,
        status: true,
        usageStatus: true,
        lastStatusUpdate: true,
        inventoryItemId: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            itemType: true,
          },
        },
        reservations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            reservedBy: true,
            agendaEventId: true,
          },
        },
      },
    });

    if (!device) {
      throw notFoundErrorHandler('Device');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && device.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this device',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(device.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this device',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Device', id);

    return res.json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create device
router.post('/',
  requireClinicalStaff,
  [
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    body('type').isIn(['IPAD', 'TABLET', 'SMARTPHONE', 'LAPTOP']).withMessage('Valid device type is required'),
    body('serial').isString().isLength({ min: 1 }).withMessage('Serial is required'),
    body('centerId').isString().withMessage('Center ID is required'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('status').optional().isIn(['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']).withMessage('Invalid device status'),
    body('usageStatus').optional().isIn(['LIBRE', 'EN_USO', 'RESERVADO']).withMessage('Invalid usage status'),
    body('inventoryItemId').optional().isString().withMessage('Inventory item ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const deviceData = req.body;

    // Check if center exists
    const center = await prisma.center.findUnique({
      where: { id: deviceData.centerId },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions for center
    if (req.user.userType === 'ORIENTADOR' && deviceData.centerId !== req.user.centerId) {
      throw validationErrorHandler('Cannot create device in different center');
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(deviceData.centerId)) {
        throw validationErrorHandler('Cannot create device in unauthorized center');
      }
    }

    // Check if serial already exists
    const existingDevice = await prisma.device.findUnique({
      where: { serial: deviceData.serial },
    });

    if (existingDevice) {
      throw validationErrorHandler('Device with this serial already exists', {
        field: 'serial',
        message: 'Device with this serial already exists',
      });
    }

    // Create device
    const device = await prisma.device.create({
      data: {
        ...deviceData,
        status: deviceData.status || 'ACTIVO',
        usageStatus: deviceData.usageStatus || 'LIBRE',
        lastStatusUpdate: new Date(),
      },
      select: {
        id: true,
        name: true,
        type: true,
        serial: true,
        model: true,
        centerId: true,
        location: true,
        status: true,
        usageStatus: true,
        lastStatusUpdate: true,
        inventoryItemId: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Device', device.id, {
      action: 'CREATE',
      deviceData: {
        name: device.name,
        type: device.type,
        serial: device.serial,
        centerId: device.centerId,
      },
    });

    logger.info('Device created:', {
      deviceId: device.id,
      name: device.name,
      type: device.type,
      serial: device.serial,
      centerId: device.centerId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update device
router.put('/:id',
  [
    param('id').isString().withMessage('Device ID is required'),
    body('name').optional().isString().isLength({ min: 1 }).withMessage('Name must be a non-empty string'),
    body('type').optional().isIn(['IPAD', 'TABLET', 'SMARTPHONE', 'LAPTOP']).withMessage('Invalid device type'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('centerId').optional().isString().withMessage('Center ID must be a string'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('status').optional().isIn(['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']).withMessage('Invalid device status'),
    body('usageStatus').optional().isIn(['LIBRE', 'EN_USO', 'RESERVADO']).withMessage('Invalid usage status'),
    body('inventoryItemId').optional().isString().withMessage('Inventory item ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id },
    });

    if (!existingDevice) {
      throw notFoundErrorHandler('Device');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingDevice.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this device',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingDevice.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this device',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if center exists (if being updated)
    if (updateData.centerId && updateData.centerId !== existingDevice.centerId) {
      const center = await prisma.center.findUnique({
        where: { id: updateData.centerId },
      });

      if (!center) {
        throw notFoundErrorHandler('Center');
      }

      // Check permissions for new center
      if (req.user.userType === 'ORIENTADOR' && updateData.centerId !== req.user.centerId) {
        throw validationErrorHandler('Cannot move device to different center');
      }

      if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
        if (!req.user.centerIds.includes(updateData.centerId)) {
          throw validationErrorHandler('Cannot move device to unauthorized center');
        }
      }
    }

    // Update device
    const device = await prisma.device.update({
      where: { id },
      data: {
        ...updateData,
        lastStatusUpdate: new Date(),
      },
      select: {
        id: true,
        name: true,
        type: true,
        serial: true,
        model: true,
        centerId: true,
        location: true,
        status: true,
        usageStatus: true,
        lastStatusUpdate: true,
        inventoryItemId: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Device', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Device updated:', {
      deviceId: device.id,
      name: device.name,
      serial: device.serial,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    return res.json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete device (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Device ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!device) {
      throw notFoundErrorHandler('Device');
    }

    // Check if device has active reservations
    if (device._count.reservations > 0) {
      throw validationErrorHandler('Cannot delete device with active reservations', {
        reservationsCount: device._count.reservations,
      });
    }

    // Delete device
    await prisma.device.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Device', id, {
      action: 'DELETE',
      deviceData: {
        name: device.name,
        type: device.type,
        serial: device.serial,
        centerId: device.centerId,
      },
    });

    logger.info('Device deleted:', {
      deviceId: id,
      name: device.name,
      type: device.type,
      serial: device.serial,
      centerId: device.centerId,
      deletedBy: req.user.id,
    });

    return res.json({
      success: true,
      data: { message: 'Device deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get device reservations
router.get('/:id/reservations',
  [
    param('id').isString().withMessage('Device ID is required'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw notFoundErrorHandler('Device');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && device.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this device',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(device.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this device',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Build where clause for reservations
    const where: any = { deviceId: id };

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    // Get reservations
    const reservations = await prisma.deviceReservation.findMany({
      where,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        deviceId: true,
        agendaEventId: true,
        startDate: true,
        endDate: true,
        reservedBy: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'DeviceReservation', undefined, {
      action: 'LIST_RESERVATIONS',
      deviceId: id,
      filters: { startDate, endDate },
    });

    return res.json({
      success: true,
      data: reservations,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create device reservation
router.post('/:id/reservations',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('Device ID is required'),
    body('startDate').isISO8601().withMessage('Start date is required'),
    body('endDate').isISO8601().withMessage('End date is required'),
    body('agendaEventId').optional().isString().withMessage('Agenda event ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const { startDate, endDate, agendaEventId } = req.body;

    // Check if device exists
    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      throw notFoundErrorHandler('Device');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && device.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to reserve this device',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(device.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to reserve this device',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if device is available
    if (device.usageStatus !== 'LIBRE') {
      throw validationErrorHandler('Device is not available for reservation');
    }

    // Check for conflicting reservations
    const conflictingReservation = await prisma.deviceReservation.findFirst({
      where: {
        deviceId: id,
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lte: new Date(startDate) },
            endDate: { gte: new Date(startDate) },
          },
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(endDate) },
          },
          {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
          },
        ],
      },
    });

    if (conflictingReservation) {
      throw validationErrorHandler('Device is already reserved for this time period');
    }

    // Create reservation
    const reservation = await prisma.deviceReservation.create({
      data: {
        deviceId: id,
        agendaEventId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reservedBy: req.user.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        deviceId: true,
        agendaEventId: true,
        startDate: true,
        endDate: true,
        reservedBy: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update device usage status
    await prisma.device.update({
      where: { id },
      data: { usageStatus: 'RESERVADO' },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'DeviceReservation', reservation.id, {
      action: 'CREATE',
      reservationData: {
        deviceId: id,
        startDate,
        endDate,
        agendaEventId,
      },
    });

    logger.info('Device reservation created:', {
      reservationId: reservation.id,
      deviceId: id,
      startDate,
      endDate,
      reservedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: reservation,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
