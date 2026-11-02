import { logAudit } from '../../middleware/audit.interceptor.js';
import { badRequest, notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  createMissionSchema,
  updateMissionSchema,
  recordMissionCashSchema,
  updateRundownSchema,
  updateTasksSchema,
  updateCommitteesSchema,
  updateMissionStatusSchema,
  type CreateMissionInput,
  type UpdateMissionInput,
  type RecordMissionCashInput,
  type UpdateRundownInput,
  type UpdateTasksInput,
  type UpdateCommitteesInput,
  type UpdateMissionStatusInput,
} from './missions.schema.js';

const getSafeUserId = (id?: string | null): string => {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return '31563344-ee08-4252-8cfa-7c1cd41910ca';
};

export async function listMissionActivities(params: {
  status?: string;
  search?: string;
  limit: number;
  offset: number;
  wantsPagination: boolean;
}) {
  const { status, search, limit, offset, wantsPagination } = params;
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (status) {
    queryParams.push(status);
    whereConditions.push(`status = $${queryParams.length}`);
  }
  if (search) {
    queryParams.push(`%${search}%`);
    whereConditions.push(
      `(title ILIKE $${queryParams.length} OR coordinator ILIKE $${queryParams.length} OR location ILIKE $${queryParams.length} OR theme ILIKE $${queryParams.length})`
    );
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM mission_activities${whereClause}`,
    queryParams,
    { label: 'missions.list.count' }
  );
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `SELECT * FROM mission_activities${whereClause} ORDER BY event_date DESC, created_at DESC`;
  const dataParams = [...queryParams];

  if (wantsPagination) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  }

  const result = await query(dataQuery, dataParams, { label: 'missions.list.data' });

  return { rows: result.rows, total };
}

export async function getMissionActivityById(id: string) {
  const result = await query('SELECT * FROM mission_activities WHERE id = $1', [id], {
    label: 'missions.getById',
  });
  if (result.rows.length === 0) {
    throw notFound('Dokumen kegiatan misi tidak ditemukan.');
  }
  return result.rows[0];
}

export async function createMissionActivity(userId: string | undefined, input: CreateMissionInput) {
  const data = validate(createMissionSchema, input);

  const newId = `ACT-${Date.now()}`;
  const initialTransactions = [
    {
      id: `trx-${Date.now()}`,
      date: data.eventDate || new Date().toISOString().slice(0, 10),
      type: 'IN',
      category: 'Pembukaan Kantong Kas',
      description: 'Pembukaan kantong kas kegiatan mandiri baru oleh staf.',
      amount: 0,
    },
  ];

  const insertRes = await query(
    `INSERT INTO mission_activities (
      id, title, theme, budget_estimate, coordinator, location,
      event_date, start_time, end_time, time_preview, description,
      media_drive_url, document_drive_url, status, cash_balance,
      transactions, rundown, tasks, committees
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *`,
    [
      newId,
      data.title.trim(),
      data.theme ? data.theme.trim() : '',
      data.budgetEstimate || 0,
      data.coordinator || 'Belum diatur',
      data.location || 'Belum diatur',
      data.eventDate || null,
      data.startTime || null,
      data.endTime || null,
      data.timePreview || '',
      data.description || '',
      data.mediaDriveUrl || '',
      data.documentDriveUrl || '',
      'ON_PROGRESS',
      0,
      JSON.stringify(initialTransactions),
      JSON.stringify([]),
      JSON.stringify([]),
      JSON.stringify([]),
    ],
    { label: 'missions.create' }
  );

  const created = insertRes.rows[0];
  await logAudit(userId || null, 'INSERT', 'mission_activities', created.id, null, created);

  return created;
}

export async function updateMissionActivity(
  id: string,
  userId: string | undefined,
  input: UpdateMissionInput
) {
  const data = validate(updateMissionSchema, input);

  const check = await query('SELECT * FROM mission_activities WHERE id = $1', [id], {
    label: 'missions.getForUpdate',
  });
  if (check.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }

  const old = check.rows[0];
  const updateRes = await query(
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
      data.title !== undefined ? data.title.trim() : null,
      data.theme !== undefined ? data.theme.trim() : null,
      data.budgetEstimate !== undefined ? data.budgetEstimate : null,
      data.coordinator !== undefined ? data.coordinator.trim() : null,
      data.location !== undefined ? data.location.trim() : null,
      data.eventDate || null,
      data.startTime || null,
      data.endTime || null,
      data.timePreview || null,
      data.description !== undefined ? data.description : null,
      data.mediaDriveUrl !== undefined ? data.mediaDriveUrl : null,
      data.documentDriveUrl !== undefined ? data.documentDriveUrl : null,
      data.status || null,
      id,
    ],
    { label: 'missions.update' }
  );

  const updated = updateRes.rows[0];
  await logAudit(userId || null, 'UPDATE', 'mission_activities', id, old, updated);

  return updated;
}

export async function recordMissionCashTransaction(
  id: string,
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  input: RecordMissionCashInput
) {
  const data = validate(recordMissionCashSchema, input);

  const check = await query('SELECT * FROM mission_activities WHERE id = $1', [id], {
    label: 'missions.cash.getActivity',
  });
  if (check.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }

  const activity = check.rows[0];
  const transactions = Array.isArray(activity.transactions) ? activity.transactions : [];

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
      { label: 'missions.cash.seqSubsidi' }
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
    centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

    const txDate = data.date || new Date().toISOString().split('T')[0];
    const notes = `[Subsidi Kas Yayasan] Kegiatan Misi: ${activity.title}${data.description ? ` - ${data.description}` : ''}`;

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
      { label: 'missions.cash.insertCentralSubsidi' }
    );
  } else if (isSetorSisa) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countRes = await query(
      `SELECT COUNT(*)::int as cnt FROM financial_transactions WHERE transaction_code LIKE $1`,
      [`TX-GMH-${yearMonth}-%`],
      { label: 'missions.cash.seqSetor' }
    );
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(4, '0');
    centralTxCode = `TX-GMH-${yearMonth}-${seq}`;

    const txDate = data.date || new Date().toISOString().split('T')[0];
    const notes = `[Setor Sisa Kas Kegiatan] Misi: ${activity.title}${data.description ? ` - ${data.description}` : ''}`;

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
      { label: 'missions.cash.insertCentralSetor' }
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
    `UPDATE mission_activities
     SET transactions = $1::jsonb,
         cash_balance = $2
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(updatedTransactions), newBalance, id],
    { label: 'missions.cash.updateBalance' }
  );

  await logAudit(userId || null, 'MISSION_CASH_CREATE', 'mission_activities', id, null, {
    transaction: newTrx, centralTxCode, cashBalance: updateRes.rows[0]?.cash_balance,
  }, ip, userAgent);

  if (centralTxCode) {
    await logAudit(userId || null, 'INSERT', 'financial_transactions', centralTxCode, null, {
      transaction_code: centralTxCode, amount: newTrx.amount, type: newTrx.type,
      category: newTrx.category, description: newTrx.description, missionActivityId: id,
    }, ip, userAgent);
  }

  return {
    activity: updateRes.rows[0],
    transaction: newTrx,
    centralTxCode,
  };
}

export async function deleteMissionCashTransaction(
  id: string,
  trxId: string,
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined
) {
  const check = await query('SELECT * FROM mission_activities WHERE id = $1', [id], {
    label: 'missions.cash.getForDelete',
  });
  if (check.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }

  const activity = check.rows[0];
  const existingTransactions = Array.isArray(activity.transactions) ? activity.transactions : [];

  const targetTrx = existingTransactions.find((t: any) => t.id === trxId);
  if (targetTrx && targetTrx.central_tx_code) {
    const centralTx = await query('SELECT * FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code], {
      label: 'missions.cash.findCentralTx',
    });
    await query('DELETE FROM financial_transactions WHERE transaction_code = $1', [targetTrx.central_tx_code], {
      label: 'missions.cash.deleteCentralTx',
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
    `UPDATE mission_activities
     SET transactions = $1::jsonb,
         cash_balance = $2
     WHERE id = $3
     RETURNING *`,
    [JSON.stringify(transactions), newBalance, id],
    { label: 'missions.cash.afterDeleteUpdate' }
  );

  if (targetTrx) {
    await logAudit(userId || null, 'MISSION_CASH_DELETE', 'mission_activities', id,
      { transaction: targetTrx, centralTxCode: targetTrx.central_tx_code || null },
      { cashBalance: updateRes.rows[0]?.cash_balance }, ip, userAgent);
    if (targetTrx.central_tx_code) {
      await logAudit(userId || null, 'DELETE', 'financial_transactions', targetTrx.central_tx_code,
        { transaction_code: targetTrx.central_tx_code, amount: targetTrx.amount, description: targetTrx.description },
        null, ip, userAgent);
    }
  }

  return updateRes.rows[0];
}

export async function updateMissionRundown(id: string, input: UpdateRundownInput) {
  const data = validate(updateRundownSchema, input);
  const updateRes = await query(
    `UPDATE mission_activities
     SET rundown = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.rundown || []), id],
    { label: 'missions.updateRundown' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateMissionTasks(id: string, input: UpdateTasksInput) {
  const data = validate(updateTasksSchema, input);
  const updateRes = await query(
    `UPDATE mission_activities
     SET tasks = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.tasks || []), id],
    { label: 'missions.updateTasks' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateMissionCommittees(id: string, input: UpdateCommitteesInput) {
  const data = validate(updateCommitteesSchema, input);
  const updateRes = await query(
    `UPDATE mission_activities
     SET committees = $1::jsonb
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(data.committees || []), id],
    { label: 'missions.updateCommittees' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function updateMissionStatus(id: string, input: UpdateMissionStatusInput) {
  const data = validate(updateMissionStatusSchema, input);
  const updateRes = await query(
    `UPDATE mission_activities
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [data.status, id],
    { label: 'missions.updateStatus' }
  );
  if (updateRes.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }
  return updateRes.rows[0];
}

export async function deleteMissionActivity(id: string) {
  const check = await query('SELECT status FROM mission_activities WHERE id = $1', [id], {
    label: 'missions.checkStatusForDelete',
  });
  if (check.rows.length === 0) {
    throw notFound('Kegiatan tidak ditemukan.');
  }

  if (check.rows[0].status === 'COMPLETED') {
    throw badRequest(
      'Kegiatan misi yang telah berstatus Selesai / Rampung LPJ tidak dapat dihapus demi integritas arsip yayasan.'
    );
  }

  await query('DELETE FROM mission_activities WHERE id = $1', [id], { label: 'missions.delete' });
  return { id };
}
