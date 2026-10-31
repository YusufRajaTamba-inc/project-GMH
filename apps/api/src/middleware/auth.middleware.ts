import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  // P1-A: Baca token dari HttpOnly Cookie (prioritas utama), fallback ke Bearer header
  const cookieToken = req.cookies?.gmh_auth_token;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Sesi tidak ditemukan. Silakan login kembali.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (_err: any) {
    // Hapus cookie yang tidak valid dengan atribut cookie yang sama
    res.clearCookie('gmh_auth_token', {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.status(401).json({
      success: false,
      message: 'Sesi login telah kedaluwarsa atau tidak valid. Silakan login kembali.',
    });
  }
};
