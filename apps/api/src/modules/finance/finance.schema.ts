import { z } from 'zod';

export const createTransactionSchema = z.object({
  transactionDate: z.string().optional(),
  transactionType: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipe transaksi harus INCOME atau EXPENSE.' }),
  }),
  accountId: z.string().trim().min(1, 'Akun COA wajib diisi.'),
  amount: z.coerce.number().positive('Nominal transaksi harus lebih besar dari 0.'),
  paymentMethod: z.string().trim().optional().default('BANK_TRANSFER'),
  scope: z.string().trim().optional().default('OPERASIONAL'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateTransactionSchema = z.object({
  transactionDate: z.string().optional(),
  transactionType: z.enum(['INCOME', 'EXPENSE']).optional(),
  accountId: z.string().trim().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  paymentMethod: z.string().trim().optional(),
});

export const createPledgeSchema = z.object({
  donorName: z.string().trim().max(150).optional(),
  memberId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(150).optional().default('Pembangunan Rumah Persekutuan'),
  type: z.string().trim().optional().default('PLEDGE'),
  totalAmount: z.coerce.number().positive('Total komitmen donasi harus lebih besar dari 0.'),
  initialPayment: z.coerce.number().min(0).optional().default(0),
  paymentMethod: z.string().trim().optional().default('BANK_TRANSFER'),
  dueDate: z.string().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const addPledgeInstallmentSchema = z.object({
  amount: z.coerce.number().positive('Nominal angsuran harus lebih besar dari 0.'),
  date: z.string().optional(),
  paymentMethod: z.string().trim().optional().default('BANK_TRANSFER'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const recordDonationPaymentSchema = z.object({
  donorName: z.string().trim().min(1, 'Nama donatur wajib diisi.').max(150),
  pledgeId: z.string().uuid().nullable().optional(),
  category: z.string().trim().max(150).optional().default('Pembangunan Rumah Persekutuan'),
  amount: z.coerce.number().positive('Nominal pembayaran donasi harus lebih besar dari 0.'),
  type: z.string().trim().optional().default('DONATION'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const batchCreateTransactionsSchema = z.object({
  rows: z.array(
    z.object({
      date: z.string().optional(),
      type: z.string().optional(),
      transactionType: z.string().optional(),
      account: z.string().optional(),
      accountId: z.string().optional(),
      amount: z.coerce.number().min(0),
      paymentMethod: z.string().optional(),
      desc: z.string().optional(),
      notes: z.string().optional(),
      party: z.string().optional(),
    })
  ).min(1, 'Daftar transaksi mutasi kas wajib disertakan.'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreatePledgeInput = z.infer<typeof createPledgeSchema>;
export type AddPledgeInstallmentInput = z.infer<typeof addPledgeInstallmentSchema>;
export type RecordDonationPaymentInput = z.infer<typeof recordDonationPaymentSchema>;
export type BatchCreateTransactionsInput = z.infer<typeof batchCreateTransactionsSchema>;
