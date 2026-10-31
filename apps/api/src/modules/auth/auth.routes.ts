import { Router } from 'express';
import { login, getMe, getRoles, demoSwitchRole } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.get('/roles', getRoles);
router.post('/demo-switch', demoSwitchRole);
router.get('/me', authenticateJwt, getMe);

export default router;
