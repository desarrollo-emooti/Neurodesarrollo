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

// Get dashboard statistics
router.get('/dashboard',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, centerId } = req.query;

    // Build where clause for date range
    const dateWhere = startDate || endDate ? {
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    } : {};

    // Build where clause for center
    const centerWhere = centerId ? { centerId } : {};

    const [
      totalUsers,
      totalStudents,
      totalCenters,
      totalTestResults,
      totalTestAssignments,
      totalReports,
      totalAgendaEvents,
      totalDevices,
      totalInventoryItems,
      totalSubscriptions,
      totalInvoices,
      usersByType,
      studentsByCenter,
      studentsByEtapa,
      testResultsByMonth,
      testResultsByTest,
      testResultsByCenter,
      agendaEventsByStatus,
      agendaEventsByType,
      devicesByStatus,
      devicesByCenter,
      inventoryItemsByCategory,
      inventoryItemsByStatus,
      subscriptionsByType,
      subscriptionsByStatus,
      invoicesByStatus,
      invoicesByMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.student.count({ where: { active: true } }),
      prisma.center.count({ where: { active: true } }),
      prisma.testResult.count({ where: dateWhere }),
      prisma.testAssignment.count({ where: dateWhere }),
      prisma.report.count({ where: dateWhere }),
      prisma.agendaEvent.count({ where: dateWhere }),
      prisma.device.count({ where: centerWhere }),
      prisma.inventoryItem.count({ where: centerWhere }),
      prisma.subscriptionConfiguration.count({ where: { isActive: true } }),
      prisma.invoice.count({ where: dateWhere }),
      prisma.user.groupBy({
        by: ['userType'],
        where: { active: true },
        _count: { userType: true },
        orderBy: { userType: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['centerId'],
        where: { active: true },
        _count: { centerId: true },
        orderBy: { centerId: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['etapa'],
        where: { active: true },
        _count: { etapa: true },
        orderBy: { etapa: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['createdAt'],
        where: dateWhere,
        _count: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['testName'],
        where: dateWhere,
        _count: { testName: true },
        orderBy: { testName: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['student'],
        where: dateWhere,
        _count: { student: true },
        orderBy: { student: 'asc' },
      }),
      prisma.agendaEvent.groupBy({
        by: ['approvalStatus'],
        where: dateWhere,
        _count: { approvalStatus: true },
        orderBy: { approvalStatus: 'asc' },
      }),
      prisma.agendaEvent.groupBy({
        by: ['eventType'],
        where: dateWhere,
        _count: { eventType: true },
        orderBy: { eventType: 'asc' },
      }),
      prisma.device.groupBy({
        by: ['status'],
        where: centerWhere,
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.device.groupBy({
        by: ['centerId'],
        where: centerWhere,
        _count: { centerId: true },
        orderBy: { centerId: 'asc' },
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: centerWhere,
        _count: { category: true },
        orderBy: { category: 'asc' },
      }),
      prisma.inventoryItem.groupBy({
        by: ['status'],
        where: centerWhere,
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.subscriptionConfiguration.groupBy({
        by: ['paymentType'],
        where: { isActive: true },
        _count: { paymentType: true },
        orderBy: { paymentType: 'asc' },
      }),
      prisma.subscriptionConfiguration.groupBy({
        by: ['isActive'],
        where: { isActive: true },
        _count: { isActive: true },
        orderBy: { isActive: 'asc' },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where: dateWhere,
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where: dateWhere,
        _count: { invoiceDate: true },
        orderBy: { invoiceDate: 'asc' },
      }),
    ]);

    const statistics = {
      overview: {
        totalUsers,
        totalStudents,
        totalCenters,
        totalTestResults,
        totalTestAssignments,
        totalReports,
        totalAgendaEvents,
        totalDevices,
        totalInventoryItems,
        totalSubscriptions,
        totalInvoices,
      },
      users: {
        byType: usersByType.map(item => ({
          type: item.userType,
          count: item._count.userType,
        })),
      },
      students: {
        byCenter: studentsByCenter.map(item => ({
          centerId: item.centerId,
          count: item._count.centerId,
        })),
        byEtapa: studentsByEtapa.map(item => ({
          etapa: item.etapa,
          count: item._count.etapa,
        })),
      },
      testResults: {
        byMonth: testResultsByMonth.map(item => ({
          month: item.createdAt,
          count: item._count.createdAt,
        })),
        byTest: testResultsByTest.map(item => ({
          testName: item.testName,
          count: item._count.testName,
        })),
        byCenter: testResultsByCenter.map(item => ({
          center: item.student,
          count: item._count.student,
        })),
      },
      agendaEvents: {
        byStatus: agendaEventsByStatus.map(item => ({
          status: item.approvalStatus,
          count: item._count.approvalStatus,
        })),
        byType: agendaEventsByType.map(item => ({
          type: item.eventType,
          count: item._count.eventType,
        })),
      },
      devices: {
        byStatus: devicesByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        byCenter: devicesByCenter.map(item => ({
          centerId: item.centerId,
          count: item._count.centerId,
        })),
      },
      inventoryItems: {
        byCategory: inventoryItemsByCategory.map(item => ({
          category: item.category,
          count: item._count.category,
        })),
        byStatus: inventoryItemsByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
      },
      subscriptions: {
        byType: subscriptionsByType.map(item => ({
          type: item.paymentType,
          count: item._count.paymentType,
        })),
        byStatus: subscriptionsByStatus.map(item => ({
          status: item.isActive,
          count: item._count.isActive,
        })),
      },
      invoices: {
        byStatus: invoicesByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        byMonth: invoicesByMonth.map(item => ({
          month: item.invoiceDate,
          count: item._count.invoiceDate,
        })),
      },
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Statistics', null, {
      action: 'VIEW_DASHBOARD',
      filters: { startDate, endDate, centerId },
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get test results statistics
router.get('/test-results',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('testName').optional().isString().withMessage('Test name must be a string'),
    query('etapa').optional().isString().withMessage('Etapa must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, centerId, testName, etapa } = req.query;

    // Build where clause
    const where: any = {};

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    if (testName) {
      where.testName = testName;
    }

    if (centerId) {
      where.student = { centerId };
    }

    if (etapa) {
      where.student = { etapa };
    }

    const [
      totalResults,
      resultsByTest,
      resultsByCenter,
      resultsByEtapa,
      resultsByMonth,
      resultsByInterpretation,
      averageScores,
      scoreDistribution,
    ] = await Promise.all([
      prisma.testResult.count({ where }),
      prisma.testResult.groupBy({
        by: ['testName'],
        where,
        _count: { testName: true },
        orderBy: { testName: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['student'],
        where,
        _count: { student: true },
        orderBy: { student: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['student'],
        where,
        _count: { student: true },
        orderBy: { student: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['createdAt'],
        where,
        _count: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['interpretation'],
        where,
        _count: { interpretation: true },
        orderBy: { interpretation: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['testName'],
        where,
        _avg: { rawScore: true },
        orderBy: { testName: 'asc' },
      }),
      prisma.testResult.groupBy({
        by: ['rawScore'],
        where,
        _count: { rawScore: true },
        orderBy: { rawScore: 'asc' },
      }),
    ]);

    const statistics = {
      totalResults,
      resultsByTest: resultsByTest.map(item => ({
        testName: item.testName,
        count: item._count.testName,
      })),
      resultsByCenter: resultsByCenter.map(item => ({
        center: item.student,
        count: item._count.student,
      })),
      resultsByEtapa: resultsByEtapa.map(item => ({
        etapa: item.student,
        count: item._count.student,
      })),
      resultsByMonth: resultsByMonth.map(item => ({
        month: item.createdAt,
        count: item._count.createdAt,
      })),
      resultsByInterpretation: resultsByInterpretation.map(item => ({
        interpretation: item.interpretation,
        count: item._count.interpretation,
      })),
      averageScores: resultsByTest.map(item => ({
        testName: item.testName,
        averageScore: item._avg.rawScore,
      })),
      scoreDistribution: scoreDistribution.map(item => ({
        score: item.rawScore,
        count: item._count.rawScore,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Statistics', null, {
      action: 'VIEW_TEST_RESULTS',
      filters: { startDate, endDate, centerId, testName, etapa },
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get student statistics
router.get('/students',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('etapa').optional().isString().withMessage('Etapa must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, centerId, etapa } = req.query;

    // Build where clause
    const where: any = { active: true };

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    if (centerId) {
      where.centerId = centerId;
    }

    if (etapa) {
      where.etapa = etapa;
    }

    const [
      totalStudents,
      studentsByCenter,
      studentsByEtapa,
      studentsByCourse,
      studentsByClassGroup,
      studentsByGender,
      studentsByNationality,
      studentsByConsentStatus,
      studentsByPaymentStatus,
      studentsByMonth,
    ] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.groupBy({
        by: ['centerId'],
        where,
        _count: { centerId: true },
        orderBy: { centerId: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['etapa'],
        where,
        _count: { etapa: true },
        orderBy: { etapa: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['course'],
        where,
        _count: { course: true },
        orderBy: { course: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['classGroup'],
        where,
        _count: { classGroup: true },
        orderBy: { classGroup: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['gender'],
        where,
        _count: { gender: true },
        orderBy: { gender: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['nationality'],
        where,
        _count: { nationality: true },
        orderBy: { nationality: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['consentGiven'],
        where,
        _count: { consentGiven: true },
        orderBy: { consentGiven: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['paymentStatus'],
        where,
        _count: { paymentStatus: true },
        orderBy: { paymentStatus: 'asc' },
      }),
      prisma.student.groupBy({
        by: ['createdAt'],
        where,
        _count: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const statistics = {
      totalStudents,
      studentsByCenter: studentsByCenter.map(item => ({
        centerId: item.centerId,
        count: item._count.centerId,
      })),
      studentsByEtapa: studentsByEtapa.map(item => ({
        etapa: item.etapa,
        count: item._count.etapa,
      })),
      studentsByCourse: studentsByCourse.map(item => ({
        course: item.course,
        count: item._count.course,
      })),
      studentsByClassGroup: studentsByClassGroup.map(item => ({
        classGroup: item.classGroup,
        count: item._count.classGroup,
      })),
      studentsByGender: studentsByGender.map(item => ({
        gender: item.gender,
        count: item._count.gender,
      })),
      studentsByNationality: studentsByNationality.map(item => ({
        nationality: item.nationality,
        count: item._count.nationality,
      })),
      studentsByConsentStatus: studentsByConsentStatus.map(item => ({
        consentStatus: item.consentGiven,
        count: item._count.consentGiven,
      })),
      studentsByPaymentStatus: studentsByPaymentStatus.map(item => ({
        paymentStatus: item.paymentStatus,
        count: item._count.paymentStatus,
      })),
      studentsByMonth: studentsByMonth.map(item => ({
        month: item.createdAt,
        count: item._count.createdAt,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Statistics', null, {
      action: 'VIEW_STUDENTS',
      filters: { startDate, endDate, centerId, etapa },
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get center statistics
router.get('/centers',
  [requireAdmin, requireClinica, requireOrientador],
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
    query('type').optional().isIn(['publico', 'concertado', 'privado']).withMessage('Invalid center type'),
    query('province').optional().isString().withMessage('Province must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { startDate, endDate, type, province } = req.query;

    // Build where clause
    const where: any = { active: true };

    if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { lte: new Date(endDate) };
    }

    if (type) {
      where.type = type;
    }

    if (province) {
      where.province = province;
    }

    const [
      totalCenters,
      centersByType,
      centersByProvince,
      centersByAutonomousCommunity,
      centersByMonth,
      averageStudentsPerCenter,
    ] = await Promise.all([
      prisma.center.count({ where }),
      prisma.center.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
        orderBy: { type: 'asc' },
      }),
      prisma.center.groupBy({
        by: ['province'],
        where,
        _count: { province: true },
        orderBy: { province: 'asc' },
      }),
      prisma.center.groupBy({
        by: ['autonomousCommunity'],
        where,
        _count: { autonomousCommunity: true },
        orderBy: { autonomousCommunity: 'asc' },
      }),
      prisma.center.groupBy({
        by: ['createdAt'],
        where,
        _count: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.center.aggregate({
        where,
        _avg: { totalStudents: true },
      }),
    ]);

    const statistics = {
      totalCenters,
      centersByType: centersByType.map(item => ({
        type: item.type,
        count: item._count.type,
      })),
      centersByProvince: centersByProvince.map(item => ({
        province: item.province,
        count: item._count.province,
      })),
      centersByAutonomousCommunity: centersByAutonomousCommunity.map(item => ({
        autonomousCommunity: item.autonomousCommunity,
        count: item._count.autonomousCommunity,
      })),
      centersByMonth: centersByMonth.map(item => ({
        month: item.createdAt,
        count: item._count.createdAt,
      })),
      averageStudentsPerCenter: averageStudentsPerCenter._avg.totalStudents,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Statistics', null, {
      action: 'VIEW_CENTERS',
      filters: { startDate, endDate, type, province },
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get financial statistics
router.get('/financial',
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
      where.centerId = centerId;
    }

    const [
      totalSubscriptions,
      totalInvoices,
      totalRevenue,
      subscriptionsByType,
      subscriptionsByStatus,
      invoicesByStatus,
      invoicesByMonth,
      revenueByMonth,
      averageInvoiceAmount,
      topPayingCenters,
    ] = await Promise.all([
      prisma.subscriptionConfiguration.count({ where: { isActive: true } }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'Pagada' },
        _sum: { totalAmount: true },
      }),
      prisma.subscriptionConfiguration.groupBy({
        by: ['paymentType'],
        where: { isActive: true },
        _count: { paymentType: true },
        orderBy: { paymentType: 'asc' },
      }),
      prisma.subscriptionConfiguration.groupBy({
        by: ['isActive'],
        where: { isActive: true },
        _count: { isActive: true },
        orderBy: { isActive: 'asc' },
      }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where,
        _count: { invoiceDate: true },
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.invoice.groupBy({
        by: ['invoiceDate'],
        where: { ...where, status: 'Pagada' },
        _sum: { totalAmount: true },
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'Pagada' },
        _avg: { totalAmount: true },
      }),
      prisma.invoice.groupBy({
        by: ['clientName'],
        where: { ...where, status: 'Pagada' },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    const statistics = {
      totalSubscriptions,
      totalInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      subscriptionsByType: subscriptionsByType.map(item => ({
        type: item.paymentType,
        count: item._count.paymentType,
      })),
      subscriptionsByStatus: subscriptionsByStatus.map(item => ({
        status: item.isActive,
        count: item._count.isActive,
      })),
      invoicesByStatus: invoicesByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      invoicesByMonth: invoicesByMonth.map(item => ({
        month: item.invoiceDate,
        count: item._count.invoiceDate,
      })),
      revenueByMonth: revenueByMonth.map(item => ({
        month: item.invoiceDate,
        revenue: item._sum.totalAmount || 0,
      })),
      averageInvoiceAmount: averageInvoiceAmount._avg.totalAmount || 0,
      topPayingCenters: topPayingCenters.map(item => ({
        centerName: item.clientName,
        totalAmount: item._sum.totalAmount || 0,
      })),
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Statistics', null, {
      action: 'VIEW_FINANCIAL',
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
