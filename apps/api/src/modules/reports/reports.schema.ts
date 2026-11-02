import { z } from 'zod';

export const consolidatedReportQuerySchema = z.object({
  year: z.coerce
    .number()
    .int('Tahun harus bilangan bulat')
    .min(2000, 'Tahun laporan minimal 2000')
    .max(2100, 'Tahun laporan maksimal 2100')
    .optional(),
});

export type ConsolidatedReportQueryInput = z.infer<typeof consolidatedReportQuerySchema>;
