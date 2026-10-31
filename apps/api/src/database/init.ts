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
