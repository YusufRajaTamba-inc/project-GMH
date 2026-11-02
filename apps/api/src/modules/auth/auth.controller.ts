import { Request, Response } from 'express';
import { asyncHandler, validate } from '../../shared/index.js';
import { ENV } from '../../config/env.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import * as authService from './auth.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: ENV.COOKIE_SECURE,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: ENV.COOKIE_SECURE,
  sameSite: 'strict' as const,
  path: '/',
};

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input, req.ip, req.headers['user-agent']);

  res.cookie('gmh_auth_token', result.token, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: 'Login berhasil.',
    user: result.user,
    permissions: result.permissions,
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.getMe(req.user?.id, req.user?.username);
  res.status(200).json({ success: true, ...result });
});

export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const input = validate(changePasswordSchema, req.body);
  await authService.changePassword(req.user?.id, req.user?.username, input, req.ip, req.headers['user-agent']);
  res.status(200).json({
    success: true,
    message: 'Password akun berhasil diubah dan tersimpan di database.',
  });
});

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('gmh_auth_token', COOKIE_CLEAR_OPTIONS);
  res.status(200).json({ success: true, message: 'Logout berhasil.' });
};

export const getRoles = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const roles = await authService.getRoles();
  res.status(200).json({ success: true, roles });
});

export const demoSwitchRole = async (_req: Request, res: Response): Promise<void> => {
  res.status(403).json({
    success: false,
    message: 'Fitur demo role telah dinonaktifkan demi keamanan. Silakan login menggunakan akun resmi pengurus/staf yayasan.',
  });
};
