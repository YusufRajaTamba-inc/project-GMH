import { Router } from 'express';
import {
  publicRegisterAlumni,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
} from './registrations.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { authorizePermission } from '../../middleware/permission.middleware.js';

const router = Router();

// Flow 1: Public Self-Registration (Terbuka untuk umum tanpa autentikasi)
router.post('/public/register-alumni', publicRegisterAlumni);

// Admin-only review endpoints (Dilindungi oleh izin modul REGISTRATIONS)
router.use(authenticateJwt);
router.use(authorizePermission('REGISTRATIONS'));

router.get('/', getRegistrations);
router.post('/:id/approve', approveRegistration);
router.post('/:id/reject', rejectRegistration);

export default router;
