import { Router } from 'express';
import {
  getStaffList,
  getPayrollRecords,
  generateDraft,
  disbursePayroll,
} from './payroll.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';

const router = Router();

// Flow 4: Strict Payroll Guard - Only Bendahara Yayasan, Dewan Pengawas, & Super Admin
router.use(authenticateJwt);
router.use(requireRoles('BENDAHARA_YAYASAN', 'DEWAN_PENGAWAS_PEMBINA', 'SUPER_ADMIN'));

router.get('/staff', getStaffList);
router.get('/records/:periodId', getPayrollRecords);
router.post('/generate-draft', generateDraft);
router.post('/disburse', disbursePayroll);

export default router;
