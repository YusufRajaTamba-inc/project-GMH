import { Request, Response, NextFunction } from 'express';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Pengguna belum terautentikasi.',
      });
      return;
    }

    const userRole = req.user.roleId;

    if (!allowedRoles.includes(userRole)) {
      // Custom informative message for payroll isolation
      if (allowedRoles.includes('BENDAHARA_YAYASAN') && !allowedRoles.includes('BENDAHARA_ADMIN')) {
        res.status(403).json({
          success: false,
          code: 'PAYROLL_ACCESS_DENIED',
          message:
            'Akses Ditolak: Modul Penggajian (Payroll) bersifat rahasia dan hanya dapat diakses oleh Bendahara Yayasan dan Dewan Pengawas.',
        });
        return;
      }

      res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Akses ditolak. Peran '${userRole}' tidak memiliki izin untuk fitur ini. Izin yang diperlukan: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
};
