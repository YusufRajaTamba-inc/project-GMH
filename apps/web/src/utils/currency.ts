/**
 * Utility for formatting and parsing Indonesian Rupiah nominal values
 * Format: 2.000.000 (thousands separated by dot)
 */

export const formatNominal = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? Math.round(value) : parseNominal(String(value));
  return isNaN(num) ? '' : num.toLocaleString('id-ID');
};

export const parseNominal = (formatted: string | number | undefined | null): number => {
  if (formatted === undefined || formatted === null || formatted === '') return 0;
  if (typeof formatted === 'number') return isNaN(formatted) ? 0 : Math.round(formatted);

  const str = String(formatted).trim();
  if (!str) return 0;

  // If from DB with cents e.g. "18000000.00" (4 or more digits before dot, 2 decimal places)
  if (/^\d{4,}\.\d{2}$/.test(str)) {
    const parsed = Math.round(parseFloat(str));
    return isNaN(parsed) ? 0 : parsed;
  }

  // Indonesian thousands format (e.g. "1.000", "25.000.000", "Rp 50.000")
  const clean = str.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export const formatRupiah = (value: number | undefined | null, prefix = 'Rp '): string => {
  if (value === undefined || value === null || isNaN(value)) return `${prefix}0`;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));
  return `${sign}${prefix}${abs.toLocaleString('id-ID')}`;
};
