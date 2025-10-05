import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Define AuthUser type with properties we need
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  userType: string;
  status: string;
  active: boolean;
  centerId: string | null;
  centerIds: string[];
}

// Extend Express types
declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
        },
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        userType: true,
        status: true,
        active: true,
        centerId: true,
        centerIds: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    if (!user.active) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive',
        },
      });
      return;
    }

    // Attach user to request
    req.user = user as AuthUser;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    logger.error('Error in auth middleware:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.userType)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user can access specific center
 */
export const requireCenterAccess = (centerIdParam: string = 'centerId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Admins can access all centers
    if (req.user.userType === 'ADMINISTRADOR') {
      next();
      return;
    }

    const centerId = req.params[centerIdParam] || req.body[centerIdParam] || req.query[centerIdParam];

    if (!centerId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_CENTER_ID',
          message: 'Center ID is required',
        },
      });
      return;
    }

    // Check if user has access to this center
    const hasAccess =
      req.user.centerId === centerId ||
      (req.user.centerIds && req.user.centerIds.includes(centerId));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_CENTER_ACCESS',
          message: 'You do not have access to this center',
        },
      });
      return;
    }

    next();
  };
};
