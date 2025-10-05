// DISABLED: This file uses Prisma models that don't exist in the schema
// TODO: Implement these models or remove this functionality

import { Router, Request, Response } from 'express';
const router = Router();

// All routes disabled - models not implemented
router.get('*', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'This functionality is not yet implemented'
    }
  });
});

export default router;
