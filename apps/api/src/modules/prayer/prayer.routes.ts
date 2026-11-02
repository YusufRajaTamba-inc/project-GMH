import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { publicSubmissionRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { asyncHandler } from '../../shared/index.js';
import { formatPaginationMeta, parsePagination } from '../../shared/pagination.js';
import { validate } from '../../shared/validate.js';
import {
  createPrayerRequestSchema,
  updatePrayerStatusSchema,
} from './prayer.schema.js';
import {
  createPrayerRequest,
  listPrayerRequests,
  updatePrayerStatus,
} from './prayer.service.js';

const router = Router();

// Public prayer request submission (anti-spam rate limited)
router.post(
  '/public/submit',
  publicSubmissionRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const payload = validate(createPrayerRequestSchema, req.body);
    const data = await createPrayerRequest(payload);

    res.status(201).json({
      success: true,
      message: 'Pokok doa telah kami terima dan akan didoakan oleh tim pendoa yayasan.',
      data,
    });
  })
);

// Admin management
router.get(
  '/',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    const { rows, total } = await listPrayerRequests({ limit, offset, cursor });
    const pagination = formatPaginationMeta(rows, total, page, limit, 'created_at');

    res.status(200).json({
      success: true,
      count: rows.length,
      prayers: rows,
      data: rows,
      pagination,
    });
  })
);

router.put(
  '/:id/status',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const payload = validate(updatePrayerStatusSchema, req.body);
    const data = await updatePrayerStatus(id, payload);

    res.status(200).json({ success: true, data });
  })
);

export default router;
