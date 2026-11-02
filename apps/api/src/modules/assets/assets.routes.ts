import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from '../../config/db.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';
import { publicSubmissionRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

const router = Router();

// Unpredictable Cryptographic Request Code Generator (Anti-Enumeration / Anti-IDOR)
// Generates codes like: REQ-AST-8X9K-4M2P (Entropy: >1 Trillion combinations)
function generateSecureRequestCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(8);
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return `REQ-AST-${token.slice(0, 4)}-${token.slice(4, 8)}`;
}

// ============================================================================
// PUBLIC ENDPOINTS (Tanpa Token — Form Pinjaman Publik & Tracking Progres)
// ============================================================================

// ----------------------------------------------------------------------------
// PUBLIC 1: GET /public/available — Katalog Aset Publik (Sanitized / Zero-Leak)
// Tidak mengekspos: location_room (keamanan fisik), notes internal, total stok
// ----------------------------------------------------------------------------
router.get('/public/available', async (_req: Request, res: Response): Promise<void> => {
  try {
    const query = `
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
    const result = await db.query(query);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      assets: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat katalog aset publik.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// PUBLIC 1b: GET /public/check-availability — Validasi Jadwal & Ketersediaan Aset
// ----------------------------------------------------------------------------
router.get('/public/check-availability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId, quantity = 1, borrowedAt, expectedReturnAt } = req.query;

    if (!assetId) {
      res.status(400).json({ success: false, message: 'ID aset wajib disertakan.' });
      return;
    }

    const assetRes = await db.query(
      `SELECT id, asset_name, available_quantity, is_borrowable 
       FROM assets 
       WHERE id = $1 AND is_borrowable = TRUE`,
      [assetId]
    );

    if (assetRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        isAvailable: false,
        message: 'Aset tidak ditemukan atau tidak diperuntukkan bagi peminjaman publik.',
      });
      return;
    }

    const asset = assetRes.rows[0];
    const requestedQty = Math.max(1, parseInt(String(quantity), 10) || 1);
    const availableQty = parseInt(asset.available_quantity, 10) || 0;

    // 1. Cek kuota dasar unit fisik yang tidak sedang dipinjam
    if (availableQty < requestedQty) {
      res.status(200).json({
        success: true,
        assetId: asset.id,
        assetName: asset.asset_name,
        isAvailable: false,
        availableQuantity: availableQty,
        message: availableQty === 0
          ? 'Saat ini unit aset sedang kosong / terpakai seluruhnya.'
          : `Stok saat ini hanya tersedia ${availableQty} unit.`,
      });
      return;
    }

    // 2. Cek bentrokan jadwal dengan peminjaman yang sudah APPROVED/ACTIVE
    if (borrowedAt && expectedReturnAt) {
      const conflictRes = await db.query(
        `SELECT COALESCE(SUM(quantity_borrowed), 0)::int AS reserved_qty
         FROM asset_loans
         WHERE asset_id = $1
           AND status IN ('APPROVED', 'ACTIVE')
           AND borrowed_at <= $3
           AND expected_return_at >= $2`,
        [assetId, borrowedAt, expectedReturnAt]
      );
      const reserved = conflictRes.rows[0]?.reserved_qty || 0;
      if (availableQty - reserved < requestedQty) {
        res.status(200).json({
          success: true,
          assetId: asset.id,
          assetName: asset.asset_name,
          isAvailable: false,
          availableQuantity: Math.max(0, availableQty - reserved),
          message: 'Aset sudah diagendakan untuk kegiatan lain pada rentang tanggal tersebut.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      assetId: asset.id,
      assetName: asset.asset_name,
      isAvailable: true,
      availableQuantity: availableQty,
      message: 'Aset siap dipinjam.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memvalidasi ketersediaan aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// PUBLIC 2: POST /public/request — Formulir Pengajuan Pinjaman/Sewa Aset (Anti-Hoarding & Anti-Spam)
// ----------------------------------------------------------------------------
router.post('/public/request', publicSubmissionRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      assetId,
      borrowerName,
      borrowerPhone,
      borrowerEmail,
      borrowerInstitution,
      loanPurpose,
      loanType,
      borrowedAt,
      expectedReturnAt,
      quantityBorrowed,
      notes,
    } = req.body;

    if (!assetId || !borrowerName || !borrowerPhone || !loanPurpose || !borrowedAt || !expectedReturnAt) {
      res.status(400).json({
        success: false,
        message: 'Aset, Nama Pemohon, No. WhatsApp/HP, Keperluan Acara, Tanggal Mulai, dan Tanggal Selesai wajib diisi.',
      });
      return;
    }

    const cleanPhone = String(borrowerPhone).trim().replace(/\s+/g, '');
    const phoneRegex = /^(\+62|62|0)8[0-9]{8,12}$/;
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp/HP tidak valid. Gunakan format nomor telepon Indonesia (contoh: 08123456789 atau +6281234567890).',
      });
      return;
    }

    if (new Date(expectedReturnAt) < new Date(borrowedAt)) {
      res.status(400).json({
        success: false,
        message: 'Tanggal/waktu pengembalian tidak boleh mendahului tanggal/waktu mulai peminjaman.',
      });
      return;
    }

    const assetRes = await db.query('SELECT * FROM assets WHERE id = $1', [assetId]);
    if (assetRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Aset yang dipilih tidak ditemukan.' });
      return;
    }

    const asset = assetRes.rows[0];
    if (!asset.is_borrowable) {
      res.status(400).json({ success: false, message: 'Aset ini bertanda internal dan tidak dapat dipinjam/disewa.' });
      return;
    }

    const qty = Math.max(1, parseInt(quantityBorrowed, 10) || 1);
    const availableQty = parseInt(asset.available_quantity, 10) || 0;
    if (availableQty < qty) {
      res.status(400).json({
        success: false,
        message: `Jumlah unit yang diminta (${qty}) melebihi kuota ketersediaan saat ini (${availableQty} unit).`,
      });
      return;
    }

    const isRent = String(loanType).toUpperCase() === 'SEWA';
    const type = isRent ? 'SEWA' : 'PINJAM';
    const fee = isRent ? (parseFloat(asset.rental_price) * qty || 0) : 0;

    // Generate Cryptographically Random & Unpredictable Request Code: REQ-AST-XXXX-XXXX
    let requestCode = generateSecureRequestCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const checkCode = await db.query('SELECT id FROM asset_loans WHERE request_code = $1', [requestCode]);
      if (checkCode.rows.length === 0) break;
      requestCode = generateSecureRequestCode();
    }

    // Note: status PENDING tidak langsung memotong available_quantity aset fisik.
    // Pemotongan stok riil dilakukan admin saat APPROVE untuk mencegah Denial of Inventory.
    await db.query(
      `INSERT INTO asset_loans (
        asset_id, borrower_name, borrower_phone, borrower_email, borrower_institution,
        loan_purpose, loan_type, rental_fee,
        borrowed_at, expected_return_at, quantity_borrowed, notes, status, request_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING', $13)`,
      [
        assetId,
        borrowerName.trim(),
        cleanPhone,
        borrowerEmail ? borrowerEmail.trim() : null,
        borrowerInstitution ? borrowerInstitution.trim() : null,
        loanPurpose.trim(),
        type,
        fee,
        borrowedAt,
        expectedReturnAt,
        qty,
        notes ? notes.trim() : null,
        requestCode,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Permohonan pinjaman aset berhasil dikirim. Silakan simpan nomor tiket untuk melacak progres.',
      requestCode,
      loan: {
        requestCode,
        assetName: asset.asset_name,
        borrowerName: borrowerName.trim(),
        loanType: type,
        borrowedAt,
        expectedReturnAt,
        quantityBorrowed: qty,
        status: 'PENDING',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengirim permohonan pinjaman aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// PUBLIC 3: GET /public/track — Lacak Progres Aman (2-Factor Verification: Tiket + 4 Digit WA)
// Mencegah enumerasi nomor tiket / pencurian data peminjam & agenda orang lain
// ----------------------------------------------------------------------------
const handleTrackRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = (req.query.code || req.params.query || '').toString().trim();
    const rawPhone = (req.query.phone || req.query.phoneSuffix || '').toString().trim();

    if (!rawCode) {
      res.status(400).json({
        success: false,
        message: 'Nomor tiket pengajuan wajib diisi (contoh: REQ-AST-XXXX-XXXX).',
      });
      return;
    }

    const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 4) {
      res.status(400).json({
        success: false,
        message: 'Untuk perlindungan privasi dan keamanan agenda, masukkan 4 digit terakhir nomor WhatsApp pemohon.',
      });
      return;
    }

    const phoneSuffix = cleanPhoneDigits.slice(-4);

    // Sanitized SELECT:
    // 1. TIDAK mengekspos: loan_purpose (agenda pribadi acara), rental_fee (nilai uang), location_room.
    // 2. Proteksi IDOR: Wajib cocok nomor tiket DAN 4 digit terakhir nomor WhatsApp terdaftar.
    const query = `
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
        -- PII Masking
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

    const result = await db.query(query, [rawCode, phoneSuffix, cleanPhoneDigits]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        count: 0,
        requests: [],
        message: 'Data permohonan tidak ditemukan. Pastikan kombinasi nomor tiket dan 4 digit terakhir nomor WhatsApp pemohon sudah cocok.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      count: result.rows.length,
      requests: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal melacak permohonan aset.', error: err.message });
  }
};

router.get('/public/track', handleTrackRequest);
router.get('/public/track/:query', handleTrackRequest);

// ============================================================================
// ADMIN / INTERNAL PROTECTED ROUTES
// ============================================================================
router.use(authenticateJwt);
router.use(authorizePermission('ASSETS'));

// ----------------------------------------------------------------------------
// 1. GET / — Daftar Seluruh Aset & Inventaris
// ----------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 50, maxLimit: 200 });
    const { condition, type, search } = req.query;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (cursor) {
      params.push(cursor);
      whereConditions.push(`a.asset_code > $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereConditions.push(`(a.asset_name ILIKE $${params.length} OR a.asset_code ILIKE $${params.length} OR a.location_room ILIKE $${params.length})`);
    }

    if (condition) {
      params.push(condition);
      whereConditions.push(`a.physical_condition = $${params.length}`);
    }

    if (type) {
      params.push(type);
      whereConditions.push(`a.asset_type = $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*)::int as total FROM assets a ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    let dataQuery = `
      SELECT a.*, sl.label as category_label
      FROM assets a
      LEFT JOIN system_lookups sl ON a.category_id = sl.id
      ${whereClause}
      ORDER BY a.asset_code ASC
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
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'asset_code');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      assets: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil inventaris aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. GET /loans — Daftar Transaksi Peminjaman & Penyewaan Aset
// ----------------------------------------------------------------------------
router.get('/loans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, loanType } = req.query;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      whereConditions.push(`al.status = $${params.length}`);
    }

    if (loanType) {
      params.push(loanType);
      whereConditions.push(`al.loan_type = $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
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

    const result = await db.query(query, params);
    res.status(200).json({
      success: true,
      count: result.rows.length,
      loans: result.rows,
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data peminjaman & sewa aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. POST /loans — Catat Peminjaman atau Penyewaan Baru (Kurangi Stok Tersedia)
// ----------------------------------------------------------------------------
router.post('/loans', async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const {
      assetId,
      borrowerName,
      borrowerPhone,
      borrowerMemberId,
      loanType,
      rentalFee,
      loanPurpose,
      borrowedAt,
      expectedReturnAt,
      quantityBorrowed,
      notes,
    } = req.body;

    if (!assetId || !borrowerName || !loanPurpose || !expectedReturnAt) {
      res.status(400).json({
        success: false,
        message: 'Aset, Nama Peminjam/Penyewa, Tujuan Kegiatan, dan Batas Waktu Pengembalian wajib diisi.',
      });
      return;
    }

    const qty = Math.max(1, parseInt(quantityBorrowed, 10) || 1);

    await client.query('BEGIN');

    // Check asset exists and available
    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Aset tidak ditemukan.' });
      return;
    }

    const asset = assetRes.rows[0];
    if (!asset.is_borrowable) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Aset ini bertanda Internal Saja dan tidak dapat dipinjam/disewa.' });
      return;
    }

    const available = parseInt(asset.available_quantity, 10) || 0;
    if (available < qty) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: `Jumlah unit tersedia tidak mencukupi. Tersedia saat ini: ${available} unit.`,
      });
      return;
    }

    const isRent = String(loanType).toUpperCase() === 'SEWA';
    const type = isRent ? 'SEWA' : 'PINJAM';
    const fee = isRent ? (parseFloat(rentalFee) || parseFloat(asset.rental_price) || 0) : 0;

    // Insert into asset_loans
    const loanInsert = await client.query(
      `INSERT INTO asset_loans (
        asset_id, borrower_name, borrower_phone, borrower_member_id,
        loan_purpose, loan_type, rental_fee,
        borrowed_at, expected_return_at, quantity_borrowed, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
      RETURNING *`,
      [
        assetId,
        borrowerName.trim(),
        borrowerPhone ? borrowerPhone.trim() : null,
        borrowerMemberId || null,
        loanPurpose.trim(),
        type,
        fee,
        borrowedAt || new Date().toISOString().split('T')[0],
        expectedReturnAt,
        qty,
        notes ? notes.trim() : null,
      ]
    );

    // Update asset available quantity & borrow status
    const newAvailable = available - qty;
    const newBorrowStatus = newAvailable <= 0 ? (isRent ? 'RENTED' : 'BORROWED') : 'AVAILABLE';

    await client.query(
      `UPDATE assets 
       SET available_quantity = $1, borrow_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newAvailable, newBorrowStatus, assetId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Pencatatan ${type === 'SEWA' ? 'penyewaan' : 'peminjaman'} aset berhasil disimpan.`,
      loan: loanInsert.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal mencatat peminjaman/sewa aset.', error: err.message });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------------------------
// 4. PUT /loans/:id/return — Pengembalian Aset / Selesai Sewa (Pulihkan Stok)
// ----------------------------------------------------------------------------
router.put('/loans/:id/return', async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { actualReturnAt, conditionOnReturn, notes } = req.body;

    await client.query('BEGIN');

    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [id]);
    if (loanRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Data transaksi peminjaman/sewa tidak ditemukan.' });
      return;
    }

    const loan = loanRes.rows[0];
    if (loan.status === 'RETURNED') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Aset ini sudah tercatat telah dikembalikan sebelumnya.' });
      return;
    }

    const returnDate = actualReturnAt || new Date().toISOString().split('T')[0];
    const returnCond = conditionOnReturn || 'GOOD';

    // Update loan
    const updatedLoanRes = await client.query(
      `UPDATE asset_loans
       SET status = 'RETURNED',
           actual_return_at = $1,
           condition_on_return = $2,
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [returnDate, returnCond, notes || null, id]
    );

    // Restore asset stock and update physical condition
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

    res.status(200).json({
      success: true,
      message: 'Aset berhasil dikembalikan ke inventaris yayasan.',
      loan: updatedLoanRes.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal memproses pengembalian aset.', error: err.message });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------------------------
// 4a. PUT /loans/:id/approve — Setujui Permohonan Pinjaman/Sewa oleh Admin
// ----------------------------------------------------------------------------
router.put('/loans/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { approvalNotes } = req.body;
    const adminUserId = req.user?.id || null;

    await client.query('BEGIN');
    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [id]);
    if (loanRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Permohonan pinjaman tidak ditemukan.' });
      return;
    }

    const loan = loanRes.rows[0];
    if (loan.status === 'APPROVED' || loan.status === 'ACTIVE') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Permohonan ini sudah disetujui sebelumnya.' });
      return;
    }

    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [loan.asset_id]);
    if (assetRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Aset terkait tidak ditemukan.' });
      return;
    }

    const asset = assetRes.rows[0];
    const qty = parseInt(loan.quantity_borrowed, 10) || 1;
    const available = parseInt(asset.available_quantity, 10) || 0;

    if (available < qty) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: `Stok aset tidak mencukupi untuk disetujui. Tersedia: ${available} unit, diminta: ${qty} unit.`,
      });
      return;
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
      [adminUserId, approvalNotes ? String(approvalNotes).trim() : 'Disetujui oleh pengurus yayasan. Aset siap diambil di kantor GMH.', id]
    );

    await client.query('COMMIT');
    res.status(200).json({
      success: true,
      message: `Permohonan pinjaman (${loan.request_code || 'ASET'}) berhasil disetujui.`,
      loan: updateRes.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal menyetujui permohonan pinjaman.', error: err.message });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------------------------
// 4b. PUT /loans/:id/reject — Tolak Permohonan Pinjaman/Sewa oleh Admin
// ----------------------------------------------------------------------------
router.put('/loans/:id/reject', async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminUserId = req.user?.id || null;

    if (!rejectionReason || !String(rejectionReason).trim()) {
      res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi oleh admin.' });
      return;
    }

    await client.query('BEGIN');
    const loanRes = await client.query('SELECT * FROM asset_loans WHERE id = $1 FOR UPDATE', [id]);
    if (loanRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Permohonan pinjaman tidak ditemukan.' });
      return;
    }

    const loan = loanRes.rows[0];

    // Jika sebelumnya sudah APPROVED, kembalikan stok
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
      [String(rejectionReason).trim(), adminUserId, id]
    );

    await client.query('COMMIT');
    res.status(200).json({
      success: true,
      message: `Permohonan pinjaman (${loan.request_code || 'ASET'}) telah ditolak.`,
      loan: updateRes.rows[0],
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal menolak permohonan pinjaman.', error: err.message });
  } finally {
    client.release();
  }
});

// ----------------------------------------------------------------------------
// 4c. PUT /loans/:id/handover — Tandai Barang Telah Diserahkan (Status Menjadi ACTIVE)
// ----------------------------------------------------------------------------
router.put('/loans/:id/handover', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateRes = await db.query(
      `UPDATE asset_loans
       SET status = 'ACTIVE',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'APPROVED'
       RETURNING *`,
      [id]
    );

    if (updateRes.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Hanya permohonan dengan status APPROVED yang dapat diserahterimakan.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Aset berhasil diserahterimakan kepada pemohon (Status aktif dipinjam).',
      loan: updateRes.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses serah terima aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4e. GET /:id — Detail Relasional Tunggal Aset Beserta Riwayat Sirkulasi Peminjaman
// ----------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assetRes = await db.query(
      `SELECT 
        a.*, 
        sl.label as category_label,
        sl.code as category_code
      FROM assets a
      LEFT JOIN system_lookups sl ON a.category_id = sl.id
      WHERE a.id::text = $1 OR a.asset_code = $1`,
      [id]
    );

    if (assetRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Aset tidak ditemukan dalam database.' });
      return;
    }

    const asset = assetRes.rows[0];

    const loansRes = await db.query(
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
      [asset.id]
    );

    res.status(200).json({
      success: true,
      asset: {
        ...asset,
        loans: loansRes.rows,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil detail aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. POST / — Mendaftarkan Aset Baru
// ----------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      assetName,
      categoryId,
      purchasePrice,
      physicalCondition,
      locationRoom,
      isBorrowable,
      quantity,
      assetType,
      rentalPrice,
      notes,
    } = req.body;

    if (!assetName || !assetName.trim()) {
      res.status(400).json({ success: false, message: 'Nama aset wajib diisi.' });
      return;
    }

    const countRes = await db.query(`SELECT COUNT(*)::int as cnt FROM assets`);
    const seq = String((countRes.rows[0]?.cnt || 0) + 1).padStart(3, '0');
    const assetCode = `AST-GMH-${seq}`;

    const totalQty = Math.max(1, parseInt(quantity, 10) || 1);

    const insertRes = await db.query(
      `INSERT INTO assets (
        asset_code, asset_name, category_id, purchase_date, purchase_price,
        physical_condition, location_room, is_borrowable,
        quantity, available_quantity, asset_type, rental_price, borrow_status, notes
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, 'AVAILABLE', $12)
      RETURNING *`,
      [
        assetCode,
        assetName.trim(),
        categoryId || null,
        purchasePrice ? parseFloat(purchasePrice) : 0,
        physicalCondition || 'GOOD',
        locationRoom || 'Gedung GMH',
        isBorrowable !== undefined ? Boolean(isBorrowable) : true,
        totalQty,
        totalQty,
        assetType || 'BARANG',
        rentalPrice ? parseFloat(rentalPrice) : 0,
        notes || null,
      ]
    );

    res.status(201).json({ success: true, message: 'Aset berhasil didaftarkan.', asset: insertRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mendaftarkan aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 6. PUT /:id — Mengubah Detail, Jumlah Stok, Kondisi, Tarif Sewa Aset
// ----------------------------------------------------------------------------
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      assetName,
      categoryId,
      purchasePrice,
      physicalCondition,
      locationRoom,
      isBorrowable,
      quantity,
      assetType,
      rentalPrice,
      notes,
    } = req.body;

    const currentAssetRes = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (currentAssetRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Aset tidak ditemukan.' });
      return;
    }

    const current = currentAssetRes.rows[0];
    const oldQty = parseInt(current.quantity, 10) || 1;
    const oldAvail = parseInt(current.available_quantity, 10) || 1;

    let newQty = oldQty;
    let newAvail = oldAvail;

    if (quantity !== undefined) {
      newQty = Math.max(1, parseInt(quantity, 10) || 1);
      const diff = newQty - oldQty;
      // Kunci di rentang [0, newQty] agar konsisten dengan CHECK constraint database.
      newAvail = Math.min(newQty, Math.max(0, oldAvail + diff));
    }

    const updateRes = await db.query(
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
        assetName !== undefined ? assetName.trim() : null,
        categoryId !== undefined ? (categoryId || null) : null,
        purchasePrice !== undefined ? parseFloat(purchasePrice) : null,
        physicalCondition || null,
        locationRoom !== undefined ? locationRoom.trim() : null,
        isBorrowable !== undefined ? Boolean(isBorrowable) : null,
        newQty,
        newAvail,
        assetType || null,
        rentalPrice !== undefined ? parseFloat(rentalPrice) : null,
        notes !== undefined ? notes : null,
        id,
      ]
    );

    res.status(200).json({ success: true, message: 'Data aset berhasil diperbarui.', asset: updateRes.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui aset.', error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. DELETE /:id — Hapus Aset dari Inventaris
// ----------------------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const activeLoans = await db.query(
      `SELECT COUNT(*)::int as count FROM asset_loans WHERE asset_id = $1 AND status = 'ACTIVE'`,
      [id]
    );
    if ((activeLoans.rows[0]?.count || 0) > 0) {
      res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus aset yang saat ini sedang aktif dipinjam atau disewa.',
      });
      return;
    }

    await db.query('DELETE FROM asset_loans WHERE asset_id = $1', [id]);
    const delRes = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);

    if (delRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Aset tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Aset berhasil dihapus dari inventaris.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal menghapus aset.', error: err.message });
  }
});

export default router;
