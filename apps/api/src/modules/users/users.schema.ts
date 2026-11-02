import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  roleId: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const createRoleSchema = z.object({
  id: z
    .string()
    .trim()
    .min(3, 'Kode peran minimal 3 karakter')
    .max(50, 'Kode peran maksimal 50 karakter')
    .regex(/^[A-Za-z][A-Za-z0-9_]{2,49}$/, 'Kode peran harus dimulai huruf dan hanya boleh alfanumerik/garis bawah')
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9_]/g, '_')),
  name: z.string().trim().min(1, 'Nama peran wajib diisi'),
  description: z.string().trim().optional().nullable(),
  copyFromRoleId: z.string().trim().optional().nullable(),
});

export const updateRolePermissionsSchema = z.object({
  roleId: z.string().trim().min(1, 'roleId wajib disertakan'),
  permissions: z.record(z.string(), z.boolean()).refine((obj) => Object.keys(obj).length > 0, {
    message: 'Permissions object wajib berisi setidaknya satu modul',
  }),
});

export const createUserSchema = z.object({
  username: z.string().trim().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  phoneNumber: z.string().trim().optional().nullable(),
  password: z.string().trim().min(5, 'Password minimal 5 karakter').optional(),
  roleId: z.string().trim().min(1, 'Role wajib diisi'),
  positionTitle: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).optional(),
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email('Format email tidak valid').optional(),
  phoneNumber: z.string().trim().optional().nullable(),
  password: z.string().trim().min(5).optional().nullable(),
  roleId: z.string().trim().optional().nullable(),
  positionTitle: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
});

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
