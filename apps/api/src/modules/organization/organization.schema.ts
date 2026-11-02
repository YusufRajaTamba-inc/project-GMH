import { z } from 'zod';

// ============================================================================
// COMMITTEES
// ============================================================================
export const createCommitteeSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.'),
  committee_name: z.string().trim().min(1, 'Nama kepanitiaan wajib diisi.').max(200),
  role_title: z.string().trim().min(1, 'Jabatan/posisi wajib diisi.').max(150),
  event_year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  period: z.string().trim().max(100).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional().default('SELESAI'),
  description: z.string().trim().max(1000).nullable().optional(),
});

export const updateCommitteeSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.').optional(),
  committee_name: z.string().trim().min(1).max(200).optional(),
  role_title: z.string().trim().min(1).max(150).optional(),
  event_year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  period: z.string().trim().max(100).nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
});

// ============================================================================
// POSITIONS & TENURES
// ============================================================================
export const createPositionSchema = z.object({
  position_code: z.string().trim().max(50).optional(),
  title: z.string().trim().min(1, 'Nama jabatan kepengurusan wajib diisi.').max(150),
  category: z.string().trim().max(50).optional().default('PENGURUS_HARIAN'),
  function_description: z.string().trim().max(1000).nullable().optional(),
  hierarchy_order: z.coerce.number().int().optional().default(0),
});

export const updatePositionSchema = z.object({
  position_code: z.string().trim().max(50).optional(),
  title: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().max(50).optional(),
  function_description: z.string().trim().max(1000).nullable().optional(),
  hierarchy_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
});

export const createTenureSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.'),
  period: z.string().trim().min(1, 'Periode masa bakti wajib diisi.').max(100),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional().default(false),
  decree_number: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateTenureSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.').optional(),
  period: z.string().trim().min(1).max(100).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.preprocess((val) => val === true || val === 'true', z.boolean()).optional(),
  decree_number: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

// ============================================================================
// STAFF MEMBERS
// ============================================================================
export const createStaffSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.'),
  department_id: z.string().trim().max(50).nullable().optional(),
  position_title: z.string().trim().min(1, 'Nama posisi/jabatan staf wajib diisi.').max(150),
  employment_type: z.string().trim().max(50).optional().default('FULL_TIME'),
  joined_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional().default('AKTIF'),
  job_description: z.string().trim().max(1000).nullable().optional(),
  is_active: z.preprocess((val) => val === undefined ? true : Boolean(val), z.boolean()).optional().default(true),
});

export const updateStaffSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.').optional(),
  department_id: z.string().trim().max(50).nullable().optional(),
  position_title: z.string().trim().min(1).max(150).optional(),
  employment_type: z.string().trim().max(50).optional(),
  joined_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional(),
  job_description: z.string().trim().max(1000).nullable().optional(),
  is_active: z.boolean().optional(),
});

// ============================================================================
// DIVISIONS & MEMBERS
// ============================================================================
export const createDivisionSchema = z.object({
  id: z.string().trim().max(50).optional(),
  name: z.string().trim().min(1, 'Nama divisi wajib diisi.').max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  head_member_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().trim().max(50).nullable().optional(),
  order_index: z.coerce.number().int().optional().default(0),
});

export const updateDivisionSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  head_member_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().trim().max(50).nullable().optional(),
  is_active: z.boolean().optional(),
  order_index: z.coerce.number().int().optional(),
});

export const createDivisionMemberSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.'),
  role_title: z.string().trim().min(1, 'Peran/jabatan dalam divisi wajib diisi.').max(150),
  period: z.string().trim().max(100).optional().default('2024 - Sekarang'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional().default('AKTIF'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateDivisionMemberSchema = z.object({
  member_id: z.string().uuid('ID Anggota tidak valid.').optional(),
  role_title: z.string().trim().min(1).max(150).optional(),
  period: z.string().trim().max(100).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>;
export type UpdateCommitteeInput = z.infer<typeof updateCommitteeSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
export type CreateTenureInput = z.infer<typeof createTenureSchema>;
export type UpdateTenureInput = z.infer<typeof updateTenureSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateDivisionInput = z.infer<typeof createDivisionSchema>;
export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>;
export type CreateDivisionMemberInput = z.infer<typeof createDivisionMemberSchema>;
export type UpdateDivisionMemberInput = z.infer<typeof updateDivisionMemberSchema>;
