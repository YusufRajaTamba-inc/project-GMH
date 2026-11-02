import { z } from 'zod';

export const publicRegisterAlumniSchema = z.object({
  fullName: z.string().trim().min(3, 'Nama lengkap wajib diisi minimal 3 karakter.'),
  nik: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((v) => !v || /^\d{16}$/.test(v.replace(/\s+/g, '')), {
      message: 'Nomor Induk Kependudukan (NIK) harus terdiri dari 16 digit angka.',
    }),
  gender: z.string().trim().optional().default('Laki-laki'),
  birthPlace: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().default('2000-01-01'),
  weddingDate: z.string().trim().optional().nullable(),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => /^(\+62|62|0)8[0-9]{8,12}$/.test(v.replace(/\s+/g, '')), {
      message: 'Nomor WhatsApp tidak valid. Gunakan format nomor Indonesia (contoh: 08123456789 atau +6281234567890).',
    }),
  email: z.string().trim().email('Format alamat email tidak valid.').optional().nullable(),
  faculty: z.string().trim().min(1, 'Fakultas asal USU wajib dipilih.'),
  major: z.string().trim().optional().nullable(),
  entryYear: z.coerce.number().optional().nullable(),
  gradYear: z.coerce.number().optional().nullable(),
  graduationYear: z.coerce.number().optional().nullable(),
  homeAddress: z.string().trim().min(5, 'Alamat domisili lengkap wajib diisi minimal 5 karakter.'),
  city: z.string().trim().optional().default('Medan'),
  province: z.string().trim().optional().default('Sumatera Utara'),
  postalCode: z.string().trim().optional().nullable(),
  currentProfession: z.string().trim().optional().nullable(),
  profession: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  ktb: z.string().trim().optional().nullable(),
  ministryInterest: z.string().trim().optional().nullable(),
  partnerName: z.string().trim().optional().nullable(),
  childrenCount: z.coerce.number().optional().nullable(),
  maritalStatus: z.string().trim().optional().default('Lajang'),
  memberType: z.string().trim().optional().default('ALUMNI'),
  socialMedia: z.any().optional(),
  linkedin: z.string().trim().optional().nullable(),
  instagram: z.string().trim().optional().nullable(),
  facebook: z.string().trim().optional().nullable(),
  website: z.string().optional(), // Honeypot field untuk memblokir spam bot (R7)
});

export const listRegistrationsQuerySchema = z.object({
  status: z.string().trim().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().trim().optional(),
});

export const rejectRegistrationSchema = z.object({
  reason: z.string().trim().optional(),
});

export type PublicRegisterAlumniInput = z.infer<typeof publicRegisterAlumniSchema>;
export type ListRegistrationsQueryInput = z.infer<typeof listRegistrationsQuerySchema>;
export type RejectRegistrationInput = z.infer<typeof rejectRegistrationSchema>;
