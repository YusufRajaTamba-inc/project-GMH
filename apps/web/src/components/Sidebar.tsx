import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  DollarSign,
  Building2,
  Globe,
  Calendar,
  Heart,
  Package,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { canAccessPayroll } from '../state/auth';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  requirePayroll?: boolean;
  isExternal?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Utama',
    items: [
      { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: '/' },
    ],
  },
  {
    label: 'Keanggotaan',
    items: [
      { icon: <Users size={16} />, label: 'Data Anggota & Alumni', path: '/members' },
      { icon: <UserPlus size={16} />, label: 'Verifikasi Pendaftaran', path: '/registrations', badge: 3 },
    ],
  },
  {
    label: 'Keuangan Yayasan',
    items: [
      { icon: <DollarSign size={16} />, label: 'Kas Operasional', path: '/finance/operational' },
      { icon: <Heart size={16} />, label: 'Donasi & Janji Iman', path: '/finance/donations' },
      { icon: <Building2 size={16} />, label: 'Proyek Yayasan', path: '/building' },
      // Modul Penggajian (Payroll) disembunyikan untuk operasional admin staff harian
    ],
  },
  {
    label: 'Program Yayasan',
    items: [
      { icon: <Globe size={16} />, label: 'Pelayanan Misi', path: '/missions' },
      { icon: <Calendar size={16} />, label: 'Program & Persekutuan', path: '/programs' },
      { icon: <Heart size={16} />, label: 'Permohonan Doa', path: '/prayer', badge: 7 },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { icon: <Package size={16} />, label: 'Inventaris & Aset', path: '/assets' },
      { icon: <BarChart3 size={16} />, label: 'Laporan', path: '/reports' },
      { icon: <Settings size={16} />, label: 'Sistem Utility', path: '/utility' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed] = useState(false);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <img
            src="/logo-yayasan.png"
            alt="Logo Yayasan GMH"
            style={{ width: 34, height: 34, objectFit: 'contain' }}
          />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Global Mission House</div>
            <div className="sidebar-brand-sub">PA KMK USU · Yayasan</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              // Hide payroll items if no access
              if (item.requirePayroll && !canAccessPayroll(user.role)) return null;

              const active =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => {
                    if (item.isExternal) {
                      window.open(item.path, '_blank');
                    } else {
                      navigate(item.path);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="sidebar-item-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.department}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
