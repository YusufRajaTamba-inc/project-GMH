export interface MissionTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
  central_tx_code?: string;
}

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

export interface MissionaryPerson {
  id: string;
  name: string;
  member_id?: string;
  pos: string;
  region: string;
  since: string;
  status: 'ACTIVE' | 'FURLOUGH';
  contact?: string;
}

export interface MissionActivity {
  id: string;
  title: string;
  theme?: string;
  budget_estimate: number | string;
  coordinator?: string;
  location?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  time_preview?: string;
  description?: string;
  media_drive_url?: string;
  document_drive_url?: string;
  status: 'ON_PROGRESS' | 'COMPLETED' | 'PLANNING' | string;
  cash_balance: number | string;
  transactions?: MissionTransaction[];
  rundown?: RundownItem[];
  tasks?: TaskItem[];
  committees?: CommitteeItem[];
}

export const generateTimePreview = (dateStr: string, start: string, end: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${dateStr} (${start} - ${end} WIB)`;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const timePart = start && end ? `(Pkl. ${start} - ${end} WIB)` : start ? `(Pkl. ${start} WIB)` : '';
    return `${dayName}, ${dayNum} ${monthName} ${year} ${timePart}`.trim();
  } catch {
    return `${dateStr} (${start} - ${end})`;
  }
};
