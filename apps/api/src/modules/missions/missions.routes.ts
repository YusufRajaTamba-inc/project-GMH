import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../middleware/audit.interceptor.js';

const router = Router();

// Protect all mission routes
router.use(authenticateJwt);

// GET /api/v1/missions - List all mission activities
router.get('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    let query = `SELECT * FROM mission_activities WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR coordinator ILIKE $${params.length} OR location ILIKE $${params.length} OR theme ILIKE $${params.length})`;
    }

    query += ` ORDER BY event_date DESC, created_at DESC`;
    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      activities: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar kegiatan misi.', error: err.message });
  }
});

// GET /api/v1/missions/:id - Get single mission activity detail
router.get('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM mission_activities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen kegiatan misi tidak ditemukan.' });
      return;
    }
    res.status(200).json({ success: true, activity: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail kegiatan.', error: err.message });
  }
});

// POST /api/v1/missions - Create new mission activity ("Rintis Dokumen Kegiatan Baru")
router.post('/', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      theme,
      budgetEstimate,
      coordinator,
      location,
      eventDate,
      startTime,
      endTime,
      timePreview,
      description,
      mediaDriveUrl,
      documentDriveUrl,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Nama kegiatan / agenda resmi wajib diisi.' });
      return;
    }

    const newId = `ACT-${Date.now()}`;
    const initialTransactions = [
      {
        id: `trx-${Date.now()}`,
        date: eventDate || new Date().toISOString().slice(0, 10),
        type: 'IN',
        category: 'Pembukaan Kantong Kas',
        description: 'Pembukaan kantong kas kegiatan mandiri baru oleh staf.',
        amount: 0,
      },
    ];

    const insertRes = await db.query(
      `INSERT INTO mission_activities (
        id, title, theme, budget_estimate, coordinator, location,
        event_date, start_time, end_time, time_preview, description,
        media_drive_url, document_drive_url, status, cash_balance,
        transactions, rundown, tasks, committees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        newId,
        title.trim(),
        theme ? theme.trim() : '',
        parseFloat(budgetEstimate) || 0,
        coordinator ? coordinator.trim() : 'Belum diatur',
        location ? location.trim() : 'Belum diatur',
        eventDate || null,
        startTime || null,
        endTime || null,
        timePreview || '',
        description || '',
        mediaDriveUrl || '',
        documentDriveUrl || '',
        'ON_PROGRESS',
        0,
        JSON.stringify(initialTransactions),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
      ]
    );

    const created = insertRes.rows[0];
    await logAudit(req.user?.id || null, 'INSERT', 'mission_activities', created.id, null, created);

    res.status(201).json({
      success: true,
      message: `Dokumen kegiatan "${created.title}" berhasil dirintis!`,
      activity: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal merintis kegiatan baru.', error: err.message });
  }
});

// PUT /api/v1/missions/:id - Update activity basic details
router.put('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      theme,
      budgetEstimate,
      coordinator,
      location,
      eventDate,
      startTime,
      endTime,
      timePreview,
      description,
      mediaDriveUrl,
      documentDriveUrl,
      status,
    } = req.body;

    const check = await db.query('SELECT * FROM mission_activities WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      return;
    }

    const old = check.rows[0];
    const updateRes = await db.query(
      `UPDATE mission_activities
       SET title = COALESCE($1, title),
           theme = COALESCE($2, theme),
           budget_estimate = COALESCE($3, budget_estimate),
           coordinator = COALESCE($4, coordinator),
           location = COALESCE($5, location),
           event_date = COALESCE($6, event_date),
           start_time = COALESCE($7, start_time),
           end_time = COALESCE($8, end_time),
           time_preview = COALESCE($9, time_preview),
           description = COALESCE($10, description),
           media_drive_url = COALESCE($11, media_drive_url),
           document_drive_url = COALESCE($12, document_drive_url),
           status = COALESCE($13, status)
       WHERE id = $14
       RETURNING *`,
      [
        title ? title.trim() : null,
        theme !== undefined ? theme.trim() : null,
        budgetEstimate !== undefined ? parseFloat(budgetEstimate) : null,
        coordinator !== undefined ? coordinator.trim() : null,
        location !== undefined ? location.trim() : null,
        eventDate || null,
        startTime || null,
        endTime || null,
        timePreview || null,
        description !== undefined ? description : null,
        mediaDriveUrl !== undefined ? mediaDriveUrl : null,
        documentDriveUrl !== undefined ? documentDriveUrl : null,
        status || null,
        id,
      ]
    );

    const updated = updateRes.rows[0];
    await logAudit(req.user?.id || null, 'UPDATE', 'mission_activities', id, old, updated);

    res.status(200).json({
      success: true,
      message: 'Rincian kegiatan berhasil diperbarui.',
      activity: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rincian kegiatan.', error: err.message });
  }
});

// POST /api/v1/missions/:id/transactions - Record independent cash transaction
router.post('/:id/transactions', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, category, description, amount, date, transferType, isSubsidiTransfer } = req.body;

    if (!type || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Tipe transaksi dan jumlah nominal valid wajib diisi.' });
      return;
    }

    const check = await db.query('SELECT * FROM mission_activities WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      return;
    }

    const activity = check.rows[0];
    const transactions = Array.isArray(activity.transactions) ? activity.transactions : [];

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

    // Two-way integration with central foundation ledger (financial_transactions)
    if (isAmbilSubsidi) {
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const countRes = await db.query(
        `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
        [`TX-GMH-${yearMonth}-%`]
      );
      const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
      centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

      const txDate = date || new Date().toISOString().split('T')[0];
      const notes = `[Subsidi Kas Yayasan] Kegiatan Misi: ${activity.title}${description ? ` - ${description}` : ''}`;

      await db.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          centralTxCode,
          txDate,
          'EXPENSE',
          '5-2010', // Beban Operasional / Program Pelayanan Misi
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
      const notes = `[Setor Sisa Kas Kegiatan] Misi: ${activity.title}${description ? ` - ${description}` : ''}`;

      await db.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          centralTxCode,
          txDate,
          'INCOME',
          '4-1010', // Penerimaan Pengembalian Sisa Operasional Yayasan
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

    // Recalculate independent cash balance
    const newBalance = updatedTransactions.reduce((acc: number, t: any) => {
      const val = parseFloat(t.amount) || 0;
      return t.type === 'IN' ? acc + val : acc - val;
    }, 0);

    const updateRes = await db.query(
      `UPDATE mission_activities
       SET transactions = $1::jsonb,
           cash_balance = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(updatedTransactions), newBalance, id]
    );

    await logAudit(req.user?.id || null, 'MISSION_CASH_CREATE', 'mission_activities', id, null, {
      transaction: newTrx, centralTxCode, cashBalance: updateRes.rows[0]?.cash_balance,
    }, req.ip, req.headers['user-agent']);
    if (centralTxCode) {
      await logAudit(req.user?.id || null, 'INSERT', 'financial_transactions', centralTxCode, null, {
        transaction_code: centralTxCode, amount: newTrx.amount, type: newTrx.type,
        category: newTrx.category, description: newTrx.description, missionActivityId: id,
      }, req.ip, req.headers['user-agent']);
    }

    res.status(201).json({
      success: true,
      message: 'Transaksi kas kegiatan berhasil dicatat ke jurnal mandiri.',
      activity: updateRes.rows[0],
      transaction: newTrx,
      centralTxCode,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mencatat transaksi kas kegiatan.', error: err.message });
  }
});

// DELETE /api/v1/missions/:id/transactions/:trxId - Remove transaction from cash ledger
router.delete('/:id/transactions/:trxId', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, trxId } = req.params;

    const check = await db.query('SELECT * FROM mission_activities WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      return;
    }

    const activity = check.rows[0];
    const existingTransactions = Array.isArray(activity.transactions) ? activity.transactions : [];

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
      `UPDATE mission_activities
       SET transactions = $1::jsonb,
           cash_balance = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(transactions), newBalance, id]
    );

    if (targetTrx) {
      await logAudit(req.user?.id || null, 'MISSION_CASH_DELETE', 'mission_activities', id,
        { transaction: targetTrx, centralTxCode: targetTrx.central_tx_code || null },
        { cashBalance: updateRes.rows[0]?.cash_balance }, req.ip, req.headers['user-agent']);
      if (targetTrx.central_tx_code) {
        await logAudit(req.user?.id || null, 'DELETE', 'financial_transactions', targetTrx.central_tx_code,
          { transaction_code: targetTrx.central_tx_code, amount: targetTrx.amount, description: targetTrx.description },
          null, req.ip, req.headers['user-agent']);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Transaksi kas berhasil dihapus.',
      activity: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.', error: err.message });
  }
});

// PUT /api/v1/missions/:id/rundown - Update rundown agenda
router.put('/:id/rundown', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rundown } = req.body;

    const updateRes = await db.query(
      `UPDATE mission_activities
       SET rundown = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(rundown || []), id]
    );

    res.status(200).json({ success: true, activity: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui rundown.', error: err.message });
  }
});

// PUT /api/v1/missions/:id/tasks - Update tasks checklist
router.put('/:id/tasks', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tasks } = req.body;

    const updateRes = await db.query(
      `UPDATE mission_activities
       SET tasks = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(tasks || []), id]
    );

    res.status(200).json({ success: true, activity: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui tugas persiapan.', error: err.message });
  }
});

// PUT /api/v1/missions/:id/committees - Update committee list
router.put('/:id/committees', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { committees } = req.body;

    const updateRes = await db.query(
      `UPDATE mission_activities
       SET committees = $1::jsonb
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(committees || []), id]
    );

    res.status(200).json({ success: true, activity: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui panitia acara.', error: err.message });
  }
});

// PUT /api/v1/missions/:id/status - Toggle status (ON_PROGRESS / COMPLETED)
router.put('/:id/status', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateRes = await db.query(
      `UPDATE mission_activities
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status || 'COMPLETED', id]
    );

    res.status(200).json({
      success: true,
      message: `Status kegiatan berhasil diubah menjadi ${status}.`,
      activity: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status.', error: err.message });
  }
});

// DELETE /api/v1/missions/:id - Delete activity
router.delete('/:id', authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Reject deletion if activity is already COMPLETED
    const check = await db.query('SELECT status FROM mission_activities WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      return;
    }

    if (check.rows[0].status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Kegiatan misi yang telah berstatus Selesai / Rampung LPJ tidak dapat dihapus demi integritas arsip yayasan.',
      });
      return;
    }

    await db.query('DELETE FROM mission_activities WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Dokumen kegiatan misi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus kegiatan.', error: err.message });
  }
});

export default router;
