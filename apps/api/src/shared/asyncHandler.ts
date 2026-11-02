/**
 * Wrapper handler async (Fase 1 — Audit Infrastruktur).
 *
 * Menghilangkan pola try/catch repetitif di setiap route:
 *
 *   router.get('/x', authenticateJwt, async (req, res) => {
 *     try { ... } catch (err: any) {
 *       res.status(500).json({ success: false, message: '...', error: err.message });
 *     }
 *   });
 *
 * menjadi:
 *
 *   router.get('/x', authenticateJwt, asyncHandler(async (req, res) => {
 *     ...
 *   }));
 *
 * Error dilempar (termasuk `HttpError`) diteruskan ke central error
 * handler Express, sehingga format error konsisten di seluruh API.
 */
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { isHttpError } from './httpError.js';

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      next(err);
    });
  };
}

/**
 * Membungkus handler agar error HttpError tetap terlempar, error tak dikenal
 * dinormalisasi menjadi HttpError 500 dengan pesan generik.
 */
export function asyncHandlerSafe(fn: AsyncRequestHandler): RequestHandler {
  return asyncHandler(async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (isHttpError(err)) throw err;
      throw err;
    }
  });
}
