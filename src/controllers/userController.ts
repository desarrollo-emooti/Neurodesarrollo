import { Request, Response } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';

export class UserController {
  // Get all users with pagination and filters
  static async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, userType, centerId, status, search } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = {};
      
      if (userType) {
        where.userType = userType;
      }
      
      if (centerId) {
        where.OR = [
          { centerId: centerId },
          { centerIds: { has: centerId } }
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            center: true,
            centers: true,
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving users'
        }
      });
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          center: true,
          centers: true,
          students: true,
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving user'
        }
      });
    }
  }

  // Create new user
  static async createUser(req: Request, res: Response) {
    try {
      const userData = req.body;

      // Generate unique student ID if not provided
      if (!userData.studentId && userData.userType === 'familia') {
        const lastUser = await prisma.user.findFirst({
          where: { userType: 'familia' },
          orderBy: { createdAt: 'desc' }
        });
        
        const nextNumber = lastUser ? 
          parseInt(lastUser.id.split('_').pop() || '0') + 1 : 1;
        userData.studentId = `FAM_${nextNumber.toString().padStart(3, '0')}`;
      }

      const user = await prisma.user.create({
        data: userData,
        include: {
          center: true,
          centers: true,
        }
      });

      logger.info(`User created: ${user.id} - ${user.fullName}`);

      res.status(201).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Email or DNI already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating user'
        }
      });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          center: true,
          centers: true,
        }
      });

      logger.info(`User updated: ${user.id} - ${user.fullName}`);

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Email or DNI already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating user'
        }
      });
    }
  }

  // Delete user (soft delete)
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { active: false },
        include: {
          center: true,
          centers: true,
        }
      });

      logger.info(`User deactivated: ${user.id} - ${user.fullName}`);

      res.status(200).json({
        success: true,
        data: { user },
        message: 'User deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error deleting user'
        }
      });
    }
  }

  // Get user statistics
  static async getUserStats(req: Request, res: Response) {
    try {
      const [totalUsers, activeUsers, usersByType, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.groupBy({
          by: ['userType'],
          _count: { userType: true }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          usersByType,
          recentUsers
        }
      });
    } catch (error) {
      logger.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving user statistics'
        }
      });
    }
  }
}
