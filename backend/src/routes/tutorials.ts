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

// Get tutorials
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('userType').optional().isIn(['administrador', 'clinica', 'orientador', 'examinador', 'familia']).withMessage('Invalid user type'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
    query('search').optional().isString().withMessage('Search must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      userType,
      active,
      search,
      sortBy = 'title',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (userType) {
      where.userTypes = { has: userType };
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get tutorials with pagination
    const [tutorials, total] = await Promise.all([
      prisma.tutorial.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          userTypes: true,
          content: true,
          videoUrl: true,
          imageUrl: true,
          tags: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.tutorial.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Tutorial', null, {
      filters: { category, userType, active, search },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: tutorials,
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

// Get tutorial by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Tutorial ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const tutorial = await prisma.tutorial.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        userTypes: true,
        content: true,
        videoUrl: true,
        imageUrl: true,
        tags: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tutorial) {
      throw notFoundErrorHandler('Tutorial');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Tutorial', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: tutorial,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create tutorial
router.post('/',
  requireAdmin,
  [
    body('title').isString().withMessage('Title is required'),
    body('description').isString().withMessage('Description is required'),
    body('category').isString().withMessage('Category is required'),
    body('userTypes').isArray().withMessage('User types must be an array'),
    body('userTypes.*').isIn(['administrador', 'clinica', 'orientador', 'examinador', 'familia']).withMessage('Invalid user type'),
    body('content').isString().withMessage('Content is required'),
    body('videoUrl').optional().isString().withMessage('Video URL must be a string'),
    body('imageUrl').optional().isString().withMessage('Image URL must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').isString().withMessage('Tag must be a string'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const tutorialData = req.body;

    // Create tutorial
    const tutorial = await prisma.tutorial.create({
      data: {
        ...tutorialData,
        active: tutorialData.active || true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        userTypes: true,
        content: true,
        videoUrl: true,
        imageUrl: true,
        tags: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Tutorial', tutorial.id, {
      action: 'CREATE',
      tutorialData: {
        title: tutorial.title,
        category: tutorial.category,
        userTypes: tutorial.userTypes,
        tagsCount: tutorial.tags.length,
      },
    });

    logger.info('Tutorial created:', {
      tutorialId: tutorial.id,
      title: tutorial.title,
      category: tutorial.category,
      userTypes: tutorial.userTypes,
      tagsCount: tutorial.tags.length,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: tutorial,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update tutorial
router.put('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Tutorial ID is required'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('userTypes').optional().isArray().withMessage('User types must be an array'),
    body('userTypes.*').optional().isIn(['administrador', 'clinica', 'orientador', 'examinador', 'familia']).withMessage('Invalid user type'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('videoUrl').optional().isString().withMessage('Video URL must be a string'),
    body('imageUrl').optional().isString().withMessage('Image URL must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().isString().withMessage('Tag must be a string'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if tutorial exists
    const existingTutorial = await prisma.tutorial.findUnique({
      where: { id },
    });

    if (!existingTutorial) {
      throw notFoundErrorHandler('Tutorial');
    }

    // Update tutorial
    const tutorial = await prisma.tutorial.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        userTypes: true,
        content: true,
        videoUrl: true,
        imageUrl: true,
        tags: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Tutorial', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Tutorial updated:', {
      tutorialId: tutorial.id,
      title: tutorial.title,
      category: tutorial.category,
      userTypes: tutorial.userTypes,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: tutorial,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete tutorial
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Tutorial ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if tutorial exists
    const existingTutorial = await prisma.tutorial.findUnique({
      where: { id },
    });

    if (!existingTutorial) {
      throw notFoundErrorHandler('Tutorial');
    }

    // Delete tutorial
    await prisma.tutorial.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Tutorial', id, {
      action: 'DELETE',
      deletedData: {
        title: existingTutorial.title,
        category: existingTutorial.category,
        userTypes: existingTutorial.userTypes,
      },
    });

    logger.info('Tutorial deleted:', {
      tutorialId: id,
      title: existingTutorial.title,
      category: existingTutorial.category,
      userTypes: existingTutorial.userTypes,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Tutorial deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get tutorial categories
router.get('/categories',
  asyncHandler(async (req: any, res) => {
    const categories = await prisma.tutorial.groupBy({
      by: ['category'],
      where: { active: true },
      _count: { category: true },
      orderBy: { category: 'asc' },
    });

    const categoryData = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Tutorial', null, {
      action: 'VIEW_CATEGORIES',
    });

    res.json({
      success: true,
      data: categoryData,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get tutorial tags
router.get('/tags',
  asyncHandler(async (req: any, res) => {
    const tutorials = await prisma.tutorial.findMany({
      where: { active: true },
      select: { tags: true },
    });

    const allTags = tutorials.flatMap(tutorial => tutorial.tags);
    const uniqueTags = [...new Set(allTags)];
    const tagCounts = uniqueTags.map(tag => ({
      name: tag,
      count: allTags.filter(t => t === tag).length,
    }));

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Tutorial', null, {
      action: 'VIEW_TAGS',
    });

    res.json({
      success: true,
      data: tagCounts,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get tutorial statistics
router.get('/statistics',
  requireAdmin,
  asyncHandler(async (req: any, res) => {
    const [
      totalTutorials,
      activeTutorials,
      tutorialsByCategory,
      tutorialsByUserType,
    ] = await Promise.all([
      prisma.tutorial.count(),
      prisma.tutorial.count({ where: { active: true } }),
      prisma.tutorial.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { category: 'asc' },
      }),
      prisma.tutorial.findMany({
        select: { userTypes: true },
      }),
    ]);

    const userTypeCounts = tutorialsByUserType.reduce((acc, tutorial) => {
      tutorial.userTypes.forEach(userType => {
        acc[userType] = (acc[userType] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const statistics = {
      totalTutorials,
      activeTutorials,
      inactiveTutorials: totalTutorials - activeTutorials,
      tutorialsByCategory: tutorialsByCategory.map(cat => ({
        category: cat.category,
        count: cat._count.category,
      })),
      tutorialsByUserType: Object.entries(userTypeCounts).map(([userType, count]) => ({
        userType,
        count,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Tutorial', null, {
      action: 'VIEW_STATISTICS',
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
