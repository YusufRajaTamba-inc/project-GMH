import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import { consolidatedReportQuerySchema } from './reports.schema.js';
import * as reportsService from './reports.service.js';

export const getConsolidatedReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(consolidatedReportQuerySchema, req.query);
  const data = await reportsService.getConsolidatedReport(filters);
  res.json({ success: true, data });
});
