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

const router = Router();

// Public verification for QR Scanner
router.get('/e-receipt/verify/:receiptNumber', verifyReceipt);

// Protected endpoints
router.use(authenticateJwt);

router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.post('/transactions/batch', batchCreateTransactions);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', deleteTransaction);
router.get('/audit-logs', getFinanceAuditLogs);
router.get('/accounts', getChartOfAccounts);

// Flow 3: Pledges & Donations
router.get('/donations', getPledgesAndDonations);
router.post('/donations', createPledge);
router.get('/donations/:id', getPledgeDetail);
router.post('/donations/:id/installments', addPledgeInstallment);
router.get('/members/:memberId/donations', getMemberDonations);

// Central Treasury / Donations Entry
router.post(
  '/donations/payment',
  requireRoles('SUPER_ADMIN', 'BENDAHARA_YAYASAN', 'PENGURUS_HARIAN'),
  recordDonationPayment
);

export default router;
