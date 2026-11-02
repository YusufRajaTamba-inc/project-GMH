import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initDatabase() {
  console.log('[Migration] Starting database initialization...');
  const isConnected = await db.testConnection();
  if (!isConnected) {
    throw new Error('Cannot connect to database. Make sure PostgreSQL is running.');
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('[Migration] Executing schema.sql DDL...');
  await db.query(schemaSql);

  // Idempotent migrations for existing production tables
  console.log('[Migration] Applying table column migrations...');
  await db.query(`
    -- members: compatibility columns for local & production databases
    ALTER TABLE members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50) DEFAULT 'ALUMNI';
    UPDATE members SET is_active = (COALESCE(status, 'ACTIVE') = 'ACTIVE') WHERE is_active IS NULL;
    UPDATE members SET membership_type = COALESCE(member_type, 'ALUMNI') WHERE membership_type IS NULL;

    -- building_projects
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'INFRASTRUKTUR';
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS pic_name VARCHAR(150) DEFAULT 'Tim Proyek Yayasan';
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS account_id VARCHAR(50) REFERENCES chart_of_accounts(id);
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE building_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- foundation_programs
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS budget_estimate NUMERIC(15, 2) DEFAULT 0;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(15, 2) DEFAULT 0;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PLANNING';
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS media_drive_url TEXT;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS document_drive_url TEXT;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS transactions JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS rundown JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS committees JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE foundation_programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- asset_loans
    ALTER TABLE asset_loans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
    ALTER TABLE asset_loans ADD COLUMN IF NOT EXISTS approval_notes TEXT;
    ALTER TABLE asset_loans ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

    -- departments
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- system_lookups
    ALTER TABLE system_lookups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- pledges
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS category VARCHAR(150) DEFAULT 'Pembangunan Rumah Persekutuan';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS pledge_type VARCHAR(50) DEFAULT 'PLEDGE';
    ALTER TABLE pledges ADD COLUMN IF NOT EXISTS notes TEXT;

    -- staff_members: kolom yang dipakai modul organisasi
    ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS end_date DATE;
    ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'AKTIF';
    ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS job_description TEXT;
    ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- division_members
    ALTER TABLE division_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- committee_records
    ALTER TABLE committee_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  // Normalisasi nilai status agar konsisten dengan filter di frontend
  // (frontend memakai AKTIF / SELESAI / DEMISIONER, seed lama memakai ACTIVE).
  console.log('[Migration] Normalizing organization status values...');
  await db.query(`
    UPDATE committee_records
    SET status = CASE UPPER(status)
      WHEN 'ACTIVE' THEN 'AKTIF'
      WHEN 'COMPLETED' THEN 'SELESAI'
      WHEN 'DEMISSIONER' THEN 'DEMISIONER'
      ELSE 'SELESAI'
    END
    WHERE UPPER(COALESCE(status, '')) IN ('ACTIVE', 'COMPLETED', 'DEMISSIONER');

    UPDATE division_members
    SET status = CASE UPPER(status)
      WHEN 'ACTIVE' THEN 'AKTIF'
      WHEN 'ALUMNI_DIVISI' THEN 'DEMISIONER'
      WHEN 'DEMISSIONER' THEN 'DEMISIONER'
      ELSE 'DEMISIONER'
    END
    WHERE UPPER(COALESCE(status, '')) IN ('ACTIVE', 'ALUMNI_DIVISI', 'DEMISSIONER');

    UPDATE staff_members
    SET status = CASE UPPER(status)
      WHEN 'ACTIVE' THEN 'AKTIF'
      WHEN 'INACTIVE' THEN 'NON_AKTIF'
      WHEN 'SELESAI' THEN 'SELESAI'
      ELSE 'AKTIF'
    END
    WHERE UPPER(COALESCE(status, '')) IN ('ACTIVE', 'INACTIVE', 'SELESAI');
  `);

  // Idempotent constraint migrations: hapus duplikasi hasil seed berulang,
  // lalu kunci dengan UNIQUE agar seed berikutnya tidak menambah baris kembar.
  console.log('[Migration] Deduplicating seeded rows and applying unique constraints...');
  await db.query(`
    -- org_position_tenures: hapus tenure kembar (position_id, member_id, period)
    DELETE FROM org_position_tenures a
    USING org_position_tenures b
    WHERE a.id > b.id
      AND a.position_id = b.position_id
      AND a.member_id = b.member_id
      AND a.period = b.period;

    -- committee_records: hapus catatan kepanitiaan kembar (member_id, committee_name, role_title)
    DELETE FROM committee_records a
    USING committee_records b
    WHERE a.id > b.id
      AND a.member_id = b.member_id
      AND a.committee_name = b.committee_name
      AND a.role_title = b.role_title;
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_org_position_tenure'
      ) THEN
        ALTER TABLE org_position_tenures
          ADD CONSTRAINT uq_org_position_tenure UNIQUE (position_id, member_id, period);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_committee_member_role'
      ) THEN
        ALTER TABLE committee_records
          ADD CONSTRAINT uq_committee_member_role UNIQUE (member_id, committee_name, role_title);
      END IF;
    END $$;
  `);

  // Konsistensi identitas proyek: backend & frontend memakai ID a000...,
  // sedangkan seed lama membuat b000... Salin data b000 ke a000 lalu hapus b000.
  await db.query(`
    INSERT INTO building_projects (
      id, project_name, category, target_budget, current_funds, start_date,
      target_completion_date, progress_percentage, status, description, pic_name, milestones
    )
    SELECT
      'a0000000-0000-0000-0000-000000000001', project_name, category, target_budget, current_funds,
      start_date, target_completion_date, progress_percentage, status, description, pic_name, milestones
    FROM building_projects
    WHERE id = 'b0000000-0000-0000-0000-000000000001'
    ON CONFLICT (id) DO NOTHING;

    -- Pindahkan pledge & transaksi yang menunjuk ke b000 agar ikut konsisten
    UPDATE pledges SET building_project_id = 'a0000000-0000-0000-0000-000000000001'
    WHERE building_project_id = 'b0000000-0000-0000-0000-000000000001';

    DELETE FROM building_projects WHERE id = 'b0000000-0000-0000-0000-000000000001';
  `);

  // Pre-migration cleanup: asset_loans.request_code kini punya unique index parsial
  // di schema.sql. Duplikat yang sudah terlanjur tersimpan harus dibersihkan
  // lebih dulu, karena cepat atau lambat migration akan gagal di UNIQUE.
  console.log('[Migration] Cleaning up duplicate asset loan request codes...');
  await db.query(`
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY request_code
               ORDER BY created_at ASC NULLS LAST, id ASC
             ) AS rn
      FROM asset_loans
      WHERE request_code IS NOT NULL AND request_code <> ''
    )
    UPDATE asset_loans a
    SET request_code = a.request_code || '-DUP-' || a.id::text
    FROM ranked r
    WHERE a.id = r.id AND r.rn > 1;
  `);

  // Invarian stok aset: available_quantity harus >= 0 dan <= quantity.
  // Tabel yang sudah ada sebelum constraint ini belum punya CHECK, jadi data
  // yang melanggar dibetulkan lebih dulu, lalu constraint ditambahkan idempotent.
  console.log('[Migration] Enforcing asset stock invariants...');
  await db.query(`
    UPDATE assets
    SET available_quantity = 0
    WHERE available_quantity IS NOT NULL AND available_quantity < 0;

    UPDATE assets
    SET available_quantity = quantity
    WHERE available_quantity IS NOT NULL
      AND quantity IS NOT NULL
      AND available_quantity > quantity;
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_quantity_positive'
      ) THEN
        ALTER TABLE assets
          ADD CONSTRAINT chk_assets_quantity_positive
          CHECK (quantity IS NULL OR quantity >= 0);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_available_non_negative'
      ) THEN
        ALTER TABLE assets
          ADD CONSTRAINT chk_assets_available_non_negative
          CHECK (available_quantity IS NULL OR available_quantity >= 0);
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_available_within_quantity'
      ) THEN
        ALTER TABLE assets
          ADD CONSTRAINT chk_assets_available_within_quantity
          CHECK (
            available_quantity IS NULL
            OR quantity IS NULL
            OR available_quantity <= quantity
          );
      END IF;
    END $$;
  `);

  // Enforce enum status CHECK constraints on assets and asset_loans
  console.log('[Migration] Enforcing enum status CHECK constraints on assets and asset_loans...');
  await db.query(`
    UPDATE assets
    SET borrow_status = 'AVAILABLE'
    WHERE borrow_status IS NOT NULL AND borrow_status NOT IN ('AVAILABLE', 'BORROWED', 'RENTED', 'MAINTENANCE');

    UPDATE assets
    SET physical_condition = 'GOOD'
    WHERE physical_condition IS NOT NULL AND physical_condition NOT IN ('GOOD', 'NEED_REPAIR', 'BROKEN');

    UPDATE asset_loans
    SET status = 'PENDING'
    WHERE status IS NOT NULL AND status NOT IN ('PENDING', 'APPROVED', 'ACTIVE', 'RETURNED', 'REJECTED');

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_physical_condition'
      ) THEN
        ALTER TABLE assets
          ADD CONSTRAINT chk_assets_physical_condition
          CHECK (physical_condition IS NULL OR physical_condition IN ('GOOD', 'NEED_REPAIR', 'BROKEN'));
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assets_borrow_status'
      ) THEN
        ALTER TABLE assets
          ADD CONSTRAINT chk_assets_borrow_status
          CHECK (borrow_status IS NULL OR borrow_status IN ('AVAILABLE', 'BORROWED', 'RENTED', 'MAINTENANCE'));
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_asset_loans_status'
      ) THEN
        ALTER TABLE asset_loans
          ADD CONSTRAINT chk_asset_loans_status
          CHECK (status IS NULL OR status IN ('PENDING', 'APPROVED', 'ACTIVE', 'RETURNED', 'REJECTED'));
      END IF;
    END $$;
  `);

  // Modul baru AUDIT_LOGS harus punya baris role_permissions untuk setiap role
  // yang sudah ada. Default non-aktif: administrator yang memberikan modul ini
  // secara eksplisit lewat halaman Hak Akses. SUPER_ADMIN tidak memerlukan baris
  // ini karena middleware memperlakukannya sebagai akses penuh.
  console.log('[Migration] Seeding role_permissions for AUDIT_LOGS module...');
  await db.query(`
    INSERT INTO role_permissions (role_id, module_key, can_access, updated_at)
    SELECT r.id, 'AUDIT_LOGS', false, CURRENT_TIMESTAMP
    FROM roles r
    WHERE r.id NOT IN ('ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA')
      AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.role_id = r.id AND rp.module_key = 'AUDIT_LOGS'
      )
    ON CONFLICT (role_id, module_key) DO NOTHING;
  `);

  console.log('[Migration] Database tables, columns, and indexes verified successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase()
    .then(async () => {
      console.log('[Migration] Finished successfully.');
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Migration Error]', err);
      await pool.end();
      process.exit(1);
    });
}
