import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/foundationos',
  JWT_SECRET: process.env.JWT_SECRET || 'gmh-pa-kmk-super-secret-jwt-key-2026-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(','),
};
