import { Router } from 'express';
import { getConsolidatedReport } from './reports.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
const router = Router();
router.use(authenticateJwt);
router.get('/consolidated', getConsolidatedReport);
export default router;
