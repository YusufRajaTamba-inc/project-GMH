import bcrypt from 'bcryptjs';
import { db } from '../../config/db.js';
import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { SYSTEM_MODULES, getSignedRolePermissions } from '../auth/auth.permissions.js';
import {
  ListUsersQueryInput,
  CreateRoleInput,
  UpdateRolePermissionsInput,
  CreateUserInput,
  UpdateUserInput,
} from './users.schema.js';

export async function listUsers(filters: ListUsersQueryInput) {
  const { search, roleId, status } = filters;
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
    query(usersQuery, params),
    query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active,
        COUNT(CASE WHEN is_active = false THEN 1 END)::int as inactive
      FROM users
    `),
    query(`SELECT id, name, description FROM roles WHERE id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA') ORDER BY name ASC`),
  ]);

  const stats = statsRes.rows[0] || { total: 0, active: 0, inactive: 0 };

  return {
    count: usersRes.rows.length,
    users: usersRes.rows,
    data: usersRes.rows,
    stats,
    roles: rolesRes.rows,
  };
}

export async function listRoles() {
  const rolesRes = await query(
    `SELECT id, name, description FROM roles WHERE id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA') ORDER BY name ASC`
  );
  return rolesRes.rows;
}

export async function createRole(input: CreateRoleInput, actorUser: any, ip?: string, userAgent?: string) {
  if (!actorUser || actorUser.roleId !== 'SUPER_ADMIN') {
    throw HttpError.forbidden('Hanya Super Admin (IT) yang dapat menambah peran baru.', 'FORBIDDEN_ROLE_MANAGEMENT');
  }

  const { id: cleanId, name: cleanName, description, copyFromRoleId } = input;
  const cleanDesc = description || null;

  const dupCheck = await queryOne(`SELECT id FROM roles WHERE id = $1`, [cleanId]);
  if (dupCheck) {
    throw HttpError.conflict(`Kode peran "${cleanId}" sudah digunakan.`);
  }

  await query(
    `INSERT INTO roles (id, name, description, created_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
    [cleanId, cleanName, cleanDesc]
  );

  const copySource = copyFromRoleId || null;
  if (copySource) {
    const sourceCheck = await queryOne(`SELECT id FROM roles WHERE id = $1`, [copySource]);
    if (!sourceCheck) {
      throw HttpError.badRequest(`Role sumber "${copySource}" tidak ditemukan.`);
    }
    await query(
      `INSERT INTO role_permissions (role_id, module_key, can_access, updated_at)
       SELECT $1, module_key, can_access, CURRENT_TIMESTAMP
       FROM role_permissions WHERE role_id = $2
       ON CONFLICT (role_id, module_key) DO NOTHING`,
      [cleanId, copySource]
    );
  } else {
    for (const mod of SYSTEM_MODULES) {
      const canAccess = mod.key === 'DASHBOARD';
      await query(
        `INSERT INTO role_permissions (role_id, module_key, can_access, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (role_id, module_key) DO NOTHING`,
        [cleanId, mod.key, canAccess]
      );
    }
  }

  const signedPayload = await getSignedRolePermissions(cleanId);

  await logAudit(
    actorUser.id,
    'CREATE_ROLE',
    'roles',
    cleanId,
    null,
    { roleId: cleanId, roleName: cleanName, copyFromRoleId: copySource, createdBy: actorUser.username },
    ip,
    userAgent
  );

  return {
    role: { id: cleanId, name: cleanName, description: cleanDesc || '' },
    permissions: signedPayload,
  };
}

export async function deleteRole(roleIdParam: string, actorUser: any, ip?: string, userAgent?: string) {
  const roleId = roleIdParam.trim().toUpperCase();

  if (!actorUser || actorUser.roleId !== 'SUPER_ADMIN') {
    throw HttpError.forbidden('Hanya Super Admin (IT) yang dapat menghapus peran.', 'FORBIDDEN_ROLE_MANAGEMENT');
  }

  if (roleId === 'SUPER_ADMIN') {
    throw HttpError.badRequest('Peran SUPER_ADMIN tidak dapat dihapus.');
  }

  const inUse = await queryOne<{ total: number }>(`SELECT COUNT(*)::int as total FROM users WHERE role_id = $1`, [roleId]);
  if ((inUse?.total || 0) > 0) {
    throw HttpError.conflict(`Peran "${roleId}" masih digunakan oleh ${inUse?.total} pengguna. Pindahkan pengguna terlebih dahulu.`);
  }

  const del = await query(`DELETE FROM roles WHERE id = $1 RETURNING id, name`, [roleId]);
  if (del.rows.length === 0) {
    throw HttpError.notFound(`Peran "${roleId}" tidak ditemukan.`);
  }

  await logAudit(
    actorUser.id,
    'DELETE_ROLE',
    'roles',
    roleId,
    { id: roleId, name: del.rows[0].name },
    { roleId, deletedBy: actorUser.username },
    ip,
    userAgent
  );

  return { name: del.rows[0].name };
}

export async function getPermissionsMatrix() {
  const [rolesRes, permsRes] = await Promise.all([
    query(`SELECT id, name, description FROM roles WHERE id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA') ORDER BY name ASC`),
    query(`SELECT role_id, module_key, can_access FROM role_permissions ORDER BY role_id, module_key`),
  ]);

  return {
    roles: rolesRes.rows,
    modules: SYSTEM_MODULES,
    permissions: permsRes.rows,
  };
}

export async function updateRolePermissions(
  input: UpdateRolePermissionsInput,
  actorUser: any,
  ip?: string,
  userAgent?: string
) {
  const { roleId, permissions } = input;

  const roleCheck = await queryOne<{ id: string; name: string }>(`SELECT id, name FROM roles WHERE id = $1`, [roleId]);
  if (!roleCheck) {
    throw HttpError.notFound(`Role "${roleId}" tidak ditemukan.`);
  }

  const finalPermissions = { ...permissions };
  if (roleId === 'SUPER_ADMIN') {
    finalPermissions['USERS'] = true;
    finalPermissions['DASHBOARD'] = true;
  }

  for (const mod of SYSTEM_MODULES) {
    const canAccess = finalPermissions[mod.key] !== undefined ? Boolean(finalPermissions[mod.key]) : false;
    await query(
      `INSERT INTO role_permissions (role_id, module_key, can_access, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (role_id, module_key)
       DO UPDATE SET can_access = $3, updated_at = CURRENT_TIMESTAMP`,
      [roleId, mod.key, canAccess]
    );
  }

  const signedPayload = await getSignedRolePermissions(roleId);

  if (actorUser?.id) {
    await logAudit(
      actorUser.id,
      'UPDATE_ROLE_PERMISSIONS',
      'role_permissions',
      roleId,
      null,
      { roleId, updatedBy: actorUser.username, allowedModulesCount: signedPayload.allowedModules.length },
      ip,
      userAgent
    );
  }

  return {
    roleName: roleCheck.name,
    roleId,
    permissions: signedPayload,
  };
}

export async function getUserById(id: string) {
  const user = await queryOne(
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

  if (!user) {
    throw HttpError.notFound('Pengguna tidak ditemukan.');
  }

  return user;
}

export async function createUser(input: CreateUserInput) {
  const { username, fullName, email, phoneNumber, password, roleId, positionTitle, birthDate, isActive } = input;

  const duplicateCheck = await queryOne(
    `SELECT id FROM users WHERE username = $1 OR email = $2`,
    [username.trim(), email.trim()]
  );
  if (duplicateCheck) {
    throw HttpError.badRequest('Username atau Email sudah terdaftar dalam sistem.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password ? password.trim() : 'gmh12345', salt);

  const insertRes = await query(
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

  return insertRes.rows[0];
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { username, fullName, email, phoneNumber, password, roleId, positionTitle, birthDate, isActive } = input;

  const existingRes = await queryOne<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE id = $1`,
    [id]
  );
  if (!existingRes) {
    throw HttpError.notFound('Pengguna tidak ditemukan.');
  }

  if (username || email) {
    const dupRes = await queryOne(
      `SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3`,
      [username?.trim(), email?.trim()?.toLowerCase(), id]
    );
    if (dupRes) {
      throw HttpError.badRequest('Username atau Email sudah dipakai pengguna lain.');
    }
  }

  let passwordHash = existingRes.password_hash;
  if (password && password.trim().length > 0) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  const updateRes = await query(
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
      isActive !== undefined && isActive !== null ? Boolean(isActive) : null,
      id,
    ]
  );

  return updateRes.rows[0];
}

export async function toggleUserStatus(id: string) {
  const updateRes = await query(
    `UPDATE users
     SET is_active = NOT is_active,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, full_name, username, is_active`,
    [id]
  );

  if (updateRes.rows.length === 0) {
    throw HttpError.notFound('Pengguna tidak ditemukan.');
  }

  return updateRes.rows[0];
}

export async function deleteUser(id: string) {
  const user = await queryOne<{ username: string; role_id: string }>(
    `SELECT username, role_id FROM users WHERE id = $1`,
    [id]
  );
  if (!user) {
    throw HttpError.notFound('Pengguna tidak ditemukan.');
  }

  if (user.username === 'superadmin') {
    throw HttpError.badRequest('Akun Super Admin sistem utama tidak dapat dihapus.');
  }

  await query(`DELETE FROM users WHERE id = $1`, [id]);
  return user;
}
