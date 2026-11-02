import { z } from 'zod';

export const listStaffQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().trim().optional(),
});

export const payrollPeriodQuerySchema = z.object({
  periodId: z.string().trim().optional().default('2026-10'),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  cursor: z.string().trim().optional(),
});

export const generateDraftSchema = z.object({
  periodId: z.string().trim().optional().default('2026-10'),
});

export const disbursePayrollSchema = z.object({
  periodId: z.string().trim().optional().default('2026-10'),
});

export type ListStaffQueryInput = z.infer<typeof listStaffQuerySchema>;
export type PayrollPeriodQueryInput = z.infer<typeof payrollPeriodQuerySchema>;
export type GenerateDraftInput = z.infer<typeof generateDraftSchema>;
export type DisbursePayrollInput = z.infer<typeof disbursePayrollSchema>;
