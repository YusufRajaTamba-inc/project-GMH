import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/index.js';
import * as notificationsService from './notifications.service.js';

const router = Router();

// GET /api/v1/notifications
router.get(
  '/',
  authenticateJwt,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await notificationsService.getOperationalNotifications();
    res.status(200).json({
      success: true,
      ...result,
    });
  })
);

export default router;
