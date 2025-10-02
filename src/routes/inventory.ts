import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Inventory endpoint - to be implemented' });
});

export default router;
