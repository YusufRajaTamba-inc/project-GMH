import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  listStaffQuerySchema,
  generateDraftSchema,
  disbursePayrollSchema,
} from './payroll.schema.js';
import * as payrollService from './payroll.service.js';

export const getStaffList = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(listStaffQuerySchema, req.query);
  const result = await payrollService.getStaffList(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getPayrollRecords = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const periodId = (req.params.periodId || '2026-10').trim();
  const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  const result = await payrollService.getPayrollRecords(periodId, { page, limit, cursor });
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const generateDraft = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { periodId } = validate(generateDraftSchema, req.body || {});
  const result = await payrollService.generateDraft(periodId, req.user?.id);
  res.status(201).json({
    success: true,
    message: `Draft penggajian periode ${result.period} berhasil di-generate untuk ${result.count} staf/misionaris.`,
  });
});

export const disbursePayroll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { periodId } = validate(disbursePayrollSchema, req.body || {});
  const result = await payrollService.disbursePayroll(periodId, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Finalisasi penggajian periode ${result.period} berhasil! Total Rp ${result.totalPayout.toLocaleString('id-ID')} telah diposting otomatis ke buku kas yayasan.`,
    disbursement: result,
  });
});
