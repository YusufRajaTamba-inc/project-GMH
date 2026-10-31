import { Request, Response } from 'express';
import { db } from '../../config/db.js';
import { logAudit } from '../../middleware/audit.interceptor.js';
import { parsePagination, formatPaginationMeta } from '../../utils/pagination.js';

export const getStaffList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    let whereClause = ` WHERE sm.is_active = TRUE`;
    const params: any[] = [];

    if (cursor) {
      params.push(cursor);
      whereClause += ` AND m.full_name > $${params.length}`;
    }

    // 1. Total staff
    const countRes = await db.query(
      `SELECT COUNT(*)::int as total
       FROM staff_members sm
       JOIN members m ON sm.member_id = m.id
       ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // 2. Paginated staff
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

    const result = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(result.rows, total, page, limit, 'full_name');

    res.status(200).json({
      success: true,
      count: result.rows.length,
      staff: result.rows,
      data: result.rows,
      pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data staf penggajian.', error: err.message });
  }
};

export const getPayrollRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = (req.params.periodId || '2026-10').trim();
    const { page, limit, offset, cursor } = parsePagination(req, { defaultLimit: 10, maxLimit: 100 });

    const periodRes = await db.query(`SELECT * FROM payroll_periods WHERE id = $1`, [period]);

    let whereClause = ` WHERE pr.payroll_period_id = $1`;
    const params: any[] = [period];

    if (cursor) {
      params.push(cursor);
      whereClause += ` AND m.full_name > $${params.length}`;
    }

    // 1. Calculate summary aggregates and row count directly in database engine
    const sumRes = await db.query(
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

    // 2. Query paginated records
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

    const recordsRes = await db.query(dataQuery, dataParams);
    const pagination = formatPaginationMeta(recordsRes.rows, total, page, limit, 'full_name');

    res.status(200).json({
      success: true,
      period: periodRes.rows[0] || { id: period, is_closed: false },
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
    });


  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memuat rekapitulasi penggajian.', error: err.message });
  }
};

// Flow 4: Generate Draft Payroll
export const generateDraft = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { periodId } = req.body;
    const period = periodId || '2026-10';

    await client.query('BEGIN');

    // Create payroll_periods record if not exists
    await client.query(
      `INSERT INTO payroll_periods (id, start_date, end_date, is_closed, processed_by)
       VALUES ($1, $2, $3, FALSE, $4)
       ON CONFLICT (id) DO NOTHING`,
      [period, `${period}-01`, `${period}-28`, req.user?.id]
    );

    // Query active staff
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
          req.user?.id,
        ]
      );
    }

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'INSERT', 'payroll_records', period, null, { period });

    res.status(201).json({
      success: true,
      message: `Draft penggajian periode ${period} berhasil di-generate untuk ${staffRes.rows.length} staf/misionaris.`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal membuat draft payroll.', error: err.message });
  } finally {
    client.release();
  }
};

// Flow 4: Disburse Payroll & Automatically Post to General Ledger
export const disbursePayroll = async (req: Request, res: Response): Promise<void> => {
  const client = await db.getClient();
  try {
    const { periodId } = req.body;
    const period = periodId || '2026-10';

    await client.query('BEGIN');

    // 1. Get total net salary for the period
    const sumRes = await client.query(
      `SELECT SUM(net_salary)::numeric as total_payout, COUNT(*)::int as staff_count
       FROM payroll_records
       WHERE payroll_period_id = $1 AND payment_status = 'PENDING'`,
      [period]
    );

    const totalPayout = parseFloat(sumRes.rows[0]?.total_payout || '0');
    const staffCount = sumRes.rows[0]?.staff_count || 0;

    if (totalPayout <= 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Tidak ada pembayaran tertunda pada periode ini.' });
      return;
    }

    // 2. Mark records as TRANSFERRED
    await client.query(
      `UPDATE payroll_records
       SET payment_status = 'TRANSFERRED', payment_date = CURRENT_TIMESTAMP
       WHERE payroll_period_id = $1`,
      [period]
    );

    // 3. Mark period as closed
    await client.query(
      `UPDATE payroll_periods
       SET is_closed = TRUE, processed_by = $1
       WHERE id = $2`,
      [req.user?.id, period]
    );

    // 4. Automatically Post Expense Transaction to General Ledger (Flow 4, Step 2)
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
        req.user?.id,
      ]
    );

    await client.query('COMMIT');

    await logAudit(req.user?.id || null, 'PAYROLL_DISBURSE', 'payroll_records', period, null, {
      totalPayout,
      staffCount,
      txCode,
    });

    res.status(200).json({
      success: true,
      message: `Finalisasi penggajian periode ${period} berhasil! Total Rp ${totalPayout.toLocaleString('id-ID')} telah diposting otomatis ke buku kas yayasan.`,
      disbursement: {
        period,
        staffCount,
        totalPayout,
        transactionCode: txCode,
      },
    });

  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Gagal memproses finalisasi transfer penggajian.', error: err.message });
  } finally {
    client.release();
  }
};
