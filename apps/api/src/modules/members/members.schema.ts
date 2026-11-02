import { z } from 'zod';

export const listMembersQuerySchema = z.object({
  search: z.string().trim().optional(),
  faculty: z.string().trim().optional(),
  type: z.string().trim().optional(),
  status: z.string().trim().optional(),
  entryYear: z.coerce.number().optional(),
  city: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
  page: z.coerce.number().optional(),
  limit: z.union([z.literal('all'), z.coerce.number()]).optional(),
  cursor: z.string().trim().optional(),
});

export const createMemberSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama lengkap wajib diisi minimal 2 karakter'),
  nik: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional().default('Laki-laki'),
  birthPlace: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().default('2000-01-01'),
  weddingDate: z.string().trim().optional().nullable(),
  maritalStatus: z.string().trim().optional().default('Lajang'),
  partnerName: z.string().trim().optional().nullable(),
  childrenCount: z.coerce.number().optional().nullable(),
  phoneNumber: z.string().trim().min(8, 'Nomor WhatsApp wajib diisi minimal 8 digit'),
  email: z.string().trim().email('Format email tidak valid').optional().nullable(),
  homeAddress: z.string().trim().optional().default('Medan'),
  city: z.string().trim().optional().default('Medan'),
  province: z.string().trim().optional().default('Sumatera Utara'),
  postalCode: z.string().trim().optional().nullable(),
  memberType: z.string().trim().optional().default('ALUMNI'),
  faculty: z.string().trim().optional().default('Fakultas Teknik'),
  major: z.string().trim().optional().default('-'),
  entryYear: z.coerce.number().optional().default(2020),
  graduationYear: z.coerce.number().optional().nullable(),
  gradYear: z.coerce.number().optional().nullable(),
  profession: z.string().trim().optional().default('-'),
  company: z.string().trim().optional().default('-'),
  ktb: z.string().trim().optional().nullable(),
  ministryInterest: z.string().trim().optional().nullable(),
  socialMedia: z.any().optional(),
});

export const updateMemberSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  nik: z.string().trim().optional().nullable(),
  gender: z.string().trim().optional(),
  birthPlace: z.string().trim().optional().nullable(),
  birthDate: z.string().trim().optional().nullable(),
  weddingDate: z.string().trim().optional().nullable(),
  maritalStatus: z.string().trim().optional().nullable(),
  partnerName: z.string().trim().optional().nullable(),
  childrenCount: z.coerce.number().optional().nullable(),
  phoneNumber: z.string().trim().min(8).optional(),
  email: z.string().trim().email().optional().nullable(),
  homeAddress: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  province: z.string().trim().optional().nullable(),
  postalCode: z.string().trim().optional().nullable(),
  memberType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  faculty: z.string().trim().optional().nullable(),
  major: z.string().trim().optional().nullable(),
  entryYear: z.coerce.number().optional().nullable(),
  graduationYear: z.coerce.number().optional().nullable(),
  profession: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  ktb: z.string().trim().optional().nullable(),
  ministryInterest: z.string().trim().optional().nullable(),
  socialMedia: z.any().optional(),
});

export const bulkImportDryRunSchema = z.object({
  rows: z.array(z.record(z.string(), z.any())).min(1, 'Daftar baris data Excel kosong.'),
});

export const bulkImportCommitSchema = z.object({
  validRows: z.array(z.record(z.string(), z.any())).min(1, 'Tidak ada baris data valid untuk diimpor.'),
});

export type ListMembersQueryInput = z.infer<typeof listMembersQuerySchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type BulkImportDryRunInput = z.infer<typeof bulkImportDryRunSchema>;
export type BulkImportCommitInput = z.infer<typeof bulkImportCommitSchema>;
