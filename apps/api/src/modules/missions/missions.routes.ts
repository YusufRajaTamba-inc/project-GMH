import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import { asyncHandler } from '../../shared/index.js';
import {
  listMissionActivities,
  getMissionActivityById,
  createMissionActivity,
  updateMissionActivity,
  recordMissionCashTransaction,
  deleteMissionCashTransaction,
  updateMissionRundown,
  updateMissionTasks,
  updateMissionCommittees,
  updateMissionStatus,
  deleteMissionActivity,
} from './missions.service.js';

const router = Router();

// Protect all mission routes
router.use(authenticateJwt);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, search } = req.query;
    const { page, limit, offset } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });
    const wantsPagination = req.query.page !== undefined || req.query.limit !== undefined;

    const { rows, total } = await listMissionActivities({
      status: status ? String(status) : undefined,
      search: search ? String(search) : undefined,
      limit,
      offset,
      wantsPagination,
    });

    const pagination = formatPaginationMeta(rows, total, page, limit);

    res.status(200).json({
      success: true,
      count: rows.length,
      total,
      activities: rows,
      data: rows,
      pagination,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await getMissionActivityById(req.params.id);
    res.status(200).json({ success: true, activity });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await createMissionActivity(req.user?.id, req.body);
    res.status(201).json({
      success: true,
      message: `Dokumen kegiatan "${activity.title}" berhasil dirintis!`,
      activity,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await updateMissionActivity(req.params.id, req.user?.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Rincian kegiatan berhasil diperbarui.',
      activity,
    });
  })
);

router.post(
  '/:id/transactions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await recordMissionCashTransaction(
      req.params.id,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi kas kegiatan berhasil dicatat ke jurnal mandiri.',
      ...result,
    });
  })
);

router.delete(
  '/:id/transactions/:trxId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await deleteMissionCashTransaction(
      req.params.id,
      req.params.trxId,
      req.user?.id,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      message: 'Transaksi kas berhasil dihapus.',
      activity,
    });
  })
);

router.put(
  '/:id/rundown',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await updateMissionRundown(req.params.id, req.body);
    res.status(200).json({ success: true, activity });
  })
);

router.put(
  '/:id/tasks',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await updateMissionTasks(req.params.id, req.body);
    res.status(200).json({ success: true, activity });
  })
);

router.put(
  '/:id/committees',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await updateMissionCommittees(req.params.id, req.body);
    res.status(200).json({ success: true, activity });
  })
);

router.put(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activity = await updateMissionStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Status kegiatan berhasil diubah menjadi ${req.body.status}.`,
      activity,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteMissionActivity(req.params.id);
    res.status(200).json({ success: true, message: 'Dokumen kegiatan misi berhasil dihapus.' });
  })
);

export default router;
