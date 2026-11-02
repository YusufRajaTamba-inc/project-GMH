import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import { asyncHandler } from '../../shared/index.js';
import {
  lookupMembers,
  getOrganizationStats,
  listCommittees,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  listPositions,
  createPosition,
  updatePosition,
  deletePosition,
  listPositionTenures,
  createPositionTenure,
  updateTenure,
  deleteTenure,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  listDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  listDivisionMembers,
  createDivisionMember,
  updateDivisionMember,
  deleteDivisionMember,
  getMemberOrganizationProfile,
} from './organization.service.js';

const router = Router();

// Protect all organization routes
router.use(authenticateJwt);

// ============================================================================
// HELPER: Lookup Members
// ============================================================================
router.get(
  '/lookup-members',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const search = String(req.query.search || '').trim();
    const members = await lookupMembers(search);
    res.status(200).json({ success: true, members });
  })
);

// ============================================================================
// OVERVIEW STATS
// ============================================================================
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await getOrganizationStats();
    res.status(200).json({ success: true, stats });
  })
);

// ============================================================================
// TAB 1: RIWAYAT KEPANITIAAN (COMMITTEES)
// ============================================================================
router.get(
  '/committees',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const search = String(req.query.search || '').trim();
    const year = req.query.year ? Number(req.query.year) : null;
    const status = String(req.query.status || 'ALL');
    const memberId = String(req.query.member_id || '');
    const { page, limit, offset } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });
    const wantsPagination = req.query.page !== undefined || req.query.limit !== undefined;

    const { rows, total } = await listCommittees({
      search,
      year,
      status,
      memberId,
      page,
      limit,
      offset,
      wantsPagination,
    });
    const pagination = formatPaginationMeta(rows, total, page, limit);

    res.status(200).json({
      success: true,
      count: rows.length,
      total,
      committees: rows,
      data: rows,
      pagination,
    });
  })
);

router.post(
  '/committees',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const committee = await createCommittee(req.body);
    res.status(201).json({
      success: true,
      message: 'Record kepanitiaan berhasil dicatat.',
      committee,
    });
  })
);

router.put(
  '/committees/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const committee = await updateCommittee(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Record kepanitiaan berhasil diperbarui.',
      committee,
    });
  })
);

router.delete(
  '/committees/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteCommittee(req.params.id);
    res.status(200).json({ success: true, message: 'Record kepanitiaan berhasil dihapus.' });
  })
);

// ============================================================================
// TAB 2: SUSUNAN KEPENGURUSAN YAYASAN INTI & RIWAYAT JABATAN
// ============================================================================
router.get(
  '/positions',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const positions = await listPositions();
    res.status(200).json({
      success: true,
      count: positions.length,
      positions,
    });
  })
);

router.post(
  '/positions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const position = await createPosition(req.body);
    res.status(201).json({
      success: true,
      message: 'Jabatan kepengurusan baru berhasil ditambahkan.',
      position,
    });
  })
);

router.put(
  '/positions/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const position = await updatePosition(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Jabatan kepengurusan berhasil diperbarui.',
      position,
    });
  })
);

router.delete(
  '/positions/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deletePosition(req.params.id);
    res.status(200).json({ success: true, message: 'Jabatan kepengurusan berhasil dihapus.' });
  })
);

// Position History / Tenures
router.get(
  '/positions/:id/tenures',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenures = await listPositionTenures(req.params.id);
    res.status(200).json({
      success: true,
      count: tenures.length,
      tenures,
    });
  })
);

router.post(
  '/positions/:id/tenures',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenure = await createPositionTenure(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Pejabat posisi berhasil dicatat ke dalam database.',
      tenure,
    });
  })
);

router.put(
  '/tenures/:tenureId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const tenure = await updateTenure(req.params.tenureId, req.body);
    res.status(200).json({
      success: true,
      message: 'Data riwayat jabatan berhasil diperbarui.',
      tenure,
    });
  })
);

router.delete(
  '/tenures/:tenureId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteTenure(req.params.tenureId);
    res.status(200).json({ success: true, message: 'Riwayat jabatan berhasil dihapus.' });
  })
);

// ============================================================================
// TAB 3: STAF PENUH WAKTU (FULL-TIME STAFF)
// ============================================================================
router.get(
  '/staff',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const search = String(req.query.search || '').trim();
    const departmentId = String(req.query.department_id || '');
    const status = String(req.query.status || 'ALL');

    const staff = await listStaff({ search, departmentId, status });
    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  })
);

router.post(
  '/staff',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staff = await createStaff(req.body);
    res.status(201).json({
      success: true,
      message: 'Staf penuh waktu berhasil ditambahkan.',
      staff,
    });
  })
);

router.put(
  '/staff/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const staff = await updateStaff(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Data staf berhasil diperbarui.',
      staff,
    });
  })
);

router.delete(
  '/staff/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteStaff(req.params.id);
    res.status(200).json({ success: true, message: 'Data staf berhasil dihapus.' });
  })
);

// ============================================================================
// TAB 4: DIVISI & DEPARTEMEN + ANGGOTA DIVISI
// ============================================================================
router.get(
  '/divisions',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const divisions = await listDivisions();
    res.status(200).json({
      success: true,
      count: divisions.length,
      divisions,
    });
  })
);

router.post(
  '/divisions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const division = await createDivision(req.body);
    res.status(201).json({
      success: true,
      message: 'Divisi baru berhasil dibuat.',
      division,
    });
  })
);

router.put(
  '/divisions/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const division = await updateDivision(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Divisi berhasil diperbarui.',
      division,
    });
  })
);

router.delete(
  '/divisions/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteDivision(req.params.id);
    res.status(200).json({ success: true, message: 'Divisi berhasil dihapus.' });
  })
);

// Division Members
router.get(
  '/divisions/:id/members',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const status = String(req.query.status || 'ALL');
    const members = await listDivisionMembers(req.params.id, status);
    res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  })
);

router.post(
  '/divisions/:id/members',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const member = await createDivisionMember(req.params.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Anggota berhasil ditugaskan ke dalam divisi.',
      member,
    });
  })
);

router.put(
  '/division-members/:memberAssignmentId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const member = await updateDivisionMember(req.params.memberAssignmentId, req.body);
    res.status(200).json({
      success: true,
      message: 'Data penugasan divisi berhasil diperbarui.',
      member,
    });
  })
);

router.delete(
  '/division-members/:memberAssignmentId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await deleteDivisionMember(req.params.memberAssignmentId);
    res.status(200).json({ success: true, message: 'Penugasan anggota divisi berhasil dihapus.' });
  })
);

// ============================================================================
// PROFIL ORGANISASI SATU ANGGOTA
// ============================================================================
router.get(
  '/members/:memberId/profile',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = await getMemberOrganizationProfile(req.params.memberId);
    res.status(200).json({
      success: true,
      ...profile,
    });
  })
);

export default router;
