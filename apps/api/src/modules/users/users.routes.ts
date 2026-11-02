import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  listUsersQuerySchema,
  createRoleSchema,
  updateRolePermissionsSchema,
  createUserSchema,
  updateUserSchema,
} from './users.schema.js';
import * as usersService from './users.service.js';

const router = Router();

router.use(authenticateJwt);
router.use(authorizePermission('USERS'));

// 1. GET / — Daftar Seluruh Pengguna & KPI Statistik Akun
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = validate(listUsersQuerySchema, req.query);
    const result = await usersService.listUsers(filters);
    res.status(200).json({
      success: true,
      ...result,
    });
  })
);

// 2. GET /roles — Daftar Peran Sistem
router.get(
  '/roles',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const roles = await usersService.listRoles();
    res.status(200).json({ success: true, roles });
  })
);

// 2A. POST /roles — Buat Peran (Role) Baru
router.post(
  '/roles',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(createRoleSchema, req.body);
    const result = await usersService.createRole(input, req.user, req.ip, req.headers['user-agent']);
    res.status(201).json({
      success: true,
      message: `Peran "${result.role.name}" (${result.role.id}) berhasil dibuat.`,
      ...result,
    });
  })
);

// 2B. DELETE /roles/:roleId — Hapus Peran
router.delete(
  '/roles/:roleId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await usersService.deleteRole(req.params.roleId, req.user, req.ip, req.headers['user-agent']);
    res.status(200).json({
      success: true,
      message: `Peran "${result.name}" berhasil dihapus.`,
    });
  })
);

// 2C. GET /permissions — Matriks Hak Akses Modul Seluruh Role
router.get(
  '/permissions',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const matrix = await usersService.getPermissionsMatrix();
    res.status(200).json({
      success: true,
      ...matrix,
    });
  })
);

// 2D. PUT /permissions — Update Hak Akses Modul untuk Suatu Role
router.put(
  '/permissions',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(updateRolePermissionsSchema, req.body);
    const result = await usersService.updateRolePermissions(input, req.user, req.ip, req.headers['user-agent']);
    res.status(200).json({
      success: true,
      message: `Hak akses untuk peran "${result.roleName}" berhasil diperbarui.`,
      roleId: result.roleId,
      permissions: result.permissions,
    });
  })
);

// 3. GET /:id — Detail Pengguna Tunggal
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ success: true, user });
  })
);

// 4. POST / — Tambah Akun Pengguna Baru
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(createUserSchema, req.body);
    const user = await usersService.createUser(input);
    res.status(201).json({
      success: true,
      message: `Akun pengguna "${user.full_name}" berhasil dibuat.`,
      user,
    });
  })
);

// 5. PUT /:id — Ubah Data Pengguna
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(updateUserSchema, req.body);
    const user = await usersService.updateUser(req.params.id, input);
    res.status(200).json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      user,
    });
  })
);

// 6. PATCH /:id/toggle-status — Ubah Status Aktif / Non-Aktif
router.patch(
  '/:id/toggle-status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await usersService.toggleUserStatus(req.params.id);
    const statusText = user.is_active ? 'diaktifkan' : 'dinonaktifkan';
    res.status(200).json({
      success: true,
      message: `Akun pengguna ${user.full_name} berhasil ${statusText}.`,
      user,
    });
  })
);

// 7. DELETE /:id — Hapus Akun Pengguna
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await usersService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'Pengguna berhasil dihapus dari sistem.' });
  })
);

export default router;
