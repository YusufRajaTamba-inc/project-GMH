import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

export const publicRegisterAlumni = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      nik,
      gender,
      birthDate,
      weddingDate,
      phoneNumber,
      email,
      faculty,
      major,
      entryYear,
      homeAddress,
      city,
      province,
      currentProfession,
      maritalStatus,
    } = req.body;

    if (!fullName || !phoneNumber || !homeAddress) {
      res.status(400).json({ success: false, message: 'Nama lengkap, nomor telepon (WhatsApp), dan alamat wajib diisi.' });
      return;
    }

    // Generate ticket code: REG-GMH-YYYYMM-XXX
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countRes = await db.query(
      `SELECT COUNT(*)::int as cnt FROM member_registrations WHERE registration_code LIKE $1`,
      [`REG-GMH-${ym}-%`]
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0');
    const registrationCode = `REG-GMH-${ym}-${seq}`;

    const insertRes = await db.query(
      `INSERT INTO member_registrations (
        registration_code, full_name, gender, birth_date, wedding_date,
        phone_number, email, faculty, major, entry_year,
        home_address, city, province, current_profession, marital_status,
        payload_data, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PENDING')
      RETURNING id, registration_code, full_name, status, created_at`,
      [
        registrationCode,
        fullName.trim(),
        gender || 'Laki-laki',
        birthDate || '2000-01-01',
        weddingDate || null,
        phoneNumber.trim(),
        email ? email.trim() : null,
        faculty || null,
        major || null,
        entryYear ? parseInt(entryYear, 10) : null,
        homeAddress.trim(),
        city || 'Medan',
        province || 'Sumatera Utara',
        currentProfession || null,
        maritalStatus || 'Lajang',
        JSON.stringify(req.body),
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pendaftaran alumni berhasil dikirim dan masuk antrean verifikasi pengurus yayasan.',
      ticket: insertRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses pendaftaran publik.', error: err.message });
  }
};

export const getRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

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

    // 1. Total count
    const countRes = await db.query(
      `SELECT COUNT(*)::int as total FROM member_registrations ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // 2. Paginated data
    let query = `SELECT * FROM member_registrations ${whereClause} ORDER BY created_at DESC`;
    const dataParams = [...params];

    if (!cursor) {
      dataParams.push(limit);
      query += ` LIMIT $${dataParams.length}`;
      dataParams.push(offset);
      query += ` OFFSET $${dataParams.length}`;
    } else {
      dataParams.push(limit);
      query += ` LIMIT $${dataParams.length}`;
    }

    const result = await db.query(query, dataParams);
    const mappedRows = result.rows.map((r: any) => ({
      ...r,
      ticket: r.registration_code,
      ticket_number: r.registration_code,
      ticketNumber: r.registration_code,
    }));
    const pagination = formatPaginationMeta(mappedRows, total, page, limit, 'created_at');

    res.status(200).json({
      success: true,
      count: mappedRows.length,
      registrations: mappedRows,
      data: mappedRows,
      pagination,
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil antrean pendaftaran.', error: err.message });
  }
};

export const approveRegistration = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const regRes = await client.query(`SELECT * FROM member_registrations WHERE id = $1 FOR UPDATE`, [id]);
    if (regRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
      return;
    }

    const reg = regRes.rows[0];
    if (reg.status === 'APPROVED') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Pendaftaran ini sudah disetujui sebelumnya.' });
      return;
    }

    // 1. Generate official NIA: GMH-YYYY-XXXXX
    const year = new Date().getFullYear();
    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM members WHERE member_number LIKE $1`,
      [`GMH-${year}-%`]
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(5, '0');
    const memberNumber = `GMH-${year}-${seq}`;

    // 2. Insert into members
    const memberRes = await client.query(
      `INSERT INTO members (
        member_number, full_name, gender, birth_date, wedding_date,
        phone_number, email, home_address, city, province,
        member_type, status, custom_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ALUMNI', 'ACTIVE', $11)
      RETURNING id, member_number, full_name`,
      [
        memberNumber,
        reg.full_name,
        reg.gender,
        reg.birth_date,
        reg.wedding_date,
        reg.phone_number,
        reg.email,
        reg.home_address,
        reg.city,
        reg.province,
        reg.payload_data || {},
      ]
    );

    const memberId = memberRes.rows[0].id;

    // 3. Insert into alumni_profiles
    await client.query(
      `INSERT INTO alumni_profiles (
        member_id, faculty, major, entry_year, current_profession
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        memberId,
        reg.faculty || 'Fakultas Teknik',
        reg.major || '-',
        reg.entry_year || 2020,
        reg.current_profession || '-',
      ]
    );

    // 4. Update member_registrations status
    await client.query(
      `UPDATE member_registrations
       SET status = 'APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [req.user?.id || null, id]
    );

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'APPROVE', 'member_registrations', id, { oldStatus: reg.status }, { newStatus: 'APPROVED', memberNumber });

    res.status(200).json({
      success: true,
      message: `Pendaftaran berhasil disetujui! NIA Resmi diterbitkan: ${memberNumber}`,
      member: {
        id: memberId,
        memberNumber,
        nia: memberNumber,
        fullName: reg.full_name,
        faculty: reg.faculty,
        entryYear: reg.entry_year,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal memproses persetujuan registrasi.', error: err.message });
  } finally {
    client.release();
  }
};

export const rejectRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updateRes = await db.query(
      `UPDATE member_registrations
       SET status = 'REJECTED', review_notes = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, registration_code, full_name, status, review_notes`,
      [reason || 'Data pendaftaran belum memenuhi syarat verifikasi yayasan.', req.user?.id || null, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
      return;
    }

    await logAudit(req.user?.id || null, 'REJECT', 'member_registrations', id, null, { reason });

    res.status(200).json({
      success: true,
      message: 'Pendaftaran telah ditolak.',
      registration: updateRes.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menolak pendaftaran.', error: err.message });
  }
};
