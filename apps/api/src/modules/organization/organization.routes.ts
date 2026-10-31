import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

// Protect all organization routes
router.use(authenticateJwt);

// ============================================================================
// HELPER: Lookup Members (Untuk Dropdown Pemilihan Nama Anggota)
// ============================================================================
router.get('/lookup-members', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim();
    let query = `
      SELECT 
        m.id, 
        m.member_number, 
        m.full_name, 
        m.email, 
        m.phone_number, 
        m.membership_type,
        ap.faculty,
        ap.graduation_year
      FROM members m
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      WHERE m.is_active = TRUE
    `;
    const params: any[] = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.full_name ILIKE $${params.length} OR m.member_number ILIKE $${params.length} OR m.email ILIKE $${params.length})`;
    }
    query += ` ORDER BY m.full_name ASC LIMIT 50`;

    const result = await db.query(query, params);
    res.status(200).json({ success: true, members: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar anggota.', error: err.message });
  }
});

// ============================================================================
// OVERVIEW STATS
// ============================================================================
router.get('/stats', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const committeeCount = await db.query(`SELECT COUNT(*)::int as count FROM committee_records`);
    const positionCount = await db.query(`SELECT COUNT(*)::int as count FROM org_positions WHERE is_active = TRUE`);
    const staffCount = await db.query(`SELECT COUNT(*)::int as count FROM staff_members WHERE is_active = TRUE`);
    const divisionCount = await db.query(`SELECT COUNT(*)::int as count FROM departments WHERE is_active = TRUE`);

    res.status(200).json({
      success: true,
      stats: {
        totalCommittees: committeeCount.rows[0]?.count || 0,
        totalPositions: positionCount.rows[0]?.count || 0,
        totalStaff: staffCount.rows[0]?.count || 0,
        totalDivisions: divisionCount.rows[0]?.count || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat statistik organisasi.', error: err.message });
  }
});

// ============================================================================
// TAB 1: RIWAYAT KEPANITIAAN (Ordered by created_at DESC)
// ============================================================================
router.get('/committees', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim();
    const year = req.query.year ? Number(req.query.year) : null;
    const status = String(req.query.status || 'ALL');
    const memberId = String(req.query.member_id || '');
    const { page, limit, offset } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });
    // Backward compatibility: paginate only when the client explicitly asks for it.
    const wantsPagination = req.query.page !== undefined || req.query.limit !== undefined;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(
        `(cr.committee_name ILIKE $${params.length} OR cr.role_title ILIKE $${params.length} OR m.full_name ILIKE $${params.length})`
      );
    }
    if (year) {
      params.push(year);
      whereConditions.push(`cr.event_year = $${params.length}`);
    }
    if (status !== 'ALL') {
      params.push(status);
      whereConditions.push(`cr.status = $${params.length}`);
    }
    if (memberId) {
      params.push(memberId);
      whereConditions.push(`cr.member_id = $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int as total
       FROM committee_records cr
       JOIN members m ON cr.member_id = m.id${whereClause}`,
      [...params]
    );
    const total = countRes.rows[0]?.total || 0;

    let dataQuery = `
      SELECT 
        cr.id,
        cr.member_id,
        cr.committee_name,
        cr.role_title,
        cr.event_year,
        cr.period,
        cr.start_date,
        cr.end_date,
        cr.status,
        cr.description,
        cr.created_at,
        cr.updated_at,
        m.full_name as member_name,
        m.member_number,
        m.phone_number,
        m.email,
        ap.faculty,
        ap.graduation_year
      FROM committee_records cr
      JOIN members m ON cr.member_id = m.id
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      ${whereClause}
      ORDER BY cr.created_at DESC
    `;
    const dataParams = [...params];

    if (wantsPagination) {
      dataParams.push(limit);
      dataQuery += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      dataQuery += ` OFFSET $${dataParams.length}`;
    }

    const result = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(result.rows, total, page, limit);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      total,
      committees: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat kepanitiaan.', error: err.message });
  }
});

router.post('/committees', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      member_id,
      committee_name,
      role_title,
      event_year,
      period,
      start_date,
      end_date,
      status,
      description,
    } = req.body;

    if (!member_id || !committee_name || !role_title) {
      res.status(400).json({ success: false, message: 'Anggota, nama kepanitiaan, dan jabatan/posisi wajib diisi.' });
      return;
    }

    const insertQuery = `
      INSERT INTO committee_records (
        member_id, committee_name, role_title, event_year, period, start_date, end_date, status, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [
      member_id,
      committee_name,
      role_title,
      event_year || null,
      period || (event_year ? String(event_year) : null),
      start_date || null,
      end_date || null,
      status || 'SELESAI',
      description || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Record kepanitiaan berhasil dicatat.',
      committee: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan record kepanitiaan.', error: err.message });
  }
});

router.put('/committees/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      member_id,
      committee_name,
      role_title,
      event_year,
      period,
      start_date,
      end_date,
      status,
      description,
    } = req.body;

    const updateQuery = `
      UPDATE committee_records
      SET
        member_id = COALESCE($1, member_id),
        committee_name = COALESCE($2, committee_name),
        role_title = COALESCE($3, role_title),
        event_year = $4,
        period = $5,
        start_date = $6,
        end_date = $7,
        status = COALESCE($8, status),
        description = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [
      member_id,
      committee_name,
      role_title,
      event_year || null,
      period || null,
      start_date || null,
      end_date || null,
      status,
      description || null,
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data kepanitiaan tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Record kepanitiaan berhasil diperbarui.',
      committee: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui record kepanitiaan.', error: err.message });
  }
});

router.delete('/committees/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM committee_records WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data kepanitiaan tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Record kepanitiaan berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus record kepanitiaan.', error: err.message });
  }
});

// ============================================================================
// TAB 2: SUSUNAN KEPENGURUSAN YAYASAN INTI & RIWAYAT JABATAN
// ============================================================================
router.get('/positions', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.id,
        p.position_code,
        p.title,
        p.category,
        p.function_description,
        p.hierarchy_order,
        p.is_active,
        p.created_at,
        -- Current tenure holder
        t.id as current_tenure_id,
        t.period as current_period,
        t.start_date as current_start_date,
        t.notes as current_notes,
        m.id as current_member_id,
        m.full_name as current_member_name,
        m.member_number as current_member_number,
        m.phone_number as current_member_phone,
        m.email as current_member_email,
        ap.faculty as current_member_faculty,
        ap.graduation_year as current_member_graduation_year,
        -- Total past tenures
        (SELECT COUNT(*)::int FROM org_position_tenures WHERE position_id = p.id) as total_tenures_count
      FROM org_positions p
      LEFT JOIN org_position_tenures t ON p.id = t.position_id AND t.is_current = TRUE
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      ORDER BY p.hierarchy_order ASC, p.created_at ASC
    `;
    const result = await db.query(query);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      positions: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat susunan kepengurusan.', error: err.message });
  }
});

router.post('/positions', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { position_code, title, category, function_description, hierarchy_order } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'Nama jabatan kepengurusan wajib diisi.' });
      return;
    }

    const code = position_code || title.toUpperCase().replace(/[^A-Z0-9]+/g, '_').substring(0, 50);

    const query = `
      INSERT INTO org_positions (position_code, title, category, function_description, hierarchy_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query(query, [
      code,
      title,
      category || 'PENGURUS_HARIAN',
      function_description || null,
      hierarchy_order || 0,
    ]);

    res.status(201).json({
      success: true,
      message: 'Jabatan kepengurusan baru berhasil ditambahkan.',
      position: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan jabatan kepengurusan.', error: err.message });
  }
});

router.put('/positions/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { position_code, title, category, function_description, hierarchy_order, is_active } = req.body;

    const query = `
      UPDATE org_positions
      SET
        position_code = COALESCE($1, position_code),
        title = COALESCE($2, title),
        category = COALESCE($3, category),
        function_description = COALESCE($4, function_description),
        hierarchy_order = COALESCE($5, hierarchy_order),
        is_active = COALESCE($6, is_active),
        updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    const result = await db.query(query, [
      position_code,
      title,
      category,
      function_description,
      hierarchy_order,
      is_active,
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Jabatan kepengurusan tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Jabatan kepengurusan berhasil diperbarui.',
      position: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui jabatan kepengurusan.', error: err.message });
  }
});

router.delete('/positions/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM org_positions WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Jabatan kepengurusan tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Jabatan kepengurusan berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus jabatan kepengurusan.', error: err.message });
  }
});

// Position History (Siapa saja yang pernah menjabat di jabatan ini)
router.get('/positions/:id/tenures', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        t.id,
        t.position_id,
        t.member_id,
        t.period,
        t.start_date,
        t.end_date,
        t.is_current,
        t.decree_number,
        t.notes,
        t.created_at,
        m.full_name as member_name,
        m.member_number,
        m.phone_number,
        m.email,
        ap.faculty,
        ap.graduation_year,
        p.title as position_title,
        p.category as position_category
      FROM org_position_tenures t
      JOIN org_positions p ON t.position_id = p.id
      JOIN members m ON t.member_id = m.id
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      WHERE t.position_id = $1
      ORDER BY t.is_current DESC, t.start_date DESC NULLS LAST, t.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      tenures: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat pejabat kepengurusan.', error: err.message });
  }
});

// Assign member to position (Tambah pejabat baru / riwayat pejabat)
router.post('/positions/:id/tenures', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { member_id, period, start_date, end_date, is_current, decree_number, notes } = req.body;

    if (!member_id || !period) {
      res.status(400).json({ success: false, message: 'Anggota dan periode masa bakti wajib diisi.' });
      return;
    }

    // Jika diset sebagai pejabat aktif (is_current = true), non-aktifkan pejabat aktif sebelumnya pada posisi ini
    if (is_current === true || is_current === 'true') {
      await db.query(
        `UPDATE org_position_tenures SET is_current = FALSE, updated_at = NOW() WHERE position_id = $1 AND is_current = TRUE`,
        [id]
      );
    }

    const insertQuery = `
      INSERT INTO org_position_tenures (
        position_id, member_id, period, start_date, end_date, is_current, decree_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [
      id,
      member_id,
      period,
      start_date || null,
      end_date || null,
      is_current === true || is_current === 'true',
      decree_number || null,
      notes || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Pejabat posisi berhasil dicatat ke dalam database.',
      tenure: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mencatat pejabat posisi.', error: err.message });
  }
});

router.put('/tenures/:tenureId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenureId } = req.params;
    const { member_id, period, start_date, end_date, is_current, decree_number, notes } = req.body;

    if (is_current === true || is_current === 'true') {
      // Find position_id of this tenure
      const check = await db.query(`SELECT position_id FROM org_position_tenures WHERE id = $1`, [tenureId]);
      if (check.rowCount && check.rowCount > 0) {
        await db.query(
          `UPDATE org_position_tenures SET is_current = FALSE, updated_at = NOW() WHERE position_id = $1 AND id <> $2`,
          [check.rows[0].position_id, tenureId]
        );
      }
    }

    const updateQuery = `
      UPDATE org_position_tenures
      SET
        member_id = COALESCE($1, member_id),
        period = COALESCE($2, period),
        start_date = $3,
        end_date = $4,
        is_current = COALESCE($5, is_current),
        decree_number = $6,
        notes = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [
      member_id,
      period,
      start_date || null,
      end_date || null,
      is_current,
      decree_number || null,
      notes || null,
      tenureId,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data riwayat jabatan tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data riwayat jabatan berhasil diperbarui.',
      tenure: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui riwayat jabatan.', error: err.message });
  }
});

router.delete('/tenures/:tenureId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenureId } = req.params;
    const result = await db.query(`DELETE FROM org_position_tenures WHERE id = $1 RETURNING id`, [tenureId]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data riwayat jabatan tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Riwayat jabatan berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus riwayat jabatan.', error: err.message });
  }
});

// ============================================================================
// TAB 3: STAF PENUH WAKTU (FULL-TIME STAFF)
// ============================================================================
router.get('/staff', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim();
    const departmentId = String(req.query.department_id || '');
    const status = String(req.query.status || 'ALL');

    let query = `
      SELECT 
        sm.id,
        sm.member_id,
        sm.department_id,
        sm.position_title,
        sm.employment_type,
        sm.joined_date,
        sm.end_date,
        sm.is_active,
        sm.status,
        sm.job_description,
        sm.created_at,
        m.full_name as member_name,
        m.member_number,
        m.phone_number,
        m.email,
        ap.faculty,
        ap.graduation_year,
        d.name as department_name
      FROM staff_members sm
      JOIN members m ON sm.member_id = m.id
      LEFT JOIN departments d ON sm.department_id = d.id
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (m.full_name ILIKE $${params.length} OR sm.position_title ILIKE $${params.length} OR d.name ILIKE $${params.length})`;
    }
    if (departmentId) {
      params.push(departmentId);
      query += ` AND sm.department_id = $${params.length}`;
    }
    if (status !== 'ALL') {
      params.push(status);
      query += ` AND sm.status = $${params.length}`;
    }

    query += ` ORDER BY sm.is_active DESC, sm.joined_date DESC NULLS LAST, sm.created_at DESC`;

    const result = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      staff: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat staf penuh waktu.', error: err.message });
  }
});

router.post('/staff', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      member_id,
      department_id,
      position_title,
      employment_type,
      joined_date,
      end_date,
      status,
      job_description,
      is_active,
    } = req.body;

    if (!member_id || !position_title) {
      res.status(400).json({ success: false, message: 'Anggota dan nama posisi/jabatan staf wajib diisi.' });
      return;
    }

    const insertQuery = `
      INSERT INTO staff_members (
        member_id, department_id, position_title, employment_type, joined_date, end_date, status, job_description, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await db.query(insertQuery, [
      member_id,
      department_id || null,
      position_title,
      employment_type || 'FULL_TIME',
      joined_date || new Date(),
      end_date || null,
      status || 'AKTIF',
      job_description || null,
      is_active !== undefined ? Boolean(is_active) : true,
    ]);

    res.status(201).json({
      success: true,
      message: 'Staf penuh waktu berhasil ditambahkan.',
      staff: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan staf penuh waktu.', error: err.message });
  }
});

router.put('/staff/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      member_id,
      department_id,
      position_title,
      employment_type,
      joined_date,
      end_date,
      status,
      job_description,
      is_active,
    } = req.body;

    const updateQuery = `
      UPDATE staff_members
      SET
        member_id = COALESCE($1, member_id),
        department_id = $2,
        position_title = COALESCE($3, position_title),
        employment_type = COALESCE($4, employment_type),
        joined_date = $5,
        end_date = $6,
        status = COALESCE($7, status),
        job_description = $8,
        is_active = COALESCE($9, is_active)
      WHERE id = $10
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [
      member_id,
      department_id || null,
      position_title,
      employment_type,
      joined_date || null,
      end_date || null,
      status,
      job_description || null,
      is_active,
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data staf tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data staf berhasil diperbarui.',
      staff: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui staf.', error: err.message });
  }
});

router.delete('/staff/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM staff_members WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data staf tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Data staf berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data staf.', error: err.message });
  }
});

// ============================================================================
// TAB 4: DIVISI & DEPARTEMEN + ANGGOTA DIVISI & RECORD HISTORY
// ============================================================================
router.get('/divisions', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.parent_id,
        d.head_member_id,
        d.is_active,
        d.order_index,
        d.created_at,
        m.full_name as head_name,
        m.member_number as head_member_number,
        m.phone_number as head_phone,
        m.email as head_email,
        (SELECT COUNT(*)::int FROM division_members dm WHERE dm.department_id = d.id AND dm.status = 'AKTIF') as active_members_count,
        (SELECT COUNT(*)::int FROM division_members dm WHERE dm.department_id = d.id) as total_history_count
      FROM departments d
      LEFT JOIN members m ON d.head_member_id = m.id
      ORDER BY d.order_index ASC, d.name ASC
    `;
    const result = await db.query(query);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      divisions: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar divisi.', error: err.message });
  }
});

router.post('/divisions', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, description, head_member_id, parent_id, order_index } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
      return;
    }

    const divisionId = id ? String(id).toUpperCase().replace(/[^A-Z0-9_]+/g, '_') : 'DIV_' + Date.now();

    const query = `
      INSERT INTO departments (id, name, description, head_member_id, parent_id, is_active, order_index)
      VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING *;
    `;
    const result = await db.query(query, [
      divisionId,
      name,
      description || null,
      head_member_id || null,
      parent_id || null,
      order_index || 0,
    ]);

    res.status(201).json({
      success: true,
      message: 'Divisi baru berhasil dibuat.',
      division: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat divisi baru.', error: err.message });
  }
});

router.put('/divisions/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, head_member_id, parent_id, is_active, order_index } = req.body;

    const query = `
      UPDATE departments
      SET
        name = COALESCE($1, name),
        description = $2,
        head_member_id = $3,
        parent_id = $4,
        is_active = COALESCE($5, is_active),
        order_index = COALESCE($6, order_index)
      WHERE id = $7
      RETURNING *;
    `;
    const result = await db.query(query, [
      name,
      description || null,
      head_member_id || null,
      parent_id || null,
      is_active,
      order_index,
      id,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Divisi berhasil diperbarui.',
      division: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui divisi.', error: err.message });
  }
});

router.delete('/divisions/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Divisi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus divisi.', error: err.message });
  }
});

// Division Members & History
router.get('/divisions/:id/members', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const status = String(req.query.status || 'ALL');

    let query = `
      SELECT 
        dm.id,
        dm.department_id,
        dm.member_id,
        dm.role_title,
        dm.period,
        dm.start_date,
        dm.end_date,
        dm.status,
        dm.notes,
        dm.created_at,
        m.full_name as member_name,
        m.member_number,
        m.phone_number,
        m.email,
        ap.faculty,
        ap.graduation_year
      FROM division_members dm
      JOIN members m ON dm.member_id = m.id
      LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
      WHERE dm.department_id = $1
    `;
    const params: any[] = [id];

    if (status !== 'ALL') {
      params.push(status);
      query += ` AND dm.status = $${params.length}`;
    }

    query += ` ORDER BY CASE WHEN dm.status = 'AKTIF' THEN 0 ELSE 1 END, dm.start_date DESC NULLS LAST, dm.created_at DESC`;

    const result = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      members: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat anggota divisi.', error: err.message });
  }
});

router.post('/divisions/:id/members', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { member_id, role_title, period, start_date, end_date, status, notes } = req.body;

    if (!member_id || !role_title) {
      res.status(400).json({ success: false, message: 'Anggota dan peran/jabatan dalam divisi wajib diisi.' });
      return;
    }

    const query = `
      INSERT INTO division_members (
        department_id, member_id, role_title, period, start_date, end_date, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await db.query(query, [
      id,
      member_id,
      role_title,
      period || '2024 - Sekarang',
      start_date || null,
      end_date || null,
      status || 'AKTIF',
      notes || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Anggota berhasil ditugaskan ke dalam divisi.',
      member: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menambahkan anggota divisi.', error: err.message });
  }
});

router.put('/division-members/:memberAssignmentId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberAssignmentId } = req.params;
    const { member_id, role_title, period, start_date, end_date, status, notes } = req.body;

    const query = `
      UPDATE division_members
      SET
        member_id = COALESCE($1, member_id),
        role_title = COALESCE($2, role_title),
        period = COALESCE($3, period),
        start_date = $4,
        end_date = $5,
        status = COALESCE($6, status),
        notes = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    const result = await db.query(query, [
      member_id,
      role_title,
      period,
      start_date || null,
      end_date || null,
      status,
      notes || null,
      memberAssignmentId,
    ]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data penugasan anggota divisi tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data penugasan divisi berhasil diperbarui.',
      member: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui penugasan divisi.', error: err.message });
  }
});

router.delete('/division-members/:memberAssignmentId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberAssignmentId } = req.params;
    const result = await db.query(`DELETE FROM division_members WHERE id = $1 RETURNING id`, [memberAssignmentId]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Data penugasan divisi tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Penugasan anggota divisi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus penugasan divisi.', error: err.message });
  }
});

export default router;
