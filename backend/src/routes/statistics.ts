import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { verifyToken } from './auth';

const router = Router();

// Apply authentication to all routes
router.use(verifyToken);

// GET /api/v1/statistics/dashboard
router.get('/dashboard', asyncHandler(async (req: any, res: Response) => {
  const user = req.user;
  const userType = user.userType;

  let stats: any = {};

  try {
    // Common stats for all users
    const totalUsers = await prisma.user.count({ where: { active: true } });
    const totalStudents = await prisma.student.count({ where: { active: true } });

    // Admin stats
    if (userType === 'ADMINISTRADOR') {
      const activeCenters = await prisma.center.count({ where: { active: true } });
      const pendingUsers = await prisma.user.count({
        where: {
          active: true,
          status: 'PENDING_INVITATION'
        }
      });
      const completedTests = await prisma.testAssignment.count({
        where: { status: 'COMPLETED' }
      });
      const pendingTests = await prisma.testAssignment.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
      });

      stats = {
        totalUsers,
        totalStudents,
        activeCenters,
        completedTests,
        pendingTests,
        pendingUsers,
      };
    }

    // Clinical staff stats
    else if (userType === 'CLINICA') {
      // Get students assigned to this clinician through test assignments
      const assignedTestAssignments = await prisma.testAssignment.findMany({
        where: { assignedTo: user.id },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const assignedStudents = assignedTestAssignments.length;

      const pendingEvaluations = await prisma.testAssignment.count({
        where: {
          assignedTo: user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      const completedEvaluations = await prisma.testAssignment.count({
        where: {
          assignedTo: user.id,
          status: 'COMPLETED'
        }
      });

      // Count test results without interpretation (pending reports)
      const pendingReports = await prisma.testResult.count({
        where: {
          testAssignment: {
            assignedTo: user.id
          },
          interpretation: null
        }
      });

      stats = {
        assignedStudents,
        pendingEvaluations,
        pendingReports,
        completedEvaluations,
      };
    }

    // Orientador stats
    else if (userType === 'ORIENTADOR') {
      const centerId = user.centerId;
      const centerStudents = centerId
        ? await prisma.student.count({ where: { centerId, active: true } })
        : 0;

      // Count future agenda events for this orientador
      const now = new Date();
      const scheduledEvaluations = await prisma.agendaEvent.count({
        where: {
          OR: [
            { createdBy: user.id },
            { studentId: { in: await prisma.student.findMany({
              where: { centerId },
              select: { id: true }
            }).then(students => students.map(s => s.id)) } }
          ],
          startDateTime: { gte: now },
          eventType: 'Evaluación'
        }
      });

      // Count pending events (events in the future)
      const pendingEvents = await prisma.agendaEvent.count({
        where: {
          OR: [
            { createdBy: user.id },
            { studentId: { in: await prisma.student.findMany({
              where: { centerId },
              select: { id: true }
            }).then(students => students.map(s => s.id)) } }
          ],
          startDateTime: { gte: now }
        }
      });

      // Count available reports (test results with interpretation for center students)
      const availableReports = await prisma.testResult.count({
        where: {
          testAssignment: {
            student: {
              centerId
            }
          },
          interpretation: { not: null }
        }
      });

      stats = {
        centerStudents,
        scheduledEvaluations,
        availableReports,
        pendingEvents,
      };
    }

    // Examiner stats
    else if (userType === 'EXAMINADOR') {
      const assignedTests = await prisma.testAssignment.count({
        where: { examinerId: user.id }
      });

      const completedTests = await prisma.testAssignment.count({
        where: {
          examinerId: user.id,
          status: 'COMPLETED'
        }
      });

      const pendingTests = await prisma.testAssignment.count({
        where: {
          examinerId: user.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      stats = {
        assignedTests,
        completedTests,
        pendingTests,
      };
    }

    // Family stats
    else if (userType === 'FAMILIA') {
      // Get children linked to this family user
      const familyRelations = await prisma.studentFamilyRelation.findMany({
        where: { familyUserId: user.id },
        select: { studentId: true },
      });
      const childrenIds = familyRelations.map(r => r.studentId);
      const childrenCount = childrenIds.length;

      // Count recent evaluations (test assignments completed in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentEvaluations = await prisma.testAssignment.count({
        where: {
          studentId: { in: childrenIds },
          testStatus: 'SI', // TestStatus enum value for completed
          completionDate: { gte: thirtyDaysAgo },
        },
      });

      // Count available reports (test results with interpretation)
      const availableReports = await prisma.testResult.count({
        where: {
          studentId: { in: childrenIds },
          interpretation: { not: null },
        },
      });

      // Count upcoming evaluations (future agenda events for their children)
      const now = new Date();
      const upcomingEvaluations = await prisma.agendaEvent.count({
        where: {
          startDate: { gte: now },
          // Note: AgendaEvent doesn't have studentId field currently
          // This will return 0 until the schema is updated
        },
      });

      stats = {
        childrenCount,
        recentEvaluations,
        availableReports,
        upcomingEvaluations,
      };
    }

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener estadísticas',
      },
    });
  }
}));

// GET /api/v1/statistics/dashboard-charts
router.get('/dashboard-charts', asyncHandler(async (req: any, res: Response) => {
  const user = req.user;

  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Evolución de Tests Completados (últimos 7 días)
    const testEvolution = await prisma.$queryRaw`
      SELECT
        DATE(completion_date) as date,
        COUNT(*) as count
      FROM test_assignments
      WHERE completion_date >= ${last7Days}
        AND completion_date <= ${now}
        AND test_status = 'COMPLETADO'
      GROUP BY DATE(completion_date)
      ORDER BY date ASC
    `;

    // Tests por Estado
    const testsByStatus = await Promise.all([
      prisma.testAssignment.count({ where: { testStatus: 'PENDIENTE' } }),
      prisma.testAssignment.count({ where: { testStatus: 'EN_PROGRESO' } }),
      prisma.testAssignment.count({ where: { testStatus: 'COMPLETADO' } }),
    ]).then(([pending, inProgress, completed]) => [
      { status: 'Pendiente', count: pending, fill: '#f59e0b' },
      { status: 'En Progreso', count: inProgress, fill: '#3b82f6' },
      { status: 'Completado', count: completed, fill: '#10b981' },
    ]);

    // Actividad Semanal (usuarios activos por día - últimos 7 días)
    const weeklyActivity = await prisma.$queryRaw`
      SELECT
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as count
      FROM audit_logs
      WHERE timestamp >= ${last7Days}
        AND timestamp <= ${now}
        AND action = 'LOGIN'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    // Completar los días faltantes con 0
    const allDays = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const existingEvolution = (testEvolution as any[]).find(
        (item: any) => item.date?.toISOString().split('T')[0] === dateStr
      );
      const existingActivity = (weeklyActivity as any[]).find(
        (item: any) => item.date?.toISOString().split('T')[0] === dateStr
      );

      allDays.push({
        date: dateStr,
        testsCompleted: existingEvolution ? Number(existingEvolution.count) : 0,
        activeUsers: existingActivity ? Number(existingActivity.count) : 0,
      });
    }

    return res.json({
      success: true,
      data: {
        testEvolution: allDays.map(d => ({ date: d.date, count: d.testsCompleted })),
        testsByStatus,
        weeklyActivity: allDays.map(d => ({ date: d.date, count: d.activeUsers })),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener datos de gráficos',
      },
    });
  }
}));

export default router;
