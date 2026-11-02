import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';

// ============================================================
// P1-C: Rate Limiting Middleware — Anti-Brute Force
// ============================================================

/**
 * express-rate-limit v8 hanya menyediakan satu varian header standar.
 * Kita memakai header modern (RateLimit-*) lalu menyalinnya ke header
 * lama (X-RateLimit-*) agar klien lama & monitoring tetap kompatibel.
 */
const withLegacyHeaders = (limiter: RequestHandler): RequestHandler => {
  const handler = limiter as RequestHandler & {
    headers?: (req: any, res: any) => void;
  };

  return (req: any, res: any, next: any) => {
    const originalWriteHead = res.writeHead;
    res.writeHead = function patchedWriteHead(this: any, ...args: any[]) {
      const limit = res.getHeader('RateLimit-Limit');
      const remaining = res.getHeader('RateLimit-Remaining');
      const reset = res.getHeader('RateLimit-Reset');

      if (limit !== undefined) res.setHeader('X-RateLimit-Limit', String(limit));
      if (remaining !== undefined) res.setHeader('X-RateLimit-Remaining', String(remaining));
      if (reset !== undefined) res.setHeader('X-RateLimit-Reset', String(reset));

      return originalWriteHead.apply(this, args as any);
    };

    return handler(req, res, next);
  };
};

/**
 * Strict rate limiter untuk endpoint autentikasi.
 * Batas: 5 percobaan login per 15 menit per IP.
 * Hanya percobaan GAGAL yang dihitung agar user sah tidak terkunci
 * setelah login berhasil berulang kali.
 */
export const authRateLimiter = withLegacyHeaders(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
    },
    skipSuccessfulRequests: true,
  })
);

/**
 * Rate limiter untuk endpoint demo-switch (perpindahan peran).
 * Mencegah penyalahgunaan endpoint yang menerbitkan sesi baru.
 */
export const demoSwitchRateLimiter = withLegacyHeaders(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Terlalu banyak permintaan perpindahan peran. Silakan coba lagi nanti.',
    },
  })
);

/**
 * General rate limiter untuk semua endpoint API.
 * Batas: 200 request per menit per IP.
 */
export const generalRateLimiter = withLegacyHeaders(
  rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Terlalu banyak request. Silakan tunggu sebentar.',
    },
  })
);

/**
 * Dedicated rate limiter untuk endpoint pengiriman data formulir publik
 * (registrasi alumni mandiri, permohonan pinjam aset, dan submit pokok doa).
 * Batas: 15 pengiriman formulir per 15 menit per IP untuk mencegah spam/bot/abuse.
 */
export const publicSubmissionRateLimiter = withLegacyHeaders(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Terlalu banyak permohonan yang dikirim dalam waktu singkat. Silakan coba lagi setelah 15 menit.',
    },
  })
);

// Re-export tipe agar route dapat membuat konfigurasi turunan bila diperlukan
export type RateLimitOptions = Options;
