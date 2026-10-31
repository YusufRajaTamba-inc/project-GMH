import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { ENV } from '../../config/env.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { getSignedRolePermissions } from './auth.permissions.js';

// ============================================================
// Cookie options — P1-A: HttpOnly Cookie JWT
// ============================================================
const COOKIE_OPTIONS = {
  httpOnly: true,                              // Tidak bisa diakses oleh JavaScript (anti-XSS)
  secure: ENV.COOKIE_SECURE,                   // HTTPS only; dapat dimatikan sementara untuk staging via IP
  sameSite: 'strict' as const,                // Anti-CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 hari (ms)
  path: '/',
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
      return;
    }

    const userRes = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.password_hash, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1 OR u.email = $1`,
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Username atau password tidak cocok.' });
      return;
    }

    const user = userRes.rows[0];

    // Role anggota/alumni tidak memiliki akses login ke sistem backoffice yayasan
    if (user.role_id === 'ANGGOTA_ALUMNI' || user.role_id === 'ALUMNI_ANGGOTA') {
      res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Anggota / Alumni tidak memiliki hak akses login ke sistem backoffice yayasan. Fitur alumni hanya dapat diakses melalui portal publik.',
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Akun ini telah dinonaktifkan oleh Administrator.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await logAudit(user.id, 'FAILED_LOGIN', 'users', user.id, null, { username: user.username, ip: req.ip }, req.ip, req.headers['user-agent']);
      res.status(401).json({ success: false, message: 'Username atau password tidak cocok.' });
      return;
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      roleId: user.role_id,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: '7d' });

    // Update last login
    await db.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

    await logAudit(user.id, 'LOGIN', 'users', user.id, null, { username: user.username }, req.ip, req.headers['user-agent']);

    // P1-A: Set HttpOnly Cookie — token tidak dikirim di body JSON
    res.cookie('gmh_auth_token', token, COOKIE_OPTIONS);

    // Dapatkan hak akses role yang ditandatangani secara kriptografis (HMAC-SHA256)
    const permissions = await getSignedRolePermissions(user.role_id);

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      // token TIDAK disertakan di body untuk mencegah XSS
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        email: user.email,
      },
      permissions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.', error: err.message });
  }
};


export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const username = req.user?.username || 'superadmin';
    const userRes = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.phone_number, u.position_title, u.created_at, u.last_login_at,
              r.name as role_name, r.description as role_desc
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 OR u.username = $2`,
      [userId, username]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pengguna tidak ditemukan.' });
      return;
    }

    const user = userRes.rows[0];
    const permissions = await getSignedRolePermissions(user.role_id);

    res.status(200).json({ success: true, user, permissions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil profil akun.', error: err.message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id;
    const username = req.user?.username || 'superadmin';

    if (!newPassword || newPassword.trim().length < 6) {
      res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    const userRes = await db.query(
      `SELECT id, username, password_hash FROM users WHERE id = $1 OR username = $2`,
      [userId, username]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const user = userRes.rows[0];

    // If currentPassword provided and user has password_hash, verify it
    if (currentPassword && currentPassword.trim().length > 0 && user.password_hash) {
      const isMatch = await bcrypt.compare(currentPassword.trim(), user.password_hash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Password lama tidak sesuai.' });
        return;
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword.trim(), salt);

    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, user.id]
    );

    await logAudit(user.id, 'CHANGE_PASSWORD', 'users', user.id, null, { username: user.username }, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      message: 'Password akun berhasil diubah dan tersimpan di database.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengubah password.', error: err.message });
  }
};

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: ENV.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

// P1-A: Logout — hapus cookie sisi server
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('gmh_auth_token', COOKIE_CLEAR_OPTIONS);
  res.status(200).json({ success: true, message: 'Logout berhasil.' });
};


export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rolesRes = await db.query(
      `SELECT id, name, description FROM roles WHERE id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA') ORDER BY name ASC`
    );
    res.status(200).json({ success: true, roles: rolesRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar peran.', error: err.message });
  }
};

export const demoSwitchRole = async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({
    success: false,
    message: 'Fitur demo role telah dinonaktifkan demi keamanan. Silakan login menggunakan akun resmi pengurus/staf yayasan.',
  });
};

