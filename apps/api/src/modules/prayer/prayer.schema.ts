/**
 * Skema validasi modul Doa (Fase 2).
 *
 * Semua payload yang masuk ke modul divalidasi di sini sebelum
 * menyentuh database, sehingga lapisan `service` hanya berhadapan
 * dengan data yang sudah berbentuk dan tervalidasi.
 */
import { z } from 'zod';

export const prayerStatusEnum = z.enum(['NEW', 'BEING_PRAYED', 'ANSWERED'], {
  errorMap: () => ({ message: 'Status permohonan doa tidak valid.' }),
});

/** Payload create untuk permohonan doa publik. */
export const createPrayerRequestSchema = z.object({
  senderName: z.string().trim().max(150).optional(),
  senderPhone: z.string().trim().max(30).optional(),
  senderEmail: z.string().trim().email('Format email tidak valid.').max(120).optional(),
  isAnonymous: z.boolean().optional().default(false),
  prayerContent: z
    .string()
    .trim()
    .min(1, 'Pokok doa wajib diisi.')
    .max(5000, 'Pokok doa maksimal 5000 karakter.'),
});

export const updatePrayerStatusSchema = z.object({
  status: prayerStatusEnum,
  counselorNotes: z.string().trim().max(2000).optional(),
  answeredNotes: z.string().trim().max(2000).optional(),
});

export type CreatePrayerRequestInput = z.infer<typeof createPrayerRequestSchema>;
export type UpdatePrayerStatusInput = z.infer<typeof updatePrayerStatusSchema>;
