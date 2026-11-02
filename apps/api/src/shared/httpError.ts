/**
 * Error HTTP terdiskriminasi (Fase 1 — Audit Infrastruktur).
 *
 * Menggantikan `catch (err: any)` yang tidak bisa membedakan 400 / 404 /
 * 409 / 500 secara terprogram. Error yang dilempar handler akan diteruskan
 * ke central error handler di `server.ts`, yang memetakan `status` dan
 * `code` ke response JSON.
 */

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code || defaultCodeForStatus(status);
    this.details = details;
    Error.captureStackTrace?.(this, HttpError);
  }

  static badRequest(message = 'Permintaan tidak valid.', code?: string, details?: unknown) {
    return new HttpError(400, message, code, details);
  }

  static unauthorized(message = 'Anda tidak terautentikasi.', code?: string) {
    return new HttpError(401, message, code);
  }

  static forbidden(message = 'Anda tidak memiliki akses ke sumber daya ini.', code?: string) {
    return new HttpError(403, message, code);
  }

  static notFound(message = 'Data tidak ditemukan.', code?: string) {
    return new HttpError(404, message, code);
  }

  static conflict(message = 'Data sudah ada / bentrok dengan data lain.', code?: string, details?: unknown) {
    return new HttpError(409, message, code, details);
  }

  static unprocessable(message = 'Data gagal diproses.', code?: string, details?: unknown) {
    return new HttpError(422, message, code, details);
  }

  static internal(message = 'Terjadi kesalahan internal pada server.', code?: string) {
    return new HttpError(500, message, code);
  }
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }
}

/** Error dengan status & kode eksplisit. */
export function httpError(status: number, message: string, code?: string, details?: unknown): HttpError {
  return new HttpError(status, message, code, details);
}

export const badRequest = (message = 'Permintaan tidak valid.', code?: string, details?: unknown) =>
  httpError(400, message, code, details);

export const unauthorized = (message = 'Anda tidak terautentikasi.', code?: string) =>
  httpError(401, message, code);

export const forbidden = (message = 'Anda tidak memiliki akses ke sumber daya ini.', code?: string) =>
  httpError(403, message, code);

export const notFound = (message = 'Data tidak ditemukan.', code?: string) => httpError(404, message, code);

export const conflict = (message = 'Data sudah ada / bentrok dengan data lain.', code?: string, details?: unknown) =>
  httpError(409, message, code, details);

export const unprocessable = (message = 'Data gagal diproses.', code?: string, details?: unknown) =>
  httpError(422, message, code, details);

export const internalError = (message = 'Terjadi kesalahan internal pada server.', code?: string) =>
  httpError(500, message, code);

/** Type guard untuk memeriksa apakah error berasal dari HttpError. */
export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
