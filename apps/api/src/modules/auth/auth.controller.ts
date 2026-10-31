import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/db.js';
import { ENV } from '../../config/env.js';
import { logAudit } from '../../middleware/audit.interceptor.js';

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

    if (!user.is_active) {
      res.status(403).json({ success: false, message: 'Akun ini telah dinonaktifkan oleh Administrator.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
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

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name,
        email: user.email,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.', error: err.message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRes = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.phone_number, r.name as role_name, r.description as role_desc
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pengguna tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, user: userRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil profil akun.', error: err.message });
  }
};

export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rolesRes = await db.query(`SELECT id, name, description FROM roles ORDER BY name ASC`);
    res.status(200).json({ success: true, roles: rolesRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat daftar peran.', error: err.message });
  }
};

export const demoSwitchRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.body;
    const roleCheck = await db.query(`SELECT id, name FROM roles WHERE id = $1`, [roleId]);
    if (roleCheck.rows.length === 0) {
      res.status(400).json({ success: false, message: `Peran '${roleId}' tidak valid.` });
      return;
    }

    const role = roleCheck.rows[0];

    // Find a sample user with this role, or generate a dummy payload
    const userRes = await db.query(`SELECT id, username, full_name, email FROM users WHERE role_id = $1 LIMIT 1`, [roleId]);
    const user = userRes.rows[0] || {
      id: '00000000-0000-0000-0000-000000000000',
      username: `demo.${roleId.toLowerCase()}`,
      full_name: `Demo User (${role.name})`,
      email: `${roleId.toLowerCase()}@gmhpakmk.org`,
    };

    const tokenPayload = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      roleId: role.id,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: `Beralih ke peran: ${role.name}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        roleId: role.id,
        roleName: role.name,
        email: user.email,
      },
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal berganti peran demo.', error: err.message });
  }
};
