/**
 * Wrapper query SQL dengan auto-logging query lambat (Fase 1 — Audit Infrastruktur).
 *
 * Semua query yang melewati `query()` dicatat bila durasinya melebihi
 * ambang `SLOW_QUERY_MS` (default 200ms). Tujuannya: mudah menemukan
 * bottleneck index sebelum data bertambah banyak.
 */
import pg from 'pg';
import { pool } from '../config/db.js';
import { logger } from './logger.js';

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS || 200);

/** Nama label untuk query, mis. 'members.list' agar log mudah dibaca. */
export interface QueryOptions {
  label?: string;
  /** Abaikan log untuk query yang memang lambat secara wajar (report/export). */
  silent?: boolean;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<pg.QueryResult<T>> {
  const started = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - started;
    if (!options.silent && duration > SLOW_QUERY_MS) {
      logger.warn('Slow query detected', {
        label: options.label,
        durationMs: duration,
        sql: text.length > 500 ? `${text.slice(0, 500)}…` : text,
      });
    }
    return result;
  } catch (err) {
    const duration = Date.now() - started;
    logger.error('Query failed', {
      label: options.label,
      durationMs: duration,
      sql: text.length > 500 ? `${text.slice(0, 500)}…` : text,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/** Ambil banyak baris. */
export async function queryRows<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<T[]> {
  const result = await query<T>(text, params, options);
  return result.rows;
}

/** Ambil satu baris pertama, atau undefined. */
export async function queryOne<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<T | undefined> {
  const result = await query<T>(text, params, options);
  return result.rows[0];
}
