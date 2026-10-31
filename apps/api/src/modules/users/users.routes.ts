import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);

// ----------------------------------------------------------------------------
// 1. GET / — Daftar Seluruh Pengguna & KPI Statistik Akun
// ----------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, roleId, status } = req.query;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(
        `(u.full_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone_number ILIKE $${params.length})`
      );
    }

    if (roleId && roleId !== 'ALL') {
      params.push(roleId);
      whereConditions.push(`u.role_id = $${params.length}`);
    }

    if (status === 'active') {
      whereConditions.push(`u.is_active = true`);
    } else if (status === 'inactive') {
      whereConditions.push(`u.is_active = false`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.phone_number,
        u.full_name,
        u.role_id,
        u.is_active,
        u.position_title,
        u.birth_date,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        r.description as role_description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    const [usersRes, statsRes, rolesRes] = await Promise.all([
      db.query(usersQuery, params),
      db.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(CASE WHEN is_active = true THEN 1 END)::int as active,
          COUNT(CASE WHEN is_active = false THEN 1 END)::int as inactive
        FROM users
      `),
      db.query(`SELECT id, name, description FROM roles ORDER BY name ASC`),
    ]);

    const stats = statsRes.rows[0] || { total: 0, active: 0, inactive: 0 };

    res.status(200).json({
      success: true,
      count: usersRes.rows.length,
      users: usersRes.rows,
      data: usersRes.rows,
      stats,
      roles: rolesRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat data pengguna.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. GET /roles — Daftar Peran Sistem
// ----------------------------------------------------------------------------
router.get('/roles', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rolesRes = await db.query(`SELECT id, name, description FROM roles ORDER BY name ASC`);
    res.status(200).json({ success: true, roles: rolesRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar peran.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. GET /:id — Detail Pengguna Tunggal
// ----------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userRes = await db.query(
      `SELECT 
        u.id, u.username, u.email, u.phone_number, u.full_name,
        u.role_id, u.is_active, u.position_title, u.birth_date,
        u.last_login_at, u.created_at, u.updated_at,
        r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, user: userRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail pengguna.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. POST / — Tambah Akun Pengguna Baru
// ----------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      fullName,
      email,
      phoneNumber,
      password,
      roleId,
      positionTitle,
      birthDate,
      isActive,
    } = req.body;

    if (!username || !fullName || !email || !roleId) {
      res.status(400).json({
        success: false,
        message: 'Username, Nama Lengkap, Email, dan Role wajib diisi.',
      });
      return;
    }

    // Check duplicate username or email
    const duplicateCheck = await db.query(
      `SELECT id FROM users WHERE username = $1 OR email = $2`,
      [username.trim(), email.trim()]
    );
    if (duplicateCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Username atau Email sudah terdaftar dalam sistem.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password ? password.trim() : 'gmh12345', salt);

    const insertRes = await db.query(
      `INSERT INTO users (
        username, email, phone_number, password_hash, full_name,
        role_id, is_active, position_title, birth_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, username, email, phone_number, full_name, role_id, is_active, position_title, birth_date, created_at`,
      [
        username.trim(),
        email.trim().toLowerCase(),
        phoneNumber ? phoneNumber.trim() : null,
        passwordHash,
        fullName.trim(),
        roleId,
        isActive !== undefined ? Boolean(isActive) : true,
        positionTitle ? positionTitle.trim() : null,
        birthDate || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: `Akun pengguna "${fullName.trim()}" berhasil dibuat.`,
      user: insertRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat pengguna baru.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. PUT /:id — Ubah Data Pengguna & Hak Akses
// ----------------------------------------------------------------------------
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      username,
      fullName,
      email,
      phoneNumber,
      password,
      roleId,
      positionTitle,
      birthDate,
      isActive,
    } = req.body;

    const existingRes = await db.query(`SELECT id, password_hash FROM users WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    // Check duplicate username or email for other users
    if (username || email) {
      const dupRes = await db.query(
        `SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3`,
        [username?.trim(), email?.trim()?.toLowerCase(), id]
      );
      if (dupRes.rows.length > 0) {
        res.status(400).json({ success: false, message: 'Username atau Email sudah dipakai pengguna lain.' });
        return;
      }
    }

    let passwordHash = existingRes.rows[0].password_hash;
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    const updateRes = await db.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           phone_number = COALESCE($4, phone_number),
           password_hash = $5,
           role_id = COALESCE($6, role_id),
           position_title = COALESCE($7, position_title),
           birth_date = COALESCE($8, birth_date),
           is_active = COALESCE($9, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, username, email, phone_number, full_name, role_id, is_active, position_title, birth_date, updated_at`,
      [
        username ? username.trim() : null,
        fullName ? fullName.trim() : null,
        email ? email.trim().toLowerCase() : null,
        phoneNumber !== undefined ? (phoneNumber ? phoneNumber.trim() : null) : null,
        passwordHash,
        roleId || null,
        positionTitle !== undefined ? (positionTitle ? positionTitle.trim() : null) : null,
        birthDate !== undefined ? (birthDate || null) : null,
        isActive !== undefined ? Boolean(isActive) : null,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      user: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 6. PATCH /:id/toggle-status — Ubah Status Aktif / Non-Aktif
// ----------------------------------------------------------------------------
router.patch('/:id/toggle-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateRes = await db.query(
      `UPDATE users
       SET is_active = NOT is_active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, full_name, username, is_active`,
      [id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const updatedUser = updateRes.rows[0];
    const statusText = updatedUser.is_active ? 'diaktifkan' : 'dinonaktifkan';

    res.status(200).json({
      success: true,
      message: `Akun pengguna ${updatedUser.full_name} berhasil ${statusText}.`,
      user: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengubah status pengguna.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. DELETE /:id — Hapus Akun Pengguna
// ----------------------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user is superadmin
    const userRes = await db.query(`SELECT username, role_id FROM users WHERE id = $1`, [id]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    if (userRes.rows[0].username === 'superadmin') {
      res.status(400).json({
        success: false,
        message: 'Akun Super Admin sistem utama tidak dapat dihapus.',
      });
      return;
    }

    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.status(200).json({ success: true, message: 'Pengguna berhasil dihapus dari sistem.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.', error: err.message });
  }
});

export default router;
