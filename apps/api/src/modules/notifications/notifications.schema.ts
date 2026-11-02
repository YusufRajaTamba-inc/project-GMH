import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().optional(),
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
