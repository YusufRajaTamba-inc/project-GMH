import { db } from '../../config/db.js';
import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { formatPaginationMeta } from '../../utils/pagination.js';
import {
  PublicRegisterAlumniInput,
  ListRegistrationsQueryInput,
} from './registrations.schema.js';

export async function publicRegisterAlumni(input: PublicRegisterAlumniInput, rawBody: any) {
  const {
    fullName,
    nik,
    gender,
    birthPlace,
    birthDate,
    weddingDate,
    phoneNumber,
    email,
    faculty,
    major,
    entryYear,
    graduationYear,
    gradYear,
    homeAddress,
    city,
    province,
    postalCode,
    currentProfession,
    profession,
    company,
    ktb,
    ministryInterest,
    partnerName,
    childrenCount,
    maritalStatus,
    memberType,
    socialMedia,
    linkedin,
    instagram,
    facebook,
    website,
  } = input;

  // R7 Mitigasi Bot/Spam: Jika hidden honeypot terisi, tolak permintaan
  if (website && website.trim().length > 0) {
    throw HttpError.badRequest('Pendaftaran tidak dapat diproses (terdeteksi otomasi/bot).');
  }

  const currentYear = new Date().getFullYear();
  if (entryYear && (entryYear < 1960 || entryYear > currentYear + 1)) {
    throw HttpError.badRequest(`Tahun angkatan (stambuk) harus berada di antara 1960 dan ${currentYear + 1}.`);
  }

  // Validasi dan Cek NIK Duplikat di database Yayasan
  const cleanNik = nik ? nik.replace(/[^0-9]/g, '').trim() : null;
  if (cleanNik) {
    if (cleanNik.length !== 16) {
      throw HttpError.badRequest(
        `Nomor Induk Kependudukan (NIK) harus terdiri dari tepat 16 digit angka (terdeteksi ${cleanNik.length} digit).`
      );
    }

    const existingInMembers = await queryOne<{ full_name: string; member_number: string }>(
      'SELECT id, full_name, member_number FROM members WHERE nik = $1',
      [cleanNik]
    );
    if (existingInMembers) {
      throw HttpError.badRequest(
        `NIK ${cleanNik} sudah terdaftar di database yayasan atas nama ${existingInMembers.full_name} (${existingInMembers.member_number}). Data tidak dapat didaftarkan ganda.`
      );
    }

    const existingPending = await queryOne<{ registration_code: string; full_name: string }>(
      `SELECT registration_code, full_name FROM member_registrations WHERE nik = $1 AND status = 'PENDING'`,
      [cleanNik]
    );
    if (existingPending) {
      throw HttpError.badRequest(
        `NIK ${cleanNik} saat ini sedang dalam proses antrean verifikasi pengurus yayasan dengan nomor tiket ${existingPending.registration_code}.`
      );
    }
  }

  // Generate ticket code: REG-GMH-YYYYMM-XXX
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const countRes = await query<{ cnt: number }>(
    `SELECT COUNT(*)::int as cnt FROM member_registrations WHERE registration_code LIKE $1`,
    [`REG-GMH-${ym}-%`]
  );
  const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0');
  const registrationCode = `REG-GMH-${ym}-${seq}`;

  const isSingle = (maritalStatus || 'Lajang').toLowerCase().includes('lajang');
  const actualWeddingDate = isSingle ? null : (weddingDate || null);

  const bloodTypeToUse = (rawBody.bloodType || rawBody.blood_type || null) ? String(rawBody.bloodType || rawBody.blood_type).trim() : null;

  const payloadObj = {
    ...rawBody,
    nik: cleanNik || null,
    birthPlace: birthPlace ? birthPlace.trim() : (rawBody.birthPlace || null),
    postalCode: postalCode ? postalCode.trim() : (rawBody.postalCode || null),
    bloodType: bloodTypeToUse,
    graduationYear: graduationYear || gradYear || rawBody.graduationYear || rawBody.gradYear || null,
    partnerName: isSingle ? null : (partnerName ? partnerName.trim() : (rawBody.partnerName || null)),
    childrenCount: isSingle ? 0 : (childrenCount !== undefined && childrenCount !== null ? Number(childrenCount) : (rawBody.childrenCount ? Number(rawBody.childrenCount) : 0)),
    ministryInterest: ministryInterest || rawBody.ministryInterest || null,
    profession: profession || currentProfession || rawBody.profession || null,
    company: company || rawBody.company || null,
    ktb: ktb || rawBody.ktb || null,
    socialMedia: socialMedia || {
      linkedin: linkedin || rawBody.linkedin || rawBody.socialMedia?.linkedin || null,
      instagram: instagram || rawBody.instagram || rawBody.socialMedia?.instagram || null,
      facebook: facebook || rawBody.facebook || rawBody.socialMedia?.facebook || null,
    },
  };

  const insertRes = await query(
    `INSERT INTO member_registrations (
      registration_code, full_name, nik, gender, birth_place, birth_date, blood_type, wedding_date,
      phone_number, email, home_address, city, province, postal_code,
      faculty, major, entry_year, graduation_year, current_profession, marital_status,
      member_type, payload_data, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'PENDING')
    RETURNING id, registration_code, full_name, status, created_at`,
    [
      registrationCode,
      fullName.trim(),
      cleanNik || null,
      gender || 'Laki-laki',
      birthPlace ? birthPlace.trim() : null,
      birthDate || '2000-01-01',
      bloodTypeToUse,
      actualWeddingDate,
      phoneNumber.trim(),
      email ? email.trim() : null,
      homeAddress.trim(),
      city || 'Medan',
      province || 'Sumatera Utara',
      postalCode ? postalCode.trim() : null,
      faculty || null,
      major || null,
      entryYear || null,
      graduationYear || gradYear || null,
      profession || currentProfession || null,
      maritalStatus || 'Lajang',
      memberType || 'ALUMNI',
      JSON.stringify(payloadObj),
    ]
  );

  return insertRes.rows[0];
}

export async function getRegistrations(filters: ListRegistrationsQueryInput) {
  const status = filters.status;
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 10));
  const offset = (page - 1) * limit;
  const cursor = filters.cursor;

  let whereClause = '';
  const params: any[] = [];

  if (status) {
    whereClause += ` WHERE status = $1`;
    params.push(status.toUpperCase());
  }

  if (cursor) {
    const idx = params.length + 1;
    whereClause += whereClause ? ` AND created_at < $${idx}` : ` WHERE created_at < $${idx}`;
    params.push(cursor);
  }

  const countRes = await query<{ total: number }>(
    `SELECT COUNT(*)::int as total FROM member_registrations ${whereClause}`,
    params
  );
  const total = countRes.rows[0]?.total || 0;

  let queryText = `SELECT * FROM member_registrations ${whereClause} ORDER BY created_at DESC`;
  const dataParams = [...params];

  if (!cursor) {
    dataParams.push(limit);
    queryText += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    queryText += ` OFFSET $${dataParams.length}`;
  } else {
    dataParams.push(limit);
    queryText += ` LIMIT $${dataParams.length}`;
  }

  const result = await query(queryText, dataParams);
  const mappedRows = result.rows.map((r: any) => ({
    ...r,
    ticket: r.registration_code,
    ticket_number: r.registration_code,
    ticketNumber: r.registration_code,
  }));
  const pagination = formatPaginationMeta(mappedRows, total, page, limit, 'created_at');

  return {
    count: mappedRows.length,
    registrations: mappedRows,
    data: mappedRows,
    pagination,
  };
}

export async function approveRegistration(id: string, actorUserId?: string | null) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const regRes = await client.query(`SELECT * FROM member_registrations WHERE id = $1 FOR UPDATE`, [id]);
    if (regRes.rows.length === 0) {
      throw HttpError.notFound('Data pendaftaran tidak ditemukan.');
    }

    const reg = regRes.rows[0];
    if (reg.status === 'APPROVED') {
      throw HttpError.badRequest('Pendaftaran ini sudah disetujui sebelumnya.');
    }

    const year = new Date().getFullYear();
    const countRes = await client.query(
      `SELECT COALESCE(MAX(SUBSTRING(member_number FROM '[0-9]+$')::int), 0) as max_seq 
       FROM members 
       WHERE member_number LIKE $1`,
      [`%${year}-%`]
    );
    const seq = String(parseInt(countRes.rows[0]?.max_seq || 0, 10) + 1).padStart(5, '0');
    const memberNumber = `GMH-${year}-${seq}`;

    const payload = reg.payload_data || {};
    const memberTypeToUse = reg.member_type || payload.memberType || payload.type || 'ALUMNI';
    const nikToUse = reg.nik || payload.nik || null;

    if (nikToUse && String(nikToUse).trim()) {
      const cleanNik = String(nikToUse).trim();
      const existingNik = await client.query(
        'SELECT id, full_name, member_number FROM members WHERE nik = $1',
        [cleanNik]
      );
      if (existingNik.rows.length > 0) {
        throw HttpError.badRequest(
          `NIK ${cleanNik} sudah terdaftar atas nama ${existingNik.rows[0].full_name} (${existingNik.rows[0].member_number}). Tidak dapat menyetujui pendaftaran ganda.`
        );
      }
    }

    const isSingle = (reg.marital_status || payload.maritalStatus || 'Lajang').toLowerCase().includes('lajang');
    const actualWeddingDate = isSingle ? null : (reg.wedding_date || payload.weddingDate || null);

    const customFieldsObj = {
      ...(typeof payload === 'object' && payload !== null ? payload : {}),
      maritalStatus: reg.marital_status || payload.maritalStatus || (actualWeddingDate ? 'Menikah' : 'Lajang'),
      partnerName: isSingle ? null : (payload.partnerName || null),
      childrenCount: isSingle ? 0 : (payload.childrenCount !== undefined ? Number(payload.childrenCount) : 0),
      ministryInterest: payload.ministryInterest || null,
      socialMedia: payload.socialMedia || {
        linkedin: payload.linkedin || null,
        instagram: payload.instagram || null,
        facebook: payload.facebook || null,
      },
    };

    const birthPlaceToUse = reg.birth_place || payload.birthPlace || null;
    const postalCodeToUse = reg.postal_code || payload.postalCode || null;
    const bloodTypeToUse = reg.blood_type || payload.bloodType || payload.blood_type || null;
    const maritalStatusToUse = reg.marital_status || payload.maritalStatus || (actualWeddingDate ? 'Menikah' : 'Lajang');

    const memberRes = await client.query(
      `INSERT INTO members (
        member_number, nik, full_name, gender, birth_place, birth_date, blood_type, marital_status, wedding_date,
        phone_number, email, home_address, city, province, postal_code,
        member_type, status, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'ACTIVE', $17)
      RETURNING id, member_number, full_name, nik, member_type`,
      [
        memberNumber,
        nikToUse,
        reg.full_name,
        reg.gender,
        birthPlaceToUse,
        reg.birth_date,
        bloodTypeToUse,
        maritalStatusToUse,
        actualWeddingDate,
        reg.phone_number,
        reg.email,
        reg.home_address,
        reg.city,
        reg.province,
        postalCodeToUse,
        memberTypeToUse,
        JSON.stringify(customFieldsObj),
      ]
    );

    const memberId = memberRes.rows[0].id;

    await client.query(
      `INSERT INTO alumni_profiles (
        member_id, faculty, major, entry_year, graduation_year, current_profession, company_name, ministry_field, ktb_group_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        memberId,
        reg.faculty || 'Fakultas Teknik',
        reg.major || '-',
        reg.entry_year || 2020,
        payload.graduationYear || payload.gradYear || null,
        reg.current_profession || payload.profession || '-',
        payload.company || null,
        payload.ministryInterest || null,
        payload.ktb || null,
      ]
    );

    await client.query(
      `UPDATE member_registrations
       SET status = 'APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [actorUserId || null, id]
    );

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'APPROVE', 'member_registrations', id, { oldStatus: reg.status }, { newStatus: 'APPROVED', memberNumber });

    return {
      memberId,
      memberNumber,
      fullName: reg.full_name,
      faculty: reg.faculty,
      entryYear: reg.entry_year,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectRegistration(id: string, reason?: string, actorUserId?: string | null) {
  const updateRes = await query(
    `UPDATE member_registrations
     SET status = 'REJECTED', review_notes = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, registration_code, full_name, status, review_notes`,
    [reason || 'Data pendaftaran belum memenuhi syarat verifikasi yayasan.', actorUserId || null, id]
  );

  if (updateRes.rows.length === 0) {
    throw HttpError.notFound('Data pendaftaran tidak ditemukan.');
  }

  await logAudit(actorUserId || null, 'REJECT', 'member_registrations', id, null, { reason });

  return updateRes.rows[0];
}
