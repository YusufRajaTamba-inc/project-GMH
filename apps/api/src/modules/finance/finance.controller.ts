import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/index.js';
import { parsePagination, formatPaginationMeta } from '../../shared/pagination.js';
import {
  getTransactions as listTransactionsService,
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
  getChartOfAccounts as getChartOfAccountsService,
  getPledgesAndDonations as getPledgesAndDonationsService,
  getPledgeDetail as getPledgeDetailService,
  createPledge as createPledgeService,
  addPledgeInstallment as addPledgeInstallmentService,
  getMemberDonations as getMemberDonationsService,
  recordDonationPayment as recordDonationPaymentService,
  verifyReceipt as verifyReceiptService,
  getFinanceAuditLogs as getFinanceAuditLogsService,
  batchCreateTransactions as batchCreateTransactionsService,
} from './finance.service.js';

export const getTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { scope, type, accountId } = req.query;
  const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 15, maxLimit: 100 });

  const { rows, total, summary } = await listTransactionsService({
    roleId: req.user?.roleId,
    scope: scope ? String(scope) : undefined,
    type: type ? String(type) : undefined,
    accountId: accountId ? String(accountId) : undefined,
    cursor: cursor ? String(cursor) : undefined,
    page,
    limit,
    offset,
  });

  const pagination = formatPaginationMeta(rows, total, page, limit, 'transaction_date');

  res.status(200).json({
    success: true,
    count: rows.length,
    summary,
    transactions: rows,
    data: rows,
    pagination,
  });
});

export const createTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { transactionCode, transaction } = await createTransactionService(
    req.user?.id,
    req.user?.roleId,
    req.body
  );

  res.status(201).json({
    success: true,
    message: `Transaksi kas ${transactionCode} berhasil dicatat.`,
    transaction,
  });
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const updated = await updateTransactionService(req.params.id, req.user?.id, req.body);
  res.status(200).json({
    success: true,
    message: `Transaksi ${updated.transaction_code} berhasil diperbarui.`,
    transaction: updated,
  });
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tx = await deleteTransactionService(req.params.id, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Transaksi ${tx.transaction_code || req.params.id} berhasil dihapus.`,
  });
});

export const getChartOfAccounts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const accounts = await getChartOfAccountsService();
  res.status(200).json({ success: true, accounts });
});

export const getPledgesAndDonations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });
  const { rows, total, buildingProject } = await getPledgesAndDonationsService({
    cursor: cursor ? String(cursor) : undefined,
    limit,
    offset,
  });

  const pagination = formatPaginationMeta(rows, total, page, limit, 'created_at');

  res.status(200).json({
    success: true,
    count: rows.length,
    pledges: rows,
    donations: rows,
    data: rows,
    buildingProject,
    pagination,
  });
});

export const getPledgeDetail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const detail = await getPledgeDetailService(req.params.id);
  res.status(200).json({
    success: true,
    ...detail,
  });
});

export const createPledge = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { finalDonorName, pledge, receipt } = await createPledgeService(
    req.user?.id,
    req.ip,
    req.headers['user-agent'],
    req.body
  );

  res.status(201).json({
    success: true,
    message: `Komitmen donasi untuk ${finalDonorName} berhasil dicatat!`,
    pledge,
    receipt,
  });
});

export const addPledgeInstallment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { paymentAmount, receiptNumber, pledge, installment, receipt } = await addPledgeInstallmentService(
    req.params.id,
    req.user?.id,
    req.ip,
    req.headers['user-agent'],
    req.body
  );

  res.status(201).json({
    success: true,
    message: `Angsuran Rp ${paymentAmount.toLocaleString('id-ID')} berhasil dicatat! No Kuitansi: ${receiptNumber}`,
    pledge,
    installment,
    receipt,
  });
});

export const getMemberDonations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await getMemberDonationsService(req.params.memberId);
  res.status(200).json({
    success: true,
    ...data,
  });
});

export const recordDonationPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber, receipt } = await recordDonationPaymentService(
    req.user?.id,
    req.ip,
    req.headers['user-agent'],
    req.body
  );

  res.status(201).json({
    success: true,
    message: `Donasi berhasil dicatat dan terintegrasi ke kas yayasan. E-Kuitansi diterbitkan: ${receiptNumber}`,
    receipt,
  });
});

export const verifyReceipt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await verifyReceiptService(req.params.receiptNumber);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getFinanceAuditLogs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const logs = await getFinanceAuditLogsService();
  res.status(200).json({ success: true, count: logs.length, logs });
});

export const batchCreateTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await batchCreateTransactionsService(req.user?.id, req.body);
  res.status(201).json({
    success: true,
    message: `Berhasil mengimpor ${result.count} transaksi ke database buku jurnal kas.`,
    count: result.count,
    transactions: result.transactions,
  });
});
