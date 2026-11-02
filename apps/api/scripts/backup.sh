#!/usr/bin/env bash
# ==============================================================================
# Global Mission House (GMH PA KMK) - Automated Database Backup Script
# Frequency: Scheduled Daily via Crontab (e.g. 02:00 AM)
# Retention: 7 Days local rotation + Ready for rsync / S3 offsite replication
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${API_DIR}/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/gmh_backup_${TIMESTAMP}.dump"
RETENTION_DAYS=7

# Load environment variables if .env exists
if [ -f "${API_DIR}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${API_DIR}/.env" | xargs -0)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gmh_database}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting GMH database backup..."
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Target: ${BACKUP_FILE}"

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F c -b -v -f "${BACKUP_FILE}"

FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed successfully! Size: ${FILE_SIZE}"

# Rotate backups older than RETENTION_DAYS
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "gmh_backup_*.dump" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

echo "[$(date +'%Y-%m-%d %H:%M:%S')] All done."
