import { Router } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler, notFoundErrorHandler, validationErrorHandler } from '../middleware/errorHandler';
import { verifyToken, requireAdmin, requireClinicalStaff } from './auth';
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

// Get all EMOOTI tests
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('testType').optional().isIn(['BATELLE_SCR', 'CIRCUITO_LOGOPEDIA', 'CIRCUITO_SENSORIOMOTOR', 'E2P']).withMessage('Invalid test type'),
    query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      testType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (testType) {
      where.testType = testType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Get EMOOTI tests with pagination
    const [tests, total] = await Promise.all([
      prisma.emotiTest.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          testType: true,
          version: true,
          description: true,
          isActive: true,
          createdBy: true,
          lastModified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              emotiTestResults: true,
            },
          },
        },
      }),
      prisma.emotiTest.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', null, {
      filters: { testType, isActive },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: tests,
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

// Get EMOOTI test by ID
router.get('/:id',
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    const test = await prisma.emotiTest.findUnique({
      where: { id },
      select: {
        id: true,
        testType: true,
        configuration: true,
        htmlContent: true,
        version: true,
        description: true,
        isActive: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
        emotiTestResults: {
          select: {
            id: true,
            studentId: true,
            testDate: true,
            ageAtTest: true,
            totalScore: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                studentId: true,
                fullName: true,
                etapa: true,
                course: true,
                classGroup: true,
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
        },
      },
    });

    if (!test) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', id);

    res.json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create EMOOTI test (Admin only)
router.post('/',
  requireAdmin,
  [
    body('testType').isIn(['BATELLE_SCR', 'CIRCUITO_LOGOPEDIA', 'CIRCUITO_SENSORIOMOTOR', 'E2P']).withMessage('Valid test type is required'),
    body('configuration').isObject().withMessage('Configuration is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const testData = req.body;

    // Check if test type already exists
    const existingTest = await prisma.emotiTest.findFirst({
      where: {
        testType: testData.testType,
        isActive: true,
      },
    });

    if (existingTest) {
      throw validationErrorHandler('Active EMOOTI test of this type already exists', {
        field: 'testType',
        message: 'Active EMOOTI test of this type already exists',
      });
    }

    // Create EMOOTI test
    const test = await prisma.emotiTest.create({
      data: {
        ...testData,
        createdBy: req.user.id,
        lastModified: new Date(),
      },
      select: {
        id: true,
        testType: true,
        configuration: true,
        htmlContent: true,
        version: true,
        description: true,
        isActive: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', test.id, {
      action: 'CREATE',
      testData: {
        testType: test.testType,
        version: test.version,
      },
    });

    logger.info('EMOOTI test created:', {
      testId: test.id,
      testType: test.testType,
      version: test.version,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update EMOOTI test (Admin only)
router.put('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
    body('configuration').optional().isObject().withMessage('Configuration must be an object'),
    body('htmlContent').optional().isString().withMessage('HTML content must be a string'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('version').optional().isString().withMessage('Version must be a string'),
    body('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if test exists
    const existingTest = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!existingTest) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    // Update test
    const test = await prisma.emotiTest.update({
      where: { id },
      data: {
        ...updateData,
        lastModified: new Date(),
      },
      select: {
        id: true,
        testType: true,
        configuration: true,
        htmlContent: true,
        version: true,
        description: true,
        isActive: true,
        createdBy: true,
        lastModified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('EMOOTI test updated:', {
      testId: test.id,
      testType: test.testType,
      version: test.version,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete EMOOTI test (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            emotiTestResults: true,
          },
        },
      },
    });

    if (!test) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    // Check if test has results
    if (test._count.emotiTestResults > 0) {
      throw validationErrorHandler('Cannot delete EMOOTI test with existing results', {
        resultsCount: test._count.emotiTestResults,
      });
    }

    // Delete test
    await prisma.emotiTest.delete({
      where: { id },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'EmotiTest', id, {
      action: 'DELETE',
      testData: {
        testType: test.testType,
        version: test.version,
      },
    });

    logger.info('EMOOTI test deleted:', {
      testId: id,
      testType: test.testType,
      version: test.version,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'EMOOTI test deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Generate HTML for EMOOTI test
router.post('/:id/generate-html',
  requireAdmin,
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!test) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    // TODO: Implement HTML generation using LLM
    // This would use OpenAI API to generate HTML based on configuration
    const htmlContent = generateEmotiTestHTML(test.configuration, test.testType);

    // Update test with generated HTML
    const updatedTest = await prisma.emotiTest.update({
      where: { id },
      data: {
        htmlContent,
        lastModified: new Date(),
      },
      select: {
        id: true,
        testType: true,
        htmlContent: true,
        version: true,
        lastModified: true,
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'EmotiTest', id, {
      action: 'GENERATE_HTML',
    });

    logger.info('EMOOTI test HTML generated:', {
      testId: test.id,
      testType: test.testType,
      generatedBy: req.user.id,
    });

    res.json({
      success: true,
      data: updatedTest,
      timestamp: new Date().toISOString(),
    });
  })
);

// Preview EMOOTI test
router.get('/:id/preview',
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!test) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    if (!test.htmlContent) {
      throw validationErrorHandler('HTML content not available for this test');
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTest', id, {
      action: 'PREVIEW',
    });

    res.json({
      success: true,
      data: {
        id: test.id,
        testType: test.testType,
        htmlContent: test.htmlContent,
        version: test.version,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// Get EMOOTI test results
router.get('/:id/results',
  [
    param('id').isString().withMessage('EMOOTI test ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('studentId').optional().isString().withMessage('Student ID must be a string'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('academicYear').optional().isString().withMessage('Academic year must be a string'),
    query('status').optional().isIn(['COMPLETED', 'PARTIAL', 'ABANDONED']).withMessage('Invalid status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      studentId,
      centerId,
      academicYear,
      status,
      sortBy = 'testDate',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Check if test exists
    const test = await prisma.emotiTest.findUnique({
      where: { id },
    });

    if (!test) {
      throw notFoundErrorHandler('EMOOTI test');
    }

    // Build where clause based on user permissions
    const where: any = {
      testType: test.testType,
    };

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.student = { centerId: req.user.centerId };
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.student = { centerId: { in: req.user.centerIds } };
    } else if (req.user.userType === 'FAMILIA') {
      // Families can only see results for their children
      const familyRelations = await prisma.studentFamilyRelation.findMany({
        where: { familyUserId: req.user.id },
        select: { studentId: true },
      });
      where.studentId = { in: familyRelations.map(rel => rel.studentId) };
    }

    // Apply filters
    if (studentId) {
      where.studentId = studentId;
    }

    if (centerId) {
      where.student = { ...where.student, centerId };
    }

    if (academicYear) {
      where.academicYear = academicYear;
    }

    if (status) {
      where.status = status;
    }

    // Get results with pagination
    const [results, total] = await Promise.all([
      prisma.emotiTestResult.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          studentId: true,
          testType: true,
          testDate: true,
          ageAtTest: true,
          academicYear: true,
          totalScore: true,
          completionTimeSeconds: true,
          status: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          student: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
              etapa: true,
              course: true,
              classGroup: true,
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
      }),
      prisma.emotiTestResult.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTestResult', null, {
      action: 'LIST_RESULTS',
      testId: id,
      filters: { studentId, centerId, academicYear, status },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: results,
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

// Get EMOOTI test result by ID
router.get('/results/:resultId',
  [
    param('resultId').isString().withMessage('EMOOTI test result ID is required'),
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
        ageAtTest: true,
        academicYear: true,
        rawResponses: true,
        totalScore: true,
        completionTimeSeconds: true,
        status: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            etapa: true,
            course: true,
            classGroup: true,
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
      throw notFoundErrorHandler('EMOOTI test result');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && result.student.center.id !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this test result',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(result.student.center.id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.user.userType === 'FAMILIA') {
      const isFamilyMember = await prisma.studentFamilyRelation.findFirst({
        where: {
          studentId: result.studentId,
          familyUserId: req.user.id,
        },
      });
      if (!isFamilyMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this test result',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'EmotiTestResult', resultId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// Helper function to generate HTML for EMOOTI test
function generateEmotiTestHTML(configuration: any, testType: string): string {
  // This is a placeholder implementation
  // In a real implementation, this would use OpenAI API to generate HTML
  // based on the configuration and test type
  
  const baseHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EMOOTI Test - ${testType}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .question { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .options { display: flex; gap: 10px; margin-top: 10px; }
        .option { padding: 10px 20px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; }
        .option.selected { background-color: #007bff; color: white; }
        .submit-btn { padding: 15px 30px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>EMOOTI Test - ${testType}</h1>
    <div id="test-container">
        <!-- Test content will be generated here -->
    </div>
    <button class="submit-btn" onclick="submitTest()">Enviar Test</button>
    
    <script>
        // Test configuration
        window.emotiTestConfig = ${JSON.stringify(configuration)};
        window.emotiStudentData = window.emotiStudentData || {};
        
        // Generate test questions based on configuration
        function generateTest() {
            // Implementation would go here
        }
        
        function submitTest() {
            // Implementation would go here
        }
        
        // Initialize test when page loads
        document.addEventListener('DOMContentLoaded', generateTest);
    </script>
</body>
</html>`;

  return baseHTML;
}

export default router;
