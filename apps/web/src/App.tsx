import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages - Aplikasi Yayasan GMH PA KMK
import DashboardPage from './features/dashboard/DashboardPage';
import MembersPage from './features/members/MembersPage';
import MemberDetailPage from './features/members/MemberDetailPage';
import RegistrationsPage from './features/registration/RegistrationsPage';
import PublicRegistrationPage from './features/registration/PublicRegistrationPage';
import VerifyReceiptPage from './features/finance/VerifyReceiptPage';
import PublicAssetLoanPage from './features/assets/PublicAssetLoanPage';
import FinanceOperationalPage from './features/finance/FinanceOperationalPage';
import DonationsPage from './features/finance/DonationsPage';
import BuildingProjectPage from './features/building/BuildingProjectPage';
import PayrollPage from './features/payroll/PayrollPage';
import MissionsPage from './features/missions/MissionsPage';
import ProgramsPage from './features/programs/ProgramsPage';
import PrayerPage from './features/prayer/PrayerPage';
import AssetsPage from './features/assets/AssetsPage';
import ReportsPage from './features/reports/ReportsPage';
import UtilityPage from './features/utility/UtilityPage';
import MemberEditPage from './features/members/MemberEditPage';
import UsersPage from './features/users/UsersPage';
import OrganizationPage from './features/organization/OrganizationPage';
import SecretariatPage from './features/secretariat/SecretariatPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import AuditLogsPage from './features/audit/AuditLogsPage';

import LoginPage from './features/auth/LoginPage';
import { useAuth } from './state/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Selamat datang di Sistem Informasi Yayasan GMH PA KMK' },
  '/members': { title: 'Data Anggota & Alumni', subtitle: 'Database anggota dan alumni PA KMK USU' },
  '/registrations': { title: 'Verifikasi Pendaftaran', subtitle: 'Tinjau dan setujui pendaftar baru' },
  '/finance/operational': { title: 'Kas Operasional', subtitle: 'Manajemen kas dan belanja kantor yayasan' },
  '/finance/donations': { title: 'Donasi & Janji Iman', subtitle: 'Pencatatan donasi dan komitmen janji iman pembangunan' },
  '/building': { title: 'Proyek Yayasan', subtitle: 'Monitoring progres fisik, fundraising, dan tahapan proyek strategis yayasan' },
  '/payroll': { title: 'Penggajian (Payroll)', subtitle: 'Manajemen gaji staf dan honorarium misionaris' },
  '/missions': { title: 'Pelayanan Misi', subtitle: 'Koordinasi pos pelayanan misi dan pekabar Injil' },
  '/programs': { title: 'Program & Persekutuan', subtitle: 'Jadwal program, seminar, dan persekutuan alumni' },
  '/prayer': { title: 'Permohonan Doa', subtitle: 'Kelola permohonan doa dari komunitas alumni' },
  '/assets': { title: 'Inventaris & Aset', subtitle: 'Katalog aset dan fasilitas Rumah Persekutuan' },
  '/secretariat': { title: 'Sekretariat & Persuratan', subtitle: 'Penerbitan surat keluar nomor otomatis, pencatatan surat masuk, dan lembar disposisi resmi GMH' },
  '/reports': { title: 'Laporan', subtitle: 'Laporan keuangan, keanggotaan, dan demografi yayasan' },
  '/reports/ringkasan': { title: 'Laporan · Ringkasan Eksekutif', subtitle: 'Ikhtisar dan arus kas yayasan' },
  '/reports/keuangan': { title: 'Laporan · Keuangan', subtitle: 'Akun dan transaksi keuangan yayasan' },
  '/reports/anggota': { title: 'Laporan · Keanggotaan & Demografi', subtitle: 'Statistik anggota, alumni, sebaran fakultas USU, dan domisili' },
  '/reports/demografi': { title: 'Laporan · Keanggotaan & Demografi', subtitle: 'Statistik anggota, alumni, sebaran fakultas USU, dan domisili' },
  '/organization': { title: 'Struktur & Kepengurusan', subtitle: 'Direktori kepanitiaan anggota, pengurus inti yayasan, staf full-time, dan divisi pelayanan' },
  '/settings': { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi akun pengguna dan utilitas sistem yayasan' },
  '/users': { title: 'Pengaturan · Data Pengguna', subtitle: 'Kelola data pengguna dan hak akses sistem' },
  '/utility': { title: 'Pengaturan · Sistem Utility', subtitle: 'Konfigurasi label, dropdown, dan field dinamis' },
  '/notifications': { title: 'Pusat Notifikasi Operasional', subtitle: 'Monitoring kegiatan H-5, verifikasi pendaftaran mandiri, dan pengembalian aset yayasan' },
  '/audit-logs': { title: 'Jejak Audit Sistem', subtitle: 'Rekam siapa, kapan, dan apa yang diubah pada seluruh modul yayasan' },
};

const ProtectedRoute: React.FC<{ path: string; element: React.ReactElement }> = ({ path, element }) => {
  const { isRouteAllowed, user } = useAuth();
  if (!isRouteAllowed(path)) {
    return <AccessDenied path={path} roleName={user.department || user.role} />;
  }
  return element;
};

const App: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-close mobile sidebar when user navigates
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Public self-registration route (accessible standalone without admin frame)
  if (location.pathname === '/register' || location.pathname === '/formulir-pendaftaran') {
    return <PublicRegistrationPage />;
  }

  // Public asset loan request & tracking route (accessible standalone without admin frame)
  if (location.pathname === '/pinjam-aset' || location.pathname === '/loan-request' || location.pathname === '/formulir-pinjam') {
    return <PublicAssetLoanPage />;
  }

  // Public receipt validation route (accessible standalone via QR scan)
  if (location.pathname === '/verify-receipt') {
    return <VerifyReceiptPage />;
  }

  // While checking session cookie on initial load
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Yayasan Global Mission House</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Memeriksa sesi login terenkripsi...</div>
        </div>
      </div>
    );
  }

  // Explicit login route or unauthenticated state
  if (location.pathname === '/login') {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <LoginPage />;
  }

  // Protect backoffice: If not authenticated, require login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  let meta = PAGE_META[location.pathname];
  if (location.pathname === '/') {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'ministry') {
      meta = { title: 'Dashboard · Tren Pelayanan & Misi', subtitle: 'Monitoring frekuensi ibadah, pembinaan, misi, dan aksi sosial yayasan' };
    } else if (tab === 'growth') {
      meta = { title: 'Dashboard · Pertumbuhan Anggota', subtitle: 'Tren pendaftaran anggota baru dan sebaran fakultas asal USU' };
    } else if (tab === 'projects') {
      meta = { title: 'Dashboard · Portofolio Proyek Fisik', subtitle: 'Monitoring progres fisik, fundraising, dan tahapan proyek strategis yayasan' };
    } else {
      meta = { title: 'Dashboard · Ringkasan Eksekutif', subtitle: 'Ikhtisar operasional, keuangan kas yayasan, proyek fisik, dan pastoral care' };
    }
  } else if (!meta && location.pathname.startsWith('/members/')) {
    if (location.pathname.endsWith('/edit')) {
      meta = { title: 'Ubah Data Anggota', subtitle: 'Formulir pembaruan biodata, akademik, kontak, dan karier anggota' };
    } else {
      meta = { title: 'Profil & Detail Anggota', subtitle: 'Informasi lengkap data anggota, donasi, dan riwayat pelayanan' };
    }
  }
  meta = meta ?? { title: 'GMH PA KMK' };

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="main-content">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute path="/" element={<DashboardPage />} />} />
            <Route path="/members" element={<ProtectedRoute path="/members" element={<MembersPage />} />} />
            <Route path="/members/:id" element={<ProtectedRoute path="/members" element={<MemberDetailPage />} />} />
            <Route path="/members/:id/edit" element={<ProtectedRoute path="/members" element={<MemberEditPage />} />} />
            <Route path="/registrations" element={<ProtectedRoute path="/registrations" element={<RegistrationsPage />} />} />
            <Route path="/organization" element={<ProtectedRoute path="/organization" element={<OrganizationPage />} />} />
            <Route path="/finance/operational" element={<ProtectedRoute path="/finance/operational" element={<FinanceOperationalPage />} />} />
            <Route path="/finance/donations" element={<ProtectedRoute path="/finance/donations" element={<DonationsPage />} />} />
            <Route path="/building" element={<ProtectedRoute path="/building" element={<BuildingProjectPage />} />} />
            <Route path="/payroll" element={<ProtectedRoute path="/payroll" element={<PayrollPage />} />} />
            <Route path="/missions" element={<ProtectedRoute path="/missions" element={<MissionsPage />} />} />
            <Route path="/programs" element={<ProtectedRoute path="/programs" element={<ProgramsPage />} />} />
            <Route path="/prayer" element={<ProtectedRoute path="/prayer" element={<PrayerPage />} />} />
            <Route path="/assets" element={<ProtectedRoute path="/assets" element={<AssetsPage />} />} />
            <Route path="/secretariat" element={<ProtectedRoute path="/secretariat" element={<SecretariatPage />} />} />
            <Route path="/reports" element={<Navigate to="/reports/ringkasan" replace />} />
            <Route path="/reports/*" element={<ProtectedRoute path="/reports" element={<ReportsPage />} />} />
            <Route path="/settings" element={<Navigate to="/users" replace />} />
            <Route path="/users" element={<ProtectedRoute path="/users" element={<UsersPage />} />} />
            <Route path="/utility" element={<ProtectedRoute path="/utility" element={<UtilityPage />} />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<ProtectedRoute path="/audit-logs" element={<AuditLogsPage />} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AccessDenied: React.FC<{ path: string; roleName: string }> = ({ path, roleName }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        maxWidth: 580,
        margin: '40px auto',
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #fee2e2',
        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <ShieldAlert size={34} />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
        Akses Ditolak (403 Forbidden)
      </h2>

      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
        Peran Anda (<strong>{roleName}</strong>) tidak memiliki hak akses untuk membuka halaman{' '}
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#0f172a' }}>
          {path}
        </code>
        .
      </p>

      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 12.5,
          color: '#475569',
          textAlign: 'left',
          width: '100%',
          marginBottom: 24,
          lineHeight: 1.5,
        }}
      >
        🔒 <strong>Keamanan Terenkripsi:</strong> Seluruh menu dan endpoint API dilindungi matriks izin berbasis database dengan tanda tangan kriptografis HMAC-SHA256. Akses hanya dapat diberikan oleh Administrator sistem.
      </div>

      <button
        onClick={() => navigate('/')}
        className="btn btn-primary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </button>
    </div>
  );
};

export default App;
