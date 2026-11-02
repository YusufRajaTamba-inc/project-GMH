import { db } from '../../config/db.js';
import { query, queryOne } from '../../shared/sql.js';
import { HttpError } from '../../shared/httpError.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { formatPaginationMeta } from '../../utils/pagination.js';
import { ListStaffQueryInput } from './payroll.schema.js';

export async function getStaffList(filters: ListStaffQueryInput) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 10));
  const offset = (page - 1) * limit;
  const cursor = filters.cursor;

  let whereClause = ` WHERE sm.is_active = TRUE`;
  const params: any[] = [];

  if (cursor) {
    params.push(cursor);
    whereClause += ` AND m.full_name > $${params.length}`;
  }

  const countRes = await query<{ total: number }>(
    `SELECT COUNT(*)::int as total
     FROM staff_members sm
     JOIN members m ON sm.member_id = m.id
     ${whereClause}`,
    params
  );
  const total = countRes.rows[0]?.total || 0;

  let dataQuery = `
    SELECT 
      sm.id, sm.position_title, sm.employment_type, sm.base_salary,
      sm.bank_name, sm.bank_account_number, sm.bank_account_holder,
      sm.joined_date, sm.is_active,
      m.full_name, m.member_number, m.phone_number, m.email,
      d.name as department_name
     FROM staff_members sm
     JOIN members m ON sm.member_id = m.id
     JOIN departments d ON sm.department_id = d.id
     ${whereClause}
     ORDER BY m.full_name ASC
  `;
  const dataParams = [...params];

  if (!cursor) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  } else {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
  }

  const result = await query(dataQuery, dataParams);
  const pagination = formatPaginationMeta(result.rows, total, page, limit, 'full_name');

  return {
    count: result.rows.length,
    staff: result.rows,
    data: result.rows,
    pagination,
  };
}

export async function getPayrollRecords(
  periodId: string,
  paginationOpts: { page?: number; limit?: number; cursor?: string }
) {
  const period = periodId || '2026-10';
  const page = Math.max(1, paginationOpts.page || 1);
  const limit = Math.min(100, Math.max(1, paginationOpts.limit || 10));
  const offset = (page - 1) * limit;
  const cursor = paginationOpts.cursor;

  const periodRes = await queryOne(`SELECT * FROM payroll_periods WHERE id = $1`, [period]);

  let whereClause = ` WHERE pr.payroll_period_id = $1`;
  const params: any[] = [period];

  if (cursor) {
    params.push(cursor);
    whereClause += ` AND m.full_name > $${params.length}`;
  }

  const sumRes = await query<{
    total: number;
    total_base: string;
    total_allowance: string;
    total_deduction: string;
    total_net: string;
  }>(
    `SELECT 
      COUNT(*)::int as total,
      COALESCE(SUM(pr.base_salary), 0) as total_base,
      COALESCE(SUM(pr.total_allowance), 0) as total_allowance,
      COALESCE(SUM(pr.total_deduction), 0) as total_deduction,
      COALESCE(SUM(pr.net_salary), 0) as total_net
     FROM payroll_records pr
     JOIN staff_members sm ON pr.staff_id = sm.id
     JOIN members m ON sm.member_id = m.id
     ${whereClause}`,
    params
  );

  const total = sumRes.rows[0]?.total || 0;
  const totalBase = parseFloat(sumRes.rows[0]?.total_base || '0');
  const totalAllowance = parseFloat(sumRes.rows[0]?.total_allowance || '0');
  const totalDeduction = parseFloat(sumRes.rows[0]?.total_deduction || '0');
  const totalNet = parseFloat(sumRes.rows[0]?.total_net || '0');

  let dataQuery = `
    SELECT 
      pr.*,
      m.full_name, m.member_number,
      sm.position_title, sm.bank_name, sm.bank_account_number,
      d.name as department_name
     FROM payroll_records pr
     JOIN staff_members sm ON pr.staff_id = sm.id
     JOIN members m ON sm.member_id = m.id
     JOIN departments d ON sm.department_id = d.id
     ${whereClause}
     ORDER BY m.full_name ASC
  `;
  const dataParams = [...params];

  if (!cursor) {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
    dataParams.push(offset);
    dataQuery += ` OFFSET $${dataParams.length}`;
  } else {
    dataParams.push(limit);
    dataQuery += ` LIMIT $${dataParams.length}`;
  }

  const recordsRes = await query(dataQuery, dataParams);
  const pagination = formatPaginationMeta(recordsRes.rows, total, page, limit, 'full_name');

  return {
    period: periodRes || { id: period, is_closed: false },
    summary: {
      staffCount: total,
      totalBase,
      totalAllowance,
      totalDeduction,
      totalNetSalary: totalNet,
    },
    records: recordsRes.rows,
    data: recordsRes.rows,
    pagination,
  };
}

export async function generateDraft(periodId: string, actorUserId?: string | null) {
  const period = periodId || '2026-10';
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO payroll_periods (id, start_date, end_date, is_closed, processed_by)
       VALUES ($1, $2, $3, FALSE, $4)
       ON CONFLICT (id) DO NOTHING`,
      [period, `${period}-01`, `${period}-28`, actorUserId]
    );

    const staffRes = await client.query(
      `SELECT id, base_salary, employment_type FROM staff_members WHERE is_active = TRUE`
    );

    for (const s of staffRes.rows) {
      const base = parseFloat(s.base_salary);
      const missionAllowance = s.employment_type === 'MISSIONARY' ? 750000 : 0;
      const transportAllowance = 300000;
      const totalAllowance = missionAllowance + transportAllowance;
      const bpjsDeduction = 100000;
      const netSalary = base + totalAllowance - bpjsDeduction;

      await client.query(
        `INSERT INTO payroll_records (
          payroll_period_id, staff_id, base_salary,
          allowances, total_allowance, deductions, total_deduction,
          net_salary, payment_status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9)
        ON CONFLICT (payroll_period_id, staff_id) DO NOTHING`,
        [
          period,
          s.id,
          base,
          JSON.stringify({ tunjangan_misi: missionAllowance, transport: transportAllowance }),
          totalAllowance,
          JSON.stringify({ bpjs: bpjsDeduction }),
          bpjsDeduction,
          netSalary,
          actorUserId,
        ]
      );
    }

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'INSERT', 'payroll_records', period, null, { period });

    return {
      period,
      count: staffRes.rows.length,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function disbursePayroll(periodId: string, actorUserId?: string | null) {
  const period = periodId || '2026-10';
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const sumRes = await client.query(
      `SELECT SUM(net_salary)::numeric as total_payout, COUNT(*)::int as staff_count
       FROM payroll_records
       WHERE payroll_period_id = $1 AND payment_status = 'PENDING'`,
      [period]
    );

    const totalPayout = parseFloat(sumRes.rows[0]?.total_payout || '0');
    const staffCount = sumRes.rows[0]?.staff_count || 0;

    if (totalPayout <= 0) {
      throw HttpError.badRequest('Tidak ada pembayaran tertunda pada periode ini.');
    }

    await client.query(
      `UPDATE payroll_records
       SET payment_status = 'TRANSFERRED', payment_date = CURRENT_TIMESTAMP
       WHERE payroll_period_id = $1`,
      [period]
    );

    await client.query(
      `UPDATE payroll_periods
       SET is_closed = TRUE, processed_by = $1
       WHERE id = $2`,
      [actorUserId, period]
    );

    const txCode = `PAY-GMH-${period.replace('-', '')}`;
    const today = new Date().toISOString().split('T')[0];

    await client.query(
      `INSERT INTO financial_transactions (
        transaction_code, transaction_date, transaction_type,
        account_id, amount, payment_method, scope, notes, recorded_by
      ) VALUES ($1, $2, 'EXPENSE', '5-1010', $3, 'BANK_TRANSFER', 'YAYASAN_PUSAT', $4, $5)
      ON CONFLICT (transaction_code) DO NOTHING`,
      [
        txCode,
        today,
        totalPayout,
        `Pengeluaran Beban Gaji Staf Yayasan & Misionaris Periode ${period} (${staffCount} orang)`,
        actorUserId,
      ]
    );

    await client.query('COMMIT');

    await logAudit(actorUserId || null, 'PAYROLL_DISBURSE', 'payroll_records', period, null, {
      totalPayout,
      staffCount,
      txCode,
    });

    return {
      period,
      staffCount,
      totalPayout,
      transactionCode: txCode,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
