import { Request, Response } from 'express';
import { db } from '../../config/db.js';

export const getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Member stats
    const memCountRes = await db.query(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::int as active,
        COUNT(CASE WHEN member_type = 'ALUMNI' THEN 1 END)::int as alumni,
        COUNT(CASE WHEN member_type = 'MAHASISWA' THEN 1 END)::int as students
       FROM members`
    );

    // 2. Building project stats
    const bpRes = await db.query(
      `SELECT target_budget, current_funds, progress_percentage FROM building_projects LIMIT 1`
    );
    const bp = bpRes.rows[0] || { target_budget: 1800000000, current_funds: 1224000000, progress_percentage: 78 };

    // 3. Operational Finance summary (current month)
    const finRes = await db.query(
      `SELECT 
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END)::numeric as total_income,
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END)::numeric as total_expense
       FROM financial_transactions`
    );

    // 4. Upcoming Birthdays (Current month)
    const bdayRes = await db.query(
      `SELECT id, full_name, member_number, birth_date, phone_number
       FROM members
       WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       ORDER BY EXTRACT(DAY FROM birth_date) ASC
       LIMIT 10`
    );

    // 5. Upcoming Wedding Anniversaries (Current month)
    const annivRes = await db.query(
      `SELECT id, full_name, member_number, wedding_date, phone_number
       FROM members
       WHERE wedding_date IS NOT NULL 
         AND EXTRACT(MONTH FROM wedding_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       ORDER BY EXTRACT(DAY FROM wedding_date) ASC
       LIMIT 10`
    );

    // 6. Pending Registrations
    const regRes = await db.query(
      `SELECT COUNT(*)::int as pending_count FROM member_registrations WHERE status = 'PENDING'`
    );

    const stats = {
      members: memCountRes.rows[0],
      building: {
        target: parseFloat(bp.target_budget),
        collected: parseFloat(bp.current_funds),
        percentage: bp.progress_percentage,
      },
      finance: {
        income: parseFloat(finRes.rows[0]?.total_income || '0'),
        expense: parseFloat(finRes.rows[0]?.total_expense || '0'),
        balance: parseFloat(finRes.rows[0]?.total_income || '0') - parseFloat(finRes.rows[0]?.total_expense || '0'),
      },
      pendingRegistrations: regRes.rows[0]?.pending_count || 0,
    };

    const pastoralCare = {
      upcomingBirthdays: bdayRes.rows,
      upcomingWeddingAnniversaries: annivRes.rows,
    };

    res.status(200).json({
      success: true,
      stats,
      pastoralCare,
      data: {
        stats,
        pastoralCare,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan dashboard.', error: err.message });
  }
};
