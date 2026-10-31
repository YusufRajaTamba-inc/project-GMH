import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  bulkImportDryRun,
  bulkImportCommit,
} from './members.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', getMembers);
router.get('/:id', getMemberById);

// Admin-only mutations
router.post('/', requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'ADMIN_OPERASIONAL'), createMember);
router.put('/:id', requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'ADMIN_OPERASIONAL'), updateMember);
router.delete('/:id', requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'ADMIN_OPERASIONAL'), deleteMember);
router.post('/bulk-dry-run', requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'ADMIN_OPERASIONAL'), bulkImportDryRun);
router.post('/bulk-commit', requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'ADMIN_OPERASIONAL'), bulkImportCommit);

export default router;
