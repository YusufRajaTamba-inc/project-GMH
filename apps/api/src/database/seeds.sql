-- ============================================================================
-- YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
-- DATABASE INITIAL SEEDS
-- ============================================================================

-- 1. SEED ROLES
INSERT INTO roles (id, name, description) VALUES
('SUPER_ADMIN', 'Super Admin (IT)', 'Pengelolaan infrastruktur sistem, database, dan engine sistem utility dinamis'),
('DEWAN_PENGAWAS_PEMBINA', 'Dewan Pengawas / Pembina', 'Pengawasan tertinggi tata kelola, audit keuangan, dan arah strategis yayasan'),
('PENGURUS_HARIAN', 'Pengurus Harian Yayasan', 'Pimpinan eksekutif dan operasional harian kantor yayasan GMH'),
('BENDAHARA_YAYASAN', 'Bendahara Yayasan', 'Pengendali kas besar yayasan, rekening bank, penerimaan donasi/janji iman, dan modul payroll rahasia'),
('BENDAHARA_ADMIN', 'Bendahara Admin (Operasional)', 'Pengelola kas operasional kantor, kas kecil, dan belanja kebutuhan sekretariat'),
('KOORDINATOR_DEPARTEMEN', 'Koordinator Departemen', 'Kepala divisi pelayanan alumni, misi, pembinaan mahasiswa, atau komunikasi')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED SYSTEM LOOKUPS
INSERT INTO system_lookups (category, code, label, sort_order) VALUES
-- ALUMNI: Fakultas USU
('FACULTY', 'FT', 'Fakultas Teknik', 1),
('FACULTY', 'FMIPA', 'Fakultas Matematika dan Ilmu Pengetahuan Alam', 2),
('FACULTY', 'FK', 'Fakultas Kedokteran', 3),
('FACULTY', 'FH', 'Fakultas Hukum', 4),
('FACULTY', 'FP', 'Fakultas Pertanian', 5),
('FACULTY', 'FEB', 'Fakultas Ekonomi dan Bisnis', 6),
('FACULTY', 'FKM', 'Fakultas Kesehatan Masyarakat', 7),
('FACULTY', 'FIB', 'Fakultas Ilmu Budaya', 8),
('FACULTY', 'FASILKOM-TI', 'Fakultas Ilmu Komputer & TI', 9),
('FACULTY', 'FKG', 'Fakultas Kedokteran Gigi', 10),
('FACULTY', 'FPSI', 'Fakultas Psikologi', 11),
('FACULTY', 'FARMASI', 'Fakultas Farmasi', 12),
('FACULTY', 'KEHUTANAN', 'Fakultas Kehutanan', 13),
('FACULTY', 'VOKASI', 'Fakultas Vokasi', 14),

-- ALUMNI: Kring Wilayah Alumni
('ALUMNI_REGION', 'MEDAN_KOTA', 'Medan & Sekitarnya', 1),
('ALUMNI_REGION', 'JABODETABEK', 'Jabodetabek', 2),
('ALUMNI_REGION', 'BANDUNG_JABAR', 'Bandung & Jawa Barat', 3),
('ALUMNI_REGION', 'SURABAYA_JATIM', 'Surabaya & Jawa Timur', 4),
('ALUMNI_REGION', 'SUMUT_DAERAH', 'Sumatera Bagian Utara', 5),
('ALUMNI_REGION', 'KEPRI_RIAU', 'Kepulauan Riau & Riau', 6),
('ALUMNI_REGION', 'OVERSEAS', 'Luar Negeri', 7),
('SECTOR_ZONE', 'MEDAN_KOTA', 'Wilayah Medan Kota & Sekitarnya', 1),
('SECTOR_ZONE', 'MEDAN_SELAYANG', 'Wilayah Medan Selayang & Kampus USU', 2),
('SECTOR_ZONE', 'DELI_SERDANG', 'Wilayah Deli Serdang & Binjai', 3),
('SECTOR_ZONE', 'JABODETABEK', 'Wilayah Alumni Jabodetabek', 4),
('SECTOR_ZONE', 'SUMATERA_UTARA', 'Wilayah Luar Medan (Pematang Siantar, Toba, Karo)', 5),
('SECTOR_ZONE', 'LUAR_SUMATERA', 'Wilayah Luar Sumatera / Nasional', 6),
('SECTOR_ZONE', 'LUAR_NEGERI', 'Alumni Mancanegara (Overseas Fellowship)', 7),

-- ALUMNI: KTB Group
('KTB_GROUP', 'KTB_FILIPI', 'KTB Filipi', 1),
('KTB_GROUP', 'KTB_TIMOTIUS', 'KTB Timotius', 2),
('KTB_GROUP', 'KTB_EFESUS', 'KTB Efesus', 3),
('KTB_GROUP', 'KTB_GALILEA', 'KTB Galilea', 4),
('KTB_GROUP', 'KTB_BETANIA', 'KTB Betania', 5),
('KTB_GROUP', 'KTB_YERUSALEM', 'KTB Yerusalem', 6),

-- ALUMNI: Status Pernikahan
('MARITAL_STATUS', 'LAJANG', 'Lajang', 1),
('MARITAL_STATUS', 'MENIKAH', 'Menikah', 2),
('MARITAL_STATUS', 'DUDA_JANDA', 'Duda / Janda', 3),

-- ALUMNI: Profesi & Bidang Pekerjaan
('PROFESSION_CATEGORY', 'PNS_ASN', 'PNS / ASN', 1),
('PROFESSION_CATEGORY', 'BUMN_BUMD', 'BUMN / BUMD', 2),
('PROFESSION_CATEGORY', 'SWASTA', 'Karyawan Swasta', 3),
('PROFESSION_CATEGORY', 'WIRAUSAHA', 'Wiraswasta / Pengusaha', 4),
('PROFESSION_CATEGORY', 'AKADEMISI', 'Akademisi / Dosen / Guru', 5),
('PROFESSION_CATEGORY', 'MEDIS', 'Medis / Dokter / Nakes', 6),
('PROFESSION_CATEGORY', 'ROHANIWAN', 'Pekabar Injil / Rohaniwan', 7),

-- REGISTRASI: Status Registrasi
('REG_STATUS', 'PENDING', 'Menunggu Verifikasi', 1),
('REG_STATUS', 'APPROVED', 'Disetujui', 2),
('REG_STATUS', 'REJECTED', 'Ditolak', 3),

-- REGISTRASI: Alasan Penolakan
('REG_REJECTION_REASON', 'NON_ALUMNI', 'Bukan Alumni USU', 1),
('REG_REJECTION_REASON', 'INCOMPLETE_DATA', 'Data Tidak Lengkap', 2),
('REG_REJECTION_REASON', 'INVALID_NIK', 'NIK Tidak Valid', 3),
('REG_REJECTION_REASON', 'DUPLICATE', 'Permintaan Duplikat', 4),

-- KEUANGAN: Kategori Donasi
('DONATION_TYPE', 'RUMAH_PERSEKUTUAN', 'Pembangunan Rumah Persekutuan', 1),
('DONATION_TYPE', 'OPERASIONAL', 'Donasi Operasional Yayasan', 2),
('DONATION_TYPE', 'JANJI_IMAN', 'Janji Iman Bulanan', 3),
('DONATION_TYPE', 'MISI_PENGUTUSAN', 'Dana Pengutusan Misi', 4),
('DONATION_TYPE', 'BEASISWA', 'Beasiswa Mahasiswa Binaan', 5),
('DONATION_TYPE', 'AKSI_KASIH', 'Aksi Kasih & Sosial', 6),

-- KEUANGAN: Kategori Belanja Kas Operasional
('EXPENSE_CATEGORY', 'SEWA_KANTOR', 'Sewa Fasilitas & Kantor', 1),
('EXPENSE_CATEGORY', 'ATK_KANTOR', 'Perlengkapan ATK Kantor', 2),
('EXPENSE_CATEGORY', 'UTILITAS', 'Utilitas (Listrik, Air & Internet)', 3),
('EXPENSE_CATEGORY', 'KONSUMSI', 'Konsumsi Persekutuan & Rapat', 4),
('EXPENSE_CATEGORY', 'TRANSPORT_MISI', 'Transport & Operasional Misi', 5),
('EXPENSE_CATEGORY', 'HONOR_PEMBICARA', 'Honorarium Pembicara Seminar', 6),
('EXPENSE_CATEGORY', 'PEMELIHARAAN', 'Pemeliharaan Gedung & Alat', 7),

-- KEUANGAN: Metode Pembayaran
('PAYMENT_METHOD', 'BANK_MANDIRI', 'Transfer Bank Mandiri Yayasan', 1),
('PAYMENT_METHOD', 'BANK_BCA', 'Transfer Bank (BCA Rekening Yayasan GMH)', 2),
('PAYMENT_METHOD', 'QRIS', 'QRIS Yayasan GMH', 3),
('PAYMENT_METHOD', 'CASH', 'Kas Tunai Kantor Yayasan', 4),

-- PAYROLL: Komponen Tunjangan Staf
('PAYROLL_ALLOWANCE', 'TUNJ_JABATAN', 'Tunjangan Jabatan', 1),
('PAYROLL_ALLOWANCE', 'TUNJ_TRANSPORT', 'Tunjangan Transport & Misi', 2),
('PAYROLL_ALLOWANCE', 'TUNJ_KEHADIRAN', 'Tunjangan Kehadiran', 3),

-- PAYROLL: Komponen Potongan Staf
('PAYROLL_DEDUCTION', 'BPJS_KES', 'BPJS Kesehatan', 1),
('PAYROLL_DEDUCTION', 'BPJS_TK', 'BPJS Ketenagakerjaan', 2),
('PAYROLL_DEDUCTION', 'PPH_21', 'PPh 21', 3),

-- BUILDING: Fase Pembangunan Fisik
('BUILDING_MILESTONE', 'LAHAN', 'Pembebasan Lahan', 1),
('BUILDING_MILESTONE', 'PERIZINAN', 'Perizinan & AMDAL', 2),
('BUILDING_MILESTONE', 'PONDASI', 'Pondasi & Struktur Bawah', 3),
('BUILDING_MILESTONE', 'STRUKTUR', 'Pekerjaan Struktur Utama', 4),
('BUILDING_MILESTONE', 'FINISHING', 'Finishing & Interior', 5),
('BUILDING_MILESTONE', 'PERESMIAN', 'Peresmian & Serah Terima', 6),

-- BUILDING: Kategori Belanja Material
('BUILDING_MATERIAL', 'SEMEN_PASIR', 'Semen & Pasir', 1),
('BUILDING_MATERIAL', 'BESI_BAJA', 'Besi & Baja', 2),
('BUILDING_MATERIAL', 'BATA_MORTAR', 'Bata & Mortar', 3),
('BUILDING_MATERIAL', 'KERAMIK_SANITAIR', 'Keramik & Sanitair', 4),
('BUILDING_MATERIAL', 'MEP', 'Elektrikal & Plumbing', 5),

-- PROGRAMS: Kategori Program
('PROGRAM_CATEGORY', 'FELLOWSHIP', 'Ibadah Persekutuan Alumni', 1),
('PROGRAM_CATEGORY', 'SEMINAR', 'Seminar & Pembinaan', 2),
('PROGRAM_CATEGORY', 'SOSIAL', 'Aksi Pelayanan Sosial', 3),
('PROGRAM_CATEGORY', 'ADMIN', 'Rapat Kerja Pengurus', 4),

-- PROGRAMS: Roster Role
('ROSTER_ROLE', 'SPEAKER', 'Pengkhotbah / Pembicara', 1),
('ROSTER_ROLE', 'WL', 'Pemimpin Pujian (WL)', 2),
('ROSTER_ROLE', 'MUSICIAN', 'Pemain Musik', 3),
('ROSTER_ROLE', 'SINGER', 'Singer / Song Leader', 4),
('ROSTER_ROLE', 'MULTIMEDIA', 'Multimedia & Sound', 5),

-- PRAYER: Kategori Pokok Doa
('PRAYER_CATEGORY', 'KESEHATAN', 'Kesehatan & Pemulihan', 1),
('PRAYER_CATEGORY', 'MISI', 'Pelayanan Misi & Pekabar Injil', 2),
('PRAYER_CATEGORY', 'KELUARGA', 'Keluarga & Pernikahan', 3),
('PRAYER_CATEGORY', 'STUDI', 'Studi & Mahasiswa Kampus', 4),
('PRAYER_CATEGORY', 'PEKERJAAN', 'Pekerjaan & Usaha', 5),
('PRAYER_CATEGORY', 'GEDUNG', 'Pembangunan Rumah Persekutuan', 6),
('PRAYER_CATEGORY', 'SYUKUR', 'Ucapan Syukur', 7),

-- PRAYER: Status Doa
('PRAYER_STATUS', 'NEW', 'Permohonan Baru', 1),
('PRAYER_STATUS', 'BEING_PRAYED', 'Sedang Didoakan', 2),
('PRAYER_STATUS', 'ANSWERED', 'Doa Terjawab', 3),

-- ASSETS: Kategori Aset
('ASSET_CATEGORY', 'MULTIMEDIA', 'Elektronik & Multimedia', 1),
('ASSET_CATEGORY', 'SOUND_MUSIC', 'Sound System & Alat Musik', 2),
('ASSET_CATEGORY', 'FURNITURE', 'Furnitur & Perlengkapan Ruangan', 3),
('ASSET_CATEGORY', 'PRAYER_ROOM', 'Fasilitas Ruang Doa & Konseling', 4),
('ASSET_CATEGORY', 'VEHICLE', 'Kendaraan Operasional Yayasan', 5),
('ASSET_CATEGORY', 'IT_COMP', 'Perangkat Komputer & IT', 6),

-- ASSETS: Lokasi Ruangan
('ASSET_LOCATION', 'SEKRETARIAT', 'Ruang Sekretariat Lantai 1', 1),
('ASSET_LOCATION', 'AULA', 'Aula Persekutuan Utama', 2),
('ASSET_LOCATION', 'RUANG_DOA', 'Ruang Doa & Konseling', 3),
('ASSET_LOCATION', 'GUDANG', 'Gudang Sarana', 4),

-- ASSETS: Kondisi Fisik
('PHYSICAL_CONDITION', 'GOOD', 'Baik (Sangat Layak)', 1),
('PHYSICAL_CONDITION', 'FAIR', 'Cukup (Perlu Perawatan)', 2),
('PHYSICAL_CONDITION', 'BROKEN', 'Rusak (Perlu Perbaikan)', 3),

-- SEKRETARIAT: Jenis Surat
('LETTER_CATEGORY', 'SK', 'Surat Keputusan (SK)', 1),
('LETTER_CATEGORY', 'ST', 'Surat Tugas (ST)', 2),
('LETTER_CATEGORY', 'SP', 'Surat Pengantar (SP)', 3),
('LETTER_CATEGORY', 'SU', 'Surat Undangan (SU)', 4),
('LETTER_CATEGORY', 'SKET', 'Surat Keterangan (SKet)', 5),
('LETTER_CATEGORY', 'SPB', 'Surat Pemberitahuan (SPb)', 6),
('LETTER_CATEGORY', 'MOU', 'Nota Kesepahaman (MOU)', 7),
('LETTER_CATEGORY', 'REK', 'Surat Rekomendasi (REK)', 8)
ON CONFLICT (category, code) DO UPDATE 
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order, is_active = TRUE;

-- 3. SEED FORM FIELD CONFIGS
INSERT INTO form_field_configs (feature_module, field_key, field_label, field_type, lookup_category, is_required, sort_order) VALUES
-- ALUMNI / MEMBERS
('ALUMNI', 'faculty', 'Fakultas Asal USU', 'DROPDOWN', 'FACULTY', true, 1),
('ALUMNI', 'major', 'Program Studi / Jurusan', 'TEXT', null, true, 2),
('ALUMNI', 'entryYear', 'Stambuk (Tahun Masuk)', 'NUMBER', null, true, 3),
('ALUMNI', 'profession', 'Profesi / Pekerjaan Saat Ini', 'DROPDOWN', 'PROFESSION_CATEGORY', false, 4),
('ALUMNI', 'ktb', 'Kelompok Tumbuh Bersama (KTB)', 'TEXT', null, false, 5),
('ALUMNI', 'maritalStatus', 'Status Pernikahan', 'DROPDOWN', 'MARITAL_STATUS', false, 6),
('ALUMNI', 'region', 'Wilayah Domisili Alumni', 'DROPDOWN', 'ALUMNI_REGION', false, 7),
('MEMBERS', 'faculty', 'Fakultas Asal USU', 'DROPDOWN', 'FACULTY', true, 1),
('MEMBERS', 'entryYear', 'Stambuk (Tahun Masuk)', 'NUMBER', null, true, 2),
('MEMBERS', 'profession', 'Profesi / Pekerjaan Saat Ini', 'TEXT', null, false, 3),
('MEMBERS', 'ktbGroup', 'Kelompok KTB Asal', 'TEXT', null, false, 4),

-- REGISTRASI
('REGISTRASI', 'nik', 'Nomor Induk Kependudukan (NIK 16 Digit)', 'TEXT', null, true, 1),
('REGISTRASI', 'wa', 'Nomor WhatsApp Aktif', 'TEXT', null, true, 2),
('REGISTRASI', 'homeAddress', 'Alamat Tempat Tinggal Saat Ini', 'TEXTAREA', null, true, 3),
('REGISTRASI', 'rejectionReason', 'Alasan Penolakan Tiket', 'DROPDOWN', 'REG_REJECTION_REASON', false, 4),

-- KEUANGAN
('KEUANGAN', 'donationCategory', 'Kategori Peruntukan Donasi', 'DROPDOWN', 'DONATION_TYPE', true, 1),
('KEUANGAN', 'operationalCategory', 'Kategori Belanja Kas Operasional', 'DROPDOWN', 'EXPENSE_CATEGORY', true, 2),
('KEUANGAN', 'paymentMethod', 'Metode Pembayaran / Kas', 'DROPDOWN', 'PAYMENT_METHOD', true, 3),
('FINANCE', 'donationCategory', 'Kategori Peruntukan Donasi', 'DROPDOWN', 'DONATION_TYPE', true, 1),
('FINANCE', 'operationalCategory', 'Kategori Akun Kas', 'DROPDOWN', 'EXPENSE_CATEGORY', true, 2),

-- PAYROLL
('PAYROLL', 'baseSalary', 'Gaji Pokok Karyawan / Pekabar Injil', 'NUMBER', null, true, 1),
('PAYROLL', 'allowanceType', 'Komponen Tunjangan Tambahan', 'DROPDOWN', 'PAYROLL_ALLOWANCE', false, 2),
('PAYROLL', 'deductionType', 'Komponen Potongan Gaji', 'DROPDOWN', 'PAYROLL_DEDUCTION', false, 3),

-- BUILDING
('BUILDING', 'milestone', 'Tahapan Konstruksi Rumah Persekutuan', 'DROPDOWN', 'BUILDING_MILESTONE', true, 1),
('BUILDING', 'materialCategory', 'Kategori Bahan Bangunan', 'DROPDOWN', 'BUILDING_MATERIAL', false, 2),

-- PROGRAMS
('PROGRAMS', 'programCategory', 'Kategori Agenda / Program', 'DROPDOWN', 'PROGRAM_CATEGORY', true, 1),
('PROGRAMS', 'rosterRole', 'Peran Penugasan Pelayan Ibadah', 'DROPDOWN', 'ROSTER_ROLE', true, 2),

-- PRAYER
('PRAYER', 'prayerCategory', 'Kategori Pokok Doa', 'DROPDOWN', 'PRAYER_CATEGORY', true, 1),
('PRAYER', 'prayerStatus', 'Status Tindak Lanjut Pendoa', 'DROPDOWN', 'PRAYER_STATUS', true, 2),
('PRAYER', 'status', 'Status Tindak Lanjut Doa', 'DROPDOWN', 'PRAYER_STATUS', true, 3),

-- ASSETS
('ASSETS', 'assetCategory', 'Kategori Inventaris Barang', 'DROPDOWN', 'ASSET_CATEGORY', true, 1),
('ASSETS', 'locationRoom', 'Lokasi Penempatan Ruangan', 'DROPDOWN', 'ASSET_LOCATION', true, 2),
('ASSETS', 'physicalCondition', 'Kondisi Fisik Sarana', 'DROPDOWN', 'PHYSICAL_CONDITION', true, 3),

-- SEKRETARIAT
('SEKRETARIAT', 'letterCategory', 'Klasifikasi Jenis Surat', 'DROPDOWN', 'LETTER_CATEGORY', true, 1)
ON CONFLICT (feature_module, field_key) DO UPDATE
SET field_label = EXCLUDED.field_label,
    field_type = EXCLUDED.field_type,
    lookup_category = EXCLUDED.lookup_category,
    is_required = EXCLUDED.is_required,
    sort_order = EXCLUDED.sort_order;

-- 4. SEED CHART OF ACCOUNTS (COA)
INSERT INTO chart_of_accounts (id, account_name, account_type, scope, is_active) VALUES
('1-1010', 'Kas Operasional Kantor Yayasan (Tunai)', 'ASSET', 'OPERASIONAL_KANTOR', true),
('1-1020', 'Rekening Bank Mandiri Operasional', 'ASSET', 'KAS_BESAR_YAYASAN', true),
('1-1030', 'Rekening Bank Khusus Pembangunan Rumah Persekutuan', 'ASSET', 'KAS_BESAR_YAYASAN', true),
('4-1010', 'Penerimaan Donasi Rutin & Persembahan Kasih', 'REVENUE', 'KAS_BESAR_YAYASAN', true),
('4-2010', 'Penerimaan Komitmen Janji Iman Pembangunan', 'REVENUE', 'KAS_BESAR_YAYASAN', true),
('5-1010', 'Beban Gaji Staf Yayasan & Honorarium Misionaris', 'EXPENSE', 'KAS_BESAR_YAYASAN', true),
('5-2010', 'Beban Operasional Sekretariat & Belanja Kantor', 'EXPENSE', 'OPERASIONAL_KANTOR', true),
('5-2020', 'Beban Pemeliharaan Fasilitas & Perlengkapan', 'EXPENSE', 'OPERASIONAL_KANTOR', true)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED DEPARTEMEN YAYASAN
INSERT INTO departments (id, name, description) VALUES
('DEWAN_PEMBINA', 'Dewan Pembina Yayasan', 'Pembinaan visi dan spiritual yayasan'),
('DEWAN_PENGAWAS', 'Dewan Pengawas Yayasan', 'Pengawasan tata kelola dan audit aset'),
('PENGURUS_HARIAN', 'Dewan Pengurus Harian', 'Manajemen eksekutif operasional yayasan GMH'),
('PELAYANAN_ALUMNI', 'Departemen Pelayanan Alumni', 'Pengembangan jaringan dan pastoral care alumni PA KMK'),
('PELAYANAN_MISI', 'Departemen Pelayanan Misi', 'Penjaminan pos pekabaran Injil dan misionaris daerah'),
('PELAYANAN_PEMBINAAN', 'Departemen Pelayanan Pembinaan', 'Pembinaan rohani mahasiswa kampus USU'),
('PENGEMBANGAN_BISNIS', 'Departemen Pengembangan & Pembangunan', 'Fundraising dan eksekusi Rumah Persekutuan GMH'),
('KOMUNIKASI', 'Departemen Komunikasi & Publikasi', 'Media digital, buletin warta yayasan, dan permohonan doa')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED BUILDING PROJECT
INSERT INTO building_projects (id, project_name, target_budget, current_funds, progress_percentage, status, description) VALUES
('a0000000-0000-0000-0000-000000000001', 'Pembangunan Rumah Persekutuan GMH PA KMK', 1800000000.00, 1224000000.00, 78, 'ON_PROGRESS', 'Pusat pembinaan mahasiswa, asrama, ruang doa dan sekretariat terpadu yayasan')
ON CONFLICT (id) DO NOTHING;
