import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { db } from './config/db.js';

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

const app = express();

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

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));
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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/utility', utilityRoutes);
app.use('/api/v1/registrations', registrationsRoutes);
app.use('/api/v1/members', membersRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/building', buildingRoutes);
app.use('/api/v1/programs', programsRoutes);
app.use('/api/v1/missions', missionsRoutes);
app.use('/api/v1/prayer', prayerRoutes);
app.use('/api/v1/assets', assetsRoutes);

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
  console.log(`=======================================================`);
  await db.testConnection();
});

export default app;
