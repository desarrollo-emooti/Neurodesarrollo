import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import RGPDService from '../services/rgpdService';
import { logger } from '../utils/logger';
import { AuditAction } from '@prisma/client';

// Audit Logs
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    action,
    entityType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    userId: userId as string,
    action: action as any,
    entityType: entityType as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getAuditLogs(filters);

  res.json({
    success: true,
    data: result.auditLogs,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const getAuditLogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const auditLog = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!auditLog) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Audit log not found',
      },
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: auditLog,
    timestamp: new Date().toISOString(),
  });
});

// Anomaly Alerts
export const getAnomalyAlerts = asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    severity,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    userId: userId as string,
    severity: severity as any,
    status: status as any,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getAnomalyAlerts(filters);

  res.json({
    success: true,
    data: result.anomalies,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const resolveAnomaly = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolution } = req.body;

  if (!resolution) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resolution is required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const anomaly = await RGPDService.resolveAnomaly(id, resolution);

  res.json({
    success: true,
    data: anomaly,
    timestamp: new Date().toISOString(),
  });
});

// Pseudonym Mappings
export const getPseudonymMappings = asyncHandler(async (req: Request, res: Response) => {
  const {
    entityType,
    entityId,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    entityType: entityType as string,
    entityId: entityId as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getPseudonymMappings(filters);

  res.json({
    success: true,
    data: result.mappings,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const createPseudonymMapping = asyncHandler(async (req: Request, res: Response) => {
  const { originalValue, entityType, entityId } = req.body;

  if (!originalValue || !entityType || !entityId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'originalValue, entityType, and entityId are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const mapping = await RGPDService.createPseudonymMapping(
    originalValue,
    entityType,
    entityId
  );

  res.status(201).json({
    success: true,
    data: mapping,
    timestamp: new Date().toISOString(),
  });
});

// Retention Policies
export const getRetentionPolicies = asyncHandler(async (req: Request, res: Response) => {
  const {
    entityType,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    entityType: entityType as string,
    status: status as any,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getRetentionPolicies(filters);

  res.json({
    success: true,
    data: result.policies,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const createRetentionPolicy = asyncHandler(async (req: Request, res: Response) => {
  const {
    entityType,
    retentionPeriodDays,
    description,
  } = req.body;

  if (!entityType || !retentionPeriodDays || !description) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'entityType, retentionPeriodDays, and description are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const policy = await RGPDService.createRetentionPolicy(
    entityType,
    retentionPeriodDays,
    description,
    req.user?.id || 'system'
  );

  res.status(201).json({
    success: true,
    data: policy,
    timestamp: new Date().toISOString(),
  });
});

// Data Retention Jobs
export const getDataRetentionJobs = asyncHandler(async (req: Request, res: Response) => {
  const {
    entityType,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    entityType: entityType as string,
    status: status as any,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getDataRetentionJobs(filters);

  res.json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const executeDataRetention = asyncHandler(async (req: Request, res: Response) => {
  const { entityType } = req.body;

  if (!entityType) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'entityType is required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const result = await RGPDService.executeDataRetention(entityType);

  res.json({
    success: true,
    data: result,
    message: `Data retention job started for ${entityType}`,
    timestamp: new Date().toISOString(),
  });
});

// Data Subject Requests
export const getDataSubjectRequests = asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    requestType,
    status,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    userId: userId as string,
    requestType: requestType as string,
    status: status as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getDataSubjectRequests(filters);

  res.json({
    success: true,
    data: result.requests,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const createDataSubjectRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requestType, details } = req.body;

  if (!requestType || !details) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'requestType and details are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const request = await RGPDService.processDataSubjectRequest(
    req.user?.id || 'system',
    requestType,
    details
  );

  res.status(201).json({
    success: true,
    data: request,
    timestamp: new Date().toISOString(),
  });
});

// Privacy Impact Assessments
export const getPrivacyImpactAssessments = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    riskLevel,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    status: status as string,
    riskLevel: riskLevel as string,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getPrivacyImpactAssessments(filters);

  res.json({
    success: true,
    data: result.assessments,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const createPrivacyImpactAssessment = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    dataTypes,
    processingPurposes,
    riskLevel,
    mitigationMeasures,
  } = req.body;

  if (!title || !description || !dataTypes || !processingPurposes || !riskLevel) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'title, description, dataTypes, processingPurposes, and riskLevel are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const assessment = await RGPDService.createPrivacyImpactAssessment(
    title,
    description,
    dataTypes,
    processingPurposes,
    riskLevel,
    mitigationMeasures || [],
    req.user?.id || 'system'
  );

  res.status(201).json({
    success: true,
    data: assessment,
    timestamp: new Date().toISOString(),
  });
});

// Consent Management
export const getConsentHistory = asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    consentType,
    given,
    page = 1,
    limit = 20,
  } = req.query;

  const filters = {
    userId: userId as string,
    consentType: consentType as string,
    given: given === 'true' ? true : given === 'false' ? false : undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  };

  const result = await RGPDService.getConsentHistory(filters);

  res.json({
    success: true,
    data: result.consents,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
});

export const recordConsent = asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    consentType,
    given,
    purpose,
    legalBasis,
    details,
  } = req.body;

  if (!userId || !consentType || given === undefined || !purpose || !legalBasis) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'userId, consentType, given, purpose, and legalBasis are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const consent = await RGPDService.recordConsent(
    userId,
    consentType,
    given,
    purpose,
    legalBasis,
    details
  );

  res.status(201).json({
    success: true,
    data: consent,
    timestamp: new Date().toISOString(),
  });
});

// RGPD Dashboard Statistics
export const getRGPDDashboard = asyncHandler(async (req: Request, res: Response) => {
  const [
    auditLogsCount,
    anomaliesCount,
    pendingAnomaliesCount,
    retentionPoliciesCount,
    dataSubjectRequestsCount,
    pendingRequestsCount,
    consentRecordsCount,
    recentAuditLogs,
    recentAnomalies,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.anomalyAlert.count(),
    prisma.anomalyAlert.count({ where: { status: 'PENDING' } }),
    prisma.retentionPolicy.count(),
    prisma.dataSubjectRequest.count(),
    prisma.dataSubjectRequest.count({ where: { status: 'PENDING' } }),
    prisma.consent.count(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.anomalyAlert.findMany({
      take: 10,
      orderBy: { detectedAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      statistics: {
        auditLogsCount,
        anomaliesCount,
        pendingAnomaliesCount,
        retentionPoliciesCount,
        dataSubjectRequestsCount,
        pendingRequestsCount,
        consentRecordsCount,
      },
      recentActivity: {
        auditLogs: recentAuditLogs,
        anomalies: recentAnomalies,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

