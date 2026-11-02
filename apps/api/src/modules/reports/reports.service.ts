import { query } from '../../shared/sql.js';
import { ConsolidatedReportQueryInput } from './reports.schema.js';

export async function getConsolidatedReport(filters: ConsolidatedReportQueryInput) {
  const yearValue = filters.year || new Date().getFullYear();
  const startDate = `${yearValue}-01-01`;
  const endDate = `${yearValue + 1}-01-01`;

  const [finance, faculties, cities, monthly, accounts, transactions, memberStats] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'INCOME'), 0)::numeric AS total_income,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'EXPENSE'), 0)::numeric AS total_expense,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'INCOME' AND (ft.pledge_id IS NOT NULL OR LOWER(coa.account_name) LIKE '%donasi%' OR LOWER(coa.account_name) LIKE '%janji%')), 0)::numeric AS donations,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'EXPENSE' AND ft.scope = 'OPERASIONAL'), 0)::numeric AS operational_expense,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'INCOME' AND ft.pledge_id IS NOT NULL), 0)::numeric AS building_income,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.scope = 'OPERASIONAL'), 0)::numeric AS operational_net
      FROM financial_transactions ft JOIN chart_of_accounts coa ON coa.id = ft.account_id
      WHERE ft.transaction_date >= $1 AND ft.transaction_date < $2`,
      [startDate, endDate]
    ),
    query(
      `SELECT COALESCE(ap.faculty, 'Belum diisi') AS name, COUNT(*)::int AS count
       FROM members m LEFT JOIN alumni_profiles ap ON ap.member_id = m.id
       WHERE m.status = 'ACTIVE' AND m.member_type = 'ALUMNI'
       GROUP BY COALESCE(ap.faculty, 'Belum diisi') ORDER BY count DESC, name LIMIT 12`
    ),
    query(
      `SELECT COALESCE(NULLIF(BTRIM(m.city), ''), 'Belum diisi') AS name, COUNT(*)::int AS value
       FROM members m WHERE m.status = 'ACTIVE'
       GROUP BY COALESCE(NULLIF(BTRIM(m.city), ''), 'Belum diisi') ORDER BY value DESC, name LIMIT 8`
    ),
    query(
      `SELECT TO_CHAR(months.month_start, 'YYYY-MM') AS month,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'INCOME'), 0)::numeric AS income,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'EXPENSE'), 0)::numeric AS expense
       FROM generate_series($1::date, ($2::date - INTERVAL '1 month'), INTERVAL '1 month') AS months(month_start)
       LEFT JOIN financial_transactions ft ON ft.transaction_date >= months.month_start AND ft.transaction_date < months.month_start + INTERVAL '1 month'
       GROUP BY months.month_start ORDER BY months.month_start`,
      [startDate, endDate]
    ),
    query(
      `SELECT coa.id, coa.account_name, coa.account_type, coa.scope,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'INCOME'), 0)::numeric AS income,
        COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type = 'EXPENSE'), 0)::numeric AS expense
       FROM chart_of_accounts coa LEFT JOIN financial_transactions ft ON ft.account_id = coa.id AND ft.transaction_date >= $1 AND ft.transaction_date < $2
       GROUP BY coa.id, coa.account_name, coa.account_type, coa.scope ORDER BY coa.scope, coa.account_type, coa.account_name`,
      [startDate, endDate]
    ),
    query(
      `SELECT ft.transaction_date, ft.transaction_code, ft.transaction_type, ft.scope, coa.account_name, ft.amount, ft.notes, m.full_name AS donor_name
       FROM financial_transactions ft JOIN chart_of_accounts coa ON coa.id = ft.account_id
       LEFT JOIN members m ON m.id = ft.donor_member_id
       WHERE ft.transaction_date >= $1 AND ft.transaction_date < $2
       ORDER BY ft.transaction_date DESC, ft.created_at DESC LIMIT 100`,
      [startDate, endDate]
    ),
    query(
      `SELECT COUNT(*) FILTER (WHERE m.status = 'ACTIVE')::int AS active_members,
        COUNT(*) FILTER (WHERE m.status = 'ACTIVE' AND m.member_type = 'ALUMNI')::int AS alumni,
        COUNT(*) FILTER (WHERE m.status = 'ACTIVE' AND m.member_type = 'MAHASISWA')::int AS students,
        COUNT(*) FILTER (WHERE m.created_at >= $1 AND m.created_at < $2)::int AS new_members,
        COUNT(*) FILTER (WHERE m.status <> 'ACTIVE')::int AS inactive_members FROM members m`,
      [startDate, endDate]
    ),
  ]);

  const totals = finance.rows[0];

  return {
    year: yearValue,
    finance: {
      totalIncome: Number(totals.total_income),
      totalExpense: Number(totals.total_expense),
      net: Number(totals.total_income) - Number(totals.total_expense),
      donations: Number(totals.donations),
      operationalExpense: Number(totals.operational_expense),
      buildingIncome: Number(totals.building_income),
      operationalNet: Number(totals.operational_net),
    },
    members: memberStats.rows[0],
    faculties: faculties.rows,
    cities: cities.rows,
    monthly: monthly.rows,
    accounts: accounts.rows,
    transactions: transactions.rows,
  };
}
