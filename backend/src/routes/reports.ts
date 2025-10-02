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

// Get reports
router.get('/',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('studentId').optional().isString().withMessage('Student ID must be a string'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('status').optional().isIn(['borrador', 'revision_clinica', 'revision_orientador', 'aprobado', 'enviado']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      studentId,
      centerId,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (centerId) {
      where.student = { centerId };
    }

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    // Get reports with pagination
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          studentId: true,
          title: true,
          content: true,
          status: true,
          clinicalReviewerId: true,
          orientadorReviewerId: true,
          clinicalReviewDate: true,
          orientadorReviewDate: true,
          approvedDate: true,
          sentDate: true,
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
          clinicalReviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          orientadorReviewer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Report', null, {
      filters: { studentId, centerId, status, startDate, endDate },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: reports,
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

// Get report by ID
router.get('/:id',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Report', id, {
      action: 'VIEW_DETAIL',
    });

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create report
router.post('/',
  [requireAdmin, requireClinica, requireOrientador],
  [
    body('studentId').isString().withMessage('Student ID is required'),
    body('title').isString().withMessage('Title is required'),
    body('content').isString().withMessage('Content is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const reportData = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: reportData.studentId },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        ...reportData,
        status: 'borrador',
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', report.id, {
      action: 'CREATE',
      reportData: {
        studentId: report.studentId,
        title: report.title,
        status: report.status,
      },
    });

    logger.info('Report created:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      status: report.status,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update report
router.put('/:id',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Report ID is required'),
    body('title').optional().isString().withMessage('Title must be a string'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('status').optional().isIn(['borrador', 'revision_clinica', 'revision_orientador', 'aprobado', 'enviado']).withMessage('Invalid status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if report exists
    const existingReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      throw notFoundErrorHandler('Report');
    }

    // Update report
    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', id, {
      action: 'UPDATE',
      updateData,
    });

    logger.info('Report updated:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      status: report.status,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    });
  })
);

// Submit report for clinical review
router.post('/:id/submit-clinical-review',
  requireClinica,
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    if (report.status !== 'borrador') {
      throw validationErrorHandler('Report is not in draft status');
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'revision_clinica',
        clinicalReviewerId: req.user.id,
        clinicalReviewDate: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', id, {
      action: 'SUBMIT_CLINICAL_REVIEW',
    });

    logger.info('Report submitted for clinical review:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      clinicalReviewerId: req.user.id,
    });

    res.json({
      success: true,
      data: updatedReport,
      timestamp: new Date().toISOString(),
    });
  })
);

// Submit report for orientador review
router.post('/:id/submit-orientador-review',
  requireOrientador,
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    if (report.status !== 'revision_clinica') {
      throw validationErrorHandler('Report is not in clinical review status');
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'revision_orientador',
        orientadorReviewerId: req.user.id,
        orientadorReviewDate: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', id, {
      action: 'SUBMIT_ORIENTADOR_REVIEW',
    });

    logger.info('Report submitted for orientador review:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      orientadorReviewerId: req.user.id,
    });

    res.json({
      success: true,
      data: updatedReport,
      timestamp: new Date().toISOString(),
    });
  })
);

// Approve report
router.post('/:id/approve',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    if (report.status !== 'revision_orientador') {
      throw validationErrorHandler('Report is not in orientador review status');
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'aprobado',
        approvedDate: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', id, {
      action: 'APPROVE',
    });

    logger.info('Report approved:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      approvedBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedReport,
      timestamp: new Date().toISOString(),
    });
  })
);

// Send report
router.post('/:id/send',
  [requireAdmin, requireClinica, requireOrientador],
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    if (report.status !== 'aprobado') {
      throw validationErrorHandler('Report is not approved yet');
    }

    // TODO: Implement actual sending logic
    // This would involve:
    // 1. Generate PDF from report content
    // 2. Send email to student's family
    // 3. Store PDF in file storage

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: 'enviado',
        sentDate: new Date(),
      },
      select: {
        id: true,
        studentId: true,
        title: true,
        content: true,
        status: true,
        clinicalReviewerId: true,
        orientadorReviewerId: true,
        clinicalReviewDate: true,
        orientadorReviewDate: true,
        approvedDate: true,
        sentDate: true,
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
        clinicalReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        orientadorReviewer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Report', id, {
      action: 'SEND',
    });

    logger.info('Report sent:', {
      reportId: report.id,
      studentId: report.studentId,
      title: report.title,
      sentBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedReport,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete report
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Report ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw notFoundErrorHandler('Report');
    }

    // Delete report
    await prisma.report.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Report', id, {
      action: 'DELETE',
      deletedData: {
        studentId: report.studentId,
        title: report.title,
        status: report.status,
      },
    });

    logger.info('Report deleted:', {
      reportId: id,
      studentId: report.studentId,
      title: report.title,
      status: report.status,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Report deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get report statistics
router.get('/statistics',
  requireAdmin,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, centerId } = req.query;

    // Build where clause
    const where: any = {};

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    if (centerId) {
      where.student = { centerId };
    }

    const [
      totalReports,
      reportsByStatus,
      reportsByCenter,
      reportsByMonth,
    ] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.report.groupBy({
        by: ['student'],
        where,
        _count: { student: true },
        orderBy: { student: 'asc' },
      }),
      prisma.report.groupBy({
        by: ['createdAt'],
        where,
        _count: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const statistics = {
      totalReports,
      reportsByStatus: reportsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      reportsByCenter: reportsByCenter.map(item => ({
        center: item.student,
        count: item._count.student,
      })),
      reportsByMonth: reportsByMonth.map(item => ({
        month: item.createdAt,
        count: item._count.createdAt,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Report', null, {
      action: 'VIEW_STATISTICS',
      filters: { startDate, endDate, centerId },
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
