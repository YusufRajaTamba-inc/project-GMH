import { db } from '../../config/db.js';
import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { formatPaginationMeta } from '../../utils/pagination.js';
import {
  ListMembersQueryInput,
  CreateMemberInput,
  UpdateMemberInput,
  BulkImportDryRunInput,
  BulkImportCommitInput,
} from './members.schema.js';

export async function getMembers(filters: ListMembersQueryInput) {
  const { search, faculty, type, status, entryYear, city, maritalStatus, cursor } = filters;
  const page = Math.max(1, filters.page || 1);
  const limit = filters.limit === 'all' ? 10000 : Math.min(10000, Math.max(1, Number(filters.limit) || 200));
  const offset = (page - 1) * limit;

  let whereClause = ` WHERE 1=1`;
  const params: any[] = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    whereClause += ` AND (m.full_name ILIKE $${idx} OR m.member_number ILIKE $${idx} OR m.city ILIKE $${idx} OR ap.faculty ILIKE $${idx})`;
  }

  if (faculty) {
    params.push(faculty);
    whereClause += ` AND ap.faculty = $${params.length}`;
  }

  if (type) {
    params.push(type);
    whereClause += ` AND m.member_type = $${params.length}`;
  }

  if (status) {
    params.push(status);
    whereClause += ` AND m.status = $${params.length}`;
  }

  if (entryYear) {
    params.push(entryYear);
    whereClause += ` AND ap.entry_year = $${params.length}`;
  }

  if (city) {
    params.push(`%${city}%`);
    whereClause += ` AND m.city ILIKE $${params.length}`;
  }

  if (maritalStatus === 'Menikah') {
    whereClause += ` AND (m.wedding_date IS NOT NULL OR m.custom_fields->>'maritalStatus' = 'Menikah')`;
  } else if (maritalStatus === 'Lajang') {
    whereClause += ` AND (m.wedding_date IS NULL AND (m.custom_fields->>'maritalStatus' IS NULL OR m.custom_fields->>'maritalStatus' = 'Lajang'))`;
  }

  if (cursor) {
    params.push(cursor);
    whereClause += ` AND m.member_number > $${params.length}`;
  }

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM members m
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    ${whereClause}
  `;
  const countRes = await query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `
    SELECT 
      m.id, m.member_number, m.member_number as nia, m.nik, m.full_name, m.nickname, m.gender,
      m.birth_place, m.birth_date, m.wedding_date, m.phone_number, m.email,
      m.home_address, m.city, m.province, m.postal_code, m.member_type, m.status,
      m.custom_fields,
      ap.faculty, ap.major, ap.entry_year, ap.graduation_year, ap.current_profession, ap.company_name, ap.ktb_group_name, ap.ministry_field
    FROM members m
    LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
    ${whereClause}
    ORDER BY m.member_number ASC
  `;

  const dataParams = [...params];
  if (!cursor) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  } else {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
  }

  const result = await query(dataQuery, dataParams);
  const pagination = formatPaginationMeta(result.rows, total, page, limit, 'member_number');

  return {
    count: result.rows.length,
    members: result.rows,
    data: result.rows,
    pagination,
  };
}

export async function getMemberById(id: string) {
  const member = await queryOne(
    `SELECT m.*, ap.faculty, ap.major, ap.entry_year, ap.graduation_year, ap.current_profession, ap.company_name, ap.ktb_group_name, ap.ministry_field
     FROM members m
     LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
     WHERE m.id = $1`,
    [id]
  );

  if (!member) {
    throw HttpError.notFound('Anggota tidak ditemukan.');
  }

  return member;
}

export async function createMember(input: CreateMemberInput, actorUserId?: string | null) {
  const {
    fullName,
    nik,
    gender,
    birthPlace,
    birthDate,
    weddingDate,
    maritalStatus,
    partnerName,
    childrenCount,
    phoneNumber,
    email,
    homeAddress,
    city,
    province,
    postalCode,
    memberType,
    faculty,
    major,
    entryYear,
    graduationYear,
    gradYear,
    profession,
    company,
    ktb,
    ministryInterest,
    socialMedia,
  } = input;

  if (nik && nik.trim()) {
    const cleanNik = nik.trim();
    const existingNik = await queryOne<{ full_name: string; member_number: string }>(
      'SELECT id, full_name, member_number FROM members WHERE nik = $1',
      [cleanNik]
    );
    if (existingNik) {
      throw HttpError.badRequest(
        `NIK ${cleanNik} sudah terdaftar di sistem atas nama ${existingNik.full_name} (${existingNik.member_number}). Tidak dapat menambahkan anggota dengan NIK yang sama.`
      );
    }
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const year = new Date().getFullYear();
    const countRes = await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(member_number FROM '[0-9]+$')::int), 0) as max_seq 
       FROM members 
       WHERE member_number LIKE $1`,
      [`%${year}-%`]
    );
    const seq = String(parseInt(countRes.rows[0]?.max_seq || 0, 10) + 1).padStart(5, '0');
    const memberNumber = `GMH-${year}-${seq}`;

    const isSingle = maritalStatus && maritalStatus.toLowerCase().includes('lajang');
    const actualWeddingDate = isSingle ? null : (weddingDate || null);

    const customFieldsObj = {
      maritalStatus: maritalStatus || (actualWeddingDate ? 'Menikah' : 'Lajang'),
      partnerName: isSingle ? null : (partnerName || null),
      childrenCount: isSingle ? 0 : (childrenCount !== undefined && childrenCount !== null ? Number(childrenCount) : 0),
      ministryInterest: ministryInterest || null,
      socialMedia: socialMedia || {},
    };

    const memberRes = await client.query(
      `INSERT INTO members (
        member_number, nik, full_name, gender, birth_place, birth_date, wedding_date,
        phone_number, email, home_address, city, province, postal_code,
        member_type, status, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE', $15)
      RETURNING *`,
      [
        memberNumber,
        nik || null,
        fullName.trim(),
        gender,
        birthPlace || null,
        birthDate,
        actualWeddingDate,
        phoneNumber.trim(),
        email ? email.trim() : null,
        homeAddress,
        city,
        province,
        postalCode || null,
        memberType,
        JSON.stringify(customFieldsObj),
      ]
    );

    const newMember = memberRes.rows[0];

    const finalGradYear = graduationYear || gradYear || null;

    await client.query(
      `INSERT INTO alumni_profiles (member_id, faculty, major, entry_year, graduation_year, current_profession, company_name, ministry_field, ktb_group_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [newMember.id, faculty, major, entryYear, finalGradYear, profession, company, ministryInterest || null, ktb || null]
    );

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'INSERT', 'members', newMember.id, null, newMember);

    return {
      memberNumber,
      member: newMember,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function bulkImportDryRun(input: BulkImportDryRunInput) {
  const { rows } = input;
  const validatedRows: any[] = [];
  let validCount = 0;
  let errorCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const errors: string[] = [];

    if (!r.name || String(r.name).trim().length < 2) {
      errors.push('Nama wajib diisi minimal 2 karakter');
    }

    if (!r.phone || String(r.phone).trim().length < 8) {
      errors.push('Nomor WhatsApp wajib valid');
    }

    if (r.nik && String(r.nik).trim()) {
      const nikCheck = await queryOne(`SELECT id FROM members WHERE nik = $1`, [String(r.nik).trim()]);
      if (nikCheck) {
        errors.push(`NIK ${r.nik} sudah terdaftar di database yayasan`);
      }
    }

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else errorCount++;

    validatedRows.push({
      rowIndex: i + 1,
      name: r.name,
      nik: r.nik || '',
      gender: r.gender || 'Laki-laki',
      faculty: r.faculty || 'Fakultas Teknik',
      major: r.major || '-',
      entryYear: r.entryYear ? parseInt(r.entryYear, 10) : 2020,
      city: r.city || 'Medan',
      phone: r.phone || '',
      email: r.email || '',
      profession: r.profession || '-',
      isValid,
      errors,
    });
  }

  return {
    summary: {
      total: rows.length,
      valid: validCount,
      error: errorCount,
      canProceed: validCount > 0,
    },
    preview: validatedRows,
  };
}

export async function bulkImportCommit(input: BulkImportCommitInput, actorUserId?: string | null) {
  const { validRows } = input;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const year = new Date().getFullYear();
    const countRes = await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(member_number FROM '[0-9]+$')::int), 0) as max_seq 
       FROM members 
       WHERE member_number LIKE $1`,
      [`%${year}-%`]
    );
    let startSeq = parseInt(countRes.rows[0]?.max_seq || 0, 10);
    const insertedNias: string[] = [];
    const seenNiksInBatch = new Set<string>();
    let skippedCount = 0;

    for (const r of validRows) {
      const fullName = String(r.name || r.full_name || '').trim();
      if (!fullName) continue;

      const rawNik = r.nik && String(r.nik).trim() ? String(r.nik).trim() : null;
      const phone = String(r.phone || r.phone_number || '').trim();
      const email = r.email && String(r.email).trim() ? String(r.email).trim() : null;
      const city = String(r.city || 'Medan').trim();
      const gender = r.gender === 'F' || r.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
      const faculty = String(r.faculty || 'Fakultas Teknik').trim();
      const major = String(r.major || '-').trim();
      const entryYear = r.entryYear || r.entry_year ? parseInt(r.entryYear || r.entry_year, 10) : 2020;
      const profession = String(r.profession || r.current_profession || '-').trim();
      const company = String(r.company || r.company_name || '').trim();
      const ktbGroup = String(r.ktb || r.ktb_group || r.ktb_group_name || '').trim();

      if (rawNik) {
        if (seenNiksInBatch.has(rawNik)) {
          skippedCount++;
          continue;
        }
        seenNiksInBatch.add(rawNik);

        const existing = await client.query('SELECT id FROM members WHERE nik = $1', [rawNik]);
        if (existing.rows.length > 0) {
          skippedCount++;
          continue;
        }
      }

      startSeq++;
      const finalNia = `GMH-${year}-${String(startSeq).padStart(5, '0')}`;
      const memRes = await client.query(
        `INSERT INTO members (
          member_number, nik, full_name, gender, birth_date,
          phone_number, email, home_address, city, member_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ALUMNI', 'ACTIVE')
        RETURNING id`,
        [finalNia, rawNik, fullName, gender, '2000-01-01', phone, email, city, city]
      );
      const memberId = memRes.rows[0].id;

      await client.query(
        `INSERT INTO alumni_profiles (member_id, faculty, major, entry_year, current_profession, company_name, ktb_group_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (member_id) DO UPDATE SET
           faculty = EXCLUDED.faculty,
           major = EXCLUDED.major,
           entry_year = EXCLUDED.entry_year,
           current_profession = EXCLUDED.current_profession,
           company_name = COALESCE(EXCLUDED.company_name, alumni_profiles.company_name),
           ktb_group_name = COALESCE(EXCLUDED.ktb_group_name, alumni_profiles.ktb_group_name)`,
        [memberId, faculty, major, entryYear, profession, company, ktbGroup]
      );

      insertedNias.push(finalNia);
    }

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'INSERT', 'members', null, null, {
      importedCount: insertedNias.length,
      skippedCount,
      nias: insertedNias,
    });

    return {
      importedCount: insertedNias.length,
      skippedCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateMember(id: string, input: UpdateMemberInput, actorUserId?: string | null) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query(`SELECT * FROM members WHERE id = $1`, [id]);
    if (existingRes.rows.length === 0) {
      throw HttpError.notFound('Anggota tidak ditemukan.');
    }

    const {
      fullName,
      nik,
      gender,
      birthPlace,
      birthDate,
      weddingDate,
      maritalStatus,
      partnerName,
      childrenCount,
      phoneNumber,
      email,
      homeAddress,
      city,
      province,
      postalCode,
      memberType,
      status,
      faculty,
      major,
      entryYear,
      graduationYear,
      profession,
      company,
      ktb,
      ministryInterest,
      socialMedia,
    } = input;

    if (nik && nik.trim()) {
      const cleanNik = nik.trim();
      const conflictNik = await client.query(
        'SELECT id, full_name, member_number FROM members WHERE nik = $1 AND id != $2',
        [cleanNik, id]
      );
      if (conflictNik.rows.length > 0) {
        throw HttpError.badRequest(
          `NIK ${cleanNik} sudah terdaftar atas nama ${conflictNik.rows[0].full_name} (${conflictNik.rows[0].member_number}). Tidak dapat menggunakan NIK yang sama.`
        );
      }
    }

    const currentMember = existingRes.rows[0];
    const isSingle = maritalStatus && maritalStatus.toLowerCase().includes('lajang');
    const actualWeddingDate = isSingle ? null : (weddingDate ? weddingDate : null);

    const updatedCustomFields = {
      ...(currentMember.custom_fields || {}),
      ...(socialMedia ? { socialMedia } : {}),
      ...(maritalStatus ? { maritalStatus } : {}),
      ...(partnerName !== undefined ? { partnerName: isSingle ? null : partnerName } : {}),
      ...(childrenCount !== undefined ? { childrenCount: isSingle ? 0 : Number(childrenCount) } : {}),
      ...(ministryInterest !== undefined ? { ministryInterest } : {}),
    };

    const updateMemRes = await client.query(
      `UPDATE members SET
        full_name = COALESCE($1, full_name),
        nik = COALESCE($2, nik),
        gender = COALESCE($3, gender),
        birth_place = COALESCE($4, birth_place),
        birth_date = COALESCE($5, birth_date),
        wedding_date = $6,
        phone_number = COALESCE($7, phone_number),
        email = COALESCE($8, email),
        home_address = COALESCE($9, home_address),
        city = COALESCE($10, city),
        province = COALESCE($11, province),
        postal_code = COALESCE($12, postal_code),
        member_type = COALESCE($13, member_type),
        status = COALESCE($14, status),
        custom_fields = $15,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING *`,
      [
        fullName ? fullName.trim() : null,
        nik !== undefined ? nik : null,
        gender || null,
        birthPlace || null,
        birthDate || null,
        actualWeddingDate,
        phoneNumber ? phoneNumber.trim() : null,
        email !== undefined ? email : null,
        homeAddress || null,
        city || null,
        province || null,
        postalCode || null,
        memberType || null,
        status || null,
        updatedCustomFields,
        id,
      ]
    );

    await client.query(
      `INSERT INTO alumni_profiles (member_id, faculty, major, entry_year, graduation_year, current_profession, company_name, ministry_field, ktb_group_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (member_id) DO UPDATE SET
         faculty = COALESCE(EXCLUDED.faculty, alumni_profiles.faculty),
         major = COALESCE(EXCLUDED.major, alumni_profiles.major),
         entry_year = COALESCE(EXCLUDED.entry_year, alumni_profiles.entry_year),
         graduation_year = COALESCE(EXCLUDED.graduation_year, alumni_profiles.graduation_year),
         current_profession = COALESCE(EXCLUDED.current_profession, alumni_profiles.current_profession),
         company_name = COALESCE(EXCLUDED.company_name, alumni_profiles.company_name),
         ministry_field = COALESCE(EXCLUDED.ministry_field, alumni_profiles.ministry_field),
         ktb_group_name = COALESCE(EXCLUDED.ktb_group_name, alumni_profiles.ktb_group_name)`,
      [
        id,
        faculty || null,
        major || null,
        entryYear ? entryYear : null,
        graduationYear ? graduationYear : null,
        profession || null,
        company || null,
        ministryInterest || null,
        ktb || null,
      ]
    );

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'UPDATE', 'members', id, currentMember, updateMemRes.rows[0]);

    return updateMemRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteMember(id: string, actorUserId?: string | null) {
  const existing = await queryOne('SELECT * FROM members WHERE id = $1', [id]);
  if (!existing) {
    throw HttpError.notFound('Anggota tidak ditemukan.');
  }

  await query(`DELETE FROM members WHERE id = $1`, [id]);
  await logAudit(actorUserId || null, 'DELETE', 'members', id, existing, null);

  return existing;
}
