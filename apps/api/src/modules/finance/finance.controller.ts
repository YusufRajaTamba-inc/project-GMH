import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scope, type, accountId } = req.query;
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 15, maxLimit: 100 });

    let whereClause = ` WHERE 1=1`;
    const params: any[] = [];

    // RBAC Scope Filter: If user is BENDAHARA_ADMIN, only allow 'OPERASIONAL'
    if (req.user?.roleId === 'BENDAHARA_ADMIN') {
      params.push('OPERASIONAL');
      whereClause += ` AND ft.scope = $${params.length}`;
    } else if (scope) {
      params.push(scope);
      whereClause += ` AND ft.scope = $${params.length}`;
    }

    if (type) {
      params.push(type);
      whereClause += ` AND ft.transaction_type = $${params.length}`;
    }

    if (accountId) {
      params.push(accountId);
      whereClause += ` AND ft.account_id = $${params.length}`;
    }

    if (cursor) {
      params.push(cursor);
      whereClause += ` AND ft.transaction_date < $${params.length}`;
    }

    // 1. Calculate totals and total row count directly in database engine
    const summaryRes = await db.query(
      `SELECT 
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_income
       FROM financial_transactions ft
       JOIN chart_of_accounts coa ON ft.account_id = coa.id
       ${whereClause}`,
      params
    );

    const total = summaryRes.rows[0]?.total || 0;
    const totalDebit = parseFloat(summaryRes.rows[0]?.total_expense || '0');
    const totalCredit = parseFloat(summaryRes.rows[0]?.total_income || '0');

    // 2. Query paginated records with safe LIMIT & OFFSET
    let dataQuery = `
      SELECT 
        ft.*, 
        coa.account_name, coa.scope as coa_scope,
        u.full_name as recorded_by_name
      FROM financial_transactions ft
      JOIN chart_of_accounts coa ON ft.account_id = coa.id
      LEFT JOIN users u ON ft.recorded_by = u.id
      ${whereClause}
      ORDER BY ft.transaction_date DESC, ft.created_at DESC
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

    const result = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'transaction_date');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      summary: {
        totalExpenseDebit: totalDebit,
        totalIncomeCredit: totalCredit,
        netBalance: totalCredit - totalDebit,
      },
      transactions: result.rows,
      data: result.rows,
      pagination,
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil mutasi kas.', error: err.message });
  }
};


const getSafeUserId = (id?: string | null): string => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return '31563344-ee08-4252-8cfa-7c1cd41910ca';
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      transactionDate,
      transactionType,
      accountId,
      amount,
      paymentMethod,
      scope,
      notes,
    } = req.body;

    if (!accountId || !amount || !transactionType) {
      res.status(400).json({ success: false, message: 'Akun COA, nominal, dan tipe transaksi wajib diisi.' });
      return;
    }

    // RBAC: Bendahara Admin can ONLY record OPERASIONAL
    const effectiveScope = req.user?.roleId === 'BENDAHARA_ADMIN' ? 'OPERASIONAL' : (scope || 'OPERASIONAL');

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await db.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`]
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
    const transactionCode = `TX-GMH-${yearMonth}-${seq}`;

    const safeUserId = getSafeUserId(req.user?.id);

    const insertRes = await db.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        transactionCode,
        transactionDate || new Date().toISOString().split('T')[0],
        transactionType, // 'INCOME' or 'EXPENSE'
        accountId,
        parseFloat(amount),
        paymentMethod || 'BANK_TRANSFER',
        effectiveScope,
        notes || '',
        safeUserId,
      ]
    );

    const newTx = insertRes.rows[0];

    await logAudit(safeUserId, 'INSERT', 'financial_transactions', newTx.id, null, newTx);

    res.status(201).json({
      success: true,
      message: `Transaksi kas ${transactionCode} berhasil dicatat.`,
      transaction: newTx,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mencatat transaksi kas.', error: err.message });
  }
};

export const getChartOfAccounts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT id, account_name, account_type, scope, is_active FROM chart_of_accounts WHERE is_active = TRUE ORDER BY id ASC`
    );
    res.status(200).json({ success: true, accounts: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat Chart of Accounts.', error: err.message });
  }
};

export const getPledgesAndDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    let whereClause = '';
    const params: any[] = [];

    if (cursor) {
      whereClause = ` WHERE p.created_at < $1`;
      params.push(cursor);
    }

    // 1. Total count
    const countRes = await db.query(
      `SELECT COUNT(*)::int as total FROM pledges p ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // 2. Paginated data
    let dataQuery = `
      SELECT 
        p.*, 
        m.full_name as member_name, m.member_number, m.email as member_email, m.phone_number as member_phone,
        bp.project_name,
        (SELECT ft.transaction_code FROM financial_transactions ft WHERE ft.pledge_id = p.id ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 1) as receipt_number,
        (SELECT MAX(ft.transaction_date) FROM financial_transactions ft WHERE ft.pledge_id = p.id) as last_payment_date,
        (SELECT COUNT(*)::int FROM financial_transactions ft WHERE ft.pledge_id = p.id) as installments_count
       FROM pledges p
       LEFT JOIN members m ON p.member_id = m.id
       LEFT JOIN building_projects bp ON p.building_project_id = bp.id
       ${whereClause}
       ORDER BY p.created_at DESC
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

    const pledgesRes = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(pledgesRes.rows, total, page, limit, 'created_at');

    const bpRes = await db.query(`SELECT * FROM building_projects LIMIT 1`);

    res.status(200).json({
      success: true,
      count: pledgesRes.rows.length,
      pledges: pledgesRes.rows,
      donations: pledgesRes.rows,
      data: pledgesRes.rows,
      buildingProject: bpRes.rows[0] || null,
      pagination,
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat data janji iman & donasi.', error: err.message });
  }
};

// Flow 3: Get Pledge Detail with Full Installments History (kapan-kapan orang itu memberikan)
export const getPledgeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pledgeRes = await db.query(
      `SELECT p.*, 
              m.full_name as member_name, m.member_number, m.email as member_email, m.phone_number as member_phone,
              bp.project_name
       FROM pledges p
       LEFT JOIN members m ON p.member_id = m.id
       LEFT JOIN building_projects bp ON p.building_project_id = bp.id
       WHERE p.id = $1`,
      [id]
    );

    if (pledgeRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Data janji iman / donasi tidak ditemukan.' });
      return;
    }

    const pledge = pledgeRes.rows[0];

    // Installments history (kapan-kapan orang itu memberikan!)
    const installmentsRes = await db.query(
      `SELECT ft.id, ft.transaction_code, ft.transaction_date, ft.amount, ft.payment_method, ft.notes, ft.created_at,
              u.full_name as recorded_by_name
       FROM financial_transactions ft
       LEFT JOIN users u ON ft.recorded_by = u.id
       WHERE ft.pledge_id = $1
       ORDER BY ft.transaction_date ASC, ft.created_at ASC`,
      [id]
    );

    // If tied to a member, fetch all other pledges/donations of this member
    let memberAllPledges: any[] = [];
    let memberTotalDonated = 0;
    if (pledge.member_id) {
      const allMemberPledgesRes = await db.query(
        `SELECT p.*, bp.project_name,
                (SELECT COUNT(*)::int FROM financial_transactions ft WHERE ft.pledge_id = p.id) as installments_count,
                (SELECT ft.transaction_code FROM financial_transactions ft WHERE ft.pledge_id = p.id ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 1) as receipt_number
         FROM pledges p
         LEFT JOIN building_projects bp ON p.building_project_id = bp.id
         WHERE p.member_id = $1
         ORDER BY p.created_at DESC`,
        [pledge.member_id]
      );
      memberAllPledges = allMemberPledgesRes.rows;
      memberTotalDonated = memberAllPledges.reduce((sum, p) => sum + Number(p.fulfilled_amount || 0), 0);
    }

    res.status(200).json({
      success: true,
      pledge,
      installments: installmentsRes.rows,
      memberAllPledges,
      memberTotalDonated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat rincian janji iman.', error: err.message });
  }
};

// Flow 3: Create New Pledge / Initial Donation
export const createPledge = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const {
      donorName,
      memberId,
      category,
      type, // 'PLEDGE' or 'DONATION'
      totalAmount,
      initialPayment,
      paymentMethod,
      dueDate,
      notes,
    } = req.body;

    let finalDonorName = donorName;
    if (memberId) {
      const mRes = await client.query(`SELECT full_name FROM members WHERE id = $1`, [memberId]);
      if (mRes.rows.length > 0) {
        finalDonorName = mRes.rows[0].full_name;
      }
    }

    if (!finalDonorName || !totalAmount || parseFloat(totalAmount) <= 0) {
      res.status(400).json({ success: false, message: 'Nama donatur dan total komitmen wajib diisi.' });
      return;
    }

    await client.query('BEGIN');

    const total = parseFloat(totalAmount);
    const initial = parseFloat(initialPayment || '0');
    const pledgeStatus = initial >= total ? 'COMPLETED' : 'ACTIVE';

    // Get building project if category is building
    const isBuilding = (category || '').toLowerCase().includes('pembangunan');
    let buildingProjectId = null;
    if (isBuilding) {
      const bpRes = await client.query(`SELECT id FROM building_projects LIMIT 1`);
      buildingProjectId = bpRes.rows[0]?.id || null;
    }

    // Insert pledge
    const pledgeRes = await client.query(
      `INSERT INTO pledges (
        donor_name, member_id, total_pledge, fulfilled_amount, category, pledge_type, due_date, status, notes, building_project_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        finalDonorName,
        memberId || null,
        total,
        initial,
        category || 'Pembangunan Rumah Persekutuan',
        type || 'PLEDGE',
        dueDate || null,
        pledgeStatus,
        notes || null,
        buildingProjectId,
      ]
    );

    const newPledge = pledgeRes.rows[0];
    let initialReceipt: { receiptNumber: string; donorName: string; category: string; amount: number; date: string; qrCodeValue: string } | null = null;
    let initialTransactionId: string | null = null;

    // If initial payment > 0, record in financial_transactions
    if (initial > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yearMonth = today.slice(0, 7).replace('-', '');
      const countRes = await client.query(
        `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
        [`KWT-GMH-${yearMonth}-%`]
      );
      const receiptNumber = `KWT-GMH-${yearMonth}-${String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0')}`;
      const accountId = isBuilding ? '4-2010' : '4-1010';

      const txRes = await client.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by, donor_member_id, pledge_id
        ) VALUES ($1, $2, 'INCOME', $3, $4, $5, 'YAYASAN_PUSAT', $6, $7, $8, $9)
        RETURNING *`,
        [
          receiptNumber,
          today,
          accountId,
          initial,
          paymentMethod || 'BANK_TRANSFER',
          notes || `Penerimaan Awal ${type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} - ${finalDonorName}`,
          req.user?.id,
          memberId || null,
          newPledge.id,
        ]
      );
      initialTransactionId = txRes.rows[0]?.id || null;

      if (buildingProjectId) {
        await client.query(
          `UPDATE building_projects SET current_funds = current_funds + $1 WHERE id = $2`,
          [initial, buildingProjectId]
        );
      }

      initialReceipt = {
        receiptNumber,
        donorName: finalDonorName,
        category: newPledge.category,
        amount: initial,
        date: today,
        qrCodeValue: `https://gmhpakmk.org/verify-receipt?kwt=${receiptNumber}&amt=${initial}`,
      };
    }

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'PLEDGE_CREATE', 'pledges', newPledge.id, null, {
      donorName: finalDonorName,
      totalAmount: total,
      initialPayment: initial,
      category: newPledge.category,
      type: newPledge.pledge_type,
    }, req.ip, req.headers['user-agent']);

    if (initial > 0) {
      await logAudit(req.user?.id || null, 'DONATION_PAYMENT', 'financial_transactions', initialTransactionId, null, {
        pledgeId: newPledge.id,
        donorName: finalDonorName,
        amount: initial,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
      }, req.ip, req.headers['user-agent']);
    }

    res.status(201).json({
      success: true,
      message: `Komitmen donasi untuk ${finalDonorName} berhasil dicatat!`,
      pledge: newPledge,
      receipt: initialReceipt,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal membuat janji iman baru.', error: err.message });
  } finally {
    client.release();
  }
};

// Flow 3: Add Progress / Installment Payment to Existing Pledge
export const addPledgeInstallment = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { amount, date, paymentMethod, notes } = req.body;

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      res.status(400).json({ success: false, message: 'Nominal angsuran harus lebih besar dari 0.' });
      return;
    }

    await client.query('BEGIN');

    const pledgeRes = await client.query(`SELECT * FROM pledges WHERE id = $1`, [id]);
    if (pledgeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Janji iman tidak ditemukan.' });
      return;
    }

    const pledge = pledgeRes.rows[0];
    const txDate = date || new Date().toISOString().split('T')[0];
    const yearMonth = txDate.slice(0, 7).replace('-', '');

    // Generate Receipt Number
    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`KWT-GMH-${yearMonth}-%`]
    );
    const receiptNumber = `KWT-GMH-${yearMonth}-${String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0')}`;

    const isBuilding = (pledge.category || '').toLowerCase().includes('pembangunan');
    const accountId = isBuilding ? '4-2010' : '4-1010';

    // Insert into financial_transactions
    const txRes = await client.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by, donor_member_id, pledge_id
      ) VALUES ($1, $2, 'INCOME', $3, $4, $5, 'YAYASAN_PUSAT', $6, $7, $8, $9)
      RETURNING *`,
      [
        receiptNumber,
        txDate,
        accountId,
        paymentAmount,
        paymentMethod || 'BANK_TRANSFER',
        notes || `Angsuran Janji Iman - ${pledge.donor_name}`,
        req.user?.id,
        pledge.member_id || null,
        pledge.id,
      ]
    );

    // Update pledge fulfilled amount and status
    const newFulfilled = Number(pledge.fulfilled_amount || 0) + paymentAmount;
    const isCompleted = newFulfilled >= Number(pledge.total_pledge);
    const updateRes = await client.query(
      `UPDATE pledges 
       SET fulfilled_amount = $1, 
           status = $2 
       WHERE id = $3 
       RETURNING *`,
      [newFulfilled, isCompleted ? 'COMPLETED' : 'ACTIVE', id]
    );

    // If building project, update building current_funds
    if (pledge.building_project_id) {
      await client.query(
        `UPDATE building_projects SET current_funds = current_funds + $1 WHERE id = $2`,
        [paymentAmount, pledge.building_project_id]
      );
    }

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'DONATION_INSTALLMENT', 'financial_transactions', txRes.rows[0].id, null, {
      receiptNumber,
      pledgeId: id,
      donorName: pledge.donor_name,
      amount: paymentAmount,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      pledgeStatus: updateRes.rows[0]?.status,
    }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: `Angsuran Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat! No Kuitansi: ${receiptNumber}`,
      pledge: updateRes.rows[0],
      installment: txRes.rows[0],
      receipt: {
        receiptNumber,
        donorName: pledge.donor_name,
        category: pledge.category,
        amount: paymentAmount,
        date: txDate,
        qrCodeValue: `https://gmhpakmk.org/verify-receipt?kwt=${receiptNumber}&amt=${paymentAmount}`,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal mencatat angsuran.', error: err.message });
  } finally {
    client.release();
  }
};

// Flow 3: Get All Donations by Member ID (Semua komitmen/donasi terkait 1 ID Anggota)
export const getMemberDonations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;
    const memberRes = await db.query(
      `SELECT id, full_name, member_number, email, phone_number FROM members WHERE id = $1`,
      [memberId]
    );
    if (memberRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Anggota tidak ditemukan.' });
      return;
    }

    const member = memberRes.rows[0];

    const pledgesRes = await db.query(
      `SELECT p.*, bp.project_name,
              (SELECT COUNT(*)::int FROM financial_transactions ft WHERE ft.pledge_id = p.id) as installments_count,
              (SELECT ft.transaction_code FROM financial_transactions ft WHERE ft.pledge_id = p.id ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 1) as receipt_number
       FROM pledges p
       LEFT JOIN building_projects bp ON p.building_project_id = bp.id
       WHERE p.member_id = $1 OR LOWER(TRIM(p.donor_name)) = LOWER(TRIM($2))
       ORDER BY p.created_at DESC`,
      [memberId, member.full_name]
    );

    const transactionsRes = await db.query(
      `SELECT ft.*, p.category, p.pledge_type
       FROM financial_transactions ft
       LEFT JOIN pledges p ON ft.pledge_id = p.id
       WHERE ft.donor_member_id = $1 OR ft.pledge_id IN (
         SELECT id FROM pledges WHERE member_id = $1 OR LOWER(TRIM(donor_name)) = LOWER(TRIM($2))
       )
       ORDER BY ft.transaction_date DESC, ft.created_at DESC`,
      [memberId, member.full_name]
    );

    const totalDonated = pledgesRes.rows.reduce((sum, p) => sum + Number(p.fulfilled_amount || 0), 0);
    const totalPledged = pledgesRes.rows.reduce((sum, p) => sum + Number(p.total_pledge || 0), 0);

    res.status(200).json({
      success: true,
      member,
      pledges: pledgesRes.rows,
      transactions: transactionsRes.rows,
      totalDonated,
      totalPledged,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat donasi anggota.', error: err.message });
  }
};

// Flow 3: Submit Installment Payment & Issue E-Receipt with QR
export const recordDonationPayment = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const {
      donorName,
      pledgeId,
      category,
      amount,
      type, // 'PLEDGE' or 'DONATION'
      notes,
    } = req.body;

    if (!donorName || !amount || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Nama donatur dan nominal wajib diisi.' });
      return;
    }

    await client.query('BEGIN');

    const paymentAmount = parseFloat(amount);
    const today = new Date().toISOString().split('T')[0];
    const yearMonth = today.slice(0, 7).replace('-', '');

    // Receipt Number: KWT-GMH-YYYYMM-XXX
    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`KWT-GMH-${yearMonth}-%`]
    );
    const receiptNumber = `KWT-GMH-${yearMonth}-${String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0')}`;

    // 1. Determine account: 4-2010 (Pembangunan) or 4-1010 (Donasi Misi / Umum)
    const isBuilding = (category || '').toLowerCase().includes('pembangunan');
    const accountId = isBuilding ? '4-2010' : '4-1010';

    // 2. Insert into financial_transactions
    const txRes = await client.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by
      ) VALUES ($1, $2, 'INCOME', $3, $4, 'BANK_TRANSFER', 'YAYASAN_PUSAT', $5, $6)
      RETURNING *`,
      [
        receiptNumber,
        today,
        accountId,
        paymentAmount,
        `Penerimaan ${type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} - ${donorName} (${notes || ''})`,
        req.user?.id,
      ]
    );

    // 3. If tied to a pledge, update pledge fulfilled amount
    if (pledgeId) {
      await client.query(
        `UPDATE pledges SET fulfilled_amount = fulfilled_amount + $1 WHERE id = $2`,
        [paymentAmount, pledgeId]
      );
    }

    // 4. If building, update building_projects current_funds
    if (isBuilding) {
      await client.query(
        `UPDATE building_projects SET current_funds = current_funds + $1`,
        [paymentAmount]
      );
    }

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'DONATION_PAYMENT', 'financial_transactions', txRes.rows[0].id, null, {
      receiptNumber,
      donorName,
      amount: paymentAmount,
      pledgeId: pledgeId || null,
      category: category || null,
      type: type || null,
    }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      success: true,
      message: `Donasi berhasil dicatat dan terintegrasi ke kas yayasan. E-Kuitansi diterbitkan: ${receiptNumber}`,
      receipt: {
        receiptNumber,
        donorName,
        category: category || 'Pembangunan Rumah Persekutuan',
        amount: paymentAmount,
        date: today,
        qrCodeValue: `https://gmhpakmk.org/verify-receipt?kwt=${receiptNumber}&amt=${paymentAmount}`,
      },
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal mencatat pembayaran donasi.', error: err.message });
  } finally {
    client.release();
  }
};

// Flow 3: E-Receipt QR Code Verification Endpoint (Public)
export const verifyReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiptNumber } = req.params;
    const result = await db.query(
      `SELECT ft.*, coa.account_name, u.full_name as recorded_by_name
       FROM financial_transactions ft
       JOIN chart_of_accounts coa ON ft.account_id = coa.id
       LEFT JOIN users u ON ft.recorded_by = u.id
       WHERE ft.transaction_code = $1`,
      [receiptNumber]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, valid: false, message: 'E-Kuitansi tidak ditemukan dalam catatan resmi yayasan.' });
      return;
    }

    const tx = result.rows[0];
    res.status(200).json({
      success: true,
      valid: true,
      receiptNumber: tx.transaction_code,
      date: tx.transaction_date,
      amount: tx.amount,
      purpose: tx.account_name,
      notes: tx.notes,
      issuer: 'Yayasan Global Mission House (GMH PA KMK)',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memvalidasi kuitansi.', error: err.message });
  }
};

// Flow 3: Delete Transaction Endpoint
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT * FROM financial_transactions WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
      return;
    }
    const tx = check.rows[0];
    await db.query('DELETE FROM financial_transactions WHERE id = $1', [id]);
    await logAudit(req.user?.id || null, 'DELETE', 'financial_transactions', id, tx, null);
    res.status(200).json({ success: true, message: `Transaksi ${tx.transaction_code || id} berhasil dihapus.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.', error: err.message });
  }
};

// Flow 3: Update Transaction Endpoint
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      transactionDate,
      transactionType,
      accountId,
      amount,
      notes,
      paymentMethod,
    } = req.body;

    const check = await db.query('SELECT * FROM financial_transactions WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
      return;
    }

    const current = check.rows[0];
    const updateRes = await db.query(
      `UPDATE financial_transactions
       SET transaction_date = COALESCE($1, transaction_date),
           transaction_type = COALESCE($2, transaction_type),
           account_id = COALESCE($3, account_id),
           amount = COALESCE($4, amount),
           notes = COALESCE($5, notes),
           payment_method = COALESCE($6, payment_method)
       WHERE id = $7
       RETURNING *`,
      [
        transactionDate || null,
        transactionType || null,
        accountId || null,
        amount !== undefined && amount !== null ? parseFloat(amount) : null,
        notes !== undefined ? notes : null,
        paymentMethod || null,
        id,
      ]
    );

    const updated = updateRes.rows[0];
    await logAudit(req.user?.id || null, 'UPDATE', 'financial_transactions', id, current, updated);

    res.status(200).json({
      success: true,
      message: `Transaksi ${updated.transaction_code} berhasil diperbarui.`,
      transaction: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi.', error: err.message });
  }
};

// Flow 3: Get Real Finance Audit Logs directly from PostgreSQL
export const getFinanceAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(
      `SELECT a.id, a.user_id, a.action, a.entity_name, a.entity_id,
              a.old_values, a.new_values, a.created_at,
              COALESCE(u.full_name, 'Sistem GMH') as operator_name,
              COALESCE(u.role_id, 'SYSTEM') as operator_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_name IN ('financial_transactions', 'chart_of_accounts', 'finance_budget', 'pledges', 'mission_activities', 'foundation_programs')
           OR (a.new_values IS NOT NULL AND a.new_values::text ILIKE '%TX-%')
           OR (a.old_values IS NOT NULL AND a.old_values::text ILIKE '%TX-%')
          OR (a.new_values IS NOT NULL AND a.new_values::text ILIKE '%TX-%')
          OR (a.old_values IS NOT NULL AND a.old_values::text ILIKE '%TX-%')
       ORDER BY a.created_at DESC
       LIMIT 100`
    );

    const logs = result.rows.map((r: any) => {
      let refCode = 'TRX';
      let party = 'Pihak Relasi';
      let details = '';

      if (r.new_values) {
        refCode = r.new_values.transaction_code || r.new_values.receiptNumber || r.entity_id?.slice(0, 8) || 'TRX';
        party = r.new_values.donorName || r.new_values.party || 'Pihak Relasi';
        details = r.new_values.notes || `${r.action} pada ${refCode}`;
      } else if (r.old_values) {
        refCode = r.old_values.transaction_code || r.entity_id?.slice(0, 8) || 'TRX';
        party = r.old_values.donorName || r.old_values.party || 'Pihak Relasi';
        details = `Hapus transaksi ${refCode}`;
      }

      return {
        id: r.id,
        timestamp: new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19),
        action: r.action,
        refCode,
        party,
        operator: r.operator_name,
        details: details || `Aktivitas ${r.action} pada modul kas`,
      };
    });

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil log mutasi kas.', error: err.message });
  }
};

// Flow 3: Batch Create Transactions (CSV Import Integration)
export const batchCreateTransactions = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'Daftar transaksi mutasi kas wajib disertakan.' });
      return;
    }

    await client.query('BEGIN');

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`]
    );
    let startSeq = (countRes.rows[0]?.cnt || 0) + 1;
    const safeUserId = getSafeUserId(req.user?.id);

    const insertedList: any[] = [];

    for (const item of rows) {
      const seqStr = String(startSeq++).padStart(4, '0');
      const transactionCode = `TX-GMH-${yearMonth}-${seqStr}`;
      const trxType = item.type === 'CREDIT' || item.transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const effectiveScope = item.account === 'KAS_OPERASIONAL' ? 'OPERASIONAL' : 'YAYASAN_PUSAT';
      const accountId = item.accountId || (item.account === 'KAS_PEMBANGUNAN' ? '4-2010' : trxType === 'INCOME' ? '4-1010' : '5-2010');

      const notesCombined = `${item.desc || item.notes || 'Import Jurnal CSV'}${item.party ? ` (Pihak: ${item.party})` : ''}`;

      const ins = await client.query(
        `INSERT INTO financial_transactions (
          transaction_code, transaction_date, transaction_type,
          account_id, amount, payment_method, scope, notes, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          transactionCode,
          item.date || new Date().toISOString().split('T')[0],
          trxType,
          accountId,
          parseFloat(item.amount) || 0,
          item.paymentMethod || 'CASH',
          effectiveScope,
          notesCombined,
          safeUserId,
        ]
      );
      insertedList.push(ins.rows[0]);
    }

    await client.query('COMMIT');

    await logAudit(
      safeUserId,
      'BATCH_IMPORT',
      'financial_transactions',
      null,
      null,
      { count: insertedList.length, note: `Import massal ${insertedList.length} transaksi CSV` }
    );

    res.status(201).json({
      success: true,
      message: `Berhasil mengimpor ${insertedList.length} transaksi ke database buku jurnal kas.`,
      count: insertedList.length,
      transactions: insertedList,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal mengimpor batch transaksi.', error: err.message });
  } finally {
    client.release();
  }
};



