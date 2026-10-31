// Shared state for auth context - Yayasan Global Mission House
export type UserRole =
  | 'SUPER_ADMIN'
  | 'DEWAN_PENGAWAS_PEMBINA'
  | 'DEWAN_PENGAWAS'
  | 'PENGURUS_HARIAN'
  | 'BENDAHARA_YAYASAN'
  | 'BENDAHARA_ADMIN'
  | 'KOORDINATOR_DEPARTEMEN'
  | 'ADMIN_OPERASIONAL'
  | 'ANGGOTA_ALUMNI'
  | 'ALUMNI_ANGGOTA';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  department?: string;
  initials: string;
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  DEWAN_PENGAWAS_PEMBINA: 'Dewan Pengawas & Pembina',
  PENGURUS_HARIAN: 'Pengurus Harian Yayasan',
  BENDAHARA_YAYASAN: 'Bendahara Yayasan (Pusat & Gaji)',
  BENDAHARA_ADMIN: 'Bendahara Admin (Operasional Kas)',
  KOORDINATOR_DEPARTEMEN: 'Koordinator Departemen',
  ANGGOTA_ALUMNI: 'Anggota / Alumni PA KMK',
};

// Check if role can access payroll (Strictly isolated to Pengurus Yayasan Inti - Dewan Pengawas & Pembina)
export const canAccessPayroll = (role: string) =>
  ['DEWAN_PENGAWAS_PEMBINA', 'DEWAN_PENGAWAS'].includes(role);

// Check if role can approve registrations (Flow 1)
export const canApproveRegistrations = (role: string) =>
  ['SUPER_ADMIN', 'PENGURUS_HARIAN', 'KOORDINATOR_DEPARTEMEN', 'ADMIN_OPERASIONAL'].includes(role);

// Check if role can manage utility (dynamic fields - Flow 5)
export const canManageUtility = (role: string) =>
  role === 'SUPER_ADMIN';

// Check if role can bulk import (Flow 2)
export const canBulkImport = (role: string) =>
  ['SUPER_ADMIN', 'PENGURUS_HARIAN', 'KOORDINATOR_DEPARTEMEN', 'ADMIN_OPERASIONAL'].includes(role);

