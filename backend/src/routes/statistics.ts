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

      stats = {
        totalUsers,
        totalStudents,
        activeCenters,
        completedTests: 0, // TODO: Implement when Test model is ready
        pendingTests: 0,
        pendingUsers,
      };
    }

    // Clinical staff stats
    else if (userType === 'CLINICA') {
      stats = {
        assignedStudents: 0, // TODO: Implement when assignments are ready
        pendingEvaluations: 0,
        pendingReports: 0,
        completedEvaluations: 0,
      };
    }

    // Orientador stats
    else if (userType === 'ORIENTADOR') {
      const centerId = user.centerId;
      const centerStudents = centerId
        ? await prisma.student.count({ where: { centerId, active: true } })
        : 0;

      stats = {
        centerStudents,
        scheduledEvaluations: 0, // TODO: Implement when calendar is ready
        availableReports: 0,
        pendingEvents: 0,
      };
    }

    // Examiner stats
    else if (userType === 'EXAMINADOR') {
      stats = {
        assignedTests: 0, // TODO: Implement when Test model is ready
        completedTests: 0,
        pendingTests: 0,
      };
    }

    // Family stats
    else if (userType === 'FAMILIA') {
      // Find students linked to this family user
      const childrenCount = await prisma.student.count({
        where: {
          // TODO: Add relationship when family-student link is implemented
          active: true,
        }
      });

      stats = {
        childrenCount: 0, // TODO: Implement proper family-student relationship
        recentEvaluations: 0,
        availableReports: 0,
        upcomingEvaluations: 0,
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
