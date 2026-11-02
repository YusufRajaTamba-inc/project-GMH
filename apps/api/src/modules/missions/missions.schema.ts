import { z } from 'zod';

export const createMissionSchema = z.object({
  title: z.string().trim().min(1, 'Nama kegiatan / agenda resmi wajib diisi.').max(200),
  theme: z.string().trim().max(200).optional(),
  budgetEstimate: z.coerce.number().min(0).optional().default(0),
  coordinator: z.string().trim().max(150).optional().default('Belum diatur'),
  location: z.string().trim().max(200).optional().default('Belum diatur'),
  eventDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  timePreview: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  mediaDriveUrl: z.string().trim().max(500).optional(),
  documentDriveUrl: z.string().trim().max(500).optional(),
});

export const updateMissionSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  theme: z.string().trim().max(200).optional(),
  budgetEstimate: z.coerce.number().min(0).optional(),
  coordinator: z.string().trim().max(150).optional(),
  location: z.string().trim().max(200).optional(),
  eventDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  timePreview: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  mediaDriveUrl: z.string().trim().max(500).optional(),
  documentDriveUrl: z.string().trim().max(500).optional(),
  status: z.string().trim().optional(),
});

export const recordMissionCashSchema = z.object({
  type: z.enum(['IN', 'OUT'], {
    errorMap: () => ({ message: 'Tipe transaksi harus IN atau OUT.' }),
  }),
  category: z.string().trim().max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  amount: z.coerce.number().positive('Jumlah nominal transaksi harus lebih besar dari 0.'),
  date: z.string().optional(),
  transferType: z.string().trim().optional(),
  isSubsidiTransfer: z.boolean().optional(),
});

export const updateRundownSchema = z.object({
  rundown: z.array(z.any()).optional().default([]),
});

export const updateTasksSchema = z.object({
  tasks: z.array(z.any()).optional().default([]),
});

export const updateCommitteesSchema = z.object({
  committees: z.array(z.any()).optional().default([]),
});

export const updateMissionStatusSchema = z.object({
  status: z.string().trim().min(1).default('COMPLETED'),
});

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>;
export type RecordMissionCashInput = z.infer<typeof recordMissionCashSchema>;
export type UpdateRundownInput = z.infer<typeof updateRundownSchema>;
export type UpdateTasksInput = z.infer<typeof updateTasksSchema>;
export type UpdateCommitteesInput = z.infer<typeof updateCommitteesSchema>;
export type UpdateMissionStatusInput = z.infer<typeof updateMissionStatusSchema>;
