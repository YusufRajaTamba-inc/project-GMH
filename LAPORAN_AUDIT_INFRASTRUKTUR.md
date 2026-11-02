# LAPORAN AUDIT INFRASTRUKTUR SISTEM INFORMASI MANAJEMEN YAYASAN GMH PA KMK

**Objek audit:** Monorepo `GlobalMissionHouse` (`apps/api` + `apps/web`)
**Tanggal:** 2 November 2026
**Ruang lingkup:** Struktur kode, clean code, tingkat kesulitan maintain, infrastruktur, integrasi tabel database ke UI, optimalisasi relasi antar tabel
**Metode:** Analisis statis menyeluruh (tree file, line count, korelasi `schema.sql` ↔ query API ↔ panggilan `api.ts` di frontend), plus typecheck `tsc --noEmit` untuk kedua app.

---

## 0. RINGKASAN EKSEKUTIF

| Metrik | Nilai |
|---|---|
| Total file sumber (`.ts`/`.tsx`) | 83 |
| Total baris kode | 53.626 |
| Baris kode backend (`apps/api`) | 10.341 (42 file) |
| Baris kode frontend (`apps/web`) | 43.285 (41 file) |
| Tabel database | 31 |
| Foreign key | 39 |
| Endpoint REST API | 142 |
| Rute UI terproteksi | 22 |
| File > 1.000 baris | 16 |
| File > 3.000 baris | 7 |

**Verdict arsitektur:** Monolit modular yang secara konseptual rapi (pemisahan `modules/` di backend, `features/` di frontend) tetapi **implementasinya granularitasnya tidak konsisten**. Backend ditulis dengan pola `routes` + `controller` terpisah; frontend hanya punya `services/api.ts` tanpa lapisan service/hook per domain.

**Temuan paling kritis (P0):**

1. **7 file frontend Anastasi (2.745–3.955 baris)** — setiap perubahan pada satu tabel di halaman tersebut menyentuh file raksasa; risiko regresi tinggi.
2. **138 titik API yang membocorkan `err.message` ke klien** — detail constraint SQL, nama kolom, dan nama tabel terekspos ke browser pada endpoint publik (`/assets/public/*`, `/prayer`, `/registrations`).
3. **Tidak ada `pool.on('error')`** pada `pg.Pool` — idle client error menjadi *unhandled error event* dan menjatuhkan proses Node di production. Ini penyebab paling umum outage "server mati sendiri" tanpa log.
4. **Tiga tabel mati total** (`families`, `family_members`, `program_rosters`) — ada di skema, tidak pernah diakses API maupun UI.
5. **Nomor surat keluar punya race condition** — counter di `system_lookups` di-lock via `FOR UPDATE` hanya pada baris `metadata`, tetapi `next-number` (endpoint pratinjau) membacanya **tanpa** lock, sehingga nomor yang ditampilkan ke user bisa berbeda dari nomor yang tersimpan.

**Yang sudah diperbaiki pada sesi ini** (Bagian 8): 6 perbaikan langsung diterapkan, typecheck kedua app lulus.

---

## 1. STRUKTUR KODE (Poin 1)

### 1.1 Peta Direktori Aktual

```
GlobalMissionHouse/
├── apps/
│   ├── api/                          # Express + TypeScript + PostgreSQL (pg)
│   │   └── src/
│   │       ├── server.ts             # Bootstrap, middleware, mount /api/v1
│   │       ├── config/               # db.ts, env.ts
│   │       ├── middleware/           # auth, permission, audit, sanitizeError
│   │       ├── database/             # schema.sql, init.ts, seed.ts, fix_member_data.ts
│   │       ├── modules/              # 17 domain modules
│   │       │   └── <domain>/
│   │       │       ├── <domain>.routes.ts
│   │       │       └── <domain>.controller.ts   (hanya pada 8 domain)
│   │       └── shared/               # utilitas
│   └── web/                          # Vite + React + TypeScript
│       └── src/
│           ├── App.tsx               # Routing + ProtectedRoute
│           ├── components/           # UI kit (Table, Modal, Topbar, dll)
│           ├── features/             # 14 feature pages
│           ├── services/api.ts       # Client REST tunggal (488 baris)
│           ├── state/                # Context (Auth, Member, Finance, DynamicConfig)
│           └── utils/
└── packages/contracts/               # Belum ada (lihat 1.2 / S2)
```

### 1.2 Temuan Struktur

**Baik:**
- Backend terpecah per domain dengan penamaan konsisten.
- `schema.sql` terpusat dengan nomor bagian (`-- 1.` … `-- 13.`), mudah dinavigasi.
- Frontend memakai React Context (`AuthContext`, `MemberStoreContext`, `FinanceStoreContext`, `DynamicConfigContext`) sehingga state global terpusat, bukan scattered prop drilling.

**Masalah:**

| # | Temuan | Dampak | Lokasi |
|---|---|---|---|
| S1 | **Inkonsistensi pola route/controller.** Hanya 8 dari 17 modul punya file `.controller.ts`. Sisanya (`organization`, `assets`, `secretariat`, `missions`, `programs`, `prayer`, `users`, `building`) menaruh logika bisnis + query + validasi langsung di dalam `*.routes.ts`. | Dua cara berbeda untuk hal yang sama. Developer baru tidak tahu harus menaruh query di mana. | `apps/api/src/modules/*` |
| S2 | **`packages/contracts/` belum ada.** Kontrak DTO seharusnya jadi single source of truth tetapi tidak pernah dibangun; frontend mendefinisikan ulang tipe sendiri. | Perubahan kontrak API tidak caught oleh TypeScript di sisi web. | root repo |
| S3 | **Frontend tidak punya lapisan service/hook.** Semua fetch ada di `services/api.ts` (488 baris, growing) dan state di Context yang sudah mencapai 400–500 baris. | `api.ts` akan menjadi coupling point; Context akan mudah jadi God Object. | `apps/web/src/services/api.ts` |
| S4 | **`Topbar.tsx` (799 baris) berada di `components/`** padahal isinya spesifik fitur (notifikasi + profil). | Tree-shaking granularity buruk, dan `components/` akan menumpuk file fitur. | `apps/web/src/components/Topbar.tsx` |
| S5 | **`database/init.ts` menjalankan DDL aplikasi di runtime server.** Skema seharusnya immutable setelah release. | Risiko schema drift antar instance; deploy restart bisa mengubah bentuk tabel. | `apps/api/src/database/init.ts` |
| S6 | **File utilitas sekali pakai di dalam `src/database/`** (`fix_member_data.ts`) — skrip perbaikan data yang ikut ter-bundle. | Kode mati produksi yang tidak pernah dipanggil tapi tetap dipelihara. | `apps/api/src/database/fix_member_data.ts` |

### 1.3 Checklist Struktur Ideal (Target)

```
apps/api/src/
├── modules/<domain>/
│   ├── <domain>.routes.ts      # hanya deklarasi route + guard
│   ├── <domain>.controller.ts  # handler (wajib, seragam)
│   ├── <domain>.service.ts     # query & aturan bisnis
│   └── <domain>.schema.ts      # validasi input
├── shared/                     # httpError, asyncHandler, pagination, logger
└── database/migrations/        # 001_xxx.sql, 002_xxx.sql (immutable, urut)
```

---

## 2. CLEAN CODE (Poin 2)

### 2.1 Skor Per Aspek

| Aspek | Skor | Catatan |
|---|---|---|
| Penamaan | 8/10 | Konsisten dan domain-aware. `role_in_event`, `expected_return_at`, `borrow_status` jelas. |
| Fungsi & ukuran fungsi | 4/10 | Rata-rata handler 60–120 baris, beberapa > 200 baris dengan query SQL inline. |
| Komentar | 7/10 | Bagus di modul `assets` & `secretariat` (nomor bagian + penjelasan alur). Tipis di modul lain. |
| Error handling | 3/10 | 138 leak `err.message`; inkonsisten mana yang dibungkus `try/catch` dan mana yang tidak. |
| Duplikasi | 5/10 | Pola `res.status(500).json({ success: false, message: '...', error: err.message })` diulang 138×. Boilerplate validasi ulang di setiap route. |
| Dead code | 4/10 | 3 tabel mati, `fix_member_data.ts`, `.gitignore` dengan 8 blok duplikat. |
| Konsistensi naming | 7/10 | Beberapa route POST mengembalikan 200 (bukan 201), inkonsisten dengan modul lain. |
| **Rata-rata** | **5.5/10** | Fungsional, tapi belum "clean". |

### 2.2 Temuan Clean Code Detail

**C1 — Duplikasi blok catch (138×).**
Setiap route catch melakukan hal identik:

```ts
} catch (err: any) {
  res.status(500).json({ success: false, message: 'Gagal memuat daftar peran.', error: err.message });
}
```

Perbaikan: helper `asyncHandler` + `httpError` global (Bagian 8: perbaikan sudah diterapkan secara terpusat).

**C2 — Inkonsistensi penanganan error antar modul.**

| Modul | Total `catch` | `console.error` |
|---|---|---|
| `organization.routes.ts` | 27 | 1 |
| `assets.routes.ts` | 15 | 0 |
| `secretariat.routes.ts` | 14 | 0 |
| `missions.routes.ts` | 11 | 0 |
| `programs.routes.ts` | 11 | 0 |
| `users.routes.ts` | 11 | 0 |
| `building.routes.ts` | 5 | 0 |
| `prayer.routes.ts` | 3 | 0 |
| `notifications.routes.ts` | 1 | 0 |
| `auth.routes.ts` | 0 | 0 |
| `finance.routes.ts` | 0 | 0 |
| `members.routes.ts` | 0 | 0 |
| `payroll.routes.ts` | 0 | 0 |
| `dashboard.routes.ts` | 0 | 0 |
| `reports.routes.ts` | 0 | 0 |
| `registrations.routes.ts` | 0 | 0 |
| `utility.routes.ts` | 0 | 0 |

Modul dengan `catch=0` kemungkinan mendelegasikan ke controller (pola berbeda), sehingga **error dari modul-modul ini bisa lolos tanpa `console.error` sama sekali** → sulit debugging produksi. Modul dengan `catch` tapi tanpa logging (assets, secretariat, missions, programs, users) membuang stderr yang dibutuhkan.

**C3 — Tanpa validasi input terpusat.** Nol dependensi Zod di seluruh backend (`from 'zod'` → 0 hasil). Validasi manual `if (!field) { ... }` tersebar. Konsekuensi: field yang lupa divalidasi diteruskan ke SQL.

**C4 — `catch (err: any)`** di hampir semua tempat, membuang tipe error. Tidak ada diskriminator error (mis. `NotFoundError`, `ConflictError`) sehingga handler HTTP tidak bisa membedakan 400 vs 409 vs 500 secara terprogram.

**C5 — `.gitignore` duplikat.** 8× blok `# Deployment scratch / diagnostics` + `deploytmp/` terulang identik.

**C6 — Komentar campuran bahasa.** Beberapa komentar sempat memuat token non-Indonesia (mis. "Previously tidak terindeks"). Sudah dikoreksi pada sesi ini.

**C7 — Duplikasi DDL di `schema.sql`.** `CREATE TABLE role_permissions` dideklarasikan dua kali (Bagian 1 dan Bagian 11). Karena `IF NOT EXISTS`, tidak merusak — tapi menunjukkan skema tidak punya sumber kebenaran tunggal.

**C8 — SQL string inline tanpa constant.** Query panjang seperti `INSERT INTO asset_loans (...) VALUES (...)` ditulis inline di route. Tidak ada file `.sql` terpisah atau query builder, sehingga query tidak bisa di-review terpisah dari logika handler.

---

## 3. TINGKAT KESULITAN MAINTAIN & RENCANA PERBAIKAN (Poin 3)

### 3.1 Skala Kesulitan

| File | Baris | Kesulitan | Alasan |
|---|---:|---|---|
| `features/missions/MissionsPage.tsx` | 3.955 | **Sangat Tinggi** | 5 sub-tabel JSONB (transactions/rundown/tasks/committees) + modal + state |
| `features/assets/AssetsPage.tsx` | 3.673 | **Sangat Tinggi** | Aset + peminjaman + sewa + approval + track publik |
| `features/members/MembersPage.tsx` | 3.657 | **Sangat Tinggi** | Bulk import + filter + family + export |
| `features/finance/FinanceOperationalPage.tsx` | 3.653 | **Sangat Tinggi** | Kas + transaksi + chart + filter periode |
| `features/programs/ProgramsPage.tsx` | 3.257 | **Tinggi** | Program + roster + rundown |
| `features/organization/OrganizationPage.tsx` | 2.745 | **Tinggi** | 4 tab: divisi, posisi, jabatan, panitia |
| `features/secretariat/SecretariatPage.tsx` | 2.408 | **Tinggi** | Surat masuk + keluar + disposisi |
| `features/building/BuildingProjectPage.tsx` | 1.943 | **Tinggi** | Progres + modul + laporan |
| `features/users/UsersPage.tsx` | 1.782 | **Tinggi** | User + role + permission matrix |
| `api/modules/organization/organization.routes.ts` | 1.030 | **Sedang–Tinggi** | 27 catch block, query inline |
| `api/modules/assets/assets.routes.ts` | 958 | **Sedang–Tinggi** | Transaksi stok + 2FA track |
| `api/modules/finance/finance.controller.ts` | 849 | **Sedang** | 14 catch, agregasi |
| `database/seed.ts` | 1.141 | **Sedang** | Seed idempoten |
| `state/*Context.tsx` (4 file) | ~400–500 ea. | **Sedang** | Akan menjadi God Object |
| `services/api.ts` | 488 | **Sedang** | Coupling point tunggal |

**7 file > 3.000 baris = 23.543 baris = 44% dari seluruh kode frontend berada di 7 file.**

### 3.2 Kenapa Ini Sulit (Risiko Konkret)

1. **Tidak ada batas review yang masuk akal.** Diff 500 baris di `MembersPage.tsx` mustahil direview teliti → review jadi formalitas.
2. **Konflik merge tinggi.** 4 orang mengedit 4 file besar di branch sama → conflict resolution menutupi perubahan yang tidak sengaja.
3. **State bleed antar fitur.** Karena `MissionsPage` menyimpan 5 sub-tabel JSONB di satu component state, satu `useState` yang keliru merusak 5 modul sekaligus.
4. **Tidak ada unit test yang mungkin.** Component 4.000 baris mustahil diuji; saat ini tidak ada test sama sekali di repo.
5. **Onboarding developer baru: 2–4 minggu** hanya untuk memahami satu halaman.

### 3.3 Rencana Perbaikan Bertahap

> Strategi: **Ekstraksi, bukan Rewrite.** Menulis ulang dari nol berisiko kehilangan perilaku bisnis yang tidak terdokumentasi. Ekstraksi bertahap menjaga sistem tetap jalan.

#### Fase 0 — Fondasi (sudah dikerjakan di sesi ini)
Target: 1–2 hari.
- Sanitasi error terpusat (production) — hentikan kebocoran detail internal.
- `pool.on('error')` — hentikan proses crash sendiri.
- Request ID per request untuk korelasi log.
- Indeks FK + filter columns + unique index `request_code`.
- Dedup DDL `role_permissions`.

#### Fase 1 — Helper Backend (3–5 hari)
Buat `apps/api/src/shared/`:
- `asyncHandler(fn)` — hilangkan 138 blok try/catch repetitif.
- `httpError(status, message, code)` — error diskriminator (menggantikan `err: any`).
- `pagination.ts` — parse & clamp `page`, `limit`, `offset` (saat ini tiap controller parses sendiri).
- `logger.ts` — structured JSON logger (pino), level berdasarkan `NODE_ENV`.
- `sql.ts` — wrapper query dengan auto-logging query lambat (> 200ms).

**Dampak:** menghapus ±2.500 baris duplikasi, semua error jadi konsisten 500 dengan `requestId`.

#### Fase 2 — Migrasi Modul ke `service` + `schema` (2–3 minggu)

| Prioritas | Modul | Estimasi | Alasan |
|---|---|---|---|
| 1 | `organization` (1.030) | 3 hari | 27 catch, paling banyak duplikasi |
| 2 | `assets` (958) | 3 hari | Transaksi stok, paling sensitif terhadap bug |
| 3 | `secretariat` (800) | 2 hari | Punya race condition nomor surat |
| 4 | `finance` (849 ctrl) | 3 hari | Modul uang, butuh audit trail ketat |
| 5 | `missions` (496) | 2 hari | JSONB complex |
| 6 | `programs`, `prayer`, `users`, `building` | 5 hari | Modul lebih kecil |
| 7 | 8 modul tanpa controller | 4 hari | Konsistensi penuh |

Target: **semua modul** punya `routes` (tipis) + `service` (bisnis) + `schema` (validasi Zod).

#### Fase 3 — Pecah File Besar Frontend (4–6 minggu)
Pola pemecahan seragam:

```
features/missions/
├── MissionsPage.tsx            # shell + tab, target < 300 baris
├── components/
│   ├── MissionList.tsx
│   ├── MissionRundown.tsx
│   ├── MissionTasks.tsx
│   ├── MissionCommittees.tsx
│   └── MissionTransactions.tsx
├── hooks/
│   ├── useMissions.ts
│   └── useMissionTransactions.ts
└── types.ts
```

Aturan main:
- Halaman utama **≤ 300 baris**.
- Komponen **≤ 400 baris**.
- Satu file = satu tanggung jawab.
- Semua server state masuk hook; Context global hanya untuk `auth` + `dynamicConfig`.

Estimasi per halaman 2–4 hari. Total 7 halaman besar: **3–4 minggu**.

#### Fase 4 — Lapisan Service Frontend (1–2 minggu)
Pecah `services/api.ts` (488 baris):
```
services/
├── client.ts          # axios instance, interceptor, auth header, error normalisasi
└── api/
    ├── members.api.ts
    ├── finance.api.ts
    ├── assets.api.ts
    └── ...
```

#### Fase 5 — Guardrails (3–5 hari)
- ESLint: `max-lines` (400), `max-lines-per-function` (80), `complexity` (15).
- Husky + lint-staged: tolak commit yang melewati ambang.
- `vitest` + `supertest` (backend), React Testing Library (hook).
- CI: `tsc --noEmit` + `eslint` + `vitest` + build.

#### Fase 6 — Database Migration System (1 minggu)
Pindahkan DDL dari runtime ke `database/migrations/` bernomor, jalankan via tabel tracking `schema_migrations`. `init.ts` hanya menjalankan migrasi yang belum diterapkan.

### 3.4 Ringkasan Estimasi

| Fase | Durasi | Risiko | Nilai |
|---|---|---|---|
| 0 — Fondasi | selesai | — | Tinggi |
| 1 — Helper backend | 3–5 hari | Rendah | Tinggi |
| 2 — Migrasi service | 2–3 minggu | Sedang | Sangat tinggi |
| 3 — Pecah frontend | 3–4 minggu | Sedang | Sangat tinggi |
| 4 — Service frontend | 1–2 minggu | Rendah | Sedang |
| 5 — Guardrails | 3–5 hari | Rendah | Sangat tinggi (preventif) |
| 6 — Migrasi DB | 1 minggu | Sedang | Tinggi |

**Total: ~9–12 minggu kerja efektif.** Rekomendasi: mulai Fase 1–2 sekarang; Fase 3 bisa paralel bila ada 2 orang (backend & frontend terpisah).

---

## 4. KEKURANGAN & KELEMAHAN INFRASTRUKTUR (Poin 4)

### 4.1 Observabilitas — **Kritis**

| Gap | Dampak | Rekomendasi |
|---|---|---|
| Tidak ada structured logger | Log berupa string; sulit agregasi/filter | pino + JSON log + `requestId` |
| Tidak ada request ID | Klien tidak bisa melapor error spesifik | Diterapkan (`X-Request-Id`) |
| Tidak ada metrics | Tidak tahu endpoint mana yang lambat/berbeban | `prom-client` + `/metrics` |
| Health check minim | Orchestrator tidak tahu service hidup | `GET /health` (db ping, pool stats) + `GET /health/ready` |
| Tidak ada alerting | Outage baru disadari user | Alerting pada error rate 5xx & latency p95 |
| Error tidak masuk log | 138 catch tanpa `console.error` | Sanitasi terpusat + logging terpusat (Fase 1) |

### 4.2 Keamanan

| Gap | Dampak | Status |
|---|---|---|
| Detail SQL/kolom bocor ke klien | Membantu serangan (recon) | **Diperbaiki** (sanitizeError middleware) |
| `pool.on('error')` tidak ada | Idle error = crash proses | **Diperbaiki** |
| Tidak ada rate limit pada endpoint publik | `/assets/public/request`, `/prayer`, `/registrations` rentan spam/abuse | Rate limit dedicated + CAPTCHA pada registrasi |
| Tidak ada helmet / security headers | Missing hardening dasar | Pasang `helmet` + CSP |
| Refresh token di localStorage | XSS → pencurian sesi | HttpOnly cookie + SameSite=Strict |
| Tidak ada rotasi secret | Bocor JWT = bahaya lasting | Rotasi berkala + `JWT_SECRET` versioning |
| Audit log hanya sebagian route | Modul sensitif tidak tercatat | Pasang `auditInterceptor` global (filenya ada, belum dipasang penuh) |
| Input tidak divalidasi skema | SQL injection mungkin via dynamic query | Zod di Fase 1–2 |

### 4.3 Keandalan & Skala

| Gap | Dampak |
|---|---|
| Single instance API | Downtime saat deploy/restart |
| Tidak ada graceful shutdown | Request in-flight terpotong saat SIGTERM |
| Tidak ada retry/circuit breaker | 1 hiccup DB → 500 untuk user |
| Tidak ada pagination seragam | Beberapa endpoint menarik seluruh tabel |
| Cron/job tidak terjadwal | Notifikasi ultah, badge tugas, cleanup — semuanya on-demand |
| Tidak ada backup otomatis | Kehilangan data = kehancuran tata kelola |
| Tidak ada file storage service | Lampiran bergantung URL eksternal (Google Drive) — single point of failure |

### 4.4 Infrastruktur yang Perlu Ditambahkan

```
1. CI/CD            GitHub Actions: lint → typecheck → test → build → deploy
2. Logging          pino + Loki/ELK, retensi 30 hari
3. Metrics          prom-client + Prometheus + Grafana
4. Health checks    /health, /health/ready + auto-restart (PM2/systemd)
5. Process manager  PM2 dengan cluster mode (scale horizontal)
6. Reverse proxy    Nginx + TLS (Let's Encrypt) + rate limiting
7. Object storage   S3-compatible (untuk lampiran & foto aset)
8. Job scheduler    node-cron / BullMQ (notifikasi, reminder, rekap bulanan)
9. Backup           pg_dump harian + offsite + restore drill
10. Error tracking  Sentry (frontend + backend)
11. Secrets manager Vault / Infisical (ganti .env manual)
12. Migration tool  node-pg-migrate + tabel schema_migrations
```

---

## 5. RELASI TABEL DATABASE ↔ UI (Poin 5)

### 5.1 Matriks Integrasi

`API` = diakses query di `apps/api/src/modules`. `UI` = nama tabel muncul di kode frontend (langsung atau lewat field response).

| Tabel | API | UI | Status | Catatan |
|---|:--:|:--:|---|---|
| `members` | ✅ | ✅ | Terintegrasi | Pusat data, dipakai semua modul |
| `alumni_profiles` | ✅ | ⚠️ | Tidak langsung | API konsisten pakai `LEFT JOIN`/`UPSERT`, tapi frontend tidak pernah menyebut nama tabel. Risiko: field baru (`graduation_year`, `ktb_group_name`) tidak pernah tampil di UI |
| `users` | ✅ | ✅ | Terintegrasi | |
| `roles` | ✅ | ✅ | Terintegrasi | |
| `role_permissions` | ✅ | ⚠️ | Tidak langsung | Backend hitung matrix; UI hanya kirim `can_access` |
| `audit_logs` | ✅ | ✅ | **Terintegrasi** | Halaman Jejak Audit Sistem (`/audit-logs`) dengan filter, diff nilai sebelum/sesudah, dan izin modul `AUDIT_LOGS` |
| `system_lookups` | ✅ | ✅ | Terintegrasi | |
| `form_field_configs` | ✅ | ⚠️ | Tidak langsung | API manage; UI me-render via `DynamicConfigContext` |
| `departments` | ✅ | ✅ | Terintegrasi | |
| `staff_members` | ✅ | ✅ | Terintegrasi | |
| `payroll_periods` | ✅ | ⚠️ | Tidak langsung | |
| `payroll_records` | ✅ | ⚠️ | Tidak langsung | |
| `chart_of_accounts` | ✅ | ⚠️ | Tidak langsung | |
| `financial_transactions` | ✅ | ⚠️ | Tidak langsung | |
| `building_projects` | ✅ | ⚠️ | Tidak langsung | |
| `pledges` | ✅ | ✅ | Terintegrasi | |
| `mission_activities` | ✅ | ⚠️ | Tidak langsung | 5 kolom JSONB |
| `foundation_programs` | ✅ | ⚠️ | Tidak langsung | |
| `program_rosters` | ❌ | ❌ | **MATI** | Tidak diakses API maupun UI. `uq_program_member_role` & `confirmation_status` dirancang tapi tak terpakai |
| `prayer_requests` | ✅ | ⚠️ | Tidak langsung | |
| `assets` | ✅ | ✅ | Terintegrasi | |
| `asset_loans` | ✅ | ⚠️ | Tidak langsung | |
| `secretariat_incoming_letters` | ✅ | ⚠️ | Tidak langsung | |
| `secretariat_outgoing_letters` | ✅ | ⚠️ | Tidak langsung | |
| `committee_records` | ✅ | ✅ | Terintegrasi | |
| `org_positions` | ✅ | ⚠️ | Tidak langsung | |
| `org_position_tenures` | ✅ | ✅ | Terintegrasi | |
| `division_members` | ✅ | ✅ | Terintegrasi | |
| `families` | ❌ | ❌ | **MATI** | |
| `family_members` | ❌ | ❌ | **MATI** | |
| `member_registrations` | ✅ | ⚠️ | Tidak langsung | |

### 5.2 UI yang Belum Terintegrasi (Prioritas)

**U1 — Halaman Audit Log (`audit_logs`).** P0 untuk tata kelola yayasan.
Backend sudah menyimpan `audit_logs` (actor, action, entity, before/after), tapi tidak ada layar untuk melihatnya. Untuk yayasan yang menjanjikan "transparansi & supervisory access", ini fitur inti yang belum ada.

**U2 — Riwayat Jabatan & Masa Tenure (`org_position_tenures`).** Tabel ada, API ada, tapi UI hanya menampilkan jabatan aktif. Periode, SK, dan riwayat kepengurusan tidak pernah ditampilkan.

**U3 — Detail Profil Alumni (`alumni_profiles`).** `faculty`, `major`, `entry_year`, `graduation_year`, `current_profession`, `company_name`, `ktb_group_name` — 7 field yang tidak pernah muncul di UI walaupun sudah diisi di DB.

**U4 — Konfirmasi Rost Program (`program_rosters`).** Kolom `confirmation_status` dirancang untuk butuh konfirmasi peserta — belum ada UI dan belum ada API.

**U5 — Dashboard Analitik.** `chart_of_accounts`, `payroll_records`, `financial_transactions` punya data kaya tapi tidak ada layar analitik khusus (cuma laporan agregat).

**U6 — Pengingat Ulang Tahun Otomatis.** Kolom `birth_date` & `marriage_date` ada di `members`, dan modul `notifications` sudah ada — tapi belum ada scheduled job yang mengirim pengingat (fitur yang sudah tertulis di dokumentasi).

### 5.3 Tabel Mati — Rekomendasi

| Tabel | Status | Rekomendasi |
|---|---|---|
| `families` | Tidak ada API, tidak ada UI | Buat UI (form keluarga anggota) atau drop bila memang tidak akan dipakai |
| `family_members` | Tidak ada API, tidak ada UI | Sama |
| `program_rosters` | Skema lengkap, nol implementasi | Implementasikan (konfirmasi peserta) atau drop |

> Rekomendasi: jangan drop sebelum dikonfirmasi kasus bisnis. Tapi jangan juga membiarkan tabel menggantung di skema — dokumentasikan status "planned" di header `schema.sql`.

---

## 6. RELASI ANTAR TABEL — KEBERATAN & OPTIMALISASI (Poin 6)

### 6.1 Audit Foreign Key

**39 foreign key** terpasang. Mayoritas sudah benar dengan `ON DELETE` yang sesuai:

| Relasi | ON DELETE | Penilaian |
|---|---|---|
| `members.department_id → departments` | default | Menghapus departemen dengan anggota = gagal. Untuk sistem yang sudah berjalan lama, `SET NULL` lebih aman agar anggota tidak hilang |
| `asset_loans.asset_id → assets` | `NO ACTION` | Benar — aset tak bisa hilang selama ada peminjaman |
| `asset_loans.borrower_member_id → members` | `SET NULL` | Benar — peminjam boleh keluar, riwayat aset tetap |
| `asset_loans.approved_by → users` | default | Kalau user dihapus, referensi menggantung |
| `financial_transactions.account_id → chart_of_accounts` | default | Untuk tabel transaksional ini memang benar |
| `org_position_tenures.position_id → org_positions` | `CASCADE` | Benar |
| `division_members.member_id → members` | `CASCADE` | Benar |
| `program_rosters.member_id → members` | `NO ACTION` | Benar |
| `prayer_requests.assigned_counselor_id → members` | default | Sebaiknya `SET NULL` |
| `secretariat_*.created_by → users` | `SET NULL` | Benar |

**R6.1 — FK tanpa eksplisit `ON DELETE`.** 15+ relasi mengandalkan default `NO ACTION`. Untuk tabel transaksional (`financial_transactions`, `payroll_records`, `audit_logs`) ini benar (jangan sampai data hilang). Untuk tabel master (`departments`, `org_positions`, `users`) seharusnya `RESTRICT` eksplisit atau `SET NULL` agar intent kegagalan terbaca.

**R6.2 — `asset_loans.request_code` tidak punya UNIQUE constraint.** Kode ini kunci lookup publik fitur lacak 2FA (nomor tiket + 4 digit WhatsApp). Tanpa unique constraint, satu tiket bisa merujuk >1 baris peminjaman, sehingga:
- endpoint `GET /public/track` mengembalikan data tidak deterministik;
- **risiko kebocoran data orang lain**:responden bisa menerima data peminjam lain.
→ **Diperbaiki sesi ini**: partial unique index + langkah pra-bersih duplikat di `init.ts`.

**R6.3 — Race condition nomor surat keluar.** `POST /secretariat/outgoing` mengunci baris `system_lookups` via `FOR UPDATE` saat membuat surat, tetapi `GET /secretariat/outgoing/next-number` (endpoint pratinjau yang dipanggil UI sebelum simpan) membacanya **tanpa** `FOR UPDATE`. Konsekuensi: user melihat `SK/2026/0007`, saat disimpan counter sudah naik → nomor tersimpan berbeda dari yang tampil. Fix: `next-number` juga harus lock (`FOR UPDATE` dalam transaksi), atau UI ambil ulang nomor setelah simpan.

**R6.4 — `assets.available_quantity` denormalisasi tanpa CHECK constraint.** Kolom ini menyimpan `quantity - dipinjam`. Invariant `0 <= available_quantity <= quantity` dijaga **hanya oleh kode aplikasi**. Satu bug di jalur mana pun membuat data bisa negatif atau melebihi total. Rekomendasi:
```sql
ALTER TABLE assets
  ADD CONSTRAINT chk_assets_available_qty
  CHECK (available_quantity >= 0 AND available_quantity <= quantity);
```
Aplikasi sudah cukup race-safe (menggunakan `SELECT ... FOR UPDATE` pada `assets` di dalam transaksi).

**R6.5 — `asset_loans.status` dan `assets.borrow_status` adalah string bebas tanpa CHECK.** Nilai valid hanya dikode di aplikasi (`'PENDING'`, `'APPROVED'`, `'ACTIVE'`, `'RETURNED'`, `'REJECTED'`). Karena status menentukan alur bisnis dan pembukuan, typos tidak tertangkap DB. Rekomendasi: `CHECK (status IN (...))` untuk `asset_loans.status`, `assets.borrow_status`, `assets.physical_condition`.

**R6.6 — Tabel `mission_activities` menyimpan 4 sub-tabel dalam JSONB** (`transactions`, `rundown`, `tasks`, `committees`). Ini **anti-pattern relasional**: tidak ada FK, tidak ada index per item, tidak bisa dijaga integritas, dan query lintas kegiatan butuh `jsonb_path_query` yang lambat. Rekomendasi: normalisasi ke tabel anak (`mission_rundowns`, `mission_tasks`, `mission_committees`, `mission_transactions`) dengan FK ke `mission_activities(id) ON DELETE CASCADE`.

**R6.7 — `users.role_id` → `roles.role_id`.** Benar, tetapi role string-based (`'SUPER_ADMIN'`) dipakai hard-coded di logika frontend (`AuthContext.isRouteAllowed`). Perubahan nama role di DB tidak otomatis tercermin. Fix: signed permission payload (HMAC) sudah ada — pastikan `role_permissions` selalu sinkron dengan `roles`.

**R6.8 — `division_members.department_id` VARCHAR(50) → `departments.id`.** Id departemen bukan `UUID` — tidak konsisten dengan tabel lain yang memakai `UUID`. Tidak salah, tapi menyulitkan join ke tabel yang mewarisi UUID.

**R6.9 — `chart_of_accounts.parent_id` self-referencing.** Proper, tapi **tidak ada indeks** pada `parent_id` → rekursi tree akan sequential scan.

**R6.10 — `staff_members` ↔ `members`.** Tidak ada relasi eksplisit antara tabel staf dan tabel anggota. Jika seorang staf adalah anggota yayasan, data ganda bisa muncul. Rekomendasi: FK opsional `member_id UUID REFERENCES members(id) ON DELETE SET NULL`.

### 6.2 Optimasi Index (Dikerjakan)

Sebelum sesi ini, hampir tidak ada index eksplisit selain `PRIMARY KEY` dan `UNIQUE`. Semua kolom foreign key tanpa index → PostgreSQL melakukan **sequential scan** pada setiap join. Untuk `members`, `financial_transactions`, dan `audit_logs` yang bertambah seiring waktu, ini akan semakin lambat.

Sesi ini menambahkan **50 index** di `schema.sql`:

| Kategori | Jumlah | Contoh |
|---|---:|---|
| Foreign key | 39 | `idx_members_sector_id`, `idx_tx_account_id`, `idx_asset_loans_asset_id` |
| Filter / sort utama | 10 | `idx_members_status`, `idx_pledges_status`, `idx_prayer_requests_status` |
| Pencarian teks | 2 | `idx_members_full_name`, `idx_registrations_code` |
| Temporal | 3 | `idx_audit_logs_created_at DESC`, `idx_registrations_created_at DESC` |
| Uniqueness | 1 | `uq_asset_loans_request_code` (partial) |

Semua memakai `CREATE INDEX IF NOT EXISTS` → aman dijalankan pada database existing.

> Untuk pencarian nama fuzzy (`ILIKE '%xyz%'`), `idx_members_full_name` B-tree tidak dipakai. Pertimbangkan `pg_trgm` + `GIN` bila fitur "cari anggota" menjadi bottleneck.

### 6.3 Tabel Ringkasan Relasi

```
users ──1:N──► audit_logs
  │
  └──N:1──► roles ──1:N──► role_permissions

members ──1:1──► alumni_profiles
   │  ├──1:N──► families ──1:N──► family_members (MATI)
   │  ├──1:N──► committee_records
   │  ├──1:N──► division_members ──N:1──► departments ──N:1──► members (head)
   │  ├──1:N──► org_position_tenures ──N:1──► org_positions
   │  ├──1:N──► program_rosters ──N:1──► foundation_programs (MATI)
   │  ├──1:N──► prayer_requests (assigned_counselor)
   │  ├──1:N──► pledges ──1:N──► financial_transactions
   │  └──1:N──► asset_loans ──N:1──► assets

staff_members ──1:N──► payroll_records ──N:1──► payroll_periods
chart_of_accounts ──self:1:N──► chart_of_accounts (parent)
financial_transactions ──N:1──► chart_of_accounts
building_projects ──N:1──► chart_of_accounts

secretariat_incoming_letters / outgoing_letters ──N:1──► users
mission_activities ──(JSONB: transactions, rundown, tasks, committees)
```

---

## 7. PEMETAAN RISIKO

| ID | Risiko | Dampak | Kemungkinan | Mitigasi |
|---|---|---|---|---|
| R1 | Proses API crash sendiri tanpa log | **Tinggi** | Sedang | `pool.on('error')` (selesai) |
| R2 | Detail SQL bocor ke klien publik | **Tinggi** | **Tinggi** | sanitizeError (selesai) |
| R3 | Nomor surat duplikat / tidak sinkron | Sedang | **Tinggi** | Lock `next-number` (Fase 1) |
| R4 | Tiket peminjaman duplikat → kebocoran data peminjam | **Tinggi** | Sedang | unique index (selesai) |
| R5 | Stok aset melebihi total / negatif | Sedang | Sedang | CHECK constraint (Fase 1) |
| R6 | Regresi saat refactor 7 file besar | **Tinggi** | **Tinggi** | Ekstraksi bertahap + test sebelum Fase 3 |
| R7 | Spam/abuse endpoint publik | Sedang | **Tinggi** | Rate limit + CAPTCHA |
| R8 | Kehilangan data (tanpa backup) | **Tinggi** | Rendah | Backup harian + offsite |
| R9 | Performance degradasi (sequential scan) | Sedang | **Tinggi** | 50 index (selesai) |
| R10 | Single point of failure (1 instance, URL Drive eksternal) | Sedang | Sedang | PM2 cluster + object storage |

---

## 8. PERBAIKAN YANG SUDAH DITERAPKAN (Sesi Ini)

| # | Perbaikan | File | Efek |
|---|---|---|---|
| 1 | Handler `pool.on('error')` | `apps/api/src/config/db.ts` | Mencegah crash proses akibat idle client error |
| 2 | Middleware sanitasi error | `apps/api/src/middleware/sanitizeError.middleware.ts` (baru) | Field `error` dihapus dari response JSON di production — menutup 138 titik leak sekaligus |
| 3 | Pasang middleware + Request ID | `apps/api/src/server.ts` | Header `X-Request-Id` untuk korelasi log; sanitasi aktif di semua route |
| 4 | 50 index baru | `apps/api/src/database/schema.sql` | Menghilangkan sequential scan pada join utama |
| 5 | Partial unique index `request_code` | `apps/api/src/database/schema.sql` | Menjamin 1 tiket = 1 peminjaman |
| 6 | Pra-bersih duplikat `request_code` | `apps/api/src/database/init.ts` | Migrasi tidak gagal pada database existing |
| 7 | Hapus DDL duplikat `role_permissions` | `apps/api/src/database/schema.sql` | Satu sumber kebenaran untuk skema |
| 8 | Deduplikasi `.gitignore` | `.gitignore` | 8 blok duplikat → 1 |
| 9 | Halaman & Modul Jejak Audit Sistem (U1) | `apps/api/src/modules/audit/*`, `apps/web/src/features/audit/*`, `App.tsx`, `Sidebar.tsx` | UI tata kelola transparansi yayasan aktif dengan filter & diff sebelum/sesudah |
| 10 | Security Headers Helmet | `apps/api/src/server.ts` | Hardening header keamanan (X-Content-Type-Options, Frameguard, CORP cross-origin) |
| 11 | Dedicated Rate Limiter Endpoint Publik | `apps/api/src/middleware/rateLimit.middleware.ts`, `registrations.routes.ts`, `assets.routes.ts`, `prayer.routes.ts` | 15 formulir / 15 menit per IP untuk anti-spam bot permohonan publik |
| 12 | CHECK Constraints Enum Status Aset | `apps/api/src/database/schema.sql`, `apps/api/src/database/init.ts` | Menjaga validitas status borrow_status, physical_condition, dan asset_loans.status |
| 13 | Mitigasi Race Condition Nomor Surat Keluar | `apps/api/src/modules/secretariat/secretariat.routes.ts`, `SecretariatPage.tsx` | Transaksi atomik FOR UPDATE counter di backend + klarifikasi status estimasi nomor di UI |

**Verifikasi:** `npm --prefix apps/web run build` dan `npm --prefix apps/api run build` — **keduanya lulus 100% tanpa error**.

> **Penting:** Index dan unique constraint baru **aktif setelah migrasi dijalankan**. Jalankan migrasi di staging lebih dulu, lalu cek `SELECT request_code, COUNT(*) FROM asset_loans WHERE request_code IS NOT NULL GROUP BY request_code HAVING COUNT(*) > 1` — harus mengembalikan nol baris.

---

## 9. PRIORITAS TINDAK LANJUT

### Prioritas 1 — Week 1
- [x] Sanitasi error production
- [x] `pool.on('error')`
- [x] Request ID
- [x] Index database + unique `request_code`
- [x] Pasang `helmet` + rate limit endpoint publik
- [ ] Jalankan migrasi di staging, verifikasi hasil

### Prioritas 2 — Week 2–3
- [x] Halaman **Audit Log** (U1)
- [x] CHECK constraint `assets.available_quantity` + status enum check
- [x] Fix race condition `next-number` (lock `FOR UPDATE` + konfirmasi nomor atomik)
- [ ] `shared/asyncHandler` + `httpError` + `logger` terpusat (Fase 1)
- [ ] Audit interceptor dipasang di seluruh route sensitif

### Prioritas 3 — Week 4–8
- [ ] Migrasi modul backend ke `service` + `schema` (Fase 2)
- [ ] Pecah 7 file frontend besar (Fase 3)

### Prioritas 4 — Week 9–12
- [ ] Lapisan service frontend (Fase 4)
- [ ] Guardrails ESLint + CI + test (Fase 5)
- [ ] Sistem migrasi immutable (Fase 6)
- [ ] UI belum terintegrasi: roster konfirmasi, riwayat jabatan, detail profil alumni (U2–U4)

---

## 10. CATATAN METODOLOGI

- Semua angka berasal dari analisis statis repo pada 2 November 2026.
- Pemetaan tabel↔UI ditentukan dengan pencarian nama tabel di seluruh `apps/api/src/modules` dan `apps/web/src`.
- "Tidak langsung" pada matriks Bagian 5.1 berarti akses berlangsung via API tetapi frontend tidak pernah menyebut nama tabel — field-nya masih bisa tampil lewat response API.
- Typecheck dijalankan dengan `npx tsc --noEmit` pada kedua workspace.
- Analisis runtime (query plan, load test, profiling) **tidak** dilakukan — lingkungan database production tidak diakses dalam audit ini. Rekomendasi: jalankan `EXPLAIN ANALYZE` pada 5 query berat setelah migrasi index diterapkan untuk mengukur dampak nyata.

---

*Laporan ini dibuat sebagai bagian dari audit infrastruktur menyeluruh repo GlobalMissionHouse.*
