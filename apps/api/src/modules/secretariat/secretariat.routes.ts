import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import {
  getSecretariatStats,
  getNumberingConfig,
  updateNumberingConfig,
  getNextOutgoingNumber,
  listOutgoingLetters,
  createOutgoingLetter,
  getOutgoingLetterById,
  updateOutgoingLetter,
  deleteOutgoingLetter,
  listIncomingLetters,
  createIncomingLetter,
  getIncomingLetterById,
  updateIncomingLetter,
  deleteIncomingLetter,
} from './secretariat.service.js';

const router = Router();

// ============================================================================
// 1. STATS
// ============================================================================
router.get(
  '/stats',
  authenticateJwt,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await getSecretariatStats();
    res.status(200).json({ success: true, data });
  })
);

// ============================================================================
// 2. NUMBERING CONFIGURATION & PREVIEW
// ============================================================================
router.get(
  '/numbering-config',
  authenticateJwt,
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await getNumberingConfig();
    res.status(200).json({ success: true, ...result });
  })
);

router.put(
  '/numbering-config',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await updateNumberingConfig(req.body);
    res.status(200).json({
      success: true,
      message: 'Konfigurasi penomoran surat berhasil diperbarui.',
      ...result,
    });
  })
);

router.get(
  '/outgoing/next-number',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = (req.query.category as string) || 'SK';
    const rawDate = req.query.date as string;
    const result = await getNextOutgoingNumber({ category, date: rawDate });
    res.status(200).json({ success: true, ...result });
  })
);

// ============================================================================
// 3. SURAT KELUAR (OUTGOING LETTERS)
// ============================================================================
router.get(
  '/outgoing',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, category, status } = req.query;
    const { limit, offset, page } = parsePagination(req);

    const { rows, total } = await listOutgoingLetters({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      letters: rows,
      meta: formatPaginationMeta(rows, total, page, limit),
    });
  })
);

router.post(
  '/outgoing',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || null;
    const { finalLetterNumber, letter } = await createOutgoingLetter(userId, req.body);
    res.status(201).json({
      success: true,
      message: `Surat keluar dengan nomor '${finalLetterNumber}' berhasil dibuat.`,
      letter,
    });
  })
);

router.get(
  '/outgoing/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const letter = await getOutgoingLetterById(req.params.id);
    res.status(200).json({ success: true, letter });
  })
);

router.put(
  '/outgoing/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const letter = await updateOutgoingLetter(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Data surat keluar berhasil diperbarui.',
      letter,
    });
  })
);

router.delete(
  '/outgoing/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { letter_number } = await deleteOutgoingLetter(req.params.id);
    res.status(200).json({
      success: true,
      message: `Surat keluar '${letter_number}' berhasil dihapus.`,
    });
  })
);

// ============================================================================
// 4. SURAT MASUK (INCOMING LETTERS)
// ============================================================================
router.get(
  '/incoming',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, status, disposition_to } = req.query;
    const { limit, offset, page } = parsePagination(req);

    const { rows, total } = await listIncomingLetters({
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      disposition_to: disposition_to ? String(disposition_to) : undefined,
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      letters: rows,
      meta: formatPaginationMeta(rows, total, page, limit),
    });
  })
);

router.post(
  '/incoming',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id || null;
    const { finalAgenda, letter } = await createIncomingLetter(userId, req.body);
    res.status(201).json({
      success: true,
      message: `Surat masuk dengan agenda '${finalAgenda}' berhasil dicatat.`,
      letter,
    });
  })
);

router.get(
  '/incoming/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const letter = await getIncomingLetterById(req.params.id);
    res.status(200).json({ success: true, letter });
  })
);

router.put(
  '/incoming/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const letter = await updateIncomingLetter(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Data surat masuk berhasil diperbarui.',
      letter,
    });
  })
);

router.delete(
  '/incoming/:id',
  authenticateJwt,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { agenda_number } = await deleteIncomingLetter(req.params.id);
    res.status(200).json({
      success: true,
      message: `Surat masuk dengan agenda '${agenda_number}' berhasil dihapus.`,
    });
  })
);

export default router;
