export interface RundownItem {
  id: string;
  time: string;
  pic: string;
  note: string;
}

export interface TaskItem {
  id: string;
  task: string;
  pic: string;
  done: boolean;
  estimated_cost?: number;
}

export interface CommitteeItem {
  id: string;
  role: string;
  name: string;
  contact?: string;
  member_id?: string;
}

export interface ProgramTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
  central_tx_code?: string;
}

export interface Program {
  id: string;
  program_title: string;
  program_category: string;
  event_datetime: string;
  location: string;
  theme?: string;
  speaker_name?: string;
  budget_estimate?: number;
  cash_balance?: number;
  status?: string;
  description?: string;
  media_drive_url?: string;
  document_drive_url?: string;
  transactions?: ProgramTransaction[];
  rundown?: RundownItem[];
  tasks?: TaskItem[];
  committees?: CommitteeItem[];
  created_at?: string;
}

export const CATEGORY_BADGE: Record<string, string> = {
  FELLOWSHIP: 'badge-primary',
  SEMINAR: 'badge-gold',
  RETREAT: 'badge-info',
  ADMIN: 'badge-neutral',
  'Persekutuan Alumni': 'badge-primary',
  'Seminar & Workshop': 'badge-gold',
  'Retret & Doa Semalam': 'badge-info',
  'Rapat Kerja Yayasan': 'badge-neutral',
};

export const CATEGORY_LABEL: Record<string, string> = {
  FELLOWSHIP: 'Persekutuan Alumni',
  SEMINAR: 'Seminar & Workshop',
  RETREAT: 'Retret & Doa Semalam',
  ADMIN: 'Rapat Kerja Yayasan',
};

export const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
};
