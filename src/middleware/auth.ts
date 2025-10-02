import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: string;
        centerId?: string;
        centerIds?: string[];
      };
    }
  }
}

// JWT Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        centerId: true,
        centerIds: true,
        active: true,
        status: true,
      },
    });

    if (!user || !user.active || user.status !== 'ACTIVE') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive',
        },
        timestamp: new Date().toISOString(),
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      userType: user.userType,
      centerId: user.centerId,
      centerIds: user.centerIds,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          required: allowedRoles,
          current: req.user.userType,
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

// Center-based authorization middleware
export const requireCenterAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Admins have access to all centers
  if (req.user.userType === 'ADMINISTRADOR') {
    return next();
  }

  const centerId = req.params.centerId || req.body.centerId;
  
  if (!centerId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Center ID required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Check if user has access to this center
  const hasAccess = 
    req.user.centerId === centerId || 
    (req.user.centerIds && req.user.centerIds.includes(centerId));

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this center',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        centerId: true,
        centerIds: true,
        active: true,
        status: true,
      },
    });

    if (user && user.active && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        email: user.email,
        userType: user.userType,
        centerId: user.centerId,
        centerIds: user.centerIds,
      };
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};