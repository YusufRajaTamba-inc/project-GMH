import type {
  TransactionType,
  AccountType,
  BudgetPeriodType,
  BudgetStatus,
} from '../../state/FinanceStoreContext';

export type ActiveTab = 'JURNAL' | 'UPLOAD_CSV' | 'ANGGARAN' | 'LOG_MUTASI';

export const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export const YEAR_OPTIONS = ['2025', '2026', '2027', '2028'];

export const MONTH_NAMES_MAP: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export const getPeriodDetails = (key: string, customStart = '', customEnd = '') => {
  if (key === 'ALL') {
    return {
      label: 'Semua Periode',
      shortLabel: 'Semua Waktu',
      dateRangeText: 'Akumulasi Seluruh Mutasi',
      matchFn: (_d: string) => true,
    };
  }

  if (key === 'CUSTOM') {
    const rangeText =
      customStart && customEnd
        ? `${customStart} s/d ${customEnd}`
        : customStart
        ? `Mulai ${customStart}`
        : customEnd
        ? `Hingga ${customEnd}`
        : 'Semua Tanggal';
    return {
      label: 'Rentang Tanggal Khusus',
      shortLabel: 'Kustom',
      dateRangeText: rangeText,
      matchFn: (d: string) => (!customStart || d >= customStart) && (!customEnd || d <= customEnd),
    };
  }

  if (key.startsWith('YEAR:')) {
    const yr = key.replace('YEAR:', '');
    return {
      label: `Tahun Anggaran ${yr}`,
      shortLabel: `Tahun ${yr}`,
      dateRangeText: `01 Jan – 31 Des ${yr}`,
      matchFn: (d: string) => (d || '').startsWith(yr),
    };
  }

  if (key.startsWith('CYCLE:')) {
    const ym = key.replace('CYCLE:', '');
    const [yrStr, moStr] = ym.split('-');
    const yr = parseInt(yrStr, 10) || 2026;
    const mo = parseInt(moStr, 10) || 10;

    const nextMo = mo === 12 ? 1 : mo + 1;
    const nextYr = mo === 12 ? yr + 1 : yr;

    const start = `${yr}-${String(mo).padStart(2, '0')}-16`;
    const end = `${nextYr}-${String(nextMo).padStart(2, '0')}-15`;

    const startMoName = MONTH_NAMES_MAP[String(mo).padStart(2, '0')]?.slice(0, 3) || moStr;
    const endMoName = MONTH_NAMES_MAP[String(nextMo).padStart(2, '0')]?.slice(0, 3) || String(nextMo);

    return {
      label: `Siklus Kas (16 ${startMoName} – 15 ${endMoName} ${nextYr})`,
      shortLabel: `Siklus 16 ${startMoName} – 15 ${endMoName}`,
      dateRangeText: `16 ${startMoName} ${yr} – 15 ${endMoName} ${nextYr}`,
      matchFn: (d: string) => (d || '') >= start && (d || '') <= end,
    };
  }

  // Monthly ('YYYY-MM' or 'MONTH:YYYY-MM')
  const ym = key.replace('MONTH:', '');
  const [yr, mo] = ym.split('-');
  const moName = MONTH_NAMES_MAP[mo] || mo;
  const lastDay = new Date(parseInt(yr, 10) || 2026, parseInt(mo, 10) || 10, 0).getDate();

  return {
    label: `${moName} ${yr}`,
    shortLabel: `${moName} ${yr}`,
    dateRangeText: `01 – ${lastDay} ${moName} ${yr}`,
    matchFn: (d: string) => (d || '').startsWith(ym),
  };
};

export interface BudgetCategory {
  id: string;
  category: string;
  budget: number;
  notes?: string;
  periodType: BudgetPeriodType;
  period: string;
  periodName: string;
  status: BudgetStatus;
  spent: number;
  trxCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  refCode: string;
  category?: string;
  party: string;
  operator: string;
  details: string;
}

export interface TransactionFormData {
  type: TransactionType;
  account: AccountType;
  date: string;
  desc: string;
  category: string;
  party: string;
  amount: number;
  notes: string;
  status: 'Approved' | 'Pending Review';
}

export interface BudgetFormData {
  category: string;
  budget: number;
  periodType: BudgetPeriodType;
  month: string;
  year: string;
  notes: string;
}

export interface EditingBudgetData {
  id: string;
  category: string;
  budget: number;
  periodType: BudgetPeriodType;
  month: string;
  year: string;
  status: BudgetStatus;
  notes: string;
}
