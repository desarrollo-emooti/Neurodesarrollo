// DISABLED: This file depends on missing Prisma relations
// TODO: Add emotiTestResults relation to EmotiTest model in Prisma schema

import { Router, Request, Response } from 'express';
const router = Router();

// All routes disabled - Prisma schema relations missing
router.all('*', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'EMOOTI tests functionality requires Prisma schema updates'
    }
  });
});

export default router;
