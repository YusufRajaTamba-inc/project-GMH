import crypto from 'crypto';
import { db } from '../../config/db.js';
import { ENV } from '../../config/env.js';

export interface ModuleDefinition {
  key: string;
  label: string;
  path: string;
  additionalPaths?: string[];
  category: 'Utama' | 'Keanggotaan' | 'Keuangan Yayasan' | 'Program Yayasan' | 'Manajemen' | 'Pengaturan Sistem';
  description: string;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    key: 'DASHBOARD',
    label: 'Dashboard',
    path: '/',
    category: 'Utama',
    description: 'Ringkasan eksekutif, statistik KPI, dan aktivitas sistem yayasan',
  },
  {
    key: 'MEMBERS',
    label: 'Data Anggota & Alumni',
    path: '/members',
    category: 'Keanggotaan',
    description: 'Database profil anggota & alumni PA KMK USU, riwayat pelayanan, dan filter alumni',
  },
  {
    key: 'REGISTRATIONS',
    label: 'Verifikasi Pendaftaran',
    path: '/registrations',
    category: 'Keanggotaan',
    description: 'Verifikasi berkas dan persetujuan alumni baru yang mendaftar mandiri',
  },
  {
    key: 'ORGANIZATION',
    label: 'Struktur & Kepengurusan',
    path: '/organization',
    category: 'Keanggotaan',
    description: 'Bagan kepengurusan yayasan inti, staf full-time, kepanitiaan, dan divisi pelayanan',
  },
  {
    key: 'FINANCE_OPERATIONAL',
    label: 'Kas Operasional',
    path: '/finance/operational',
    category: 'Keuangan Yayasan',
    description: 'Pencatatan kas kantor, biaya operasional rutin, dan arus kas harian',
  },
  {
    key: 'FINANCE_DONATIONS',
    label: 'Donasi & Janji Iman',
    path: '/finance/donations',
    category: 'Keuangan Yayasan',
    description: 'Pencatatan donasi masuk, komitmen janji iman pembangunan, dan penerbitan e-receipt QR',
  },
  {
    key: 'BUILDING',
    label: 'Proyek Yayasan',
    path: '/building',
    category: 'Keuangan Yayasan',
    description: 'Monitoring tahapan proyek fisik Rumah Persekutuan, kurva S, dan realisasi anggaran',
  },
  {
    key: 'PAYROLL',
    label: 'Penggajian (Payroll)',
    path: '/payroll',
    category: 'Keuangan Yayasan',
    description: 'Modul rahasia remunerasi, slip gaji staf yayasan, dan tunjangan hidup misionaris',
  },
  {
    key: 'MISSIONS',
    label: 'Pelayanan Misi',
    path: '/missions',
    category: 'Program Yayasan',
    description: 'Monitoring pos pelayanan misi daerah, pengutusan utusan Injil, dan log kegiatan misi',
  },
  {
    key: 'PROGRAMS',
    label: 'Program & Persekutuan',
    path: '/programs',
    category: 'Program Yayasan',
    description: 'Jadwal seminar, persekutuan doa alumni, mentoring adik kampus, dan kebaktian',
  },
  {
    key: 'PRAYER',
    label: 'Permohonan Doa',
    path: '/prayer',
    category: 'Program Yayasan',
    description: 'Daftar permohonan pokok doa alumni, tim pendoa syafaat, dan status jawaban doa',
  },
  {
    key: 'ASSETS',
    label: 'Inventaris & Aset',
    path: '/assets',
    category: 'Manajemen',
    description: 'Katalog aset inventaris Rumah Persekutuan, peminjaman/sewa perlengkapan, dan servis',
  },
  {
    key: 'SECRETARIAT',
    label: 'Sekretariat & Persuratan',
    path: '/secretariat',
    category: 'Manajemen',
    description: 'Penerbitan surat keluar nomor otomatis, registrasi surat masuk, dan lembar disposisi',
  },
  {
    key: 'REPORTS',
    label: 'Laporan Yayasan',
    path: '/reports',
    additionalPaths: ['/reports/ringkasan', '/reports/keuangan', '/reports/anggota', '/reports/demografi'],
    category: 'Manajemen',
    description: 'Laporan audit keuangan yayasan, laporan demografi keanggotaan, dan ekspor data',
  },
  {
    key: 'USERS',
    label: 'Data Pengguna & Hak Akses',
    path: '/users',
    additionalPaths: ['/settings'],
    category: 'Pengaturan Sistem',
    description: 'Manajemen akun login operator dan pengaturan matriks hak akses setiap role',
  },
  {
    key: 'UTILITY',
    label: 'Sistem Utility',
    path: '/utility',
    category: 'Pengaturan Sistem',
    description: 'Konfigurasi kamus data dinamis, opsi dropdown, dan format penomoran surat dinamis',
  },
];

export interface SignedPermissionsPayload {
  roleId: string;
  allowedModules: string[];
  allowedMenus: string[];
  timestamp: number;
  signature: string;
  integrityHash: string;
}

/**
 * Menghasilkan HMAC-SHA256 signature dari payload hak akses dengan kunci rahasia server (JWT_SECRET)
 */
export function signPermissionsPayload(
  roleId: string,
  allowedModules: string[],
  allowedMenus: string[],
  timestamp: number
): string {
  const sortedModules = [...allowedModules].sort().join(',');
  const sortedMenus = [...allowedMenus].sort().join(',');
  const rawString = `${roleId}|${sortedModules}|${sortedMenus}|${timestamp}`;
  return crypto.createHmac('sha256', ENV.JWT_SECRET).update(rawString).digest('hex');
}

/**
 * Menghasilkan hash SHA-256 untuk verifikasi integritas data di client
 */
export function calculateIntegrityHash(
  roleId: string,
  allowedModules: string[],
  allowedMenus: string[],
  signature: string
): string {
  const sortedModules = [...allowedModules].sort().join(',');
  const sortedMenus = [...allowedMenus].sort().join(',');
  const data = `GMH_SECURE_PERM_HASH:${roleId}:${sortedModules}:${sortedMenus}:${signature}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Mengambil hak akses role dari database dan menandatanganinya dengan cryptographic signature
 */
export async function getSignedRolePermissions(roleId: string): Promise<SignedPermissionsPayload> {
  const permRes = await db.query(
    `SELECT module_key, can_access FROM role_permissions WHERE role_id = $1`,
    [roleId]
  );

  let allowedModules: string[] = [];

  if (roleId === 'SUPER_ADMIN') {
    // Super Admin selalu memiliki akses penuh ke seluruh 16 modul
    allowedModules = SYSTEM_MODULES.map((m) => m.key);
  } else if (permRes.rows.length === 0) {
    // Fallback jika belum di-seed
    allowedModules = ['DASHBOARD'];
  } else {
    allowedModules = permRes.rows
      .filter((r: { module_key: string; can_access: boolean }) => r.can_access)
      .map((r: { module_key: string; can_access: boolean }) => r.module_key);
  }

  // Petakan allowedModules ke allowedMenus (paths)
  const allowedMenusSet = new Set<string>();
  // Halaman notifikasi selalu diizinkan untuk semua peran yang memiliki sesi login
  allowedMenusSet.add('/notifications');

  for (const moduleKey of allowedModules) {
    const modDef = SYSTEM_MODULES.find((m) => m.key === moduleKey);
    if (modDef) {
      allowedMenusSet.add(modDef.path);
      if (modDef.additionalPaths) {
        modDef.additionalPaths.forEach((p) => allowedMenusSet.add(p));
      }
    }
  }

  const allowedMenus = Array.from(allowedMenusSet).sort();
  const timestamp = Date.now();
  const signature = signPermissionsPayload(roleId, allowedModules, allowedMenus, timestamp);
  const integrityHash = calculateIntegrityHash(roleId, allowedModules, allowedMenus, signature);

  return {
    roleId,
    allowedModules: allowedModules.sort(),
    allowedMenus,
    timestamp,
    signature,
    integrityHash,
  };
}
