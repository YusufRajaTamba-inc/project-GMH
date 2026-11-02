import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  getLookupsQuerySchema,
  addLookupSchema,
  getFormConfigsQuerySchema,
  updateFieldLabelSchema,
} from './utility.schema.js';
import * as utilityService from './utility.service.js';

export const SYSTEM_MENUS = utilityService.SYSTEM_MENUS;
export const CATEGORY_CANONICAL_MAP = utilityService.CATEGORY_CANONICAL_MAP;
export const CATEGORY_ALIASES = utilityService.CATEGORY_ALIASES;

export const getSystemMenus = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: SYSTEM_MENUS,
    menus: SYSTEM_MENUS,
  });
};

export const getLookups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(getLookupsQuerySchema, req.query);
  const result = await utilityService.getLookups(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const addLookup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(addLookupSchema, req.body);
  const result = await utilityService.addLookup(input, req.user?.id);
  res.status(201).json({
    success: true,
    message: `Lookup [${result.lookup.label}] berhasil disimpan ke menu ${result.menu} (kategori ${result.canonicalCategory}).`,
    lookup: result.lookup,
    data: result.data,
  });
});

export const deleteLookup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await utilityService.deleteLookup(req.params.id, req.user?.id);
  res.status(200).json({ success: true, message: 'Lookup berhasil dinonaktifkan.' });
});

export const getFormConfigs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(getFormConfigsQuerySchema, req.query);
  const result = await utilityService.getFormConfigs(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const updateFieldLabel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(updateFieldLabelSchema, req.body);
  const result = await utilityService.updateFieldLabel(input, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Label kolom [${result.fieldLabel}] di menu ${result.mod} berhasil diperbarui.`,
    config: result.config,
    data: result.data,
  });
});
