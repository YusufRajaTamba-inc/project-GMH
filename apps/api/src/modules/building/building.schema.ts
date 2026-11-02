import { z } from 'zod';

export const milestoneItemSchema = z.object({
  id: z.number().or(z.string()),
  label: z.string().trim().min(1),
  date: z.string().trim().optional(),
  status: z.enum(['DONE', 'IN_PROGRESS', 'PENDING']),
  pct: z.number().min(0).max(100),
});

export const listProjectsQuerySchema = z.object({
  category: z.string().trim().optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const createProjectSchema = z.object({
  projectName: z.string().trim().min(1, 'Nama proyek wajib diisi'),
  category: z.string().trim().optional().default('INFRASTRUKTUR'),
  targetBudget: z.coerce.number().min(0, 'Target anggaran tidak boleh negatif'),
  currentFunds: z.coerce.number().min(0).optional().default(0),
  progressPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  status: z.string().trim().optional().default('ON_PROGRESS'),
  description: z.string().trim().optional().default(''),
  picName: z.string().trim().optional().default('Tim Proyek Yayasan'),
  startDate: z.string().trim().optional().nullable(),
  targetCompletionDate: z.string().trim().optional().nullable(),
  milestones: z.array(milestoneItemSchema).optional(),
});

export const updateProjectSchema = z.object({
  projectName: z.string().trim().min(1).optional(),
  category: z.string().trim().optional(),
  targetBudget: z.coerce.number().min(0).optional(),
  currentFunds: z.coerce.number().min(0).optional(),
  progressPercentage: z.coerce.number().min(0).max(100).optional(),
  status: z.string().trim().optional(),
  description: z.string().trim().optional(),
  picName: z.string().trim().optional(),
  startDate: z.string().trim().optional().nullable(),
  targetCompletionDate: z.string().trim().optional().nullable(),
  milestones: z.array(milestoneItemSchema).optional(),
});

export type ListProjectsQueryInput = z.infer<typeof listProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
