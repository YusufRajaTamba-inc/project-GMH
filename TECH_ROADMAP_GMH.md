# 🗺️ ROADMAP TEKNIS — Yayasan Global Mission House (GMH PA KMK)
**Repositori:** `YusufRajaTamba-inc/project-GMH`  
**Dibuat:** 31 Oktober 2026  
**Status:** Aktif — Eksekusi Per Prioritas

---

## 🔴 PRIORITAS 1 — Critical Security Fix
> **Target:** Selesai sebelum deploy ke production  
> **Estimasi waktu:** 1–2 hari  
> **Risiko kalau dilewati:** Data keuangan, data anggota, dan sesi pengurus yayasan rentan dicuri

---

### P1-A · Ganti `localStorage` → `HttpOnly Cookie` (Anti-XSS)

**Masalah saat ini:**
```ts
// apps/web/src/services/api.ts — RAWAN XSS
localStorage.setItem('gmh_auth_token', res.token);
```
Token JWT yang disimpan di `localStorage` bisa dicuri oleh script berbahaya (XSS attack). Ini kritikal karena sistem menyimpan data keuangan & penggajian staf.

**Solusi:**
- [ ] Backend (`apps/api`): Ubah respons login agar mengirim token via **`Set-Cookie: HttpOnly; Secure; SameSite=Strict`** bukan JSON body
- [ ] Backend: Tambah endpoint `GET /auth/me` untuk validasi sesi dari cookie
- [ ] Backend: Endpoint `POST /auth/logout` yang menghapus cookie sisi server
- [ ] Frontend (`apps/web`): Hapus semua `localStorage.getItem/setItem` untuk token
- [ ] Frontend: Ubah API client `fetch` agar menggunakan `credentials: 'include'`
- [ ] Frontend: Ubah logika `isAuthenticated` dari cek localStorage ke cek hasil `/auth/me`

**File yang akan diubah:**
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/web/src/services/api.ts`
- `apps/web/src/App.tsx` (logika auth state)

---

### P1-B · CORS Strict (Anti-Cross-Origin Hijacking)

**Masalah saat ini:**
```ts
// apps/api/src/server.ts — BERBAHAYA di production
app.use(cors({ origin: '*' }));
```
Setting `origin: '*'` artinya **semua website di internet** bisa mengirim request ke API backend yayasan.

**Solusi:**
- [ ] Buat file `apps/api/.env.example` dengan variabel `ALLOWED_ORIGIN`
- [ ] Ubah konfigurasi CORS menjadi whitelist berbasis environment variable:
  ```ts
  // Development: http://localhost:5173
  // Production:  https://app.gmhpakmk.org
  origin: ENV.ALLOWED_ORIGIN.split(',')
  ```
- [ ] Tambahkan `credentials: true` di CORS config (diperlukan untuk cookie)

**File yang akan diubah:**
- `apps/api/src/server.ts`
- `apps/api/src/config/env.ts`
- `apps/api/.env` (tambah variabel)

---

### P1-C · Rate Limiting di Endpoint Login (Anti-Brute Force)

**Masalah saat ini:** Endpoint `POST /api/v1/auth/login` tidak ada pembatasan percobaan. Penyerang bisa mencoba jutaan kombinasi password secara otomatis.

**Solusi:**
- [ ] Install package: `npm install express-rate-limit --workspace=api`
- [ ] Buat middleware `apps/api/src/middleware/rateLimit.middleware.ts`:
  - **Login:** Maksimal **5 percobaan per 15 menit** per IP
  - **API umum:** Maksimal **200 request per menit** per IP
- [ ] Terapkan ke router auth dan root server
- [ ] Tambahkan response header informatif: `X-RateLimit-Remaining`, `Retry-After`

**File yang akan diubah/dibuat:**
- `apps/api/src/middleware/rateLimit.middleware.ts` *(baru)*
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/server.ts`

---

## 🟡 PRIORITAS 2 — Fitur & Stabilisasi
> **Target:** Setelah seluruh modul fungsional berjalan stabil  
> **Estimasi waktu:** 1–2 minggu  
> **Prasyarat:** Semua modul (payroll, building, assets, donations) sudah diuji

---

### P2-A · Audit Trail Lengkap di Semua Mutasi Keuangan

**Masalah saat ini:** `logAudit()` sudah ada tapi belum dipanggil secara konsisten di semua endpoint yang mengubah data finansial.

**Solusi:**
- [ ] Audit dan tambahkan `logAudit()` di semua endpoint `POST/PUT/DELETE` modul:
  - `finance` (transaksi kas, donasi, budget)
  - `payroll` (pencairan gaji, update slip)
  - `missions` & `programs` (tambah/hapus transaksi kas mandiri)
  - `building` (pencatatan dana pembangunan)
- [ ] Buat halaman Audit Log di frontend yang bisa diakses `SUPER_ADMIN` & `DEWAN_PENGAWAS_PEMBINA`

---

### P2-B · Input Validation Konsisten dengan Zod

**Masalah saat ini:** Validasi Zod belum dipakai secara seragam di semua route.

**Solusi:**
- [ ] Buat Zod schema terpusat di `apps/api/src/schemas/`
- [ ] Terapkan validasi di semua endpoint `POST` & `PUT` yang menerima input user
- [ ] Standarisasi error response format: `{ success: false, errors: ZodError[] }`

---

### P2-C · Environment Config & Secret Management

- [ ] Buat `apps/api/.env.example` dan `apps/web/.env.example` yang lengkap dan terdokumentasi
- [ ] Pastikan `.env` ada di `.gitignore` (sudah ada, verifikasi ulang)
- [ ] Dokumentasikan semua environment variable yang dibutuhkan di README

---

### P2-D · Error Handling & Logging Terpusat

**Masalah saat ini:** Error handling masih menggunakan `console.error` sederhana.

**Solusi:**
- [ ] Install `winston` atau `pino` untuk structured logging
- [ ] Buat log level: `error`, `warn`, `info`, `debug`
- [ ] Log setiap request API dengan durasi response time
- [ ] Pisahkan log ke file `logs/error.log` dan `logs/access.log`

---

## 🟢 PRIORITAS 3 — Migrasi Stack (Backend Rewrite)
> **Target:** Versi 2.0 sistem  
> **Estimasi waktu:** 2–4 minggu  
> **Prasyarat:** P1 dan P2 selesai, sistem sudah production-ready dengan Express

---

### P3-A · Migrasi Backend: Express → ElysiaJS + Bun

**Keuntungan:**
- Throughput 2–3x lebih tinggi dari Node.js + Express
- Type system lebih ketat dan terintegrasi
- Built-in plugin sistem yang modular

**Rencana Migrasi Bertahap (tanpa downtime):**
- [ ] Setup project Elysia baru di `apps/api-v2/`
- [ ] Migrasi modul per modul (mulai dari yang paling sederhana: `utility` → `prayer` → `auth`)
- [ ] Jalankan kedua server secara paralel selama transisi
- [ ] Switch traffic ke Elysia setelah seluruh modul termigrasi dan diuji
- [ ] Hapus `apps/api/` setelah Elysia stabil

**Urutan migrasi modul (dari mudah ke kompleks):**
1. `utility` (GET only, tidak ada mutasi)
2. `prayer` (CRUD sederhana)
3. `auth` (critical, perlu banyak testing)
4. `members` & `registrations`
5. `assets` & `building`
6. `programs` & `missions`
7. `finance` & `payroll` (terakhir, paling kritikal)

---

### P3-B · End-to-End Type Safety: Eden Treaty

**Keuntungan:**
- Tidak perlu menulis ulang interface TypeScript secara manual di frontend
- Error terdeteksi saat compile time, bukan runtime
- Auto-complete URL endpoint di IDE

**Langkah:**
- [ ] Install `@elysia/eden` di `apps/web`
- [ ] Ekspor `typeof app` dari Elysia ke shared types
- [ ] Ganti semua `fetch` di `apps/web/src/services/api.ts` dengan Eden Treaty client
- [ ] Hapus file interface manual yang sudah tidak diperlukan

---

### P3-C · TypeBox menggantikan Zod (Opsional)

> ⚠️ **Prioritas rendah** — Hanya dilakukan jika ada bottleneck performa nyata yang terukur.
> Zod sudah sangat cukup untuk skala sistem yayasan ini.

- [ ] Benchmark Zod vs TypeBox pada endpoint dengan volume tertinggi
- [ ] Migrasi hanya jika ada perbedaan performa yang signifikan (>20%)

---

## 🔵 PRIORITAS 4 — Infrastruktur Production
> **Target:** Saat pertama kali deploy ke server publik  
> **Estimasi waktu:** 2–3 hari setup  
> **Prasyarat:** Aplikasi sudah stabil dan diuji end-to-end

---

### P4-A · Cloudflare — DNS, SSL & WAF

- [ ] Daftarkan domain `gmhpakmk.org` ke Cloudflare
- [ ] Aktifkan **Full (Strict) SSL/TLS** — semua traffic dienkripsi
- [ ] Aktifkan **Cloudflare WAF** (Web Application Firewall) untuk blokir traffic berbahaya
- [ ] Setup **DDoS Protection** (otomatis di Cloudflare Free/Pro)
- [ ] Konfigurasi **Page Rules** untuk redirect HTTP → HTTPS
- [ ] Aktifkan **Bot Fight Mode** untuk blokir bot scraper

---

### P4-B · Containerisasi Docker Production

**Saat ini:** `docker-compose.yml` hanya untuk PostgreSQL.

**Target:**
- [ ] Buat `Dockerfile` untuk `apps/api` (atau `apps/api-v2` Elysia)
- [ ] Buat `Dockerfile` untuk `apps/web` (Nginx serving static build)
- [ ] Update `docker-compose.yml` dengan service lengkap:
  ```yaml
  services:
    postgres:    # sudah ada
    api:         # baru
    web:         # baru (nginx)
    # redis:     # opsional untuk session store
  ```
- [ ] Setup `docker-compose.prod.yml` terpisah untuk production config

---

### P4-C · Database Backup Otomatis

- [ ] Setup cron job backup PostgreSQL harian: `pg_dump` → simpan ke cloud storage
- [ ] Retention policy: simpan 30 hari terakhir
- [ ] Test restore procedure

---

### P4-D · Monitoring & Uptime

- [ ] Setup **UptimeRobot** (gratis) untuk health check endpoint `/health` setiap 5 menit
- [ ] Konfigurasi alert email/WhatsApp jika server down
- [ ] Pasang **Sentry** (free tier) untuk error tracking di frontend dan backend

---

## 📊 Ringkasan Timeline

| Prioritas | Scope | Estimasi | Status |
|:---|:---|:---|:---|
| **P1 — Critical Security** | HttpOnly Cookie + CORS Strict + Rate Limit | 1–2 hari | 🔴 Segera |
| **P2 — Stabilisasi** | Audit Trail + Validation + Logging | 1–2 minggu | 🟡 Setelah P1 |
| **P3 — Migrasi Stack** | Elysia + Bun + Eden Treaty | 2–4 minggu | 🟢 Setelah P2 |
| **P4 — Infra Production** | Cloudflare + Docker + Monitoring | 2–3 hari | 🔵 Setelah P3 |

---

## 🚦 Status Eksekusi

### ✅ Selesai
- Arsitektur modular monorepo (npm workspaces)
- Skema database PostgreSQL + JSONB
- JWT auth dasar (Bearer token)
- RBAC Guard per role
- Audit Log interceptor (sebagian)
- PDF export multi-halaman ber-Kop Surat resmi
- Pagination, search & filter pada halaman list

### 🔄 Sedang Berjalan
- Pemisahan dokumen LPJ 2 halaman ber-Kop Surat (baru selesai P1 dari fitur)

### ⏳ Antrian Eksekusi (sesuai urutan planning ini)
- **Berikutnya → P1-A:** Ganti localStorage ke HttpOnly Cookie

---

> **Catatan:** File ini diperbarui setiap kali satu item selesai dieksekusi.  
> Mulai eksekusi dari **P1-A** terlebih dahulu.
