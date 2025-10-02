import { PrismaClient, AuditAction, AnomalySeverity, AnomalyStatus, RetentionPolicyStatus, DataRetentionJobStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class RGPDService {
  // Audit Logging
  static async logAuditEvent(
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
          timestamp: new Date(),
        },
      });

      logger.info(`Audit log created: ${action} on ${entityType}`, {
        auditLogId: auditLog.id,
        userId,
        entityId,
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
    action: string,
    details: any,
    riskScore: number
  ) {
    try {
      const severity = this.calculateAnomalySeverity(riskScore);
      
      const anomaly = await prisma.anomalyAlert.create({
        data: {
          userId,
          action,
          details: JSON.stringify(details),
          riskScore,
          severity,
          status: AnomalyStatus.PENDING,
          detectedAt: new Date(),
        },
      });

      logger.warn(`Anomaly detected: ${action}`, {
        anomalyId: anomaly.id,
        userId,
        riskScore,
        severity,
      });

      // Auto-resolve low-risk anomalies
      if (severity === AnomalySeverity.LOW) {
        await this.resolveAnomaly(anomaly.id, 'Auto-resolved: Low risk anomaly');
      }

      return anomaly;
    } catch (error) {
      logger.error('Error detecting anomaly:', error);
      throw error;
    }
  }

  static calculateAnomalySeverity(riskScore: number): AnomalySeverity {
    if (riskScore >= 80) return AnomalySeverity.CRITICAL;
    if (riskScore >= 60) return AnomalySeverity.HIGH;
    if (riskScore >= 40) return AnomalySeverity.MEDIUM;
    return AnomalySeverity.LOW;
  }

  static async getAnomalyAlerts(
    filters: {
      userId?: string;
      severity?: AnomalySeverity;
      status?: AnomalyStatus;
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

  static async resolveAnomaly(anomalyId: string, resolution: string) {
    return await prisma.anomalyAlert.update({
      where: { id: anomalyId },
      data: {
        status: AnomalyStatus.RESOLVED,
        resolution,
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
    entityId: string
  ) {
    const pseudonym = this.generatePseudonym(originalValue);

    return await prisma.pseudonymMapping.create({
      data: {
        originalValue,
        pseudonym,
        entityType,
        entityId,
        createdAt: new Date(),
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
    return await prisma.retentionPolicy.create({
      data: {
        entityType,
        retentionPeriodDays,
        description,
        status: RetentionPolicyStatus.ACTIVE,
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  static async getRetentionPolicies(
    filters: {
      entityType?: string;
      status?: RetentionPolicyStatus;
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

  static async executeDataRetention(entityType: string) {
    const policy = await prisma.retentionPolicy.findFirst({
      where: {
        entityType,
        status: RetentionPolicyStatus.ACTIVE,
      },
    });

    if (!policy) {
      throw new Error(`No active retention policy found for entity type: ${entityType}`);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    // Create retention job
    const job = await prisma.dataRetentionJob.create({
      data: {
        entityType,
        retentionPolicyId: policy.id,
        cutoffDate,
        status: DataRetentionJobStatus.RUNNING,
        startedAt: new Date(),
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
          status: DataRetentionJobStatus.COMPLETED,
          completedAt: new Date(),
          recordsDeleted: deletedCount,
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
          status: DataRetentionJobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      logger.error(`Data retention failed for ${entityType}:`, error);
      throw error;
    }
  }

  static async getDataRetentionJobs(
    filters: {
      entityType?: string;
      status?: DataRetentionJobStatus;
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
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          retentionPolicy: true,
        },
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

  // Data Subject Rights
  static async processDataSubjectRequest(
    userId: string,
    requestType: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY',
    details: any
  ) {
    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        requestType,
        details: JSON.stringify(details),
        status: 'PENDING',
        submittedAt: new Date(),
      },
    });

    // Log the request
    await this.logAuditEvent(
      userId,
      AuditAction.DATA_SUBJECT_REQUEST,
      'DataSubjectRequest',
      request.id,
      { requestType, details }
    );

    return request;
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
    const { userId, requestType, status, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (requestType) where.requestType = requestType;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      prisma.dataSubjectRequest.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
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
      prisma.dataSubjectRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Privacy Impact Assessment
  static async createPrivacyImpactAssessment(
    title: string,
    description: string,
    dataTypes: string[],
    processingPurposes: string[],
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    mitigationMeasures: string[],
    createdBy: string
  ) {
    return await prisma.privacyImpactAssessment.create({
      data: {
        title,
        description,
        dataTypes: JSON.stringify(dataTypes),
        processingPurposes: JSON.stringify(processingPurposes),
        riskLevel,
        mitigationMeasures: JSON.stringify(mitigationMeasures),
        status: 'DRAFT',
        createdBy,
        createdAt: new Date(),
      },
    });
  }

  static async getPrivacyImpactAssessments(
    filters: {
      status?: string;
      riskLevel?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { status, riskLevel, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;

    const [assessments, total] = await Promise.all([
      prisma.privacyImpactAssessment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.privacyImpactAssessment.count({ where }),
    ]);

    return {
      assessments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Consent Management
  static async recordConsent(
    userId: string,
    consentType: string,
    given: boolean,
    purpose: string,
    legalBasis: string,
    details?: any
  ) {
    const consent = await prisma.consent.create({
      data: {
        userId,
        consentType,
        given,
        purpose,
        legalBasis,
        details: details ? JSON.stringify(details) : null,
        recordedAt: new Date(),
      },
    });

    // Log consent recording
    await this.logAuditEvent(
      userId,
      AuditAction.CONSENT_RECORDED,
      'Consent',
      consent.id,
      { consentType, given, purpose, legalBasis }
    );

    return consent;
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
    const { userId, consentType, given, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (consentType) where.consentType = consentType;
    if (given !== undefined) where.given = given;

    const [consents, total] = await Promise.all([
      prisma.consent.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
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
      prisma.consent.count({ where }),
    ]);

    return {
      consents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default RGPDService;

