import { Router } from 'express';
import { getLookups, addLookup, deleteLookup, getFormConfigs, updateFieldLabel, getSystemMenus } from './utility.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';

const router = Router();

// Publicly read configs & lookups for frontend rendering
router.get('/system-menus', getSystemMenus);
router.get('/lookups', getLookups);
router.get('/form-configs', getFormConfigs);


// Admin-only mutation (Flow 5: Dynamic utility engine)
router.post('/lookups', authenticateJwt, requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN'), addLookup);
router.delete('/lookups/:id', authenticateJwt, requireRoles('SUPER_ADMIN'), deleteLookup);
router.put('/fields/config', authenticateJwt, requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN'), updateFieldLabel);

export default router;
