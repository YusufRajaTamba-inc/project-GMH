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
('KOORDINATOR_DEPARTEMEN', 'Koordinator Departemen', 'Kepala divisi pelayanan alumni, misi, pembinaan mahasiswa, atau komunikasi'),
('ANGGOTA_ALUMNI', 'Anggota & Alumni PA KMK', 'Alumni dan anggota yayasan dengan akses profil pribadi dan partisipasi donasi')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED SYSTEM LOOKUPS
INSERT INTO system_lookups (category, code, label, sort_order) VALUES
-- Fakultas USU
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

-- Kring Wilayah Alumni
('SECTOR_ZONE', 'MEDAN_KOTA', 'Wilayah Medan Kota & Sekitarnya', 1),
('SECTOR_ZONE', 'MEDAN_SELAYANG', 'Wilayah Medan Selayang & Kampus USU', 2),
('SECTOR_ZONE', 'DELI_SERDANG', 'Wilayah Deli Serdang & Binjai', 3),
('SECTOR_ZONE', 'JABODETABEK', 'Wilayah Alumni Jabodetabek', 4),
('SECTOR_ZONE', 'SUMATERA_UTARA', 'Wilayah Luar Medan (Pematang Siantar, Toba, Karo)', 5),
('SECTOR_ZONE', 'LUAR_SUMATERA', 'Wilayah Luar Sumatera / Nasional', 6),
('SECTOR_ZONE', 'LUAR_NEGERI', 'Alumni Mancanegara (Overseas Fellowship)', 7),

-- Kategori Donasi
('DONATION_TYPE', 'RUMAH_PERSEKUTUAN', 'Pembangunan Rumah Persekutuan GMH', 1),
('DONATION_TYPE', 'MISI_PENGUTUSAN', 'Dana Pengutusan Pekabar Injil / Misi', 2),
('DONATION_TYPE', 'BEASISWA_KAMPUS', 'Beasiswa Mahasiswa Binaan PA KMK', 3),
('DONATION_TYPE', 'KAS_OPERASIONAL', 'Persembahan Kasih Operasional Yayasan', 4),
('DONATION_TYPE', 'RETRET_PEMBINAAN', 'Sponsorship Retret & Seminar Mahasiswa', 5),

-- Kategori Belanja Kas Operasional
('EXPENSE_CATEGORY', 'ATK_KANTOR', 'Belanja ATK & Kebutuhan Kantor', 1),
('EXPENSE_CATEGORY', 'UTILITAS', 'Listrik, Air & Internet Yayasan', 2),
('EXPENSE_CATEGORY', 'KONSUMSI', 'Konsumsi Rapat & Persekutuan Alumni', 3),
('EXPENSE_CATEGORY', 'TRANSPORT_DINAS', 'Transport & Perjalanan Dinas Staf', 4),
('EXPENSE_CATEGORY', 'PEMELIHARAAN', 'Pemeliharaan Gedung & Inventaris', 5),

-- Status Permohonan Doa
('PRAYER_STATUS', 'NEW', 'Baru Masuk', 1),
('PRAYER_STATUS', 'BEING_PRAYED', 'Sedang Didukung Doa', 2),
('PRAYER_STATUS', 'ANSWERED', 'Sudah Dijawab Tuhan', 3)
ON CONFLICT (category, code) DO NOTHING;

-- 3. SEED FORM FIELD CONFIGS
INSERT INTO form_field_configs (feature_module, field_key, field_label, field_type, lookup_category, is_required, sort_order) VALUES
('MEMBERS', 'faculty', 'Fakultas Asal USU', 'DROPDOWN', 'FACULTY', true, 1),
('MEMBERS', 'entryYear', 'Stambuk (Tahun Masuk)', 'NUMBER', null, true, 2),
('MEMBERS', 'profession', 'Profesi / Pekerjaan Saat Ini', 'TEXT', null, false, 3),
('MEMBERS', 'ktbGroup', 'Kelompok KTB Asal', 'TEXT', null, false, 4),
('FINANCE', 'donationCategory', 'Kategori Peruntukan Donasi', 'DROPDOWN', 'DONATION_TYPE', true, 1),
('FINANCE', 'operationalCategory', 'Kategori Akun Kas', 'DROPDOWN', 'EXPENSE_CATEGORY', true, 2),
('PRAYER', 'status', 'Status Tindak Lanjut Doa', 'DROPDOWN', 'PRAYER_STATUS', true, 1)
ON CONFLICT (feature_module, field_key) DO NOTHING;

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
