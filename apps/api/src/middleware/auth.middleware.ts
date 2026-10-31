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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (ENV.NODE_ENV === 'development') {
      req.user = {
        id: '31563344-ee08-4252-8cfa-7c1cd41910ca',
        username: 'superadmin',
        fullName: 'Super Administrator',
        roleId: 'SUPER_ADMIN',
        email: 'superadmin@gmhpakmk.org',
      };
      return next();
    }

    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi JWT tidak ditemukan.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (ENV.NODE_ENV === 'development') {
      req.user = {
        id: '31563344-ee08-4252-8cfa-7c1cd41910ca',
        username: 'superadmin',
        fullName: 'Super Administrator',
        roleId: 'SUPER_ADMIN',
        email: 'superadmin@gmhpakmk.org',
      };
      return next();
    }
    res.status(401).json({
      success: false,
      message: 'Sesi login telah kedaluwarsa atau token tidak valid.',
      error: err.message,
    });
  }
};
