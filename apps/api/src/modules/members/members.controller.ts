import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import {
  listMembersQuerySchema,
  createMemberSchema,
  updateMemberSchema,
  bulkImportDryRunSchema,
  bulkImportCommitSchema,
} from './members.schema.js';
import * as membersService from './members.service.js';

export const getMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filters = validate(listMembersQuerySchema, req.query);
  const result = await membersService.getMembers(filters);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const getMemberById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const member = await membersService.getMemberById(req.params.id);
  res.status(200).json({ success: true, member });
});

export const createMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(createMemberSchema, req.body);
  const result = await membersService.createMember(input, req.user?.id);
  res.status(201).json({
    success: true,
    message: `Anggota berhasil ditambahkan dengan NIA: ${result.memberNumber}`,
    member: result.member,
  });
});

export const bulkImportDryRun = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(bulkImportDryRunSchema, req.body);
  const result = await membersService.bulkImportDryRun(input);
  res.status(200).json({
    success: true,
    ...result,
  });
});

export const bulkImportCommit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(bulkImportCommitSchema, req.body);
  const result = await membersService.bulkImportCommit(input, req.user?.id);
  res.status(201).json({
    success: true,
    message: `Berhasil mengimpor batch ${result.importedCount} data alumni ke database yayasan! (${result.skippedCount} data dengan NIK sama dilewati).`,
    ...result,
  });
});

export const updateMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(updateMemberSchema, req.body);
  const updated = await membersService.updateMember(req.params.id, input, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Data anggota ${updated.full_name} berhasil diperbarui.`,
    member: updated,
  });
});

export const deleteMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const deleted = await membersService.deleteMember(req.params.id, req.user?.id);
  res.status(200).json({
    success: true,
    message: `Data anggota ${deleted.full_name} (${deleted.member_number}) telah dihapus.`,
  });
});
