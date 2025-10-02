import { Router } from 'express';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser, bulkUsers } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateUser } from '../middleware/validation';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/users - Get all users (Admin only)
router.get('/', requireRole(['ADMINISTRADOR']), getAllUsers);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', getUserById);

// POST /api/v1/users - Create user (Admin only)
router.post('/', requireRole(['ADMINISTRADOR']), validateUser, createUser);

// PUT /api/v1/users/:id - Update user
router.put('/:id', validateUser, updateUser);

// DELETE /api/v1/users/:id - Delete user (Admin only)
router.delete('/:id', requireRole(['ADMINISTRADOR']), deleteUser);

// POST /api/v1/users/bulk - Bulk operations (Admin only)
router.post('/bulk', requireRole(['ADMINISTRADOR']), bulkUsers);

export default router;
