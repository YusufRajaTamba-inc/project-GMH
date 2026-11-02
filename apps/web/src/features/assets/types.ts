import { Volume2, Music, Home, Layers, Package } from 'lucide-react';

export interface AssetLoan {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_type?: string;
  location_room?: string;
  category_label?: string;
  borrower_name: string;
  borrower_phone?: string;
  borrower_email?: string;
  borrower_institution?: string;
  borrower_member_id?: string;
  member_full_name?: string;
  member_phone?: string;
  member_number?: string;
  loan_purpose: string;
  loan_type: 'PINJAM' | 'SEWA';
  rental_fee: string | number;
  borrowed_at: string;
  expected_return_at: string;
  actual_return_at?: string;
  condition_on_return?: 'GOOD' | 'FAIR' | 'DAMAGED';
  quantity_borrowed: number;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'BORROWED';
  request_code?: string;
  approval_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approver_name?: string;
  approver_email?: string;
  approved_at?: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id?: string;
  category_label?: string;
  purchase_date?: string;
  purchase_price: string | number;
  physical_condition: 'GOOD' | 'FAIR' | 'DAMAGED';
  location_room?: string;
  is_borrowable: boolean;
  quantity: number;
  available_quantity: number;
  asset_type?: string;
  rental_price?: string | number;
  borrow_status?: string;
  notes?: string;
  loans?: AssetLoan[];
}

export const CONDITION_LABEL: Record<string, string> = {
  GOOD: 'Baik',
  FAIR: 'Cukup',
  DAMAGED: 'Rusak',
};

export const ASSET_TYPES = [
  { code: 'SOUND_SYSTEM', label: 'Sound System & Audio', icon: Volume2 },
  { code: 'ALAT_MUSIK', label: 'Alat Musik & Band', icon: Music },
  { code: 'RUANGAN', label: 'Ruangan & Fasilitas Gedung', icon: Home },
  { code: 'MULTIMEDIA', label: 'Multimedia & Proyektor', icon: Layers },
  { code: 'GENSET_LISTRIK', label: 'Genset & Utilitas Listrik', icon: Package },
  { code: 'BARANG', label: 'Inventaris & Perlengkapan Umum', icon: Package },
];
