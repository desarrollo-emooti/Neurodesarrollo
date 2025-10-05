// DISABLED: This file depends on missing middleware and Prisma enums
// TODO: Create validateRequest middleware, export authorizeRoles from auth
// TODO: Add missing Prisma enums: AnomalySeverity, AnomalyStatus, RetentionPolicyStatus, DataRetentionJobStatus
// TODO: Create rgpdController

import { Router, Request, Response } from 'express';
const router = Router();

// All routes disabled - dependencies not implemented
router.all('*', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'RGPD functionality is not yet fully implemented'
    }
  });
});

export default router;
