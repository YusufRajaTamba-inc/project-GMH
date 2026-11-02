import { db } from '../config/db.js';
import { logger } from '../shared/logger.js';

/**
 * Penulis audit trail (Fase 1 — Audit Infrastruktur).
 *
 * Kegagalan pencatatan audit tidak boleh menggagalkan operasi bisnis,
 * karena itu error ditelan dan hanya dicatat ke log terstruktur.
 */
export async function logAudit(
  userId: string | null,
  action: string,
  entityName: string,
  entityId: string | null,
  oldValues: any = null,
  newValues: any = null,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityName,
        entityId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err: unknown) {
    logger.error('Audit logger failed', {
      action,
      entityName,
      entityId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
