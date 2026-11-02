import { Router, Request, Response } from 'express';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  listProjectsQuerySchema,
  createProjectSchema,
  updateProjectSchema,
} from './building.schema.js';
import * as buildingService from './building.service.js';

const router = Router();

// Protect all building routes
router.use(authenticateJwt);

// GET /building/project (Legacy compatibility + returns all projects list)
router.get(
  '/project',
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await buildingService.getProjectLegacy();
    res.status(200).json({
      success: true,
      ...result,
    });
  })
);

// GET /building/projects (List all foundation projects)
router.get(
  '/projects',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = validate(listProjectsQuerySchema, req.query);
    const result = await buildingService.listProjects(filters);
    res.status(200).json({
      success: true,
      ...result,
    });
  })
);

// POST /building/projects (Create new project)
router.post(
  '/projects',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(createProjectSchema, req.body);
    const created = await buildingService.createProject(input, req.user?.id);
    res.status(201).json({
      success: true,
      message: `Proyek "${created.project_name}" berhasil ditambahkan.`,
      project: created,
    });
  })
);

// PUT /building/projects/:id (Update project)
router.put(
  '/projects/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = validate(updateProjectSchema, req.body);
    const updated = await buildingService.updateProject(req.params.id, input, req.user?.id);
    res.status(200).json({
      success: true,
      message: `Proyek "${updated.project_name}" berhasil diperbarui.`,
      project: updated,
    });
  })
);

// DELETE /building/projects/:id (Delete project)
router.delete(
  '/projects/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const deleted = await buildingService.deleteProject(req.params.id, req.user?.id);
    res.status(200).json({
      success: true,
      message: `Proyek "${deleted.project_name}" berhasil dihapus.`,
    });
  })
);

export default router;
