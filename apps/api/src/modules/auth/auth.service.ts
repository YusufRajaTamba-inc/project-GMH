import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { ENV } from '../../config/env.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { getSignedRolePermissions } from './auth.permissions.js';
import { LoginInput, ChangePasswordInput } from './auth.schema.js';

export async function login(input: LoginInput, ip?: string, userAgent?: string) {
  const { username, password } = input;

  const user = await queryOne<{
    id: string;
    username: string;
    email: string;
    full_name: string;
    password_hash: string;
    role_id: string;
    is_active: boolean;
    role_name: string;
  }>(
    `SELECT u.id, u.username, u.email, u.full_name, u.password_hash, u.role_id, u.is_active, r.name as role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.username = $1 OR u.email = $1`,
    [username.trim()]
  );

  if (!user) {
    throw HttpError.unauthorized('Username atau password tidak cocok.');
  }

  if (user.role_id === 'ANGGOTA_ALUMNI' || user.role_id === 'ALUMNI_ANGGOTA') {
    throw HttpError.forbidden(
      'Akses Ditolak: Anggota / Alumni tidak memiliki hak akses login ke sistem backoffice yayasan. Fitur alumni hanya dapat diakses melalui portal publik.'
    );
  }

  if (!user.is_active) {
    throw HttpError.forbidden('Akun ini telah dinonaktifkan oleh Administrator.');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    await logAudit(
      user.id,
      'FAILED_LOGIN',
      'users',
      user.id,
      null,
      { username: user.username, ip },
      ip,
      userAgent
    );
    throw HttpError.unauthorized('Username atau password tidak cocok.');
  }

  const tokenPayload = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    roleId: user.role_id,
    email: user.email,
  };

  const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, { expiresIn: '7d' });

  await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);
  await logAudit(user.id, 'LOGIN', 'users', user.id, null, { username: user.username }, ip, userAgent);

  const permissions = await getSignedRolePermissions(user.role_id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      roleId: user.role_id,
      roleName: user.role_name,
      email: user.email,
    },
    permissions,
  };
}

export async function getMe(userId?: string, username?: string) {
  const fallbackUsername = username || 'superadmin';
  const user = await queryOne(
    `SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.phone_number, u.position_title, u.created_at, u.last_login_at,
            r.name as role_name, r.description as role_desc
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1 OR u.username = $2`,
    [userId, fallbackUsername]
  );

  if (!user) {
    throw HttpError.notFound('Data pengguna tidak ditemukan.');
  }

  const permissions = await getSignedRolePermissions(user.role_id);

  return {
    user,
    permissions,
  };
}

export async function changePassword(
  userId: string | undefined,
  username: string | undefined,
  input: ChangePasswordInput,
  ip?: string,
  userAgent?: string
) {
  const { currentPassword, newPassword } = input;
  const fallbackUsername = username || 'superadmin';

  const user = await queryOne<{ id: string; username: string; password_hash: string }>(
    `SELECT id, username, password_hash FROM users WHERE id = $1 OR username = $2`,
    [userId, fallbackUsername]
  );

  if (!user) {
    throw HttpError.notFound('Pengguna tidak ditemukan.');
  }

  if (currentPassword && currentPassword.trim().length > 0 && user.password_hash) {
    const isMatch = await bcrypt.compare(currentPassword.trim(), user.password_hash);
    if (!isMatch) {
      throw HttpError.badRequest('Password lama tidak sesuai.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword.trim(), salt);

  await query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newHash, user.id]);
  await logAudit(user.id, 'CHANGE_PASSWORD', 'users', user.id, null, { username: user.username }, ip, userAgent);

  return { id: user.id, username: user.username };
}

export async function getRoles() {
  const rolesRes = await query(
    `SELECT id, name, description FROM roles WHERE id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA') ORDER BY name ASC`
  );
  return rolesRes.rows;
}
