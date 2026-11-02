import { z } from 'zod';

export const getLookupsQuerySchema = z.object({
  menu: z.string().trim().optional(),
});

export const addLookupSchema = z.object({
  category: z.string().trim().min(1, 'Kategori wajib diisi.'),
  code: z.string().trim().min(1, 'Kode wajib diisi.'),
  label: z.string().trim().min(1, 'Label wajib diisi.'),
  systemMenu: z.string().trim().optional().default('ALUMNI'),
  sortOrder: z.coerce.number().optional().default(1),
});

export const getFormConfigsQuerySchema = z.object({
  module: z.string().trim().optional(),
  menu: z.string().trim().optional(),
});

export const updateFieldLabelSchema = z.object({
  fieldKey: z.string().trim().min(1, 'fieldKey wajib diisi.'),
  fieldLabel: z.string().trim().min(1, 'fieldLabel wajib diisi.'),
  featureModule: z.string().trim().optional().default('ALUMNI'),
  isRequired: z.boolean().optional().default(false),
  fieldType: z.string().trim().optional().default('TEXT'),
});

export type GetLookupsQueryInput = z.infer<typeof getLookupsQuerySchema>;
export type AddLookupInput = z.infer<typeof addLookupSchema>;
export type GetFormConfigsQueryInput = z.infer<typeof getFormConfigsQuerySchema>;
export type UpdateFieldLabelInput = z.infer<typeof updateFieldLabelSchema>;
