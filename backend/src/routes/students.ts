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

// Get all students
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('etapa').optional().isIn(['EDUCACION_INFANTIL', 'EDUCACION_PRIMARIA', 'ESO', 'BACHILLERATO', 'FORMACION_PROFESIONAL']).withMessage('Invalid etapa'),
    query('centerId').optional().isString().withMessage('Center ID must be a string'),
    query('course').optional().isString().withMessage('Course must be a string'),
    query('classGroup').optional().isString().withMessage('Class group must be a string'),
    query('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
    query('paymentStatus').optional().isIn(['PAGADO', 'PENDIENTE', 'NA']).withMessage('Invalid payment status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const {
      page = 1,
      limit = 20,
      search,
      etapa,
      centerId,
      course,
      classGroup,
      consentGiven,
      paymentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause based on user permissions
    const where: any = {};

    // Apply role-based filtering
    if (req.user.userType === 'ORIENTADOR') {
      where.centerId = req.user.centerId;
    } else if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      where.centerId = { in: req.user.centerIds };
    } else if (req.user.userType === 'FAMILIA') {
      // Families can only see their own children
      const familyRelations = await prisma.studentFamilyRelation.findMany({
        where: { familyUserId: req.user.id },
        select: { studentId: true },
      });
      where.id = { in: familyRelations.map(rel => rel.studentId) };
    }

    // Apply filters
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { nia: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (etapa) {
      where.etapa = etapa;
    }

    if (centerId) {
      where.centerId = centerId;
    }

    if (course) {
      where.course = course;
    }

    if (classGroup) {
      where.classGroup = classGroup;
    }

    if (consentGiven) {
      where.consentGiven = consentGiven;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Get students with pagination
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          studentId: true,
          nia: true,
          fullName: true,
          phone: true,
          dni: true,
          birthDate: true,
          gender: true,
          nationality: true,
          etapa: true,
          course: true,
          classGroup: true,
          centerId: true,
          orientadorUserId: true,
          disabilityDegree: true,
          specialEducationalNeeds: true,
          medicalObservations: true,
          generalObservations: true,
          consentGiven: true,
          paymentType: true,
          paymentStatus: true,
          active: true,
          createdAt: true,
          updatedAt: true,
          center: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          orientador: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          address: {
            select: {
              id: true,
              street: true,
              number: true,
              postalCode: true,
              city: true,
              province: true,
              autonomousCommunity: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Student', null, {
      filters: { search, etapa, centerId, course, classGroup, consentGiven, paymentStatus },
      pagination: { page, limit, total },
    });

    res.json({
      success: true,
      data: students,
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

// Get student by ID
router.get('/:id',
  [
    param('id').isString().withMessage('Student ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if user can access this student's data
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        nia: true,
        fullName: true,
        phone: true,
        dni: true,
        birthDate: true,
        gender: true,
        nationality: true,
        etapa: true,
        course: true,
        classGroup: true,
        centerId: true,
        orientadorUserId: true,
        disabilityDegree: true,
        specialEducationalNeeds: true,
        medicalObservations: true,
        generalObservations: true,
        consentGiven: true,
        paymentType: true,
        paymentStatus: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        orientador: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            number: true,
            floor: true,
            door: true,
            postalCode: true,
            city: true,
            province: true,
            autonomousCommunity: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
        familyRelations: {
          select: {
            id: true,
            relationshipType: true,
            isPrimaryContact: true,
            isEmergencyContact: true,
            familyUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && student.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this student',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(student.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this student',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (req.user.userType === 'FAMILIA') {
      const isFamilyMember = student.familyRelations.some(
        rel => rel.familyUser.id === req.user.id
      );
      if (!isFamilyMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to access this student',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Set audit data
    setAuditData(req, AuditAction.DATA_ACCESS, 'Student', id);

    res.json({
      success: true,
      data: student,
      timestamp: new Date().toISOString(),
    });
  })
);

// Create student
router.post('/',
  requireClinicalStaff,
  [
    body('fullName').isString().isLength({ min: 1 }).withMessage('Full name is required'),
    body('etapa').isIn(['EDUCACION_INFANTIL', 'EDUCACION_PRIMARIA', 'ESO', 'BACHILLERATO', 'FORMACION_PROFESIONAL']).withMessage('Valid etapa is required'),
    body('course').isString().isLength({ min: 1 }).withMessage('Course is required'),
    body('classGroup').isString().isLength({ min: 1 }).withMessage('Class group is required'),
    body('centerId').isString().withMessage('Center ID is required'),
    body('birthDate').isISO8601().withMessage('Valid birth date is required'),
    body('nia').optional().isString().withMessage('NIA must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('dni').optional().isString().withMessage('DNI must be a string'),
    body('gender').optional().isString().withMessage('Gender must be a string'),
    body('nationality').optional().isString().withMessage('Nationality must be a string'),
    body('addressId').optional().isString().withMessage('Address ID must be a string'),
    body('orientadorUserId').optional().isString().withMessage('Orientador user ID must be a string'),
    body('disabilityDegree').optional().isInt({ min: 0, max: 100 }).withMessage('Disability degree must be between 0 and 100'),
    body('specialEducationalNeeds').optional().isString().withMessage('Special educational needs must be a string'),
    body('medicalObservations').optional().isString().withMessage('Medical observations must be a string'),
    body('generalObservations').optional().isString().withMessage('General observations must be a string'),
    body('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
    body('paymentType').optional().isIn(['B2B', 'B2B2C', 'NA']).withMessage('Invalid payment type'),
    body('paymentStatus').optional().isIn(['PAGADO', 'PENDIENTE', 'NA']).withMessage('Invalid payment status'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const studentData = req.body;

    // Check if center exists and user has access
    const center = await prisma.center.findUnique({
      where: { id: studentData.centerId },
    });

    if (!center) {
      throw notFoundErrorHandler('Center');
    }

    // Check permissions for center
    if (req.user.userType === 'ORIENTADOR' && studentData.centerId !== req.user.centerId) {
      throw validationErrorHandler('Cannot create student in different center');
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(studentData.centerId)) {
        throw validationErrorHandler('Cannot create student in unauthorized center');
      }
    }

    // Check if NIA already exists (if provided)
    if (studentData.nia) {
      const existingNia = await prisma.student.findUnique({
        where: { nia: studentData.nia },
      });

      if (existingNia) {
        throw validationErrorHandler('NIA already exists', {
          field: 'nia',
          message: 'NIA already exists',
        });
      }
    }

    // Generate student ID
    const lastStudent = await prisma.student.findFirst({
      orderBy: { studentId: 'desc' },
      select: { studentId: true },
    });

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentId.replace('STU_', ''));
      nextNumber = lastNumber + 1;
    }

    const studentId = `STU_${nextNumber.toString().padStart(3, '0')}`;

    // Create student
    const student = await prisma.student.create({
      data: {
        ...studentData,
        studentId,
        createdBy: req.user.id,
      },
      select: {
        id: true,
        studentId: true,
        nia: true,
        fullName: true,
        phone: true,
        dni: true,
        birthDate: true,
        gender: true,
        nationality: true,
        etapa: true,
        course: true,
        classGroup: true,
        centerId: true,
        orientadorUserId: true,
        disabilityDegree: true,
        specialEducationalNeeds: true,
        medicalObservations: true,
        generalObservations: true,
        consentGiven: true,
        paymentType: true,
        paymentStatus: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        orientador: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Student', student.id, {
      action: 'CREATE',
      studentData: {
        studentId: student.studentId,
        fullName: student.fullName,
        centerId: student.centerId,
      },
    });

    logger.info('Student created:', {
      studentId: student.id,
      studentCode: student.studentId,
      fullName: student.fullName,
      centerId: student.centerId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: student,
      timestamp: new Date().toISOString(),
    });
  })
);

// Update student
router.put('/:id',
  [
    param('id').isString().withMessage('Student ID is required'),
    body('fullName').optional().isString().isLength({ min: 1 }).withMessage('Full name must be a non-empty string'),
    body('etapa').optional().isIn(['EDUCACION_INFANTIL', 'EDUCACION_PRIMARIA', 'ESO', 'BACHILLERATO', 'FORMACION_PROFESIONAL']).withMessage('Invalid etapa'),
    body('course').optional().isString().isLength({ min: 1 }).withMessage('Course must be a non-empty string'),
    body('classGroup').optional().isString().isLength({ min: 1 }).withMessage('Class group must be a non-empty string'),
    body('centerId').optional().isString().withMessage('Center ID must be a string'),
    body('birthDate').optional().isISO8601().withMessage('Birth date must be a valid date'),
    body('nia').optional().isString().withMessage('NIA must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('dni').optional().isString().withMessage('DNI must be a string'),
    body('gender').optional().isString().withMessage('Gender must be a string'),
    body('nationality').optional().isString().withMessage('Nationality must be a string'),
    body('addressId').optional().isString().withMessage('Address ID must be a string'),
    body('orientadorUserId').optional().isString().withMessage('Orientador user ID must be a string'),
    body('disabilityDegree').optional().isInt({ min: 0, max: 100 }).withMessage('Disability degree must be between 0 and 100'),
    body('specialEducationalNeeds').optional().isString().withMessage('Special educational needs must be a string'),
    body('medicalObservations').optional().isString().withMessage('Medical observations must be a string'),
    body('generalObservations').optional().isString().withMessage('General observations must be a string'),
    body('consentGiven').optional().isIn(['SI', 'NO', 'PENDIENTE', 'NA']).withMessage('Invalid consent status'),
    body('paymentType').optional().isIn(['B2B', 'B2B2C', 'NA']).withMessage('Invalid payment type'),
    body('paymentStatus').optional().isIn(['PAGADO', 'PENDIENTE', 'NA']).withMessage('Invalid payment status'),
    body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      throw notFoundErrorHandler('Student');
    }

    // Check permissions
    if (req.user.userType === 'ORIENTADOR' && existingStudent.centerId !== req.user.centerId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to update this student',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (req.user.userType === 'CLINICA' || req.user.userType === 'EXAMINADOR') {
      if (!req.user.centerIds.includes(existingStudent.centerId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions to update this student',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if NIA already exists (if being updated)
    if (updateData.nia && updateData.nia !== existingStudent.nia) {
      const existingNia = await prisma.student.findUnique({
        where: { nia: updateData.nia },
      });

      if (existingNia) {
        throw validationErrorHandler('NIA already exists', {
          field: 'nia',
          message: 'NIA already exists',
        });
      }
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        studentId: true,
        nia: true,
        fullName: true,
        phone: true,
        dni: true,
        birthDate: true,
        gender: true,
        nationality: true,
        etapa: true,
        course: true,
        classGroup: true,
        centerId: true,
        orientadorUserId: true,
        disabilityDegree: true,
        specialEducationalNeeds: true,
        medicalObservations: true,
        generalObservations: true,
        consentGiven: true,
        paymentType: true,
        paymentStatus: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        orientador: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'Student', id, {
      action: 'UPDATE',
      updatedFields: Object.keys(updateData),
    });

    logger.info('Student updated:', {
      studentId: student.id,
      studentCode: student.studentId,
      updatedBy: req.user.id,
      updatedFields: Object.keys(updateData),
    });

    res.json({
      success: true,
      data: student,
      timestamp: new Date().toISOString(),
    });
  })
);

// Delete student (Admin only)
router.delete('/:id',
  requireAdmin,
  [
    param('id').isString().withMessage('Student ID is required'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Soft delete (set active to false)
    await prisma.student.update({
      where: { id },
      data: { active: false },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_DELETION, 'Student', id, {
      action: 'DELETE',
      studentCode: student.studentId,
      studentName: student.fullName,
    });

    logger.info('Student deleted:', {
      studentId: id,
      studentCode: student.studentId,
      studentName: student.fullName,
      deletedBy: req.user.id,
    });

    res.json({
      success: true,
      data: { message: 'Student deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  })
);

// Link family member to student
router.post('/:id/family',
  requireClinicalStaff,
  [
    param('id').isString().withMessage('Student ID is required'),
    body('familyUserId').isString().withMessage('Family user ID is required'),
    body('relationshipType').isIn(['PADRE', 'MADRE', 'TUTOR_LEGAL', 'ABUELO', 'ABUELA', 'TIO', 'TIA', 'OTRO']).withMessage('Invalid relationship type'),
    body('isPrimaryContact').optional().isBoolean().withMessage('Is primary contact must be a boolean'),
    body('isEmergencyContact').optional().isBoolean().withMessage('Is emergency contact must be a boolean'),
  ],
  validateRequest,
  asyncHandler(async (req: any, res) => {
    const { id } = req.params;
    const { familyUserId, relationshipType, isPrimaryContact = false, isEmergencyContact = false } = req.body;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw notFoundErrorHandler('Student');
    }

    // Check if family user exists and is of type FAMILIA
    const familyUser = await prisma.user.findUnique({
      where: { id: familyUserId },
    });

    if (!familyUser || familyUser.userType !== 'FAMILIA') {
      throw validationErrorHandler('Invalid family user');
    }

    // Check if relationship already exists
    const existingRelation = await prisma.studentFamilyRelation.findFirst({
      where: {
        studentId: id,
        familyUserId: familyUserId,
      },
    });

    if (existingRelation) {
      throw validationErrorHandler('Family relationship already exists');
    }

    // Create family relationship
    const familyRelation = await prisma.studentFamilyRelation.create({
      data: {
        studentId: id,
        familyUserId: familyUserId,
        relationshipType,
        isPrimaryContact,
        isEmergencyContact,
      },
      include: {
        familyUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Set audit data
    setAuditData(req, AuditAction.DATA_MODIFICATION, 'StudentFamilyRelation', familyRelation.id, {
      action: 'CREATE',
      studentId: id,
      familyUserId: familyUserId,
      relationshipType,
    });

    logger.info('Family relationship created:', {
      studentId: id,
      familyUserId: familyUserId,
      relationshipType,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: familyRelation,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
