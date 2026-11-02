import { z } from 'zod';

export const createProgramSchema = z.object({
  programTitle: z.string().trim().min(1, 'Nama program wajib diisi.').max(200),
  programCategory: z.string().trim().max(100).optional().default('Persekutuan Alumni'),
  eventDatetime: z.string().min(1, 'Waktu pelaksanaan wajib diisi.'),
  location: z.string().trim().max(200).optional().default('Rumah Persekutuan GMH'),
  theme: z.string().trim().max(200).optional(),
  speakerName: z.string().trim().max(150).optional(),
  budgetEstimate: z.coerce.number().min(0).optional().default(0),
  description: z.string().trim().max(2000).optional(),
  mediaDriveUrl: z.string().trim().max(500).optional(),
  documentDriveUrl: z.string().trim().max(500).optional(),
});

export const updateProgramSchema = z.object({
  programTitle: z.string().trim().min(1).max(200).optional(),
  programCategory: z.string().trim().max(100).optional(),
  eventDatetime: z.string().optional(),
  location: z.string().trim().max(200).optional(),
  theme: z.string().trim().max(200).optional(),
  speakerName: z.string().trim().max(150).optional(),
  budgetEstimate: z.coerce.number().min(0).optional(),
  description: z.string().trim().max(2000).optional(),
  mediaDriveUrl: z.string().trim().max(500).optional(),
  documentDriveUrl: z.string().trim().max(500).optional(),
  status: z.string().trim().optional(),
});

export const recordProgramCashSchema = z.object({
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

export const updateProgramRundownSchema = z.object({
  rundown: z.array(z.any()).optional().default([]),
});

export const updateProgramTasksSchema = z.object({
  tasks: z.array(z.any()).optional().default([]),
});

export const updateProgramCommitteesSchema = z.object({
  committees: z.array(z.any()).optional().default([]),
});

export const updateProgramStatusSchema = z.object({
  status: z.string().trim().min(1).default('COMPLETED'),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type RecordProgramCashInput = z.infer<typeof recordProgramCashSchema>;
export type UpdateProgramRundownInput = z.infer<typeof updateProgramRundownSchema>;
export type UpdateProgramTasksInput = z.infer<typeof updateProgramTasksSchema>;
export type UpdateProgramCommitteesInput = z.infer<typeof updateProgramCommitteesSchema>;
export type UpdateProgramStatusInput = z.infer<typeof updateProgramStatusSchema>;
