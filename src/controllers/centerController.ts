import { Request, Response } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';

export class CenterController {
  // Get all centers with pagination and filters
  static async getCenters(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        province, 
        autonomousCommunity,
        active,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = {};
      
      if (type) {
        where.type = type;
      }
      
      if (province) {
        where.province = province;
      }
      
      if (autonomousCommunity) {
        where.autonomousCommunity = autonomousCommunity;
      }
      
      if (active !== undefined) {
        where.active = active === 'true';
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
          { responsable: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [centers, total] = await Promise.all([
        prisma.center.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            _count: {
              select: {
                students: { where: { active: true } },
                users: { where: { active: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.center.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: {
          centers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error getting centers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving centers'
        }
      });
    }
  }

  // Get center by ID
  static async getCenterById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const center = await prisma.center.findUnique({
        where: { id },
        include: {
          users: {
            where: { active: true },
            include: {
              center: true
            }
          },
          students: {
            where: { active: true },
            include: {
              orientador: true,
              testAssignments: {
                where: { active: true },
                orderBy: { assignedDate: 'desc' },
                take: 5
              }
            }
          },
          devices: {
            where: { status: 'activo' }
          },
          agendaEvents: {
            where: { active: true },
            orderBy: { startDate: 'desc' },
            take: 10
          },
          subscriptionConfigurations: {
            where: { isActive: true }
          },
          _count: {
            select: {
              students: { where: { active: true } },
              users: { where: { active: true } },
              devices: { where: { status: 'activo' } }
            }
          }
        }
      });

      if (!center) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CENTER_NOT_FOUND',
            message: 'Center not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { center }
      });
    } catch (error) {
      logger.error('Error getting center by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving center'
        }
      });
    }
  }

  // Create new center
  static async createCenter(req: Request, res: Response) {
    try {
      const centerData = req.body;

      // Generate unique center code if not provided
      if (!centerData.code) {
        const lastCenter = await prisma.center.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        
        const nextNumber = lastCenter ? 
          parseInt(lastCenter.code.split('_').pop() || '0') + 1 : 1;
        centerData.code = `CEN_${nextNumber.toString().padStart(3, '0')}`;
      }

      const center = await prisma.center.create({
        data: centerData,
        include: {
          _count: {
            select: {
              students: { where: { active: true } },
              users: { where: { active: true } }
            }
          }
        }
      });

      logger.info(`Center created: ${center.id} - ${center.name}`);

      res.status(201).json({
        success: true,
        data: { center }
      });
    } catch (error) {
      logger.error('Error creating center:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Center code already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating center'
        }
      });
    }
  }

  // Update center
  static async updateCenter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.code;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const center = await prisma.center.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              students: { where: { active: true } },
              users: { where: { active: true } }
            }
          }
        }
      });

      logger.info(`Center updated: ${center.id} - ${center.name}`);

      res.status(200).json({
        success: true,
        data: { center }
      });
    } catch (error) {
      logger.error('Error updating center:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CENTER_NOT_FOUND',
            message: 'Center not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating center'
        }
      });
    }
  }

  // Delete center (soft delete)
  static async deleteCenter(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if center has active students or users
      const centerWithRelations = await prisma.center.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              students: { where: { active: true } },
              users: { where: { active: true } }
            }
          }
        }
      });

      if (!centerWithRelations) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CENTER_NOT_FOUND',
            message: 'Center not found'
          }
        });
      }

      if (centerWithRelations._count.students > 0 || centerWithRelations._count.users > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CENTER_HAS_RELATIONS',
            message: 'Cannot delete center with active students or users'
          }
        });
      }

      const center = await prisma.center.update({
        where: { id },
        data: { active: false }
      });

      logger.info(`Center deactivated: ${center.id} - ${center.name}`);

      res.status(200).json({
        success: true,
        data: { center },
        message: 'Center deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deleting center:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CENTER_NOT_FOUND',
            message: 'Center not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error deleting center'
        }
      });
    }
  }

  // Get center statistics
  static async getCenterStats(req: Request, res: Response) {
    try {
      const { centerId } = req.query;
      
      const where = centerId ? { centerId: centerId as string } : {};

      const [
        totalCenters,
        centersByType,
        centersByProvince,
        activeCenters,
        recentCenters
      ] = await Promise.all([
        prisma.center.count({ where: { active: true } }),
        prisma.center.groupBy({
          by: ['type'],
          where: { active: true },
          _count: { type: true }
        }),
        prisma.center.groupBy({
          by: ['province'],
          where: { active: true },
          _count: { province: true }
        }),
        prisma.center.count({ where: { active: true } }),
        prisma.center.count({
          where: {
            active: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCenters,
          centersByType,
          centersByProvince,
          activeCenters,
          inactiveCenters: totalCenters - activeCenters,
          recentCenters
        }
      });
    } catch (error) {
      logger.error('Error getting center stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving center statistics'
        }
      });
    }
  }

  // Get center dashboard data
  static async getCenterDashboard(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const center = await prisma.center.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          code: true,
          type: true
        }
      });

      if (!center) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CENTER_NOT_FOUND',
            message: 'Center not found'
          }
        });
      }

      const [
        totalStudents,
        totalUsers,
        totalDevices,
        pendingTestAssignments,
        recentTestResults,
        upcomingAgendaEvents
      ] = await Promise.all([
        prisma.student.count({
          where: { centerId: id, active: true }
        }),
        prisma.user.count({
          where: { 
            OR: [
              { centerId: id },
              { centerIds: { has: id } }
            ],
            active: true 
          }
        }),
        prisma.device.count({
          where: { centerId: id, status: 'activo' }
        }),
        prisma.testAssignment.count({
          where: { 
            student: { centerId: id },
            testStatus: 'PENDIENTE',
            active: true 
          }
        }),
        prisma.testResult.findMany({
          where: { 
            student: { centerId: id }
          },
          orderBy: { executionDate: 'desc' },
          take: 5,
          include: {
            student: {
              select: { fullName: true, studentId: true }
            }
          }
        }),
        prisma.agendaEvent.findMany({
          where: { 
            centerId: id,
            active: true,
            startDate: { gte: new Date() }
          },
          orderBy: { startDate: 'asc' },
          take: 5,
          include: {
            assignedExaminer: {
              select: { fullName: true }
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          center,
          stats: {
            totalStudents,
            totalUsers,
            totalDevices,
            pendingTestAssignments
          },
          recentTestResults,
          upcomingAgendaEvents
        }
      });
    } catch (error) {
      logger.error('Error getting center dashboard:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving center dashboard data'
        }
      });
    }
  }
}
