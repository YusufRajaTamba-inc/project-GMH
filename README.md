# Yayasan Global Mission House (GMH PA KMK)
> **Sistem Informasi Manajemen Yayasan Non-Gereja Terintegrasi**  
> Resmi mengelola basis data alumni Perkumpulan Alumni Kristen Mahasiswa Kota (PA KMK USU Medan), perbendaharaan yayasan, proyek pembangunan Rumah Persekutuan, serta administrasi kepegawaian.

---

## 🏛️ 1. Ikhtisar Arsitektur

Sistem dibangun menggunakan arsitektur **Modular Monolith** dengan pembagian tanggung jawab yang ketat sesuai spesifikasi [KNOWLEDGE_DATA_INTEGRATION_FLOWS.md](file:///c:/Users/infokes/Documents/New%20folder/yusuf-playground/GlobalMissionHouse/KNOWLEDGE_DATA_INTEGRATION_FLOWS.md) dan [systemstruktur.text](file:///c:/Users/infokes/Documents/New%20folder/yusuf-playground/GlobalMissionHouse/systemstruktur.text):

```
GlobalMissionHouse/
├── apps/
│   ├── api/                       # REST API (Express, TypeScript, pg Pool, JWT, RBAC)
│   │   ├── src/
│   │   │   ├── config/            # Database pool (PostgreSQL 16) & Envs
│   │   │   ├── database/          # schema.sql (23 tabel), seeds.sql, init.ts, seed.ts
│   │   │   ├── middleware/        # auth.middleware, rbac.guard, audit.interceptor
│   │   │   ├── modules/           # auth, utility, registrations, members, finance, payroll, etc.
│   │   │   └── server.ts          # Server entry point (Port 4000)
│   └── web/                       # Single Page Application (React 19, TypeScript, Vite)
│       ├── src/
│       │   ├── components/        # Layout, Sidebar, Topbar
│       │   ├── features/          # Dashboard, Members, Registrations, Finance, Payroll, Utility
│       │   ├── state/             # AuthContext, MemberStoreContext, FinanceStoreContext, DynamicConfigContext
│       │   └── services/api.ts    # Central HTTP API client
├── docker-compose.yml             # PostgreSQL 16 container (`gmh-postgres`) & persistent storage
└── package.json                   # Workspaces config & scripts
```

---

## 🔐 2. Autentikasi & Matriks Peran (RBAC)

Semua akun terdaftar memiliki kata sandi default: **`admin123`** (di-hash dengan `bcryptjs` salt rounds 10):

| Username | Peran (Role ID) | Deskripsi Hak Akses |
| :--- | :--- | :--- |
| `superadmin` | `SUPER_ADMIN` | Hak akses penuh seluruh modul & konfigurasi sistem |
| `dewan.pengawas` | `DEWAN_PENGAWAS_PEMBINA` | Read-only audit seluruh yayasan, termasuk modul Payroll & Rekening Pusat |
| `pengurus.harian` | `PENGURUS_HARIAN` | Eksekutif yayasan, operasional, persetujuan anggota, program kerja |
| `bendahara.yayasan` | `BENDAHARA_YAYASAN` | Pemegang kas utama yayasan, Janji Iman, dan **penggajian staf yayasan** |
| `bendahara.admin` | `BENDAHARA_ADMIN` | Pengelola pencatatan kas kecil/operasional kantor (Terisolasi dari Payroll) |
| `koordinator.misi` | `KOORDINATOR_DEPARTEMEN` | Koordinator departemen pelayanan mahasiswa & persekutuan alumni |

> [!NOTE]
> **Akses Anggota & Alumni**: Anggota dan alumni jemaat tidak memiliki akun login operator pada sistem FoundationOS internal ini, melainkan mengakses portal/website informasi publik yang terpisah.

> [!IMPORTANT]
> **Isolasi Modul Payroll (Flow 4)**:
> Akses ke rute `/api/v1/payroll/*` strictly dibatasi hanya untuk `BENDAHARA_YAYASAN` dan `DEWAN_PENGAWAS_PEMBINA`. Peran lain seperti `BENDAHARA_ADMIN` akan ditolak dengan respons status `403 Forbidden` (`Akses ditolak: Modul penggajian rahasia yayasan`).

---

## 🗄️ 3. Skema Database Relasional PostgreSQL (23 Tabel)

1. **`roles`**: Definisi 6 tingkatan hak akses operasional yayasan.
2. **`users`**: Kredensial staf/pengurus (`password_hash`, `role_id`, status).
3. **`audit_logs`**: Pencatatan jejak audit aksi administratif.
4. **`system_lookups`**: Master data dinamis (Fakultas, Wilayah, Kategori Donasi/Kas/Doa).
5. **`form_field_configs`**: Konfigurasi label kustom formulir (`field_key`, `field_label`).
6. **`members`**: Master anggota yayasan/alumni (dengan nomor `nia` unik `GMH-YYYY-XXXXX`).
7. **`alumni_profiles`**: Profil khusus alumni USU (Fakultas, Jurusan, Stambuk, KTB, Profesi).
8. **`member_registrations`**: Tiket pendaftaran mandiri publik (`REG-GMH-YYYYMM-XXXX`).
9. **`departments`**: Struktur departemen yayasan.
10. **`staff_members`**: Profil karyawan tetap, kontrak, dan part-time yayasan.
11. **`payroll_periods`**: Periode penggajian bulanan.
12. **`payroll_records`**: Rincian gaji (gaji pokok, tunjangan, potongan PPh, status pencairan).
13. **`chart_of_accounts`**: Bagan akun akuntansi yayasan (COA 1-xxxx s/d 5-xxxx).
14. **`building_projects`**: Tracking pembangunan fisik Rumah Persekutuan GMH.
15. **`pledges`**: Komitmen Janji Iman donatur untuk proyek fisik.
16. **`financial_transactions`**: Transaksi kas operasional dan kas pusat berstandar akuntansi.
17. **`foundation_programs`**: Program kerja persekutuan dan pembinaan alumni (terintegrasi JSONB panitia & tasks).
18. **`prayer_requests`**: Permohonan pokok doa dari anggota/alumni.
19. **`assets`**: Inventaris sarana prasarana yayasan.
20. **`asset_loans`**: Riwayat peminjaman aset dan sarana kantor.
21. **`secretariat_incoming_letters` & `secretariat_outgoing_letters`**: Tata kelola surat-menyurat yayasan.
22. **`audit_logs`**: Rekam jejak audit keamanan dan perubahan sistem.

---

## ⚡ 4. 5 Alur Integrasi Bisnis Utama (Implementation Flows)

### Flow 1: Pendaftaran Mandiri Publik & Persetujuan NIA
- **Publik**: Form `/register` mengirimkan data ke `POST /api/v1/registrations/public/register-alumni`.
- Sistem menerbitkan nomor tiket: `REG-GMH-YYYYMM-XXX`.
- **Pengurus**: Pada halaman `/registrations`, pengurus meninjau data pendaftar.
- Aksi `POST /api/v1/registrations/:id/approve` mengeksekusi transaksi atomik di database:
  - Mengubah status pendaftaran menjadi `APPROVED`.
  - Menerbitkan Nomor Induk Anggota resmi: `GMH-YYYY-XXXXX`.
  - Menghubungkan profil alumni USU ke tabel `members` dan `alumni_profiles`.

### Flow 2: Impor Massal Excel Dua Fase (Dry Run & Commit)
- **Fase 1 (Validasi)**: Endpoint `POST /api/v1/members/bulk-dry-run` memvalidasi NIK, kesesuaian stambuk USU, dan mendeteksi duplikasi tanpa mengubah isi database. Menghasilkan ringkasan baris valid & error.
- **Fase 2 (Commit Transaksional)**: Endpoint `POST /api/v1/members/bulk-commit` menyimpan semua data valid sekaligus di dalam transaksi database tunggal dan menerbitkan NIA berurutan.

### Flow 3: Keuangan Operasional, Janji Iman & Kuitansi Elektronik QR
- Kas operasional dicatat melalui `POST /api/v1/finance/transactions`.
- Pembayaran cicilan Janji Iman diproses via `POST /api/v1/finance/donations/payment`.
- Sistem menerbitkan nomor kuitansi unik: `KWT-GMH-YYYYMM-XXX`.
- Kuitansi dapat diverifikasi secara publik via `GET /api/v1/finance/e-receipt/verify/:receiptNumber` untuk menjamin transparansi akuntabilitas perbendaharaan yayasan.

### Flow 4: Penggajian Karyawan & Jurnal Akuntansi Otomatis
- Endpoint: `POST /api/v1/payroll/generate-draft` dan `POST /api/v1/payroll/disburse`.
- Saat pembayaran gaji dicairkan (`disburse`), sistem secara otomatis memposting jurnal pengeluaran kas ke Buku Besar Akun `5-1010` (Beban Gaji Staf Yayasan).

### Flow 5: Konfigurasi Label & Master Data Dinamis
- Pengurus dapat mengubah label kolom atau menambah opsi master data (Fakultas, Profesi, Kategori) via `api.utility`.
- Nilai disimpan ke `system_lookups` dan `form_field_configs` sehingga tidak memerlukan refactor kode statis saat ada pembaruan form.

---

## 🚀 5. Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
- **Node.js** (v18+)
- **Docker Desktop** (untuk database PostgreSQL)

### Langkah 1: Jalankan Database PostgreSQL
```bash
docker compose up -d
```
Container `gmh-postgres` akan berjalan di `localhost:5432` dengan database `foundationos`.

### Langkah 2: Inisialisasi Skema & Data Awal (Seeds)
```bash
# Inisialisasi 23 tabel PostgreSQL
npm --prefix apps/api run db:init

# Isi data awal (Roles, Users bcrypt, Lookups, COA, Anggota Alumni)
npm --prefix apps/api run db:seed
```

### Langkah 3: Jalankan Backend API
```bash
npm --prefix apps/api run dev
```
Backend API berjalan di: `http://localhost:4000/api/v1`  
Health check: `http://localhost:4000/health`

### Langkah 4: Jalankan Frontend Web
```bash
npm --prefix apps/web run dev
```
Buka peramban di: `http://localhost:5173/`

---

## 🧪 6. Validasi Build
Untuk memverifikasi integritas tipe TypeScript dan build produksi:
```bash
# Build backend
npm --prefix apps/api run build

# Build frontend
npm --prefix apps/web run build
```
Kedua perintah di atas harus berhasil dengan exit code `0`.
>>>>>>> c0d27c7 (feat: inisialisasi arsitektur Sistem Informasi Manajemen Yayasan Global Mission House (GMH PA KMK))
