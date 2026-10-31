import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';
import { logAudit } from './audit.interceptor.js';

/**
 * Middleware untuk otorisasi akses modul berbasis database role_permissions.
 * Mendukung single module_key atau array module_keys (salah satu diizinkan).
 */
export const authorizePermission = (requiredModule: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user || !user.id || !user.roleId) {
        res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          message: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan login kembali.',
        });
        return;
      }

      // Super Admin selalu memiliki akses tak terbatas ke semua API
      if (user.roleId === 'SUPER_ADMIN') {
        next();
        return;
      }

      const modules = Array.isArray(requiredModule) ? requiredModule : [requiredModule];

      // Query database role_permissions untuk peran pengguna saat ini
      const permRes = await db.query(
        `SELECT module_key, can_access 
         FROM role_permissions 
         WHERE role_id = $1 AND module_key = ANY($2::text[]) AND can_access = true`,
        [user.roleId, modules]
      );

      if (permRes.rows.length > 0) {
        // Pengguna memiliki izin untuk salah satu modul yang diminta
        next();
        return;
      }

      // Akses ditolak: Catat ke audit trail log keamanan
      await logAudit(
        user.id,
        'UNAUTHORIZED_API_BLOCKED',
        'role_permissions',
        modules.join(','),
        null,
        {
          roleId: user.roleId,
          attemptedModules: modules,
          path: req.originalUrl,
          method: req.method,
        },
        req.ip,
        req.headers['user-agent']
      );

      res.status(403).json({
        success: false,
        code: 'FORBIDDEN_MODULE_ACCESS',
        message: `Akses Ditolak: Peran "${user.roleId}" tidak memiliki hak akses ke modul API "${modules.join(', ')}".`,
        requiredModules: modules,
      });
    } catch (err: any) {
      console.error('[AuthorizePermission Error]', err);
      res.status(500).json({
        success: false,
        message: 'Gagal memverifikasi hak akses pengguna.',
        error: err.message,
      });
    }
  };
};
