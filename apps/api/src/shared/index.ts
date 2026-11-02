/**
 * Barrel export untuk helper backend terpusat (Fase 1 — Audit Infrastruktur).
 *
 * Import yang disarankan:
 *   import { asyncHandler, notFound, logger } from '../../shared/index.js';
 */
export { asyncHandler, asyncHandlerSafe } from './asyncHandler.js';
export type { AsyncRequestHandler } from './asyncHandler.js';

export {
  HttpError,
  httpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  internalError,
  isHttpError,
} from './httpError.js';

export { logger } from './logger.js';
export type { LogMeta } from './logger.js';

export { parsePagination, formatPaginationMeta } from './pagination.js';
export type { PaginationOptions, PaginatedMeta, ParsedPagination } from './pagination.js';

export { query, queryRows, queryOne } from './sql.js';
export type { QueryOptions } from './sql.js';

export { validate, formatZodIssues, uuidParam, listQuerySchema } from './validate.js';
export type { ValidationIssue, ValidationErrorDetail } from './validate.js';
