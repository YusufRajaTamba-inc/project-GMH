import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  publicRegisterAlumniSchema,
  listRegistrationsQuerySchema,
  rejectRegistrationSchema,
} from './registrations.schema.js';
import * as registrationsService from './registrations.service.js';

export const publicRegisterAlumni = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(publicRegisterAlumniSchema, req.body);
  const ticket = await registrationsService.publicRegisterAlumni(input, req.body);
  res.status(201).json({
    success: true,
    message: 'Pendaftaran alumni berhasil dikirim dan masuk antrean verifikasi pengurus yayasan.',
    ticket,
  });
});

export const getRegistrations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(listRegistrationsQuerySchema, req.query);
  const result = await registrationsService.getRegistrations(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const approveRegistration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await registrationsService.approveRegistration(req.params.id, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Pendaftaran berhasil disetujui! NIA Resmi diterbitkan: ${result.memberNumber}`,
    member: {
      id: result.memberId,
      memberNumber: result.memberNumber,
      nia: result.memberNumber,
      fullName: result.fullName,
      faculty: result.faculty,
      entryYear: result.entryYear,
    },
  });
});

export const rejectRegistration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { reason } = validate(rejectRegistrationSchema, req.body || {});
  const registration = await registrationsService.rejectRegistration(req.params.id, reason, req.user?.id);
  res.status(200).json({
    success: true,
    message: 'Pendaftaran telah ditolak.',
    registration,
  });
});
