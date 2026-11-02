import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';
import { publicSubmissionRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import {
  getPublicAvailableAssets,
  checkAssetAvailability,
  submitPublicLoanRequest,
  trackPublicLoan,
  listAdminAssets,
  listAdminLoans,
  createAdminLoan,
  returnLoan,
  approveLoan,
  rejectLoan,
  handoverLoan,
  getAssetDetailWithLoans,
  createAsset,
  updateAsset,
  deleteAsset,
} from './assets.service.js';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================
router.get(
  '/public/available',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const assets = await getPublicAvailableAssets();
    res.status(200).json({
      success: true,
      count: assets.length,
      assets,
    });
  })
);

router.get(
  '/public/check-availability',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { assetId, quantity, borrowedAt, expectedReturnAt } = req.query;
    const result = await checkAssetAvailability({
      assetId: String(assetId || ''),
      quantity: quantity !== undefined ? Number(quantity) : 1,
      borrowedAt: borrowedAt ? String(borrowedAt) : undefined,
      expectedReturnAt: expectedReturnAt ? String(expectedReturnAt) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  })
);

router.post(
  '/public/request',
  publicSubmissionRateLimiter,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await submitPublicLoanRequest(req.body);
    res.status(201).json({
      success: true,
      message: 'Permohonan pinjaman aset berhasil dikirim. Silakan simpan nomor tiket untuk melacak progres.',
      ...result,
    });
  })
);

const handleTrackRequest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const code = (req.query.code || req.params.query || '').toString().trim();
  const phone = (req.query.phone || req.query.phoneSuffix || '').toString().trim();
  const requests = await trackPublicLoan({ code, phone });
  res.status(200).json({
    success: true,
    count: requests.length,
    requests,
  });
});

router.get('/public/track', handleTrackRequest);
router.get('/public/track/:query', handleTrackRequest);

// ============================================================================
// ADMIN / INTERNAL PROTECTED ROUTES
// ============================================================================
router.use(authenticateJwt);
router.use(authorizePermission('ASSETS'));

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 50, maxLimit: 200 });
    const { condition, type, search } = req.query;

    const { rows, total } = await listAdminAssets({
      page,
      limit,
      offset,
      cursor: cursor ? String(cursor) : undefined,
      condition: condition ? String(condition) : undefined,
      type: type ? String(type) : undefined,
      search: search ? String(search) : undefined,
    });
    const pagination = formatPaginationMeta(rows, total, page, limit, 'asset_code');

    res.status(200).json({
      success: true,
      count: rows.length,
      assets: rows,
      data: rows,
      pagination,
    });
  })
);

router.get(
  '/loans',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, loanType } = req.query;
    const loans = await listAdminLoans({
      status: status ? String(status) : undefined,
      loanType: loanType ? String(loanType) : undefined,
    });
    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
      data: loans,
    });
  })
);

router.post(
  '/loans',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, loan } = await createAdminLoan(req.body);
    res.status(201).json({
      success: true,
      message: `Pencatatan ${type === 'SEWA' ? 'penyewaan' : 'peminjaman'} aset berhasil disimpan.`,
      loan,
    });
  })
);

router.put(
  '/loans/:id/return',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loan = await returnLoan(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Aset berhasil dikembalikan ke inventaris yayasan.',
      loan,
    });
  })
);

router.put(
  '/loans/:id/approve',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const adminUserId = req.user?.id || null;
    const { requestCode, loan } = await approveLoan(req.params.id, adminUserId, req.body);
    res.status(200).json({
      success: true,
      message: `Permohonan pinjaman (${requestCode}) berhasil disetujui.`,
      loan,
    });
  })
);

router.put(
  '/loans/:id/reject',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const adminUserId = req.user?.id || null;
    const { requestCode, loan } = await rejectLoan(req.params.id, adminUserId, req.body);
    res.status(200).json({
      success: true,
      message: `Permohonan pinjaman (${requestCode}) telah ditolak.`,
      loan,
    });
  })
);

router.put(
  '/loans/:id/handover',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loan = await handoverLoan(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Aset berhasil diserahterimakan kepada pemohon (Status aktif dipinjam).',
      loan,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const asset = await getAssetDetailWithLoans(req.params.id);
    res.status(200).json({
      success: true,
      asset,
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const asset = await createAsset(req.body);
    res.status(201).json({
      success: true,
      message: 'Aset berhasil didaftarkan.',
      asset,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const asset = await updateAsset(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Data aset berhasil diperbarui.',
      asset,
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteAsset(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Aset berhasil dihapus dari inventaris.',
    });
  })
);

export default router;
