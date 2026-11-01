import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  DollarSign,
  Cake,
  CalendarHeart,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';

interface DashboardData {
  stats?: {
    members?: { total: number; active: number; alumni: number; students: number };
    building?: { target: number; collected: number; percentage: number };
    finance?: { income: number; expense: number; balance: number };
    pendingRegistrations?: number;
  };
  pastoralCare?: {
    upcomingBirthdays?: Array<{ id: string; full_name: string; member_number: string; birth_date: string; phone_number: string }>;
    upcomingWeddingAnniversaries?: Array<{ id: string; full_name: string; member_number: string; wedding_date: string; phone_number: string }>;
  };
  memberGrowth?: Array<{ year: number; count: number }>;
  financeTrend?: Array<{ month: string; income: number; expense: number }>;
}

const formatRp = (val: number) => {
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(0)} jt`;
  }
  if (val >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${val}`;
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter state (CAKAPP Human Enterprise Style)
  const [periodType, setPeriodType] = useState<string>('Rentang Kustom');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-11-01');
  const [lastUpdated, setLastUpdated] = useState<string>('01 Nov 2026 13:00 WIB');

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.dashboard.getSummary();
      if (res) {
        setData(res.data || res);
      }
      const now = new Date();
      const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);
      setLastUpdated(`${dateFormatted} WIB`);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const stats = data?.stats;
  const pastoralCare = data?.pastoralCare;

  const totalMembers = stats?.members?.total ?? 0;
  const alumniCount = stats?.members?.alumni ?? 0;
  const studentCount = stats?.members?.students ?? 0;
  const otherCount = Math.max(0, totalMembers - alumniCount - studentCount);

  const alumniPct = totalMembers > 0 ? ((alumniCount / totalMembers) * 100).toFixed(2) : '0,00';
  const studentPct = totalMembers > 0 ? ((studentCount / totalMembers) * 100).toFixed(2) : '0,00';
  const otherPct = totalMembers > 0 ? ((otherCount / totalMembers) * 100).toFixed(2) : '0,00';

  // Determine dominant member group for 4th KPI card (matching CAKAPP's "Komposisi Kualitas Tertinggi")
  let dominantLabel = 'Alumni';
  let dominantCount = alumniCount;
  let dominantPct = alumniPct;
  if (studentCount > alumniCount && studentCount >= otherCount) {
    dominantLabel = 'Mahasiswa';
    dominantCount = studentCount;
    dominantPct = studentPct;
  } else if (otherCount > alumniCount && otherCount > studentCount) {
    dominantLabel = 'Mitra';
    dominantCount = otherCount;
    dominantPct = otherPct;
  }

  const buildingTarget = stats?.building?.target ?? 0;
  const buildingCollected = stats?.building?.collected ?? 0;
  const buildingPct = stats?.building?.percentage ?? 0;

  const income = stats?.finance?.income ?? 0;
  const expense = stats?.finance?.expense ?? 0;

  // Chart data
  const donationTrend = (data?.financeTrend ?? []).map((item) => ({
    month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${item.month}-02T00:00:00`)),
    penerimaan: Number(item.income),
    pengeluaran: Number(item.expense),
  }));

  const memberPieData = [
    { name: 'Alumni', value: alumniCount || 1, color: '#10b981' },
    { name: 'Mahasiswa', value: studentCount || 0, color: '#2563eb' },
    { name: 'Mitra/Lainnya', value: otherCount || 0, color: '#f97316' },
  ];

  const upcomingBirthdays = pastoralCare?.upcomingBirthdays || [];
  const upcomingAnniversaries = pastoralCare?.upcomingWeddingAnniversaries || [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 32 }}>
      {/* 1. Header Card (Standar Human SaaS CAKAPP) */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: 16,
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 4px',
            letterSpacing: '-0.01em',
          }}
        >
          Dashboard Eksekutif
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          Pantau performa database alumni, penerimaan donasi, dan alokasi dana yayasan dalam satu halaman
        </p>
      </div>

      {/* 2. Filter Card (Jenis Periode, Tanggal Mulai, Tanggal Akhir, Tombol Terapkan) */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          marginBottom: 20,
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
              Jenis Periode
            </label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="form-select form-select-sm"
              style={{
                minWidth: 160,
                height: 38,
                padding: '6px 32px 6px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                background: '#ffffff',
              }}
            >
              <option value="Rentang Kustom">Rentang Kustom</option>
              <option value="Tahun Berjalan">Tahun Berjalan (2026)</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Semua Periode">Semua Periode</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input form-input-sm"
              style={{
                height: 38,
                padding: '6px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                color: '#0f172a',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input form-input-sm"
              style={{
                height: 38,
                padding: '6px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                color: '#0f172a',
              }}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={fetchSummary}
            disabled={isLoading}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 13,
              padding: '9px 24px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
          >
            {isLoading && <RefreshCw size={13} className="spin" />}
            <span>Terapkan</span>
          </button>
        </div>
      </div>

      {/* 3. 4 KPI Stat Cards Row (CAKAPP Layout) */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {/* Card 1: Total Anggota */}
        <div className="stat-card">
          <div className="stat-card-label">Total Anggota</div>
          <div className="stat-card-icon">
            <Users size={18} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value">
            {totalMembers.toLocaleString('id-ID')} orang
          </div>
          <div className="stat-card-meta">
            Akumulasi database terverifikasi
          </div>
        </div>

        {/* Card 2: Total Penerimaan */}
        <div className="stat-card">
          <div className="stat-card-label">Total Penerimaan</div>
          <div className="stat-card-icon">
            <DollarSign size={18} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24 }}>
            {formatRupiah(income)}
          </div>
          <div className="stat-card-meta">
            Pengeluaran kas: {formatRupiah(expense)}
          </div>
        </div>

        {/* Card 3: Dana Rumah Persekutuan */}
        <div className="stat-card">
          <div className="stat-card-label">Dana Rumah Persekutuan</div>
          <div className="stat-card-icon">
            <Building2 size={18} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24 }}>
            {formatRupiah(buildingCollected)}
          </div>
          <div className="stat-card-meta">
            {buildingPct}% dari target {formatRupiah(buildingTarget)}
          </div>
        </div>

        {/* Card 4: Komposisi Anggota Tertinggi */}
        <div className="stat-card">
          <div className="stat-card-label">Komposisi Anggota Tertinggi</div>
          <div className="stat-card-icon">
            <Award size={18} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24 }}>
            {dominantLabel} ({dominantPct}%)
          </div>
          <div className="stat-card-meta">
            {dominantCount.toLocaleString('id-ID')} orang terdata
          </div>
        </div>
      </div>

      {/* 4. Charts Row: Tren Bulanan (Kiri) & Komposisi Keanggotaan (Kanan) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Kiri: Tren Produksi & Penjualan Bulanan (Mirrors CAKAPP) */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a', marginBottom: 16 }}>
            Tren Penerimaan & Pengeluaran Bulanan
          </div>

          <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationTrend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPenerimaan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={formatRp}
                  tick={{ fontSize: 10.5, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val))}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="penerimaan"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorPenerimaan)"
                  name="Penerimaan"
                />
                <Area
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#colorPengeluaran)"
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Chart Legend (CAKAPP style dots) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              marginTop: 14,
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
              <span>Penerimaan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2563eb' }} />
              <span>Pengeluaran</span>
            </div>
          </div>
        </div>

        {/* Kanan: Komposisi Keanggotaan Produksi (Mirrors CAKAPP Donut + Legend Table) */}
        <div
          className="card"
          style={{
            padding: '20px 24px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a', marginBottom: 16 }}>
            Komposisi Anggota Yayasan
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            {/* Donut Chart */}
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 170, height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberPieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {memberPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} orang`, name]}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Dots Under Donut */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 6,
                  fontSize: 11.5,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                  <span>Alumni</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }} />
                  <span>Mahasiswa</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316' }} />
                  <span>Mitra</span>
                </div>
              </div>
            </div>

            {/* Vertical Summary List (CAKAPP style with title, count, and pct) */}
            <div
              style={{
                flex: '1 1 180px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Alumni */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650, color: '#0f172a' }}>Alumni</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  <span>{alumniCount.toLocaleString('id-ID')} orang</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{alumniPct}%</span>
                </div>
              </div>

              {/* Mahasiswa */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650, color: '#0f172a' }}>Mahasiswa</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  <span>{studentCount.toLocaleString('id-ID')} orang</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{studentPct}%</span>
                </div>
              </div>

              {/* Mitra & Lainnya */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650, color: '#0f172a' }}>Mitra & Lainnya</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 12, color: '#64748b' }}>
                  <span>{otherCount.toLocaleString('id-ID')} orang</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{otherPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Building Project Progress (Clean Card) */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: 20,
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#0f172a' }}>
              Progres Pembangunan Rumah Persekutuan GMH
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
              Target: {formatRupiah(buildingTarget)} · Terkumpul: {formatRupiah(buildingCollected)}
            </div>
          </div>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 99,
              background: '#f1f5f9',
              color: '#0f172a',
              fontSize: 12,
              fontWeight: 650,
              border: '1px solid #e2e8f0',
            }}
          >
            {buildingPct}% Tercapai
          </span>
        </div>

        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, buildingPct)}%`,
              height: '100%',
              background: '#10b981',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span>{formatRupiah(buildingCollected)} terkumpul dari alumni & donatur</span>
          <span>Sisa target: {formatRupiah(Math.max(0, buildingTarget - buildingCollected))}</span>
        </div>
      </div>

      {/* 6. Pastoral Care: Ulang Tahun & Pernikahan */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Birthday Widget */}
        <div className="birthday-widget">
          <div className="birthday-widget-header">
            <Cake size={17} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 650, color: '#0f172a' }}>
              Ulang Tahun Anggota (Bulan Ini)
            </h3>
          </div>

          <div className="birthday-widget-section">
            {upcomingBirthdays.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#64748b', padding: '12px 0' }}>
                Tidak ada anggota yang berulang tahun di sisa bulan ini.
              </div>
            ) : (
              upcomingBirthdays.map((b) => (
                <div key={b.id} className="birthday-item">
                  <div>
                    <span className="birthday-item-name">{b.full_name}</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {b.member_number} · {b.phone_number || '-'}
                    </div>
                  </div>
                  <span className="birthday-item-date">
                    {b.birth_date ? new Date(b.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wedding Anniversary Widget */}
        <div className="birthday-widget">
          <div className="birthday-widget-header">
            <CalendarHeart size={17} color="#047857" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 650, color: '#0f172a' }}>
              Ulang Tahun Pernikahan (Bulan Ini)
            </h3>
          </div>

          <div className="birthday-widget-section">
            {upcomingAnniversaries.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#64748b', padding: '12px 0' }}>
                Tidak ada ulang tahun pernikahan keluarga anggota di bulan ini.
              </div>
            ) : (
              upcomingAnniversaries.map((a) => (
                <div key={a.id} className="birthday-item">
                  <div>
                    <span className="birthday-item-name">Kel. {a.full_name}</span>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {a.member_number} · {a.phone_number || '-'}
                    </div>
                  </div>
                  <span className="birthday-item-date">
                    {a.wedding_date ? new Date(a.wedding_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. Bottom Status Bar (Identik dengan CAKAPP) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '0 4px',
          fontSize: 12,
          color: '#64748b',
        }}
      >
        <div>
          Rentang aktif: <strong>{startDate}</strong> s/d <strong>{endDate}</strong>
        </div>
        <div>
          Pembaruan terakhir: <strong>{lastUpdated}</strong>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
