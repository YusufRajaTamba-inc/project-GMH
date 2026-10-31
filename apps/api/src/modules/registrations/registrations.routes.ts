import { Router } from 'express';
import {
  publicRegisterAlumni,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
} from './registrations.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';

const router = Router();

// Flow 1: Public Self-Registration
router.post('/public/register-alumni', publicRegisterAlumni);

// Admin-only review endpoints
router.get(
  '/',
  authenticateJwt,
  requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN', 'DEWAN_PENGAWAS_PEMBINA'),
  getRegistrations
);
router.post(
  '/:id/approve',
  authenticateJwt,
  requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN'),
  approveRegistration
);
router.post(
  '/:id/reject',
  authenticateJwt,
  requireRoles('SUPER_ADMIN', 'PENGURUS_HARIAN'),
  rejectRegistration
);

export default router;
