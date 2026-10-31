# KNOWLEDGE BASE: SISTEM INFORMASI MANAJEMEN YAYASAN
**Entitas:** Yayasan Global Mission House (GMH) & PA KMK ([gmhpakmk.org](https://gmhpakmk.org/))  
**Kategori:** Yayasan Non-Gereja (Christian Non-Profit Foundation, Alumni Fellowship & Mission House)  
**Arsitektur:** Monolit Modular (Web UI + Backend API terpisah)  
**Dokumen Pendamping Terperinci:** [KNOWLEDGE_DATA_INTEGRATION_FLOWS.md](file:///c:/Users/infokes/Documents/New%20folder/yusuf-playground/GlobalMissionHouse/KNOWLEDGE_DATA_INTEGRATION_FLOWS.md)  
**Tanggal Penyusunan:** 2026-10-30  

---

## 1. Ringkasan Eksekutif & Latar Belakang

Sistem Informasi Manajemen Yayasan (Global Mission House - GMH PA KMK) adalah platform digital terpadu untuk mengelola seluruh aspek administrasi yayasan, database keanggotaan & alumni PA KMK USU, keuangan yayasan, proyek pembangunan Rumah Persekutuan, program pembinaan mahasiswa, pengutusan misi ke daerah, serta penggajian staf dan misionaris.

Sistem ini dirancang khusus untuk entitas **yayasan non-gereja** dengan keunggulan:
- **Transparansi & Tata Kelola Yayasan**: Dewan Pembina dan Dewan Pengawas memiliki visibilitas audit penuh (*supervisory access*) terhadap seluruh transaksi, mutasi keuangan, aset, dan aktivitas departemen.
- **Pemisahan Otoritas Keuangan & Payroll**: Bendahara Yayasan memegang kendali penuh atas modul **Penggajian (Payroll)** staf/misionaris dan kas besar yayasan, sedangkan Bendahara Admin memegang operasional rutin harian kantor yayasan dan kas kecil.
- **Care & Engagement Komunitas**: Pengingat otomatis hari ulang tahun anggota/alumni dan ulang tahun pernikahan anggota untuk mendukung perkunjungan dan penguatan komunitas alumni.
- **Sistem Utility Dinamis 100%**: Admin dapat dengan leluasa mengubah seluruh nama label, opsi dropdown, dan menambah field dinamis di semua modul tanpa perlu koding ulang atau migrasi database.
- **Registrasi & Data Entry Efisien**: Formulir mandiri pendaftaran alumni berbasis web publik (terintegrasi dengan [gmhpakmk.org/database-alumni](https://gmhpakmk.org/database-alumni/)) dengan alur verifikasi bertingkat serta bulk-upload data massal via Excel (dengan validasi dry-run).

---

## 2. Struktur Arsitektur Sistem (Sesuai `systemstruktur.text`)

Berdasarkan spesifikasi `systemstruktur.text`, sistem mengadopsi pola **Monolit Modular**:

```
global-mission-house/
├── apps/
│   ├── web/                          # Frontend UI (React / Next.js / Vite)
│   │   ├── public/                   # Asset statis, template excel, logo yayasan
│   │   └── src/
│   │       ├── app/                  # Routing, Layouts, Guards
│   │       ├── features/             # Modul UI per domain bisnis yayasan
│   │       │   ├── dashboard/        # Widget KPI Keuangan & Pengingat Ultah Anggota
│   │       │   ├── members/          # Database alumni PA KMK, anggota yayasan, keluarga
│   │       │   ├── registration/     # Form pendaftaran publik & inbox review admin
│   │       │   ├── finance-office/   # Kas operasional kantor yayasan & kas kecil
│   │       │   ├── finance-foundation# Donasi yayasan, Janji Iman pembangunan Rumah Persekutuan
│   │       │   ├── payroll/          # Khusus Bendahara Yayasan (Gaji staf & misionaris)
│   │       │   ├── building-project/ # Progres pembangunan Rumah Persekutuan GMH
│   │       │   ├── missions/         # Departemen Misi, Pos Pekabar Injil, Pembinaan KTB
│   │       │   ├── programs/         # Jadwal persekutuan alumni, seminar, warta digital
│   │       │   ├── prayer/           # Form permohonan doa publik & tindak lanjut pendoa
│   │       │   ├── assets/           # Inventaris fasilitas Rumah Persekutuan & peminjaman
│   │       │   ├── reports/          # Laporan keuangan yayasan, demografi alumni
│   │       │   └── utility/          # Konfigurasi field dinamis & lookups (dropdown)
│   │       ├── components/           # UI kit (Table, DynamicForm, Modal, Uploader)
│   │       ├── services/             # HTTP Client / Axios API calls
│   │       ├── hooks/                # Custom React hooks
│   │       └── utils/
│   │
│   └── api/                          # Backend Monolit Modular (Node.js TypeScript)
│       └── src/
│           ├── app/                  # Bootstrap server & registrasi modul
│           ├── config/               # Environment variables
│           ├── middleware/           # Auth JWT, RBAC Guard, Audit Logger
│           ├── modules/              # Domain modules independen
│           │   ├── auth/             # Login, refresh token, profil
│           │   ├── rbac/             # Roles, permissions, data filter
│           │   ├── dynamic-fields/   # Engine konfigurasi field & lookups dinamis
│           │   ├── members/          # CRUD anggota/alumni & Excel import engine
│           │   ├── registration/     # Endpoint publik registrasi mandiri
│           │   ├── finance/          # Kas kantor, donasi yayasan, janji iman pembangunan
│           │   ├── payroll/          # Modul penggajian terisolasi (Bendahara Yayasan)
│           │   ├── building/         # Proyek pembangunan Rumah Persekutuan GMH
│           │   ├── missions/         # Pelayanan misi & pembinaan mahasiswa
│           │   ├── programs/         # Program persekutuan alumni & warta digital
│           │   ├── prayer/           # Permohonan doa publik & disposisi pendoa
│           │   ├── assets/           # Pencatatan aset & peminjaman fasilitas
│           │   └── reports/          # Generator laporan PDF resmi & Excel audit
│           ├── database/             # ORM (Prisma/Drizzle), migrasi, seeder
│           └── shared/               # Exception filter, logger, response formatter
│
├── packages/
│   └── contracts/                    # Shared DTOs, Zod validation schemas, Types
├── docs/                             # Panduan arsitektur & dokumentasi API
├── .env.example
├── KNOWLEDGE.md
├── KNOWLEDGE_DATA_INTEGRATION_FLOWS.md
└── README.md
```

---

## 3. Matriks Peran & Hak Akses Yayasan (RBAC)

| Peran (Role) | Tanggung Jawab & Batasan Akses |
| :--- | :--- |
| **1. Super Admin (IT)** | Konfigurasi sistem utility (dynamic fields), manajemen akun pengguna, backup database, audit log. |
| **2. Dewan Pengawas / Pembina Yayasan** | **Akses Supervisi Penuh (Read-All & Audit)** ke seluruh laporan keuangan, donasi pembangunan, perkembangan alumni, dan aset yayasan. |
| **3. Bendahara Yayasan** | **Memegang kendali penuh Modul Penggajian (Payroll)** staf yayasan & misionaris, kas besar yayasan, dan donasi pembangunan Rumah Persekutuan. |
| **4. Bendahara Admin (Operasional)** | Mengelola kas kecil yayasan, biaya operasional rutin kantor yayasan, dan SPJ belanja program departemen. *(Tidak bisa akses Payroll)*. |
| **5. Admin Operasional Yayasan** | Input/edit data anggota/alumni, verifikasi & approval pendaftaran anggota baru, bulk import Excel, jadwal kegiatan yayasan, dan aset. *(Tidak bisa akses Payroll)*. |
| **6. Alumni / Anggota Terdaftar** | Akses profil mandiri, kartu anggota digital, daftar komitmen janji iman pribadi, kirim permohonan doa, dan akses buletin warta yayasan. |
| **7. Calon Anggota (Publik)** | Mengisi formulir pendaftaran mandiri di web publik dan mengecek status tiket verifikasinya. |

---

## 4. Spesifikasi Modul-Modul Utama Yayasan

### A. Form Pendaftaran Mandiri Alumni & Workflow Approval
- **Kanal Masuk**: Mengadopsi formulir yang ada pada situs [gmhpakmk.org/database-alumni](https://gmhpakmk.org/database-alumni/).
- **Data yang Dikumpulkan**:
  - Identitas Diri: Nama Lengkap, NIK, Jenis Kelamin, Tempat/Tanggal Lahir, No. WhatsApp, Email, Alamat Domisili, Provinsi, Kota.
  - Data Akademik Alumni: Fakultas, Jurusan, Stambuk (Tahun Masuk Kampus), Tahun Kelulusan, Kelompok Tumbuh Bersama (KTB) asal.
  - Data Profesi & Pelayanan: Pekerjaan Saat Ini, Nama Perusahaan/Instansi, Minat Pelayanan Alumni.
  - Data Keluarga: Status Pernikahan, Tanggal Pernikahan (untuk pengingat hari ulang tahun pernikahan), Nama Pasangan, Jumlah Anak.
- **Mekanisme Review**:
  1. Data tersimpan di `member_registrations` dengan status `PENDING`.
  2. Notifikasi dikirimkan ke Admin Operasional Yayasan.
  3. Admin memverifikasi keabsahan data alumni.
  4. Begitu di-approve, sistem otomatis memindahkan data ke tabel `members` & `alumni_profiles`, menerbitkan **Nomor Induk Anggota (NIA)** berformat unik (`GMH-2026-XXXXX`), dan mengirimkan notifikasi resmi via WhatsApp ke pendaftar.

### B. Bulk Upload Anggota Menggunakan Excel (Two-Phase Dry Run)
- Admin yayasan mengunduh template resmi Excel `.xlsx`.
- **Tahap 1 (Dry-Run)**: Sistem memvalidasi duplikasi (NIK, No. WhatsApp, Nama, Stambuk). Sistem menampilkan pratinjau data valid vs baris error tanpa memodifikasi database.
- **Tahap 2 (Commit)**: Admin meninjau preview dan mengonfirmasi penyimpanan. Database menjalankan batch insert di dalam transaksi database (`BEGIN ... COMMIT`) agar data terjamin konsisten.

### C. Sistem Utility Dinamis (Engine Dynamic Fields & Lookups)
- **Kebutuhan**: Admin dengan leluasa dapat mengubah seluruh nama label, opsi dropdown, dan menambah field kustom di semua fitur.
- **Implementasi**:
  1. Tabel `system_lookups`: Menampung seluruh pilihan dropdown dinamis (kategori donasi, wilayah/kring alumni, fakultas, dll.).
  2. Tabel `form_field_configs`: Menampung metadata konfigurasi field (label, tipe input, wajib/opsional, visibilitas, urutan tampilan).
  3. Kolom `custom_fields JSONB`: Menampung seluruh nilai field kustom pada entitas anggota, transaksi, dan aset.
- **Hasil**: Perubahan label atau penambahan pilihan dropdown langsung aktif seketika di frontend tanpa perlu menyentuh kode program atau merestart backend.

### D. Modul Penggajian Terisolasi (Payroll Khusus Bendahara Yayasan)
- **Tujuan**: Menjaga kerahasiaan nominal gaji/honorarium staf yayasan dan pekabar Injil/misionaris dari operator admin biasa.
- **Fitur**:
  - Gaji pokok staf yayasan & misionaris pos pelayanan.
  - Tunjangan khusus (tunjangan misi daerah, tunjangan transport, tunjangan kesehatan).
  - Potongan (pinjaman staf, iuran wajib).
  - Perhitungan gaji bersih (*Net Salary*) otomatis.
  - Generator **Slip Gaji Digital PDF ber-password** yang terkirim langsung ke email/WhatsApp staf.
  - Pembentukan jurnal pengeluaran beban gaji yayasan secara otomatis.

### E. Proyek Pembangunan Rumah Persekutuan GMH & Janji Iman (Pledge)
- Modul pencatatan komitmen donasi pembangunan jangka panjang oleh alumni dan mitra donatur.
- Fitur pelacakan angsuran donasi per donatur, penerbitan E-Kuitansi resmi ber-QR Code, dan dashboard real-time persentase dana terkumpul terhadap target anggaran pembangunan fisik.

---

Untuk detail skema DDL SQL lengkap, tabel relasional, dan diagram alur sekuensial (Sequence Diagram Mermaid), silakan buka dokumen pendamping:
📄 **[KNOWLEDGE_DATA_INTEGRATION_FLOWS.md](file:///c:/Users/infokes/Documents/New%20folder/yusuf-playground/GlobalMissionHouse/KNOWLEDGE_DATA_INTEGRATION_FLOWS.md)**
