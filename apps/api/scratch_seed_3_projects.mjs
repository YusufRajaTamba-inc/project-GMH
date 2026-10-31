import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://postgres:postgrespassword@localhost:5432/foundationos',
});

const SEED_PROJECTS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    project_name: 'Pembangunan Rumah Persekutuan GMH PA KMK',
    category: 'INFRASTRUKTUR',
    target_budget: 1800000000,
    current_funds: 1234000000,
    progress_percentage: 78,
    status: 'ON_PROGRESS',
    description: 'Pusat pembinaan mahasiswa, asrama pembinaan rohani, ruang ibadah & doa terpadu, serta kantor sekretariat Yayasan GMH PA KMK USU.',
    pic_name: 'Ir. P. Simanjuntak (Panitia Pembangunan)',
    start_date: '2024-01-15',
    target_completion_date: '2026-12-31',
    milestones: [
      { id: 1, label: 'Peletakan Batu Pertama', date: 'Jadwal Target: Maret 2024', status: 'DONE', pct: 100 },
      { id: 2, label: 'Fondasi & Struktur Bawah', date: 'Jadwal Target: Agustus 2024', status: 'DONE', pct: 100 },
      { id: 3, label: 'Struktur Kolom & Balok Lt.1', date: 'Jadwal Target: Februari 2025', status: 'DONE', pct: 100 },
      { id: 4, label: 'Atap & Dinding Eksterior', date: 'Jadwal Target: Agustus 2025', status: 'DONE', pct: 100 },
      { id: 5, label: 'Finishing Interior & MEP', date: 'Jadwal Target: April 2026', status: 'IN_PROGRESS', pct: 65 },
      { id: 6, label: 'Furnitur & Peresmian Gedung', date: 'Jadwal Target: Desember 2026', status: 'PENDING', pct: 0 }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    project_name: 'Renovasi & Audio Visual Ruang Doa Kampus',
    category: 'FASILITAS',
    target_budget: 150000000,
    current_funds: 112500000,
    progress_percentage: 75,
    status: 'ON_PROGRESS',
    description: 'Renovasi tata ruang akustik, instalasi peredam suara, dan sistem audio visual live streaming persekutuan doa kampus USU.',
    pic_name: 'Departemen Sarana & Prasarana GMH',
    start_date: '2026-01-10',
    target_completion_date: '2026-11-30',
    milestones: [
      { id: 1, label: 'Pengukuran & Desain Akustik Ruangan', date: 'Jadwal Target: Januari 2026', status: 'DONE', pct: 100 },
      { id: 2, label: 'Pemasangan Karpet & Panel Insulasi Akustik', date: 'Jadwal Target: Maret 2026', status: 'DONE', pct: 100 },
      { id: 3, label: 'Pengadaan Mixer Digital, Mic & Sound System', date: 'Jadwal Target: Mei 2026', status: 'DONE', pct: 100 },
      { id: 4, label: 'Instalasi Kamera PTZ & Uji Live Streaming', date: 'Jadwal Target: Juli 2026', status: 'IN_PROGRESS', pct: 70 },
      { id: 5, label: 'Serah Terima & Ibadah Doa Syukur Bersama', date: 'Jadwal Target: November 2026', status: 'PENDING', pct: 0 }
    ]
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    project_name: 'Pengadaan Mobil Operasional Pelayanan Misi Daerah',
    category: 'MISI',
    target_budget: 350000000,
    current_funds: 210000000,
    progress_percentage: 60,
    status: 'ON_PROGRESS',
    description: 'Pengadaan unit armada minibus operasional untuk mobilisasi tim penginjilan, pembinaan adik binaan, dan kunjungan pos misi daerah Sumatera Utara.',
    pic_name: 'Koordinator Pelayanan Misi Daerah',
    start_date: '2026-02-01',
    target_completion_date: '2027-02-28',
    milestones: [
      { id: 1, label: 'Survei Kebutuhan Spesifikasi Armada Minibus', date: 'Jadwal Target: Februari 2026', status: 'DONE', pct: 100 },
      { id: 2, label: 'Penggalangan Komitmen Donatur & Alumni', date: 'Jadwal Target: Mei 2026', status: 'DONE', pct: 100 },
      { id: 3, label: 'Pemesanan Unit & Karoseri Interior Pelayanan', date: 'Jadwal Target: Agustus 2026', status: 'IN_PROGRESS', pct: 60 },
      { id: 4, label: 'Pelunasan & Pengurusan STNK/BPKB Plat Yayasan', date: 'Jadwal Target: Desember 2026', status: 'PENDING', pct: 0 },
      { id: 5, label: 'Dedikasi Kendaraan & Pelayanan Misi Perdana', date: 'Jadwal Target: Februari 2027', status: 'PENDING', pct: 0 }
    ]
  }
];

async function seed() {
  try {
    console.log('Seeding 3 projects into building_projects...');
    
    // Clear existing projects to guarantee exactly 3 projects
    await pool.query(`DELETE FROM building_projects`);

    for (const p of SEED_PROJECTS) {
      await pool.query(`
        INSERT INTO building_projects (
          id, project_name, category, target_budget, current_funds,
          progress_percentage, status, description, pic_name,
          start_date, target_completion_date, milestones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        p.id,
        p.project_name,
        p.category,
        p.target_budget,
        p.current_funds,
        p.progress_percentage,
        p.status,
        p.description,
        p.pic_name,
        p.start_date,
        p.target_completion_date,
        JSON.stringify(p.milestones)
      ]);
    }

    const count = await pool.query(`SELECT count(*) FROM building_projects`);
    console.log(`Successfully seeded ${count.rows[0].count} projects!`);

    const list = await pool.query(`SELECT id, project_name, category, target_budget, current_funds, progress_percentage, status FROM building_projects`);
    console.table(list.rows);
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
