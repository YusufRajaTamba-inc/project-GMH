import dotenv from 'dotenv';
dotenv.config();

/**
 * Daftar origin yang diizinkan untuk CORS.
 * Mendukung dua nama variabel agar kompatibel dengan konfigurasi lama:
 * - ALLOWED_ORIGIN (disarankan, sesuai roadmap P1-B)
 * - CORS_ORIGIN  (fallback)
 */
const parseOrigins = (raw: string | undefined): string[] =>
  (raw || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const configuredOrigins = [
  ...parseOrigins(process.env.ALLOWED_ORIGIN),
  ...parseOrigins(process.env.CORS_ORIGIN),
];

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const isProduction = process.env.NODE_ENV === 'production';

// Di production, origin wajib berasal dari env (whitelist). Tidak ada fallback localhost.
const resolvedOrigins = configuredOrigins.length
  ? configuredOrigins
  : isProduction
    ? []
    : DEV_ORIGINS;

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/foundationos',
  JWT_SECRET: process.env.JWT_SECRET || 'gmh-pa-kmk-super-secret-jwt-key-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: resolvedOrigins,
  ALLOWED_ORIGIN: resolvedOrigins,
  IS_PRODUCTION: isProduction,
  // Cookie JWT hanya boleh dikirim lewat HTTPS. Set COOKIE_SECURE=false
  // sementara bila aplikasi belum memakai TLS (mis. uji coba lewat IP).
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
};
