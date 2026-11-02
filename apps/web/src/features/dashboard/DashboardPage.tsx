import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Building2,
  DollarSign,
  Cake,
  CalendarHeart,
  RefreshCw,
  Award,
  Compass,
  CheckCircle2,
  ChevronRight,
  Flame,
  BookOpen,
  GraduationCap,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';

interface BuildingProjectItem {
  id: string;
  project_name: string;
  category?: string;
  target_budget: number | string;
  current_funds: number | string;
  progress_percentage: number;
  status: string;
  pic_name?: string;
}

interface MinistryTrendItem {
  month: string;
  misi: number;
  ibadah: number;
  pembinaan: number;
  sosial: number;
  total: number;
}

interface MemberGrowthItem {
  month: string;
  newMembers: number;
  alumni: number;
  students: number;
  registrations: number;
  totalAccumulated: number;
}

interface FacultyDistItem {
  name: string;
  value: number;
}

interface DashboardData {
  stats?: {
    members?: { total: number; active: number; alumni: number; students: number };
    building?: {
      id?: string;
      projectName?: string;
      category?: string;
      target: number;
      collected: number;
      percentage: number;
      status?: string;
    };
    finance?: { income: number; expense: number; balance: number };
    pendingRegistrations?: number;
  };
  buildingProjects?: BuildingProjectItem[];
  ministryTrend?: MinistryTrendItem[];
  memberMonthlyGrowth?: MemberGrowthItem[];
  facultyDistribution?: FacultyDistItem[];
  pastoralCare?: {
    upcomingBirthdays?: Array<{ id: string; full_name: string; member_number: string; birth_date: string; phone_number: string }>;
    upcomingWeddingAnniversaries?: Array<{ id: string; full_name: string; member_number: string; wedding_date: string; phone_number: string }>;
  };
  memberGrowth?: Array<{ year: number; count: number }>;
  financeTrend?: Array<{ month: string; income: number; expense: number }>;
}

type DashboardTab = 'OVERVIEW' | 'MINISTRY' | 'GROWTH' | 'PROJECTS';

const formatRp = (val: number) => {
  if (val >= 1_000_000_000) {
    return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  }
  if (val >= 1_000_000) {
    return `Rp ${(val / 1_000_000).toFixed(0)} jt`;
  }
  if (val >= 1_000) {
    return `Rp ${(val / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${val}`;
};

const formatMonthName = (monthKey: string) => {
  if (!monthKey) return '';
  try {
    const d = new Date(`${monthKey}-02T00:00:00`);
    if (isNaN(d.getTime())) return monthKey;
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(d);
  } catch {
    return monthKey;
  }
};

const FACULTY_COLORS = [
  '#059669', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2', 
  '#ea580c', '#4f46e5', '#16a34a', '#ca8a04', '#0284c7', '#9333ea', 
  '#e11d48', '#64748b'
];

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = (searchParams.get('tab')?.toUpperCase() as DashboardTab) || 'OVERVIEW';
  const activeTab: DashboardTab = (['OVERVIEW', 'MINISTRY', 'GROWTH', 'PROJECTS'] as DashboardTab[]).includes(urlTab)
    ? urlTab
    : 'OVERVIEW';

  const handleTabChange = (tab: DashboardTab) => {
    setSearchParams({ tab: tab.toLowerCase() });
  };

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('Memuat...');

  const fetchSummary = useCallback(async (projectId?: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.dashboard.getSummary(projectId);
      if (res) {
        const payload: DashboardData = res.data || res;
        setData(payload);
        if (payload.stats?.building?.id && !projectId) {
          setSelectedProjectId(payload.stats.building.id);
        }
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
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    fetchSummary(projId);
  };

  const stats = data?.stats;
  const pastoralCare = data?.pastoralCare;
  const buildingProjects = useMemo(() => data?.buildingProjects || [], [data?.buildingProjects]);

  // Active Project Data (Dynamic)
  const currentProject = useMemo(() => {
    if (selectedProjectId && buildingProjects.length > 0) {
      const found = buildingProjects.find((p) => p.id === selectedProjectId);
      if (found) return found;
    }
    if (buildingProjects.length > 0) return buildingProjects[0];
    return {
      id: '',
      project_name: stats?.building?.projectName || 'Belum Ada Proyek',
      target_budget: stats?.building?.target || 0,
      current_funds: stats?.building?.collected || 0,
      progress_percentage: stats?.building?.percentage || 0,
      status: stats?.building?.status || 'PLANNING',
    };
  }, [selectedProjectId, buildingProjects, stats?.building]);

  const totalMembers = stats?.members?.total ?? 0;
  const activeMembers = stats?.members?.active ?? 0;
  const alumniCount = stats?.members?.alumni ?? 0;
  const studentCount = stats?.members?.students ?? 0;
  const otherCount = Math.max(0, totalMembers - alumniCount - studentCount);

  const alumniPct = totalMembers > 0 ? ((alumniCount / totalMembers) * 100).toFixed(1) : '0';
  const studentPct = totalMembers > 0 ? ((studentCount / totalMembers) * 100).toFixed(1) : '0';
  const otherPct = totalMembers > 0 ? ((otherCount / totalMembers) * 100).toFixed(1) : '0';

  let dominantLabel = '-';
  let dominantCount = 0;
  let dominantPct = '0';
  if (totalMembers > 0) {
    if (studentCount > alumniCount && studentCount >= otherCount) {
      dominantLabel = 'Mahasiswa';
      dominantCount = studentCount;
      dominantPct = studentPct;
    } else if (otherCount > alumniCount && otherCount > studentCount) {
      dominantLabel = 'Mitra';
      dominantCount = otherCount;
      dominantPct = otherPct;
    } else {
      dominantLabel = 'Alumni';
      dominantCount = alumniCount;
      dominantPct = alumniPct;
    }
  }

  const buildingTarget = Number(currentProject.target_budget || 0);
  const buildingCollected = Number(currentProject.current_funds || 0);
  const buildingPct = Number(currentProject.progress_percentage || 0);

  const income = stats?.finance?.income ?? 0;
  const expense = stats?.finance?.expense ?? 0;

  // Chart 1: Finance Trend
  const donationTrend = useMemo(() => {
    return (data?.financeTrend ?? []).map((item) => ({
      month: formatMonthName(item.month),
      penerimaan: Number(item.income),
      pengeluaran: Number(item.expense),
    }));
  }, [data?.financeTrend]);

  // Chart 2: Ministry Monthly Trend
  const ministryChartData = useMemo(() => {
    return (data?.ministryTrend ?? []).map((item) => ({
      month: formatMonthName(item.month),
      misi: Number(item.misi || 0),
      ibadah: Number(item.ibadah || 0),
      pembinaan: Number(item.pembinaan || 0),
      sosial: Number(item.sosial || 0),
      total: Number(item.total || 0),
    }));
  }, [data?.ministryTrend]);

  // Chart 3: Member Monthly Growth Trend
  const memberGrowthChartData = useMemo(() => {
    return (data?.memberMonthlyGrowth ?? []).map((item) => ({
      month: formatMonthName(item.month),
      newMembers: Number(item.newMembers || 0),
      alumni: Number(item.alumni || 0),
      students: Number(item.students || 0),
      registrations: Number(item.registrations || 0),
      totalAccumulated: Number(item.totalAccumulated || 0),
    }));
  }, [data?.memberMonthlyGrowth]);

  // Member Pie Data (Real counts only)
  const memberPieData = useMemo(() => {
    if (totalMembers <= 0) return [];
    return [
      { name: 'Alumni', value: alumniCount, color: '#10b981' },
      { name: 'Mahasiswa', value: studentCount, color: '#2563eb' },
      { name: 'Staf / Mitra', value: otherCount, color: '#f97316' },
    ].filter((slice) => slice.value > 0);
  }, [totalMembers, alumniCount, studentCount, otherCount]);

  // Faculty Distribution Data
  const facultyData = useMemo(() => {
    return (data?.facultyDistribution || []).map((item, idx) => ({
      name: item.name,
      value: Number(item.value),
      color: FACULTY_COLORS[idx % FACULTY_COLORS.length],
    }));
  }, [data?.facultyDistribution]);

  // Aggregated Ministry Totals
  const ministryTotals = useMemo(() => {
    const list = data?.ministryTrend || [];
    return {
      misi: list.reduce((acc, curr) => acc + Number(curr.misi || 0), 0),
      ibadah: list.reduce((acc, curr) => acc + Number(curr.ibadah || 0), 0),
      pembinaan: list.reduce((acc, curr) => acc + Number(curr.pembinaan || 0), 0),
      sosial: list.reduce((acc, curr) => acc + Number(curr.sosial || 0), 0),
      total: list.reduce((acc, curr) => acc + Number(curr.total || 0), 0),
    };
  }, [data?.ministryTrend]);

  const upcomingBirthdays = pastoralCare?.upcomingBirthdays || [];
  const upcomingAnniversaries = pastoralCare?.upcomingWeddingAnniversaries || [];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px 36px' }}>
      {/* 1. Header Card */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: 16,
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 4px',
              letterSpacing: '-0.01em',
            }}
          >
            Dashboard Manajemen Yayasan
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Pantau performa pelayanan misi, progres proyek fisik dinamis, dan tren keanggotaan alumni PA KMK USU
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => fetchSummary(selectedProjectId)}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12.5 }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* SUB-MENU 1: RINGKASAN EKSEKUTIF (OVERVIEW)                                */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 4 KPI Stat Cards */}
          <div className="stats-grid">
            {/* Card 1: Total Anggota */}
            <div className="stat-card">
              <div className="stat-card-label">Total Anggota Terdaftar</div>
              <div className="stat-card-icon">
                <Users size={18} strokeWidth={1.8} />
              </div>
              <div className="stat-card-value">
                {totalMembers.toLocaleString('id-ID')} orang
              </div>
              <div className="stat-card-meta">
                {activeMembers} aktif ({alumniCount} alumni · {studentCount} mhs{otherCount > 0 ? ` · ${otherCount} staf/mitra` : ''})
              </div>
            </div>

            {/* Card 2: Total Penerimaan */}
            <div className="stat-card">
              <div className="stat-card-label">Kas Operasional Bulan Ini</div>
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

            {/* Card 3: Dynamic Building Project Card */}
            <div
              className="stat-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px 22px',
                gap: 10,
              }}
            >
              {/* Top Row: Category label & Clean Icon Container */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Proyek Strategis Yayasan
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={16} strokeWidth={2.2} />
                </div>
              </div>

              {/* Selector: Custom styled Dropdown Switcher */}
              <div>
                <select
                  value={currentProject.id}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: 13,
                    fontWeight: 650,
                    color: '#0f172a',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    cursor: 'pointer',
                    outline: 'none',
                    lineHeight: 1.4,
                  }}
                  title="Pilih proyek yang ingin dipantau di kartu ini"
                >
                  {buildingProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} ({p.progress_percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Collected Value */}
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                {formatRupiah(buildingCollected)}
              </div>

              {/* Visual Progress Bar */}
              <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(buildingPct, 100)}%`,
                    height: '100%',
                    background: buildingPct >= 100 ? '#10b981' : '#047857',
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {/* Bottom Meta Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
                <span>{buildingPct}% dari {formatRupiah(buildingTarget)}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: currentProject.status === 'COMPLETED' ? '#d1fae5' : '#e0f2fe',
                    color: currentProject.status === 'COMPLETED' ? '#047857' : '#0369a1',
                  }}
                >
                  {currentProject.status === 'COMPLETED' ? 'Selesai' : 'Berjalan'}
                </span>
              </div>
            </div>

            {/* Card 4: Dominasi Komposisi Anggota */}
            <div className="stat-card">
              <div className="stat-card-label">Komposisi Terbanyak</div>
              <div className="stat-card-icon">
                <Award size={18} strokeWidth={1.8} />
              </div>
              <div className="stat-card-value" style={{ fontSize: 24 }}>
                {dominantLabel} ({dominantPct}%)
              </div>
              <div className="stat-card-meta">
                {dominantCount.toLocaleString('id-ID')} orang dari total terdata
              </div>
            </div>
          </div>

          {/* Charts Row: Tren Kas (Kiri) & Komposisi Anggota (Kanan) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: 20,
            }}
          >
            {/* Kiri: Tren Penerimaan & Pengeluaran */}
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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                Tren Penerimaan &amp; Pengeluaran Kas (6 Bulan)
              </div>

              <div style={{ height: 230, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={donationTrend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPenerimaan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                  marginTop: 12,
                  fontSize: 12,
                  color: '#475569',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
                  <span>Penerimaan Kas</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2563eb' }} />
                  <span>Pengeluaran Kas</span>
                </div>
              </div>
            </div>

            {/* Kanan: Komposisi Anggota */}
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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
                Komposisi Keanggotaan Yayasan
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 170, height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={memberPieData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={70}
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
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11.5, color: '#475569' }}>
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
                      <span>Staf / Mitra</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>Alumni USU</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                      <span>{alumniCount} orang</span>
                      <span style={{ fontWeight: 600, color: '#047857' }}>{alumniPct}%</span>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>Mahasiswa Aktif</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                      <span>{studentCount} orang</span>
                      <span style={{ fontWeight: 600, color: '#2563eb' }}>{studentPct}%</span>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>Staf Yayasan / Mitra</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                      <span>{otherCount} orang</span>
                      <span style={{ fontWeight: 600, color: '#f97316' }}>{otherPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pastoral Care Widgets: Ulang Tahun & Ulang Tahun Pernikahan */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
            }}
          >
            {/* Birthday Widget */}
            <div className="birthday-widget">
              <div className="birthday-widget-header">
                <Cake size={17} color="#047857" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
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
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MENU 2: TREN PELAYANAN & MISI (MINISTRY)                               */}
      {/* ========================================================================= */}
      {activeTab === 'MINISTRY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Metric Highlights Pelayanan */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Frekuensi Pelayanan (6 Bln)</div>
              <div className="stat-card-icon">
                <Compass size={18} color="#047857" />
              </div>
              <div className="stat-card-value">{ministryTotals.total} Kegiatan</div>
              <div className="stat-card-meta">Gabungan program &amp; pos misi yayasan</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Misi &amp; Penginjilan</div>
              <div className="stat-card-icon">
                <Flame size={18} color="#059669" />
              </div>
              <div className="stat-card-value">{ministryTotals.misi} Pos/Aksi</div>
              <div className="stat-card-meta">Kegiatan penjangkauan lapangan</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Ibadah &amp; Persekutuan Alumni</div>
              <div className="stat-card-icon">
                <Users size={18} color="#2563eb" />
              </div>
              <div className="stat-card-value">{ministryTotals.ibadah} Ibadah</div>
              <div className="stat-card-meta">Persekutuan bulanan &amp; doa bersama</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Pembinaan &amp; Workshop Kampus</div>
              <div className="stat-card-icon">
                <BookOpen size={18} color="#d97706" />
              </div>
              <div className="stat-card-value">{ministryTotals.pembinaan} Sesi</div>
              <div className="stat-card-meta">Pelatihan kepemimpinan &amp; pembekalan</div>
            </div>
          </div>

          {/* Main Chart: BarChart Pelayanan per Bulan */}
          <div
            className="card"
            style={{
              padding: '24px 28px',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Distribusi Frekuensi Pelayanan per Bulan Menurut Kategori
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Visualisasi real-time kegiatan pelayanan misi, ibadah raya, dan pembinaan mahasiswa/alumni (6 bulan terakhir)
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span className="badge badge-success" style={{ padding: '5px 10px' }}>
                  {ministryTotals.total} Total Kegiatan
                </span>
              </div>
            </div>

            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  <Bar dataKey="misi" name="Misi & Penginjilan" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ibadah" name="Ibadah & Persekutuan" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pembinaan" name="Pembinaan & Workshop" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sosial" name="Sosial & Diakonia" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MENU 3: PERTUMBUHAN ANGGOTA (GROWTH)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'GROWTH' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Metric Highlights Pertumbuhan */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Total Anggota Terverifikasi</div>
              <div className="stat-card-icon">
                <Users size={18} color="#047857" />
              </div>
              <div className="stat-card-value">{totalMembers} Orang</div>
              <div className="stat-card-meta">{activeMembers} status aktif di sistem</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Alumni PA KMK Terdata</div>
              <div className="stat-card-icon">
                <GraduationCap size={18} color="#059669" />
              </div>
              <div className="stat-card-value">{alumniCount} Alumni ({alumniPct}%)</div>
              <div className="stat-card-meta">Tersebar di berbagai profesi &amp; kota</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Mahasiswa Aktif Terbina</div>
              <div className="stat-card-icon">
                <Users size={18} color="#2563eb" />
              </div>
              <div className="stat-card-value">{studentCount} Mahasiswa ({studentPct}%)</div>
              <div className="stat-card-meta">Generasi penerus pelayanan kampus</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Pendaftaran Menunggu Verifikasi</div>
              <div className="stat-card-icon">
                <Clock size={18} color="#d97706" />
              </div>
              <div className="stat-card-value">{stats?.pendingRegistrations || 0} Tiket</div>
              <div className="stat-card-meta">Registrasi publik butuh review admin</div>
            </div>
          </div>

          {/* Main Chart: AreaChart Pertumbuhan Anggota Baru per Bulan */}
          <div
            className="card"
            style={{
              padding: '24px 28px',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Tren Pertumbuhan Data Anggota &amp; Registrasi per Bulan
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Statistik penambahan alumni dan mahasiswa baru yang terdaftar di database yayasan
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-primary" style={{ padding: '5px 10px', fontSize: 11.5 }}>
                  Akumulasi Aktif: {totalMembers} Anggota
                </span>
              </div>
            </div>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberGrowthChartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNewMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={38} />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} orang`, name]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="newMembers"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fill="url(#colorNewMembers)"
                    name="Anggota Baru Terverifikasi"
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRegs)"
                    name="Formulir Masuk (Mandiri)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* List Bawah: Sebaran Fakultas Asal USU (List View untuk 13+ Fakultas) */}
          <div
            className="card"
            style={{
              padding: '22px 26px',
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Sebaran Fakultas Asal Alumni &amp; Mahasiswa di USU
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                  Total {facultyData.length} fakultas terdata dari alumni dan mahasiswa PA KMK USU
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 650,
                  color: '#047857',
                  background: '#ecfdf5',
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {totalMembers} Total Anggota
              </div>
            </div>

            {facultyData.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                Belum ada data fakultas yang terdaftar.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '8px 16px',
                }}
              >
                {facultyData.map((f, i) => {
                  const pct = totalMembers > 0 ? ((f.value / totalMembers) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Rank Badge */}
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          background: i < 3 ? '#047857' : '#e2e8f0',
                          color: i < 3 ? '#ffffff' : '#64748b',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        #{i + 1}
                      </div>

                      {/* Faculty Name & Bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 650,
                              color: '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={f.name}
                          >
                            {f.name}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginLeft: 8 }}>
                            {f.value} orang
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            width: '100%',
                            height: 5,
                            background: '#e2e8f0',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(Number(pct), 100)}%`,
                              height: '100%',
                              background: f.color || '#047857',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      </div>

                      {/* Percentage */}
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#64748b',
                          minWidth: 44,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MENU 4: PORTOFOLIO PROYEK FISIK (PROJECTS)                            */}
      {/* ========================================================================= */}
      {activeTab === 'PROJECTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  Daftar Proyek Fisik &amp; Fasilitas Pelayanan Yayasan
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Seluruh proyek bersifat dinamis. Data dan target anggaran otomatis tersinkronisasi dari master proyek yayasan.
                </p>
              </div>

              <span className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: 12 }}>
                {buildingProjects.length} Proyek Terdata
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              {buildingProjects.map((p) => {
                const target = Number(p.target_budget || 0);
                const collected = Number(p.current_funds || 0);
                const pct = Number(p.progress_percentage || 0);
                const remaining = Math.max(0, target - collected);
                const isSelected = p.id === currentProject.id;

                let statusBadge = { bg: '#e0f2fe', color: '#0369a1', text: 'Berjalan (On Progress)' };
                if (p.status === 'COMPLETED') {
                  statusBadge = { bg: '#dcfce7', color: '#15803d', text: 'Selesai (Completed)' };
                } else if (p.status === 'PLANNING') {
                  statusBadge = { bg: '#fef3c7', color: '#b45309', text: 'Perencanaan' };
                }

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '20px',
                      borderRadius: 10,
                      border: isSelected ? '2px solid #047857' : '1px solid #e2e8f0',
                      background: isSelected ? '#fcfdfd' : '#ffffff',
                      boxShadow: isSelected ? '0 4px 12px rgba(4, 120, 87, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            fontSize: 11,
                            fontWeight: 650,
                          }}
                        >
                          {statusBadge.text}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              color: '#047857',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} /> Aktif di Dashboard
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                        {p.project_name}
                      </h4>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 14 }}>
                        Kategori: <strong>{p.category || 'Infrastruktur'}</strong> {p.pic_name ? `· PIC: ${p.pic_name}` : ''}
                      </div>

                      {/* Progress Bar */}
                      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                        <div
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            height: '100%',
                            background: pct >= 80 ? '#10b981' : pct >= 50 ? '#0284c7' : '#d97706',
                            borderRadius: 99,
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{pct}% Tercapai</span>
                        <span style={{ color: '#64748b' }}>Target: {formatRupiah(target)}</span>
                      </div>

                      <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 11.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Dana Terkumpul:</span>
                          <strong style={{ color: '#047857' }}>{formatRupiah(collected)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                          <span style={{ color: '#64748b' }}>Sisa Dana Dibutuhkan:</span>
                          <strong style={{ color: '#b45309' }}>{formatRupiah(remaining)}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      {!isSelected ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleProjectSelect(p.id);
                            handleTabChange('OVERVIEW');
                          }}
                          className="btn btn-sm"
                          style={{
                            width: '100%',
                            padding: '7px 12px',
                            borderRadius: 6,
                            background: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: 12,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          Pantau di Ringkasan Utama <ChevronRight size={14} />
                        </button>
                      ) : (
                        <div style={{ textAlign: 'center', fontSize: 12, color: '#047857', fontWeight: 650, padding: '6px 0' }}>
                          Sedang ditampilkan di Kartu KPI Dashboard
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 4px 0',
          fontSize: 12,
          color: '#64748b',
          borderTop: '1px solid #f1f5f9',
          marginTop: 10,
        }}
      >
        <div>
          Status data: <strong>Tersinkronisasi Otomatis (Live)</strong>
        </div>
        <div>
          Pembaruan terakhir: <strong>{lastUpdated}</strong>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
