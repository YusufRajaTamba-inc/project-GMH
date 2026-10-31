import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages - Aplikasi Yayasan GMH PA KMK
import DashboardPage from './features/dashboard/DashboardPage';
import MembersPage from './features/members/MembersPage';
import MemberDetailPage from './features/members/MemberDetailPage';
import RegistrationsPage from './features/registration/RegistrationsPage';
import PublicRegistrationPage from './features/registration/PublicRegistrationPage';
import VerifyReceiptPage from './features/finance/VerifyReceiptPage';
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

import { useAuth } from './state/AuthContext';
import { canAccessPayroll } from './state/auth';

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
  '/reports': { title: 'Laporan', subtitle: 'Laporan keuangan, demografi, dan statistik yayasan' },
  '/utility': { title: 'Sistem Utility', subtitle: 'Konfigurasi label, dropdown, dan field dinamis' },
};

const App: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Public self-registration route (accessible standalone without admin frame)
  if (location.pathname === '/register' || location.pathname === '/formulir-pendaftaran') {
    return <PublicRegistrationPage />;
  }

  // Public receipt validation route (accessible standalone via QR scan)
  if (location.pathname === '/verify-receipt') {
    return <VerifyReceiptPage />;
  }

  let meta = PAGE_META[location.pathname];
  if (!meta && location.pathname.startsWith('/members/')) {
    if (location.pathname.endsWith('/edit')) {
      meta = { title: 'Ubah Data Anggota', subtitle: 'Formulir pembaruan biodata, akademik, kontak, dan karier anggota' };
    } else {
      meta = { title: 'Profil & Detail Anggota', subtitle: 'Informasi lengkap data anggota, donasi, dan riwayat pelayanan' };
    }
  }
  meta = meta ?? { title: 'GMH PA KMK' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MemberDetailPage />} />
            <Route path="/members/:id/edit" element={<MemberEditPage />} />
            <Route path="/registrations" element={<RegistrationsPage />} />
            <Route path="/finance/operational" element={<FinanceOperationalPage />} />
            <Route path="/finance/donations" element={<DonationsPage />} />
            <Route path="/building" element={<BuildingProjectPage />} />
            <Route path="/payroll" element={
              canAccessPayroll(user.role)
                ? <PayrollPage />
                : <AccessDenied />
            } />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/prayer" element={<PrayerPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/utility" element={<UtilityPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AccessDenied: React.FC = () => (
  <div className="empty-state">
    <div className="empty-state-icon" style={{ fontSize: 48 }}>🔒</div>
    <h3>Modul Disembunyikan (Khusus Pengurus Yayasan Inti)</h3>
    <p>
      Modul Penggajian (Payroll) bersifat rahasia dan disembunyikan dari operasional staf admin harian.<br />
      Hanya Pengurus Yayasan Inti yang berwenang mengelola data penggajian staf yayasan.
    </p>
  </div>
);

export default App;
