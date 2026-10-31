import { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.js';

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
  } catch (err: any) {
    console.error('[Audit Logger Error]', err.message);
  }
}
