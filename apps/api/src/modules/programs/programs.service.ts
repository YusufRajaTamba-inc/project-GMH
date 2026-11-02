import { logAudit } from '../../middleware/audit.interceptor.js';
import { badRequest, notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  createProgramSchema,
  updateProgramSchema,
  recordProgramCashSchema,
  updateProgramRundownSchema,
  updateProgramTasksSchema,
  updateProgramCommitteesSchema,
  updateProgramStatusSchema,
  type CreateProgramInput,
  type UpdateProgramInput,
  type RecordProgramCashInput,
  type UpdateProgramRundownInput,
  type UpdateProgramTasksInput,
  type UpdateProgramCommitteesInput,
  type UpdateProgramStatusInput,
} from './programs.schema.js';

const getSafeUserId = (id?: string | null): string => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return '31563344-ee08-4252-8cfa-7c1cd41910ca';
};

export async function listPrograms(params: {
  category?: string;
  search?: string;
  status?: string;
  cursor?: string;
  limit: number;
  offset: number;
}) {
  const { category, search, status, cursor, limit, offset } = params;
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (cursor) {
    queryParams.push(cursor);
    whereConditions.push(`event_datetime > $${queryParams.length}`);
  }

  if (category) {
    queryParams.push(category);
    whereConditions.push(`program_category = $${queryParams.length}`);
  }

  if (status) {
    queryParams.push(status);
    whereConditions.push(`status = $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    whereConditions.push(
      `(program_title ILIKE $${queryParams.length} OR theme ILIKE $${queryParams.length} OR location ILIKE $${queryParams.length} OR speaker_name ILIKE $${queryParams.length})`
    );
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*)::int as total FROM foundation_programs ${whereClause}`, queryParams, {
    label: 'programs.list.count',
  });
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `SELECT * FROM foundation_programs ${whereClause} ORDER BY event_datetime ASC, created_at DESC`;
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

  const result = await query(dataQuery, dataParams, { label: 'programs.list.data' });

  return { rows: result.rows, total };
}

export async function getProgramById(id: string) {
  const result = await query('SELECT * FROM foundation_programs WHERE id = $1', [id], {
    label: 'programs.getById',
  });
  if (result.rows.length === 0) {
    throw notFound('Program kegiatan tidak ditemukan.');
  }
  return result.rows[0];
}

export async function createProgram(userId: string | undefined, input: CreateProgramInput) {
  const data = validate(createProgramSchema, input);

  const initialTransactions = [
    {
      id: `trx-${Date.now()}`,
      date: data.eventDatetime.slice(0, 10),
      type: 'IN',
      category: 'Pembukaan Kantong Kas',
      description: 'Pembukaan kantong kas program mandiri oleh staf.',
      amount: 0,
    },
  ];

  const result = await query(
    `INSERT INTO foundation_programs (
      program_title, program_category, event_datetime, location,
      theme, speaker_name, budget_estimate, cash_balance, status,
      description, media_drive_url, document_drive_url,
      transactions, rundown, tasks, committees
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      data.programTitle.trim(),
      data.programCategory || 'Persekutuan Alumni',
      data.eventDatetime,
      data.location || 'Rumah Persekutuan GMH',
      data.theme || '',
      data.speakerName || '',
      data.budgetEstimate || 0,
      0,
      'ON_PROGRESS',
      data.description || '',
      data.mediaDriveUrl || '',
      data.documentDriveUrl || '',
      JSON.stringify(initialTransactions),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
    ],
    { label: 'programs.create' }
  );

  const created = result.rows[0];
  await logAudit(userId || null, 'INSERT', 'foundation_programs', created.id, null, created);

  return created;
}

export async function updateProgram(id: string, userId: string | undefined, input: UpdateProgramInput) {
  const data = validate(updateProgramSchema, input);

  const check = await query('SELECT * FROM foundation_programs WHERE id = $1', [id], {
    label: 'programs.getForUpdate',
  });
  if (check.rows.length === 0) {
    throw notFound('Program kegiatan tidak ditemukan.');
  }

  const old = check.rows[0];
  const updateRes = await query(
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
      data.programTitle !== undefined ? data.programTitle.trim() : null,
      data.programCategory || null,
      data.eventDatetime || null,
      data.location !== undefined ? data.location.trim() : null,
      data.theme !== undefined ? data.theme.trim() : null,
      data.speakerName !== undefined ? data.speakerName.trim() : null,
      data.budgetEstimate !== undefined ? data.budgetEstimate : null,
      data.description !== undefined ? data.description : null,
      data.mediaDriveUrl !== undefined ? data.mediaDriveUrl : null,
      data.documentDriveUrl !== undefined ? data.documentDriveUrl : null,
      data.status || null,
      id,
    ],
    { label: 'programs.update' }
  );

  const updated = updateRes.rows[0];
  await logAudit(userId || null, 'UPDATE', 'foundation_programs', id, old, updated);

  return updated;
}

export async function recordProgramCashTransaction(
  id: string,
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  input: RecordProgramCashInput
) {
  const data = validate(recordProgramCashSchema, input);

  const check = await query('SELECT * FROM foundation_programs WHERE id = $1', [id], {
    label: 'programs.cash.getProgram',
  });
  if (check.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }

  const program = check.rows[0];
  const transactions = Array.isArray(program.transactions) ? program.transactions : [];

  const isAmbilSubsidi =
    data.category === 'Subsidi Kas Yayasan' ||
    data.transferType === 'AMBIL_SUBSIDI' ||
    (data.isSubsidiTransfer && data.type === 'IN');

  const isSetorSisa =
    data.category === 'Setor Sisa Kas ke Yayasan' ||
    data.transferType === 'SETOR_SISA' ||
    (data.isSubsidiTransfer && data.type === 'OUT');

  let centralTxCode: string | null = null;
  const safeUserId = getSafeUserId(userId);

  if (isAmbilSubsidi) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`],
      { label: 'programs.cash.seqSubsidi' }
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
    centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

    const txDate = data.date || new Date().toISOString().split('T')[0];
    const notes = `[Subsidi Kas Yayasan] Program: ${program.program_title}${data.description ? ` - ${data.description}` : ''}`;

    await query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        centralTxCode,
        txDate,
        'EXPENSE',
        '5-2010',
        data.amount,
        'CASH',
        'OPERASIONAL',
        notes,
        safeUserId,
      ],
      { label: 'programs.cash.insertCentralSubsidi' }
    );
  } else if (isSetorSisa) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`],
      { label: 'programs.cash.seqSetor' }
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
    centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

    const txDate = data.date || new Date().toISOString().split('T')[0];
    const notes = `[Setor Sisa Kas Program] ${program.program_title}${data.description ? ` - ${data.description}` : ''}`;

    await query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        centralTxCode,
        txDate,
        'INCOME',
        '4-1010',
        data.amount,
        'CASH',
        'OPERASIONAL',
        notes,
        safeUserId,
      ],
      { label: 'programs.cash.insertCentralSetor' }
    );
  }

  const newTrx: Record<string, any> = {
    id: `trx-${Date.now()}`,
    date: data.date || new Date().toISOString().slice(0, 10),
    type: data.type === 'OUT' ? 'OUT' : 'IN',
    category:
      data.category ||
      (isAmbilSubsidi
        ? 'Subsidi Kas Yayasan'
        : isSetorSisa
        ? 'Setor Sisa Kas ke Yayasan'
        : data.type === 'OUT'
        ? 'Beban Operasional'
        : 'Penerimaan Mandiri'),
    description: data.description || '',
    amount: data.amount,
  };

  if (centralTxCode) {
    newTrx.central_tx_code = centralTxCode;
  }

  const updatedTransactions = [newTrx, ...transactions];
  const newBalance = updatedTransactions.reduce((acc: number, t: any) => {
    const val = parseFloat(t.amount) || 0;
    return t.type === 'IN' ? acc + val : acc - val;
  }, 0);

  const updateRes = await query(
    `UPDATE foundation_programs
     SET transactions = $1::jsonb,
         cash_balance = $2
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(updatedTransactions), newBalance, id],
    { label: 'programs.cash.updateBalance' }
  );

  await logAudit(userId || null, 'PROGRAM_CASH_CREATE', 'foundation_programs', id, null, {
    transaction: newTrx, centralTxCode, cashBalance: updateRes.rows[0]?.cash_balance,
  }, ip, userAgent);

  if (centralTxCode) {
    await logAudit(userId || null, 'INSERT', 'financial_transactions', centralTxCode, null, {
      transaction_code: centralTxCode, amount: newTrx.amount, type: newTrx.type,
      category: newTrx.category, description: newTrx.description, programId: id,
    }, ip, userAgent);
  }

  return {
    program: updateRes.rows[0],
    transaction: newTrx,
    centralTxCode,
  };
}

export async function deleteProgramCashTransaction(
  id: string,
  trxId: string,
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined
) {
  const check = await query('SELECT * FROM foundation_programs WHERE id = $1', [id], {
    label: 'programs.cash.getForDelete',
  });
  if (check.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }

  const program = check.rows[0];
  const existingTransactions = Array.isArray(program.transactions) ? program.transactions : [];

  const targetTrx = existingTransactions.find((t: any) => t.id === trxId);
  if (targetTrx && targetTrx.central_tx_code) {
    const centralTx = await query('SELECT * FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code], {
      label: 'programs.cash.findCentralTx',
    });
    await query('DELETE FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code], {
      label: 'programs.cash.deleteCentralTx',
    });
    await logAudit(userId || null, 'DELETE', 'financial_transactions', centralTx.rows[0]?.id || targetTrx.central_tx_code,
      centralTx.rows[0] || { transaction_code: targetTrx.central_tx_code }, null, ip, userAgent);
  }

  const transactions = existingTransactions.filter((t: any) => t.id !== trxId);
  const newBalance = transactions.reduce((acc: number, t: any) => {
    const val = parseFloat(t.amount) || 0;
    return t.type === 'IN' ? acc + val : acc - val;
  }, 0);

  const updateRes = await query(
    `UPDATE foundation_programs
     SET transactions = $1::jsonb,
         cash_balance = $2
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(transactions), newBalance, id],
    { label: 'programs.cash.afterDeleteUpdate' }
  );

  if (targetTrx) {
    await logAudit(userId || null, 'PROGRAM_CASH_DELETE', 'foundation_programs', id,
      { transaction: targetTrx, centralTxCode: targetTrx.central_tx_code || null },
      { cashBalance: updateRes.rows[0]?.cash_balance }, ip, userAgent);
  }

  return updateRes.rows[0];
}

export async function updateProgramRundown(id: string, input: UpdateProgramRundownInput) {
  const data = validate(updateProgramRundownSchema, input);
  const updateRes = await query(
    `UPDATE foundation_programs
     SET rundown = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.rundown || []), id],
    { label: 'programs.updateRundown' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateProgramTasks(id: string, input: UpdateProgramTasksInput) {
  const data = validate(updateProgramTasksSchema, input);
  const updateRes = await query(
    `UPDATE foundation_programs
     SET tasks = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.tasks || []), id],
    { label: 'programs.updateTasks' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateProgramCommittees(id: string, input: UpdateProgramCommitteesInput) {
  const data = validate(updateProgramCommitteesSchema, input);
  const updateRes = await query(
    `UPDATE foundation_programs
     SET committees = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.committees || []), id],
    { label: 'programs.updateCommittees' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateProgramStatus(id: string, input: UpdateProgramStatusInput) {
  const data = validate(updateProgramStatusSchema, input);
  const updateRes = await query(
    `UPDATE foundation_programs
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [data.status, id],
    { label: 'programs.updateStatus' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function deleteProgram(id: string) {
  const check = await query('SELECT status FROM foundation_programs WHERE id = $1', [id], {
    label: 'programs.checkStatusForDelete',
  });
  if (check.rows.length === 0) {
    throw notFound('Program tidak ditemukan.');
  }

  if (check.rows[0].status === 'COMPLETED') {
    throw badRequest(
      'Program yang telah berstatus Selesai / Rampung LPJ tidak dapat dihapus demi integritas arsip yayasan.'
    );
  }

  await query('DELETE FROM foundation_programs WHERE id = $1', [id], { label: 'programs.delete' });
  return { id };
}
