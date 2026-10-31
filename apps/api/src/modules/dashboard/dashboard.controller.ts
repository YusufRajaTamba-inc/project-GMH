import { Request, Response } from 'express';
import { db } from '../../config/db.js';

export const getDashboardSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Member stats and yearly registration history
    const [memCountRes, memberGrowthRes] = await Promise.all([
      db.query(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
          COUNT(*) FILTER (WHERE member_type = 'ALUMNI')::int AS alumni,
          COUNT(*) FILTER (WHERE member_type = 'MAHASISWA')::int AS students
         FROM members`
      ),
      db.query(
        `SELECT EXTRACT(YEAR FROM created_at)::int AS year, COUNT(*)::int AS count
         FROM members
         WHERE created_at >= date_trunc('year', CURRENT_DATE) - INTERVAL '4 years'
         GROUP BY EXTRACT(YEAR FROM created_at)
         ORDER BY year`
      ),
    ]);

    // 2. Building project stats
    const bpRes = await db.query(
      `SELECT target_budget, current_funds,
              CASE WHEN target_budget > 0 THEN ROUND(current_funds * 100 / target_budget)::int ELSE 0 END AS progress_percentage
       FROM building_projects
       ORDER BY start_date NULLS LAST
       LIMIT 1`
    );
    const bp = bpRes.rows[0] || { target_budget: 0, current_funds: 0, progress_percentage: 0 };

    // 3. Current-month finance totals and monthly trend
    const [finRes, financeTrendRes] = await Promise.all([
      db.query(
        `SELECT
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'INCOME'), 0)::numeric AS total_income,
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'EXPENSE'), 0)::numeric AS total_expense
         FROM financial_transactions
         WHERE transaction_date >= date_trunc('month', CURRENT_DATE)
           AND transaction_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`
      ),
      db.query(
        `SELECT TO_CHAR(month_start, 'YYYY-MM') AS month,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'INCOME'), 0)::numeric AS income,
                COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'EXPENSE'), 0)::numeric AS expense
         FROM generate_series(
           date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
           date_trunc('month', CURRENT_DATE),
           INTERVAL '1 month'
         ) AS month_start
         LEFT JOIN financial_transactions
           ON transaction_date >= month_start
          AND transaction_date < month_start + INTERVAL '1 month'
         GROUP BY month_start
         ORDER BY month_start`
      ),
    ]);

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

    const memberGrowth = Array.from({ length: 5 }, (_, index) => {
      const year = new Date().getFullYear() - 4 + index;
      const row = memberGrowthRes.rows.find((item: any) => Number(item.year) === year);
      return { year, count: Number(row?.count ?? 0) };
    });
    const financeTrend = financeTrendRes.rows;

    res.status(200).json({
      success: true,
      stats,
      pastoralCare,
      memberGrowth,
      financeTrend,
      data: {
        stats,
        pastoralCare,
        memberGrowth,
        financeTrend,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan dashboard.', error: err.message });
  }
};
