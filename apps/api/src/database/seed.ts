import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db, pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('[Seeder] Starting database seeding...');

  // 1. Execute seeds.sql
  const seedsSqlPath = path.join(__dirname, 'seeds.sql');
  const seedsSql = fs.readFileSync(seedsSqlPath, 'utf-8');
  await db.query(seedsSql);
  console.log('[Seeder] Roles, lookups, and initial configs seeded.');

  // 2. Hash password for users
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);

  const usersToSeed = [
    {
      username: 'superadmin',
      email: 'admin@gmhpakmk.org',
      fullName: 'Super Admin IT Yayasan',
      roleId: 'SUPER_ADMIN',
      phone: '08126000001',
    },
    {
      username: 'dewan.pengawas',
      email: 'pengawas@gmhpakmk.org',
      fullName: 'Bpk. Dr. S. Silalahi (Dewan Pengawas)',
      roleId: 'DEWAN_PENGAWAS_PEMBINA',
      phone: '08126000002',
    },
    {
      username: 'pengurus.harian',
      email: 'pengurus@gmhpakmk.org',
      fullName: 'Pdt. Y. Tamba, M.Th (Pengurus Harian)',
      roleId: 'PENGURUS_HARIAN',
      phone: '08126000003',
    },
    {
      username: 'bendahara.yayasan',
      email: 'bendahara@gmhpakmk.org',
      fullName: 'Grace Silalahi, S.E., Ak. (Bendahara Yayasan)',
      roleId: 'BENDAHARA_YAYASAN',
      phone: '08126000004',
    },
    {
      username: 'bendahara.admin',
      email: 'kas.operasional@gmhpakmk.org',
      fullName: 'Staf Kas Operasional Kantor',
      roleId: 'BENDAHARA_ADMIN',
      phone: '08126000005',
    },
    {
      username: 'koordinator.misi',
      email: 'misi@gmhpakmk.org',
      fullName: 'Bpk. Ronald Manullang (Departemen Misi)',
      roleId: 'KOORDINATOR_DEPARTEMEN',
      phone: '08126000006',
    },
  ];

  for (const u of usersToSeed) {
    await db.query(
      `INSERT INTO users (username, email, phone_number, password_hash, full_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO UPDATE 
       SET full_name = EXCLUDED.full_name, role_id = EXCLUDED.role_id, password_hash = EXCLUDED.password_hash`,
      [u.username, u.email, u.phone, defaultPasswordHash, u.fullName, u.roleId]
    );
  }
  console.log(`[Seeder] Seeded ${usersToSeed.length} users with password: admin123`);

  // 3. Seed Members & Alumni Profiles
  const sampleMembers = [
    {
      nia: 'GMH-2026-00001',
      nik: '1271010101960001',
      name: 'Yusuf Panjaitan',
      gender: 'Laki-laki',
      birthDate: '1996-04-12',
      weddingDate: '2023-08-12',
      phone: '081234567801',
      email: 'yusuf.panjaitan@gmail.com',
      address: 'Jl. Dr. Mansyur No. 45, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'ALUMNI',
      faculty: 'Fakultas Teknik',
      major: 'Teknik Informatika',
      entryYear: 2016,
      profession: 'Software Engineer',
      company: 'Tech Innovator Medan',
    },
    {
      nia: 'GMH-2026-00002',
      nik: '1271010101980002',
      name: 'Mariana Hutabarat',
      gender: 'Perempuan',
      birthDate: '1998-09-24',
      weddingDate: null,
      phone: '081234567802',
      email: 'mariana.h@gmail.com',
      address: 'Jl. Jamin Ginting KM 8, Medan',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      type: 'ALUMNI',
      faculty: 'Fakultas MIPA',
      major: 'Biologi',
      entryYear: 2018,
      profession: 'Peneliti Lingkungan',
      company: 'Kementerian Lingkungan Hidup',
    },
    {
      nia: 'GMH-2026-00003',
      nik: '1271010101950003',
      name: 'Jekson Simanjuntak',
      gender: 'Laki-laki',
      birthDate: '1995-11-05',
      weddingDate: '2022-11-20',
      phone: '081234567803',
      email: 'jekson.sim@gmail.com',
      address: 'Jl. Ngagel Jaya Tengah, Surabaya',
      city: 'Surabaya',
      province: 'Jawa Timur',
      type: 'ALUMNI',
      faculty: 'Fakultas Kedokteran',
      major: 'Kedokteran Umum',
      entryYear: 2015,
      profession: 'Dokter Spesialis',
      company: 'RS Siloam',
    },
    {
      nia: 'GMH-2026-00004',
      nik: '1271010101990004',
      name: 'Debora Sinaga',
      gender: 'Perempuan',
      birthDate: '1999-07-18',
      weddingDate: null,
      phone: '081234567804',
      email: 'debora.sinaga@gmail.com',
      address: 'Jl. Dipati Ukur No. 12, Bandung',
      city: 'Bandung',
      province: 'Jawa Barat',
      type: 'ALUMNI',
      faculty: 'Fakultas Hukum',
      major: 'Ilmu Hukum',
      entryYear: 2019,
      profession: 'Legal Corporate',
      company: 'PT Global Solusi',
    },
    {
      nia: 'GMH-2026-00005',
      nik: '1271010101970005',
      name: 'Antonius Saragih',
      gender: 'Laki-laki',
      birthDate: '1997-03-30',
      weddingDate: '2024-05-18',
      phone: '081234567805',
      email: 'anton.saragih@gmail.com',
      address: 'Jl. Padang Bulan No. 88, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'ALUMNI',
      faculty: 'Fakultas Pertanian',
      major: 'Agroteknologi',
      entryYear: 2017,
      profession: 'Wirausaha Agribisnis',
      company: 'Saragih Agro Farm',
    },
    {
      nia: 'GMH-2026-00006',
      nik: '1271010102000006',
      name: 'Grace Silalahi',
      gender: 'Perempuan',
      birthDate: '2000-02-15',
      weddingDate: null,
      phone: '081234567806',
      email: 'grace.silalahi@gmhpakmk.org',
      address: 'Jl. Setia Budi Pasar 2, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'STAF_YAYASAN',
      faculty: 'Fakultas Ekonomi & Bisnis',
      major: 'Akuntansi',
      entryYear: 2020,
      profession: 'Staf Administrasi & Keuangan',
      company: 'Yayasan Global Mission House',
    },
    {
      nia: 'GMH-2026-00007',
      nik: '1271010101940007',
      name: 'Ronald Manullang',
      gender: 'Laki-laki',
      birthDate: '1994-08-10',
      weddingDate: '2021-02-14',
      phone: '081234567807',
      email: 'ronald.m@gmail.com',
      address: 'Jl. Thamrin No. 90, Jakarta',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      type: 'ALUMNI',
      faculty: 'Fakultas Teknik',
      major: 'Teknik Sipil',
      entryYear: 2014,
      profession: 'Konsultan Struktur',
      company: 'PT Rekayasa Bangunan',
    },
    {
      nia: 'GMH-2026-00008',
      nik: '1271010102000008',
      name: 'Yusuf Tamba',
      gender: 'Laki-laki',
      birthDate: '2000-10-15',
      weddingDate: null,
      phone: '081234567808',
      email: 'yusuf.tamba@gmhpakmk.org',
      address: 'Jl. Harmonika Baru No. 11, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'ALUMNI',
      faculty: 'Fakultas Teknik',
      major: 'Teknologi Informasi',
      entryYear: 2020,
      profession: 'Alumni Profesional',
      company: 'Digital Creative Studio',
    },
  ];

  for (const m of sampleMembers) {
    const memRes = await db.query(
      `INSERT INTO members (member_number, nik, full_name, gender, birth_date, wedding_date, phone_number, email, home_address, city, province, member_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
       ON CONFLICT (member_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [m.nia, m.nik, m.name, m.gender, m.birthDate, m.weddingDate, m.phone, m.email, m.address, m.city, m.province, m.type]
    );
    const memberId = memRes.rows[0].id;

    await db.query(
      `INSERT INTO alumni_profiles (member_id, faculty, major, entry_year, current_profession, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (member_id) DO UPDATE 
       SET faculty = EXCLUDED.faculty, major = EXCLUDED.major, entry_year = EXCLUDED.entry_year, current_profession = EXCLUDED.current_profession`,
      [memberId, m.faculty, m.major, m.entryYear, m.profession, m.company]
    );
  }
  console.log(`[Seeder] Seeded ${sampleMembers.length} members with alumni profiles.`);

  // Additional sample members for foundation boards, staff, and missionaries
  const additionalMembers = [
    {
      nia: 'GMH-2026-00009',
      nik: '1271010101900009',
      name: 'Pdt. Andi Simanjuntak',
      gender: 'Laki-laki',
      birthDate: '1985-05-15',
      weddingDate: '2012-09-20',
      phone: '081260000010',
      email: 'andi.simanjuntak@gmhpakmk.org',
      address: 'Jl. STM No. 24, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'PENGURUS',
      faculty: 'Fakultas Ilmu Budaya',
      major: 'Sastra Inggris',
      entryYear: 2003,
      profession: 'Direktur Eksekutif Yayasan',
      company: 'Yayasan Global Mission House',
    },
    {
      nia: 'GMH-2026-00010',
      nik: '1271010101920010',
      name: 'Ev. Benyamin Tobing',
      gender: 'Laki-laki',
      birthDate: '1992-07-11',
      weddingDate: null,
      phone: '081260118899',
      email: 'benyamin.tobing@gmhpakmk.org',
      address: 'Pos Misi Simalungun, Saribudolok',
      city: 'Simalungun',
      province: 'Sumatera Utara',
      type: 'MISIONARIS',
      faculty: 'Fakultas Teknik',
      major: 'Teknik Elektro',
      entryYear: 2010,
      profession: 'Pekabar Injil Pos Simalungun',
      company: 'Departemen Misi GMH',
    },
    {
      nia: 'GMH-2026-00011',
      nik: '1271010101930011',
      name: 'Ev. Ratna Napitupulu',
      gender: 'Perempuan',
      birthDate: '1993-11-22',
      weddingDate: null,
      phone: '081298765432',
      email: 'ratna.napitupulu@gmhpakmk.org',
      address: 'Pos Misi Tobasa, Balige',
      city: 'Toba',
      province: 'Sumatera Utara',
      type: 'MISIONARIS',
      faculty: 'Fakultas MIPA',
      major: 'Matematika',
      entryYear: 2011,
      profession: 'Pekabar Injil Pos Tobasa',
      company: 'Departemen Misi GMH',
    },
    {
      nia: 'GMH-2026-00012',
      nik: '1271010101940012',
      name: 'Ev. Samuel Manalu',
      gender: 'Laki-laki',
      birthDate: '1994-03-18',
      weddingDate: null,
      phone: '081377889900',
      email: 'samuel.manalu@gmhpakmk.org',
      address: 'Pos Pelayanan Gunungsitoli, Nias',
      city: 'Gunungsitoli',
      province: 'Sumatera Utara',
      type: 'MISIONARIS',
      faculty: 'Fakultas Kedokteran Gigi',
      major: 'Pendidikan Dokter Gigi',
      entryYear: 2012,
      profession: 'Pekabar Injil & Pelayanan Medis Nias',
      company: 'Departemen Misi GMH',
    },
    {
      nia: 'GMH-2026-00013',
      nik: '1271010101750013',
      name: 'Dr. S. Silalahi',
      gender: 'Laki-laki',
      birthDate: '1975-01-10',
      weddingDate: '2001-06-12',
      phone: '081260000002',
      email: 'pengawas@gmhpakmk.org',
      address: 'Jl. Sudirman No. 18, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'DEWAN_PENGAWAS',
      faculty: 'Fakultas Kedokteran',
      major: 'Spesialis Ilmu Bedah',
      entryYear: 1993,
      profession: 'Dokter Konsultan Senior & Dewan Pengawas',
      company: 'RSUP H. Adam Malik',
    },
    {
      nia: 'GMH-2026-00014',
      nik: '1271010101700014',
      name: 'Pdt. Y. Tamba, M.Th',
      gender: 'Laki-laki',
      birthDate: '1970-08-25',
      weddingDate: '1998-07-15',
      phone: '081260000003',
      email: 'pengurus@gmhpakmk.org',
      address: 'Jl. Harmonika Baru No. 11, Medan',
      city: 'Medan',
      province: 'Sumatera Utara',
      type: 'DEWAN_PEMBINA',
      faculty: 'Fakultas Ilmu Budaya',
      major: 'Sastra Daerah',
      entryYear: 1989,
      profession: 'Pendeta & Ketua Dewan Pembina',
      company: 'Yayasan Global Mission House',
    },
  ];

  for (const m of additionalMembers) {
    const memRes = await db.query(
      `INSERT INTO members (member_number, nik, full_name, gender, birth_date, wedding_date, phone_number, email, home_address, city, province, member_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE')
       ON CONFLICT (member_number) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [m.nia, m.nik, m.name, m.gender, m.birthDate, m.weddingDate, m.phone, m.email, m.address, m.city, m.province, m.type]
    );
    const memberId = memRes.rows[0].id;

    await db.query(
      `INSERT INTO alumni_profiles (member_id, faculty, major, entry_year, current_profession, company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (member_id) DO UPDATE 
       SET faculty = EXCLUDED.faculty, major = EXCLUDED.major, entry_year = EXCLUDED.entry_year, current_profession = EXCLUDED.current_profession`,
      [memberId, m.faculty, m.major, m.entryYear, m.profession, m.company]
    );
  }
  console.log(`[Seeder] Seeded ${sampleMembers.length + additionalMembers.length} members with alumni profiles.`);

  // 4. Seed Staff Members for Payroll (6 Active Staff)
  const staffSeeds = [
    { nia: 'GMH-2026-00009', dept: 'PENGURUS_HARIAN', title: 'Direktur Eksekutif Yayasan', type: 'FULL_TIME', salary: 8000000, bank: 'Bank Mandiri', no: '1060098765432', holder: 'Andi Simanjuntak' },
    { nia: 'GMH-2026-00006', dept: 'PENGURUS_HARIAN', title: 'Staf Administrasi & Keuangan', type: 'FULL_TIME', salary: 4500000, bank: 'Bank Mandiri', no: '1060012345678', holder: 'Grace Silalahi' },
    { nia: 'GMH-2026-00007', dept: 'PELAYANAN_MISI', title: 'Koordinator Pos Misi Lapangan', type: 'FULL_TIME', salary: 5000000, bank: 'Bank BNI', no: '0234567890', holder: 'Ronald Manullang' },
    { nia: 'GMH-2026-00010', dept: 'PELAYANAN_MISI', title: 'Pekabar Injil Pos Simalungun', type: 'MISSIONARY', salary: 3500000, bank: 'Bank BRI', no: '0112233445566', holder: 'Benyamin Tobing' },
    { nia: 'GMH-2026-00011', dept: 'PELAYANAN_MISI', title: 'Pekabar Injil Pos Tobasa', type: 'MISSIONARY', salary: 3500000, bank: 'Bank BCA', no: '8220019283', holder: 'Ratna Napitupulu' },
    { nia: 'GMH-2026-00012', dept: 'PELAYANAN_MISI', title: 'Pekabar Injil Pos Nias', type: 'MISSIONARY', salary: 3500000, bank: 'Bank Mandiri', no: '1060055443322', holder: 'Samuel Manalu' },
  ];

  for (const s of staffSeeds) {
    const memRes = await db.query(`SELECT id FROM members WHERE member_number = $1`, [s.nia]);
    if (memRes.rows.length > 0) {
      const memId = memRes.rows[0].id;
      await db.query(
        `INSERT INTO staff_members (member_id, department_id, position_title, employment_type, base_salary, bank_name, bank_account_number, bank_account_holder, joined_date, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2023-01-01', TRUE)
         ON CONFLICT (member_id) DO UPDATE 
         SET department_id = EXCLUDED.department_id, position_title = EXCLUDED.position_title, base_salary = EXCLUDED.base_salary, is_active = TRUE`,
        [memId, s.dept, s.title, s.type, s.salary, s.bank, s.no, s.holder]
      );
    }
  }
  console.log('[Seeder] Seeded staff members for isolated payroll.');

  // 5. Seed Org Positions & Tenures (Struktur Organisasi)
  const positionsToSeed = [
    { code: 'POS-PEMBINA', title: 'Ketua Dewan Pembina Yayasan', cat: 'DEWAN_PEMBINA', desc: 'Penjaga visi, misi, dan landasan spiritual Yayasan GMH', order: 1, nia: 'GMH-2026-00014' },
    { code: 'POS-PENGAWAS', title: 'Ketua Dewan Pengawas Yayasan', cat: 'DEWAN_PENGAWAS', desc: 'Pengawas tata kelola keuangan, hukum, dan audit aset berkala', order: 2, nia: 'GMH-2026-00013' },
    { code: 'POS-KETUA-HARIAN', title: 'Ketua Umum Pengurus Harian', cat: 'PENGURUS_HARIAN', desc: 'Pemimpin eksekutif operasional harian seluruh departemen GMH', order: 3, nia: 'GMH-2026-00009' },
    { code: 'POS-SEKRETARIS', title: 'Sekretaris Umum Yayasan', cat: 'PENGURUS_HARIAN', desc: 'Penanggung jawab administrasi, legalitas, dan persuratan yayasan', order: 4, nia: 'GMH-2026-00004' },
    { code: 'POS-BENDAHARA', title: 'Bendahara Umum Yayasan', cat: 'PENGURUS_HARIAN', desc: 'Penanggung jawab perbendaharaan, kas operasional, dan laporan keuangan', order: 5, nia: 'GMH-2026-00006' },
    { code: 'POS-KOORD-MISI', title: 'Koordinator Departemen Pelayanan Misi', cat: 'PENGURUS_HARIAN', desc: 'Pengembangan pos misi pedesaan, kemitraan pekabaran Injil, dan pendampingan misionaris', order: 6, nia: 'GMH-2026-00007' },
    { code: 'POS-KOORD-ALUMNI', title: 'Koordinator Pelayanan Alumni PA KMK', cat: 'PENGURUS_HARIAN', desc: 'Pengembangan jejaring alumni, database stambuk, dan persekutuan wilayah', order: 7, nia: 'GMH-2026-00001' },
  ];

  for (const pos of positionsToSeed) {
    const posRes = await db.query(
      `INSERT INTO org_positions (position_code, title, category, function_description, hierarchy_order, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (position_code) DO UPDATE 
       SET title = EXCLUDED.title, category = EXCLUDED.category, function_description = EXCLUDED.function_description, hierarchy_order = EXCLUDED.hierarchy_order
       RETURNING id`,
      [pos.code, pos.title, pos.cat, pos.desc, pos.order]
    );
    const positionId = posRes.rows[0].id;

    const memRes = await db.query(`SELECT id FROM members WHERE member_number = $1`, [pos.nia]);
    if (memRes.rows.length > 0) {
      const memberId = memRes.rows[0].id;
      await db.query(
        `INSERT INTO org_position_tenures (position_id, member_id, period, start_date, end_date, is_current, decree_number)
         VALUES ($1, $2, '2024 - 2029', '2024-01-01', '2029-12-31', TRUE, 'SK-GMH-01/I/2024')
         ON CONFLICT DO NOTHING`,
        [positionId, memberId]
      );
    }
  }
  console.log('[Seeder] Org positions and tenures seeded.');

  // 6. Seed Committee Records (Kepanitiaan Yayasan)
  const committeeSeeds = [
    {
      nia: 'GMH-2026-00007',
      name: 'Panitia Pembangunan Rumah Persekutuan GMH',
      role: 'Ketua Pelaksana Pembangunan',
      year: 2025,
      period: '2025 - 2027',
      status: 'ACTIVE',
      desc: 'Koordinasi perizinan, arsitektur, pembebasan lahan, dan penggalangan dana tahap struktur gedung.',
    },
    {
      nia: 'GMH-2026-00006',
      name: 'Panitia Pembangunan Rumah Persekutuan GMH',
      role: 'Bendahara Panitia Pembangunan',
      year: 2025,
      period: '2025 - 2027',
      status: 'ACTIVE',
      desc: 'Penerimaan janji iman, pembukuan rekening pembangunan, dan pelaporan keuangan berkala panitia.',
    },
    {
      nia: 'GMH-2026-00002',
      name: 'Panitia Retret Akbar Alumni PA KMK 2026',
      role: 'Ketua Panitia Pelaksana',
      year: 2026,
      period: '2026',
      status: 'ACTIVE',
      desc: 'Penyelenggaraan retret tahunan alumni bertempat di Sibolangit dengan target 300 peserta.',
    },
    {
      nia: 'GMH-2026-00003',
      name: 'Panitia Retret Akbar Alumni PA KMK 2026',
      role: 'Koordinator Sie Acara & Doa',
      year: 2026,
      period: '2026',
      status: 'ACTIVE',
      desc: 'Penyusunan rundown, pemateri pembinaan rohani, serta doa syafaat tim pelayan.',
    },
    {
      nia: 'GMH-2026-00010',
      name: 'Panitia Aksi Pelayanan Misi Pedesaan 2026',
      role: 'Koordinator Lapangan Pos Simalungun',
      year: 2026,
      period: '2026',
      status: 'ACTIVE',
      desc: 'Pelayanan penginjilan personal, kelas bina anak desa, dan pembagian paket kasih sembako.',
    },
  ];

  for (const c of committeeSeeds) {
    const memRes = await db.query(`SELECT id FROM members WHERE member_number = $1`, [c.nia]);
    if (memRes.rows.length > 0) {
      const memberId = memRes.rows[0].id;
      await db.query(
        `INSERT INTO committee_records (member_id, committee_name, role_title, event_year, period, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [memberId, c.name, c.role, c.year, c.period, c.status, c.desc]
      );
    }
  }
  console.log('[Seeder] Committee records seeded.');

  // 7. Seed Mission Activities (Dokumen Kegiatan Misi Lengkap)
  const missionActivitiesSeeds = [
    {
      id: 'ACT-1793368552666',
      title: 'Pelayanan Misi & Pekabar Injil Pos Simalungun',
      theme: 'Membawa Terang Kasih Kristus ke Pelosok Daerah',
      budget_estimate: 15000000,
      coordinator: 'Ev. Benyamin Tobing (Kordinator Lapangan)',
      location: 'Aula Desa & Pos Misi Simalungun',
      event_date: '2026-10-30',
      start_time: '09:00',
      end_time: '16:00',
      time_preview: 'Jumat, 30 Oktober 2026 (Pkl. 09:00 - 16:00 WIB)',
      description: 'Pelayanan visitasi keluarga binaan, pembinaan kelompok pemuridan anak dan remaja, serta ibadah syukur di pos pelayanan Simalungun.',
      media_drive_url: 'https://drive.google.com/drive/folders/gmh-misi-simalungun-2026',
      document_drive_url: 'https://drive.google.com/drive/folders/gmh-surat-tugas-simalungun',
      status: 'ON_PROGRESS',
      cash_balance: 8500000,
      transactions: [
        { id: 'trx-1', date: '2026-10-25', type: 'IN', category: 'Subsidi Kas Yayasan', description: 'Pencairan subsidi awal dari Kas Yayasan untuk operasional tim', amount: 5000000 },
        { id: 'trx-2', date: '2026-10-28', type: 'IN', category: 'Donasi Mandiri Alumni', description: 'Donasi spontan alumni cabang Siantar untuk bahan ajar anak', amount: 4500000 },
        { id: 'trx-3', date: '2026-10-29', type: 'OUT', category: 'Transportasi & Logistik', description: 'Sewa minibus operasional dan BBM perjalanan Medan - Simalungun', amount: 1000000 },
      ],
      rundown: [
        { id: 'rd-1', time: '09:00 - 10:00', pic: 'Ev. Benyamin Tobing', note: 'Ibadah Pembuka & Doa Bersama Pengurus Pos' },
        { id: 'rd-2', time: '10:00 - 12:30', pic: 'Tim Pemuridan Mahasiswa', note: 'Kelas KTB & Sekolah Minggu Gembira Adik Binaan' },
        { id: 'rd-3', time: '12:30 - 13:30', pic: 'Sie Konsumsi Pos', note: 'Makan Siang Persekutuan Bersama Masyarakat' },
        { id: 'rd-4', time: '13:30 - 16:00', pic: 'Seluruh Tim Pelayan', note: 'Kunjungan Doa ke Rumah Keluarga Binaan & Penutupan' },
      ],
      tasks: [
        { id: 'tsk-1', task: 'Persiapan modul pembinaan dan bingkisan anak', pic: 'Angel (Logistik)', done: true },
        { id: 'tsk-2', task: 'Konfirmasi kendaraan operasional & driver', pic: 'Yusuf (Transport)', done: true },
        { id: 'tsk-3', task: 'Koordinasi konsumsi dengan ibu-ibu pos lokal', pic: 'Kordinator Konsumsi', done: false },
      ],
      committees: [
        { id: 'com-1', role: 'Kordinator Lapangan', name: 'Ev. Benyamin Tobing', contact: '0812-6011-8899' },
        { id: 'com-2', role: 'Sie Acara & Firman', name: 'Alumni PA KMK Medan', contact: 'acara@gmhpakmk.org' },
        { id: 'com-3', role: 'Sie Logistik & Transport', name: 'Yusuf & Angel', contact: '0813-7722-1100' },
      ],
    },
    {
      id: 'ACT-1793368552777',
      title: 'Kunjungan Pos Misi & Pembinaan Adik Binaan Tobasa',
      theme: 'Tumbuh Berakar dalam Kasih dan Pelayanan Kerajaan Allah',
      budget_estimate: 12000000,
      coordinator: 'Ev. Ratna Napitupulu',
      location: 'Pos Misi Tobasa & Balige',
      event_date: '2026-11-14',
      start_time: '08:30',
      end_time: '15:00',
      time_preview: 'Sabtu, 14 November 2026 (Pkl. 08:30 - 15:00 WIB)',
      description: 'Pelatihan guru sekolah minggu pos pedesaan dan pembinaan kepemimpinan adik-adik binaan tingkat SMA/mahasiswa.',
      media_drive_url: 'https://drive.google.com/drive/folders/gmh-misi-tobasa-2026',
      document_drive_url: '',
      status: 'ON_PROGRESS',
      cash_balance: 6200000,
      transactions: [
        { id: 'trx-1', date: '2026-10-26', type: 'IN', category: 'Subsidi Kas Yayasan', description: 'Subsidi termin 1 untuk konsumsi pelatihan', amount: 4000000 },
        { id: 'trx-2', date: '2026-10-28', type: 'IN', category: 'Persembahan Kasih Alumni', description: 'Dukungan alumni KMK wilayah Toba', amount: 2200000 },
      ],
      rundown: [
        { id: 'rd-1', time: '08:30 - 09:30', pic: 'Ev. Ratna Napitupulu', note: 'Registrasi & Sarapan Bersama' },
        { id: 'rd-2', time: '09:30 - 12:00', pic: 'Tim Pembina Alumni', note: 'Sesi 1: Karakter Pemimpin Kristiani' },
        { id: 'rd-3', time: '13:00 - 15:00', pic: 'Tim Doa GMH', note: 'Sesi 2 & Ibadah Peneguhan Adik Binaan' },
      ],
      tasks: [
        { id: 'tsk-1', task: 'Pencetakan materi modul pembinaan 50 buku', pic: 'Tim Media', done: false },
        { id: 'tsk-2', task: 'Penyusunan sertifikat kehadiran peserta', pic: 'Sekretariat', done: false },
      ],
      committees: [
        { id: 'com-1', role: 'Penanggung Jawab', name: 'Ev. Ratna Napitupulu', contact: '0852-9900-1122' },
        { id: 'com-2', role: 'Pemateri / Fasilitator', name: 'BPH GMH PA KMK', contact: 'bph@gmhpakmk.org' },
      ],
    },
    {
      id: 'ACT-1793368552888',
      title: 'Misi Penginjilan Medis & Bantuan Sosial Nias',
      theme: 'Kasih yang Nyata bagi Kepulauan Nias',
      budget_estimate: 28000000,
      coordinator: 'Ev. Samuel Manalu & Dokter Alumni',
      location: 'Pos Pelayanan Gunungsitoli & Nias Selatan',
      event_date: '2026-12-07',
      start_time: '08:00',
      end_time: '17:00',
      time_preview: 'Senin - Rabu, 7-9 Desember 2026 (Pkl. 08:00 - 17:00 WIB)',
      description: 'Pengobatan gratis, penyuluhan kesehatan, pembagian sembako adik binaan, dan kebaktian kebangunan rohani keluarga misi.',
      media_drive_url: 'https://drive.google.com/drive/folders/gmh-misi-nias-2026',
      document_drive_url: 'https://drive.google.com/drive/folders/gmh-proposal-misi-nias',
      status: 'PLANNING',
      cash_balance: 18000000,
      transactions: [
        { id: 'trx-1', date: '2026-10-20', type: 'IN', category: 'Donasi Khusus Misi Nias', description: 'Donasi alumni kedokteran PA KMK USU untuk paket obat-obatan', amount: 18000000 },
      ],
      rundown: [
        { id: 'rd-1', time: '08:00 - 12:00', pic: 'Tim Medis Alumni', note: 'Pelayanan Pemeriksaan Kesehatan & Pengobatan Gratis' },
        { id: 'rd-2', time: '13:00 - 17:00', pic: 'Ev. Samuel Manalu', note: 'Pembagian Bingkisan Kasih & Doa Pelayanan' },
      ],
      tasks: [
        { id: 'tsk-1', task: 'Pengadaan paket obat generik dan vitamin', pic: 'dr. E. Simamora', done: true },
        { id: 'tsk-2', task: 'Tiket kapal penyeberangan Sibolga - Gunungsitoli', pic: 'Sie Transportasi', done: false },
      ],
      committees: [
        { id: 'com-1', role: 'Kordinator Wilayah Nias', name: 'Ev. Samuel Manalu', contact: '0821-3344-5566' },
        { id: 'com-2', role: 'Koordinator Medis', name: 'dr. E. Simamora (Alumni FK USU)', contact: '0811-9988-7766' },
      ],
    },
    {
      id: 'ACT-2026-001',
      title: 'Pemberdayaan Masyarakat & Pembinaan Pemuda Pos Karo',
      theme: 'Menghidupi Iman dalam Karya dan Pelayanan Nyata',
      budget_estimate: 10000000,
      coordinator: 'Ronald Manullang (Departemen Misi)',
      location: 'Kecamatan Kabanjahe, Tanah Karo',
      event_date: '2026-11-28',
      start_time: '10:00',
      end_time: '16:00',
      time_preview: 'Sabtu, 28 November 2026 (Pkl. 10:00 - 16:00 WIB)',
      description: 'Pelatihan agribisnis ramah lingkungan bersama alumni Fakultas Pertanian USU dan ibadah pemuda lintas pos pelayanan.',
      media_drive_url: '',
      document_drive_url: '',
      status: 'PLANNING',
      cash_balance: 3500000,
      transactions: [
        { id: 'trx-1', date: '2026-10-29', type: 'IN', category: 'Kas Departemen Misi', description: 'Penyisihan anggaran kegiatan pemuda daerah Karo', amount: 3500000 },
      ],
      rundown: [
        { id: 'rd-1', time: '10:00 - 12:00', pic: 'Antonius Saragih (FP USU)', note: 'Workshop Pembuatan Pupuk Organik & Bibit Unggul' },
        { id: 'rd-2', time: '13:30 - 16:00', pic: 'Tim Musik & Firman', note: 'Persekutuan Pujian & Penyembahan Pemuda Pos' },
      ],
      tasks: [
        { id: 'tsk-1', task: 'Persiapan bibit sayur dan materi pelatihan', pic: 'Antonius Saragih', done: true },
      ],
      committees: [
        { id: 'com-1', role: 'Koordinator Lapangan', name: 'Ronald Manullang', contact: '0812-6000-0006' },
      ],
    },
  ];

  for (const act of missionActivitiesSeeds) {
    await db.query(
      `INSERT INTO mission_activities (
        id, title, theme, budget_estimate, coordinator, location,
        event_date, start_time, end_time, time_preview, description,
        media_drive_url, document_drive_url, status, cash_balance,
        transactions, rundown, tasks, committees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE 
      SET title = EXCLUDED.title, theme = EXCLUDED.theme, budget_estimate = EXCLUDED.budget_estimate,
          coordinator = EXCLUDED.coordinator, location = EXCLUDED.location, event_date = EXCLUDED.event_date,
          start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, time_preview = EXCLUDED.time_preview,
          description = EXCLUDED.description, media_drive_url = EXCLUDED.media_drive_url,
          document_drive_url = EXCLUDED.document_drive_url, status = EXCLUDED.status,
          cash_balance = EXCLUDED.cash_balance, transactions = EXCLUDED.transactions,
          rundown = EXCLUDED.rundown, tasks = EXCLUDED.tasks, committees = EXCLUDED.committees`,
      [
        act.id, act.title, act.theme, act.budget_estimate, act.coordinator, act.location,
        act.event_date, act.start_time, act.end_time, act.time_preview, act.description,
        act.media_drive_url, act.document_drive_url, act.status, act.cash_balance,
        JSON.stringify(act.transactions), JSON.stringify(act.rundown), JSON.stringify(act.tasks), JSON.stringify(act.committees),
      ]
    );
  }
  console.log('[Seeder] Mission activities seeded with full JSONB relations.');

  // 8. Seed Building Project, Pledges & Donations
  await db.query(`
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS category VARCHAR(150) DEFAULT 'Pembangunan Rumah Persekutuan';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS pledge_type VARCHAR(50) DEFAULT 'PLEDGE';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS notes TEXT;
  `);

  const bpRes = await db.query(`
    INSERT INTO building_projects (
      id, project_name, target_budget, current_funds, start_date, target_completion_date, progress_percentage, status, description
    ) VALUES (
      'b0000000-0000-0000-0000-000000000001',
      'Pembangunan Rumah Persekutuan GMH',
      1500000000.00,
      650000000.00,
      '2024-01-15',
      '2027-12-31',
      45,
      'ON_PROGRESS',
      'Pembangunan gedung pusat persekutuan dan pembinaan mahasiswa/alumni GMH PA KMK USU'
    )
    ON CONFLICT (id) DO UPDATE 
    SET project_name = EXCLUDED.project_name, target_budget = EXCLUDED.target_budget, current_funds = EXCLUDED.current_funds
    RETURNING id
  `);
  const bpId = bpRes.rows[0]?.id || 'b0000000-0000-0000-0000-000000000001';

  const yusufMem = await db.query(`SELECT id FROM members WHERE full_name ILIKE '%Yusuf Panjaitan%' LIMIT 1`);
  const jeksonMem = await db.query(`SELECT id FROM members WHERE full_name ILIKE '%Jekson Simanjuntak%' LIMIT 1`);
  const marianaMem = await db.query(`SELECT id FROM members WHERE full_name ILIKE '%Mariana Hutabarat%' LIMIT 1`);
  const deboraMem = await db.query(`SELECT id FROM members WHERE full_name ILIKE '%Debora Sinaga%' LIMIT 1`);

  const yusufId = yusufMem.rows[0]?.id || null;
  const jeksonId = jeksonMem.rows[0]?.id || null;
  const marianaId = marianaMem.rows[0]?.id || null;
  const deboraId = deboraMem.rows[0]?.id || null;

  const sinuratPledgeId = 'e0000000-0000-0000-0000-000000000001';
  const yusufPledgeId = 'e0000000-0000-0000-0000-000000000002';
  const jeksonPledgeId = 'e0000000-0000-0000-0000-000000000003';
  const marianaPledgeId = 'e0000000-0000-0000-0000-000000000004';
  const siraitPledgeId = 'e0000000-0000-0000-0000-000000000005';
  const deboraPledgeId = 'e0000000-0000-0000-0000-000000000006';

  const pledgesData = [
    {
      id: sinuratPledgeId,
      donor_name: 'Keluarga Sinurat',
      total_pledge: 50000000.00,
      fulfilled_amount: 35000000.00,
      category: 'Pembangunan Rumah Persekutuan',
      pledge_type: 'PLEDGE',
      status: 'ACTIVE',
      notes: 'Komitmen donasi keluarga untuk pembangunan tahap 1 hingga selesai',
      building_project_id: bpId,
      member_id: null,
    },
    {
      id: yusufPledgeId,
      donor_name: 'Yusuf Raja Tamba Panjaitan, S.Kom',
      total_pledge: 20000000.00,
      fulfilled_amount: 12000000.00,
      category: 'Pembangunan Rumah Persekutuan',
      pledge_type: 'PLEDGE',
      status: 'ACTIVE',
      notes: 'Komitmen janji iman alumni angkatan 2021',
      building_project_id: bpId,
      member_id: yusufId,
    },
    {
      id: jeksonPledgeId,
      donor_name: 'dr. Jekson Simanjuntak, Sp.A',
      total_pledge: 15000000.00,
      fulfilled_amount: 5000000.00,
      category: 'Pembangunan Rumah Persekutuan',
      pledge_type: 'PLEDGE',
      status: 'ACTIVE',
      notes: 'Angsuran per 3 bulan selama tahun 2026',
      building_project_id: bpId,
      member_id: jeksonId,
    },
    {
      id: marianaPledgeId,
      donor_name: 'Mariana Hutabarat, S.E.',
      total_pledge: 10000000.00,
      fulfilled_amount: 7500000.00,
      category: 'Renovasi & Audio Visual Ruang Doa',
      pledge_type: 'PLEDGE',
      status: 'ACTIVE',
      notes: 'Komitmen dukungan sound system & streaming kampus',
      building_project_id: bpId,
      member_id: marianaId,
    },
    {
      id: siraitPledgeId,
      donor_name: 'Pdt. Dr. J. Sirait & Kel.',
      total_pledge: 25000000.00,
      fulfilled_amount: 25000000.00,
      category: 'Pembangunan Rumah Persekutuan',
      pledge_type: 'PLEDGE',
      status: 'COMPLETED',
      notes: 'Pelunasan Janji Iman Pembangunan Rumah Persekutuan',
      building_project_id: bpId,
      member_id: null,
    },
    {
      id: deboraPledgeId,
      donor_name: 'Debora Sinaga, S.Ked',
      total_pledge: 3000000.00,
      fulfilled_amount: 3000000.00,
      category: 'Pelayanan Misi & Pembinaan Adik Binaan',
      pledge_type: 'DONATION',
      status: 'COMPLETED',
      notes: 'Persembahan syukur wisuda & donasi adik asuh',
      building_project_id: null,
      member_id: deboraId,
    },
  ];

  for (const p of pledgesData) {
    await db.query(
      `INSERT INTO pledges (
        id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes, building_project_id, member_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE 
      SET donor_name = EXCLUDED.donor_name,
          total_pledge = EXCLUDED.total_pledge,
          fulfilled_amount = EXCLUDED.fulfilled_amount,
          category = EXCLUDED.category,
          pledge_type = EXCLUDED.pledge_type,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          building_project_id = EXCLUDED.building_project_id,
          member_id = EXCLUDED.member_id`,
      [p.id, p.donor_name, p.total_pledge, p.fulfilled_amount, p.category, p.pledge_type, p.status, p.notes, p.building_project_id, p.member_id]
    );
  }
  console.log('[Seeder] Pledges and building projects seeded.');

  // 9. Seed Financial Transactions (COA Compliant)
  const superUserRes = await db.query(`SELECT id FROM users WHERE username = 'superadmin'`);
  const adminUserId = superUserRes.rows[0].id;

  const trxSeeds = [
    {
      code: 'KWT-GMH-202610-001',
      date: '2026-10-14',
      type: 'INCOME',
      coa: '4-2010',
      amt: 35000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: sinuratPledgeId,
      memberId: null,
      notes: 'Penerimaan Janji Iman - Keluarga Sinurat (Tahap 3 dari 5 komitmen pembangunan Rumah Persekutuan)',
    },
    {
      code: 'TX-GMH-202610-001',
      date: '2026-10-14',
      type: 'INCOME',
      coa: '4-2010',
      amt: 35000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: sinuratPledgeId,
      memberId: null,
      notes: 'Tahap 3 dari 5 komitmen pembangunan Rumah Persekutuan (Kel. Sinurat)',
    },
    {
      code: 'KWT-GMH-202610-002',
      date: '2026-10-20',
      type: 'INCOME',
      coa: '4-2010',
      amt: 12000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: yusufPledgeId,
      memberId: yusufId,
      notes: 'Penerimaan Janji Iman - Yusuf Raja Tamba Panjaitan (Komitmen janji iman alumni angkatan 2021)',
    },
    {
      code: 'KWT-GMH-202610-003',
      date: '2026-10-22',
      type: 'INCOME',
      coa: '4-2010',
      amt: 5000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: jeksonPledgeId,
      memberId: jeksonId,
      notes: 'Penerimaan Janji Iman - dr. Jekson Simanjuntak, Sp.A (Angsuran 1/3 pembangunan Rumah Persekutuan)',
    },
    {
      code: 'KWT-GMH-202610-004',
      date: '2026-10-25',
      type: 'INCOME',
      coa: '4-2010',
      amt: 7500000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: marianaPledgeId,
      memberId: marianaId,
      notes: 'Penerimaan Janji Iman - Mariana Hutabarat, S.E. (Dukungan sound system & audio visual)',
    },
    {
      code: 'KWT-GMH-202610-005',
      date: '2026-10-10',
      type: 'INCOME',
      coa: '4-2010',
      amt: 25000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: siraitPledgeId,
      memberId: null,
      notes: 'Penerimaan Janji Iman - Pdt. Dr. J. Sirait & Kel. (Pelunasan Janji Iman Pembangunan Rumah Persekutuan)',
    },
    {
      code: 'KWT-GMH-202610-006',
      date: '2026-10-18',
      type: 'INCOME',
      coa: '4-1010',
      amt: 3000000.00,
      method: 'BANK_TRANSFER',
      scope: 'YAYASAN_PUSAT',
      pledgeId: deboraPledgeId,
      memberId: deboraId,
      notes: 'Penerimaan Donasi - Debora Sinaga, S.Ked (Persembahan syukur wisuda & donasi adik asuh)',
    },
    {
      code: 'TX-GMH-202610-002',
      date: '2026-10-20',
      type: 'EXPENSE',
      coa: '5-2010',
      amt: 1250000.00,
      method: 'CASH',
      scope: 'OPERASIONAL',
      pledgeId: null,
      memberId: null,
      notes: 'Pembelian ATK, kertas kop surat yayasan F4, map arsip, dan toner printer kantor',
    },
    {
      code: 'TX-GMH-202610-003',
      date: '2026-10-24',
      type: 'EXPENSE',
      coa: '5-2010',
      amt: 850000.00,
      method: 'BANK_TRANSFER',
      scope: 'OPERASIONAL',
      pledgeId: null,
      memberId: null,
      notes: 'Langganan Internet Fiber Optic Kantor Sekretariat GMH (Indihome 100 Mbps)',
    },
    {
      code: 'TX-GMH-202610-004',
      date: '2026-10-25',
      type: 'INCOME',
      coa: '4-1010',
      amt: 500000.00,
      method: 'BANK_TRANSFER',
      scope: 'OPERASIONAL',
      pledgeId: null,
      memberId: jeksonId,
      notes: 'Donasi kemitraan rutin alumni: dr. Jekson Simanjuntak',
    },
    {
      code: 'TX-GMH-202610-005',
      date: '2026-10-27',
      type: 'INCOME',
      coa: '4-1010',
      amt: 1500000.00,
      method: 'BANK_TRANSFER',
      scope: 'OPERASIONAL',
      pledgeId: null,
      memberId: yusufId,
      notes: 'Persembahan kasih alumni: Yusuf Panjaitan',
    },
    {
      code: 'TX-GMH-202610-006',
      date: '2026-10-28',
      type: 'EXPENSE',
      coa: '5-2010',
      amt: 450000.00,
      method: 'CASH',
      scope: 'OPERASIONAL',
      pledgeId: null,
      memberId: null,
      notes: 'Konsumsi persekutuan pengurus & doa evaluasi bulanan kantor',
    },
  ];

  for (const t of trxSeeds) {
    await db.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type, account_id,
        amount, payment_method, scope, notes, recorded_by, pledge_id, donor_member_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (transaction_code) DO UPDATE 
      SET pledge_id = EXCLUDED.pledge_id,
          donor_member_id = EXCLUDED.donor_member_id,
          amount = EXCLUDED.amount,
          notes = EXCLUDED.notes,
          account_id = EXCLUDED.account_id`,
      [t.code, t.date, t.type, t.coa, t.amt, t.method, t.scope, t.notes, adminUserId, t.pledgeId, t.memberId]
    );
  }
  console.log('[Seeder] Financial transactions seeded.');

  // 10. Seed Sample Pending Registrations
  await db.query(
    `INSERT INTO member_registrations (registration_code, full_name, gender, birth_date, wedding_date, phone_number, email, faculty, major, entry_year, home_address, city, province, current_profession, status)
     VALUES
     ('REG-GMH-202610-001', 'Josua Hutapea', 'Laki-laki', '2001-05-14', null, '081298765431', 'josua.h@gmail.com', 'Fakultas Teknik', 'Teknik Mesin', 2021, 'Jl. Padang Bulan Gg. Bersama No. 4', 'Medan', 'Sumatera Utara', 'Calon Wisudawan', 'PENDING'),
     ('REG-GMH-202610-002', 'Ruth Christine Simamora', 'Perempuan', '1999-12-08', '2025-06-15', '081298765432', 'ruth.simamora@gmail.com', 'Fakultas Kedokteran Gigi', 'Pendidikan Dokter Gigi', 2019, 'Jl. Sei Batang Hari No. 78', 'Medan', 'Sumatera Utara', 'Dokter Gigi Muda', 'PENDING'),
     ('REG-GMH-202610-003', 'Daniel Marpaung', 'Laki-laki', '1998-03-22', null, '081298765433', 'daniel.m@gmail.com', 'Fakultas Ekonomi & Bisnis', 'Manajemen', 2018, 'Jl. Gading Serpong Boulevard', 'Tangerang', 'Banten', 'Business Analyst', 'PENDING')
     ON CONFLICT (registration_code) DO NOTHING`
  );

  // 11. Seed Foundation Programs
  await db.query(
    `INSERT INTO foundation_programs (program_title, program_category, event_datetime, location, theme, speaker_name)
     VALUES
     ('Persekutuan Doa Alumni Bulanan (Online & Onsite)', 'PERSEKUTUAN_ALUMNI', '2026-11-07 19:30:00', 'Gedung GMH & Zoom Meeting', 'Setia Melayani di Tengah Dunia Kerja', 'Pdt. Dr. J. Sirait'),
     ('Retret Pembinaan Calon Alumni PA KMK 2026', 'PEMBINAAN_KAMPUS', '2026-11-20 08:00:00', 'Retreat Center Sukamakmur, Sibolangit', 'Integritas dan Misi Kerajaan Allah', 'Tim Pembinaan Yayasan')
     ON CONFLICT DO NOTHING`
  );

  // 12. Seed Sample Assets & Loans
  const soundLookupRes = await db.query(`SELECT id FROM system_lookups WHERE category = 'DONATION_TYPE' LIMIT 1`);
  const lookupId = soundLookupRes.rows[0]?.id;

  const assetList = [
    { code: 'AST-GMH-001', name: 'Sound System Mixer Yamaha 16-Channel', price: 12500000.00, rental: 250000.00, room: 'Ruang Ibadah & Doa Lt. 1', borrowable: true, type: 'OPERATIONAL' },
    { code: 'AST-GMH-002', name: 'Proyektor Laser Epson 4000 Lumens', price: 18000000.00, rental: 300000.00, room: 'Aula Serbaguna Lt. 2', borrowable: true, type: 'OPERATIONAL' },
    { code: 'AST-GMH-003', name: 'Genset Silent 5000 Watt', price: 22000000.00, rental: 0.00, room: 'Ruang Utilitas Luar', borrowable: false, type: 'FACILITY' },
    { code: 'AST-GMH-004', name: 'Kamera Video Sony 4K & Tripod Profesional', price: 15500000.00, rental: 200000.00, room: 'Studio Media Lt. 1', borrowable: true, type: 'OPERATIONAL' },
  ];

  for (const ast of assetList) {
    await db.query(
      `INSERT INTO assets (asset_code, asset_name, category_id, purchase_date, purchase_price, rental_price, physical_condition, location_room, is_borrowable, asset_type, quantity, available_quantity)
       VALUES ($1, $2, $3, '2024-05-10', $4, $5, 'GOOD', $6, $7, $8, 1, 1)
       ON CONFLICT (asset_code) DO UPDATE 
       SET asset_name = EXCLUDED.asset_name, rental_price = EXCLUDED.rental_price, asset_type = EXCLUDED.asset_type`,
      [ast.code, ast.name, lookupId, ast.price, ast.rental, ast.room, ast.borrowable, ast.type]
    );
  }

  // Seed 1 Sample Loan for Proyektor Laser Epson
  const proyektorRes = await db.query(`SELECT id FROM assets WHERE asset_code = 'AST-GMH-002'`);
  const yusufMemRes = await db.query(`SELECT id FROM members WHERE member_number = 'GMH-2026-00001'`);
  if (proyektorRes.rows.length > 0 && yusufMemRes.rows.length > 0) {
    const assetId = proyektorRes.rows[0].id;
    const borrowerMemberId = yusufMemRes.rows[0].id;
    await db.query(
      `INSERT INTO asset_loans (
        asset_id, borrower_member_id, borrower_name, borrower_phone, borrower_email, borrower_institution,
        loan_purpose, loan_type, rental_fee, quantity_borrowed, request_code,
        borrowed_at, expected_return_at, status
      ) VALUES ($1, $2, 'Yusuf Panjaitan', '081234567801', 'yusuf.panjaitan@gmail.com', 'Alumni PA KMK',
        'Peminjaman proyektor untuk persekutuan doa wilayah Medan Baru', 'INTERNAL', 0.00, 1, 'REQ-AST-202610-001',
        NOW(), NOW() + INTERVAL '2 days', 'BORROWED')
       ON CONFLICT DO NOTHING`,
      [assetId, borrowerMemberId]
    );
  }
  console.log('[Seeder] Assets and sample asset loan seeded.');

  // 13. Seed Prayer Requests
  const counselorRes = await db.query(`SELECT id FROM members WHERE member_number = 'GMH-2026-00009'`);
  const counselorId = counselorRes.rows[0]?.id || null;

  await db.query(
    `INSERT INTO prayer_requests (sender_name, sender_phone, sender_email, is_anonymous, prayer_content, status, assigned_counselor_id)
     VALUES 
     ('Alumni Stambuk 2018', '081233445566', 'alumni2018@gmail.com', false, 'Mohon dukungan doa bagi rekan-rekan alumni yang baru memulai usaha rintisan di bidang teknologi agar senantiasa berintegritas.', 'BEING_PRAYED', $1),
     ('Saudara dalam Kristus', null, null, true, 'Doa syafaat untuk kelancaran pembangunan Rumah Persekutuan GMH dan pos misi pedesaan yang sedang dirintis di Nias Selatan.', 'NEW', $1)
     ON CONFLICT DO NOTHING`,
    [counselorId]
  );
  console.log('[Seeder] Prayer requests seeded.');

  console.log('[Seeder] Database seeding finished successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seeder Error]', err);
      await pool.end();
      process.exit(1);
    });
}
