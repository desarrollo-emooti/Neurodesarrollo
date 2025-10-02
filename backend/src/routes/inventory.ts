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

// Get all inventory items
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('category').optional().isIn(['INFORMATICA', 'MOBILIARIO', 'PROMOCIONAL', 'PRUEBAS']).withMessage('Invalid category'),
    query('status').optional().isIn(['LIBRE', 'OCUPADO', 'REPARACION']).withMessage('Invalid status'),
    query('location').optional().isString().withMessage('Location must be a string'),
    query('stockControlEnabled').optional().isBoolean().withMessage('Stock control enabled must be a boolean'),
    query('testType').optional().isIn(['LINK', 'FISICA']).withMessage('Invalid test type'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      location,
      stockControlEnabled,
      testType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { itemType: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (stockControlEnabled !== undefined) {
      where.stockControlEnabled = stockControlEnabled;
    }

    if (testType) {
      where.testType = testType;
    }

    // Get inventory items with pagination
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          itemType: true,
          inventoryNumber: true,
          status: true,
          location: true,
          maintenanceLocation: true,
          purchaseDate: true,
          serialNumber: true,
          stockControlEnabled: true,
          stock: true,
          stockMinimo: true,
          supplier: true,
          supplierWebsite: true,
          supplierEmail: true,
          supplierPhone: true,
          testType: true,
          requiresStaff: true,
          requiresTablet: true,
          createdAt: true,
          updatedAt: true,
          devices: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              usageStatus: true,
            },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'InventoryItem', null, {
      filters: { search, category, status, location, stockControlEnabled, testType },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: items,
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

// Get inventory item by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Inventory item ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        itemType: true,
        inventoryNumber: true,
        status: true,
        location: true,
        maintenanceLocation: true,
        purchaseDate: true,
        serialNumber: true,
        stockControlEnabled: true,
        stock: true,
        stockMinimo: true,
        supplier: true,
        supplierWebsite: true,
        supplierEmail: true,
        supplierPhone: true,
        testType: true,
        requiresStaff: true,
        requiresTablet: true,
        createdAt: true,
        updatedAt: true,
        devices: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            usageStatus: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw notFoundErrorHandler('Inventory item');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'InventoryItem', id);

    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create inventory item
router.post('/',
  requireClinicalStaff,
  [
    body('code').isString().isLength({ min: 1 }).withMessage('Code is required'),
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    body('category').isIn(['INFORMATICA', 'MOBILIARIO', 'PROMOCIONAL', 'PRUEBAS']).withMessage('Valid category is required'),
    body('itemType').optional().isString().withMessage('Item type must be a string'),
    body('inventoryNumber').optional().isString().withMessage('Inventory number must be a string'),
    body('status').optional().isIn(['LIBRE', 'OCUPADO', 'REPARACION']).withMessage('Invalid status'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('maintenanceLocation').optional().isString().withMessage('Maintenance location must be a string'),
    body('purchaseDate').optional().isISO8601().withMessage('Purchase date must be a valid date'),
    body('serialNumber').optional().isString().withMessage('Serial number must be a string'),
    body('stockControlEnabled').optional().isBoolean().withMessage('Stock control enabled must be a boolean'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('stockMinimo').optional().isInt({ min: 0 }).withMessage('Stock minimo must be a non-negative integer'),
    body('supplier').optional().isString().withMessage('Supplier must be a string'),
    body('supplierWebsite').optional().isString().withMessage('Supplier website must be a string'),
    body('supplierEmail').optional().isEmail().withMessage('Valid supplier email is required'),
    body('supplierPhone').optional().isString().withMessage('Supplier phone must be a string'),
    body('testType').optional().isIn(['LINK', 'FISICA']).withMessage('Invalid test type'),
    body('requiresStaff').optional().isBoolean().withMessage('Requires staff must be a boolean'),
    body('requiresTablet').optional().isBoolean().withMessage('Requires tablet must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const itemData = req.body;

    // Check if code already exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { code: itemData.code },
    });

    if (existingItem) {
      throw validationErrorHandler('Inventory item with this code already exists', {
        field: 'code',
        message: 'Inventory item with this code already exists',
      });
    }

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        ...itemData,
        status: itemData.status || 'LIBRE',
        stockControlEnabled: itemData.stockControlEnabled || false,
        stock: itemData.stock || 0,
        stockMinimo: itemData.stockMinimo || 0,
        requiresStaff: itemData.requiresStaff || false,
        requiresTablet: itemData.requiresTablet || false,
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        itemType: true,
        inventoryNumber: true,
        status: true,
        location: true,
        maintenanceLocation: true,
        purchaseDate: true,
        serialNumber: true,
        stockControlEnabled: true,
        stock: true,
        stockMinimo: true,
        supplier: true,
        supplierWebsite: true,
        supplierEmail: true,
        supplierPhone: true,
        testType: true,
        requiresStaff: true,
        requiresTablet: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'InventoryItem', item.id, {
      action: 'CREATE',
      itemData: {
        code: item.code,
        name: item.name,
        category: item.category,
      },
    });

    logger.info('Inventory item created:', {
      itemId: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update inventory item
router.put('/:id',
  [
    param('id').isString().withMessage('Inventory item ID is required'),
    body('code').optional().isString().isLength({ min: 1 }).withMessage('Code must be a non-empty string'),
    body('name').optional().isString().isLength({ min: 1 }).withMessage('Name must be a non-empty string'),
    body('category').optional().isIn(['INFORMATICA', 'MOBILIARIO', 'PROMOCIONAL', 'PRUEBAS']).withMessage('Invalid category'),
    body('itemType').optional().isString().withMessage('Item type must be a string'),
    body('inventoryNumber').optional().isString().withMessage('Inventory number must be a string'),
    body('status').optional().isIn(['LIBRE', 'OCUPADO', 'REPARACION']).withMessage('Invalid status'),
    body('location').optional().isString().withMessage('Location must be a string'),
    body('maintenanceLocation').optional().isString().withMessage('Maintenance location must be a string'),
    body('purchaseDate').optional().isISO8601().withMessage('Purchase date must be a valid date'),
    body('serialNumber').optional().isString().withMessage('Serial number must be a string'),
    body('stockControlEnabled').optional().isBoolean().withMessage('Stock control enabled must be a boolean'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('stockMinimo').optional().isInt({ min: 0 }).withMessage('Stock minimo must be a non-negative integer'),
    body('supplier').optional().isString().withMessage('Supplier must be a string'),
    body('supplierWebsite').optional().isString().withMessage('Supplier website must be a string'),
    body('supplierEmail').optional().isEmail().withMessage('Valid supplier email is required'),
    body('supplierPhone').optional().isString().withMessage('Supplier phone must be a string'),
    body('testType').optional().isIn(['LINK', 'FISICA']).withMessage('Invalid test type'),
    body('requiresStaff').optional().isBoolean().withMessage('Requires staff must be a boolean'),
    body('requiresTablet').optional().isBoolean().withMessage('Requires tablet must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw notFoundErrorHandler('Inventory item');
    }

    // Check if code already exists (if being updated)
    if (updateData.code && updateData.code !== existingItem.code) {
      const existingCode = await prisma.inventoryItem.findUnique({
        where: { code: updateData.code },
      });

      if (existingCode) {
        throw validationErrorHandler('Inventory item with this code already exists', {
          field: 'code',
          message: 'Inventory item with this code already exists',
        });
      }
    }

    // Update inventory item
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        itemType: true,
        inventoryNumber: true,
        status: true,
        location: true,
        maintenanceLocation: true,
        purchaseDate: true,
        serialNumber: true,
        stockControlEnabled: true,
        stock: true,
        stockMinimo: true,
        supplier: true,
        supplierWebsite: true,
        supplierEmail: true,
        supplierPhone: true,
        testType: true,
        requiresStaff: true,
        requiresTablet: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'InventoryItem', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Inventory item updated:', {
      itemId: item.id,
      code: item.code,
      name: item.name,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete inventory item (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Inventory item ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            devices: true,
          },
        },
      },
    });

    if (!item) {
      throw notFoundErrorHandler('Inventory item');
    }

    // Check if item has associated devices
    if (item._count.devices > 0) {
      throw validationErrorHandler('Cannot delete inventory item with associated devices', {
        devicesCount: item._count.devices,
      });
    }

    // Delete inventory item
    await prisma.inventoryItem.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'InventoryItem', id, {
      action: 'DELETE',
      itemData: {
        code: item.code,
        name: item.name,
        category: item.category,
      },
    });

    logger.info('Inventory item deleted:', {
      itemId: id,
      code: item.code,
      name: item.name,
      category: item.category,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'Inventory item deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get inventory statistics
router.get('/statistics/overview',
  asyncHandler(async (req: any, res) => {
    // Get inventory statistics
    const [
      totalItems,
      itemsByCategory,
      itemsByStatus,
      lowStockItems,
      testItems,
      recentItems,
    ] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.inventoryItem.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.inventoryItem.findMany({
        where: {
          stockControlEnabled: true,
          stock: { lte: prisma.inventoryItem.fields.stockMinimo },
        },
        select: {
          id: true,
          code: true,
          name: true,
          stock: true,
          stockMinimo: true,
        },
      }),
      prisma.inventoryItem.findMany({
        where: { category: 'PRUEBAS' },
        select: {
          id: true,
          code: true,
          name: true,
          testType: true,
          requiresStaff: true,
          requiresTablet: true,
        },
      }),
      prisma.inventoryItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const statistics = {
      totalItems,
      itemsByCategory: itemsByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
      itemsByStatus: itemsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      lowStockItems,
      testItems,
      recentItems,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'InventoryItem', null, {
      action: 'STATISTICS',
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update stock for inventory item
router.post('/:id/stock',
  [
    param('id').isString().withMessage('Inventory item ID is required'),
    body('operation').isIn(['add', 'subtract', 'set']).withMessage('Invalid operation'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { operation, quantity, reason } = req.body;

    // Check if item exists
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw notFoundErrorHandler('Inventory item');
    }

    if (!item.stockControlEnabled) {
      throw validationErrorHandler('Stock control is not enabled for this item');
    }

    // Calculate new stock
    let newStock = item.stock || 0;
    switch (operation) {
      case 'add':
        newStock += quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, newStock - quantity);
        break;
      case 'set':
        newStock = quantity;
        break;
    }

    // Update stock
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: { stock: newStock },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        stockMinimo: true,
        stockControlEnabled: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'InventoryItem', id, {
      action: 'UPDATE_STOCK',
      operation,
      quantity,
      oldStock: item.stock,
      newStock,
      reason,
    });

    logger.info('Inventory item stock updated:', {
      itemId: item.id,
      code: item.code,
      name: item.name,
      operation,
      quantity,
      oldStock: item.stock,
      newStock,
      reason,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedItem,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
