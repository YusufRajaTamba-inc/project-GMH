import { Router } from 'express';
import {
  getTransactions,
  createTransaction,
  batchCreateTransactions,
  updateTransaction,
  deleteTransaction,
  getFinanceAuditLogs,
  getChartOfAccounts,
  getPledgesAndDonations,
  getPledgeDetail,
  createPledge,
  addPledgeInstallment,
  getMemberDonations,
  recordDonationPayment,
  verifyReceipt,
} from './finance.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// Public verification for QR Scanner (tanpa autentikasi)
router.get('/e-receipt/verify/:receiptNumber', verifyReceipt);

// Protected endpoints
router.use(authenticateJwt);

// Kas Operasional Yayasan (FINANCE_OPERATIONAL)
router.get('/transactions', authorizePermission('FINANCE_OPERATIONAL'), getTransactions);
router.post('/transactions', authorizePermission('FINANCE_OPERATIONAL'), createTransaction);
router.post('/transactions/batch', authorizePermission('FINANCE_OPERATIONAL'), batchCreateTransactions);
router.put('/transactions/:id', authorizePermission('FINANCE_OPERATIONAL'), updateTransaction);
router.delete('/transactions/:id', authorizePermission('FINANCE_OPERATIONAL'), deleteTransaction);
router.get('/audit-logs', authorizePermission('FINANCE_OPERATIONAL'), getFinanceAuditLogs);
router.get('/accounts', authorizePermission(['FINANCE_OPERATIONAL', 'FINANCE_DONATIONS']), getChartOfAccounts);

// Donasi & Janji Iman (FINANCE_DONATIONS)
router.get('/donations', authorizePermission('FINANCE_DONATIONS'), getPledgesAndDonations);
router.post('/donations', authorizePermission('FINANCE_DONATIONS'), createPledge);
router.get('/donations/:id', authorizePermission('FINANCE_DONATIONS'), getPledgeDetail);
router.post('/donations/:id/installments', authorizePermission('FINANCE_DONATIONS'), addPledgeInstallment);
router.get('/members/:memberId/donations', authorizePermission('FINANCE_DONATIONS'), getMemberDonations);

// Central Treasury / Donations Entry
router.post(
  '/donations/payment',
  authorizePermission('FINANCE_DONATIONS'),
  requireRoles('SUPER_ADMIN', 'BENDAHARA_YAYASAN', 'PENGURUS_HARIAN'),
  recordDonationPayment
);

export default router;
