import { Request } from 'express';

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  cursorColumn?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string | null;
}

/**
 * Standardize query parameter parsing for pagination.
 * Supports both Offset Pagination (page, limit) and Keyset/Cursor Pagination (cursor).
 */
export function parsePagination(req: Request, options: PaginationOptions = {}) {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  const isAll = req.query.limit === 'all' || req.query.export === 'true';
  const page = Math.max(1, parseInt(String(req.query.page || 1), 10) || 1);
  const limit = isAll
    ? 10000
    : Math.min(maxLimit, Math.max(1, parseInt(String(req.query.limit || defaultLimit), 10) || defaultLimit));
  const offset = (page - 1) * limit;
  const cursor = req.query.cursor ? String(req.query.cursor).trim() : undefined;

  return {
    page,
    limit,
    offset,
    isAll,
    cursor,
  };
}

/**
 * Constructs standard pagination metadata to return with data.
 */
export function formatPaginationMeta<T = any>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  cursorKey?: keyof T
): PaginatedMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  let nextCursor: string | null = null;
  if (data.length > 0 && cursorKey && data[data.length - 1][cursorKey]) {
    const val = data[data.length - 1][cursorKey];
    nextCursor = val instanceof Date ? val.toISOString() : String(val);
  }

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    nextCursor,
  };
}
