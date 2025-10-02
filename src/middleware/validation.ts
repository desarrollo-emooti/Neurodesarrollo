import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errorDetails,
        },
        timestamp: new Date().toISOString(),
      });
    }

    req.body = value;
    next();
  };
};

// User validation schemas
export const validateUser = validate(Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  dni: Joi.string().pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i).optional(),
  birthDate: Joi.date().max('now').optional(),
  nationality: Joi.string().max(50).optional(),
  userType: Joi.string().valid('ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA').required(),
  status: Joi.string().valid('ACTIVE', 'PENDING_INVITATION', 'INVITATION_SENT', 'INACTIVE').optional(),
  address: Joi.string().max(200).optional(),
  country: Joi.string().max(50).optional(),
  autonomousCommunity: Joi.string().max(50).optional(),
  province: Joi.string().max(50).optional(),
  city: Joi.string().max(50).optional(),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).optional(),
  centerId: Joi.string().uuid().optional(),
  centerIds: Joi.array().items(Joi.string().uuid()).optional(),
  specialty: Joi.string().max(100).optional(),
  licenseNumber: Joi.string().max(50).optional(),
  allowedEtapas: Joi.array().items(Joi.string()).optional(),
  allowedCourses: Joi.array().items(Joi.string()).optional(),
  allowedGroups: Joi.array().items(Joi.string()).optional(),
  paymentMethod: Joi.string().valid('CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL').optional(),
  bankIban: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/).optional(),
  bankName: Joi.string().max(100).optional(),
}));

export const validateUserUpdate = validate(Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  dni: Joi.string().pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i).optional(),
  birthDate: Joi.date().max('now').optional(),
  nationality: Joi.string().max(50).optional(),
  address: Joi.string().max(200).optional(),
  country: Joi.string().max(50).optional(),
  autonomousCommunity: Joi.string().max(50).optional(),
  province: Joi.string().max(50).optional(),
  city: Joi.string().max(50).optional(),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).optional(),
  centerId: Joi.string().uuid().optional(),
  centerIds: Joi.array().items(Joi.string().uuid()).optional(),
  specialty: Joi.string().max(100).optional(),
  licenseNumber: Joi.string().max(50).optional(),
  allowedEtapas: Joi.array().items(Joi.string()).optional(),
  allowedCourses: Joi.array().items(Joi.string()).optional(),
  allowedGroups: Joi.array().items(Joi.string()).optional(),
  paymentMethod: Joi.string().valid('CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL').optional(),
  bankIban: Joi.string().pattern(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/).optional(),
  bankName: Joi.string().max(100).optional(),
}));

// Student validation schemas
export const validateStudent = validate(Joi.object({
  nia: Joi.string().max(20).optional(),
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  dni: Joi.string().pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i).optional(),
  birthDate: Joi.date().max('now').required(),
  gender: Joi.string().valid('M', 'F', 'O').required(),
  nationality: Joi.string().max(50).optional(),
  etapa: Joi.string().valid('Educación Infantil', 'Educación Primaria', 'ESO', 'Bachillerato', 'Formación Profesional').required(),
  course: Joi.string().max(20).required(),
  classGroup: Joi.string().max(20).required(),
  centerId: Joi.string().uuid().required(),
  orientadorUserId: Joi.string().uuid().optional(),
  disabilityDegree: Joi.number().min(0).max(100).optional(),
  specialEducationalNeeds: Joi.string().max(500).optional(),
  medicalObservations: Joi.string().max(1000).optional(),
  generalObservations: Joi.string().max(1000).optional(),
  consentGiven: Joi.string().valid('Sí', 'No', 'Pendiente', 'N/A').optional(),
  paymentType: Joi.string().valid('B2B', 'B2B2C', 'N/A').optional(),
  paymentStatus: Joi.string().valid('Pagado', 'Pendiente', 'N/A').optional(),
}));

export const validateStudentUpdate = validate(Joi.object({
  nia: Joi.string().max(20).optional(),
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  dni: Joi.string().pattern(/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i).optional(),
  birthDate: Joi.date().max('now').optional(),
  gender: Joi.string().valid('M', 'F', 'O').optional(),
  nationality: Joi.string().max(50).optional(),
  etapa: Joi.string().valid('Educación Infantil', 'Educación Primaria', 'ESO', 'Bachillerato', 'Formación Profesional').optional(),
  course: Joi.string().max(20).optional(),
  classGroup: Joi.string().max(20).optional(),
  centerId: Joi.string().uuid().optional(),
  orientadorUserId: Joi.string().uuid().optional(),
  disabilityDegree: Joi.number().min(0).max(100).optional(),
  specialEducationalNeeds: Joi.string().max(500).optional(),
  medicalObservations: Joi.string().max(1000).optional(),
  generalObservations: Joi.string().max(1000).optional(),
  consentGiven: Joi.string().valid('Sí', 'No', 'Pendiente', 'N/A').optional(),
  paymentType: Joi.string().valid('B2B', 'B2B2C', 'N/A').optional(),
  paymentStatus: Joi.string().valid('Pagado', 'Pendiente', 'N/A').optional(),
}));

// Center validation schemas
export const validateCenter = validate(Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  email: Joi.string().email().optional(),
  responsable: Joi.string().max(100).optional(),
  type: Joi.string().valid('publico', 'concertado', 'privado').required(),
  totalStudents: Joi.number().min(0).optional(),
  address: Joi.string().max(200).optional(),
  country: Joi.string().max(50).optional(),
  autonomousCommunity: Joi.string().max(50).optional(),
  province: Joi.string().max(50).optional(),
  city: Joi.string().max(50).optional(),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).optional(),
  contractDocumentUrl: Joi.string().uri().optional(),
  additionalDocuments: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
    uploadedDate: Joi.date().required(),
  })).optional(),
  observations: Joi.string().max(1000).optional(),
}));

// Test Assignment validation schemas
export const validateTestAssignment = validate(Joi.object({
  studentId: Joi.string().uuid().required(),
  testTitle: Joi.string().min(2).max(100).required(),
  testLink: Joi.string().uri().optional(),
  testDate: Joi.date().min('now').required(),
  assignedBy: Joi.string().uuid().required(),
  priority: Joi.string().valid('baja', 'media', 'alta', 'urgente').optional(),
  notes: Joi.string().max(500).optional(),
}));

// Test Result validation schemas
export const validateTestResult = validate(Joi.object({
  assignmentId: Joi.string().uuid().required(),
  studentId: Joi.string().uuid().required(),
  testName: Joi.string().min(2).max(100).required(),
  testCode: Joi.string().max(50).required(),
  academicYear: Joi.string().pattern(/^[0-9]{4}-[0-9]{4}$/).required(),
  examinerId: Joi.string().uuid().required(),
  executionDate: Joi.date().max('now').required(),
  rawScore: Joi.number().optional(),
  percentile: Joi.number().min(0).max(100).optional(),
  standardScore: Joi.number().optional(),
  interpretation: Joi.string().valid('muy_bajo', 'bajo', 'medio_bajo', 'medio', 'medio_alto', 'alto', 'muy_alto').optional(),
  detailedResults: Joi.object().optional(),
  observations: Joi.string().max(1000).optional(),
  incidents: Joi.string().max(500).optional(),
  testVersion: Joi.string().max(20).optional(),
}));

// Login validation schema
export const validateLogin = validate(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
}));

// Password reset validation schema
export const validatePasswordReset = validate(Joi.object({
  email: Joi.string().email().required(),
}));

// Password change validation schema
export const validatePasswordChange = validate(Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
}));

// Query parameter validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: errorDetails,
        },
        timestamp: new Date().toISOString(),
      });
    }

    req.query = value;
    next();
  };
};

// Common query validation schemas
export const validatePaginationQuery = validateQuery(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}));

export const validateUserQuery = validateQuery(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  userType: Joi.string().valid('ADMINISTRADOR', 'CLINICA', 'ORIENTADOR', 'EXAMINADOR', 'FAMILIA').optional(),
  status: Joi.string().valid('ACTIVE', 'PENDING_INVITATION', 'INVITATION_SENT', 'INACTIVE').optional(),
  centerId: Joi.string().uuid().optional(),
  sortBy: Joi.string().max(50).default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}));

export const validateStudentQuery = validateQuery(Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  etapa: Joi.string().valid('Educación Infantil', 'Educación Primaria', 'ESO', 'Bachillerato', 'Formación Profesional').optional(),
  centerId: Joi.string().uuid().optional(),
  course: Joi.string().max(20).optional(),
  classGroup: Joi.string().max(20).optional(),
  consentGiven: Joi.string().valid('Sí', 'No', 'Pendiente', 'N/A').optional(),
  paymentStatus: Joi.string().valid('Pagado', 'Pendiente', 'N/A').optional(),
  sortBy: Joi.string().max(50).default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}));