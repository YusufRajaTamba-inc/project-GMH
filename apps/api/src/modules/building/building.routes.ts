import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../middleware/audit.interceptor.js';

const router = Router();

// Protect all building routes
router.use(authenticateJwt);

const DEFAULT_MILESTONES = [
  { id: 1, label: 'Perencanaan & Studi Kelayakan', date: 'Maret 2024', status: 'DONE' as const, pct: 100 },
  { id: 2, label: 'Penggalangan Dana & Komitmen Awal', date: 'Agustus 2024', status: 'DONE' as const, pct: 100 },
  { id: 3, label: 'Pelaksanaan Tahap 1 / Konstruksi Dasar', date: 'Februari 2025', status: 'DONE' as const, pct: 100 },
  { id: 4, label: 'Pelaksanaan Tahap 2 / Pengadaan Sarana', date: 'Agustus 2025', status: 'DONE' as const, pct: 100 },
  { id: 5, label: 'Finishing Interior & Uji Fungsi MEP', date: 'April 2026', status: 'IN_PROGRESS' as const, pct: 65 },
  { id: 6, label: 'Serah Terima & Dedikasi Pelayanan', date: 'Desember 2026', status: 'PENDING' as const, pct: 0 },
];

// GET /building/project (Legacy compatibility + returns all projects list)
router.get('/project', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const allRes = await db.query(
      `SELECT * FROM building_projects ORDER BY target_budget DESC`
    );
    const projects = allRes.rows;
    const project = projects[0] || null;
    const projectMilestones = (project && project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0)
      ? project.milestones
      : DEFAULT_MILESTONES;

    res.status(200).json({
      success: true,
      project,
      projects,
      milestones: projectMilestones,
      data: {
        project,
        projects,
        milestones: projectMilestones,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data proyek.', error: err.message });
  }
});

// GET /building/projects (List all foundation projects)
router.get('/projects', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, search } = req.query;
    let query = `SELECT * FROM building_projects WHERE 1=1`;
    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (project_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ` ORDER BY target_budget DESC`;
    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      projects: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar proyek yayasan.', error: err.message });
  }
});

// POST /building/projects (Create new project)
router.post('/projects', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectName,
      category,
      targetBudget,
      currentFunds,
      progressPercentage,
      status,
      description,
      picName,
      startDate,
      targetCompletionDate,
      milestones,
    } = req.body;

    if (!projectName || !targetBudget) {
      res.status(400).json({ success: false, message: 'Nama proyek dan target anggaran wajib diisi.' });
      return;
    }

    const insertRes = await db.query(
      `INSERT INTO building_projects 
        (project_name, category, target_budget, current_funds, progress_percentage, status, description, pic_name, start_date, target_completion_date, milestones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        projectName.trim(),
        category || 'INFRASTRUKTUR',
        parseFloat(targetBudget) || 0,
        parseFloat(currentFunds) || 0,
        parseInt(progressPercentage) || 0,
        status || 'ON_PROGRESS',
        description || '',
        picName || 'Tim Proyek Yayasan',
        startDate || null,
        targetCompletionDate || null,
        milestones ? JSON.stringify(milestones) : '[]',
      ]
    );

    const created = insertRes.rows[0];
    await logAudit(req.user?.id || null, 'INSERT', 'building_projects', created.id, null, created);

    res.status(201).json({
      success: true,
      message: `Proyek "${created.project_name}" berhasil ditambahkan.`,
      project: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat proyek baru.', error: err.message });
  }
});

// PUT /building/projects/:id (Update project)
router.put('/projects/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      projectName,
      category,
      targetBudget,
      currentFunds,
      progressPercentage,
      status,
      description,
      picName,
      startDate,
      targetCompletionDate,
      milestones,
    } = req.body;

    const check = await db.query('SELECT * FROM building_projects WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    const old = check.rows[0];
    const updateRes = await db.query(
      `UPDATE building_projects
       SET project_name = COALESCE($1, project_name),
           category = COALESCE($2, category),
           target_budget = COALESCE($3, target_budget),
           current_funds = COALESCE($4, current_funds),
           progress_percentage = COALESCE($5, progress_percentage),
           status = COALESCE($6, status),
           description = COALESCE($7, description),
           pic_name = COALESCE($8, pic_name),
           start_date = COALESCE($9, start_date),
           target_completion_date = COALESCE($10, target_completion_date),
           milestones = COALESCE($11::jsonb, milestones)
       WHERE id = $12
       RETURNING *`,
      [
        projectName ? projectName.trim() : null,
        category || null,
        targetBudget !== undefined ? parseFloat(targetBudget) : null,
        currentFunds !== undefined ? parseFloat(currentFunds) : null,
        progressPercentage !== undefined ? parseInt(progressPercentage) : null,
        status || null,
        description !== undefined ? description : null,
        picName || null,
        startDate || null,
        targetCompletionDate || null,
        milestones ? JSON.stringify(milestones) : null,
        id,
      ]
    );

    const updated = updateRes.rows[0];
    await logAudit(req.user?.id || null, 'UPDATE', 'building_projects', id, old, updated);

    res.status(200).json({
      success: true,
      message: `Proyek "${updated.project_name}" berhasil diperbarui.`,
      project: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui proyek.', error: err.message });
  }
});

// DELETE /building/projects/:id (Delete project)
router.delete('/projects/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM building_projects WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    const old = check.rows[0];
    // Check if pledges exist
    const pledgeCheck = await db.query('SELECT COUNT(*)::int as cnt FROM pledges WHERE building_project_id = $1', [id]);
    if (pledgeCheck.rows[0].cnt > 0) {
      res.status(400).json({
        success: false,
        message: 'Proyek tidak dapat dihapus karena sudah memiliki komitmen donasi / janji iman terkait.',
      });
      return;
    }

    await db.query('DELETE FROM building_projects WHERE id = $1', [id]);
    await logAudit(req.user?.id || null, 'DELETE', 'building_projects', id, old, null);

    res.status(200).json({
      success: true,
      message: `Proyek "${old.project_name}" berhasil dihapus.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus proyek.', error: err.message });
  }
});

export default router;
