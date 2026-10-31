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
  console.log('[Migration] Database tables and indexes created successfully!');
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
