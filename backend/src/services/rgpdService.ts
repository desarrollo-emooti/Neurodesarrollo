import { PrismaClient, AuditAction, AnomalyType, Severity, AlertStatus, PolicyStatus, JobStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class RGPDService {
  // Audit Logging
  static async logAuditEvent(
    userId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string | null,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Get previous hash for blockchain-like integrity
      const whereClause: any = {};
      if (userId) whereClause.userId = userId;

      const previousLog = await prisma.auditLog.findFirst({
        where: whereClause,
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

      const logData: any = {
        action,
        details,
        integrityHash,
        previousHash,
      };

      if (userId) logData.userId = userId;
      if (resourceType) logData.resourceType = resourceType;
      if (resourceId) logData.resourceId = resourceId;
      if (ipAddress) logData.ipAddress = ipAddress;
      if (userAgent) logData.userAgent = userAgent;

      const auditLog = await prisma.auditLog.create({
        data: logData,
      });

      logger.info(`Audit log created: ${action} on ${resourceType}`, {
        auditLogId: auditLog.id,
        userId,
        resourceId,
      });

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  static async getAuditLogs(
    filters: {
      userId?: string;
      action?: AuditAction;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Anomaly Detection
  static async detectAnomaly(
    userId: string,
    type: AnomalyType,
    description: string,
    details: any,
    riskScore: number
  ) {
    try {
      const severity = this.calculateAnomalySeverity(riskScore);

      const anomaly = await prisma.anomalyAlert.create({
        data: {
          userId,
          type,
          description,
          metadata: details,
          severity,
          status: AlertStatus.ACTIVE,
        },
      });

      logger.warn(`Anomaly detected: ${type}`, {
        anomalyId: anomaly.id,
        userId,
        riskScore,
        severity,
      });

      // Auto-resolve low-risk anomalies
      if (severity === Severity.LOW) {
        await this.resolveAnomaly(anomaly.id, 'Auto-resolved: Low risk anomaly');
      }

      return anomaly;
    } catch (error) {
      logger.error('Error detecting anomaly:', error);
      throw error;
    }
  }

  static calculateAnomalySeverity(riskScore: number): Severity {
    if (riskScore >= 80) return Severity.CRITICAL;
    if (riskScore >= 60) return Severity.HIGH;
    if (riskScore >= 40) return Severity.MEDIUM;
    return Severity.LOW;
  }

  static async getAnomalyAlerts(
    filters: {
      userId?: string;
      severity?: Severity;
      status?: AlertStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      userId,
      severity,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.detectedAt = {};
      if (startDate) where.detectedAt.gte = startDate;
      if (endDate) where.detectedAt.lte = endDate;
    }

    const [anomalies, total] = await Promise.all([
      prisma.anomalyAlert.findMany({
        where,
        orderBy: { detectedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.anomalyAlert.count({ where }),
    ]);

    return {
      anomalies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async resolveAnomaly(anomalyId: string, resolutionNotes: string) {
    return await prisma.anomalyAlert.update({
      where: { id: anomalyId },
      data: {
        status: AlertStatus.RESOLVED,
        resolutionNotes,
        resolvedAt: new Date(),
      },
    });
  }

  // Pseudonymization
  static generatePseudonym(originalData: string): string {
    return crypto
      .createHash('sha256')
      .update(originalData + process.env.PSEUDONYM_SALT || 'default-salt')
      .digest('hex')
      .substring(0, 16);
  }

  static async createPseudonymMapping(
    originalValue: string,
    entityType: string,
    entityId: string,
    fieldName: string = 'default',
    createdBy: string = 'system'
  ) {
    const pseudonym = this.generatePseudonym(originalValue);
    const originalValueHash = crypto
      .createHash('sha256')
      .update(originalValue)
      .digest('hex');

    return await prisma.pseudonymMapping.create({
      data: {
        originalValueHash,
        pseudonym,
        entityType,
        entityId,
        fieldName,
        encryptionKeyVersion: '1.0',
        createdBy,
      },
    });
  }

  static async getPseudonymMappings(
    filters: {
      entityType?: string;
      entityId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { entityType, entityId, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [mappings, total] = await Promise.all([
      prisma.pseudonymMapping.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pseudonymMapping.count({ where }),
    ]);

    return {
      mappings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Data Retention
  static async createRetentionPolicy(
    entityType: string,
    retentionPeriodDays: number,
    description: string,
    createdBy: string
  ) {
    const retentionYears = Math.ceil(retentionPeriodDays / 365);

    return await prisma.retentionPolicy.create({
      data: {
        entityType,
        retentionYears,
        triggerField: 'createdAt',
        description,
        legalBasis: 'GDPR Article 5',
        status: PolicyStatus.ACTIVE,
        createdBy,
      },
    });
  }

  static async getRetentionPolicies(
    filters: {
      entityType?: string;
      status?: PolicyStatus;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { entityType, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;

    const [policies, total] = await Promise.all([
      prisma.retentionPolicy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.retentionPolicy.count({ where }),
    ]);

    return {
      policies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async executeDataRetention(entityType: string, createdBy: string = 'system') {
    const policy = await prisma.retentionPolicy.findFirst({
      where: {
        entityType,
        status: PolicyStatus.ACTIVE,
      },
    });

    if (!policy) {
      throw new Error(`No active retention policy found for entity type: ${entityType}`);
    }

    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retentionYears);

    // Create retention job
    const job = await prisma.dataRetentionJob.create({
      data: {
        entityType,
        policyApplied: policy,
        cutoffDate,
        scheduledFor: new Date(),
        recordsEligible: 0,
        recordsDeleted: 0,
        status: JobStatus.IN_PROGRESS,
        createdBy,
      },
    });

    try {
      let deletedCount = 0;

      // Execute retention based on entity type
      switch (entityType) {
        case 'User':
          const userResult = await prisma.user.deleteMany({
            where: {
              createdAt: { lt: cutoffDate },
              status: 'INACTIVE',
            },
          });
          deletedCount = userResult.count;
          break;

        case 'Student':
          const studentResult = await prisma.student.deleteMany({
            where: {
              createdAt: { lt: cutoffDate },
              active: false,
            },
          });
          deletedCount = studentResult.count;
          break;

        case 'AuditLog':
          const auditResult = await prisma.auditLog.deleteMany({
            where: {
              timestamp: { lt: cutoffDate },
            },
          });
          deletedCount = auditResult.count;
          break;

        default:
          throw new Error(`Unsupported entity type for retention: ${entityType}`);
      }

      // Update job status
      await prisma.dataRetentionJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          executedAt: new Date(),
          recordsDeleted: deletedCount,
          recordsEligible: deletedCount,
        },
      });

      logger.info(`Data retention completed for ${entityType}`, {
        jobId: job.id,
        deletedCount,
        cutoffDate,
      });

      return { jobId: job.id, deletedCount };
    } catch (error) {
      // Update job status to failed
      await prisma.dataRetentionJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          executedAt: new Date(),
          errorDetails: (error as Error).message,
        },
      });

      logger.error(`Data retention failed for ${entityType}:`, error);
      throw error;
    }
  }

  static async getDataRetentionJobs(
    filters: {
      entityType?: string;
      status?: JobStatus;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { entityType, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.dataRetentionJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dataRetentionJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Data Subject Rights - DISABLED (table not in schema)
  // TODO: Create dataSubjectRequest table in schema if needed
  static async processDataSubjectRequest(
    userId: string,
    requestType: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY',
    details: any
  ) {
    // Log the request in audit log as a workaround
    await this.logAuditEvent(
      userId,
      AuditAction.DATA_ACCESS,
      'DataSubjectRequest',
      null,
      { requestType, details }
    );

    return {
      id: 'pending',
      userId,
      requestType,
      details,
      status: 'LOGGED',
      submittedAt: new Date(),
    };
  }

  static async getDataSubjectRequests(
    filters: {
      userId?: string;
      requestType?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    // Return empty result as table doesn't exist
    return {
      requests: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: 0,
        pages: 0,
      },
    };
  }

  // Privacy Impact Assessment - DISABLED (table not in schema)
  // TODO: Create privacyImpactAssessment table in schema if needed
  static async createPrivacyImpactAssessment(
    title: string,
    description: string,
    dataTypes: string[],
    processingPurposes: string[],
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    mitigationMeasures: string[],
    createdBy: string
  ) {
    // Log in audit log as workaround
    await this.logAuditEvent(
      createdBy,
      AuditAction.SYSTEM_CONFIGURATION_CHANGE,
      'PrivacyImpactAssessment',
      null,
      { title, description, dataTypes, processingPurposes, riskLevel, mitigationMeasures }
    );

    return {
      id: 'pending',
      title,
      description,
      dataTypes,
      processingPurposes,
      riskLevel,
      mitigationMeasures,
      status: 'LOGGED',
      createdBy,
      createdAt: new Date(),
    };
  }

  static async getPrivacyImpactAssessments(
    filters: {
      status?: string;
      riskLevel?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    // Return empty result as table doesn't exist
    return {
      assessments: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: 0,
        pages: 0,
      },
    };
  }

  // Consent Management - DISABLED (table not in schema)
  // TODO: Create consent table in schema if needed
  static async recordConsent(
    userId: string,
    consentType: string,
    given: boolean,
    purpose: string,
    legalBasis: string,
    details?: any
  ) {
    // Log consent recording in audit log
    await this.logAuditEvent(
      userId,
      AuditAction.DATA_MODIFICATION,
      'Consent',
      null,
      { consentType, given, purpose, legalBasis, details }
    );

    return {
      id: 'pending',
      userId,
      consentType,
      given,
      purpose,
      legalBasis,
      details,
      recordedAt: new Date(),
    };
  }

  static async getConsentHistory(
    filters: {
      userId?: string;
      consentType?: string;
      given?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ) {
    // Return empty result as table doesn't exist
    return {
      consents: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: 0,
        pages: 0,
      },
    };
  }
}

export default RGPDService;

