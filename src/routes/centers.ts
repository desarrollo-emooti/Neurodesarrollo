import { Router } from 'express';
import { getAllCenters, getCenterById, createCenter, updateCenter, deleteCenter } from '../controllers/centerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/v1/centers - Get all centers
router.get('/', getAllCenters);

// GET /api/v1/centers/:id - Get center by ID
router.get('/:id', getCenterById);

// POST /api/v1/centers - Create center (Admin only)
router.post('/', requireRole(['ADMINISTRADOR']), createCenter);

// PUT /api/v1/centers/:id - Update center (Admin only)
router.put('/:id', requireRole(['ADMINISTRADOR']), updateCenter);

// DELETE /api/v1/centers/:id - Delete center (Admin only)
router.delete('/:id', requireRole(['ADMINISTRADOR']), deleteCenter);

export default router;
