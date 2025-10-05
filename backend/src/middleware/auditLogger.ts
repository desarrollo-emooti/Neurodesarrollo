import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AuditAction } from '@prisma/client';
import crypto from 'crypto';
import { AuthUser } from './auth';

interface AuditRequest extends Request {
  user?: AuthUser;
  auditData?: {
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    details?: any;
  };
}

export const auditLogger = async (req: AuditRequest, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store original res.json to intercept response
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Log the audit after response is sent
    setImmediate(async () => {
      try {
        await logAuditEventInternal(req, res, startTime, body);
      } catch (error) {
        logger.error('Failed to log audit event:', error);
      }
    });
    
    return originalJson.call(this, body);
  };
  
  next();
};

async function logAuditEventInternal(
  req: AuditRequest,
  res: Response,
  startTime: number,
  responseBody: any
) {
  try {
    // Skip audit logging for certain endpoints
    if (shouldSkipAudit(req)) {
      return;
    }

    const userId = req.user?.id;
    const action = determineAuditAction(req, res);
    
    if (!action) {
      return; // No audit action needed
    }

    const resourceType = determineResourceType(req);
    const resourceId = determineResourceId(req);
    const details = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      userAgent: req.get('User-Agent'),
      ...(req.auditData?.details || {}),
    };

    // Get previous hash for blockchain-like integrity
    const previousLog = await prisma.auditLog.findFirst({
      where: { userId: userId || null },
      orderBy: { timestamp: 'desc' },
      select: { integrityHash: true },
    });

    const previousHash = previousLog?.integrityHash || '';

    // Create integrity hash
    const dataToHash = JSON.stringify({
      userId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      previousHash,
    });

    const integrityHash = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    // Create audit log
    const logData: any = {
      action,
      details,
      integrityHash,
      previousHash: previousHash || '',
    };

    if (userId) logData.userId = userId;
    if (resourceType) logData.resourceType = resourceType;
    if (resourceId) logData.resourceId = resourceId;
    if (req.ip) logData.ipAddress = req.ip;
    else if ((req as any).connection?.remoteAddress) logData.ipAddress = (req as any).connection.remoteAddress;
    if (req.get('User-Agent')) logData.userAgent = req.get('User-Agent');
    if ((req as any).sessionID) logData.sessionId = (req as any).sessionID;

    await prisma.auditLog.create({
      data: logData,
    });

    logger.debug('Audit log created:', {
      userId,
      action,
      resourceType,
      resourceId,
      statusCode: res.statusCode,
    });
  } catch (error) {
    logger.error('Error creating audit log:', error);
  }
}

function shouldSkipAudit(req: AuditRequest): boolean {
  const skipPaths = [
    '/health',
    '/api/v1/auth/google',
    '/api/v1/auth/callback',
    '/api/public',
  ];

  return skipPaths.some(path => req.originalUrl.startsWith(path));
}

function determineAuditAction(req: AuditRequest, res: Response): AuditAction | null {
  // Check if audit action is explicitly set
  if (req.auditData?.action) {
    return req.auditData.action;
  }

  // Determine action based on HTTP method and status code
  if (res.statusCode >= 400) {
    if (res.statusCode === 401) {
      return AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT;
    }
    return AuditAction.SECURITY_EVENT;
  }

  switch (req.method) {
    case 'GET':
      return AuditAction.DATA_ACCESS;
    case 'POST':
      if (req.originalUrl.includes('/auth/login')) {
        return AuditAction.LOGIN;
      }
      if (req.originalUrl.includes('/auth/logout')) {
        return AuditAction.LOGOUT;
      }
      if (req.originalUrl.includes('/export')) {
        return AuditAction.DATA_EXPORT;
      }
      return AuditAction.DATA_MODIFICATION;
    case 'PUT':
    case 'PATCH':
      return AuditAction.DATA_MODIFICATION;
    case 'DELETE':
      return AuditAction.DATA_DELETION;
    default:
      return null;
  }
}

function determineResourceType(req: AuditRequest): string | null {
  // Check if resource type is explicitly set
  if (req.auditData?.resourceType) {
    return req.auditData.resourceType;
  }

  // Extract resource type from URL
  const urlParts = req.originalUrl.split('/');
  const apiIndex = urlParts.findIndex(part => part === 'api');

  if (apiIndex !== -1 && urlParts[apiIndex + 2]) {
    const resourceType = urlParts[apiIndex + 2];
    if (!resourceType) return null;

    // Remove query params
    const cleanResourceType = resourceType.split('?')[0];
    if (!cleanResourceType) return null;

    // Remove plural 's'
    return cleanResourceType.replace(/s$/, '');
  }

  return null;
}

function determineResourceId(req: AuditRequest): string | null {
  // Check if resource ID is explicitly set
  if (req.auditData?.resourceId) {
    return req.auditData.resourceId;
  }

  // Extract resource ID from URL parameters
  const urlParts = req.originalUrl.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  
  // Check if last part looks like an ID (UUID or CUID)
  if (lastPart && (lastPart.length > 10 || lastPart.includes('-'))) {
    return lastPart;
  }

  // Check route parameters
  if (req.params.id) {
    return req.params.id;
  }

  return null;
}

// Helper function to set audit data in request
export const setAuditData = (
  req: AuditRequest,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  details?: any
) => {
  const auditData: {
    action: AuditAction;
    resourceType?: string;
    resourceId?: string;
    details?: any;
  } = { action };

  if (resourceType) auditData.resourceType = resourceType;
  if (resourceId) auditData.resourceId = resourceId;
  if (details) auditData.details = details;

  req.auditData = auditData;
};

// Middleware to log specific audit events
export const logAuditEvent = async (
  userId: string | null,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string,
  sessionId?: string
) => {
  try {
    // Get previous hash for blockchain-like integrity
    const previousLog = await prisma.auditLog.findFirst({
      where: { userId: userId || null },
      orderBy: { timestamp: 'desc' },
      select: { integrityHash: true },
    });

    const previousHash = previousLog?.integrityHash || '';

    // Create integrity hash
    const dataToHash = JSON.stringify({
      userId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      previousHash,
    });

    const integrityHash = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');

    // Create audit log
    const logData: any = {
      action,
      details,
      integrityHash,
      previousHash: previousHash || '',
    };

    if (userId) logData.userId = userId;
    if (resourceType) logData.resourceType = resourceType;
    if (resourceId) logData.resourceId = resourceId;
    if (ipAddress) logData.ipAddress = ipAddress;
    if (userAgent) logData.userAgent = userAgent;
    if (sessionId) logData.sessionId = sessionId;

    await prisma.auditLog.create({
      data: logData,
    });

    logger.debug('Manual audit log created:', {
      userId,
      action,
      resourceType,
      resourceId,
    });
  } catch (error) {
    logger.error('Error creating manual audit log:', error);
  }
};
