import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/foundationos'
});

async function run() {
  console.log('[Migrate] Updating pledges schema and seeding installments...');

  // 1. Alter table
  await pool.query(`
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS category VARCHAR(150) DEFAULT 'Pembangunan Rumah Persekutuan';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS pledge_type VARCHAR(50) DEFAULT 'PLEDGE';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS notes TEXT;
  `);
  console.log('[Migrate] Columns added to pledges.');

  // Get superadmin user id
  const userRes = await pool.query(`SELECT id FROM users WHERE username = 'superadmin' LIMIT 1`);
  const adminId = userRes.rows[0]?.id;

  // Get members
  const yusufRes = await pool.query(`SELECT id, full_name, member_number FROM members WHERE full_name ILIKE '%Yusuf Panjaitan%' LIMIT 1`);
  const marianaRes = await pool.query(`SELECT id, full_name, member_number FROM members WHERE full_name ILIKE '%Mariana Hutabarat%' LIMIT 1`);
  const jeksonRes = await pool.query(`SELECT id, full_name, member_number FROM members WHERE full_name ILIKE '%Jekson Simanjuntak%' LIMIT 1`);
  const deboraRes = await pool.query(`SELECT id, full_name, member_number FROM members WHERE full_name ILIKE '%Debora Sinaga%' LIMIT 1`);

  const yusuf = yusufRes.rows[0];
  const mariana = marianaRes.rows[0];
  const jekson = jeksonRes.rows[0];
  const debora = deboraRes.rows[0];

  // Get building project
  const bpRes = await pool.query(`SELECT id FROM building_projects LIMIT 1`);
  const bpId = bpRes.rows[0]?.id || null;

  // 2. Clear old demo pledges & transactions linked to pledges
  await pool.query(`DELETE FROM financial_transactions WHERE pledge_id IS NOT NULL`);
  await pool.query(`DELETE FROM pledges`);

  // 3. Insert Pledges
  // A. Keluarga Sinurat (Non-member)
  const sinuratRes = await pool.query(`
    INSERT INTO pledges (
      id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes, building_project_id
    ) VALUES (
      'e0000000-0000-0000-0000-000000000001',
      'Keluarga Sinurat',
      50000000.00,
      35000000.00,
      'Pembangunan Rumah Persekutuan',
      'PLEDGE',
      'ACTIVE',
      'Komitmen donasi keluarga untuk pembangunan tahap 1 hingga selesai',
      $1
    ) RETURNING id
  `, [bpId]);
  const sinuratId = sinuratRes.rows[0].id;

  // B. Yusuf Panjaitan - Pledge 1 (Pembangunan)
    let yusufPledge1Id = 'e0000000-0000-0000-0000-000000000002';
  if (yusuf) {
    const yRes1 = await pool.query(`
      INSERT INTO pledges (
        id, member_id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes, building_project_id
      ) VALUES (
        $1, $2, $3, 20000000.00, 12000000.00, 'Pembangunan Rumah Persekutuan', 'PLEDGE', 'ACTIVE',
        'Komitmen janji iman alumni angkatan 2021', $4
      ) RETURNING id
    `, [yusufPledge1Id, yusuf.id, yusuf.full_name, bpId]);
    yusufPledge1Id = yRes1.rows[0].id;

    // Yusuf Pledge 2 (Pelayanan Misi)
    await pool.query(`
      INSERT INTO pledges (
        id, member_id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes
      ) VALUES (
        'e0000000-0000-0000-0000-000000000003', $1, $2, 5000000.00, 5000000.00, 'Pelayanan Misi & Pos Pekabar Injil', 'DONATION', 'COMPLETED',
        'Dukungan langsung operasional misi desa binaan Simalungun'
      )
    `, [yusuf.id, yusuf.full_name]);
  }

  // C. Mariana Hutabarat
  let marianaPledgeId = 'e0000000-0000-0000-0000-000000000004';
  if (mariana) {
    await pool.query(`
      INSERT INTO pledges (
        id, member_id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes, building_project_id
      ) VALUES (
        $1, $2, $3, 10000000.00, 7500000.00, 'Renovasi & Audio Visual Ruang Doa', 'PLEDGE', 'ACTIVE',
        'Komitmen dukungan sound system & streaming kampus', $4
      )
    `, [marianaPledgeId, mariana.id, mariana.full_name, bpId]);
  }

  // D. Jekson Simanjuntak
  let jeksonPledgeId = 'e0000000-0000-0000-0000-000000000005';
  if (jekson) {
    await pool.query(`
      INSERT INTO pledges (
        id, member_id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes, building_project_id
      ) VALUES (
        $1, $2, $3, 15000000.00, 5000000.00, 'Pembangunan Rumah Persekutuan', 'PLEDGE', 'ACTIVE',
        'Angsuran per 3 bulan selama tahun 2026', $4
      )
    `, [jeksonPledgeId, jekson.id, jekson.full_name, bpId]);
  }

  // E. Debora Sinaga
  let deboraPledgeId = 'e0000000-0000-0000-0000-000000000006';
  if (debora) {
    await pool.query(`
      INSERT INTO pledges (
        id, member_id, donor_name, total_pledge, fulfilled_amount, category, pledge_type, status, notes
      ) VALUES (
        $1, $2, $3, 3000000.00, 3000000.00, 'Pelayanan Misi & Pembinaan Adik Binaan', 'DONATION', 'COMPLETED',
        'Persembahan syukur wisuda & donasi adik asuh'
      )
    `, [deboraPledgeId, debora.id, debora.full_name]);
  }

  // 4. Seed Installment Transactions (Kapan-kapan mereka memberikan!)
  const installments = [
    // Keluarga Sinurat (3 installments)
    {
      code: 'KWT-GMH-202602-001',
      date: '2026-02-10',
      amount: 10000000.00,
      method: 'BANK_TRANSFER',
      pledgeId: sinuratId,
      memberId: null,
      notes: 'Tahap 1 Komitmen Janji Iman - Peletakan Batu Pertama (Kel. Sinurat)',
    },
    {
      code: 'KWT-GMH-202606-002',
      date: '2026-06-15',
      amount: 15000000.00,
      method: 'BANK_TRANSFER',
      pledgeId: sinuratId,
      memberId: null,
      notes: 'Tahap 2 Komitmen Janji Iman - Pengecoran Struktur Lantai 1 (Kel. Sinurat)',
    },
    {
      code: 'KWT-GMH-202610-003',
      date: '2026-10-15',
      amount: 10000000.00,
      method: 'BANK_TRANSFER',
      pledgeId: sinuratId,
      memberId: null,
      notes: 'Tahap 3 Komitmen Janji Iman - Pemasangan Dinding & Kusen (Kel. Sinurat)',
    },

    // Yusuf Panjaitan (Pledge 1: 3 installments)
    ...(yusuf ? [
      {
        code: 'KWT-GMH-202601-004',
        date: '2026-01-15',
        amount: 4000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: yusufPledge1Id,
        memberId: yusuf.id,
        notes: 'Angsuran 1/5 Komitmen Janji Iman Pembangunan (Yusuf Panjaitan)',
      },
      {
        code: 'KWT-GMH-202604-005',
        date: '2026-04-20',
        amount: 4000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: yusufPledge1Id,
        memberId: yusuf.id,
        notes: 'Angsuran 2/5 Komitmen Janji Iman Pembangunan (Yusuf Panjaitan)',
      },
      {
        code: 'KWT-GMH-202607-006',
        date: '2026-07-15',
        amount: 4000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: yusufPledge1Id,
        memberId: yusuf.id,
        notes: 'Angsuran 3/5 Komitmen Janji Iman Pembangunan (Yusuf Panjaitan)',
      },
      // Yusuf Panjaitan (Pledge 2: 1 installment)
      {
        code: 'KWT-GMH-202609-007',
        date: '2026-09-10',
        amount: 5000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: 'e0000000-0000-0000-0000-000000000003',
        memberId: yusuf.id,
        notes: 'Donasi Program Misi Simalungun - Pelunasan Langsung (Yusuf Panjaitan)',
      },
    ] : []),

    // Mariana Hutabarat (3 installments)
    ...(mariana ? [
      {
        code: 'KWT-GMH-202602-008',
        date: '2026-02-05',
        amount: 2500000.00,
        method: 'QRIS',
        pledgeId: marianaPledgeId,
        memberId: mariana.id,
        notes: 'Cicilan 1/4 Janji Iman Audio Visual Ruang Doa (Mariana Hutabarat)',
      },
      {
        code: 'KWT-GMH-202605-009',
        date: '2026-05-12',
        amount: 2500000.00,
        method: 'BANK_TRANSFER',
        pledgeId: marianaPledgeId,
        memberId: mariana.id,
        notes: 'Cicilan 2/4 Janji Iman Audio Visual Ruang Doa (Mariana Hutabarat)',
      },
      {
        code: 'KWT-GMH-202608-010',
        date: '2026-08-20',
        amount: 2500000.00,
        method: 'BANK_TRANSFER',
        pledgeId: marianaPledgeId,
        memberId: mariana.id,
        notes: 'Cicilan 3/4 Janji Iman Audio Visual Ruang Doa (Mariana Hutabarat)',
      },
    ] : []),

    // Jekson Simanjuntak (1 installment)
    ...(jekson ? [
      {
        code: 'KWT-GMH-202606-011',
        date: '2026-06-10',
        amount: 5000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: jeksonPledgeId,
        memberId: jekson.id,
        notes: 'Angsuran Termin 1 Janji Iman Pembangunan (Jekson Simanjuntak)',
      },
    ] : []),

    // Debora Sinaga (1 installment)
    ...(debora ? [
      {
        code: 'KWT-GMH-202610-012',
        date: '2026-10-22',
        amount: 3000000.00,
        method: 'BANK_TRANSFER',
        pledgeId: deboraPledgeId,
        memberId: debora.id,
        notes: 'Persembahan Syukur Donasi Pendidikan Adik Asuh (Debora Sinaga)',
      },
    ] : []),
  ];

  for (const inst of installments) {
    await pool.query(`
      INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type, account_id,
        amount, payment_method, scope, notes, recorded_by, donor_member_id, pledge_id
      ) VALUES (
        $1, $2, 'INCOME', '4-2010', $3, $4, 'YAYASAN_PUSAT', $5, $6, $7, $8
      ) ON CONFLICT (transaction_code) DO NOTHING
    `, [
      inst.code,
      inst.date,
      inst.amount,
      inst.method,
      inst.notes,
      adminId,
      inst.memberId,
      inst.pledgeId,
    ]);
  }

  console.log(`[Migrate] ${installments.length} installment transactions successfully created!`);
  await pool.end();
}

run().catch((err) => {
  console.error('[Migrate Error]', err);
  process.exit(1);
});
