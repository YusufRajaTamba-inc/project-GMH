
export interface DryRunRow {
  index: number;
  name: string;
  nik: string;
  gender: string;
  faculty: string;
  major: string;
  entryYear: number;
  phone: string;
  email: string;
  city: string;
  profession: string;
  status: 'VALID' | 'ERROR';
  errorReason?: string;
}

export interface MemberServiceRecord {
  activityId: string;
  activityTitle: string;
  location: string;
  eventDate: string;
  timePreview?: string;
  role: string;
  status: string;
}

export interface DraftFilters {
  entryYear: string;
  city: string;
  faculty: string;
  profession: string;
  type: string;
  maritalStatus: string;
  status: string;
}

export interface ModalAlertState {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  type?: 'danger' | 'warning' | 'info';
}

export interface ReceiptData {
  receiptNumber: string;
  name: string;
  category: string;
  amount: number;
  lastPayment: string;
  total?: number;
  paid?: number;
  remaining?: number;
}

export const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const getAgeString = (birthDateStr?: string): string => {
  if (!birthDateStr) return '';
  try {
    const b = new Date(birthDateStr);
    if (isNaN(b.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
      age--;
    }
    return age > 0 ? ` (${age} tahun)` : '';
  } catch {
    return '';
  }
};
