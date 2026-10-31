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

  // 4. Seed Staff Members for Payroll
  const graceMemberRes = await db.query(`SELECT id FROM members WHERE member_number = 'GMH-2026-00006'`);
  const ronaldMemberRes = await db.query(`SELECT id FROM members WHERE member_number = 'GMH-2026-00007'`);

  if (graceMemberRes.rows.length > 0) {
    await db.query(
      `INSERT INTO staff_members (member_id, department_id, position_title, employment_type, base_salary, bank_name, bank_account_number, bank_account_holder, joined_date)
       VALUES ($1, 'PENGURUS_HARIAN', 'Staf Administrasi & Keuangan', 'FULL_TIME', 4500000.00, 'Bank Mandiri', '1060012345678', 'Grace Silalahi', '2023-01-01')
       ON CONFLICT (member_id) DO NOTHING`,
      [graceMemberRes.rows[0].id]
    );
  }

  if (ronaldMemberRes.rows.length > 0) {
    await db.query(
      `INSERT INTO staff_members (member_id, department_id, position_title, employment_type, base_salary, bank_name, bank_account_number, bank_account_holder, joined_date)
       VALUES ($1, 'PELAYANAN_MISI', 'Koordinator Pos Misi Lapangan', 'MISSIONARY', 5000000.00, 'Bank BNI', '0234567890', 'Ronald Manullang', '2022-06-01')
       ON CONFLICT (member_id) DO NOTHING`,
      [ronaldMemberRes.rows[0].id]
    );
  }
  console.log('[Seeder] Staff members for isolated payroll seeded.');

  // 5. Seed Pledges & Donations
  const sinuratPledge = await db.query(
    `INSERT INTO pledges (donor_name, total_pledge, fulfilled_amount, status)
     VALUES ('Keluarga Sinurat', 50000000.00, 35000000.00, 'ACTIVE')
     RETURNING id`
  );

  // 6. Seed Sample Transactions
  const superUserRes = await db.query(`SELECT id FROM users WHERE username = 'superadmin'`);
  const adminUserId = superUserRes.rows[0].id;

  await db.query(
    `INSERT INTO financial_transactions (transaction_code, transaction_date, transaction_type, account_id, amount, payment_method, scope, notes, recorded_by)
     VALUES 
     ('TX-GMH-202610-001', '2026-10-15', 'INCOME', '4-2010', 35000000.00, 'BANK_TRANSFER', 'YAYASAN_PUSAT', 'Tahap 3 dari 5 komitmen pembangunan Rumah Persekutuan (Kel. Sinurat)', $1),
     ('TX-GMH-202610-002', '2026-10-18', 'EXPENSE', '5-2010', 1250000.00, 'CASH', 'OPERASIONAL', 'Pembelian ATK, kertas kop surat yayasan, dan toner printer kantor', $1),
     ('TX-GMH-202610-003', '2026-10-20', 'EXPENSE', '5-2010', 850000.00, 'BANK_TRANSFER', 'OPERASIONAL', 'Langganan Internet Fiber Optic Kantor Sekretariat GMH', $1)
     ON CONFLICT (transaction_code) DO NOTHING`,
    [adminUserId]
  );

  // 7. Seed Sample Pending Registrations
  await db.query(
    `INSERT INTO member_registrations (registration_code, full_name, gender, birth_date, wedding_date, phone_number, email, faculty, major, entry_year, home_address, city, province, current_profession, status)
     VALUES
     ('REG-GMH-202610-001', 'Josua Hutapea', 'Laki-laki', '2001-05-14', null, '081298765431', 'josua.h@gmail.com', 'Fakultas Teknik', 'Teknik Mesin', 2021, 'Jl. Padang Bulan Gg. Bersama No. 4', 'Medan', 'Sumatera Utara', 'Calon Wisudawan', 'PENDING'),
     ('REG-GMH-202610-002', 'Ruth Christine Simamora', 'Perempuan', '1999-12-08', '2025-06-15', '081298765432', 'ruth.simamora@gmail.com', 'Fakultas Kedokteran Gigi', 'Pendidikan Dokter Gigi', 2019, 'Jl. Sei Batang Hari No. 78', 'Medan', 'Sumatera Utara', 'Dokter Gigi Muda', 'PENDING'),
     ('REG-GMH-202610-003', 'Daniel Marpaung', 'Laki-laki', '1998-03-22', null, '081298765433', 'daniel.m@gmail.com', 'Fakultas Ekonomi & Bisnis', 'Manajemen', 2018, 'Jl. Gading Serpong Boulevard', 'Tangerang', 'Banten', 'Business Analyst', 'PENDING')
     ON CONFLICT (registration_code) DO NOTHING`
  );

  // 8. Seed Sample Foundation Programs
  await db.query(
    `INSERT INTO foundation_programs (program_title, program_category, event_datetime, location, theme, speaker_name)
     VALUES
     ('Persekutuan Doa Alumni Bulanan (Online & Onsite)', 'PERSEKUTUAN_ALUMNI', '2026-11-07 19:30:00', 'Gedung GMH & Zoom Meeting', 'Setia Melayani di Tengah Dunia Kerja', 'Pdt. Dr. J. Sirait'),
     ('Retret Pembinaan Calon Alumni PA KMK 2026', 'PEMBINAAN_KAMPUS', '2026-11-20 08:00:00', 'Retreat Center Sukamakmur, Sibolangit', 'Integritas dan Misi Kerajaan Allah', 'Tim Pembinaan Yayasan')
     ON CONFLICT DO NOTHING`
  );

  // 9. Seed Sample Assets
  const soundLookupRes = await db.query(`SELECT id FROM system_lookups WHERE category = 'DONATION_TYPE' LIMIT 1`);
  const lookupId = soundLookupRes.rows[0]?.id;

  await db.query(
    `INSERT INTO assets (asset_code, asset_name, category_id, purchase_date, purchase_price, physical_condition, location_room, is_borrowable)
     VALUES
     ('AST-GMH-001', 'Sound System Mixer Yamaha 16-Channel', $1, '2024-05-10', 12500000.00, 'GOOD', 'Ruang Ibadah & Doa Lt. 1', true),
     ('AST-GMH-002', 'Proyektor Laser Epson 4000 Lumens', $1, '2024-08-15', 18000000.00, 'GOOD', 'Aula Serbaguna Lt. 2', true),
     ('AST-GMH-003', 'Genset Silent 5000 Watt', $1, '2025-02-12', 22000000.00, 'GOOD', 'Ruang Utilitas Luar', false)
     ON CONFLICT (asset_code) DO NOTHING`,
    [lookupId]
  );

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
