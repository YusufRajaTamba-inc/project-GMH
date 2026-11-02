import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  search: z.string().trim().optional(),
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  operator: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type ListAuditLogsQueryInput = z.infer<typeof listAuditLogsQuerySchema>;
