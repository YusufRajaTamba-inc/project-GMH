import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Users,
  Wallet,
  TrendingUp,
  Building2,
  Search,
  FileBarChart2,
  ArrowDownLeft,
  FileText,
  Landmark,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

interface ReportPayload {
  year: number;
  finance: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    donations: number;
    operationalExpense: number;
    buildingIncome: number;
    operationalNet: number;
  };
  members: {
    active_members: number;
    alumni: number;
    students: number;
    new_members: number;
    inactive_members: number;
  };
  faculties: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; value: number }>;
  monthly: Array<{ month: string; income: number; expense: number }>;
  accounts: Array<{
    id: string;
    account_name: string;
    account_type: string;
    scope: string;
    income: number;
    expense: number;
  }>;
  transactions: Array<{
    transaction_date: string;
    transaction_code: string;
    transaction_type: string;
    scope: string;
    account_name: string;
    amount: number;
    notes: string;
    donor_name?: string;
  }>;
}

const COLORS = ['#047857', '#0f172a', '#475569', '#0284c7', '#059669', '#64748b', '#0369a1', '#334155'];
const currency = (value: number) => formatRupiah(Number(value) || 0);
const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  background: '#ffffff',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
};

const ReportsPage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await api.reports.getConsolidated(year);
      setReport(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan dari database.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const exportCsv = (type: 'transactions' | 'accounts') => {
    if (!report) return;
    let rows: string[][] = [];

    if (type === 'transactions') {
      rows = [
        ['Laporan Rincian Transaksi GMH', String(year)],
        ['Total Penerimaan', String(report.finance.totalIncome)],
        ['Total Pengeluaran', String(report.finance.totalExpense)],
        ['Saldo Bersih', String(report.finance.net)],
        [],
        ['Tanggal', 'Kode Bukti', 'Jenis', 'Lingkup', 'Akun', 'Nominal', 'Pihak / Donatur', 'Catatan'],
        ...report.transactions.map((row) => [
          row.transaction_date,
          row.transaction_code,
          row.transaction_type,
          row.scope,
          row.account_name,
          String(row.amount),
          row.donor_name || '',
          row.notes || '',
        ]),
      ];
    } else {
      rows = [
        ['Laporan Ringkasan Akun Keuangan GMH', String(year)],
        [],
        ['Nama Akun', 'Lingkup Pembukuan', 'Klasifikasi', 'Total Penerimaan', 'Total Pengeluaran', 'Saldo Net'],
        ...report.accounts.map((acc) => [
          acc.account_name,
          acc.scope,
          acc.account_type,
          String(acc.income),
          String(acc.expense),
          String(Number(acc.income) - Number(acc.expense)),
        ]),
      ];
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `laporan-${type}-gmh-${year}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const monthLabel = (key: string) =>
    new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${key}-02T00:00:00`));

  return (
    <main style={{ display: 'grid', gap: 16, color: '#173c2b', maxWidth: 1280, margin: '0 auto' }}>
      {/* Top Header Bar */}
      <section
        style={{
          ...cardStyle,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 38,
              height: 38,
              borderRadius: 8,
              color: '#0f172a',
              background: '#f1f5f9',
            }}
          >
            <FileBarChart2 size={20} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Pusat Laporan & Evaluasi Yayasan</h2>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
              Konsolidasi data pembukuan keuangan, rekapitulasi anggota, dan demografi alumni PA KMK
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="report-year" style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>
              Tahun:
            </label>
            <select
              id="report-year"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              style={{
                padding: '6px 12px',
                border: '1px solid #dce6df',
                borderRadius: 7,
                background: '#fff',
                color: '#173c2b',
                fontWeight: 650,
                fontSize: 13,
                outline: 'none',
              }}
            >
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - i).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => void loadReport()}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, height: 32 }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Perbarui
          </button>
        </div>
      </section>


      {error && (
        <div
          role="alert"
          style={{
            padding: 12,
            borderRadius: 8,
            color: '#9d312d',
            background: '#fff1ef',
            border: '1px solid #f3d4d0',
            fontSize: 13,
          }}
        >
          Tidak dapat memuat laporan: {error}
        </div>
      )}

      {loading && !report && (
        <div style={{ ...cardStyle, padding: 32, textAlign: 'center', color: '#75877b', fontSize: 13 }}>
          Memuat data laporan sistem...
        </div>
      )}

      {report && (
        <Routes>
          <Route index element={<Navigate to="ringkasan" replace />} />

          {/* 1. Ringkasan Eksekutif */}
          <Route
            path="ringkasan"
            element={
              <section style={{ display: 'grid', gap: 16 }}>
                <section
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 14,
                  }}
                >
                  {[
                    {
                      label: 'Total Penerimaan',
                      value: currency(report.finance.totalIncome),
                      detail: `Tahun Pembukuan ${year}`,
                      icon: <TrendingUp size={16} />,
                      tag: 'Kas Masuk',
                      tagColor: '#047857',
                    },
                    {
                      label: 'Total Pengeluaran',
                      value: currency(report.finance.totalExpense),
                      detail: `Tahun Pembukuan ${year}`,
                      icon: <Wallet size={16} />,
                      tag: 'Kas Keluar',
                      tagColor: '#991b1b',
                    },
                    {
                      label: 'Saldo Bersih Kas & Bank',
                      value: currency(report.finance.net),
                      detail: 'Penerimaan dikurangi pengeluaran',
                      icon: <Building2 size={16} />,
                      tag: 'Net Buku',
                      tagColor: '#0f172a',
                    },
                    {
                      label: 'Total Anggota Aktif',
                      value: Number(report.members.active_members || 0).toLocaleString('id-ID'),
                      detail: 'Anggota terdaftar & terverifikasi',
                      icon: <Users size={16} />,
                      tag: 'Alumni & Binaan',
                      tagColor: '#0369a1',
                    },
                  ].map((item) => (
                    <article key={item.label} style={{ ...cardStyle, padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
                          {item.label}
                        </span>
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#475569',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {item.icon}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 750, fontSize: 22 }}>
                        {item.value}
                      </div>
                      <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 12 }}>{item.detail}</div>
                    </article>
                  ))}
                </section>

                <article style={cardStyle}>
                  <ReportTitle
                    title={`Grafik Arus Kas Bulanan · Tahun ${year}`}
                    subtitle="Perbandingan penerimaan donasi/janji iman dengan realisasi belanja operasional per bulan"
                  />
                  <div style={{ padding: '18px 14px 14px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={report.monthly.map((item) => ({
                          ...item,
                          label: monthLabel(item.month),
                          income: Number(item.income),
                          expense: Number(item.expense),
                        }))}
                      >
                        <defs>
                          <linearGradient id="reportIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#27825d" stopOpacity={0.22} />
                            <stop offset="100%" stopColor="#27825d" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#edf2ee" strokeDasharray="3 3" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis
                          tickFormatter={(v) => `${Math.round(Number(v) / 1e6)}jt`}
                          tickLine={false}
                          axisLine={false}
                          width={52}
                        />
                        <Tooltip formatter={(v) => currency(Number(v))} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="income"
                          name="Penerimaan"
                          stroke="#27825d"
                          fill="url(#reportIncome)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="expense"
                          name="Pengeluaran"
                          stroke="#d59a35"
                          fill="#d59a35"
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>
            }
          />

          {/* 2. Laporan Keuangan (Unstacked Tabs: Jurnal Transaksi vs Ringkasan Akun) */}
          <Route
            path="keuangan"
            element={
              <FinanceReport
                report={report}
                year={year}
                exportCsv={exportCsv}
              />
            }
          />

          {/* 3. Laporan Keanggotaan & Demografi (Disatukan) */}
          <Route path="anggota" element={<MembershipAndDemographicsReport report={report} />} />
          <Route path="demografi" element={<Navigate to="../anggota" replace />} />

          <Route path="*" element={<Navigate to="ringkasan" replace />} />
        </Routes>
      )}
    </main>
  );
};

const ReportTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <header style={{ padding: '16px 20px', borderBottom: '1px solid #edf1ee' }}>
    <strong style={{ fontSize: 14.5 }}>{title}</strong>
    <div style={{ color: '#839188', fontSize: 12, marginTop: 3 }}>{subtitle}</div>
  </header>
);

// ============================================================================
// FINANCE REPORT (Laporan Keuangan Bersih & Terorganisir Tanpa Numpuk)
// ============================================================================
const FinanceReport: React.FC<{
  report: ReportPayload;
  year: number;
  exportCsv: (type: 'transactions' | 'accounts') => void;
}> = ({ report, year, exportCsv }) => {
  // Tab switcher inside Finance Report to prevent stacking multiple big tables
  const [financeView, setFinanceView] = useState<'transactions' | 'accounts'>('transactions');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterScope, setFilterScope] = useState('ALL');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return (report.transactions || []).filter((row) => {
      if (filterType !== 'ALL' && row.transaction_type !== filterType) return false;
      if (filterScope !== 'ALL' && row.scope !== filterScope) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text = [row.transaction_code, row.account_name, row.notes, row.donor_name]
          .join(' ')
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [report.transactions, filterType, filterScope, search]);

  // Pagination for transactions
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedTransactions,
  } = usePagination(filteredTransactions, { initialPageSize: 10 });

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      {/* 3 KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '18px 20px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Total Penerimaan ({year})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', color: '#047857' }}>
              <TrendingUp size={16} />
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 750, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
            {currency(report.finance.totalIncome)}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Donasi, janji iman & persembahan yayasan</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Total Pengeluaran ({year})
            </span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>
              <ArrowDownLeft size={16} />
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 750, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
            {currency(report.finance.totalExpense)}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Operasional kantor & belanja program misi</div>
        </div>

        <div className="card" style={{ padding: '18px 20px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Saldo Bersih Pembukuan
            </span>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#f0f9ff', color: '#0369a1' }}>
              <Wallet size={16} />
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 24,
              fontWeight: 750,
              color: report.finance.net >= 0 ? '#047857' : '#b91c1c',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {currency(report.finance.net)}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Akumulasi net kas operasional & kas besar</div>
        </div>
      </div>

      {/* Sub-View Switcher Tab: Jurnal Transaksi vs Ringkasan Akun */}
      <div
        style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          gap: 4,
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setFinanceView('transactions')}
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: financeView === 'transactions' ? 650 : 500,
            border: 'none',
            background: financeView === 'transactions' ? '#ffffff' : 'transparent',
            color: financeView === 'transactions' ? '#0f172a' : '#64748b',
            boxShadow: financeView === 'transactions' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={15} color={financeView === 'transactions' ? '#047857' : '#94a3b8'} />
          <span>Rincian Jurnal Transaksi</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: financeView === 'transactions' ? '#ecfdf5' : '#e2e8f0',
              color: financeView === 'transactions' ? '#047857' : '#64748b',
            }}
          >
            {filteredTransactions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFinanceView('accounts')}
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: financeView === 'accounts' ? 650 : 500,
            border: 'none',
            background: financeView === 'accounts' ? '#ffffff' : 'transparent',
            color: financeView === 'accounts' ? '#0f172a' : '#64748b',
            boxShadow: financeView === 'accounts' ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Landmark size={15} color={financeView === 'accounts' ? '#047857' : '#94a3b8'} />
          <span>Ringkasan Akun & Buku Kas</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: financeView === 'accounts' ? '#ecfdf5' : '#e2e8f0',
              color: financeView === 'accounts' ? '#047857' : '#64748b',
            }}
          >
            {report.accounts.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: RINCIAN JURNAL TRANSAKSI */}
      {financeView === 'transactions' && (
        <div className="card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              background: '#ffffff',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Rincian Jurnal Transaksi Keuangan · Tahun {year}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                  }}
                >
                  {filteredTransactions.length} transaksi
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                Log mutasi seluruh transaksi kas masuk dan keluar yayasan berdasarkan tanggal pembukuan
              </p>
            </div>

            {/* Toolbar Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  aria-label="Cari transaksi"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kode, akun, catatan..."
                  className="form-input form-input-sm"
                  style={{ paddingLeft: 32, fontSize: '12.5px', height: 34 }}
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select form-select-sm"
                style={{ fontSize: '12.5px', height: 34, width: 140 }}
              >
                <option value="ALL">Semua Jenis</option>
                <option value="INCOME">Penerimaan (+)</option>
                <option value="EXPENSE">Pengeluaran (−)</option>
              </select>

              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
                className="form-select form-select-sm"
                style={{ fontSize: '12.5px', height: 34, width: 170 }}
              >
                <option value="ALL">Semua Lingkup</option>
                <option value="KAS_BESAR_YAYASAN">Kas Besar Yayasan</option>
                <option value="OPERASIONAL">Operasional Kantor</option>
              </select>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => exportCsv('transactions')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', height: 34, padding: '0 12px' }}
              >
                <Download size={13} /> Export CSV
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 115 }}>Tanggal</th>
                  <th style={{ width: 165 }}>Kode Bukti</th>
                  <th style={{ width: 240 }}>Akun Pembukuan</th>
                  <th style={{ width: 130 }}>Lingkup</th>
                  <th>Keterangan / Donatur / Pihak</th>
                  <th style={{ textAlign: 'right', width: 175, paddingRight: 20 }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((row) => {
                  const isIncome = row.transaction_type === 'INCOME';
                  return (
                    <tr key={row.transaction_code}>
                      <td style={{ fontSize: '12.5px', color: '#475569', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {new Date(row.transaction_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: '11.5px',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            background: '#f8fafc',
                            color: '#0f172a',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            border: '1px solid #e2e8f0',
                            fontWeight: 650,
                            letterSpacing: '0.02em',
                            display: 'inline-block',
                          }}
                        >
                          {row.transaction_code}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, fontSize: '13px', color: '#0f172a', lineHeight: 1.4 }}>
                          {row.account_name}
                        </div>
                      </td>
                      <td>
                        {row.scope === 'KAS_BESAR_YAYASAN' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 650,
                              padding: '3px 9px',
                              borderRadius: '99px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              display: 'inline-flex',
                              alignItems: 'center',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Kas Besar
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 650,
                              padding: '3px 9px',
                              borderRadius: '99px',
                              background: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              display: 'inline-flex',
                              alignItems: 'center',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Operasional
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#334155' }}>
                        {row.donor_name ? (
                          <div>
                            <span style={{ fontWeight: 650, color: '#0f172a' }}>{row.donor_name}</span>
                            {row.notes && (
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2, lineHeight: 1.35 }}>
                                {row.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ lineHeight: 1.4 }}>{row.notes || '—'}</span>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                          paddingRight: 20,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 700,
                            fontSize: '13px',
                            color: isIncome ? '#047857' : '#b91c1c',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 750,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isIncome ? '#ecfdf5' : '#fef2f2',
                              color: isIncome ? '#047857' : '#b91c1c',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {isIncome ? 'MASUK' : 'KELUAR'}
                          </span>
                          <span>
                            {isIncome ? '+' : '−'}{currency(Number(row.amount))}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!filteredTransactions.length && (
                  <tr>
                    <td colSpan={6}>
                      <Empty text="Tidak ada transaksi keuangan yang sesuai dengan filter pencarian." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="transaksi"
          />
        </div>
      )}

      {/* VIEW 2: RINGKASAN AKUN & BUKU KAS */}
      {financeView === 'accounts' && (
        <div className="card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              background: '#ffffff',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Ringkasan Akun & Pos Keuangan Yayasan
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 650,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                  }}
                >
                  {report.accounts.length} akun
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>
                Akumulasi penerimaan, pengeluaran, dan saldo net buku besar per pos anggaran · Tahun {year}
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => exportCsv('accounts')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', height: 34, padding: '0 12px' }}
            >
              <Download size={13} /> Export CSV Akun
            </button>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Akun Keuangan</th>
                  <th style={{ width: 160 }}>Lingkup Pembukuan</th>
                  <th style={{ width: 140 }}>Klasifikasi</th>
                  <th style={{ textAlign: 'right', width: 170 }}>Total Penerimaan</th>
                  <th style={{ textAlign: 'right', width: 170 }}>Total Pengeluaran</th>
                  <th style={{ textAlign: 'right', width: 180, paddingRight: 20 }}>Saldo Bersih (Net)</th>
                </tr>
              </thead>
              <tbody>
                {report.accounts.map((account) => {
                  const net = Number(account.income) - Number(account.expense);
                  return (
                    <tr key={account.id}>
                      <td>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{account.account_name}</strong>
                      </td>
                      <td>
                        {account.scope === 'KAS_BESAR_YAYASAN' ? (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 650,
                              padding: '3px 9px',
                              borderRadius: '99px',
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Kas Besar
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 650,
                              padding: '3px 9px',
                              borderRadius: '99px',
                              background: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Operasional
                          </span>
                        )}
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: '11px',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            background: '#f8fafc',
                            color: '#475569',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {account.account_type}
                        </code>
                      </td>
                      <td style={{ textAlign: 'right', color: '#047857', fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                        {currency(Number(account.income))}
                      </td>
                      <td style={{ textAlign: 'right', color: '#b91c1c', fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                        {currency(Number(account.expense))}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 750,
                          paddingRight: 20,
                          color: net > 0 ? '#047857' : net < 0 ? '#b91c1c' : '#64748b',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {currency(net)}
                      </td>
                    </tr>
                  );
                })}
                {!report.accounts.length && (
                  <tr>
                    <td colSpan={6}>
                      <Empty text="Belum ada akun keuangan tercatat di database." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

const MembershipAndDemographicsReport = ({ report }: { report: ReportPayload }) => (
  <section style={{ display: 'grid', gap: 18 }}>
    {/* Top KPI Cards: Keanggotaan */}
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
      }}
    >
      {[
        { label: 'Anggota Aktif', value: report.members.active_members, note: 'Terdaftar & Terverifikasi' },
        { label: 'Alumni Aktif', value: report.members.alumni, note: 'Alumni PA KMK USU' },
        { label: 'Mahasiswa Binaan', value: report.members.students, note: 'Mahasiswa aktif kampus' },
        { label: 'Anggota Baru Tahun Ini', value: report.members.new_members, note: 'Pendaftar disetujui' },
        { label: 'Nonaktif / Pindah', value: report.members.inactive_members, note: 'Status nonaktif' },
      ].map((item) => (
        <article key={item.label} style={{ ...cardStyle, padding: '16px 20px' }}>
          <div style={{ color: '#64748b', fontSize: 11.5, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {item.label}
          </div>
          <div style={{ fontSize: 24, fontWeight: 750, marginTop: 6, color: '#0f172a' }}>
            {Number(item.value || 0).toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{item.note}</div>
        </article>
      ))}
    </section>

    {/* Demographics Visualizations: Sebaran Fakultas & Domisili Kota */}
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
      {/* Fakultas Bar Chart */}
      <article style={cardStyle}>
        <ReportTitle
          title="Sebaran Alumni per Fakultas USU"
          subtitle="Jumlah alumni persekutuan berdasarkan fakultas kelulusan"
        />
        <div style={{ padding: '14px 16px 20px' }}>
          {report.faculties.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={report.faculties} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid stroke="#edf2ee" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" name="Alumni" fill="#236c50" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="Belum ada data fakultas." />
          )}
        </div>
      </article>

      {/* Domisili Pie Chart */}
      <article style={cardStyle}>
        <ReportTitle
          title="Domisili Anggota & Alumni"
          subtitle="Distribusi sebaran kota tempat tinggal alumni terdaftar"
        />
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, minHeight: 320 }}>
          <div style={{ flex: '0 0 46%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={report.cities} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {report.cities.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: 'grid', gap: 10 }}>
            {report.cities.slice(0, 8).map((city, i) => (
              <div key={city.name} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                <span style={{ flex: 1, color: '#475569' }}>{city.name}</span>
                <strong style={{ color: '#0f172a' }}>{city.value}</strong>
              </div>
            ))}
            {!report.cities.length && <Empty text="Belum ada data domisili." />}
          </div>
        </div>
      </article>
    </section>

    {/* Summary Info Card */}
    <article style={{ ...cardStyle, padding: '18px 22px', background: '#fafbfc' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 700, color: '#166534' }}>
        Komposisi & Integrasi Data Keanggotaan Yayasan
      </h3>
      <p style={{ margin: 0, color: '#64748b', fontSize: 12.5, lineHeight: 1.7 }}>
        Data keanggotaan terintegrasi langsung secara real-time dengan database alumni PA KMK USU, mahasiswa binaan aktif, serta permohonan pendaftaran baru yang telah melalui verifikasi berkas oleh sekretariat yayasan.
      </p>
    </article>
  </section>
);

const Empty = ({ text }: { text: string }) => (
  <div style={{ textAlign: 'center', color: '#8b9990', padding: 36, fontSize: 13 }}>{text}</div>
);

export default ReportsPage;
