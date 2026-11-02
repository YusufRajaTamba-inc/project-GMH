import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// Jejak audit bersifat sensitif (mengandung nilai sebelum/sesudah perubahan data),
// sehingga hanya operator yang memiliki modul AUDIT_LOGS yang boleh membacanya.
router.use(authenticateJwt);
router.use(authorizePermission('AUDIT_LOGS'));

router.get('/', getAuditLogs);

export default router;
