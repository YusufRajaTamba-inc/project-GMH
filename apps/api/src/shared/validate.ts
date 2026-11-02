/**
 * Helper validasi Zod terpusat (Fase 2 — Migrasi Modul).
 *
 * Menyediakan `validate()` yang mengubah `ZodError` menjadi `HttpError`
 * 400 dengan pesan yang bisa dibaca pengguna, sehingga setiap modul
 * tidak perlu menulis try/catch validasi sendiri.
 */
import { ZodError, ZodTypeAny, z } from 'zod';
import { badRequest } from './httpError.js';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationErrorDetail {
  issues: ValidationIssue[];
}

/** Ubah ZodError menjadi daftar isu yang ringkas. */
export function formatZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/**
 * Parse payload terhadap schema Zod.
 * Melempar `HttpError` 400 dengan kode `VALIDATION_ERROR` bila tidak valid.
 */
export function validate<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest(
      'Data yang dikirim tidak valid.',
      'VALIDATION_ERROR',
      { issues: formatZodIssues(result.error) } satisfies ValidationErrorDetail
    );
  }
  return result.data;
}

/** Schema params route (`:id` dll) yang wajib berupa UUID. */
export const uuidParam = z.object({
  id: z.string().uuid('ID harus berupa UUID yang valid.'),
});

/** Query params umum untuk endpoint daftar. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(10000).optional(),
  cursor: z.string().trim().min(1).optional(),
  search: z.string().trim().max(200).optional(),
});

export type { ZodTypeAny };
