/**
 * Structured JSON logger (Fase 1 — Audit Infrastruktur).
 *
 * Tanpa dependency eksternal (pino/winston) supaya tidak menambah
 * bundle produksi. Output berupa satu baris JSON per event sehingga
 * mudah diagregasi oleh Loki/ELK.
 *
 * Level ditentukan NODE_ENV:
 * - production -> 'info' (warn/error tetap muncul)
 * - development -> 'debug'
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProduction = process.env.NODE_ENV === 'production';
const minLevel: LogLevel = isProduction ? 'info' : 'debug';

export interface LogMeta {
  [key: string]: unknown;
}

function serializeError(err: unknown): LogMeta {
  if (err instanceof Error) {
    return {
      errorName: err.name,
      errorMessage: err.message,
      stack: isProduction ? undefined : err.stack,
    };
  }
  return { error: String(err) };
}

function write(level: LogLevel, message: string, meta?: LogMeta): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    service: 'gmh-api',
    message,
    ...(meta || {}),
  };

  const line = JSON.stringify(payload, (_key, value) => (value === undefined ? undefined : value));

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => write('debug', message, meta),
  info: (message: string, meta?: LogMeta) => write('info', message, meta),
  warn: (message: string, meta?: LogMeta) => write('warn', message, meta),
  error: (message: string, meta?: LogMeta) => write('error', message, meta),
};

export default logger;
