/**
 * Logika bisnis modul Organisasi (Fase 2).
 *
 * Mengelola seluruh query dan aturan bisnis untuk:
 * - Kepanitiaan (committee_records)
 * - Struktur Jabatan & Masa Bakti (org_positions & org_position_tenures)
 * - Staf Penuh Waktu (staff_members)
 * - Divisi/Departemen & Anggota Divisi (departments & division_members)
 * - Profil Organisasi Anggota (agregasi lintas entitas)
 */
import { notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  createCommitteeSchema,
  updateCommitteeSchema,
  createPositionSchema,
  updatePositionSchema,
  createTenureSchema,
  updateTenureSchema,
  createStaffSchema,
  updateStaffSchema,
  createDivisionSchema,
  updateDivisionSchema,
  createDivisionMemberSchema,
  updateDivisionMemberSchema,
  type CreateCommitteeInput,
  type UpdateCommitteeInput,
  type CreatePositionInput,
  type UpdatePositionInput,
  type CreateTenureInput,
  type UpdateTenureInput,
  type CreateStaffInput,
  type UpdateStaffInput,
  type CreateDivisionInput,
  type UpdateDivisionInput,
  type CreateDivisionMemberInput,
  type UpdateDivisionMemberInput,
} from './organization.schema.js';

// ============================================================================
// LOOKUP & STATS
// ============================================================================
export async function lookupMembers(search?: string) {
  const searchTerm = String(search || '').trim();
  let queryText = `
    SELECT 
      m.id, 
      m.member_number, 
      m.full_name, 
      m.email, 
      m.phone_number, 
      m.membership_type,
      ap.faculty,
      ap.graduation_year
    FROM members m
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    WHERE m.is_active = TRUE
  `;
  const params: any[] = [];
  if (searchTerm) {
    params.push(`%${searchTerm}%`);
    queryText += ` AND (m.full_name ILIKE $${params.length} OR m.member_number ILIKE $${params.length} OR m.email ILIKE $${params.length})`;
  }
  queryText += ` ORDER BY m.full_name ASC LIMIT 50`;

  const result = await query(queryText, params, { label: 'org.lookupMembers' });
  return result.rows;
}

export async function getOrganizationStats() {
  const [committeeCount, positionCount, staffCount, divisionCount] = await Promise.all([
    query(`SELECT COUNT(*)::int as count FROM committee_records`, [], { label: 'org.stats.committees' }),
    query(`SELECT COUNT(*)::int as count FROM org_positions WHERE is_active = TRUE`, [], { label: 'org.stats.positions' }),
    query(`SELECT COUNT(*)::int as count FROM staff_members WHERE is_active = TRUE`, [], { label: 'org.stats.staff' }),
    query(`SELECT COUNT(*)::int as count FROM departments WHERE is_active = TRUE`, [], { label: 'org.stats.divisions' }),
  ]);

  return {
    totalCommittees: committeeCount.rows[0]?.count || 0,
    totalPositions: positionCount.rows[0]?.count || 0,
    totalStaff: staffCount.rows[0]?.count || 0,
    totalDivisions: divisionCount.rows[0]?.count || 0,
  };
}

// ============================================================================
// COMMITTEES (Kepanitiaan)
// ============================================================================
export interface ListCommitteesParams {
  search?: string;
  year?: number | null;
  status?: string;
  memberId?: string;
  page: number;
  limit: number;
  offset: number;
  wantsPagination: boolean;
}

export async function listCommittees(params: ListCommitteesParams) {
  const { search, year, status = 'ALL', memberId, limit, offset, wantsPagination } = params;
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (search) {
    queryParams.push(`%${search}%`);
    whereConditions.push(
      `(cr.committee_name ILIKE $${queryParams.length} OR cr.role_title ILIKE $${queryParams.length} OR m.full_name ILIKE $${queryParams.length})`
    );
  }
  if (year) {
    queryParams.push(year);
    whereConditions.push(`cr.event_year = $${queryParams.length}`);
  }
  if (status && status !== 'ALL') {
    queryParams.push(status);
    whereConditions.push(`cr.status = $${queryParams.length}`);
  }
  if (memberId) {
    queryParams.push(memberId);
    whereConditions.push(`cr.member_id = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*)::int as total
     FROM committee_records cr
     JOIN members m ON cr.member_id = m.id${whereClause}`,
    [...queryParams],
    { label: 'org.committees.count' }
  );
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `
    SELECT 
      cr.id,
      cr.member_id,
      cr.committee_name,
      cr.role_title,
      cr.event_year,
      cr.period,
      cr.start_date,
      cr.end_date,
      cr.status,
      cr.description,
      cr.created_at,
      cr.updated_at,
      m.full_name as member_name,
      m.member_number,
      m.phone_number,
      m.email,
      ap.faculty,
      ap.graduation_year
    FROM committee_records cr
    JOIN members m ON cr.member_id = m.id
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    ${whereClause}
    ORDER BY cr.created_at DESC
  `;
  const dataParams = [...queryParams];

  if (wantsPagination) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  }

  const result = await query(dataQuery, dataParams, { label: 'org.committees.list' });
  return { rows: result.rows, total };
}

export async function createCommittee(input: CreateCommitteeInput) {
  const data = validate(createCommitteeSchema, input);

  const insertQuery = `
    INSERT INTO committee_records (
      member_id, committee_name, role_title, event_year, period, start_date, end_date, status, description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const result = await query(
    insertQuery,
    [
      data.member_id,
      data.committee_name,
      data.role_title,
      data.event_year || null,
      data.period || (data.event_year ? String(data.event_year) : null),
      data.start_date || null,
      data.end_date || null,
      data.status || 'SELESAI',
      data.description || null,
    ],
    { label: 'org.committees.create' }
  );

  return result.rows[0];
}

export async function updateCommittee(id: string, input: UpdateCommitteeInput) {
  const data = validate(updateCommitteeSchema, input);

  const updateQuery = `
    UPDATE committee_records
    SET
      member_id = COALESCE($1, member_id),
      committee_name = COALESCE($2, committee_name),
      role_title = COALESCE($3, role_title),
      event_year = $4,
      period = $5,
      start_date = $6,
      end_date = $7,
      status = COALESCE($8, status),
      description = $9,
      updated_at = NOW()
    WHERE id = $10
    RETURNING *;
  `;
  const result = await query(
    updateQuery,
    [
      data.member_id,
      data.committee_name,
      data.role_title,
      data.event_year || null,
      data.period || null,
      data.start_date || null,
      data.end_date || null,
      data.status,
      data.description || null,
      id,
    ],
    { label: 'org.committees.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Data kepanitiaan tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteCommittee(id: string) {
  const result = await query(`DELETE FROM committee_records WHERE id = $1 RETURNING id`, [id], {
    label: 'org.committees.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Data kepanitiaan tidak ditemukan.');
  }
  return { id };
}

// ============================================================================
// POSITIONS & TENURES (Jabatan & Masa Bakti)
// ============================================================================
export async function listPositions() {
  const queryText = `
    SELECT 
      p.id,
      p.position_code,
      p.title,
      p.category,
      p.function_description,
      p.hierarchy_order,
      p.is_active,
      p.created_at,
      t.id as current_tenure_id,
      t.period as current_period,
      t.start_date as current_start_date,
      t.notes as current_notes,
      m.id as current_member_id,
      m.full_name as current_member_name,
      m.member_number as current_member_number,
      m.phone_number as current_member_phone,
      m.email as current_member_email,
      ap.faculty as current_member_faculty,
      ap.graduation_year as current_member_graduation_year,
      (SELECT COUNT(*)::int FROM org_position_tenures WHERE position_id = p.id) as total_tenures_count
    FROM org_positions p
    LEFT JOIN org_position_tenures t ON p.id = t.position_id AND t.is_current = TRUE
    LEFT JOIN members m ON t.member_id = m.id
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    ORDER BY p.hierarchy_order ASC, p.created_at ASC
  `;
  const result = await query(queryText, [], { label: 'org.positions.list' });
  return result.rows;
}

export async function createPosition(input: CreatePositionInput) {
  const data = validate(createPositionSchema, input);
  const code = data.position_code || data.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_').substring(0, 50);

  const queryText = `
    INSERT INTO org_positions (position_code, title, category, function_description, hierarchy_order)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [code, data.title, data.category || 'PENGURUS_HARIAN', data.function_description || null, data.hierarchy_order || 0],
    { label: 'org.positions.create' }
  );

  return result.rows[0];
}

export async function updatePosition(id: string, input: UpdatePositionInput) {
  const data = validate(updatePositionSchema, input);

  const queryText = `
    UPDATE org_positions
    SET
      position_code = COALESCE($1, position_code),
      title = COALESCE($2, title),
      category = COALESCE($3, category),
      function_description = COALESCE($4, function_description),
      hierarchy_order = COALESCE($5, hierarchy_order),
      is_active = COALESCE($6, is_active),
      updated_at = NOW()
    WHERE id = $7
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [data.position_code, data.title, data.category, data.function_description, data.hierarchy_order, data.is_active, id],
    { label: 'org.positions.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Jabatan kepengurusan tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deletePosition(id: string) {
  const result = await query(`DELETE FROM org_positions WHERE id = $1 RETURNING id`, [id], {
    label: 'org.positions.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Jabatan kepengurusan tidak ditemukan.');
  }
  return { id };
}

export async function listPositionTenures(positionId: string) {
  const queryText = `
    SELECT 
      t.id,
      t.position_id,
      t.member_id,
      t.period,
      t.start_date,
      t.end_date,
      t.is_current,
      t.decree_number,
      t.notes,
      t.created_at,
      m.full_name as member_name,
      m.member_number,
      m.phone_number,
      m.email,
      ap.faculty,
      ap.graduation_year,
      p.title as position_title,
      p.category as position_category
    FROM org_position_tenures t
    JOIN org_positions p ON t.position_id = p.id
    JOIN members m ON t.member_id = m.id
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    WHERE t.position_id = $1
    ORDER BY t.is_current DESC, t.start_date DESC NULLS LAST, t.created_at DESC
  `;
  const result = await query(queryText, [positionId], { label: 'org.tenures.list' });
  return result.rows;
}

export async function createPositionTenure(positionId: string, input: CreateTenureInput) {
  const data = validate(createTenureSchema, input);

  if (data.is_current) {
    await query(
      `UPDATE org_position_tenures SET is_current = FALSE, updated_at = NOW() WHERE position_id = $1 AND is_current = TRUE`,
      [positionId],
      { label: 'org.tenures.deactivatePrev' }
    );
  }

  const insertQuery = `
    INSERT INTO org_position_tenures (
      position_id, member_id, period, start_date, end_date, is_current, decree_number, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const result = await query(
    insertQuery,
    [
      positionId,
      data.member_id,
      data.period,
      data.start_date || null,
      data.end_date || null,
      Boolean(data.is_current),
      data.decree_number || null,
      data.notes || null,
    ],
    { label: 'org.tenures.create' }
  );

  return result.rows[0];
}

export async function updateTenure(tenureId: string, input: UpdateTenureInput) {
  const data = validate(updateTenureSchema, input);

  if (data.is_current) {
    const check = await query(`SELECT position_id FROM org_position_tenures WHERE id = $1`, [tenureId], {
      label: 'org.tenures.checkPos',
    });
    if (check.rowCount && check.rowCount > 0) {
      await query(
        `UPDATE org_position_tenures SET is_current = FALSE, updated_at = NOW() WHERE position_id = $1 AND id <> $2`,
        [check.rows[0].position_id, tenureId],
        { label: 'org.tenures.deactivateOthers' }
      );
    }
  }

  const updateQuery = `
    UPDATE org_position_tenures
    SET
      member_id = COALESCE($1, member_id),
      period = COALESCE($2, period),
      start_date = $3,
      end_date = $4,
      is_current = COALESCE($5, is_current),
      decree_number = $6,
      notes = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING *;
  `;
  const result = await query(
    updateQuery,
    [
      data.member_id,
      data.period,
      data.start_date || null,
      data.end_date || null,
      data.is_current,
      data.decree_number || null,
      data.notes || null,
      tenureId,
    ],
    { label: 'org.tenures.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Data riwayat jabatan tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteTenure(tenureId: string) {
  const result = await query(`DELETE FROM org_position_tenures WHERE id = $1 RETURNING id`, [tenureId], {
    label: 'org.tenures.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Data riwayat jabatan tidak ditemukan.');
  }
  return { id: tenureId };
}

// ============================================================================
// STAFF MEMBERS (Staf Penuh Waktu)
// ============================================================================
export interface ListStaffParams {
  search?: string;
  departmentId?: string;
  status?: string;
}

export async function listStaff(params: ListStaffParams) {
  const { search, departmentId, status = 'ALL' } = params;
  let queryText = `
    SELECT 
      sm.id,
      sm.member_id,
      sm.department_id,
      sm.position_title,
      sm.employment_type,
      sm.joined_date,
      sm.end_date,
      sm.is_active,
      sm.status,
      sm.job_description,
      sm.created_at,
      m.full_name as member_name,
      m.member_number,
      m.phone_number,
      m.email,
      ap.faculty,
      ap.graduation_year,
      d.name as department_name
    FROM staff_members sm
    JOIN members m ON sm.member_id = m.id
    LEFT JOIN departments d ON sm.department_id = d.id
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (search) {
    queryParams.push(`%${search}%`);
    queryText += ` AND (m.full_name ILIKE $${queryParams.length} OR sm.position_title ILIKE $${queryParams.length} OR d.name ILIKE $${queryParams.length})`;
  }
  if (departmentId) {
    queryParams.push(departmentId);
    queryText += ` AND sm.department_id = $${queryParams.length}`;
  }
  if (status && status !== 'ALL') {
    queryParams.push(status);
    queryText += ` AND sm.status = $${queryParams.length}`;
  }

  queryText += ` ORDER BY sm.is_active DESC, sm.joined_date DESC NULLS LAST, sm.created_at DESC`;

  const result = await query(queryText, queryParams, { label: 'org.staff.list' });
  return result.rows;
}

export async function createStaff(input: CreateStaffInput) {
  const data = validate(createStaffSchema, input);

  const insertQuery = `
    INSERT INTO staff_members (
      member_id, department_id, position_title, employment_type, joined_date, end_date, status, job_description, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;
  const result = await query(
    insertQuery,
    [
      data.member_id,
      data.department_id || null,
      data.position_title,
      data.employment_type || 'FULL_TIME',
      data.joined_date || new Date(),
      data.end_date || null,
      data.status || 'AKTIF',
      data.job_description || null,
      data.is_active !== undefined ? Boolean(data.is_active) : true,
    ],
    { label: 'org.staff.create' }
  );

  return result.rows[0];
}

export async function updateStaff(id: string, input: UpdateStaffInput) {
  const data = validate(updateStaffSchema, input);

  const updateQuery = `
    UPDATE staff_members
    SET
      member_id = COALESCE($1, member_id),
      department_id = $2,
      position_title = COALESCE($3, position_title),
      employment_type = COALESCE($4, employment_type),
      joined_date = $5,
      end_date = $6,
      status = COALESCE($7, status),
      job_description = $8,
      is_active = COALESCE($9, is_active)
    WHERE id = $10
    RETURNING *;
  `;
  const result = await query(
    updateQuery,
    [
      data.member_id,
      data.department_id || null,
      data.position_title,
      data.employment_type,
      data.joined_date || null,
      data.end_date || null,
      data.status,
      data.job_description || null,
      data.is_active,
      id,
    ],
    { label: 'org.staff.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Data staf tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteStaff(id: string) {
  const result = await query(`DELETE FROM staff_members WHERE id = $1 RETURNING id`, [id], {
    label: 'org.staff.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Data staf tidak ditemukan.');
  }
  return { id };
}

// ============================================================================
// DIVISIONS & MEMBERS (Departemen/Divisi & Anggota)
// ============================================================================
export async function listDivisions() {
  const queryText = `
    SELECT 
      d.id,
      d.name,
      d.description,
      d.parent_id,
      d.head_member_id,
      d.is_active,
      d.order_index,
      d.created_at,
      m.full_name as head_name,
      m.member_number as head_member_number,
      m.phone_number as head_phone,
      m.email as head_email,
      (SELECT COUNT(*)::int FROM division_members dm WHERE dm.department_id = d.id AND dm.status = 'AKTIF') as active_members_count,
      (SELECT COUNT(*)::int FROM division_members dm WHERE dm.department_id = d.id) as total_history_count
    FROM departments d
    LEFT JOIN members m ON d.head_member_id = m.id
    ORDER BY d.order_index ASC, d.name ASC
  `;
  const result = await query(queryText, [], { label: 'org.divisions.list' });
  return result.rows;
}

export async function createDivision(input: CreateDivisionInput) {
  const data = validate(createDivisionSchema, input);
  const divisionId = data.id ? String(data.id).toUpperCase().replace(/[^A-Z0-9_]+/g, '_') : 'DIV_' + Date.now();

  const queryText = `
    INSERT INTO departments (id, name, description, head_member_id, parent_id, is_active, order_index)
    VALUES ($1, $2, $3, $4, $5, true, $6)
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [divisionId, data.name, data.description || null, data.head_member_id || null, data.parent_id || null, data.order_index || 0],
    { label: 'org.divisions.create' }
  );

  return result.rows[0];
}

export async function updateDivision(id: string, input: UpdateDivisionInput) {
  const data = validate(updateDivisionSchema, input);

  const queryText = `
    UPDATE departments
    SET
      name = COALESCE($1, name),
      description = $2,
      head_member_id = $3,
      parent_id = $4,
      is_active = COALESCE($5, is_active),
      order_index = COALESCE($6, order_index)
    WHERE id = $7
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [data.name, data.description || null, data.head_member_id || null, data.parent_id || null, data.is_active, data.order_index, id],
    { label: 'org.divisions.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Divisi tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteDivision(id: string) {
  const result = await query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id], {
    label: 'org.divisions.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Divisi tidak ditemukan.');
  }
  return { id };
}

export async function listDivisionMembers(divisionId: string, status: string = 'ALL') {
  let queryText = `
    SELECT 
      dm.id,
      dm.department_id,
      dm.member_id,
      dm.role_title,
      dm.period,
      dm.start_date,
      dm.end_date,
      dm.status,
      dm.notes,
      dm.created_at,
      m.full_name as member_name,
      m.member_number,
      m.phone_number,
      m.email,
      ap.faculty,
      ap.graduation_year
    FROM division_members dm
    JOIN members m ON dm.member_id = m.id
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    WHERE dm.department_id = $1
  `;
  const params: any[] = [divisionId];

  if (status && status !== 'ALL') {
    params.push(status);
    queryText += ` AND dm.status = $${params.length}`;
  }

  queryText += ` ORDER BY CASE WHEN dm.status = 'AKTIF' THEN 0 ELSE 1 END, dm.start_date DESC NULLS LAST, dm.created_at DESC`;

  const result = await query(queryText, params, { label: 'org.divisionMembers.list' });
  return result.rows;
}

export async function createDivisionMember(divisionId: string, input: CreateDivisionMemberInput) {
  const data = validate(createDivisionMemberSchema, input);

  const queryText = `
    INSERT INTO division_members (
      department_id, member_id, role_title, period, start_date, end_date, status, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [
      divisionId,
      data.member_id,
      data.role_title,
      data.period || '2024 - Sekarang',
      data.start_date || null,
      data.end_date || null,
      data.status || 'AKTIF',
      data.notes || null,
    ],
    { label: 'org.divisionMembers.create' }
  );

  return result.rows[0];
}

export async function updateDivisionMember(memberAssignmentId: string, input: UpdateDivisionMemberInput) {
  const data = validate(updateDivisionMemberSchema, input);

  const queryText = `
    UPDATE division_members
    SET
      member_id = COALESCE($1, member_id),
      role_title = COALESCE($2, role_title),
      period = COALESCE($3, period),
      start_date = $4,
      end_date = $5,
      status = COALESCE($6, status),
      notes = $7,
      updated_at = NOW()
    WHERE id = $8
    RETURNING *;
  `;
  const result = await query(
    queryText,
    [
      data.member_id,
      data.role_title,
      data.period,
      data.start_date || null,
      data.end_date || null,
      data.status,
      data.notes || null,
      memberAssignmentId,
    ],
    { label: 'org.divisionMembers.update' }
  );

  if (result.rowCount === 0) {
    throw notFound('Data penugasan anggota divisi tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteDivisionMember(memberAssignmentId: string) {
  const result = await query(`DELETE FROM division_members WHERE id = $1 RETURNING id`, [memberAssignmentId], {
    label: 'org.divisionMembers.delete',
  });
  if (result.rowCount === 0) {
    throw notFound('Data penugasan divisi tidak ditemukan.');
  }
  return { id: memberAssignmentId };
}

// ============================================================================
// PROFIL ORGANISASI SATU ANGGOTA
// ============================================================================
export async function getMemberOrganizationProfile(memberId: string) {
  const memberRes = await query(
    `SELECT m.id, m.member_number, m.full_name, m.phone_number, m.email,
            COALESCE(m.member_type, 'ALUMNI') AS member_type,
            COALESCE(m.membership_type, m.member_type, 'ALUMNI') AS membership_type,
            m.status,
            COALESCE(m.is_active, TRUE) AS is_active,
            ap.faculty, ap.major, ap.entry_year, ap.graduation_year,
            ap.current_profession, ap.company_name, ap.ktb_group_name
     FROM members m
     LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
     WHERE m.id = $1`,
    [memberId],
    { label: 'org.memberProfile' }
  );

  if (memberRes.rows.length === 0) {
    throw notFound('Anggota tidak ditemukan.');
  }

  const [committeesRes, tenuresRes, staffRes, divisionsRes] = await Promise.all([
    query(
      `SELECT cr.id, cr.committee_name, cr.role_title, cr.event_year, cr.period,
              cr.start_date, cr.end_date, cr.status, cr.description, cr.created_at
       FROM committee_records cr
       WHERE cr.member_id = $1
       ORDER BY COALESCE(cr.event_year, EXTRACT(YEAR FROM cr.created_at)::int) DESC, cr.created_at DESC`,
      [memberId],
      { label: 'org.memberProfile.committees' }
    ),
    query(
      `SELECT t.id, t.position_id, t.period, t.start_date, t.end_date, t.is_current,
              t.decree_number, t.notes, t.created_at,
              p.title AS position_title, p.position_code, p.category AS position_category,
              p.hierarchy_order, p.function_description
       FROM org_position_tenures t
       JOIN org_positions p ON t.position_id = p.id
       WHERE t.member_id = $1
       ORDER BY t.is_current DESC, p.hierarchy_order ASC, t.start_date DESC NULLS LAST`,
      [memberId],
      { label: 'org.memberProfile.tenures' }
    ),
    query(
      `SELECT sm.id, sm.department_id, sm.position_title, sm.employment_type,
              sm.joined_date, sm.end_date, sm.status, sm.job_description, sm.is_active,
              d.name AS department_name
       FROM staff_members sm
       LEFT JOIN departments d ON sm.department_id = d.id
       WHERE sm.member_id = $1
       ORDER BY sm.is_active DESC, sm.joined_date DESC NULLS LAST`,
      [memberId],
      { label: 'org.memberProfile.staff' }
    ),
    query(
      `SELECT dm.id, dm.department_id, dm.role_title, dm.period, dm.start_date,
              dm.end_date, dm.status, dm.notes, dm.created_at,
              d.name AS division_name, d.order_index
       FROM division_members dm
       JOIN departments d ON dm.department_id = d.id
       WHERE dm.member_id = $1
       ORDER BY CASE WHEN dm.status = 'AKTIF' THEN 0 ELSE 1 END, dm.start_date DESC NULLS LAST`,
      [memberId],
      { label: 'org.memberProfile.divisions' }
    ),
  ]);

  return {
    member: memberRes.rows[0],
    committees: committeesRes.rows,
    positions: tenuresRes.rows,
    staff: staffRes.rows,
    divisions: divisionsRes.rows,
  };
}
