import { db, pool } from '../config/db.js';

export async function seedUtilityMenus() {
  console.log('[Seed Utility] Starting system menu lookups & form configs seeding...');

  // Map of categories and their system menu
  const lookupsData = [
    // 1. MENU_ALUMNI
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FT', label: 'Fakultas Teknik', order: 1 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FMIPA', label: 'Fakultas Matematika dan Ilmu Pengetahuan Alam', order: 2 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FK', label: 'Fakultas Kedokteran', order: 3 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FH', label: 'Fakultas Hukum', order: 4 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FP', label: 'Fakultas Pertanian', order: 5 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FEB', label: 'Fakultas Ekonomi dan Bisnis', order: 6 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FKM', label: 'Fakultas Kesehatan Masyarakat', order: 7 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FIB', label: 'Fakultas Ilmu Budaya', order: 8 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FASILKOM-TI', label: 'Fakultas Ilmu Komputer & TI', order: 9 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FKG', label: 'Fakultas Kedokteran Gigi', order: 10 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FPSI', label: 'Fakultas Psikologi', order: 11 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'FARMASI', label: 'Fakultas Farmasi', order: 12 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'KEHUTANAN', label: 'Fakultas Kehutanan', order: 13 },
    { menu: 'ALUMNI', category: 'FACULTY', code: 'VOKASI', label: 'Fakultas Vokasi', order: 14 },

    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'MEDAN_KOTA', label: 'Medan Kota & Sekitarnya', order: 1 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'MEDAN_SELAYANG', label: 'Medan Selayang & Sekitar Kampus USU', order: 2 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'DELI_SERDANG', label: 'Deli Serdang & Binjai', order: 3 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'JABODETABEK', label: 'Jabodetabek & Banten', order: 4 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'SUMUT_DAERAH', label: 'Sumut Luar Medan (Pematang Siantar, Toba, Karo)', order: 5 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'NASIONAL_LAIN', label: 'Jawa, Bali, Kalimantan, Sulawesi, Papua', order: 6 },
    { menu: 'ALUMNI', category: 'ALUMNI_REGION', code: 'OVERSEAS', label: 'Luar Negeri (Overseas Alumni)', order: 7 },

    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_PAULUS', label: 'KTB Paulus (Stambuk 2016)', order: 1 },
    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_ESTER', label: 'KTB Ester (Stambuk 2018)', order: 2 },
    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_TIMOTIUS', label: 'KTB Timotius (Stambuk 2015)', order: 3 },
    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_RUT', label: 'KTB Rut (Stambuk 2019)', order: 4 },
    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_BARNABAS', label: 'KTB Barnabas (Stambuk 2017)', order: 5 },
    { menu: 'ALUMNI', category: 'KTB_GROUP', code: 'KTB_MARIA', label: 'KTB Maria (Stambuk 2020)', order: 6 },

    { menu: 'ALUMNI', category: 'MARITAL_STATUS', code: 'LAJANG', label: 'Lajang / Belum Menikah', order: 1 },
    { menu: 'ALUMNI', category: 'MARITAL_STATUS', code: 'MENIKAH', label: 'Menikah', order: 2 },
    { menu: 'ALUMNI', category: 'MARITAL_STATUS', code: 'DUDA_JANDA', label: 'Duda / Janda', order: 3 },

    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'TECH', label: 'Teknologi Informasi & Software', order: 1 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'HEALTH', label: 'Kesehatan, Dokter & Medis', order: 2 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'LAW', label: 'Hukum, Legal & Advokat', order: 3 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'BIZ', label: 'Wirausaha, Bisnis & Perdagangan', order: 4 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'EDU', label: 'Pendidikan, Guru & Dosen', order: 5 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'AGRI', label: 'Agribisnis, Perkebunan & Kehutanan', order: 6 },
    { menu: 'ALUMNI', category: 'PROFESSION_CATEGORY', code: 'GOV', label: 'Pemerintahan, ASN & BUMN', order: 7 },

    // 2. MENU_REGISTRASI
    { menu: 'REGISTRASI', category: 'REG_STATUS', code: 'PENDING', label: 'Menunggu Verifikasi Pengurus', order: 1 },
    { menu: 'REGISTRASI', category: 'REG_STATUS', code: 'APPROVED', label: 'Disetujui & NIA Diterbitkan', order: 2 },
    { menu: 'REGISTRASI', category: 'REG_STATUS', code: 'REJECTED', label: 'Ditolak (Butuh Perbaikan Data)', order: 3 },

    { menu: 'REGISTRASI', category: 'REG_REJECTION_REASON', code: 'NIK_INVALID', label: 'Nomor NIK KTP tidak valid (16 digit)', order: 1 },
    { menu: 'REGISTRASI', category: 'REG_REJECTION_REASON', code: 'NON_ALUMNI', label: 'Data tidak terdaftar di database alumni PA KMK USU', order: 2 },
    { menu: 'REGISTRASI', category: 'REG_REJECTION_REASON', code: 'STAMBUK_MISMATCH', label: 'Tahun stambuk dan fakultas tidak sesuai rekam akademik USU', order: 3 },
    { menu: 'REGISTRASI', category: 'REG_REJECTION_REASON', code: 'WA_INACTIVE', label: 'Nomor WhatsApp tidak dapat dihubungi untuk konfirmasi', order: 4 },

    // 3. MENU_KEUANGAN
    { menu: 'KEUANGAN', category: 'DONATION_TYPE', code: 'RUMAH_PERSEKUTUAN', label: 'Pembangunan Rumah Persekutuan GMH', order: 1 },
    { menu: 'KEUANGAN', category: 'DONATION_TYPE', code: 'MISI_PENGUTUSAN', label: 'Dana Pengutusan Pekabar Injil / Misi', order: 2 },
    { menu: 'KEUANGAN', category: 'DONATION_TYPE', code: 'BEASISWA_KAMPUS', label: 'Beasiswa Mahasiswa Binaan PA KMK', order: 3 },
    { menu: 'KEUANGAN', category: 'DONATION_TYPE', code: 'KAS_OPERASIONAL', label: 'Persembahan Kasih Operasional Yayasan', order: 4 },
    { menu: 'KEUANGAN', category: 'DONATION_TYPE', code: 'RETRET_PEMBINAAN', label: 'Sponsorship Retret & Seminar Mahasiswa', order: 5 },

    { menu: 'KEUANGAN', category: 'EXPENSE_CATEGORY', code: 'ATK_KANTOR', label: 'Belanja ATK & Kebutuhan Kantor', order: 1 },
    { menu: 'KEUANGAN', category: 'EXPENSE_CATEGORY', code: 'UTILITAS', label: 'Listrik, Air & Internet Yayasan', order: 2 },
    { menu: 'KEUANGAN', category: 'EXPENSE_CATEGORY', code: 'KONSUMSI', label: 'Konsumsi Rapat & Persekutuan Alumni', order: 3 },
    { menu: 'KEUANGAN', category: 'EXPENSE_CATEGORY', code: 'TRANSPORT_DINAS', label: 'Transport & Perjalanan Dinas Staf', order: 4 },
    { menu: 'KEUANGAN', category: 'EXPENSE_CATEGORY', code: 'PEMELIHARAAN', label: 'Pemeliharaan Gedung & Inventaris', order: 5 },

    { menu: 'KEUANGAN', category: 'PAYMENT_METHOD', code: 'BANK_TRANSFER', label: 'Transfer Bank Mandiri Yayasan', order: 1 },
    { menu: 'KEUANGAN', category: 'PAYMENT_METHOD', code: 'CASH', label: 'Tunai / Kas Kantor Sekretariat', order: 2 },
    { menu: 'KEUANGAN', category: 'PAYMENT_METHOD', code: 'QRIS', label: 'QRIS Yayasan GMH', order: 3 },

    // 4. MENU_PAYROLL
    { menu: 'PAYROLL', category: 'PAYROLL_ALLOWANCE', code: 'TUNJ_JABATAN', label: 'Tunjangan Jabatan Struktural', order: 1 },
    { menu: 'PAYROLL', category: 'PAYROLL_ALLOWANCE', code: 'TUNJ_TRANSPORT', label: 'Tunjangan Transport & Komunikasi', order: 2 },
    { menu: 'PAYROLL', category: 'PAYROLL_ALLOWANCE', code: 'TUNJ_MISI', label: 'Tunjangan Operasional Misi Lapangan', order: 3 },

    { menu: 'PAYROLL', category: 'PAYROLL_DEDUCTION', code: 'BPJS_TK', label: 'Potongan BPJS Ketenagakerjaan (2%)', order: 1 },
    { menu: 'PAYROLL', category: 'PAYROLL_DEDUCTION', code: 'BPJS_KES', label: 'Potongan BPJS Kesehatan (1%)', order: 2 },
    { menu: 'PAYROLL', category: 'PAYROLL_DEDUCTION', code: 'PPH_21', label: 'Potongan Pajak PPh Pasal 21', order: 3 },

    // 5. MENU_BUILDING
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_1', label: 'Peletakan Batu Pertama (Maret 2024)', order: 1 },
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_2', label: 'Fondasi & Struktur Bawah (Agustus 2024)', order: 2 },
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_3', label: 'Struktur Kolom & Balok Lt. 1 & 2 (Februari 2025)', order: 3 },
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_4', label: 'Atap & Dinding Eksterior (Agustus 2025)', order: 4 },
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_5', label: 'Finishing Interior & MEP (April 2026)', order: 5 },
    { menu: 'BUILDING', category: 'BUILDING_MILESTONE', code: 'MS_6', label: 'Furnitur & Peresmian Gedung (Desember 2026)', order: 6 },

    // 6. MENU_PROGRAMS
    { menu: 'PROGRAMS', category: 'PROGRAM_CATEGORY', code: 'FELLOWSHIP', label: 'Persekutuan Alumni Bulanan', order: 1 },
    { menu: 'PROGRAMS', category: 'PROGRAM_CATEGORY', code: 'SEMINAR', label: 'Seminar Pembekalan Karir & Karakter', order: 2 },
    { menu: 'PROGRAMS', category: 'PROGRAM_CATEGORY', code: 'RETREAT', label: 'Retret Rohani Staf & Mahasiswa', order: 3 },
    { menu: 'PROGRAMS', category: 'PROGRAM_CATEGORY', code: 'ADMIN', label: 'Rapat Kerja & Koordinasi Pengurus', order: 4 },

    { menu: 'PROGRAMS', category: 'ROSTER_ROLE', code: 'SPEAKER', label: 'Pembicara / Pelayan Firman', order: 1 },
    { menu: 'PROGRAMS', category: 'ROSTER_ROLE', code: 'MC', label: 'Pemimpin Pujian / Song Leader / MC', order: 2 },
    { menu: 'PROGRAMS', category: 'ROSTER_ROLE', code: 'MUSICIAN', label: 'Pemusik / Keyboardist / Gitar', order: 3 },
    { menu: 'PROGRAMS', category: 'ROSTER_ROLE', code: 'PRAYER_LEAD', label: 'Pendoa Syafaat', order: 4 },
    { menu: 'PROGRAMS', category: 'ROSTER_ROLE', code: 'LOGISTICS', label: 'Tim Multimedia, Sound & Logistik', order: 5 },

    // 7. MENU_PRAYER
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'MISI', label: 'Pelayanan Misi & Pekabar Injil', order: 1 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'KESEHATAN', label: 'Kesehatan & Pemulihan Sakit', order: 2 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'KELUARGA', label: 'Keluarga, Anak & Pernikahan', order: 3 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'STUDI', label: 'Studi Kampus & Mahasiswa Binaan', order: 4 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'PEKERJAAN', label: 'Pekerjaan, Karir & Usaha', order: 5 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'GEDUNG', label: 'Pembangunan Rumah Persekutuan GMH', order: 6 },
    { menu: 'PRAYER', category: 'PRAYER_CATEGORY', code: 'SYUKUR', label: 'Ucapan Syukur atas Berkat Tuhan', order: 7 },

    { menu: 'PRAYER', category: 'PRAYER_STATUS', code: 'NEW', label: 'Baru Masuk', order: 1 },
    { menu: 'PRAYER', category: 'PRAYER_STATUS', code: 'BEING_PRAYED', label: 'Sedang Didukung Doa', order: 2 },
    { menu: 'PRAYER', category: 'PRAYER_STATUS', code: 'ANSWERED', label: 'Sudah Dijawab Tuhan', order: 3 },

    // 8. MENU_ASSETS
    { menu: 'ASSETS', category: 'ASSET_CATEGORY', code: 'MULTIMEDIA', label: 'Elektronik & Multimedia Proyektor', order: 1 },
    { menu: 'ASSETS', category: 'ASSET_CATEGORY', code: 'SOUND_MUSIC', label: 'Sound System & Alat Musik', order: 2 },
    { menu: 'ASSETS', category: 'ASSET_CATEGORY', code: 'FURNITURE', label: 'Furnitur Meja & Kursi Lipat', order: 3 },
    { menu: 'ASSETS', category: 'ASSET_CATEGORY', code: 'IT_COMP', label: 'Perangkat Komputer Desktop & Printer', order: 4 },
    { menu: 'ASSETS', category: 'ASSET_CATEGORY', code: 'VEHICLE', label: 'Kendaraan Operasional Yayasan', order: 5 },

    { menu: 'ASSETS', category: 'ASSET_LOCATION', code: 'AULA_LT1', label: 'Aula Utama & Ruang Ibadah Lt. 1', order: 1 },
    { menu: 'ASSETS', category: 'ASSET_LOCATION', code: 'KANTOR_SEKRETARIAT', label: 'Kantor Sekretariat Yayasan', order: 2 },
    { menu: 'ASSETS', category: 'ASSET_LOCATION', code: 'RUANG_DOA', label: 'Ruang Doa & Konseling Lt. 2', order: 3 },
    { menu: 'ASSETS', category: 'ASSET_LOCATION', code: 'GUDANG', label: 'Gudang Rumah Persekutuan', order: 4 },

    { menu: 'ASSETS', category: 'PHYSICAL_CONDITION', code: 'GOOD', label: 'Baik & Berfungsi Penuh', order: 1 },
    { menu: 'ASSETS', category: 'PHYSICAL_CONDITION', code: 'FAIR', label: 'Cukup / Perlu Perawatan Ringan', order: 2 },
    { menu: 'ASSETS', category: 'PHYSICAL_CONDITION', code: 'DAMAGED', label: 'Rusak / Dalam Perbaikan', order: 3 },
  ];

  for (const item of lookupsData) {
    await db.query(
      `INSERT INTO system_lookups (category, code, label, sort_order, is_active, metadata)
       VALUES ($1, $2, $3, $4, TRUE, $5)
       ON CONFLICT (category, code) DO UPDATE 
       SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, metadata = EXCLUDED.metadata, is_active = TRUE`,
      [item.category, item.code, item.label, item.order, JSON.stringify({ systemMenu: item.menu })]
    );
  }
  console.log(`[Seed Utility] Seeded ${lookupsData.length} lookups across all 8 system menus.`);

  // Seed form field configs across all 8 menus
  const formConfigs = [
    { module: 'ALUMNI', key: 'faculty', label: 'Fakultas Asal USU', type: 'DROPDOWN', cat: 'FACULTY', req: true, order: 1 },
    { module: 'ALUMNI', key: 'major', label: 'Program Studi / Jurusan', type: 'TEXT', cat: null, req: true, order: 2 },
    { module: 'ALUMNI', key: 'entryYear', label: 'Stambuk / Tahun Masuk', type: 'NUMBER', cat: null, req: true, order: 3 },
    { module: 'ALUMNI', key: 'profession', label: 'Profesi / Pekerjaan Saat Ini', type: 'DROPDOWN', cat: 'PROFESSION_CATEGORY', req: false, order: 4 },
    { module: 'ALUMNI', key: 'ktb', label: 'Kelompok Tumbuh Bersama (KTB)', type: 'DROPDOWN', cat: 'KTB_GROUP', req: false, order: 5 },
    { module: 'ALUMNI', key: 'maritalStatus', label: 'Status Pernikahan', type: 'DROPDOWN', cat: 'MARITAL_STATUS', req: false, order: 6 },
    { module: 'ALUMNI', key: 'region', label: 'Wilayah Domisili Alumni', type: 'DROPDOWN', cat: 'ALUMNI_REGION', req: false, order: 7 },

    { module: 'REGISTRASI', key: 'nik', label: 'Nomor Induk Kependudukan (NIK 16 Digit)', type: 'TEXT', cat: null, req: true, order: 1 },
    { module: 'REGISTRASI', key: 'wa', label: 'Nomor WhatsApp Aktif', type: 'TEXT', cat: null, req: true, order: 2 },
    { module: 'REGISTRASI', key: 'homeAddress', label: 'Alamat Tempat Tinggal Saat Ini', type: 'TEXTAREA', cat: null, req: true, order: 3 },
    { module: 'REGISTRASI', key: 'rejectionReason', label: 'Alasan Penolakan Tiket', type: 'DROPDOWN', cat: 'REG_REJECTION_REASON', req: false, order: 4 },

    { module: 'KEUANGAN', key: 'donationCategory', label: 'Kategori Peruntukan Donasi', type: 'DROPDOWN', cat: 'DONATION_TYPE', req: true, order: 1 },
    { module: 'KEUANGAN', key: 'operationalCategory', label: 'Kategori Belanja Kas Operasional', type: 'DROPDOWN', cat: 'EXPENSE_CATEGORY', req: true, order: 2 },
    { module: 'KEUANGAN', key: 'paymentMethod', label: 'Metode Pembayaran / Kas', type: 'DROPDOWN', cat: 'PAYMENT_METHOD', req: true, order: 3 },

    { module: 'PAYROLL', key: 'baseSalary', label: 'Gaji Pokok Karyawan / Pekabar Injil', type: 'NUMBER', cat: null, req: true, order: 1 },
    { module: 'PAYROLL', key: 'allowanceType', label: 'Komponen Tunjangan Tambahan', type: 'DROPDOWN', cat: 'PAYROLL_ALLOWANCE', req: false, order: 2 },
    { module: 'PAYROLL', key: 'deductionType', label: 'Komponen Potongan Gaji', type: 'DROPDOWN', cat: 'PAYROLL_DEDUCTION', req: false, order: 3 },

    { module: 'BUILDING', key: 'milestone', label: 'Tahapan Konstruksi Rumah Persekutuan', type: 'DROPDOWN', cat: 'BUILDING_MILESTONE', req: true, order: 1 },

    { module: 'PROGRAMS', key: 'programCategory', label: 'Kategori Agenda / Program', type: 'DROPDOWN', cat: 'PROGRAM_CATEGORY', req: true, order: 1 },
    { module: 'PROGRAMS', key: 'rosterRole', label: 'Peran Penugasan Pelayan Ibadah', type: 'DROPDOWN', cat: 'ROSTER_ROLE', req: true, order: 2 },

    { module: 'PRAYER', key: 'prayerCategory', label: 'Kategori Pokok Doa', type: 'DROPDOWN', cat: 'PRAYER_CATEGORY', req: true, order: 1 },
    { module: 'PRAYER', key: 'prayerStatus', label: 'Status Tindak Lanjut Pendoa', type: 'DROPDOWN', cat: 'PRAYER_STATUS', req: true, order: 2 },

    { module: 'ASSETS', key: 'assetCategory', label: 'Kategori Inventaris Barang', type: 'DROPDOWN', cat: 'ASSET_CATEGORY', req: true, order: 1 },
    { module: 'ASSETS', key: 'locationRoom', label: 'Lokasi Penempatan Ruangan', type: 'DROPDOWN', cat: 'ASSET_LOCATION', req: true, order: 2 },
    { module: 'ASSETS', key: 'physicalCondition', label: 'Kondisi Fisik Sarana', type: 'DROPDOWN', cat: 'PHYSICAL_CONDITION', req: true, order: 3 },
  ];

  for (const cfg of formConfigs) {
    await db.query(
      `INSERT INTO form_field_configs (feature_module, field_key, field_label, field_type, lookup_category, is_required, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (feature_module, field_key) DO UPDATE 
       SET field_label = EXCLUDED.field_label, field_type = EXCLUDED.field_type, lookup_category = EXCLUDED.lookup_category, is_required = EXCLUDED.is_required, sort_order = EXCLUDED.sort_order`,
      [cfg.module, cfg.key, cfg.label, cfg.type, cfg.cat, cfg.req, cfg.order]
    );
  }
  console.log(`[Seed Utility] Seeded ${formConfigs.length} form field configurations.`);

  // Also seed sample prayer requests so GET /api/v1/prayer is NOT empty
  await db.query(
    `INSERT INTO prayer_requests (sender_name, sender_phone, sender_email, is_anonymous, prayer_content, status)
     VALUES
     ('Jhon Simanjuntak', '081234567891', 'jhon.s@gmail.com', false, 'Mohon dukungan doa untuk kesembuhan orang tua yang sedang dirawat di RS Elisabeth Medan.', 'NEW'),
     ('Anonim', null, null, true, 'Mohon doa agar dimudahkan dalam proses interview kerja BUMN di Jakarta.', 'BEING_PRAYED'),
     ('Sari Pardede', '081398765432', 'sari.p@gmail.com', false, 'Mohon dukungan doa untuk pemulihan dan damai sejahtera dalam relasi keluarga besar di kampung halaman.', 'NEW'),
     ('Rendi Limbong', '082212345678', 'rendi.l@gmail.com', false, 'Puji Tuhan ujian sidang skripsi Fakultas Teknik USU telah selesai dengan hasil memuaskan. Terima kasih atas dukungan doa pengurus.', 'ANSWERED')
     ON CONFLICT DO NOTHING`
  );
  console.log('[Seed Utility] Seeded initial prayer requests.');
}

if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed_utility_menus.ts')) {
  seedUtilityMenus()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Utility Error]', err);
      await pool.end();
      process.exit(1);
    });
}
