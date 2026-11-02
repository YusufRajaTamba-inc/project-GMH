import crypto from 'crypto';
import { db } from '../../config/db.js';
import { badRequest, notFound } from '../../shared/index.js';
import { query } from '../../shared/sql.js';
import { validate } from '../../shared/validate.js';
import {
  checkAvailabilityQuerySchema,
  publicLoanRequestSchema,
  trackLoanQuerySchema,
  createAdminLoanSchema,
  returnLoanSchema,
  approveLoanSchema,
  rejectLoanSchema,
  createAssetSchema,
  updateAssetSchema,
  type CheckAvailabilityQuery,
  type PublicLoanRequestInput,
  type TrackLoanQuery,
  type CreateAdminLoanInput,
  type ReturnLoanInput,
  type ApproveLoanInput,
  type RejectLoanInput,
  type CreateAssetInput,
  type UpdateAssetInput,
} from './assets.schema.js';

// ============================================================================
// HELPER: Cryptographic Request Code
// ============================================================================
export function generateSecureRequestCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(8);
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return `REQ-AST-${token.slice(0, 4)}-${token.slice(4, 8)}`;
}

// ============================================================================
// PUBLIC SERVICES
// ============================================================================
export async function getPublicAvailableAssets() {
  const queryText = `
    SELECT 
      a.id, 
      a.asset_code, 
      a.asset_name, 
      a.asset_type, 
      a.available_quantity, 
      a.rental_price, 
      a.is_borrowable,
      sl.label as category_label
    FROM assets a
    LEFT JOIN system_lookups sl ON a.category_id = sl.id
    WHERE a.is_borrowable = TRUE
    ORDER BY a.asset_name ASC
  `;
  const result = await query(queryText, [], { label: 'assets.public.available' });
  return result.rows;
}

export async function checkAssetAvailability(params: CheckAvailabilityQuery) {
  const data = validate(checkAvailabilityQuerySchema, params);

  const assetRes = await query(
    `SELECT id, asset_name, available_quantity, is_borrowable 
     FROM assets 
     WHERE id = $1 AND is_borrowable = TRUE`,
    [data.assetId],
    { label: 'assets.public.checkAsset' }
  );

  if (assetRes.rows.length === 0) {
    throw notFound('Aset tidak ditemukan atau tidak diperuntukkan bagi peminjaman publik.');
  }

  const asset = assetRes.rows[0];
  const requestedQty = Math.max(1, data.quantity || 1);
  const availableQty = parseInt(asset.available_quantity, 10) || 0;

  if (availableQty < requestedQty) {
    return {
      assetId: asset.id,
      assetName: asset.asset_name,
      isAvailable: false,
      availableQuantity: availableQty,
      message: availableQty === 0
        ? 'Saat ini unit aset sedang kosong / terpakai seluruhnya.'
        : `Stok saat ini hanya tersedia ${availableQty} unit.`,
    };
  }

  if (data.borrowedAt && data.expectedReturnAt) {
    const conflictRes = await query(
      `SELECT COALESCE(SUM(quantity_borrowed), 0)::int AS reserved_qty
       FROM asset_loans
       WHERE asset_id = $1
         AND status IN ('APPROVED', 'ACTIVE')
         AND borrowed_at <= $3
         AND expected_return_at >= $2`,
      [data.assetId, data.borrowedAt, data.expectedReturnAt],
      { label: 'assets.public.checkConflict' }
    );
    const reserved = conflictRes.rows[0]?.reserved_qty || 0;
    if (availableQty - reserved < requestedQty) {
      return {
        assetId: asset.id,
        assetName: asset.asset_name,
        isAvailable: false,
        availableQuantity: Math.max(0, availableQty - reserved),
        message: 'Aset sudah diagendakan untuk kegiatan lain pada rentang tanggal tersebut.',
      };
    }
  }

  return {
    assetId: asset.id,
    assetName: asset.asset_name,
    isAvailable: true,
    availableQuantity: availableQty,
    message: 'Aset siap dipinjam.',
  };
}

export async function submitPublicLoanRequest(input: PublicLoanRequestInput) {
  const data = validate(publicLoanRequestSchema, input);

  const assetRes = await query('SELECT * FROM assets WHERE id = $1', [data.assetId], {
    label: 'assets.public.getAssetForRequest',
  });
  if (assetRes.rows.length === 0) {
    throw notFound('Aset yang dipilih tidak ditemukan.');
  }

  const asset = assetRes.rows[0];
  if (!asset.is_borrowable) {
    throw badRequest('Aset ini bertanda internal dan tidak dapat dipinjam/disewa.');
  }

  const qty = Math.max(1, data.quantityBorrowed || 1);
  const availableQty = parseInt(asset.available_quantity, 10) || 0;
  if (availableQty < qty) {
    throw badRequest(`Jumlah unit yang diminta (${qty}) melebihi kuota ketersediaan saat ini (${availableQty} unit).`);
  }

  const isRent = String(data.loanType).toUpperCase() === 'SEWA';
  const type = isRent ? 'SEWA' : 'PINJAM';
  const fee = isRent ? ((parseFloat(asset.rental_price) || 0) * qty) : 0;

  let requestCode = generateSecureRequestCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const checkCode = await query('SELECT id FROM asset_loans WHERE request_code = $1', [requestCode], {
      label: 'assets.public.checkCodeUniq',
    });
    if (checkCode.rows.length === 0) break;
    requestCode = generateSecureRequestCode();
  }

  await query(
    `INSERT INTO asset_loans (
      asset_id, borrower_name, borrower_phone, borrower_email, borrower_institution,
      loan_purpose, loan_type, rental_fee,
      borrowed_at, expected_return_at, quantity_borrowed, notes, status, request_code
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', $13)`,
    [
      data.assetId,
      data.borrowerName.trim(),
      data.borrowerPhone,
      data.borrowerEmail ? data.borrowerEmail.trim() : null,
      data.borrowerInstitution ? data.borrowerInstitution.trim() : null,
      data.loanPurpose.trim(),
      type,
      fee,
      data.borrowedAt,
      data.expectedReturnAt,
      qty,
      data.notes ? data.notes.trim() : null,
      requestCode,
    ],
    { label: 'assets.public.insertLoan' }
  );

  return {
    requestCode,
    loan: {
      requestCode,
      assetName: asset.asset_name,
      borrowerName: data.borrowerName.trim(),
      loanType: type,
      borrowedAt: data.borrowedAt,
      expectedReturnAt: data.expectedReturnAt,
      quantityBorrowed: qty,
      status: 'PENDING',
    },
  };
}

export async function trackPublicLoan(params: TrackLoanQuery) {
  const data = validate(trackLoanQuerySchema, params);
  const cleanPhoneDigits = data.phone.replace(/[^0-9]/g, '');
  if (!cleanPhoneDigits || cleanPhoneDigits.length < 4) {
    throw badRequest('Untuk perlindungan privasi dan keamanan agenda, masukkan 4 digit terakhir nomor WhatsApp pemohon.');
  }

  const phoneSuffix = cleanPhoneDigits.slice(-4);

  const queryText = `
    SELECT 
      al.id,
      al.request_code,
      al.loan_type,
      al.borrowed_at,
      al.expected_return_at,
      al.quantity_borrowed,
      al.status,
      al.approval_notes,
      al.rejection_reason,
      al.created_at,
      CONCAT(SUBSTRING(al.borrower_name, 1, 3), '***') AS borrower_name,
      CONCAT(SUBSTRING(al.borrower_phone, 1, 4), '****', RIGHT(al.borrower_phone, 3)) AS borrower_phone,
      a.asset_code,
      a.asset_name,
      a.asset_type,
      sl.label as category_label
    FROM asset_loans al
    JOIN assets a ON al.asset_id = a.id
    LEFT JOIN system_lookups sl ON a.category_id = sl.id
    WHERE UPPER(TRIM(al.request_code)) = UPPER(TRIM($1))
      AND (
        RIGHT(REGEXP_REPLACE(al.borrower_phone, '[^0-9]', '', 'g'), 4) = $2
        OR REGEXP_REPLACE(al.borrower_phone, '[^0-9]', '', 'g') = $3
      )
    ORDER BY al.created_at DESC
    LIMIT 1
  `;

  const result = await query(queryText, [data.code, phoneSuffix, cleanPhoneDigits], {
    label: 'assets.public.track',
  });

  if (result.rows.length === 0) {
    throw notFound(
      'Data permohonan tidak ditemukan. Pastikan kombinasi nomor tiket dan 4 digit terakhir nomor WhatsApp pemohon sudah cocok.'
    );
  }

  return result.rows;
}

// ============================================================================
// ADMIN SERVICES
// ============================================================================
export interface ListAdminAssetsParams {
  page: number;
  limit: number;
  offset: number;
  cursor?: string;
  condition?: string;
  type?: string;
  search?: string;
}

export async function listAdminAssets(params: ListAdminAssetsParams) {
  const { limit, offset, cursor, condition, type, search } = params;
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (cursor) {
    queryParams.push(cursor);
    whereConditions.push(`a.asset_code > $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    whereConditions.push(
      `(a.asset_name ILIKE $${queryParams.length} OR a.asset_code ILIKE $${queryParams.length} OR a.location_room ILIKE $${queryParams.length})`
    );
  }

  if (condition) {
    queryParams.push(condition);
    whereConditions.push(`a.physical_condition = $${queryParams.length}`);
  }

  if (type) {
    queryParams.push(type);
    whereConditions.push(`a.asset_type = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*)::int as total FROM assets a ${whereClause}`, queryParams, {
    label: 'assets.admin.count',
  });
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `
    SELECT a.*, sl.label as category_label
    FROM assets a
    LEFT JOIN system_lookups sl ON a.category_id = sl.id
    ${whereClause}
    ORDER BY a.asset_code ASC
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

  const result = await query(dataQuery, dataParams, { label: 'assets.admin.list' });
  return { rows: result.rows, total };
}

export async function listAdminLoans(params: { status?: string; loanType?: string }) {
  const { status, loanType } = params;
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  if (status) {
    queryParams.push(status);
    whereConditions.push(`al.status = $${queryParams.length}`);
  }

  if (loanType) {
    queryParams.push(loanType);
    whereConditions.push(`al.loan_type = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

  const queryText = `
    SELECT 
      al.*,
      a.asset_code,
      a.asset_name,
      a.asset_type,
      a.location_room,
      a.rental_price,
      sl.label as category_label,
      m.full_name as member_full_name,
      m.phone_number as member_phone,
      m.member_number,
      u.full_name as approver_name,
      u.email as approver_email
    FROM asset_loans al
    JOIN assets a ON al.asset_id = a.id
    LEFT JOIN system_lookups sl ON a.category_id = sl.id
    LEFT JOIN members m ON al.borrower_member_id = m.id
    LEFT JOIN users u ON al.approved_by = u.id
    ${whereClause}
    ORDER BY al.borrowed_at DESC, al.created_at DESC
  `;

  const result = await query(queryText, queryParams, { label: 'assets.admin.loans' });
  return result.rows;
}

export async function createAdminLoan(input: CreateAdminLoanInput) {
  const data = validate(createAdminLoanSchema, input);
  const qty = Math.max(1, data.quantityBorrowed || 1);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [data.assetId]);
    if (assetRes.rows.length === 0) {
      throw notFound('Aset tidak ditemukan.');
    }

    const asset = assetRes.rows[0];
    if (!asset.is_borrowable) {
      throw badRequest('Aset ini bertanda Internal Saja dan tidak dapat dipinjam/disewa.');
    }

    const available = parseInt(asset.available_quantity, 10) || 0;
    if (available < qty) {
      throw badRequest(`Jumlah unit tersedia tidak mencukupi. Tersedia saat ini: ${available} unit.`);
    }

    const isRent = String(data.loanType).toUpperCase() === 'SEWA';
    const type = isRent ? 'SEWA' : 'PINJAM';
    const fee = isRent ? (data.rentalFee || parseFloat(asset.rental_price) || 0) : 0;

    const loanInsert = await client.query(
      `INSERT INTO asset_loans (
        asset_id, borrower_name, borrower_phone, borrower_member_id,
        loan_purpose, loan_type, rental_fee,
        borrowed_at, expected_return_at, quantity_borrowed, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
      RETURNING *`,
      [
        data.assetId,
        data.borrowerName.trim(),
        data.borrowerPhone ? data.borrowerPhone.trim() : null,
        data.borrowerMemberId || null,
        data.loanPurpose.trim(),
        type,
        fee,
        data.borrowedAt || new Date().toISOString().split('T')[0],
        data.expectedReturnAt,
        qty,
        data.notes ? data.notes.trim() : null,
      ]
    );

    const newAvailable = available - qty;
    const newBorrowStatus = newAvailable <= 0 ? (isRent ? 'RENTED' : 'BORROWED') : 'AVAILABLE';

    await client.query(
      `UPDATE assets 
       SET available_quantity = $1, borrow_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newAvailable, newBorrowStatus, data.assetId]
    );

    await client.query('COMMIT');
    return { type, loan: loanInsert.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function returnLoan(loanId: string, input: ReturnLoanInput) {
  const data = validate(returnLoanSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [loanId]);
    if (loanRes.rows.length === 0) {
      throw notFound('Data transaksi peminjaman/sewa tidak ditemukan.');
    }

    const loan = loanRes.rows[0];
    if (loan.status === 'RETURNED') {
      throw badRequest('Aset ini sudah tercatat telah dikembalikan sebelumnya.');
    }

    const returnDate = data.actualReturnAt || new Date().toISOString().split('T')[0];
    const returnCond = data.conditionOnReturn || 'GOOD';

    const updatedLoanRes = await client.query(
      `UPDATE asset_loans
       SET status = 'RETURNED',
           actual_return_at = $1,
           condition_on_return = $2,
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [returnDate, returnCond, data.notes || null, loanId]
    );

    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [loan.asset_id]);
    if (assetRes.rows.length > 0) {
      const asset = assetRes.rows[0];
      const restoredAvailable = Math.min(
        parseInt(asset.quantity, 10) || 1,
        (parseInt(asset.available_quantity, 10) || 0) + (parseInt(loan.quantity_borrowed, 10) || 1)
      );
      const isFull = restoredAvailable >= (parseInt(asset.quantity, 10) || 1);
      const newBorrowStatus = isFull ? 'AVAILABLE' : asset.borrow_status;

      await client.query(
        `UPDATE assets
         SET available_quantity = $1,
             physical_condition = $2,
             borrow_status = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [restoredAvailable, returnCond, newBorrowStatus, loan.asset_id]
      );
    }

    await client.query('COMMIT');
    return updatedLoanRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function approveLoan(loanId: string, adminUserId: string | null, input: ApproveLoanInput) {
  const data = validate(approveLoanSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [loanId]);
    if (loanRes.rows.length === 0) {
      throw notFound('Permohonan pinjaman tidak ditemukan.');
    }

    const loan = loanRes.rows[0];
    if (loan.status === 'APPROVED' || loan.status === 'ACTIVE') {
      throw badRequest('Permohonan ini sudah disetujui sebelumnya.');
    }

    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [loan.asset_id]);
    if (assetRes.rows.length === 0) {
      throw notFound('Aset terkait tidak ditemukan.');
    }

    const asset = assetRes.rows[0];
    const qty = parseInt(loan.quantity_borrowed, 10) || 1;
    const available = parseInt(asset.available_quantity, 10) || 0;

    if (available < qty) {
      throw badRequest(`Stok aset tidak mencukupi untuk disetujui. Tersedia: ${available} unit, diminta: ${qty} unit.`);
    }

    const newAvailable = available - qty;
    const isRent = String(loan.loan_type).toUpperCase() === 'SEWA';
    const newBorrowStatus = newAvailable <= 0 ? (isRent ? 'RENTED' : 'BORROWED') : 'AVAILABLE';

    await client.query(
      `UPDATE assets 
       SET available_quantity = $1, borrow_status = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [newAvailable, newBorrowStatus, loan.asset_id]
    );

    const updateRes = await client.query(
      `UPDATE asset_loans
       SET status = 'APPROVED',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           approval_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [adminUserId, data.approvalNotes ? data.approvalNotes.trim() : 'Disetujui oleh pengurus yayasan. Aset siap diambil di kantor GMH.', loanId]
    );

    await client.query('COMMIT');
    return { requestCode: loan.request_code || 'ASET', loan: updateRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectLoan(loanId: string, adminUserId: string | null, input: RejectLoanInput) {
  const data = validate(rejectLoanSchema, input);
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [loanId]);
    if (loanRes.rows.length === 0) {
      throw notFound('Permohonan pinjaman tidak ditemukan.');
    }

    const loan = loanRes.rows[0];

    if (loan.status === 'APPROVED' || loan.status === 'ACTIVE') {
      const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [loan.asset_id]);
      if (assetRes.rows.length > 0) {
        const asset = assetRes.rows[0];
        const qty = parseInt(loan.quantity_borrowed, 10) || 1;
        const restoredAvailable = Math.min(
          parseInt(asset.quantity, 10) || 1,
          (parseInt(asset.available_quantity, 10) || 0) + qty
        );
        await client.query(
          `UPDATE assets SET available_quantity = $1, borrow_status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [restoredAvailable, loan.asset_id]
        );
      }
    }

    const updateRes = await client.query(
      `UPDATE asset_loans
       SET status = 'REJECTED',
           rejection_reason = $1,
           approved_by = $2,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [data.rejectionReason.trim(), adminUserId, loanId]
    );

    await client.query('COMMIT');
    return { requestCode: loan.request_code || 'ASET', loan: updateRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function handoverLoan(loanId: string) {
  const updateRes = await query(
    `UPDATE asset_loans
     SET status = 'ACTIVE',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'APPROVED'
     RETURNING *`,
    [loanId],
    { label: 'assets.admin.handover' }
  );

  if (updateRes.rows.length === 0) {
    throw badRequest('Hanya permohonan dengan status APPROVED yang dapat diserahterimakan.');
  }

  return updateRes.rows[0];
}

export async function getAssetDetailWithLoans(id: string) {
  const assetRes = await query(
    `SELECT 
      a.*, 
      sl.label as category_label,
      sl.code as category_code
    FROM assets a
    LEFT JOIN system_lookups sl ON a.category_id = sl.id
    WHERE a.id::text = $1 OR a.asset_code = $1`,
    [id],
    { label: 'assets.admin.getOne' }
  );

  if (assetRes.rows.length === 0) {
    throw notFound('Aset tidak ditemukan dalam database.');
  }

  const asset = assetRes.rows[0];

  const loansRes = await query(
    `SELECT 
      al.*,
      m.full_name as member_full_name,
      m.phone_number as member_phone,
      m.member_number,
      u.full_name as approver_name,
      u.email as approver_email
    FROM asset_loans al
    LEFT JOIN members m ON al.borrower_member_id = m.id
    LEFT JOIN users u ON al.approved_by = u.id
    WHERE al.asset_id = $1
    ORDER BY al.borrowed_at DESC, al.created_at DESC`,
    [asset.id],
    { label: 'assets.admin.assetLoans' }
  );

  return {
    ...asset,
    loans: loansRes.rows,
  };
}

export async function createAsset(input: CreateAssetInput) {
  const data = validate(createAssetSchema, input);

  const countRes = await query(`SELECT COUNT(*)::int as cnt FROM assets`, [], { label: 'assets.admin.countForSeq' });
  const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0');
  const assetCode = `AST-GMH-${seq}`;

  const totalQty = Math.max(1, data.quantity || 1);

  const insertRes = await query(
    `INSERT INTO assets (
      asset_code, asset_name, category_id, purchase_date, purchase_price,
      physical_condition, location_room, is_borrowable,
      quantity, available_quantity, asset_type, rental_price, borrow_status, notes
    ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, 'AVAILABLE', $12)
    RETURNING *`,
    [
      assetCode,
      data.assetName.trim(),
      data.categoryId || null,
      data.purchasePrice || 0,
      data.physicalCondition || 'GOOD',
      data.locationRoom || 'Gedung GMH',
      Boolean(data.isBorrowable),
      totalQty,
      totalQty,
      data.assetType || 'BARANG',
      data.rentalPrice || 0,
      data.notes || null,
    ],
    { label: 'assets.admin.create' }
  );

  return insertRes.rows[0];
}

export async function updateAsset(id: string, input: UpdateAssetInput) {
  const data = validate(updateAssetSchema, input);

  const currentAssetRes = await query('SELECT * FROM assets WHERE id = $1', [id], {
    label: 'assets.admin.getCurrentForUpdate',
  });
  if (currentAssetRes.rows.length === 0) {
    throw notFound('Aset tidak ditemukan.');
  }

  const current = currentAssetRes.rows[0];
  const oldQty = parseInt(current.quantity, 10) || 1;
  const oldAvail = parseInt(current.available_quantity, 10) || 1;

  let newQty = oldQty;
  let newAvail = oldAvail;

  if (data.quantity !== undefined) {
    newQty = Math.max(1, data.quantity);
    const diff = newQty - oldQty;
    newAvail = Math.min(newQty, Math.max(0, oldAvail + diff));
  }

  const updateRes = await query(
    `UPDATE assets
     SET asset_name = COALESCE($1, asset_name),
         category_id = COALESCE($2, category_id),
         purchase_price = COALESCE($3, purchase_price),
         physical_condition = COALESCE($4, physical_condition),
         location_room = COALESCE($5, location_room),
         is_borrowable = COALESCE($6, is_borrowable),
         quantity = $7,
         available_quantity = $8,
         asset_type = COALESCE($9, asset_type),
         rental_price = COALESCE($10, rental_price),
         notes = COALESCE($11, notes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $12
     RETURNING *`,
    [
      data.assetName !== undefined ? data.assetName.trim() : null,
      data.categoryId !== undefined ? (data.categoryId || null) : null,
      data.purchasePrice !== undefined ? data.purchasePrice : null,
      data.physicalCondition || null,
      data.locationRoom !== undefined ? data.locationRoom.trim() : null,
      data.isBorrowable !== undefined ? data.isBorrowable : null,
      newQty,
      newAvail,
      data.assetType || null,
      data.rentalPrice !== undefined ? data.rentalPrice : null,
      data.notes !== undefined ? data.notes : null,
      id,
    ],
    { label: 'assets.admin.update' }
  );

  return updateRes.rows[0];
}

export async function deleteAsset(id: string) {
  const activeLoans = await query(
    `SELECT COUNT(*)::int as count FROM asset_loans WHERE asset_id = $1 AND status = 'ACTIVE'`,
    [id],
    { label: 'assets.admin.checkActiveLoans' }
  );
  if ((activeLoans.rows[0]?.count || 0) > 0) {
    throw badRequest('Tidak dapat menghapus aset yang saat ini sedang aktif dipinjam atau disewa.');
  }

  await query('DELETE FROM asset_loans WHERE asset_id = $1', [id], { label: 'assets.admin.deleteLoans' });
  const delRes = await query('DELETE FROM assets WHERE id = $1 RETURNING *', [id], {
    label: 'assets.admin.deleteAsset',
  });

  if (delRes.rows.length === 0) {
    throw notFound('Aset tidak ditemukan.');
  }

  return { id };
}
