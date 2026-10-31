import { Router } from 'express';
import { getDashboardSummary } from './dashboard.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/summary', authenticateJwt, getDashboardSummary);

export default router;
