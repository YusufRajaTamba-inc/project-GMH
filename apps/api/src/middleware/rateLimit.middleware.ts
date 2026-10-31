import rateLimit from 'express-rate-limit';

// ============================================================
// P1-C: Rate Limiting Middleware — Anti-Brute Force
// ============================================================

/**
 * Strict rate limiter for authentication endpoints.
 * Batas: 5 percobaan login per 15 menit per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
  },
  skipSuccessfulRequests: true, // Hanya hitung percobaan yang GAGAL
});

/**
 * General rate limiter for all API endpoints.
 * Batas: 200 request per menit per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak request. Silakan tunggu sebentar.',
  },
});
