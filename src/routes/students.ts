import { Router } from 'express';
import { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, linkFamilyMember } from '../controllers/studentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateStudent } from '../middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/students - Get all students
router.get('/', getAllStudents);

// GET /api/v1/students/:id - Get student by ID
router.get('/:id', getStudentById);

// POST /api/v1/students - Create student
router.post('/', validateStudent, createStudent);

// PUT /api/v1/students/:id - Update student
router.put('/:id', validateStudent, updateStudent);

// DELETE /api/v1/students/:id - Delete student (Admin only)
router.delete('/:id', requireRole(['ADMINISTRADOR']), deleteStudent);

// POST /api/v1/students/:id/link-family - Link family member to student
router.post('/:id/link-family', linkFamilyMember);

export default router;
