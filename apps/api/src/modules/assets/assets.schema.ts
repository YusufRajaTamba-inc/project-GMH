import { z } from 'zod';

const indonesianPhoneRegex = /^(\+62|62|0)8[0-9]{8,12}$/;

// ============================================================================
// PUBLIC ASSET SCHEMAS
// ============================================================================
export const checkAvailabilityQuerySchema = z.object({
  assetId: z.string().trim().min(1, 'ID aset wajib disertakan.'),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  borrowedAt: z.string().optional(),
  expectedReturnAt: z.string().optional(),
});

export const publicLoanRequestSchema = z
  .object({
    assetId: z.string().trim().min(1, 'ID aset wajib diisi.'),
    borrowerName: z.string().trim().min(1, 'Nama pemohon wajib diisi.').max(150),
    borrowerPhone: z
      .string()
      .trim()
      .transform((val) => val.replace(/\s+/g, ''))
      .refine(
        (val) => indonesianPhoneRegex.test(val),
        'Nomor WhatsApp/HP tidak valid. Gunakan format nomor telepon Indonesia (contoh: 08123456789 atau +6281234567890).'
      ),
    borrowerEmail: z.string().trim().email('Format email tidak valid.').max(120).nullable().optional(),
    borrowerInstitution: z.string().trim().max(150).nullable().optional(),
    loanPurpose: z.string().trim().min(1, 'Keperluan acara wajib diisi.').max(1000),
    loanType: z.string().trim().optional().default('PINJAM'),
    borrowedAt: z.string().min(1, 'Tanggal mulai peminjaman wajib diisi.'),
    expectedReturnAt: z.string().min(1, 'Tanggal pengembalian wajib diisi.'),
    quantityBorrowed: z.coerce.number().int().min(1, 'Jumlah unit minimal 1.').optional().default(1),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (data) => new Date(data.expectedReturnAt) >= new Date(data.borrowedAt),
    {
      message: 'Tanggal/waktu pengembalian tidak boleh mendahului tanggal/waktu mulai peminjaman.',
      path: ['expectedReturnAt'],
    }
  );

export const trackLoanQuerySchema = z.object({
  code: z.string().trim().min(1, 'Nomor tiket pengajuan wajib diisi (contoh: REQ-AST-XXXX-XXXX).'),
  phone: z
    .string()
    .trim()
    .min(4, 'Untuk perlindungan privasi dan keamanan agenda, masukkan minimal 4 digit terakhir nomor WhatsApp pemohon.'),
});

// ============================================================================
// ADMIN ASSET & LOAN SCHEMAS
// ============================================================================
export const createAdminLoanSchema = z.object({
  assetId: z.string().trim().min(1, 'Aset wajib dipilih.'),
  borrowerName: z.string().trim().min(1, 'Nama peminjam/penyewa wajib diisi.').max(150),
  borrowerPhone: z.string().trim().max(30).nullable().optional(),
  borrowerMemberId: z.string().uuid().nullable().optional(),
  loanType: z.string().trim().optional().default('PINJAM'),
  rentalFee: z.coerce.number().min(0).optional(),
  loanPurpose: z.string().trim().min(1, 'Tujuan kegiatan wajib diisi.').max(1000),
  borrowedAt: z.string().optional(),
  expectedReturnAt: z.string().min(1, 'Batas waktu pengembalian wajib diisi.'),
  quantityBorrowed: z.coerce.number().int().min(1).optional().default(1),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const returnLoanSchema = z.object({
  actualReturnAt: z.string().optional(),
  conditionOnReturn: z.string().trim().optional().default('GOOD'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const approveLoanSchema = z.object({
  approvalNotes: z.string().trim().max(1000).optional(),
});

export const rejectLoanSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Alasan penolakan wajib diisi oleh admin.').max(1000),
});

export const createAssetSchema = z.object({
  assetName: z.string().trim().min(1, 'Nama aset wajib diisi.').max(200),
  categoryId: z.string().trim().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  physicalCondition: z.string().trim().optional().default('GOOD'),
  locationRoom: z.string().trim().max(150).optional().default('Gedung GMH'),
  isBorrowable: z.preprocess((val) => val === undefined ? true : Boolean(val), z.boolean()).optional().default(true),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  assetType: z.string().trim().optional().default('BARANG'),
  rentalPrice: z.coerce.number().min(0).optional().default(0),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateAssetSchema = z.object({
  assetName: z.string().trim().min(1).max(200).optional(),
  categoryId: z.string().trim().nullable().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  physicalCondition: z.string().trim().optional(),
  locationRoom: z.string().trim().max(150).optional(),
  isBorrowable: z.preprocess((val) => val === undefined ? undefined : Boolean(val), z.boolean().optional()),
  quantity: z.coerce.number().int().min(1).optional(),
  assetType: z.string().trim().optional(),
  rentalPrice: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CheckAvailabilityQuery = z.infer<typeof checkAvailabilityQuerySchema>;
export type PublicLoanRequestInput = z.infer<typeof publicLoanRequestSchema>;
export type TrackLoanQuery = z.infer<typeof trackLoanQuerySchema>;
export type CreateAdminLoanInput = z.infer<typeof createAdminLoanSchema>;
export type ReturnLoanInput = z.infer<typeof returnLoanSchema>;
export type ApproveLoanInput = z.infer<typeof approveLoanSchema>;
export type RejectLoanInput = z.infer<typeof rejectLoanSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
