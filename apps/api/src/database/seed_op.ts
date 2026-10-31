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
  const userRes = await pool.query("SELECT id FROM users LIMIT 1");
  const userId = userRes.rows[0].id;

  // Check accounts
  const accRes = await pool.query("SELECT id FROM chart_of_accounts LIMIT 5");
  console.log("Available accounts:", accRes.rows.map(r => r.id));

  // Insert initial operational cash
  await pool.query(
    `INSERT INTO financial_transactions (
      transaction_code, transaction_date, transaction_type,
      account_id, amount, payment_method, scope, notes, recorded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (transaction_code) DO NOTHING`,
    [
      'TX-GMH-202610-000',
      '2026-10-01',
      'INCOME',
      '4-1010',
      15000000.00,
      'BANK_TRANSFER',
      'OPERASIONAL',
      'Pencairan Dana Kas Operasional Kantor Yayasan Bulan Oktober 2026',
      userId
    ]
  );
  console.log('Seeded operational initial cash successfully!');
  await pool.end();
}

run().catch(console.error);
