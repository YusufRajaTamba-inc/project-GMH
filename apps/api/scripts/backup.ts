import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(apiDir, '.env') });

const backupDir = path.join(apiDir, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backupFile = path.join(backupDir, `gmh_backup_${timestamp}.sql`);

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5432';
const database = process.env.DB_NAME || 'gmh_database';
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';

console.log(`[Backup] Starting PostgreSQL backup for database '${database}' on ${host}:${port}...`);
console.log(`[Backup] Destination: ${backupFile}`);

const pgDumpEnv = { ...process.env, PGPASSWORD: password };
const args = ['-h', host, '-p', port, '-U', user, '-d', database, '-F', 'p', '-b', '-f', backupFile];

const child = spawn('pg_dump', args, { env: pgDumpEnv, stdio: 'inherit' });

child.on('error', (err) => {
  console.error('[Backup] Failed to run pg_dump. Make sure pg_dump is installed and added to system PATH.');
  console.error('[Backup] Error details:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    const stats = fs.statSync(backupFile);
    console.log(`[Backup] Backup succeeded! File size: ${(stats.size / 1024).toFixed(2)} KB`);

    // Prune backups older than 7 days
    const retentionMs = 7 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(backupDir);
    for (const f of files) {
      if (f.startsWith('gmh_backup_') && f.endsWith('.sql')) {
        const filePath = path.join(backupDir, f);
        const fStats = fs.statSync(filePath);
        if (now.getTime() - fStats.mtime.getTime() > retentionMs) {
          console.log(`[Backup] Removing expired backup: ${f}`);
          fs.unlinkSync(filePath);
        }
      }
    }
  } else {
    console.error(`[Backup] pg_dump exited with error code ${code}`);
    process.exit(code);
  }
});
