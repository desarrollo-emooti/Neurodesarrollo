import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, authErrorHandler, CustomError } from '../middleware/errorHandler';
import { logAuditEvent } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';

const router = Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID']!,
  clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
  callbackURL: process.env['GOOGLE_CALLBACK_URL']!,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;

    logger.info('Google OAuth callback received:', {
      profileId: profile.id,
      email: email,
      name: profile.displayName,
    });

    if (!email) {
      logger.error('No email found in Google profile');
      return done(new Error('No email found in Google profile'), undefined);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update user info if needed
      if (user.fullName !== profile.displayName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { fullName: profile.displayName },
        });
      }
    } else {
      // Create new user with default role
      user = await prisma.user.create({
        data: {
          email: email,
          fullName: profile.displayName || 'Usuario',
          userType: 'FAMILIA', // Default role
          status: 'ACTIVE',
        },
      });

      logger.info('New user created:', {
        userId: user.id,
        email: user.email,
        userType: user.userType,
      });
    }

    return done(null, user);
  } catch (error) {
    logger.error('Error in Google OAuth strategy:', error);
    return done(error as Error, undefined);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        status: true,
        active: true,
        centerId: true,
        centerIds: true,
      },
    });
    done(null, user);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error as Error, undefined);
  }
});

// Generate JWT token
const generateToken = (user: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    userType: user.userType,
  };
  const secret = process.env['JWT_SECRET']!;
  return jwt.sign(payload, secret, {
    expiresIn: process.env['JWT_EXPIRES_IN'] || '7d'
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (user: any) => {
  const payload = { id: user.id };
  const secret = process.env.JWT_REFRESH_SECRET!;
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  } as jwt.SignOptions);
};

// Google OAuth login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  asyncHandler(async (req: any, res: Response) => {
    try {
      const user = req.user;
      
      if (!user) {
        throw authErrorHandler('Authentication failed');
      }

      // Check if user is active
      if (!user.active || user.status !== 'ACTIVE') {
        throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
      }

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Log successful login
      await logAuditEvent(
        user.id,
        AuditAction.LOGIN,
        'User',
        user.id,
        {
          loginMethod: 'Google OAuth',
          userAgent: req.get('User-Agent'),
        },
        req.ip,
        req.get('User-Agent'),
        req.sessionID
      );

      // Redirect to frontend with tokens
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Error in Google OAuth callback:', error);
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=auth_failed`);
    }
  })
);

// Get current user
router.get('/me', asyncHandler(async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw authErrorHandler('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        status: true,
        active: true,
        phone: true,
        dni: true,
        birthDate: true,
        nationality: true,
        address: true,
        country: true,
        autonomousCommunity: true,
        province: true,
        city: true,
        postalCode: true,
        centerId: true,
        centerIds: true,
        specialty: true,
        licenseNumber: true,
        allowedEtapas: true,
        allowedCourses: true,
        allowedGroups: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw authErrorHandler('User not found');
    }

    if (!user.active || user.status !== 'ACTIVE') {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    return res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw authErrorHandler('Invalid token');
    }
    throw error;
  }
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw authErrorHandler('No refresh token provided');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        status: true,
        active: true,
      },
    });

    if (!user) {
      throw authErrorHandler('User not found');
    }

    if (!user.active || user.status !== 'ACTIVE') {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw authErrorHandler('Invalid refresh token');
    }
    throw error;
  }
}));

// Logout
router.post('/logout', asyncHandler(async (req: any, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Log logout
      await logAuditEvent(
        decoded.id,
        AuditAction.LOGOUT,
        'User',
        decoded.id,
        {
          logoutMethod: 'API',
          userAgent: req.get('User-Agent'),
        },
        req.ip,
        req.get('User-Agent'),
        req.sessionID
      );
    }

    return res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Even if token is invalid, consider logout successful
    return res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString(),
    });
  }
}));

// Verify token middleware
export const verifyToken = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw authErrorHandler('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        status: true,
        active: true,
      },
    });

    if (!user) {
      throw authErrorHandler('User not found');
    }

    if (!user.active || user.status !== 'ACTIVE') {
      throw new CustomError('Account is inactive', 403, 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw authErrorHandler('Invalid token');
    }
    throw error;
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      throw authErrorHandler('Authentication required');
    }

    if (!allowedRoles.includes(req.user.userType)) {
      throw new CustomError('Insufficient permissions', 403, 'AUTHORIZATION_ERROR');
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['ADMINISTRADOR']);

// Clinical staff middleware (Admin, Clínica, Orientador)
export const requireClinicalStaff = requireRole(['ADMINISTRADOR', 'CLINICA', 'ORIENTADOR']);

// Examiner middleware (Admin, Clínica, Examinador)
export const requireExaminer = requireRole(['ADMINISTRADOR', 'CLINICA', 'EXAMINADOR']);

export default router;
