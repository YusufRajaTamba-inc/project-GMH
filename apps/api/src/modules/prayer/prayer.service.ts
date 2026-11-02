/**
 * Logika bisnis modul Doa (Fase 2).
 *
 * Lapisan ini bertanggung jawab atas seluruh interaksi dengan tabel
 * `prayer_requests`. Route (`prayer.routes.ts`) hanya boleh:
 *   1. validasi payload (schema),
 *   2. panggil service,
 *   3. bentuk response.
 *
 * Semua error domaine dilempar sebagai `HttpError` sehingga central
 * error handler dapat memformatnya secara konsisten.
 */
import { notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  createPrayerRequestSchema,
  updatePrayerStatusSchema,
  type CreatePrayerRequestInput,
  type UpdatePrayerStatusInput,
} from './prayer.schema.js';

export interface PrayerRequestRow {
  id: string;
  sender_name: string;
  sender_phone: string | null;
  sender_email: string | null;
  is_anonymous: boolean;
  prayer_content: string;
  status: string;
  counselor_notes: string | null;
  created_at: Date | string;
}

export interface PrayerListResult {
  rows: PrayerRequestRow[];
  total: number;
}

/**
 * Simpan permohonan doa baru dari form publik.
 * Nama pengirim default ke "Hamba Tuhan (Anonim)" bila kosong.
 */
export async function createPrayerRequest(
  input: CreatePrayerRequestInput
): Promise<PrayerRequestRow> {
  const data = validate(createPrayerRequestSchema, input);

  const result = await query(
    `INSERT INTO prayer_requests (sender_name, sender_phone, sender_email, is_anonymous, prayer_content, status)
     VALUES ($1, $2, $3, $4, $5, 'NEW')
     RETURNING id, sender_name, is_anonymous, status, created_at`,
    [
      data.senderName || 'Hamba Tuhan (Anonim)',
      data.senderPhone || null,
      data.senderEmail || null,
      Boolean(data.isAnonymous),
      data.prayerContent,
    ],
    { label: 'prayer.create' }
  );

  return result.rows[0];
}

/**
 * Ambil daftar permohonan doa dengan paginasi offset/cursor.
 */
export async function listPrayerRequests(params: {
  limit: number;
  offset: number;
  cursor?: string;
}): Promise<PrayerListResult> {
  const { limit, offset, cursor } = params;

  let whereClause = '';
  const queryParams: any[] = [];

  if (cursor) {
    whereClause = ` WHERE created_at < $1`;
    queryParams.push(cursor);
  }

  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM prayer_requests ${whereClause}`,
    queryParams,
    { label: 'prayer.list.count' }
  );
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `SELECT * FROM prayer_requests ${whereClause} ORDER BY created_at DESC`;
  const dataParams = [...queryParams];

  if (!cursor) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  } else {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
  }

  const result = await query(dataQuery, dataParams, { label: 'prayer.list' });

  return { rows: result.rows, total };
}

/**
 * Ubah status permohonan doa dan/atau catatan konselor.
 * Melempar 404 bila record tidak ada.
 */
export async function updatePrayerStatus(
  id: string,
  input: UpdatePrayerStatusInput
): Promise<PrayerRequestRow> {
  const data = validate(updatePrayerStatusSchema, input);
  const noteVal = data.counselorNotes !== undefined ? data.counselorNotes : data.answeredNotes;

  let queryText: string;
  let params: any[];

  if (noteVal !== undefined) {
    queryText = `UPDATE prayer_requests
                SET status = $1, counselor_notes = $2
                WHERE id = $3
                RETURNING *`;
    params = [data.status, noteVal && String(noteVal).trim() ? String(noteVal).trim() : null, id];
  } else {
    queryText = `UPDATE prayer_requests
                SET status = $1
                WHERE id = $2
                RETURNING *`;
    params = [data.status, id];
  }

  const result = await query(queryText, params, { label: 'prayer.updateStatus' });

  if (!result.rows[0]) {
    throw notFound('Permohonan doa tidak ditemukan.', 'PRAYER_NOT_FOUND');
  }

  return result.rows[0];
}
