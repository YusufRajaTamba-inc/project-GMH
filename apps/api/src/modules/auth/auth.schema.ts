import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username atau email wajib diisi.'),
  password: z.string().trim().min(1, 'Password wajib diisi.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().trim().optional(),
    newPassword: z.string().trim().min(6, 'Password baru minimal harus 6 karakter.'),
    confirmPassword: z.string().trim().min(6, 'Konfirmasi password baru minimal harus 6 karakter.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password baru tidak cocok.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
