import { z } from 'zod';

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================
export const updateNumberingConfigSchema = z.object({
  pattern: z.string().trim().optional(),
  prefix: z.string().trim().optional(),
  padding: z.coerce.number().int().min(1).max(10).optional(),
  counter: z.coerce.number().int().min(1).optional(),
  resetPeriod: z.string().trim().optional(),
});

export const getNextNumberQuerySchema = z.object({
  category: z.string().trim().optional().default('SK'),
  date: z.string().optional(),
});

// ============================================================================
// OUTGOING LETTERS SCHEMAS
// ============================================================================
export const createOutgoingLetterSchema = z.object({
  letter_number: z.string().trim().optional(),
  category_code: z.string().trim().optional().default('SK'),
  category_label: z.string().trim().optional(),
  letter_date: z.string().optional(),
  subject: z.string().trim().min(1, 'Perihal surat wajib diisi.').max(300),
  recipient: z.string().trim().min(1, 'Tujuan/penerima surat wajib diisi.').max(200),
  recipient_address: z.string().trim().max(500).nullable().optional(),
  signer_name: z.string().trim().min(1, 'Penandatangan surat wajib diisi.').max(150),
  signer_position: z.string().trim().max(150).optional().default('Ketua Pengurus Yayasan'),
  attachment_count: z.string().trim().max(50).optional().default('-'),
  content_summary: z.string().trim().max(2000).nullable().optional(),
  file_url: z.string().trim().max(500).nullable().optional(),
  status: z.string().trim().optional().default('TERKIRIM'),
});

export const updateOutgoingLetterSchema = z.object({
  category_code: z.string().trim().optional(),
  category_label: z.string().trim().optional(),
  letter_date: z.string().optional(),
  subject: z.string().trim().min(1).max(300).optional(),
  recipient: z.string().trim().min(1).max(200).optional(),
  recipient_address: z.string().trim().max(500).nullable().optional(),
  signer_name: z.string().trim().min(1).max(150).optional(),
  signer_position: z.string().trim().max(150).optional(),
  attachment_count: z.string().trim().max(50).optional(),
  content_summary: z.string().trim().max(2000).nullable().optional(),
  file_url: z.string().trim().max(500).nullable().optional(),
  status: z.string().trim().optional(),
});

// ============================================================================
// INCOMING LETTERS SCHEMAS
// ============================================================================
export const createIncomingLetterSchema = z.object({
  agenda_number: z.string().trim().optional(),
  sender_letter_number: z.string().trim().min(1, 'Nomor surat asal wajib diisi.').max(150),
  sender_name: z.string().trim().min(1, 'Pengirim surat wajib diisi.').max(150),
  sender_institution: z.string().trim().max(150).nullable().optional(),
  subject: z.string().trim().min(1, 'Perihal surat masuk wajib diisi.').max(300),
  letter_date: z.string().optional(),
  received_date: z.string().optional(),
  disposition_to: z.string().trim().max(150).nullable().optional(),
  disposition_notes: z.string().trim().max(1000).nullable().optional(),
  file_url: z.string().trim().max(500).nullable().optional(),
  status: z.string().trim().optional().default('DITERIMA'),
});

export const updateIncomingLetterSchema = z.object({
  sender_letter_number: z.string().trim().min(1).max(150).optional(),
  sender_name: z.string().trim().min(1).max(150).optional(),
  sender_institution: z.string().trim().max(150).nullable().optional(),
  subject: z.string().trim().min(1).max(300).optional(),
  letter_date: z.string().optional(),
  received_date: z.string().optional(),
  disposition_to: z.string().trim().max(150).nullable().optional(),
  disposition_notes: z.string().trim().max(1000).nullable().optional(),
  file_url: z.string().trim().max(500).nullable().optional(),
  status: z.string().trim().optional(),
});

export type UpdateNumberingConfigInput = z.infer<typeof updateNumberingConfigSchema>;
export type GetNextNumberQueryInput = z.infer<typeof getNextNumberQuerySchema>;
export type CreateOutgoingLetterInput = z.infer<typeof createOutgoingLetterSchema>;
export type UpdateOutgoingLetterInput = z.infer<typeof updateOutgoingLetterSchema>;
export type CreateIncomingLetterInput = z.infer<typeof createIncomingLetterSchema>;
export type UpdateIncomingLetterInput = z.infer<typeof updateIncomingLetterSchema>;
