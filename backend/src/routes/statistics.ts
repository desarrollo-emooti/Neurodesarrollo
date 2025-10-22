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
      // TODO: Implement family-student relationship in database schema
      // For now, return placeholder values as the relationship doesn't exist yet

      stats = {
        childrenCount: 0, // Requires family-student link in schema
        recentEvaluations: 0, // Requires family-student link
        availableReports: 0, // Requires family-student link
        upcomingEvaluations: 0, // Requires family-student link
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

export default router;
