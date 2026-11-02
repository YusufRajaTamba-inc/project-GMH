import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import { listAuditLogsQuerySchema } from './audit.schema.js';
import * as auditService from './audit.service.js';

export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(listAuditLogsQuerySchema, req.query);
  const result = await auditService.getAuditLogs(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});
