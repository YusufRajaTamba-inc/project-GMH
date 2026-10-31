import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

// Protect all program routes
router.use(authenticateJwt);

// GET /api/v1/programs - List all programs
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 50, maxLimit: 100 });
    const { category, search, status } = req.query;

    let whereConditions: string[] = [];
    const params: any[] = [];

    if (cursor) {
      params.push(cursor);
      whereConditions.push(`event_datetime > $${params.length}`);
    }

    if (category) {
      params.push(category);
      whereConditions.push(`program_category = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereConditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(
        `(program_title ILIKE $${params.length} OR theme ILIKE $${params.length} OR location ILIKE $${params.length} OR speaker_name ILIKE $${params.length})`
      );
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*)::int as total FROM foundation_programs ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    let dataQuery = `SELECT * FROM foundation_programs ${whereClause} ORDER BY event_datetime ASC, created_at DESC`;
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

    const result = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'event_datetime');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      programs: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat jadwal program.', error: err.message });
  }
});

// GET /api/v1/programs/:id - Get single program detail
router.get('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM foundation_programs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Program kegiatan tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, program: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail program.', error: err.message });
  }
});

// POST /api/v1/programs - Create new program
router.post('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      programTitle,
      programCategory,
      eventDatetime,
      location,
      theme,
      speakerName,
      budgetEstimate,
      description,
      mediaDriveUrl,
      documentDriveUrl,
    } = req.body;

    if (!programTitle || !programTitle.trim() || !eventDatetime) {
      res.status(400).json({ success: false, message: 'Nama program dan waktu pelaksanaan wajib diisi.' });
      return;
    }

    const initialTransactions = [
      {
        id: `trx-${Date.now()}`,
        date: eventDatetime.slice(0, 10),
        type: 'IN',
        category: 'Pembukaan Kantong Kas',
        description: 'Pembukaan kantong kas program mandiri oleh staf.',
        amount: 0,
      },
    ];

    const result = await db.query(
      `INSERT INTO foundation_programs (
        program_title, program_category, event_datetime, location,
        theme, speaker_name, budget_estimate, cash_balance, status,
        description, media_drive_url, document_drive_url,
        transactions, rundown, tasks, committees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        programTitle.trim(),
        programCategory || 'Persekutuan Alumni',
        eventDatetime,
        location ? location.trim() : 'Rumah Persekutuan GMH',
        theme ? theme.trim() : '',
        speakerName ? speakerName.trim() : '',
        parseFloat(budgetEstimate) || 0,
        0,
        'ON_PROGRESS',
        description || '',
        mediaDriveUrl || '',
        documentDriveUrl || '',
        JSON.stringify(initialTransactions),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
      ]
    );

    const created = result.rows[0];
    await logAudit(req.user?.id || null, 'INSERT', 'foundation_programs', created.id, null, created);

    res.status(201).json({
      success: true,
      message: `Program "${created.program_title}" berhasil dibuat!`,
      program: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat program.', error: err.message });
  }
});

// PUT /api/v1/programs/:id - Update program basic details
router.put('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      programTitle,
      programCategory,
      eventDatetime,
      location,
      theme,
      speakerName,
      budgetEstimate,
      description,
      mediaDriveUrl,
      documentDriveUrl,
      status,
    } = req.body;

    const check = await db.query('SELECT * FROM foundation_programs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Program kegiatan tidak ditemukan.' });
      return;
    }

    const old = check.rows[0];
    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET program_title = COALESCE($1, program_title),
           program_category = COALESCE($2, program_category),
           event_datetime = COALESCE($3, event_datetime),
           location = COALESCE($4, location),
           theme = COALESCE($5, theme),
           speaker_name = COALESCE($6, speaker_name),
           budget_estimate = COALESCE($7, budget_estimate),
           description = COALESCE($8, description),
           media_drive_url = COALESCE($9, media_drive_url),
           document_drive_url = COALESCE($10, document_drive_url),
           status = COALESCE($11, status)
       WHERE id = $12
       RETURNING *`,
      [
        programTitle ? programTitle.trim() : null,
        programCategory || null,
        eventDatetime || null,
        location !== undefined ? location.trim() : null,
        theme !== undefined ? theme.trim() : null,
        speakerName !== undefined ? speakerName.trim() : null,
        budgetEstimate !== undefined ? parseFloat(budgetEstimate) : null,
        description !== undefined ? description : null,
        mediaDriveUrl !== undefined ? mediaDriveUrl : null,
        documentDriveUrl !== undefined ? documentDriveUrl : null,
        status || null,
        id,
      ]
    );

    const updated = updateRes.rows[0];
    await logAudit(req.user?.id || null, 'UPDATE', 'foundation_programs', id, old, updated);

    res.status(200).json({
      success: true,
      message: 'Rincian program berhasil diperbarui.',
      program: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rincian program.', error: err.message });
  }
});

// POST /api/v1/programs/:id/transactions - Record independent cash transaction
router.post('/:id/transactions', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, category, description, amount, date, transferType, isSubsidiTransfer } = req.body;

    if (!type || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Tipe transaksi dan nominal valid wajib diisi.' });
      return;
    }

    const check = await db.query('SELECT * FROM foundation_programs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Program tidak ditemukan.' });
      return;
    }

    const program = check.rows[0];
    const transactions = Array.isArray(program.transactions) ? program.transactions : [];

    const isAmbilSubsidi =
      category === 'Subsidi Kas Yayasan' ||
      transferType === 'AMBIL_SUBSIDI' ||
      (isSubsidiTransfer && type === 'IN');

    const isSetorSisa =
      category === 'Setor Sisa Kas ke Yayasan' ||
      transferType === 'SETOR_SISA' ||
      (isSubsidiTransfer && type === 'OUT');

    let centralTxCode: string | null = null;
    const safeUserId =
      req.user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user.id)
        ? req.user.id
        : '31563344-ee08-4252-8cfa-7c1cd41910ca';

    // Integrate with central foundation ledger (financial_transactions)
    if (isAmbilSubsidi) {
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const countRes = await db.query(
        `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
        [`TX-GMH-${yearMonth}-%`]
      );
      const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
      centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

      const txDate = date || new Date().toISOString().split('T')[0];
      const notes = `[Subsidi Kas Yayasan] Program: ${program.program_title}${description ? ` - ${description}` : ''}`;

      await db.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          centralTxCode,
          txDate,
          'EXPENSE',
          '5-2010', // Beban Operasional / Program Yayasan
          parseFloat(amount),
          'CASH',
          'OPERASIONAL',
          notes,
          safeUserId,
        ]
      );
    } else if (isSetorSisa) {
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const countRes = await db.query(
        `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
        [`TX-GMH-${yearMonth}-%`]
      );
      const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
      centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

      const txDate = date || new Date().toISOString().split('T')[0];
      const notes = `[Setor Sisa Kas Program] ${program.program_title}${description ? ` - ${description}` : ''}`;

      await db.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          centralTxCode,
          txDate,
          'INCOME',
          '4-1010', // Pengembalian Sisa Operasional
          parseFloat(amount),
          'CASH',
          'OPERASIONAL',
          notes,
          safeUserId,
        ]
      );
    }

    const newTrx: Record<string, any> = {
      id: `trx-${Date.now()}`,
      date: date || new Date().toISOString().slice(0, 10),
      type: type === 'OUT' ? 'OUT' : 'IN',
      category:
        category ||
        (isAmbilSubsidi
          ? 'Subsidi Kas Yayasan'
          : isSetorSisa
          ? 'Setor Sisa Kas ke Yayasan'
          : type === 'OUT'
          ? 'Beban Operasional'
          : 'Penerimaan Mandiri'),
      description: description || '',
      amount: parseFloat(amount),
    };

    if (centralTxCode) {
      newTrx.central_tx_code = centralTxCode;
    }

    const updatedTransactions = [newTrx, ...transactions];

    const newBalance = updatedTransactions.reduce((acc: number, t: any) => {
      const val = parseFloat(t.amount) || 0;
      return t.type === 'IN' ? acc + val : acc - val;
    }, 0);

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET transactions = $1::jsonb,
           cash_balance = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(updatedTransactions), newBalance, id]
    );

    await logAudit(req.user?.id || null, 'PROGRAM_CASH_CREATE', 'foundation_programs', id, null, {
      transaction: newTrx, centralTxCode, cashBalance: updateRes.rows[0]?.cash_balance,
    }, req.ip, req.headers['user-agent']);
    if (centralTxCode) {
      await logAudit(req.user?.id || null, 'INSERT', 'financial_transactions', centralTxCode, null, {
        transaction_code: centralTxCode, amount: newTrx.amount, type: newTrx.type,
        category: newTrx.category, description: newTrx.description, programId: id,
      }, req.ip, req.headers['user-agent']);
    }

    res.status(201).json({
      success: true,
      message: 'Transaksi kas program berhasil dicatat.',
      program: updateRes.rows[0],
      transaction: newTrx,
      centralTxCode,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mencatat transaksi program.', error: err.message });
  }
});

// DELETE /api/v1/programs/:id/transactions/:trxId - Remove transaction from cash ledger
router.delete('/:id/transactions/:trxId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, trxId } = req.params;

    const check = await db.query('SELECT * FROM foundation_programs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Program tidak ditemukan.' });
      return;
    }

    const program = check.rows[0];
    const existingTransactions = Array.isArray(program.transactions) ? program.transactions : [];

    const targetTrx = existingTransactions.find((t: any) => t.id === trxId);
    if (targetTrx && targetTrx.central_tx_code) {
      const centralTx = await db.query('SELECT * FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code]);
      await db.query('DELETE FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code]);
      await logAudit(req.user?.id || null, 'DELETE', 'financial_transactions', centralTx.rows[0]?.id || targetTrx.central_tx_code,
        centralTx.rows[0] || { transaction_code: targetTrx.central_tx_code }, null, req.ip, req.headers['user-agent']);
    }

    const transactions = existingTransactions.filter((t: any) => t.id !== trxId);

    const newBalance = transactions.reduce((acc: number, t: any) => {
      const val = parseFloat(t.amount) || 0;
      return t.type === 'IN' ? acc + val : acc - val;
    }, 0);

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET transactions = $1::jsonb,
           cash_balance = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(transactions), newBalance, id]
    );

    await logAudit(req.user?.id || null, 'PROGRAM_CASH_DELETE', 'foundation_programs', id,
      { transaction: targetTrx, centralTxCode: targetTrx?.central_tx_code || null },
      { cashBalance: updateRes.rows[0]?.cash_balance }, req.ip, req.headers['user-agent']);

    res.status(200).json({
      success: true,
      message: 'Transaksi kas berhasil dihapus.',
      program: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.', error: err.message });
  }
});

// PUT /api/v1/programs/:id/rundown - Update rundown agenda
router.put('/:id/rundown', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rundown } = req.body;

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET rundown = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(rundown || []), id]
    );

    res.status(200).json({ success: true, program: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rundown.', error: err.message });
  }
});

// PUT /api/v1/programs/:id/tasks - Update tasks checklist
router.put('/:id/tasks', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tasks } = req.body;

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET tasks = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(tasks || []), id]
    );

    res.status(200).json({ success: true, program: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui tugas persiapan.', error: err.message });
  }
});

// PUT /api/v1/programs/:id/committees - Update committee list
router.put('/:id/committees', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { committees } = req.body;

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET committees = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(committees || []), id]
    );

    res.status(200).json({ success: true, program: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui panitia/pelayan acara.', error: err.message });
  }
});

// PUT /api/v1/programs/:id/status - Toggle status (ON_PROGRESS / COMPLETED)
router.put('/:id/status', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateRes = await db.query(
      `UPDATE foundation_programs
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status || 'COMPLETED', id]
    );

    res.status(200).json({
      success: true,
      message: `Status program berhasil diubah menjadi ${status}.`,
      program: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status program.', error: err.message });
  }
});

// DELETE /api/v1/programs/:id - Delete program
router.delete('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const check = await db.query('SELECT status FROM foundation_programs WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Program tidak ditemukan.' });
      return;
    }

    if (check.rows[0].status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Program yang telah berstatus Selesai / Rampung LPJ tidak dapat dihapus demi integritas arsip yayasan.',
      });
      return;
    }

    await db.query('DELETE FROM foundation_programs WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Program kegiatan berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus program.', error: err.message });
  }
});

export default router;
