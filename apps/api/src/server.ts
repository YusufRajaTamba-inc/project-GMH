import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { authRateLimiter, generalRateLimiter } from './middleware/rateLimit.middleware.js';
import { db } from './config/db.js';
import { authenticateJwt } from './middleware/auth.middleware.js';
import { authorizePermission } from './middleware/permission.middleware.js';
import { sanitizeErrorResponse } from './middleware/sanitizeError.middleware.js';

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
import utilityRoutes from './modules/utility/utility.routes.js';
import registrationsRoutes from './modules/registrations/registrations.routes.js';
import membersRoutes from './modules/members/members.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import payrollRoutes from './modules/payroll/payroll.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import buildingRoutes from './modules/building/building.routes.js';
import programsRoutes from './modules/programs/programs.routes.js';
import missionsRoutes from './modules/missions/missions.routes.js';
import prayerRoutes from './modules/prayer/prayer.routes.js';
import assetsRoutes from './modules/assets/assets.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import organizationRoutes from './modules/organization/organization.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import secretariatRoutes from './modules/secretariat/secretariat.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// P1-A: Security headers (helmet).
// CSP dimatikan karena backend ini hanya melayani JSON (bukan HTML),
// sedangkan frontend Vite berdiri di origin terpisah dan punya CSP sendiri.
// CORP dilonggarkan ke cross-origin agar respons API tetap bisa dibaca
// oleh origin frontend yang berbeda (kebalikan dari default same-origin).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  })
);

// Percaya 1 hop reverse proxy (nginx container "web") di depan Express.
// Tanpa ini, req.ip selalu berisi IP nginx sehingga rate limiter
// menghitung semua user sebagai satu IP. Jangan set true: client
// bisa memalsukan X-Forwarded-For untuk melewati rate limit.
app.set('trust proxy', 1);

// Disable ETag generation to completely eliminate HTTP 304 Not Modified responses
app.disable('etag');
app.set('etag', false);

// Global No-Cache Header Middleware
// Enforces standard HTTP status codes (200 OK, 201 Created, 400, 401, 403, 404, 500, 501)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Redaksi pesan error internal (detail SQL/kolom) pada response production.
app.use(sanitizeErrorResponse);

// Correlation ID per request: memudahkan penelusuran log server saat terjadi error.
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id']?.toString() || Math.random().toString(36).slice(2, 12);
  res.setHeader('X-Request-Id', requestId);
  next();
});

// P1-B: CORS Strict — hanya izinkan origin yang terdaftar
app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (curl, Postman, health check monitor)
    if (!origin) return callback(null, true);
    if (ENV.ALLOWED_ORIGIN.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`));
  },
  credentials: true, // Wajib untuk HttpOnly Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));

// Cookie parser (untuk HttpOnly Cookie JWT)
app.use(cookieParser());

// P1-C: General rate limiter untuk semua endpoint
app.use('/api/v1', generalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const isDbOk = await db.testConnection();
  res.status(200).json({
    status: 'ok',
    service: 'GMH PA KMK Backend API',
    database: isDbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});


// Mount API v1 Routes
// P1-C: Auth rate limiter khusus — 5 percobaan per 15 menit
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth', authRoutes);

// Protected routes with explicit module permissions
app.use('/api/v1/dashboard', authenticateJwt, authorizePermission('DASHBOARD'), dashboardRoutes);
app.use('/api/v1/members', authenticateJwt, authorizePermission('MEMBERS'), membersRoutes);
app.use('/api/v1/registrations', registrationsRoutes); // Flow registrasi publik & admin internal guard
app.use('/api/v1/organization', authenticateJwt, authorizePermission('ORGANIZATION'), organizationRoutes);
app.use('/api/v1/finance', financeRoutes); // E-receipt publik & finance internal guard
app.use('/api/v1/payroll', authenticateJwt, authorizePermission('PAYROLL'), payrollRoutes);
app.use('/api/v1/building', authenticateJwt, authorizePermission('BUILDING'), buildingRoutes);
app.use('/api/v1/programs', authenticateJwt, authorizePermission('PROGRAMS'), programsRoutes);
app.use('/api/v1/missions', authenticateJwt, authorizePermission('MISSIONS'), missionsRoutes);
app.use('/api/v1/prayer', authenticateJwt, authorizePermission('PRAYER'), prayerRoutes);
app.use('/api/v1/assets', assetsRoutes); // Peminjaman aset publik & assets internal guard
app.use('/api/v1/secretariat', authenticateJwt, authorizePermission('SECRETARIAT'), secretariatRoutes);
app.use('/api/v1/reports', authenticateJwt, authorizePermission('REPORTS'), reportsRoutes);
app.use('/api/v1/users', usersRoutes); // Internal auth & authorizePermission('USERS')
app.use('/api/v1/utility', authenticateJwt, authorizePermission('UTILITY'), utilityRoutes);
app.use('/api/v1/audit-logs', authenticateJwt, authorizePermission('AUDIT_LOGS'), auditRoutes);
app.use('/api/v1/notifications', authenticateJwt, notificationsRoutes);

// Root greeting
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    organization: 'Yayasan Global Mission House (GMH PA KMK)',
    website: 'https://gmhpakmk.org/',
    apiDocs: '/api/v1',
    healthCheck: '/health',
  });
});


// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// Central Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// Start Server
app.listen(ENV.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 GMH Backend API running on http://localhost:${ENV.PORT}`);
  console.log(`📑 Environment: ${ENV.NODE_ENV}`);
  console.log(`📦 Database Target: ${ENV.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`🌐 Allowed Origins: ${ENV.ALLOWED_ORIGIN.join(', ') || '(kosong)'}`);
  console.log(`=======================================================`);

  // Keamanan: bypass autentikasi development tidak boleh aktif di production
  if (ENV.IS_PRODUCTION && process.env.DEV_AUTH_BYPASS === 'true') {
    console.error('❌ FATAL: DEV_AUTH_BYPASS=true tidak diperbolehkan pada NODE_ENV=production.');
    process.exit(1);
  }

  await db.testConnection();
});

export default app;
