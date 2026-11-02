import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import {
  ListProjectsQueryInput,
  CreateProjectInput,
  UpdateProjectInput,
} from './building.schema.js';

export const DEFAULT_MILESTONES = [
  { id: 1, label: 'Perencanaan & Studi Kelayakan', date: 'Maret 2024', status: 'DONE' as const, pct: 100 },
  { id: 2, label: 'Penggalangan Dana & Komitmen Awal', date: 'Agustus 2024', status: 'DONE' as const, pct: 100 },
  { id: 3, label: 'Pelaksanaan Tahap 1 / Konstruksi Dasar', date: 'Februari 2025', status: 'DONE' as const, pct: 100 },
  { id: 4, label: 'Pelaksanaan Tahap 2 / Pengadaan Sarana', date: 'Agustus 2025', status: 'DONE' as const, pct: 100 },
  { id: 5, label: 'Finishing Interior & Uji Fungsi MEP', date: 'April 2026', status: 'IN_PROGRESS' as const, pct: 65 },
  { id: 6, label: 'Serah Terima & Dedikasi Pelayanan', date: 'Desember 2026', status: 'PENDING' as const, pct: 0 },
];

export async function getProjectLegacy() {
  const allRes = await query(`SELECT * FROM building_projects ORDER BY target_budget DESC`);
  const projects = allRes.rows;
  const project = projects[0] || null;
  const projectMilestones = (project && project.milestones && Array.isArray(project.milestones) && project.milestones.length > 0)
    ? project.milestones
    : DEFAULT_MILESTONES;

  return {
    project,
    projects,
    milestones: projectMilestones,
    data: {
      project,
      projects,
      milestones: projectMilestones,
    },
  };
}

export async function listProjects(filters: ListProjectsQueryInput) {
  const { category, status, search } = filters;
  let queryText = `SELECT * FROM building_projects WHERE 1=1`;
  const params: any[] = [];

  if (category) {
    params.push(category);
    queryText += ` AND category = $${params.length}`;
  }
  if (status) {
    params.push(status);
    queryText += ` AND status = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    queryText += ` AND (project_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }

  queryText += ` ORDER BY target_budget DESC`;
  const result = await query(queryText, params);

  return {
    count: result.rows.length,
    projects: result.rows,
  };
}

export async function createProject(input: CreateProjectInput, actorUserId?: string | null) {
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
  } = input;

  const insertRes = await query(
    `INSERT INTO building_projects
      (project_name, category, target_budget, current_funds, progress_percentage, status, description, pic_name, start_date, target_completion_date, milestones)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      projectName,
      category,
      targetBudget,
      currentFunds,
      progressPercentage,
      status,
      description,
      picName,
      startDate || null,
      targetCompletionDate || null,
      milestones ? JSON.stringify(milestones) : '[]',
    ]
  );

  const created = insertRes.rows[0];
  await logAudit(actorUserId || null, 'INSERT', 'building_projects', created.id, null, created);

  return created;
}

export async function updateProject(id: string, input: UpdateProjectInput, actorUserId?: string | null) {
  const check = await queryOne('SELECT * FROM building_projects WHERE id = $1', [id]);
  if (!check) {
    throw HttpError.notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
  }

  const old = check;
  const updateRes = await query(
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
      input.projectName || null,
      input.category || null,
      input.targetBudget !== undefined ? input.targetBudget : null,
      input.currentFunds !== undefined ? input.currentFunds : null,
      input.progressPercentage !== undefined ? input.progressPercentage : null,
      input.status || null,
      input.description !== undefined ? input.description : null,
      input.picName || null,
      input.startDate || null,
      input.targetCompletionDate || null,
      input.milestones ? JSON.stringify(input.milestones) : null,
      id,
    ]
  );

  const updated = updateRes.rows[0];
  await logAudit(actorUserId || null, 'UPDATE', 'building_projects', id, old, updated);

  return updated;
}

export async function deleteProject(id: string, actorUserId?: string | null) {
  const check = await queryOne('SELECT * FROM building_projects WHERE id = $1', [id]);
  if (!check) {
    throw HttpError.notFound('Proyek tidak ditemukan.', 'PROJECT_NOT_FOUND');
  }

  const pledgeCheck = await queryOne<{ cnt: number }>('SELECT COUNT(*)::int as cnt FROM pledges WHERE building_project_id = $1', [id]);
  if (pledgeCheck && pledgeCheck.cnt > 0) {
    throw HttpError.badRequest('Proyek tidak dapat dihapus karena sudah memiliki komitmen donasi / janji iman terkait.', 'HAS_ACTIVE_PLEDGES');
  }

  await query('DELETE FROM building_projects WHERE id = $1', [id]);
  await logAudit(actorUserId || null, 'DELETE', 'building_projects', id, check, null);

  return check;
}
