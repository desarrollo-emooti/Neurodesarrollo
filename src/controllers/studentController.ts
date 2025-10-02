import { Request, Response } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';

export class StudentController {
  // Get all students with pagination and filters
  static async getStudents(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        centerId, 
        etapa, 
        course, 
        classGroup, 
        consentGiven, 
        paymentStatus,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = { active: true };
      
      if (centerId) {
        where.centerId = centerId;
      }
      
      if (etapa) {
        where.etapa = etapa;
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
      
      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { studentId: { contains: search as string, mode: 'insensitive' } },
          { nia: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            center: true,
            orientador: true,
            testAssignments: {
              where: { active: true },
              orderBy: { assignedDate: 'desc' },
              take: 5
            },
            testResults: {
              orderBy: { executionDate: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.student.count({ where })
      ]);

      res.status(200).json({
        success: true,
        data: {
          students,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error getting students:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving students'
        }
      });
    }
  }

  // Get student by ID
  static async getStudentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        include: {
          center: true,
          orientador: true,
          testAssignments: {
            where: { active: true },
            orderBy: { assignedDate: 'desc' }
          },
          testResults: {
            orderBy: { executionDate: 'desc' },
            include: {
              stap2GoResult: true,
              ravens2Result: true
            }
          },
          emotiTestResults: {
            orderBy: { testDate: 'desc' }
          },
          batelleSCRs: {
            orderBy: { testDate: 'desc' }
          },
          circuitoLogopedias: {
            orderBy: { testDate: 'desc' }
          },
          circuitoSensoriomotors: {
            orderBy: { testDate: 'desc' }
          },
          e2Ps: {
            orderBy: { testDate: 'desc' }
          },
          reports: {
            orderBy: { createdAt: 'desc' }
          },
          familyRelations: true
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      logger.error('Error getting student by ID:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving student'
        }
      });
    }
  }

  // Create new student
  static async createStudent(req: Request, res: Response) {
    try {
      const studentData = req.body;

      // Generate unique student ID if not provided
      if (!studentData.studentId) {
        const lastStudent = await prisma.student.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        
        const nextNumber = lastStudent ? 
          parseInt(lastStudent.studentId.split('_').pop() || '0') + 1 : 1;
        studentData.studentId = `STU_${nextNumber.toString().padStart(3, '0')}`;
      }

      const student = await prisma.student.create({
        data: studentData,
        include: {
          center: true,
          orientador: true,
        }
      });

      logger.info(`Student created: ${student.id} - ${student.fullName}`);

      res.status(201).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      logger.error('Error creating student:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Student ID or NIA already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating student'
        }
      });
    }
  }

  // Update student
  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.studentId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const student = await prisma.student.update({
        where: { id },
        data: updateData,
        include: {
          center: true,
          orientador: true,
        }
      });

      logger.info(`Student updated: ${student.id} - ${student.fullName}`);

      res.status(200).json({
        success: true,
        data: { student }
      });
    } catch (error) {
      logger.error('Error updating student:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'NIA already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating student'
        }
      });
    }
  }

  // Delete student (soft delete)
  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await prisma.student.update({
        where: { id },
        data: { active: false },
        include: {
          center: true,
          orientador: true,
        }
      });

      logger.info(`Student deactivated: ${student.id} - ${student.fullName}`);

      res.status(200).json({
        success: true,
        data: { student },
        message: 'Student deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deleting student:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error deleting student'
        }
      });
    }
  }

  // Get student statistics
  static async getStudentStats(req: Request, res: Response) {
    try {
      const { centerId } = req.query;
      
      const where = centerId ? { centerId: centerId as string, active: true } : { active: true };

      const [
        totalStudents,
        studentsByEtapa,
        studentsByConsent,
        studentsByPayment,
        recentStudents
      ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.groupBy({
          by: ['etapa'],
          where,
          _count: { etapa: true }
        }),
        prisma.student.groupBy({
          by: ['consentGiven'],
          where,
          _count: { consentGiven: true }
        }),
        prisma.student.groupBy({
          by: ['paymentStatus'],
          where,
          _count: { paymentStatus: true }
        }),
        prisma.student.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          studentsByEtapa,
          studentsByConsent,
          studentsByPayment,
          recentStudents
        }
      });
    } catch (error) {
      logger.error('Error getting student stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving student statistics'
        }
      });
    }
  }

  // Get student evaluation history
  static async getStudentEvaluationHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await prisma.student.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          studentId: true,
          testResults: {
            orderBy: { executionDate: 'desc' },
            include: {
              stap2GoResult: true,
              ravens2Result: true
            }
          },
          emotiTestResults: {
            orderBy: { testDate: 'desc' }
          },
          batelleSCRs: {
            orderBy: { testDate: 'desc' }
          },
          circuitoLogopedias: {
            orderBy: { testDate: 'desc' }
          },
          circuitoSensoriomotors: {
            orderBy: { testDate: 'desc' }
          },
          e2Ps: {
            orderBy: { testDate: 'desc' }
          }
        }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: 'Student not found'
          }
        });
      }

      // Combine all evaluations into a timeline
      const evaluations = [
        ...student.testResults.map(result => ({
          type: 'test_result',
          date: result.executionDate,
          testName: result.testName,
          score: result.rawScore,
          interpretation: result.interpretation,
          data: result
        })),
        ...student.emotiTestResults.map(result => ({
          type: 'emoti_test',
          date: result.testDate,
          testName: result.testType,
          score: result.totalScore,
          interpretation: null,
          data: result
        })),
        ...student.batelleSCRs.map(result => ({
          type: 'batelle_scr',
          date: result.testDate,
          testName: 'Batelle SCR',
          score: result.puntuacionTotal,
          interpretation: null,
          data: result
        })),
        ...student.circuitoLogopedias.map(result => ({
          type: 'circuito_logopedia',
          date: result.testDate,
          testName: 'Circuito Logopedia',
          score: result.puntuacionTotal,
          interpretation: null,
          data: result
        })),
        ...student.circuitoSensoriomotors.map(result => ({
          type: 'circuito_sensoriomotor',
          date: result.testDate,
          testName: 'Circuito Sensoriomotor',
          score: result.puntuacionTotal,
          interpretation: null,
          data: result
        })),
        ...student.e2Ps.map(result => ({
          type: 'e2p',
          date: result.testDate,
          testName: 'E2P',
          score: result.puntuacionTotal,
          interpretation: null,
          data: result
        }))
      ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      res.status(200).json({
        success: true,
        data: {
          student: {
            id: student.id,
            fullName: student.fullName,
            studentId: student.studentId
          },
          evaluations
        }
      });
    } catch (error) {
      logger.error('Error getting student evaluation history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error retrieving student evaluation history'
        }
      });
    }
  }
}
