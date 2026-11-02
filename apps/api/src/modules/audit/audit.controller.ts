import { Request, Response } from 'express';
import { db } from '../../config/db.js';

// ============================================================================
// AUDIT LOG — Jejak Aktivitas Seluruh Modul Sistem
// Sumber data: tabel `audit_logs` (lihat apps/api/src/database/schema.sql)
// Diisi otomatis oleh logAudit() pada middleware/audit.interceptor.ts
// ============================================================================

/**
 * Daftar entitas yang dikenal agar label pada UI tidak menampilkan
 * jargon teknis mentah (nama tabel internal).
 */
const ENTITY_LABELS: Record<string, string> = {
  members: 'Data Anggota & Alumni',
  member_registrations: 'Pendaftaran Anggota',
  financial_transactions: 'Transaksi Keuangan',
  chart_of_accounts: 'Daftar Akun Kas',
  finance_budget: 'Anggaran Keuangan',
  pledges: 'Janji Iman & Donasi',
  mission_activities: 'Pelayanan Misi',
  foundation_programs: 'Program & Persekutuan',
  roles: 'Peran Pengguna',
  role_permissions: 'Hak Akses Peran',
  users: 'Data Pengguna',
  assets: 'Inventaris & Aset',
  asset_loans: 'Pinjaman Aset',
  secretariat_outgoing: 'Surat Keluar',
  secretariat_incoming: 'Surat Masuk',
  prayer_requests: 'Permohonan Doa',
  building_projects: 'Proyek Yayasan',
  staff_members: 'Staf Yayasan',
  committee_records: 'Kepanitiaan',
  division_members: 'Divisi Pelayanan',
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      action,
      entity,
      operator,
      dateFrom,
      dateTo,
      page = '1',
      limit = '50',
    } = req.query;

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      where.push(
        `(a.action ILIKE ${p} OR a.entity_name ILIKE ${p} OR a.entity_id ILIKE ${p} ` +
          `OR COALESCE(u.full_name, '') ILIKE ${p} OR COALESCE(u.username, '') ILIKE ${p} ` +
          `OR COALESCE(a.old_values::text, '') ILIKE ${p} OR COALESCE(a.new_values::text, '') ILIKE ${p})`
      );
    }

    if (action && action !== 'ALL') {
      params.push(action);
      where.push(`a.action = $${params.length}`);
    }

    if (entity && entity !== 'ALL') {
      params.push(entity);
      where.push(`a.entity_name = $${params.length}`);
    }

    if (operator && operator !== 'ALL') {
      params.push(operator);
      where.push(`a.user_id = $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      where.push(`a.created_at >= $${params.length}`);
    }

    if (dateTo) {
      params.push(dateTo);
      where.push(`a.created_at <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
    const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const [rowsRes, countRes, entityRes, operatorRes] = await Promise.all([
      db.query(
        `SELECT a.id, a.user_id, a.action, a.entity_name, a.entity_id,
                a.old_values, a.new_values, a.ip_address, a.user_agent, a.created_at,
                COALESCE(u.full_name, 'Sistem Otomatis') AS operator_name,
                COALESCE(u.username, '') AS operator_username,
                COALESCE(u.role_id, 'SYSTEM') AS operator_role
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ${whereSql}
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, safeLimit, offset]
      ),
      db.query(
        `SELECT COUNT(*)::int AS total FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${whereSql}`,
        params
      ),
      db.query(
        `SELECT entity_name, COUNT(*)::int AS total
         FROM audit_logs
         GROUP BY entity_name
         ORDER BY total DESC`
      ),
      db.query(
        `SELECT u.id, u.full_name, u.role_id, COUNT(a.id)::int AS total
         FROM audit_logs a
         JOIN users u ON a.user_id = u.id
         GROUP BY u.id, u.full_name, u.role_id
         ORDER BY total DESC`
      ),
    ]);

    const logs = rowsRes.rows.map((r: any) => ({
      id: r.id,
      action: r.action,
      entityName: r.entity_name,
      entityLabel: ENTITY_LABELS[r.entity_name] || r.entity_name,
      entityId: r.entity_id,
      oldValues: r.old_values,
      newValues: r.new_values,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      createdAt: r.created_at,
      operatorName: r.operator_name,
      operatorUsername: r.operator_username,
      operatorRole: r.operator_role,
    }));

    res.status(200).json({
      success: true,
      count: logs.length,
      total: countRes.rows[0]?.total ?? 0,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(Math.ceil((countRes.rows[0]?.total ?? 0) / safeLimit), 1),
      logs,
      entities: entityRes.rows.map((e: any) => ({
        key: e.entity_name,
        label: ENTITY_LABELS[e.entity_name] || e.entity_name,
        total: e.total,
      })),
      operators: operatorRes.rows.map((o: any) => ({
        id: o.id,
        name: o.full_name,
        role: o.role_id,
        total: o.total,
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat jejak audit sistem.',
      error: err.message,
    });
  }
};
