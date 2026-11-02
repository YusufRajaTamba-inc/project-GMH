import { db } from '../../config/db.js';
import { conflict, notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  updateNumberingConfigSchema,
  getNextNumberQuerySchema,
  createOutgoingLetterSchema,
  updateOutgoingLetterSchema,
  createIncomingLetterSchema,
  updateIncomingLetterSchema,
  type UpdateNumberingConfigInput,
  type GetNextNumberQueryInput,
  type CreateOutgoingLetterInput,
  type UpdateOutgoingLetterInput,
  type CreateIncomingLetterInput,
  type UpdateIncomingLetterInput,
} from './secretariat.schema.js';

// Standard Roman Month mapping
export const ROMAN_MONTHS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
  7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
};

export interface LetterConfig {
  pattern: string;
  prefix: string;
  padding: number;
  counter: number;
  resetPeriod: string;
  lastYear?: number;
  lastMonth?: number;
}

export const DEFAULT_CONFIG: LetterConfig = {
  pattern: '{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}',
  prefix: 'GMH-PAKMK',
  padding: 3,
  counter: 1,
  resetPeriod: 'YEARLY',
  lastYear: 2026,
  lastMonth: 10,
};

export function formatLetterNumber(
  pattern: string,
  prefix: string,
  category: string,
  date: Date,
  counter: number,
  padding: number
): string {
  const padded = String(counter).padStart(padding || 3, '0');
  const month = date.getMonth() + 1;
  const romanMonth = ROMAN_MONTHS[month] || String(month);
  const twoDigitMonth = String(month).padStart(2, '0');
  const year = String(date.getFullYear());

  let result = pattern;
  result = result.replace(/\{NOMOR\}/gi, padded);
  result = result.replace(/\{NUMBER\}/gi, padded);
  result = result.replace(/\{PREFIX\}/gi, prefix || 'GMH-PAKMK');
  result = result.replace(/\{KODE_ORGANISASI\}/gi, prefix || 'GMH-PAKMK');
  result = result.replace(/\{CATEGORY\}/gi, category || 'SK');
  result = result.replace(/\{KATEGORI\}/gi, category || 'SK');
  result = result.replace(/\{ROMAN_MONTH\}/gi, romanMonth);
  result = result.replace(/\{BULAN_ROMAWI\}/gi, romanMonth);
  result = result.replace(/\{MONTH\}/gi, twoDigitMonth);
  result = result.replace(/\{BULAN_ANGKA\}/gi, twoDigitMonth);
  result = result.replace(/\{YEAR\}/gi, year);
  result = result.replace(/\{TAHUN\}/gi, year);
  return result;
}

// ============================================================================
// 1. STATS
// ============================================================================
export async function getSecretariatStats() {
  const currentYear = new Date().getFullYear();

  const [outgoingStats, incomingStats] = await Promise.all([
    query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN EXTRACT(YEAR FROM letter_date) = $1 THEN 1 END) as this_year,
        COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as drafts
      FROM secretariat_outgoing_letters`,
      [currentYear],
      { label: 'secretariat.stats.outgoing' }
    ),
    query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN EXTRACT(YEAR FROM received_date) = $1 THEN 1 END) as this_year,
        COUNT(CASE WHEN status = 'DITERIMA' OR status = 'DIDISPOSISIKAN' THEN 1 END) as pending_disposition
      FROM secretariat_incoming_letters`,
      [currentYear],
      { label: 'secretariat.stats.incoming' }
    ),
  ]);

  return {
    outgoing: {
      total: parseInt(outgoingStats.rows[0]?.total || '0', 10),
      thisYear: parseInt(outgoingStats.rows[0]?.this_year || '0', 10),
      drafts: parseInt(outgoingStats.rows[0]?.drafts || '0', 10),
    },
    incoming: {
      total: parseInt(incomingStats.rows[0]?.total || '0', 10),
      thisYear: parseInt(incomingStats.rows[0]?.this_year || '0', 10),
      pendingDisposition: parseInt(incomingStats.rows[0]?.pending_disposition || '0', 10),
    },
  };
}

// ============================================================================
// 2. NUMBERING CONFIGURATION & PREVIEW
// ============================================================================
export async function getNumberingConfig() {
  const [formatRow, categoriesRes] = await Promise.all([
    query(
      `SELECT id, category, code, label, metadata 
       FROM system_lookups 
       WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'`,
      [],
      { label: 'secretariat.config.getPattern' }
    ),
    query(
      `SELECT id, code, label, sort_order, is_active
       FROM system_lookups
       WHERE category = 'LETTER_CATEGORY' AND is_active = TRUE
       ORDER BY sort_order ASC, label ASC`,
      [],
      { label: 'secretariat.config.getCategories' }
    ),
  ]);

  const config: LetterConfig = {
    ...DEFAULT_CONFIG,
    ...(formatRow.rows[0]?.metadata || {}),
  };

  const samplePreview = formatLetterNumber(
    config.pattern,
    config.prefix,
    'SK',
    new Date(),
    config.counter,
    config.padding
  );

  return {
    config,
    preview: samplePreview,
    categories: categoriesRes.rows,
  };
}

export async function updateNumberingConfig(input: UpdateNumberingConfigInput) {
  const data = validate(updateNumberingConfigSchema, input);

  const existingRow = await query(
    `SELECT id, metadata FROM system_lookups 
     WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'`,
    [],
    { label: 'secretariat.config.findPattern' }
  );

  const currentMeta: LetterConfig = {
    ...DEFAULT_CONFIG,
    ...(existingRow.rows[0]?.metadata || {}),
  };

  const updatedMeta: LetterConfig = {
    ...currentMeta,
    pattern: data.pattern !== undefined ? data.pattern : currentMeta.pattern,
    prefix: data.prefix !== undefined ? data.prefix : currentMeta.prefix,
    padding: data.padding !== undefined ? data.padding : currentMeta.padding,
    counter: data.counter !== undefined ? data.counter : currentMeta.counter,
    resetPeriod: data.resetPeriod !== undefined ? data.resetPeriod : currentMeta.resetPeriod,
    lastYear: currentMeta.lastYear || new Date().getFullYear(),
    lastMonth: currentMeta.lastMonth || (new Date().getMonth() + 1),
  };

  if (existingRow.rows.length === 0) {
    await query(
      `INSERT INTO system_lookups (category, code, label, sort_order, is_active, metadata)
       VALUES ('LETTER_FORMAT', 'OUTGOING_PATTERN', 'Format Penomoran Surat Keluar', 1, TRUE, $1::jsonb)`,
      [JSON.stringify(updatedMeta)],
      { label: 'secretariat.config.insertPattern' }
    );
  } else {
    await query(
      `UPDATE system_lookups
       SET metadata = $1::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'`,
      [JSON.stringify(updatedMeta)],
      { label: 'secretariat.config.updatePattern' }
    );
  }

  const preview = formatLetterNumber(
    updatedMeta.pattern,
    updatedMeta.prefix,
    'SK',
    new Date(),
    updatedMeta.counter,
    updatedMeta.padding
  );

  return {
    config: updatedMeta,
    preview,
  };
}

export async function getNextOutgoingNumber(params: GetNextNumberQueryInput) {
  const data = validate(getNextNumberQuerySchema, params);
  const date = data.date ? new Date(data.date) : new Date();

  const formatRow = await query(
    `SELECT metadata FROM system_lookups 
     WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'`,
    [],
    { label: 'secretariat.outgoing.nextNumConfig' }
  );

  const config: LetterConfig = {
    ...DEFAULT_CONFIG,
    ...(formatRow.rows[0]?.metadata || {}),
  };

  let nextCounter = Number(config.counter) || 1;
  const targetYear = date.getFullYear();
  const lastYear = config.lastYear || targetYear;

  if (config.resetPeriod === 'YEARLY' && targetYear !== lastYear) {
    nextCounter = 1;
  }

  const nextNumber = formatLetterNumber(
    config.pattern,
    config.prefix,
    data.category || 'SK',
    date,
    nextCounter,
    config.padding
  );

  return {
    nextNumber,
    counter: nextCounter,
    pattern: config.pattern,
    prefix: config.prefix,
  };
}

// ============================================================================
// 3. OUTGOING LETTERS
// ============================================================================
export interface ListOutgoingParams {
  search?: string;
  category?: string;
  status?: string;
  limit: number;
  offset: number;
}

export async function listOutgoingLetters(params: ListOutgoingParams) {
  const { search, category, status, limit, offset } = params;
  const conditions: string[] = ['1=1'];
  const queryParams: any[] = [];
  let pIdx = 1;

  if (search) {
    conditions.push(`(
      letter_number ILIKE $${pIdx} OR 
      subject ILIKE $${pIdx} OR 
      recipient ILIKE $${pIdx} OR 
      signer_name ILIKE $${pIdx}
    )`);
    queryParams.push(`%${search}%`);
    pIdx++;
  }

  if (category) {
    conditions.push(`category_code = $${pIdx}`);
    queryParams.push(category);
    pIdx++;
  }

  if (status) {
    conditions.push(`status = $${pIdx}`);
    queryParams.push(status);
    pIdx++;
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) FROM secretariat_outgoing_letters WHERE ${whereClause}`,
    queryParams,
    { label: 'secretariat.outgoing.count' }
  );
  const total = parseInt(countRes.rows[0]?.count || '0', 10);

  const dataQuery = `
    SELECT 
      id,
      letter_number,
      category_code,
      category_label,
      TO_CHAR(letter_date, 'YYYY-MM-DD') as letter_date,
      subject,
      recipient,
      recipient_address,
      signer_name,
      signer_position,
      attachment_count,
      content_summary,
      file_url,
      status,
      created_at,
      updated_at
    FROM secretariat_outgoing_letters
    WHERE ${whereClause}
    ORDER BY letter_date DESC, created_at DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;

  const dataRes = await query(dataQuery, [...queryParams, limit, offset], {
    label: 'secretariat.outgoing.list',
  });

  return { rows: dataRes.rows, total };
}

export async function createOutgoingLetter(userId: string | null, input: CreateOutgoingLetterInput) {
  const data = validate(createOutgoingLetterSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const lDate = data.letter_date ? new Date(data.letter_date) : new Date();
    const catCode = data.category_code || 'SK';

    let finalLetterNumber = data.letter_number ? String(data.letter_number).trim() : '';

    if (!finalLetterNumber || finalLetterNumber.toUpperCase() === 'AUTO') {
      const configRow = await client.query(`
        SELECT metadata FROM system_lookups 
        WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
        FOR UPDATE
      `);

      const config: LetterConfig = {
        ...DEFAULT_CONFIG,
        ...(configRow.rows[0]?.metadata || {}),
      };

      let counter = Number(config.counter) || 1;
      const targetYear = lDate.getFullYear();
      const lastYear = config.lastYear || targetYear;

      if (config.resetPeriod === 'YEARLY' && targetYear !== lastYear) {
        counter = 1;
      }

      finalLetterNumber = formatLetterNumber(
        config.pattern,
        config.prefix,
        catCode,
        lDate,
        counter,
        config.padding
      );

      const nextCounter = counter + 1;
      const updatedMeta: LetterConfig = {
        ...config,
        counter: nextCounter,
        lastYear: targetYear,
        lastMonth: lDate.getMonth() + 1,
      };

      await client.query(`
        UPDATE system_lookups
        SET metadata = $1::jsonb
        WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
      `, [JSON.stringify(updatedMeta)]);
    }

    const checkExists = await client.query(`
      SELECT id FROM secretariat_outgoing_letters WHERE letter_number = $1
    `, [finalLetterNumber]);

    if (checkExists.rows.length > 0) {
      throw conflict(`Nomor surat '${finalLetterNumber}' sudah pernah digunakan. Silakan periksa kembali atau generate nomor baru.`);
    }

    const insertQuery = `
      INSERT INTO secretariat_outgoing_letters (
        letter_number,
        category_code,
        category_label,
        letter_date,
        subject,
        recipient,
        recipient_address,
        signer_name,
        signer_position,
        attachment_count,
        content_summary,
        file_url,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const insertRes = await client.query(insertQuery, [
      finalLetterNumber,
      catCode,
      data.category_label || catCode,
      lDate,
      data.subject.trim(),
      data.recipient.trim(),
      data.recipient_address ? data.recipient_address.trim() : null,
      data.signer_name.trim(),
      data.signer_position ? data.signer_position.trim() : 'Ketua Pengurus Yayasan',
      data.attachment_count || '-',
      data.content_summary || null,
      data.file_url || null,
      data.status || 'TERKIRIM',
      userId,
    ]);

    await client.query('COMMIT');
    return { finalLetterNumber, letter: insertRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getOutgoingLetterById(id: string) {
  const result = await query(
    `SELECT 
      id,
      letter_number,
      category_code,
      category_label,
      TO_CHAR(letter_date, 'YYYY-MM-DD') as letter_date,
      subject,
      recipient,
      recipient_address,
      signer_name,
      signer_position,
      attachment_count,
      content_summary,
      file_url,
      status,
      created_at,
      updated_at
    FROM secretariat_outgoing_letters
    WHERE id = $1`,
    [id],
    { label: 'secretariat.outgoing.getOne' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat keluar tidak ditemukan.');
  }

  return result.rows[0];
}

export async function updateOutgoingLetter(id: string, input: UpdateOutgoingLetterInput) {
  const data = validate(updateOutgoingLetterSchema, input);

  const updateQuery = `
    UPDATE secretariat_outgoing_letters
    SET 
      category_code = COALESCE($1, category_code),
      category_label = COALESCE($2, category_label),
      letter_date = COALESCE($3, letter_date),
      subject = COALESCE($4, subject),
      recipient = COALESCE($5, recipient),
      recipient_address = COALESCE($6, recipient_address),
      signer_name = COALESCE($7, signer_name),
      signer_position = COALESCE($8, signer_position),
      attachment_count = COALESCE($9, attachment_count),
      content_summary = COALESCE($10, content_summary),
      file_url = COALESCE($11, file_url),
      status = COALESCE($12, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING *
  `;

  const result = await query(
    updateQuery,
    [
      data.category_code,
      data.category_label,
      data.letter_date ? new Date(data.letter_date) : null,
      data.subject,
      data.recipient,
      data.recipient_address,
      data.signer_name,
      data.signer_position,
      data.attachment_count,
      data.content_summary,
      data.file_url,
      data.status,
      id,
    ],
    { label: 'secretariat.outgoing.update' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat keluar tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteOutgoingLetter(id: string) {
  const result = await query(
    `DELETE FROM secretariat_outgoing_letters WHERE id = $1 RETURNING letter_number`,
    [id],
    { label: 'secretariat.outgoing.delete' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat keluar tidak ditemukan.');
  }

  return { letter_number: result.rows[0].letter_number };
}

// ============================================================================
// 4. INCOMING LETTERS
// ============================================================================
export interface ListIncomingParams {
  search?: string;
  status?: string;
  disposition_to?: string;
  limit: number;
  offset: number;
}

export async function listIncomingLetters(params: ListIncomingParams) {
  const { search, status, disposition_to, limit, offset } = params;
  const conditions: string[] = ['1=1'];
  const queryParams: any[] = [];
  let pIdx = 1;

  if (search) {
    conditions.push(`(
      agenda_number ILIKE $${pIdx} OR 
      sender_letter_number ILIKE $${pIdx} OR 
      sender_name ILIKE $${pIdx} OR 
      sender_institution ILIKE $${pIdx} OR 
      subject ILIKE $${pIdx}
    )`);
    queryParams.push(`%${search}%`);
    pIdx++;
  }

  if (status) {
    conditions.push(`status = $${pIdx}`);
    queryParams.push(status);
    pIdx++;
  }

  if (disposition_to) {
    conditions.push(`disposition_to ILIKE $${pIdx}`);
    queryParams.push(`%${disposition_to}%`);
    pIdx++;
  }

  const whereClause = conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) FROM secretariat_incoming_letters WHERE ${whereClause}`,
    queryParams,
    { label: 'secretariat.incoming.count' }
  );
  const total = parseInt(countRes.rows[0]?.count || '0', 10);

  const dataQuery = `
    SELECT 
      id,
      agenda_number,
      sender_letter_number,
      sender_name,
      sender_institution,
      subject,
      TO_CHAR(letter_date, 'YYYY-MM-DD') as letter_date,
      TO_CHAR(received_date, 'YYYY-MM-DD') as received_date,
      disposition_to,
      disposition_notes,
      status,
      file_url,
      created_at,
      updated_at
    FROM secretariat_incoming_letters
    WHERE ${whereClause}
    ORDER BY received_date DESC, created_at DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `;

  const dataRes = await query(dataQuery, [...queryParams, limit, offset], {
    label: 'secretariat.incoming.list',
  });

  return { rows: dataRes.rows, total };
}

export async function createIncomingLetter(userId: string | null, input: CreateIncomingLetterInput) {
  const data = validate(createIncomingLetterSchema, input);
  const lDate = data.letter_date ? new Date(data.letter_date) : new Date();
  const rDate = data.received_date ? new Date(data.received_date) : new Date();
  const currentYear = rDate.getFullYear();

  let finalAgenda = data.agenda_number ? String(data.agenda_number).trim() : '';

  if (!finalAgenda || finalAgenda.toUpperCase() === 'AUTO') {
    const yearCount = await query(
      `SELECT COUNT(*) FROM secretariat_incoming_letters 
       WHERE EXTRACT(YEAR FROM received_date) = $1`,
      [currentYear],
      { label: 'secretariat.incoming.countForAgenda' }
    );
    const nextSeq = parseInt(yearCount.rows[0]?.count || '0', 10) + 1;
    finalAgenda = `AG-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
  }

  const checkExists = await query(
    `SELECT id FROM secretariat_incoming_letters WHERE agenda_number = $1`,
    [finalAgenda],
    { label: 'secretariat.incoming.checkUniq' }
  );

  if (checkExists.rows.length > 0) {
    throw conflict(`Nomor agenda '${finalAgenda}' sudah digunakan. Silakan gunakan nomor lain.`);
  }

  const insertQuery = `
    INSERT INTO secretariat_incoming_letters (
      agenda_number,
      sender_letter_number,
      sender_name,
      sender_institution,
      subject,
      letter_date,
      received_date,
      disposition_to,
      disposition_notes,
      file_url,
      status,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const insertRes = await query(
    insertQuery,
    [
      finalAgenda,
      data.sender_letter_number.trim(),
      data.sender_name.trim(),
      data.sender_institution ? data.sender_institution.trim() : null,
      data.subject.trim(),
      lDate,
      rDate,
      data.disposition_to ? data.disposition_to.trim() : null,
      data.disposition_notes ? data.disposition_notes.trim() : null,
      data.file_url || null,
      data.status || 'DITERIMA',
      userId,
    ],
    { label: 'secretariat.incoming.create' }
  );

  return { finalAgenda, letter: insertRes.rows[0] };
}

export async function getIncomingLetterById(id: string) {
  const result = await query(
    `SELECT 
      id,
      agenda_number,
      sender_letter_number,
      sender_name,
      sender_institution,
      subject,
      TO_CHAR(letter_date, 'YYYY-MM-DD') as letter_date,
      TO_CHAR(received_date, 'YYYY-MM-DD') as received_date,
      disposition_to,
      disposition_notes,
      file_url,
      status,
      created_at,
      updated_at
    FROM secretariat_incoming_letters
    WHERE id = $1`,
    [id],
    { label: 'secretariat.incoming.getOne' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat masuk tidak ditemukan.');
  }

  return result.rows[0];
}

export async function updateIncomingLetter(id: string, input: UpdateIncomingLetterInput) {
  const data = validate(updateIncomingLetterSchema, input);

  const updateQuery = `
    UPDATE secretariat_incoming_letters
    SET 
      sender_letter_number = COALESCE($1, sender_letter_number),
      sender_name = COALESCE($2, sender_name),
      sender_institution = COALESCE($3, sender_institution),
      subject = COALESCE($4, subject),
      letter_date = COALESCE($5, letter_date),
      received_date = COALESCE($6, received_date),
      disposition_to = COALESCE($7, disposition_to),
      disposition_notes = COALESCE($8, disposition_notes),
      file_url = COALESCE($9, file_url),
      status = COALESCE($10, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *
  `;

  const result = await query(
    updateQuery,
    [
      data.sender_letter_number,
      data.sender_name,
      data.sender_institution,
      data.subject,
      data.letter_date ? new Date(data.letter_date) : null,
      data.received_date ? new Date(data.received_date) : null,
      data.disposition_to,
      data.disposition_notes,
      data.file_url,
      data.status,
      id,
    ],
    { label: 'secretariat.incoming.update' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat masuk tidak ditemukan.');
  }

  return result.rows[0];
}

export async function deleteIncomingLetter(id: string) {
  const result = await query(
    `DELETE FROM secretariat_incoming_letters WHERE id = $1 RETURNING agenda_number`,
    [id],
    { label: 'secretariat.incoming.delete' }
  );

  if (result.rows.length === 0) {
    throw notFound('Data surat masuk tidak ditemukan.');
  }

  return { agenda_number: result.rows[0].agenda_number };
}
