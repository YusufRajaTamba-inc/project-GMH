import { Request, Response, NextFunction } from 'express';

/**
 * Redaksi error internal pada response JSON.
 *
 * Latar belakang: banyak modul aplikasi mengembalikan pesan kesalahan teknis
 * (`err.message`) pada field `error`, misalnya detail constraint PostgreSQL,
 * nama kolom, atau nama tabel. Di production, field tersebut membocorkan
 * struktur internal database ke klien. Middleware ini memusatkan perbaikannya:
 * - production  -> field `error` dihapus; field `message` tetap informatif
 * - non-production -> apa adanya, agar developer lokal bisa debug
 *
 * Detail error asli tetap tercatat di log server melalui console.error
 * pada masing-masing blok catch.
 */
export function sanitizeErrorResponse(_req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'production') {
    const originalJson = res.json.bind(res);
    res.json = ((body: any) => {
      if (body && typeof body === 'object' && !Array.isArray(body) && 'error' in body) {
        const { error, ...rest } = body;
        return originalJson(rest);
      }
      return originalJson(body);
    }) as typeof res.json;
  }
  next();
}
