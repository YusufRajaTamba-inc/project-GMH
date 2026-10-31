import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

// Standard Roman Month mapping
const ROMAN_MONTHS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
  7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
};

interface LetterConfig {
  pattern: string;
  prefix: string;
  padding: number;
  counter: number;
  resetPeriod: string;
  lastYear?: number;
  lastMonth?: number;
}

const DEFAULT_CONFIG: LetterConfig = {
  pattern: '{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}',
  prefix: 'GMH-PAKMK',
  padding: 3,
  counter: 1,
  resetPeriod: 'YEARLY',
  lastYear: 2026,
  lastMonth: 10,
};

function formatLetterNumber(
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
router.get('/stats', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();

    const [outgoingStats, incomingStats] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN EXTRACT(YEAR FROM letter_date) = $1 THEN 1 END) as this_year,
          COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as drafts
        FROM secretariat_outgoing_letters
      `, [currentYear]),
      db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN EXTRACT(YEAR FROM received_date) = $1 THEN 1 END) as this_year,
          COUNT(CASE WHEN status = 'DITERIMA' OR status = 'DIDISPOSISIKAN' THEN 1 END) as pending_disposition
        FROM secretariat_incoming_letters
      `, [currentYear]),
    ]);

    res.status(200).json({
      success: true,
      data: {
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
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat statistik persuratan.', error: err.message });
  }
});

// ============================================================================
// 2. NUMBERING CONFIGURATION & PREVIEW (SETUP DINAMIS DI SISTEM UTILITY)
// ============================================================================
router.get('/numbering-config', authenticateJwt, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [formatRow, categoriesRes] = await Promise.all([
      db.query(`
        SELECT id, category, code, label, metadata 
        FROM system_lookups 
        WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
      `),
      db.query(`
        SELECT id, code, label, sort_order, is_active
        FROM system_lookups
        WHERE category = 'LETTER_CATEGORY' AND is_active = TRUE
        ORDER BY sort_order ASC, label ASC
      `),
    ]);

    const config: LetterConfig = {
      ...DEFAULT_CONFIG,
      ...(formatRow.rows[0]?.metadata || {}),
    };

    // Generate preview
    const samplePreview = formatLetterNumber(
      config.pattern,
      config.prefix,
      'SK',
      new Date(),
      config.counter,
      config.padding
    );

    res.status(200).json({
      success: true,
      config,
      preview: samplePreview,
      categories: categoriesRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat konfigurasi penomoran surat.', error: err.message });
  }
});

router.put('/numbering-config', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { pattern, prefix, padding, counter, resetPeriod } = req.body;

    const existingRow = await db.query(`
      SELECT id, metadata FROM system_lookups 
      WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
    `);

    const currentMeta: LetterConfig = {
      ...DEFAULT_CONFIG,
      ...(existingRow.rows[0]?.metadata || {}),
    };

    const updatedMeta: LetterConfig = {
      ...currentMeta,
      pattern: pattern !== undefined ? String(pattern).trim() : currentMeta.pattern,
      prefix: prefix !== undefined ? String(prefix).trim() : currentMeta.prefix,
      padding: padding !== undefined ? Number(padding) : currentMeta.padding,
      counter: counter !== undefined ? Number(counter) : currentMeta.counter,
      resetPeriod: resetPeriod !== undefined ? String(resetPeriod) : currentMeta.resetPeriod,
      lastYear: currentMeta.lastYear || new Date().getFullYear(),
      lastMonth: currentMeta.lastMonth || (new Date().getMonth() + 1),
    };

    if (existingRow.rows.length === 0) {
      await db.query(`
        INSERT INTO system_lookups (category, code, label, sort_order, is_active, metadata)
        VALUES ('LETTER_FORMAT', 'OUTGOING_PATTERN', 'Format Penomoran Surat Keluar', 1, TRUE, $1::jsonb)
      `, [JSON.stringify(updatedMeta)]);
    } else {
      await db.query(`
        UPDATE system_lookups
        SET metadata = $1::jsonb, updated_at = CURRENT_TIMESTAMP
        WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
      `, [JSON.stringify(updatedMeta)]);
    }

    const preview = formatLetterNumber(
      updatedMeta.pattern,
      updatedMeta.prefix,
      'SK',
      new Date(),
      updatedMeta.counter,
      updatedMeta.padding
    );

    res.status(200).json({
      success: true,
      message: 'Konfigurasi penomoran surat berhasil diperbarui.',
      config: updatedMeta,
      preview,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui konfigurasi penomoran surat.', error: err.message });
  }
});

// Preview next generated letter number
router.get('/outgoing/next-number', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const category = (req.query.category as string) || 'SK';
    const rawDate = req.query.date as string;
    const date = rawDate ? new Date(rawDate) : new Date();

    const formatRow = await db.query(`
      SELECT metadata FROM system_lookups 
      WHERE category = 'LETTER_FORMAT' AND code = 'OUTGOING_PATTERN'
    `);

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
      category,
      date,
      nextCounter,
      config.padding
    );

    res.status(200).json({
      success: true,
      nextNumber,
      counter: nextCounter,
      pattern: config.pattern,
      prefix: config.prefix,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghasilkan nomor surat otomatis.', error: err.message });
  }
});

// ============================================================================
// 3. SURAT KELUAR (OUTGOING LETTERS)
// ============================================================================
router.get('/outgoing', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, status } = req.query;
    const { limit, offset, page } = parsePagination(req);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        letter_number ILIKE $${pIdx} OR 
        subject ILIKE $${pIdx} OR 
        recipient ILIKE $${pIdx} OR 
        signer_name ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (category) {
      conditions.push(`category_code = $${pIdx}`);
      params.push(category);
      pIdx++;
    }

    if (status) {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) FROM secretariat_outgoing_letters WHERE ${whereClause}`;
    const countRes = await db.query(countQuery, params);
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

    const dataRes = await db.query(dataQuery, [...params, limit, offset]);

    res.status(200).json({
      success: true,
      letters: dataRes.rows,
      meta: formatPaginationMeta(dataRes.rows, total, page, limit),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat data surat keluar.', error: err.message });
  }
});

// Buat Surat Keluar (dengan auto number generator & atomic counter increment)
router.post('/outgoing', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const {
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
    } = req.body;

    if (!subject || !recipient || !signer_name) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'Perihal, Tujuan/Penerima, dan Penandatangan wajib diisi.',
      });
      return;
    }

    const lDate = letter_date ? new Date(letter_date) : new Date();
    const catCode = category_code || 'SK';

    let finalLetterNumber = letter_number ? String(letter_number).trim() : '';

    // Atomic auto numbering if not provided or set to 'AUTO'
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

      // Increment counter and update system_lookups
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

    // Check unique letter_number
    const checkExists = await client.query(`
      SELECT id FROM secretariat_outgoing_letters WHERE letter_number = $1
    `, [finalLetterNumber]);

    if (checkExists.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: `Nomor surat '${finalLetterNumber}' sudah pernah digunakan. Silakan periksa kembali atau generate nomor baru.`,
      });
      return;
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
      category_label || catCode,
      lDate,
      subject.trim(),
      recipient.trim(),
      recipient_address ? recipient_address.trim() : null,
      signer_name.trim(),
      signer_position ? signer_position.trim() : 'Ketua Pengurus Yayasan',
      attachment_count || '-',
      content_summary || null,
      file_url || null,
      status || 'TERKIRIM',
      (req as any).user?.id || null,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Surat keluar dengan nomor '${finalLetterNumber}' berhasil dibuat.`,
      letter: insertRes.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal membuat surat keluar.', error: err.message });
  } finally {
    client.release();
  }
});

router.get('/outgoing/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`
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
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat keluar tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, letter: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail surat keluar.', error: err.message });
  }
});

router.put('/outgoing/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
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
    } = req.body;

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

    const result = await db.query(updateQuery, [
      category_code,
      category_label,
      letter_date ? new Date(letter_date) : null,
      subject,
      recipient,
      recipient_address,
      signer_name,
      signer_position,
      attachment_count,
      content_summary,
      file_url,
      status,
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat keluar tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data surat keluar berhasil diperbarui.',
      letter: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui surat keluar.', error: err.message });
  }
});

router.delete('/outgoing/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      DELETE FROM secretariat_outgoing_letters WHERE id = $1 RETURNING letter_number
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat keluar tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Surat keluar '${result.rows[0].letter_number}' berhasil dihapus.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus surat keluar.', error: err.message });
  }
});

// ============================================================================
// 4. SURAT MASUK (INCOMING LETTERS)
// ============================================================================
router.get('/incoming', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, disposition_to } = req.query;
    const { limit, offset, page } = parsePagination(req);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        agenda_number ILIKE $${pIdx} OR 
        sender_letter_number ILIKE $${pIdx} OR 
        sender_name ILIKE $${pIdx} OR 
        sender_institution ILIKE $${pIdx} OR 
        subject ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (status) {
      conditions.push(`status = $${pIdx}`);
      params.push(status);
      pIdx++;
    }

    if (disposition_to) {
      conditions.push(`disposition_to ILIKE $${pIdx}`);
      params.push(`%${disposition_to}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) FROM secretariat_incoming_letters WHERE ${whereClause}`;
    const countRes = await db.query(countQuery, params);
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

    const dataRes = await db.query(dataQuery, [...params, limit, offset]);

    res.status(200).json({
      success: true,
      letters: dataRes.rows,
      meta: formatPaginationMeta(dataRes.rows, total, page, limit),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat data surat masuk.', error: err.message });
  }
});

// Catat Surat Masuk
router.post('/incoming', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
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
    } = req.body;

    if (!sender_letter_number || !sender_name || !subject) {
      res.status(400).json({
        success: false,
        message: 'Nomor Surat Asal, Pengirim, dan Perihal wajib diisi.',
      });
      return;
    }

    const lDate = letter_date ? new Date(letter_date) : new Date();
    const rDate = received_date ? new Date(received_date) : new Date();
    const currentYear = rDate.getFullYear();

    let finalAgenda = agenda_number ? String(agenda_number).trim() : '';

    if (!finalAgenda || finalAgenda.toUpperCase() === 'AUTO') {
      const yearCount = await db.query(`
        SELECT COUNT(*) FROM secretariat_incoming_letters 
        WHERE EXTRACT(YEAR FROM received_date) = $1
      `, [currentYear]);
      const nextSeq = parseInt(yearCount.rows[0]?.count || '0', 10) + 1;
      finalAgenda = `AG-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
    }

    // Check unique agenda_number
    const checkExists = await db.query(`
      SELECT id FROM secretariat_incoming_letters WHERE agenda_number = $1
    `, [finalAgenda]);

    if (checkExists.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: `Nomor agenda '${finalAgenda}' sudah digunakan. Silakan gunakan nomor lain.`,
      });
      return;
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

    const insertRes = await db.query(insertQuery, [
      finalAgenda,
      sender_letter_number.trim(),
      sender_name.trim(),
      sender_institution ? sender_institution.trim() : null,
      subject.trim(),
      lDate,
      rDate,
      disposition_to ? disposition_to.trim() : null,
      disposition_notes ? disposition_notes.trim() : null,
      file_url || null,
      status || 'DITERIMA',
      (req as any).user?.id || null,
    ]);

    res.status(201).json({
      success: true,
      message: `Surat masuk dengan agenda '${finalAgenda}' berhasil dicatat.`,
      letter: insertRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mencatat surat masuk.', error: err.message });
  }
});

router.get('/incoming/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`
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
        file_url,
        status,
        created_at,
        updated_at
      FROM secretariat_incoming_letters
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat masuk tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, letter: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat detail surat masuk.', error: err.message });
  }
});

router.put('/incoming/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
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
    } = req.body;

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

    const result = await db.query(updateQuery, [
      sender_letter_number,
      sender_name,
      sender_institution,
      subject,
      letter_date ? new Date(letter_date) : null,
      received_date ? new Date(received_date) : null,
      disposition_to,
      disposition_notes,
      file_url,
      status,
      id,
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat masuk tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Data surat masuk berhasil diperbarui.',
      letter: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui surat masuk.', error: err.message });
  }
});

router.delete('/incoming/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      DELETE FROM secretariat_incoming_letters WHERE id = $1 RETURNING agenda_number
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data surat masuk tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Surat masuk dengan agenda '${result.rows[0].agenda_number}' berhasil dihapus.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus surat masuk.', error: err.message });
  }
});

export default router;
