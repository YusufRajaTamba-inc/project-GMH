import { FileDown } from 'lucide-react';
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
} from 'recharts';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import { formatRupiah } from '../../utils/currency';

const FACULTY_DATA = [
  { name: 'Teknik', count: 98 },
  { name: 'Kedokteran', count: 72 },
  { name: 'MIPA', count: 65 },
  { name: 'Ekonomi', count: 88 },
  { name: 'Hukum', count: 54 },
  { name: 'Pertanian', count: 47 },
  { name: 'FISIP', count: 63 },
];

const CITY_DATA = [
  { name: 'Medan', value: 210 },
  { name: 'Jakarta', value: 95 },
  { name: 'Bandung', value: 42 },
  { name: 'Surabaya', value: 38 },
  { name: 'Lainnya', value: 102 },
];

const COLORS = ['#1B4332', '#2D6A4F', '#52B788', '#e5a61e', '#b87d0e'];

const ReportsPage: React.FC = () => {
  const { transactions, getOperationalBalance, getBuildingBalance } = useFinanceStore();

  const totalDonasi = transactions
    .filter((t) => t.source === 'DONASI' || t.source === 'JANJI_IMAN')
    .reduce((s, t) => s + t.amount, 0) + 247000000;

  const totalBelanja = transactions
    .filter((t) => t.type === 'DEBIT' && t.account === 'KAS_OPERASIONAL')
    .reduce((s, t) => s + t.amount, 0) + 98400000;

  const totalBuilding = 1224000000 + getBuildingBalance();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Laporan Konsolidasi Yayasan GMH</h2>
          <p>Laporan keuangan terpadu, demografi alumni USU, dan statistik kegiatan yayasan</p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          id="btn-export-report"
          onClick={() =>
            alert(
              'Laporan Eksekutif Konsolidasi Yayasan GMH berhasil diunduh dalam format PDF resmi dengan tanda tangan Dewan Pengawas.'
            )
          }
        >
          <FileDown size={14} /> Export Laporan Lengkap
        </button>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        {/* Faculty distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Sebaran Alumni per Fakultas USU</div>
          </div>
          <div style={{ padding: '16px 16px 24px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FACULTY_DATA} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF5F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#8FA894' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#5A6B60' }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #D1E0D4', fontSize: 12 }} />
                <Bar dataKey="count" fill="#1B4332" radius={[0, 4, 4, 0]} name="Alumni" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Domisili Alumni per Wilayah</div>
          </div>
          <div style={{ padding: '16px 24px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CITY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {CITY_DATA.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              {CITY_DATA.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gmh-green-dark)' }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Ringkasan Keuangan Yayasan Terintegrasi — Tahun 2026</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              {
                label: 'Total Donasi & Janji Masuk',
                value: formatRupiah(totalDonasi),
                color: 'var(--gmh-success)',
              },
              {
                label: 'Belanja Kas Operasional',
                value: formatRupiah(totalBelanja),
                color: '#b91c1c',
              },
              {
                label: 'Kas Khusus Pembangunan',
                value: formatRupiah(totalBuilding),
                color: 'var(--gmh-gold-dark)',
              },
              {
                label: 'Saldo Kas Operasional Kantor',
                value: formatRupiah(getOperationalBalance()),
                color: 'var(--gmh-green)',
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '16px',
                  background: 'var(--gmh-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--gmh-border)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--gmh-text-muted)',
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
