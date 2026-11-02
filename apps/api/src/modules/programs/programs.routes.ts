import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import { asyncHandler } from '../../shared/index.js';
import {
  listPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  recordProgramCashTransaction,
  deleteProgramCashTransaction,
  updateProgramRundown,
  updateProgramTasks,
  updateProgramCommittees,
  updateProgramStatus,
  deleteProgram,
} from './programs.service.js';

const router = Router();

// Protect all program routes
router.use(authenticateJwt);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 50, maxLimit: 100 });
    const { category, search, status } = req.query;

    const { rows, total } = await listPrograms({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      cursor: cursor ? String(cursor) : undefined,
      limit,
      offset,
    });

    const pagination = formatPaginationMeta(rows, total, page, limit, 'event_datetime');

    res.status(200).json({
      success: true,
      count: rows.length,
      programs: rows,
      data: rows,
      pagination,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await getProgramById(req.params.id);
    res.status(200).json({ success: true, program });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await createProgram(req.user?.id, req.body);
    res.status(201).json({
      success: true,
      message: `Program "${program.program_title}" berhasil dibuat!`,
      program,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await updateProgram(req.params.id, req.user?.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Rincian program berhasil diperbarui.',
      program,
    });
  })
);

router.post(
  '/:id/transactions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await recordProgramCashTransaction(
      req.params.id,
      req.user?.id,
      req.ip,
      req.headers['user-agent'],
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Transaksi kas program berhasil dicatat.',
      ...result,
    });
  })
);

router.delete(
  '/:id/transactions/:trxId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await deleteProgramCashTransaction(
      req.params.id,
      req.params.trxId,
      req.user?.id,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      message: 'Transaksi kas berhasil dihapus.',
      program,
    });
  })
);

router.put(
  '/:id/rundown',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await updateProgramRundown(req.params.id, req.body);
    res.status(200).json({ success: true, program });
  })
);

router.put(
  '/:id/tasks',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await updateProgramTasks(req.params.id, req.body);
    res.status(200).json({ success: true, program });
  })
);

router.put(
  '/:id/committees',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await updateProgramCommittees(req.params.id, req.body);
    res.status(200).json({ success: true, program });
  })
);

router.put(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const program = await updateProgramStatus(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: `Status program berhasil diubah menjadi ${req.body.status}.`,
      program,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteProgram(req.params.id);
    res.status(200).json({ success: true, message: 'Program kegiatan berhasil dihapus.' });
  })
);

export default router;
