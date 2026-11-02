/**
 * Re-export helper `shared/` untuk backwards compatibility.
 *
 * File ini sebelumnya menjadi sumber tunggal pagination. Sekarang helper
 * baru diletakkan di `src/shared/`; file ini sengaja dipertahankan agar
 * seluruh import lama (`../../utils/pagination.js`) tetap berfungsi tanpa
 * perlu mengubah banyak berkas sekaligus.
 */
export {
  parsePagination,
  formatPaginationMeta,
} from '../shared/pagination.js';

export type {
  PaginationOptions,
  PaginatedMeta,
  ParsedPagination,
} from '../shared/pagination.js';
