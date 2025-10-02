import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { setAuditData } from '../middleware/auditLogger';
import { AuditAction } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

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

// Get public test page data
router.get('/test/:studentId/:testType/:testId',
  [
    param('studentId').isString().withMessage('Student ID is required'),
    param('testType').isIn(['Batelle_SCR', 'C. Logopedia', 'C. Sensorimotor', 'E2P']).withMessage('Invalid test type'),
    param('testId').isString().withMessage('Test ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { studentId, testType, testId } = req.params;

    // Get student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        birthDate: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Get EMOOTI test configuration
    const emotiTest = await prisma.emotiTest.findFirst({
      where: {
        testType,
        isActive: true,
      },
      select: {
        id: true,
        testType: true,
        configuration: true,
        htmlContent: true,
        version: true,
        description: true,
      },
    });

    if (!emotiTest) {
      throw notFoundErrorHandler('EMOOTI test configuration');
    }

    // Calculate student age
    const birthDate = new Date(student.birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

    // Prepare test data
    const testData = {
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        birthDate: student.birthDate,
        ageInMonths,
        center: student.center,
      },
      test: {
        id: emotiTest.id,
        type: emotiTest.testType,
        configuration: emotiTest.configuration,
        htmlContent: emotiTest.htmlContent,
        version: emotiTest.version,
        description: emotiTest.description,
      },
      testId,
    };

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', emotiTest.id, {
      action: 'VIEW_PUBLIC_TEST',
      studentId: student.id,
      testType: emotiTest.testType,
      testId,
    });

    res.json({
      success: true,
      data: testData,
      timestamp: new Date().toISOString(),
    });
  })
);

// Submit public test result
router.post('/test/submit',
  [
    body('studentId').isString().withMessage('Student ID is required'),
    body('testType').isIn(['Batelle_SCR', 'C. Logopedia', 'C. Sensorimotor', 'E2P']).withMessage('Invalid test type'),
    body('testId').isString().withMessage('Test ID is required'),
    body('rawResponses').isObject().withMessage('Raw responses must be an object'),
    body('ageSelected').optional().isString().withMessage('Age selected must be a string'),
    body('completionTimeSeconds').optional().isInt({ min: 0 }).withMessage('Completion time must be a non-negative integer'),
    body('ipAddress').optional().isString().withMessage('IP address must be a string'),
    body('userAgent').optional().isString().withMessage('User agent must be a string'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      studentId,
      testType,
      testId,
      rawResponses,
      ageSelected,
      completionTimeSeconds,
      ipAddress,
      userAgent,
    } = req.body;

    // Get student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        birthDate: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Get EMOOTI test configuration
    const emotiTest = await prisma.emotiTest.findFirst({
      where: {
        testType,
        isActive: true,
      },
    });

    if (!emotiTest) {
      throw notFoundErrorHandler('EMOOTI test configuration');
    }

    // Calculate total score based on test type and responses
    let totalScore = 0;
    const responses = Object.entries(rawResponses);
    
    for (const [item, response] of responses) {
      if (response === 'Si' || response === 'Sí') {
        totalScore += 1;
      }
    }

    // Create general EMOOTI test result
    const emotiTestResult = await prisma.emotiTestResult.create({
      data: {
        studentId: student.id,
        testType,
        testDate: new Date(),
        ageAtTest: ageSelected || 'unknown',
        academicYear: new Date().getFullYear().toString(),
        rawResponses,
        totalScore,
        completionTimeSeconds: completionTimeSeconds || 0,
        status: 'completed',
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.headers['user-agent'],
      },
    });

    // Create specific test result based on test type
    let specificResult = null;
    
    switch (testType) {
      case 'Batelle_SCR':
        specificResult = await prisma.batelleSCR.create({
          data: {
            studentId: student.id,
            tipoPrueba: 'Batelle_SCR',
            idPrueba: testId,
            testDate: new Date(),
            plannedDate: new Date(),
            status: 'Realizada',
            grupoEdad: ageSelected || 'unknown',
            patientName: student.fullName,
            centerName: student.center.name,
            etapa: 'unknown',
            course: 'unknown',
            classGroup: 'unknown',
            puntuacionTotal: totalScore,
            academicYear: new Date().getFullYear().toString(),
            rawResponses,
          },
        });
        break;
        
      case 'C. Logopedia':
        specificResult = await prisma.circuitoLogopedia.create({
          data: {
            studentId: student.id,
            tipoPrueba: 'C. Logopedia',
            idPrueba: testId,
            testDate: new Date(),
            plannedDate: new Date(),
            status: 'Realizada',
            grupoEdad: ageSelected || 'unknown',
            patientName: student.fullName,
            centerName: student.center.name,
            etapa: 'unknown',
            course: 'unknown',
            classGroup: 'unknown',
            puntuacionTotal: totalScore,
            academicYear: new Date().getFullYear().toString(),
            rawResponses,
          },
        });
        break;
        
      case 'C. Sensorimotor':
        specificResult = await prisma.circuitoSensoriomotor.create({
          data: {
            studentId: student.id,
            tipoPrueba: 'C. Sensorimotor',
            idPrueba: testId,
            testDate: new Date(),
            plannedDate: new Date(),
            status: 'Realizada',
            grupoEdad: ageSelected || 'unknown',
            patientName: student.fullName,
            centerName: student.center.name,
            etapa: 'unknown',
            course: 'unknown',
            classGroup: 'unknown',
            puntuacionTotal: totalScore,
            academicYear: new Date().getFullYear().toString(),
            rawResponses,
          },
        });
        break;
        
      case 'E2P':
        specificResult = await prisma.e2P.create({
          data: {
            studentId: student.id,
            tipoPrueba: 'E2P',
            idPrueba: testId,
            testDate: new Date(),
            plannedDate: new Date(),
            status: 'Realizada',
            grupoEdad: ageSelected || 'unknown',
            patientName: student.fullName,
            centerName: student.center.name,
            etapa: 'unknown',
            course: 'unknown',
            classGroup: 'unknown',
            puntuacionTotal: totalScore,
            academicYear: new Date().getFullYear().toString(),
            rawResponses,
          },
        });
        break;
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTestResult', emotiTestResult.id, {
      action: 'SUBMIT_PUBLIC_TEST',
      studentId: student.id,
      testType,
      testId,
      totalScore,
      completionTimeSeconds,
    });

    logger.info('Public EMOOTI test submitted:', {
      studentId: student.id,
      studentName: student.fullName,
      testType,
      testId,
      totalScore,
      completionTimeSeconds,
      ipAddress: ipAddress || req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        resultId: emotiTestResult.id,
        specificResultId: specificResult?.id,
        totalScore,
        testType,
        studentName: student.fullName,
        centerName: student.center.name,
      },
      message: 'Test submitted successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

// Get test completion confirmation
router.get('/test/confirmation/:resultId',
  [
    param('resultId').isString().withMessage('Result ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { resultId } = req.params;

    const result = await prisma.emotiTestResult.findUnique({
      where: { id: resultId },
      select: {
        id: true,
        studentId: true,
        testType: true,
        testDate: true,
        totalScore: true,
        status: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      throw notFoundErrorHandler('Test result');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTestResult', resultId, {
      action: 'VIEW_TEST_CONFIRMATION',
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Health check endpoint
router.get('/health',
  asyncHandler(async (req: any, res) => {
    res.json({
      success: true,
      message: 'EMOOTI Public API is running',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
