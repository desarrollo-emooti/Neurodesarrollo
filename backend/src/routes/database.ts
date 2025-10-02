import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin } from './auth';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array(),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

// Get database entities
router.get('/entities',
  requireAdmin,
  asyncHandler(async (req: any, res) => {
    const entities = [
      { name: 'User', table: 'users', description: 'Usuarios del sistema' },
      { name: 'Student', table: 'students', description: 'Alumnos' },
      { name: 'Center', table: 'centers', description: 'Centros educativos' },
      { name: 'TestAssignment', table: 'test_assignments', description: 'Asignaciones de pruebas' },
      { name: 'TestResult', table: 'test_results', description: 'Resultados de pruebas' },
      { name: 'Stap2GoResult', table: 'stap2go_results', description: 'Resultados Stap2Go' },
      { name: 'Ravens2Result', table: 'ravens2_results', description: 'Resultados Raven\'s 2' },
      { name: 'InventoryItem', table: 'inventory_items', description: 'Elementos del inventario' },
      { name: 'Device', table: 'devices', description: 'Dispositivos' },
      { name: 'AgendaEvent', table: 'agenda_events', description: 'Eventos de agenda' },
      { name: 'SubscriptionConfiguration', table: 'subscription_configurations', description: 'Configuraciones de suscripción' },
      { name: 'SubscriptionBilling', table: 'subscription_billings', description: 'Facturaciones de suscripción' },
      { name: 'Invoice', table: 'invoices', description: 'Facturas' },
      { name: 'EmotiTest', table: 'emoti_tests', description: 'Configuraciones de pruebas EMOOTI' },
      { name: 'EmotiTestResult', table: 'emoti_test_results', description: 'Resultados EMOOTI generales' },
      { name: 'BatelleSCR', table: 'batelle_scrs', description: 'Resultados Batelle SCR' },
      { name: 'CircuitoLogopedia', table: 'circuito_logopedias', description: 'Resultados Circuito Logopedia' },
      { name: 'CircuitoSensoriomotor', table: 'circuito_sensoriomotors', description: 'Resultados Circuito Sensoriomotor' },
      { name: 'E2P', table: 'e2ps', description: 'Resultados E2P' },
      { name: 'AuditLog', table: 'audit_logs', description: 'Logs de auditoría' },
      { name: 'AnomalyAlert', table: 'anomaly_alerts', description: 'Alertas de anomalías' },
      { name: 'PseudonymMapping', table: 'pseudonym_mappings', description: 'Mapeo de pseudónimos' },
      { name: 'RetentionPolicy', table: 'retention_policies', description: 'Políticas de retención' },
      { name: 'DataRetentionJob', table: 'data_retention_jobs', description: 'Jobs de retención' },
      { name: 'ImportTemplate', table: 'import_templates', description: 'Plantillas de importación' },
      { name: 'ValueConfiguration', table: 'value_configurations', description: 'Configuraciones de valoración' },
      { name: 'CompanyConfiguration', table: 'company_configurations', description: 'Configuración de empresa' },
      { name: 'BackupConfiguration', table: 'backup_configurations', description: 'Configuraciones de backup' },
      { name: 'BackupRecord', table: 'backup_records', description: 'Registros de backup' },
      { name: 'AuthorizationRequest', table: 'authorization_requests', description: 'Solicitudes de autorización' },
      { name: 'AuthorizationTemplate', table: 'authorization_templates', description: 'Plantillas de autorización' },
      { name: 'ExportTemplate', table: 'export_templates', description: 'Plantillas de exportación' },
      { name: 'ExportRecord', table: 'export_records', description: 'Registros de exportación' },
      { name: 'ImportRecord', table: 'import_records', description: 'Registros de importación' },
      { name: 'Tutorial', table: 'tutorials', description: 'Tutoriales' },
      { name: 'Report', table: 'reports', description: 'Informes' },
      { name: 'AnonymizationLog', table: 'anonymization_logs', description: 'Logs de anonimización' },
    ];

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Database', null, {
      action: 'VIEW_ENTITIES',
    });

    res.json({
      success: true,
      data: entities,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get entity data
router.get('/entities/:entityName',
  requireAdmin,
  [
    param('entityName').isString().withMessage('Entity name is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('sortBy').optional().isString().withMessage('Sort by must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { entityName } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'id',
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Map entity names to Prisma models
    const entityMap: Record<string, any> = {
      'User': prisma.user,
      'Student': prisma.student,
      'Center': prisma.center,
      'TestAssignment': prisma.testAssignment,
      'TestResult': prisma.testResult,
      'Stap2GoResult': prisma.stap2GoResult,
      'Ravens2Result': prisma.ravens2Result,
      'InventoryItem': prisma.inventoryItem,
      'Device': prisma.device,
      'AgendaEvent': prisma.agendaEvent,
      'SubscriptionConfiguration': prisma.subscriptionConfiguration,
      'SubscriptionBilling': prisma.subscriptionBilling,
      'Invoice': prisma.invoice,
      'EmotiTest': prisma.emotiTest,
      'EmotiTestResult': prisma.emotiTestResult,
      'BatelleSCR': prisma.batelleSCR,
      'CircuitoLogopedia': prisma.circuitoLogopedia,
      'CircuitoSensoriomotor': prisma.circuitoSensoriomotor,
      'E2P': prisma.e2P,
      'AuditLog': prisma.auditLog,
      'AnomalyAlert': prisma.anomalyAlert,
      'PseudonymMapping': prisma.pseudonymMapping,
      'RetentionPolicy': prisma.retentionPolicy,
      'DataRetentionJob': prisma.dataRetentionJob,
      'ImportTemplate': prisma.importTemplate,
      'ValueConfiguration': prisma.valueConfiguration,
      'CompanyConfiguration': prisma.companyConfiguration,
      'BackupConfiguration': prisma.backupConfiguration,
      'BackupRecord': prisma.backupRecord,
      'AuthorizationRequest': prisma.authorizationRequest,
      'AuthorizationTemplate': prisma.authorizationTemplate,
      'ExportTemplate': prisma.exportTemplate,
      'ExportRecord': prisma.exportRecord,
      'ImportRecord': prisma.importRecord,
      'Tutorial': prisma.tutorial,
      'Report': prisma.report,
      'AnonymizationLog': prisma.anonymizationLog,
    };

    const model = entityMap[entityName];
    if (!model) {
      throw notFoundErrorHandler('Entity');
    }

    // Build where clause for search
    const where: any = {};
    if (search) {
      // For now, we'll do a simple search on common fields
      // In a real implementation, you'd want to be more specific about which fields to search
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get entity data with pagination
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      model.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Database', null, {
      action: 'VIEW_ENTITY_DATA',
      entityName,
      filters: { search, sortBy, sortOrder },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get entity record by ID
router.get('/entities/:entityName/:id',
  requireAdmin,
  [
    param('entityName').isString().withMessage('Entity name is required'),
    param('id').isString().withMessage('Record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { entityName, id } = req.params;

    // Map entity names to Prisma models
    const entityMap: Record<string, any> = {
      'User': prisma.user,
      'Student': prisma.student,
      'Center': prisma.center,
      'TestAssignment': prisma.testAssignment,
      'TestResult': prisma.testResult,
      'Stap2GoResult': prisma.stap2GoResult,
      'Ravens2Result': prisma.ravens2Result,
      'InventoryItem': prisma.inventoryItem,
      'Device': prisma.device,
      'AgendaEvent': prisma.agendaEvent,
      'SubscriptionConfiguration': prisma.subscriptionConfiguration,
      'SubscriptionBilling': prisma.subscriptionBilling,
      'Invoice': prisma.invoice,
      'EmotiTest': prisma.emotiTest,
      'EmotiTestResult': prisma.emotiTestResult,
      'BatelleSCR': prisma.batelleSCR,
      'CircuitoLogopedia': prisma.circuitoLogopedia,
      'CircuitoSensoriomotor': prisma.circuitoSensoriomotor,
      'E2P': prisma.e2P,
      'AuditLog': prisma.auditLog,
      'AnomalyAlert': prisma.anomalyAlert,
      'PseudonymMapping': prisma.pseudonymMapping,
      'RetentionPolicy': prisma.retentionPolicy,
      'DataRetentionJob': prisma.dataRetentionJob,
      'ImportTemplate': prisma.importTemplate,
      'ValueConfiguration': prisma.valueConfiguration,
      'CompanyConfiguration': prisma.companyConfiguration,
      'BackupConfiguration': prisma.backupConfiguration,
      'BackupRecord': prisma.backupRecord,
      'AuthorizationRequest': prisma.authorizationRequest,
      'AuthorizationTemplate': prisma.authorizationTemplate,
      'ExportTemplate': prisma.exportTemplate,
      'ExportRecord': prisma.exportRecord,
      'ImportRecord': prisma.importRecord,
      'Tutorial': prisma.tutorial,
      'Report': prisma.report,
      'AnonymizationLog': prisma.anonymizationLog,
    };

    const model = entityMap[entityName];
    if (!model) {
      throw notFoundErrorHandler('Entity');
    }

    const record = await model.findUnique({
      where: { id },
    });

    if (!record) {
      throw notFoundErrorHandler('Record');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Database', null, {
      action: 'VIEW_ENTITY_RECORD',
      entityName,
      recordId: id,
    });

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update entity record
router.put('/entities/:entityName/:id',
  requireAdmin,
  [
    param('entityName').isString().withMessage('Entity name is required'),
    param('id').isString().withMessage('Record ID is required'),
    body('data').isObject().withMessage('Data must be an object'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { entityName, id } = req.params;
    const { data } = req.body;

    // Map entity names to Prisma models
    const entityMap: Record<string, any> = {
      'User': prisma.user,
      'Student': prisma.student,
      'Center': prisma.center,
      'TestAssignment': prisma.testAssignment,
      'TestResult': prisma.testResult,
      'Stap2GoResult': prisma.stap2GoResult,
      'Ravens2Result': prisma.ravens2Result,
      'InventoryItem': prisma.inventoryItem,
      'Device': prisma.device,
      'AgendaEvent': prisma.agendaEvent,
      'SubscriptionConfiguration': prisma.subscriptionConfiguration,
      'SubscriptionBilling': prisma.subscriptionBilling,
      'Invoice': prisma.invoice,
      'EmotiTest': prisma.emotiTest,
      'EmotiTestResult': prisma.emotiTestResult,
      'BatelleSCR': prisma.batelleSCR,
      'CircuitoLogopedia': prisma.circuitoLogopedia,
      'CircuitoSensoriomotor': prisma.circuitoSensoriomotor,
      'E2P': prisma.e2P,
      'AuditLog': prisma.auditLog,
      'AnomalyAlert': prisma.anomalyAlert,
      'PseudonymMapping': prisma.pseudonymMapping,
      'RetentionPolicy': prisma.retentionPolicy,
      'DataRetentionJob': prisma.dataRetentionJob,
      'ImportTemplate': prisma.importTemplate,
      'ValueConfiguration': prisma.valueConfiguration,
      'CompanyConfiguration': prisma.companyConfiguration,
      'BackupConfiguration': prisma.backupConfiguration,
      'BackupRecord': prisma.backupRecord,
      'AuthorizationRequest': prisma.authorizationRequest,
      'AuthorizationTemplate': prisma.authorizationTemplate,
      'ExportTemplate': prisma.exportTemplate,
      'ExportRecord': prisma.exportRecord,
      'ImportRecord': prisma.importRecord,
      'Tutorial': prisma.tutorial,
      'Report': prisma.report,
      'AnonymizationLog': prisma.anonymizationLog,
    };

    const model = entityMap[entityName];
    if (!model) {
      throw notFoundErrorHandler('Entity');
    }

    // Check if record exists
    const existingRecord = await model.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw notFoundErrorHandler('Record');
    }

    // Update record
    const updatedRecord = await model.update({
      where: { id },
      data,
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Database', null, {
      action: 'UPDATE_ENTITY_RECORD',
      entityName,
      recordId: id,
      updateData: data,
    });

    logger.info('Database record updated:', {
      entityName,
      recordId: id,
      updatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedRecord,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete entity record
router.delete('/entities/:entityName/:id',
  requireAdmin,
  [
    param('entityName').isString().withMessage('Entity name is required'),
    param('id').isString().withMessage('Record ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { entityName, id } = req.params;

    // Map entity names to Prisma models
    const entityMap: Record<string, any> = {
      'User': prisma.user,
      'Student': prisma.student,
      'Center': prisma.center,
      'TestAssignment': prisma.testAssignment,
      'TestResult': prisma.testResult,
      'Stap2GoResult': prisma.stap2GoResult,
      'Ravens2Result': prisma.ravens2Result,
      'InventoryItem': prisma.inventoryItem,
      'Device': prisma.device,
      'AgendaEvent': prisma.agendaEvent,
      'SubscriptionConfiguration': prisma.subscriptionConfiguration,
      'SubscriptionBilling': prisma.subscriptionBilling,
      'Invoice': prisma.invoice,
      'EmotiTest': prisma.emotiTest,
      'EmotiTestResult': prisma.emotiTestResult,
      'BatelleSCR': prisma.batelleSCR,
      'CircuitoLogopedia': prisma.circuitoLogopedia,
      'CircuitoSensoriomotor': prisma.circuitoSensoriomotor,
      'E2P': prisma.e2P,
      'AuditLog': prisma.auditLog,
      'AnomalyAlert': prisma.anomalyAlert,
      'PseudonymMapping': prisma.pseudonymMapping,
      'RetentionPolicy': prisma.retentionPolicy,
      'DataRetentionJob': prisma.dataRetentionJob,
      'ImportTemplate': prisma.importTemplate,
      'ValueConfiguration': prisma.valueConfiguration,
      'CompanyConfiguration': prisma.companyConfiguration,
      'BackupConfiguration': prisma.backupConfiguration,
      'BackupRecord': prisma.backupRecord,
      'AuthorizationRequest': prisma.authorizationRequest,
      'AuthorizationTemplate': prisma.authorizationTemplate,
      'ExportTemplate': prisma.exportTemplate,
      'ExportRecord': prisma.exportRecord,
      'ImportRecord': prisma.importRecord,
      'Tutorial': prisma.tutorial,
      'Report': prisma.report,
      'AnonymizationLog': prisma.anonymizationLog,
    };

    const model = entityMap[entityName];
    if (!model) {
      throw notFoundErrorHandler('Entity');
    }

    // Check if record exists
    const existingRecord = await model.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      throw notFoundErrorHandler('Record');
    }

    // Delete record
    await model.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Database', null, {
      action: 'DELETE_ENTITY_RECORD',
      entityName,
      recordId: id,
      deletedData: existingRecord,
    });

    logger.info('Database record deleted:', {
      entityName,
      recordId: id,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      message: 'Record deleted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get entity relationships
router.get('/entities/:entityName/relationships',
  requireAdmin,
  [
    param('entityName').isString().withMessage('Entity name is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { entityName } = req.params;

    // Define entity relationships
    const relationships: Record<string, any[]> = {
      'User': [
        { name: 'students', type: 'one-to-many', target: 'Student', field: 'orientadorUserId' },
        { name: 'testResults', type: 'one-to-many', target: 'TestResult', field: 'examinerId' },
        { name: 'agendaEvents', type: 'one-to-many', target: 'AgendaEvent', field: 'assignedExaminerId' },
        { name: 'reports', type: 'one-to-many', target: 'Report', field: 'clinicalReviewerId' },
        { name: 'reports', type: 'one-to-many', target: 'Report', field: 'orientadorReviewerId' },
      ],
      'Student': [
        { name: 'center', type: 'many-to-one', target: 'Center', field: 'centerId' },
        { name: 'orientador', type: 'many-to-one', target: 'User', field: 'orientadorUserId' },
        { name: 'testAssignments', type: 'one-to-many', target: 'TestAssignment', field: 'studentId' },
        { name: 'testResults', type: 'one-to-many', target: 'TestResult', field: 'studentId' },
        { name: 'reports', type: 'one-to-many', target: 'Report', field: 'studentId' },
      ],
      'Center': [
        { name: 'students', type: 'one-to-many', target: 'Student', field: 'centerId' },
        { name: 'devices', type: 'one-to-many', target: 'Device', field: 'centerId' },
        { name: 'agendaEvents', type: 'one-to-many', target: 'AgendaEvent', field: 'centerId' },
      ],
      'TestAssignment': [
        { name: 'student', type: 'many-to-one', target: 'Student', field: 'studentId' },
        { name: 'testResult', type: 'one-to-one', target: 'TestResult', field: 'assignmentId' },
      ],
      'TestResult': [
        { name: 'student', type: 'many-to-one', target: 'Student', field: 'studentId' },
        { name: 'assignment', type: 'one-to-one', target: 'TestAssignment', field: 'assignmentId' },
        { name: 'examiner', type: 'many-to-one', target: 'User', field: 'examinerId' },
      ],
      'AgendaEvent': [
        { name: 'center', type: 'many-to-one', target: 'Center', field: 'centerId' },
        { name: 'assignedExaminer', type: 'many-to-one', target: 'User', field: 'assignedExaminerId' },
      ],
      'Device': [
        { name: 'center', type: 'many-to-one', target: 'Center', field: 'centerId' },
        { name: 'inventoryItem', type: 'many-to-one', target: 'InventoryItem', field: 'inventoryItemId' },
      ],
      'Invoice': [
        { name: 'subscriptionBillings', type: 'one-to-many', target: 'SubscriptionBilling', field: 'billingIds' },
      ],
      'Report': [
        { name: 'student', type: 'many-to-one', target: 'Student', field: 'studentId' },
        { name: 'clinicalReviewer', type: 'many-to-one', target: 'User', field: 'clinicalReviewerId' },
        { name: 'orientadorReviewer', type: 'many-to-one', target: 'User', field: 'orientadorReviewerId' },
      ],
    };

    const entityRelationships = relationships[entityName] || [];

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Database', null, {
      action: 'VIEW_ENTITY_RELATIONSHIPS',
      entityName,
    });

    res.json({
      success: true,
      data: entityRelationships,
      timestamp: new Date().toISOString(),
    });
  })
);

// Get database statistics
router.get('/statistics',
  requireAdmin,
  asyncHandler(async (req: any, res) => {
    const [
      totalUsers,
      totalStudents,
      totalCenters,
      totalTestResults,
      totalTestAssignments,
      totalReports,
      totalAgendaEvents,
      totalDevices,
      totalInventoryItems,
      totalSubscriptions,
      totalInvoices,
      totalAuditLogs,
      totalAnomalyAlerts,
      totalTutorials,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.center.count(),
      prisma.testResult.count(),
      prisma.testAssignment.count(),
      prisma.report.count(),
      prisma.agendaEvent.count(),
      prisma.device.count(),
      prisma.inventoryItem.count(),
      prisma.subscriptionConfiguration.count(),
      prisma.invoice.count(),
      prisma.auditLog.count(),
      prisma.anomalyAlert.count(),
      prisma.tutorial.count(),
    ]);

    const statistics = {
      totalUsers,
      totalStudents,
      totalCenters,
      totalTestResults,
      totalTestAssignments,
      totalReports,
      totalAgendaEvents,
      totalDevices,
      totalInventoryItems,
      totalSubscriptions,
      totalInvoices,
      totalAuditLogs,
      totalAnomalyAlerts,
      totalTutorials,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Database', null, {
      action: 'VIEW_DATABASE_STATISTICS',
    });

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
