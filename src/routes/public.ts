import { Router } from 'express';

const router = Router();

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Public health check',
    timestamp: new Date().toISOString(),
  });
});

// Public test submission endpoint
router.post('/test-submission', (req, res) => {
  res.json({
    success: true,
    message: 'Public test submission endpoint - to be implemented',
    timestamp: new Date().toISOString(),
  });
});

export default router;
