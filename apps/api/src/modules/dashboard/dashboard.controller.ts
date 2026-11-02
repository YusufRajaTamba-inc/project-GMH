import { Request, Response } from 'express';
import { db } from '../../config/db.js';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const selectedProjectId = req.query.projectId as string | undefined;

    // 1. Member stats and yearly registration history
    const [memCountRes, memberGrowthRes, facultyDistRes] = await Promise.all([
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
      db.query(
        `SELECT COALESCE(NULLIF(TRIM(ap.faculty), ''), 'Lainnya') AS name, COUNT(*)::int AS value
         FROM members m
         LEFT JOIN alumni_profiles ap ON m.id = ap.member_id
         WHERE ap.faculty IS NOT NULL AND TRIM(ap.faculty) != ''
         GROUP BY COALESCE(NULLIF(TRIM(ap.faculty), ''), 'Lainnya')
         ORDER BY value DESC`
      ),
    ]);

    // 2. Dynamic Building projects
    const bpRes = await db.query(
      `SELECT id, project_name, category, 
              target_budget::numeric AS target_budget, 
              current_funds::numeric AS current_funds,
              CASE WHEN target_budget > 0 THEN ROUND((current_funds * 100.0) / target_budget, 1)::float ELSE 0 END AS progress_percentage,
              status, pic_name
       FROM building_projects
       ORDER BY CASE status WHEN 'ON_PROGRESS' THEN 1 WHEN 'PLANNING' THEN 2 ELSE 3 END, target_budget DESC, created_at ASC`
    );

    const allProjects = bpRes.rows;
    let selectedBp = allProjects[0];
    if (selectedProjectId) {
      const found = allProjects.find((p) => p.id === selectedProjectId);
      if (found) selectedBp = found;
    }

    const bp = selectedBp || {
      id: '',
      project_name: 'Pembangunan Rumah Persekutuan',
      target_budget: '0',
      current_funds: '0',
      progress_percentage: 0,
      status: 'PLANNING',
    };

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

    // 4. Monthly Ministry / Pelayanan Trend per Category (Real Data from foundation_programs & mission_activities)
    const ministryTrendRes = await db.query(`
      WITH months AS (
        SELECT TO_CHAR(m_date, 'YYYY-MM') AS month_key, m_date AS month_start
        FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') AS m_date
      ),
      prog_counts AS (
        SELECT
          TO_CHAR(event_datetime, 'YYYY-MM') AS month_key,
          COUNT(*) FILTER (WHERE program_category IN ('MISI', 'OUTREACH'))::int AS misi_programs,
          COUNT(*) FILTER (WHERE program_category IN ('PERSEKUTUAN_ALUMNI', 'FELLOWSHIP', 'IBADAH_RAYA', 'DOA_PUJIAN'))::int AS ibadah,
          COUNT(*) FILTER (WHERE program_category IN ('PEMBINAAN_KAMPUS', 'SEMINAR_YAYASAN', 'TRAINING', 'RETREAT_KAMP'))::int AS pembinaan,
          COUNT(*) FILTER (WHERE program_category NOT IN ('MISI', 'OUTREACH', 'PERSEKUTUAN_ALUMNI', 'FELLOWSHIP', 'IBADAH_RAYA', 'DOA_PUJIAN', 'PEMBINAAN_KAMPUS', 'SEMINAR_YAYASAN', 'TRAINING', 'RETREAT_KAMP'))::int AS lainnya
        FROM foundation_programs
        WHERE event_datetime >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY TO_CHAR(event_datetime, 'YYYY-MM')
      ),
      mission_counts AS (
        SELECT
          COALESCE(SUBSTRING(event_date FROM 1 FOR 7), TO_CHAR(created_at, 'YYYY-MM')) AS month_key,
          COUNT(*)::int AS missions_count
        FROM mission_activities
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
           OR (event_date IS NOT NULL AND event_date >= TO_CHAR(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', 'YYYY-MM-DD'))
        GROUP BY COALESCE(SUBSTRING(event_date FROM 1 FOR 7), TO_CHAR(created_at, 'YYYY-MM'))
      )
      SELECT
        m.month_key AS month,
        COALESCE(mc.missions_count, 0) + COALESCE(pc.misi_programs, 0) AS misi,
        COALESCE(pc.ibadah, 0) AS ibadah,
        COALESCE(pc.pembinaan, 0) AS pembinaan,
        COALESCE(pc.lainnya, 0) AS sosial,
        (COALESCE(mc.missions_count, 0) + COALESCE(pc.misi_programs, 0) + COALESCE(pc.ibadah, 0) + COALESCE(pc.pembinaan, 0) + COALESCE(pc.lainnya, 0)) AS total
      FROM months m
      LEFT JOIN prog_counts pc ON m.month_key = pc.month_key
      LEFT JOIN mission_counts mc ON m.month_key = mc.month_key
      ORDER BY m.month_start ASC
    `);

    // 5. Monthly Member Growth Trend (New Members & Registrations)
    const memberMonthlyRes = await db.query(`
      WITH months AS (
        SELECT TO_CHAR(m_date, 'YYYY-MM') AS month_key, m_date AS month_start
        FROM generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months', date_trunc('month', CURRENT_DATE), INTERVAL '1 month') AS m_date
      ),
      new_mems AS (
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month_key,
               COUNT(*)::int AS new_members,
               COUNT(*) FILTER (WHERE member_type = 'ALUMNI')::int AS alumni,
               COUNT(*) FILTER (WHERE member_type = 'MAHASISWA')::int AS students
        FROM members
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ),
      regs AS (
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month_key,
               COUNT(*)::int AS registrations
        FROM member_registrations
        WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      )
      SELECT
        m.month_key AS month,
        COALESCE(nm.new_members, 0) AS new_members,
        COALESCE(nm.alumni, 0) AS alumni,
        COALESCE(nm.students, 0) AS students,
        COALESCE(r.registrations, 0) AS registrations
      FROM months m
      LEFT JOIN new_mems nm ON m.month_key = nm.month_key
      LEFT JOIN regs r ON m.month_key = r.month_key
      ORDER BY m.month_start ASC
    `);

    // 6. Upcoming Birthdays & Anniversaries
    const [bdayRes, annivRes, regRes] = await Promise.all([
      db.query(
        `SELECT id, full_name, member_number, birth_date, phone_number
         FROM members
         WHERE EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         ORDER BY EXTRACT(DAY FROM birth_date) ASC
         LIMIT 10`
      ),
      db.query(
        `SELECT id, full_name, member_number, wedding_date, phone_number
         FROM members
         WHERE wedding_date IS NOT NULL 
           AND EXTRACT(MONTH FROM wedding_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         ORDER BY EXTRACT(DAY FROM wedding_date) ASC
         LIMIT 10`
      ),
      db.query(
        `SELECT COUNT(*)::int as pending_count FROM member_registrations WHERE status = 'PENDING'`
      ),
    ]);

    const totalActiveMembers = memCountRes.rows[0]?.active || 0;

    // Calculate cumulative active members for growth chart
    let runningTotal = Math.max(0, totalActiveMembers - memberMonthlyRes.rows.reduce((acc: number, r: any) => acc + Number(r.new_members), 0));
    const memberMonthlyGrowth = memberMonthlyRes.rows.map((row: any) => {
      runningTotal += Number(row.new_members);
      return {
        month: row.month,
        newMembers: Number(row.new_members),
        alumni: Number(row.alumni),
        students: Number(row.students),
        registrations: Number(row.registrations),
        totalAccumulated: runningTotal,
      };
    });

    const stats = {
      members: memCountRes.rows[0],
      building: {
        id: bp.id,
        projectName: bp.project_name || 'Dana Rumah Persekutuan',
        category: bp.category || 'INFRASTRUKTUR',
        target: parseFloat(bp.target_budget || '0'),
        collected: parseFloat(bp.current_funds || '0'),
        percentage: bp.progress_percentage || 0,
        status: bp.status,
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

    const payload = {
      stats,
      buildingProjects: allProjects,
      selectedProject: bp,
      ministryTrend: ministryTrendRes.rows,
      memberMonthlyGrowth,
      facultyDistribution: facultyDistRes.rows,
      pastoralCare,
      memberGrowth,
      financeTrend: financeTrendRes.rows,
    };

    res.status(200).json({
      success: true,
      ...payload,
      data: payload,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan dashboard.', error: err.message });
  }
};
