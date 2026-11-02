import { db } from '../../config/db.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { badRequest, notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  createPledgeSchema,
  addPledgeInstallmentSchema,
  recordDonationPaymentSchema,
  batchCreateTransactionsSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
  type CreatePledgeInput,
  type AddPledgeInstallmentInput,
  type RecordDonationPaymentInput,
  type BatchCreateTransactionsInput,
} from './finance.schema.js';

export const getSafeUserId = (id?: string | null): string => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return '31563344-ee08-4252-8cfa-7c1cd41910ca';
};

// ============================================================================
// 1. TRANSACTIONS
// ============================================================================
export interface ListTransactionsParams {
  roleId?: string;
  scope?: string;
  type?: string;
  accountId?: string;
  cursor?: string;
  page: number;
  limit: number;
  offset: number;
}

export async function getTransactions(params: ListTransactionsParams) {
  const { roleId, scope, type, accountId, cursor, limit, offset } = params;

  let whereClause = ` WHERE 1=1`;
  const queryParams: any[] = [];

  if (roleId === 'BENDAHARA_ADMIN') {
    queryParams.push('OPERASIONAL');
    whereClause += ` AND ft.scope = $${queryParams.length}`;
  } else if (scope) {
    queryParams.push(scope);
    whereClause += ` AND ft.scope = $${queryParams.length}`;
  }

  if (type) {
    queryParams.push(type);
    whereClause += ` AND ft.transaction_type = $${queryParams.length}`;
  }

  if (accountId) {
    queryParams.push(accountId);
    whereClause += ` AND ft.account_id = $${queryParams.length}`;
  }

  if (cursor) {
    queryParams.push(cursor);
    whereClause += ` AND ft.transaction_date < $${queryParams.length}`;
  }

  const summaryRes = await query(
    `SELECT 
      COUNT(*)::int AS total,
      COALESCE(SUM(CASE WHEN ft.transaction_type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN ft.transaction_type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS total_income
     FROM financial_transactions ft
     JOIN chart_of_accounts coa ON ft.account_id = coa.id
     ${whereClause}`,
    queryParams,
    { label: 'finance.tx.summary' }
  );

  const total = summaryRes.rows[0]?.total || 0;
  const totalDebit = parseFloat(summaryRes.rows[0]?.total_expense || '0');
  const totalCredit = parseFloat(summaryRes.rows[0]?.total_income || '0');

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

  const result = await query(dataQuery, dataParams, { label: 'finance.tx.list' });

  return {
    rows: result.rows,
    total,
    summary: {
      totalExpenseDebit: totalDebit,
      totalIncomeCredit: totalCredit,
      netBalance: totalCredit - totalDebit,
    },
  };
}

export async function createTransaction(
  userId: string | undefined,
  userRoleId: string | undefined,
  input: CreateTransactionInput
) {
  const data = validate(createTransactionSchema, input);
  const effectiveScope = userRoleId === 'BENDAHARA_ADMIN' ? 'OPERASIONAL' : (data.scope || 'OPERASIONAL');

  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const countRes = await query(
    `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
    [`TX-GMH-${yearMonth}-%`],
    { label: 'finance.tx.seq' }
  );
  const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
  const transactionCode = `TX-GMH-${yearMonth}-${seq}`;

  const safeUserId = getSafeUserId(userId);

  const insertRes = await query(
    `INSERT INTO financial_transactions (
      transaction_code, transaction_date, transaction_type,
      account_id, amount, payment_method, scope, notes, recorded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      transactionCode,
      data.transactionDate || new Date().toISOString().split('T')[0],
      data.transactionType,
      data.accountId,
      data.amount,
      data.paymentMethod || 'BANK_TRANSFER',
      effectiveScope,
      data.notes || '',
      safeUserId,
    ],
    { label: 'finance.tx.create' }
  );

  const newTx = insertRes.rows[0];
  await logAudit(safeUserId, 'INSERT', 'financial_transactions', newTx.id, null, newTx);

  return { transactionCode, transaction: newTx };
}

export async function updateTransaction(
  id: string,
  userId: string | undefined,
  input: UpdateTransactionInput
) {
  const data = validate(updateTransactionSchema, input);

  const check = await query('SELECT * FROM financial_transactions WHERE id = $1', [id], {
    label: 'finance.tx.getOneForUpdate',
  });
  if (check.rows.length === 0) {
    throw notFound('Transaksi tidak ditemukan.');
  }

  const current = check.rows[0];
  const updateRes = await query(
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
      data.transactionDate || null,
      data.transactionType || null,
      data.accountId || null,
      data.amount !== undefined ? data.amount : null,
      data.notes !== undefined ? data.notes : null,
      data.paymentMethod || null,
      id,
    ],
    { label: 'finance.tx.update' }
  );

  const updated = updateRes.rows[0];
  await logAudit(userId || null, 'UPDATE', 'financial_transactions', id, current, updated);

  return updated;
}

export async function deleteTransaction(id: string, userId: string | undefined) {
  const check = await query('SELECT * FROM financial_transactions WHERE id = $1', [id], {
    label: 'finance.tx.getOneForDelete',
  });
  if (check.rows.length === 0) {
    throw notFound('Transaksi tidak ditemukan.');
  }
  const tx = check.rows[0];
  await query('DELETE FROM financial_transactions WHERE id = $1', [id], { label: 'finance.tx.delete' });
  await logAudit(userId || null, 'DELETE', 'financial_transactions', id, tx, null);

  return tx;
}

// ============================================================================
// 2. CHART OF ACCOUNTS
// ============================================================================
export async function getChartOfAccounts() {
  const result = await query(
    `SELECT id, account_name, account_type, scope, is_active FROM chart_of_accounts WHERE is_active = TRUE ORDER BY id ASC`,
    [],
    { label: 'finance.coa.list' }
  );
  return result.rows;
}

// ============================================================================
// 3. PLEDGES & DONATIONS
// ============================================================================
export async function getPledgesAndDonations(params: {
  cursor?: string;
  limit: number;
  offset: number;
}) {
  const { cursor, limit, offset } = params;
  let whereClause = '';
  const queryParams: any[] = [];

  if (cursor) {
    whereClause = ` WHERE p.created_at < $1`;
    queryParams.push(cursor);
  }

  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM pledges p ${whereClause}`,
    queryParams,
    { label: 'finance.pledges.count' }
  );
  const total = countRes.rows[0]?.total || 0;

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

  const pledgesRes = await query(dataQuery, dataParams, { label: 'finance.pledges.list' });
  const bpRes = await query(`SELECT * FROM building_projects LIMIT 1`, [], { label: 'finance.pledges.buildingProject' });

  return {
    rows: pledgesRes.rows,
    total,
    buildingProject: bpRes.rows[0] || null,
  };
}

export async function getPledgeDetail(id: string) {
  const pledgeRes = await query(
    `SELECT p.*, 
            m.full_name as member_name, m.member_number, m.email as member_email, m.phone_number as member_phone,
            bp.project_name
     FROM pledges p
     LEFT JOIN members m ON p.member_id = m.id
     LEFT JOIN building_projects bp ON p.building_project_id = bp.id
     WHERE p.id = $1`,
    [id],
    { label: 'finance.pledges.getDetail' }
  );

  if (pledgeRes.rows.length === 0) {
    throw notFound('Data janji iman / donasi tidak ditemukan.');
  }

  const pledge = pledgeRes.rows[0];

  const installmentsRes = await query(
    `SELECT ft.id, ft.transaction_code, ft.transaction_date, ft.amount, ft.payment_method, ft.notes, ft.created_at,
            u.full_name as recorded_by_name
     FROM financial_transactions ft
     LEFT JOIN users u ON ft.recorded_by = u.id
     WHERE ft.pledge_id = $1
     ORDER BY ft.transaction_date ASC, ft.created_at ASC`,
    [id],
    { label: 'finance.pledges.installments' }
  );

  let memberAllPledges: any[] = [];
  let memberTotalDonated = 0;
  if (pledge.member_id) {
    const allMemberPledgesRes = await query(
      `SELECT p.*, bp.project_name,
              (SELECT COUNT(*)::int FROM financial_transactions ft WHERE ft.pledge_id = p.id) as installments_count,
              (SELECT ft.transaction_code FROM financial_transactions ft WHERE ft.pledge_id = p.id ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 1) as receipt_number
       FROM pledges p
       LEFT JOIN building_projects bp ON p.building_project_id = bp.id
       WHERE p.member_id = $1
       ORDER BY p.created_at DESC`,
      [pledge.member_id],
      { label: 'finance.pledges.memberAll' }
    );
    memberAllPledges = allMemberPledgesRes.rows;
    memberTotalDonated = memberAllPledges.reduce((sum, p) => sum + Number(p.fulfilled_amount || 0), 0);
  }

  return {
    pledge,
    installments: installmentsRes.rows,
    memberAllPledges,
    memberTotalDonated,
  };
}

export async function createPledge(
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  input: CreatePledgeInput
) {
  const data = validate(createPledgeSchema, input);
  const client = await db.getClient();
  try {
    let finalDonorName = data.donorName;
    if (data.memberId) {
      const mRes = await client.query(`SELECT full_name FROM members WHERE id = $1`, [data.memberId]);
      if (mRes.rows.length > 0) {
        finalDonorName = mRes.rows[0].full_name;
      }
    }

    if (!finalDonorName) {
      throw badRequest('Nama donatur wajib diisi.');
    }

    await client.query('BEGIN');

    const total = data.totalAmount;
    const initial = data.initialPayment || 0;
    const pledgeStatus = initial >= total ? 'COMPLETED' : 'ACTIVE';

    const isBuilding = (data.category || '').toLowerCase().includes('pembangunan');
    let buildingProjectId = null;
    if (isBuilding) {
      const bpRes = await client.query(`SELECT id FROM building_projects LIMIT 1`);
      buildingProjectId = bpRes.rows[0]?.id || null;
    }

    const pledgeRes = await client.query(
      `INSERT INTO pledges (
        donor_name, member_id, total_pledge, fulfilled_amount, category, pledge_type, due_date, status, notes, building_project_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        finalDonorName,
        data.memberId || null,
        total,
        initial,
        data.category || 'Pembangunan Rumah Persekutuan',
        data.type || 'PLEDGE',
        data.dueDate || null,
        pledgeStatus,
        data.notes || null,
        buildingProjectId,
      ]
    );

    const newPledge = pledgeRes.rows[0];
    let initialReceipt: { receiptNumber: string; donorName: string; category: string; amount: number; date: string; qrCodeValue: string } | null = null;
    let initialTransactionId: string | null = null;

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
          data.paymentMethod || 'BANK_TRANSFER',
          data.notes || `Penerimaan Awal ${data.type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} - ${finalDonorName}`,
          userId,
          data.memberId || null,
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

    await logAudit(userId || null, 'PLEDGE_CREATE', 'pledges', newPledge.id, null, {
      donorName: finalDonorName,
      totalAmount: total,
      initialPayment: initial,
      category: newPledge.category,
      type: newPledge.pledge_type,
    }, ip, userAgent);

    if (initial > 0) {
      await logAudit(userId || null, 'DONATION_PAYMENT', 'financial_transactions', initialTransactionId, null, {
        pledgeId: newPledge.id,
        donorName: finalDonorName,
        amount: initial,
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      }, ip, userAgent);
    }

    return { finalDonorName, pledge: newPledge, receipt: initialReceipt };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function addPledgeInstallment(
  id: string,
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  input: AddPledgeInstallmentInput
) {
  const data = validate(addPledgeInstallmentSchema, input);
  const client = await db.getClient();
  try {
    const paymentAmount = data.amount;

    await client.query('BEGIN');

    const pledgeRes = await client.query(`SELECT * FROM pledges WHERE id = $1`, [id]);
    if (pledgeRes.rows.length === 0) {
      throw notFound('Janji iman tidak ditemukan.');
    }

    const pledge = pledgeRes.rows[0];
    const txDate = data.date || new Date().toISOString().split('T')[0];
    const yearMonth = txDate.slice(0, 7).replace('-', '');

    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`KWT-GMH-${yearMonth}-%`]
    );
    const receiptNumber = `KWT-GMH-${yearMonth}-${String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0')}`;

    const isBuilding = (pledge.category || '').toLowerCase().includes('pembangunan');
    const accountId = isBuilding ? '4-2010' : '4-1010';

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
        data.paymentMethod || 'BANK_TRANSFER',
        data.notes || `Angsuran Janji Iman - ${pledge.donor_name}`,
        userId,
        pledge.member_id || null,
        pledge.id,
      ]
    );

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

    if (pledge.building_project_id) {
      await client.query(
        `UPDATE building_projects SET current_funds = current_funds + $1 WHERE id = $2`,
        [paymentAmount, pledge.building_project_id]
      );
    }

    await client.query('COMMIT');

    await logAudit(userId || null, 'DONATION_INSTALLMENT', 'financial_transactions', txRes.rows[0].id, null, {
      receiptNumber,
      pledgeId: id,
      donorName: pledge.donor_name,
      amount: paymentAmount,
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      pledgeStatus: updateRes.rows[0]?.status,
    }, ip, userAgent);

    return {
      paymentAmount,
      receiptNumber,
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
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getMemberDonations(memberId: string) {
  const memberRes = await query(
    `SELECT id, full_name, member_number, email, phone_number FROM members WHERE id = $1`,
    [memberId],
    { label: 'finance.memberDonations.getMember' }
  );
  if (memberRes.rows.length === 0) {
    throw notFound('Anggota tidak ditemukan.');
  }

  const member = memberRes.rows[0];

  const pledgesRes = await query(
    `SELECT p.*, bp.project_name,
            (SELECT COUNT(*)::int FROM financial_transactions ft WHERE ft.pledge_id = p.id) as installments_count,
            (SELECT ft.transaction_code FROM financial_transactions ft WHERE ft.pledge_id = p.id ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 1) as receipt_number
     FROM pledges p
     LEFT JOIN building_projects bp ON p.building_project_id = bp.id
     WHERE p.member_id = $1 OR LOWER(TRIM(p.donor_name)) = LOWER(TRIM($2))
     ORDER BY p.created_at DESC`,
    [memberId, member.full_name],
    { label: 'finance.memberDonations.pledges' }
  );

  const transactionsRes = await query(
    `SELECT ft.*, p.category, p.pledge_type
     FROM financial_transactions ft
     LEFT JOIN pledges p ON ft.pledge_id = p.id
     WHERE ft.donor_member_id = $1 OR ft.pledge_id IN (
       SELECT id FROM pledges WHERE member_id = $1 OR LOWER(TRIM(donor_name)) = LOWER(TRIM($2))
     )
     ORDER BY ft.transaction_date DESC, ft.created_at DESC`,
    [memberId, member.full_name],
    { label: 'finance.memberDonations.transactions' }
  );

  const totalDonated = pledgesRes.rows.reduce((sum, p) => sum + Number(p.fulfilled_amount || 0), 0);
  const totalPledged = pledgesRes.rows.reduce((sum, p) => sum + Number(p.total_pledge || 0), 0);

  return {
    member,
    pledges: pledgesRes.rows,
    transactions: transactionsRes.rows,
    totalDonated,
    totalPledged,
  };
}

export async function recordDonationPayment(
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  input: RecordDonationPaymentInput
) {
  const data = validate(recordDonationPaymentSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const paymentAmount = data.amount;
    const today = new Date().toISOString().split('T')[0];
    const yearMonth = today.slice(0, 7).replace('-', '');

    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`KWT-GMH-${yearMonth}-%`]
    );
    const receiptNumber = `KWT-GMH-${yearMonth}-${String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0')}`;

    const isBuilding = (data.category || '').toLowerCase().includes('pembangunan');
    const accountId = isBuilding ? '4-2010' : '4-1010';

    const txRes = await client.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by, pledge_id
      ) VALUES ($1, $2, 'INCOME', $3, $4, 'BANK_TRANSFER', 'YAYASAN_PUSAT', $5, $6, $7)
      RETURNING *`,
      [
        receiptNumber,
        today,
        accountId,
        paymentAmount,
        `Penerimaan ${data.type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} - ${data.donorName} (${data.notes || ''})`,
        userId,
        data.pledgeId || null,
      ]
    );

    if (data.pledgeId) {
      await client.query(
        `UPDATE pledges SET fulfilled_amount = fulfilled_amount + $1 WHERE id = $2`,
        [paymentAmount, data.pledgeId]
      );
    }

    if (isBuilding) {
      await client.query(
        `UPDATE building_projects SET current_funds = current_funds + $1`,
        [paymentAmount]
      );
    }

    await client.query('COMMIT');

    await logAudit(userId || null, 'DONATION_PAYMENT', 'financial_transactions', txRes.rows[0].id, null, {
      receiptNumber,
      donorName: data.donorName,
      amount: paymentAmount,
      pledgeId: data.pledgeId || null,
      category: data.category || null,
      type: data.type || null,
    }, ip, userAgent);

    return {
      receiptNumber,
      receipt: {
        receiptNumber,
        donorName: data.donorName,
        category: data.category || 'Pembangunan Rumah Persekutuan',
        amount: paymentAmount,
        date: today,
        qrCodeValue: `https://gmhpakmk.org/verify-receipt?kwt=${receiptNumber}&amt=${paymentAmount}`,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function verifyReceipt(receiptNumber: string) {
  const cleanNumber = (receiptNumber || '').trim();
  const result = await query(
    `SELECT ft.*, coa.account_name, u.full_name as recorded_by_name,
            COALESCE(p.donor_name, m.full_name, split_part(split_part(ft.notes, ' - ', 2), ' (', 1)) as donor_name
     FROM financial_transactions ft
     JOIN chart_of_accounts coa ON ft.account_id = coa.id
     LEFT JOIN users u ON ft.recorded_by = u.id
     LEFT JOIN pledges p ON ft.pledge_id = p.id
     LEFT JOIN members m ON ft.donor_member_id = m.id
     WHERE ft.transaction_code ILIKE $1
        OR ft.transaction_code ILIKE REPLACE($1, 'KWT-', 'TX-')
        OR ft.transaction_code ILIKE REPLACE($1, 'TX-', 'KWT-')
     ORDER BY ft.transaction_date DESC, ft.created_at DESC
     LIMIT 1`,
    [cleanNumber],
    { label: 'finance.receipt.verify' }
  );

  if (result.rows.length === 0) {
    throw notFound('E-Kuitansi tidak ditemukan dalam catatan resmi yayasan.');
  }

  const tx = result.rows[0];
  return {
    valid: true,
    receiptNumber: tx.transaction_code,
    date: tx.transaction_date,
    amount: tx.amount,
    purpose: tx.account_name,
    notes: tx.notes,
    donorName: tx.donor_name || 'Hamba Tuhan (Anonim)',
    issuer: 'Yayasan Global Mission House (GMH PA KMK)',
  };
}

export async function getFinanceAuditLogs() {
  const result = await query(
    `SELECT a.id, a.user_id, a.action, a.entity_name, a.entity_id,
            a.old_values, a.new_values, a.created_at,
            COALESCE(u.full_name, 'Sistem GMH') as operator_name,
            COALESCE(u.role_id, 'SYSTEM') as operator_role
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     WHERE a.entity_name IN ('financial_transactions', 'chart_of_accounts', 'finance_budget', 'pledges', 'mission_activities', 'foundation_programs')
         OR (a.new_values IS NOT NULL AND a.new_values::text ILIKE '%TX-%')
         OR (a.old_values IS NOT NULL AND a.old_values::text ILIKE '%TX-%')
     ORDER BY a.created_at DESC
     LIMIT 100`,
    [],
    { label: 'finance.audit.logs' }
  );

  return result.rows.map((r: any) => {
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
}

export async function batchCreateTransactions(userId: string | undefined, input: BatchCreateTransactionsInput) {
  const data = validate(batchCreateTransactionsSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await client.query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`]
    );
    let startSeq = (countRes.rows[0]?.cnt || 0) + 1;
    const safeUserId = getSafeUserId(userId);

    const insertedList: any[] = [];

    for (const item of data.rows) {
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
          item.amount || 0,
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

    return { count: insertedList.length, transactions: insertedList };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
