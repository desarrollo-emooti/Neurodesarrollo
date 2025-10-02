import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';
import { authorizeRoles } from '../middleware/auth';
import { rgpdAudit, logRGPDAudit, detectAnomalies } from '../middleware/rgpdAudit';
import { AuditAction, AnomalySeverity, AnomalyStatus, RetentionPolicyStatus, DataRetentionJobStatus, UserType } from '@prisma/client';
import {
  getAuditLogs,
  getAuditLogById,
  getAnomalyAlerts,
  resolveAnomaly,
  getPseudonymMappings,
  createPseudonymMapping,
  getRetentionPolicies,
  createRetentionPolicy,
  getDataRetentionJobs,
  executeDataRetention,
  getDataSubjectRequests,
  createDataSubjectRequest,
  getPrivacyImpactAssessments,
  createPrivacyImpactAssessment,
  getConsentHistory,
  recordConsent,
  getRGPDDashboard,
} from '../controllers/rgpdController';

const router = Router();

// Apply RGPD middleware to all routes
router.use(detectAnomalies);
router.use(logRGPDAudit);

// RGPD Dashboard (Admin only)
router.get('/dashboard', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.SYSTEM_INFO, 'RGPDDashboard'),
  getRGPDDashboard
);

// Audit Logs (Admin only)
router.get('/audit-logs', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'AuditLog'),
  [
    query('userId').optional().isUUID().withMessage('Invalid user ID'),
    query('action').optional().isIn(Object.values(AuditAction)).withMessage('Invalid audit action'),
    query('entityType').optional().isString().trim().escape(),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getAuditLogs
);

router.get('/audit-logs/:id', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'AuditLog'),
  [
    param('id').isUUID().withMessage('Invalid audit log ID'),
    validateRequest,
  ],
  getAuditLogById
);

// Anomaly Alerts (Admin only)
router.get('/anomaly-alerts', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'AnomalyAlert'),
  [
    query('userId').optional().isUUID().withMessage('Invalid user ID'),
    query('severity').optional().isIn(Object.values(AnomalySeverity)).withMessage('Invalid severity'),
    query('status').optional().isIn(Object.values(AnomalyStatus)).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getAnomalyAlerts
);

router.put('/anomaly-alerts/:id/resolve', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.UPDATE, 'AnomalyAlert'),
  [
    param('id').isUUID().withMessage('Invalid anomaly alert ID'),
    body('resolution').notEmpty().withMessage('Resolution is required'),
    validateRequest,
  ],
  resolveAnomaly
);

// Pseudonym Mappings (Admin only)
router.get('/pseudonym-mappings', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'PseudonymMapping'),
  [
    query('entityType').optional().isString().trim().escape(),
    query('entityId').optional().isUUID().withMessage('Invalid entity ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getPseudonymMappings
);

router.post('/pseudonym-mappings', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.CREATE, 'PseudonymMapping'),
  [
    body('originalValue').notEmpty().withMessage('Original value is required'),
    body('entityType').notEmpty().withMessage('Entity type is required'),
    body('entityId').isUUID().withMessage('Invalid entity ID'),
    validateRequest,
  ],
  createPseudonymMapping
);

// Retention Policies (Admin only)
router.get('/retention-policies', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'RetentionPolicy'),
  [
    query('entityType').optional().isString().trim().escape(),
    query('status').optional().isIn(Object.values(RetentionPolicyStatus)).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getRetentionPolicies
);

router.post('/retention-policies', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.CREATE, 'RetentionPolicy'),
  [
    body('entityType').notEmpty().withMessage('Entity type is required'),
    body('retentionPeriodDays').isInt({ min: 1 }).withMessage('Retention period must be a positive integer'),
    body('description').notEmpty().withMessage('Description is required'),
    validateRequest,
  ],
  createRetentionPolicy
);

// Data Retention Jobs (Admin only)
router.get('/retention-jobs', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'DataRetentionJob'),
  [
    query('entityType').optional().isString().trim().escape(),
    query('status').optional().isIn(Object.values(DataRetentionJobStatus)).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getDataRetentionJobs
);

router.post('/retention-jobs/execute', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.DELETE, 'DataRetentionJob'),
  [
    body('entityType').notEmpty().withMessage('Entity type is required'),
    validateRequest,
  ],
  executeDataRetention
);

// Data Subject Requests (Admin and Data Subjects)
router.get('/data-subject-requests', 
  authorizeRoles([UserType.ADMINISTRADOR, UserType.CLINICA, UserType.ORIENTADOR, UserType.EXAMINADOR, UserType.FAMILIA]),
  rgpdAudit(AuditAction.READ, 'DataSubjectRequest'),
  [
    query('userId').optional().isUUID().withMessage('Invalid user ID'),
    query('requestType').optional().isIn(['ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY']).withMessage('Invalid request type'),
    query('status').optional().isString().trim().escape(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getDataSubjectRequests
);

router.post('/data-subject-requests', 
  authorizeRoles([UserType.ADMINISTRADOR, UserType.CLINICA, UserType.ORIENTADOR, UserType.EXAMINADOR, UserType.FAMILIA]),
  rgpdAudit(AuditAction.CREATE, 'DataSubjectRequest'),
  [
    body('requestType').isIn(['ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY']).withMessage('Invalid request type'),
    body('details').isObject().withMessage('Details must be an object'),
    validateRequest,
  ],
  createDataSubjectRequest
);

// Privacy Impact Assessments (Admin only)
router.get('/privacy-impact-assessments', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.READ, 'PrivacyImpactAssessment'),
  [
    query('status').optional().isString().trim().escape(),
    query('riskLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid risk level'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getPrivacyImpactAssessments
);

router.post('/privacy-impact-assessments', 
  authorizeRoles([UserType.ADMINISTRADOR]),
  rgpdAudit(AuditAction.CREATE, 'PrivacyImpactAssessment'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('dataTypes').isArray().withMessage('Data types must be an array'),
    body('processingPurposes').isArray().withMessage('Processing purposes must be an array'),
    body('riskLevel').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid risk level'),
    body('mitigationMeasures').optional().isArray().withMessage('Mitigation measures must be an array'),
    validateRequest,
  ],
  createPrivacyImpactAssessment
);

// Consent Management (All users)
router.get('/consent-history', 
  authorizeRoles([UserType.ADMINISTRADOR, UserType.CLINICA, UserType.ORIENTADOR, UserType.EXAMINADOR, UserType.FAMILIA]),
  rgpdAudit(AuditAction.READ, 'Consent'),
  [
    query('userId').optional().isUUID().withMessage('Invalid user ID'),
    query('consentType').optional().isString().trim().escape(),
    query('given').optional().isBoolean().withMessage('Given must be a boolean'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateRequest,
  ],
  getConsentHistory
);

router.post('/consent', 
  authorizeRoles([UserType.ADMINISTRADOR, UserType.CLINICA, UserType.ORIENTADOR, UserType.EXAMINADOR, UserType.FAMILIA]),
  rgpdAudit(AuditAction.CONSENT_RECORDED, 'Consent'),
  [
    body('userId').isUUID().withMessage('Invalid user ID'),
    body('consentType').notEmpty().withMessage('Consent type is required'),
    body('given').isBoolean().withMessage('Given must be a boolean'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('legalBasis').notEmpty().withMessage('Legal basis is required'),
    body('details').optional().isObject().withMessage('Details must be an object'),
    validateRequest,
  ],
  recordConsent
);

export default router;

