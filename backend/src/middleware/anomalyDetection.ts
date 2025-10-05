import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AnomalyType, Severity, AlertStatus } from '@prisma/client';
import { AuthUser } from './auth';

interface AnomalyRequest extends Request {
  user?: AuthUser;
}

// Store user activity in memory for anomaly detection
const userActivity = new Map<string, {
  requests: number;
  lastRequest: Date;
  ipAddresses: Set<string>;
  dataAccessCount: number;
  exportCount: number;
  failedLogins: number;
  lastFailedLogin: Date;
}>();

// Clean up old activity data every hour
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [userId, activity] of userActivity.entries()) {
    if (activity.lastRequest < oneHourAgo) {
      userActivity.delete(userId);
    }
  }
}, 60 * 60 * 1000);

export const anomalyDetection = async (req: AnomalyRequest, res: Response, next: NextFunction) => {
  try {
    // Skip anomaly detection for certain endpoints
    if (shouldSkipAnomalyDetection(req)) {
      return next();
    }

    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const now = new Date();

    if (userId) {
      await checkUserAnomalies(userId, ipAddress, req, res);
    }

    // Check for IP-based anomalies
    await checkIPAnomalies(ipAddress, req, res);

    next();
  } catch (error) {
    logger.error('Error in anomaly detection:', error);
    next(); // Don't block the request if anomaly detection fails
  }
};

async function checkUserAnomalies(
  userId: string,
  ipAddress: string,
  req: AnomalyRequest,
  res: Response
) {
  const now = new Date();
  const userActivityData = userActivity.get(userId) || {
    requests: 0,
    lastRequest: now,
    ipAddresses: new Set<string>(),
    dataAccessCount: 0,
    exportCount: 0,
    failedLogins: 0,
    lastFailedLogin: now,
  };

  // Update activity data
  userActivityData.requests++;
  userActivityData.lastRequest = now;
  userActivityData.ipAddresses.add(ipAddress);

  // Check for bulk data access
  if (req.method === 'GET' && isDataAccessEndpoint(req.originalUrl)) {
    userActivityData.dataAccessCount++;
    
    if (userActivityData.dataAccessCount > 50) {
      await createAnomalyAlert(
        userId,
        AnomalyType.BULK_DATA_ACCESS,
        Severity.HIGH,
        `User accessed ${userActivityData.dataAccessCount} data records in a short period`,
        { dataAccessCount: userActivityData.dataAccessCount, endpoint: req.originalUrl }
      );
    }
  }

  // Check for data export anomalies
  if (req.originalUrl.includes('/export')) {
    userActivityData.exportCount++;
    
    if (userActivityData.exportCount > 5) {
      await createAnomalyAlert(
        userId,
        AnomalyType.UNUSUAL_EXPORT_PATTERN,
        Severity.MEDIUM,
        `User performed ${userActivityData.exportCount} data exports in a short period`,
        { exportCount: userActivityData.exportCount, endpoint: req.originalUrl }
      );
    }
  }

  // Check for multiple IP addresses
  if (userActivityData.ipAddresses.size > 3) {
    await createAnomalyAlert(
      userId,
      AnomalyType.MULTIPLE_IP_ADDRESSES,
      Severity.MEDIUM,
      `User accessed from ${userActivityData.ipAddresses.size} different IP addresses`,
      { 
        ipAddresses: Array.from(userActivityData.ipAddresses),
        currentIP: ipAddress 
      }
    );
  }

  // Check for after-hours access
  const hour = now.getHours();
  if (hour < 6 || hour > 23) {
    await createAnomalyAlert(
      userId,
      AnomalyType.AFTER_HOURS_ACCESS,
      Severity.LOW,
      `User accessed system at ${hour}:${now.getMinutes().toString().padStart(2, '0')}`,
      { accessTime: now.toISOString(), hour }
    );
  }

  // Check for failed login attempts
  if (res.statusCode === 401 && req.originalUrl.includes('/auth')) {
    userActivityData.failedLogins++;
    userActivityData.lastFailedLogin = now;
    
    if (userActivityData.failedLogins > 5) {
      await createAnomalyAlert(
        userId,
        AnomalyType.FAILED_LOGIN_ATTEMPTS,
        Severity.HIGH,
        `User failed login ${userActivityData.failedLogins} times`,
        { failedLogins: userActivityData.failedLogins, lastAttempt: now.toISOString() }
      );
    }
  }

  // Reset failed logins on successful authentication
  if (req.originalUrl.includes('/auth/callback') && res.statusCode === 200) {
    userActivityData.failedLogins = 0;
  }

  userActivity.set(userId, userActivityData);
}

async function checkIPAnomalies(ipAddress: string, req: AnomalyRequest, res: Response) {
  // Check for suspicious IP patterns
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      ipAddress,
      timestamp: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
    select: {
      userId: true,
      action: true,
      timestamp: true,
    },
  });

  // Check for multiple users from same IP
  const uniqueUsers = new Set(recentLogs.map(log => log.userId).filter(Boolean));
  if (uniqueUsers.size > 5) {
    await createAnomalyAlert(
      null,
      AnomalyType.MULTIPLE_IP_ADDRESSES,
      Severity.HIGH,
      `IP address ${ipAddress} accessed by ${uniqueUsers.size} different users`,
      { 
        ipAddress, 
        userCount: uniqueUsers.size,
        users: Array.from(uniqueUsers)
      }
    );
  }

  // Check for high request volume from single IP
  if (recentLogs.length > 100) {
    await createAnomalyAlert(
      null,
      AnomalyType.BULK_DATA_ACCESS,
      Severity.HIGH,
      `IP address ${ipAddress} made ${recentLogs.length} requests in 15 minutes`,
      { 
        ipAddress, 
        requestCount: recentLogs.length,
        timeWindow: '15 minutes'
      }
    );
  }
}

async function createAnomalyAlert(
  userId: string | null,
  type: AnomalyType,
  severity: Severity,
  description: string,
  metadata: any
) {
  try {
    // Check if similar alert already exists and is active
    const existingAlert = await prisma.anomalyAlert.findFirst({
      where: {
        type,
        severity,
        status: AlertStatus.ACTIVE,
        userId: userId || null,
        detectedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (existingAlert) {
      // Update existing alert instead of creating new one
      await prisma.anomalyAlert.update({
        where: { id: existingAlert.id },
        data: {
          description: `${existingAlert.description} | ${description}`,
          metadata: {
            ...existingAlert.metadata as any,
            ...metadata,
            occurrences: ((existingAlert.metadata as any)?.occurrences || 1) + 1,
          },
        },
      });
      return;
    }

    // Create new anomaly alert
    await prisma.anomalyAlert.create({
      data: {
        type,
        severity,
        description,
        userId,
        metadata,
      },
    });

    logger.warn('Anomaly alert created:', {
      type,
      severity,
      description,
      userId,
      metadata,
    });

    // Send notification to administrators for high/critical severity
    if (severity === Severity.HIGH || severity === Severity.CRITICAL) {
      await notifyAdministrators(type, severity, description, metadata);
    }
  } catch (error) {
    logger.error('Error creating anomaly alert:', error);
  }
}

async function notifyAdministrators(
  type: AnomalyType,
  severity: Severity,
  description: string,
  metadata: any
) {
  try {
    // Get administrator users
    const administrators = await prisma.user.findMany({
      where: {
        userType: 'ADMINISTRADOR',
        active: true,
      },
      select: {
        email: true,
        fullName: true,
      },
    });

    // TODO: Implement email notification service
    logger.info('Should notify administrators:', {
      administrators: administrators.map(admin => admin.email),
      type,
      severity,
      description,
    });
  } catch (error) {
    logger.error('Error notifying administrators:', error);
  }
}

function shouldSkipAnomalyDetection(req: AnomalyRequest): boolean {
  const skipPaths = [
    '/health',
    '/api/v1/auth/google',
    '/api/v1/auth/callback',
    '/api/public',
  ];

  return skipPaths.some(path => req.originalUrl.startsWith(path));
}

function isDataAccessEndpoint(url: string): boolean {
  const dataAccessPaths = [
    '/api/v1/users',
    '/api/v1/students',
    '/api/v1/centers',
    '/api/v1/test-results',
    '/api/v1/audit-logs',
  ];

  return dataAccessPaths.some(path => url.startsWith(path));
}

// Cleanup function for user activity data
export const cleanupUserActivity = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [userId, activity] of userActivity.entries()) {
    if (activity.lastRequest < oneHourAgo) {
      userActivity.delete(userId);
    }
  }
};

// Export anomaly detection utilities
export const anomalyDetectionUtils = {
  createAnomalyAlert,
  notifyAdministrators,
  cleanupUserActivity,
};
