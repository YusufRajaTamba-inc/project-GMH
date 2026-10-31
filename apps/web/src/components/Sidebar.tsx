import React, { useState, useEffect } from 'react';
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
  FileBarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { canAccessPayroll } from '../state/auth';

interface NavSubItem {
  icon?: React.ReactNode;
  label: string;
  path: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  requirePayroll?: boolean;
  isExternal?: boolean;
  subItems?: NavSubItem[];
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
      {
        icon: <BarChart3 size={16} />,
        label: 'Laporan',
        path: '/reports',
        subItems: [
          { icon: <FileBarChart2 size={14} />, label: 'Ringkasan', path: '/reports/ringkasan' },
          { icon: <DollarSign size={14} />, label: 'Laporan Keuangan', path: '/reports/keuangan' },
          { icon: <Users size={14} />, label: 'Keanggotaan & Demografi', path: '/reports/anggota' },
        ],
      },
      { icon: <UserCog size={16} />, label: 'Data Pengguna', path: '/users' },
      { icon: <Settings size={16} />, label: 'Sistem Utility', path: '/utility' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed] = useState(false);

  // Keep submenu open if currently on that route
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/reports': true,
  });

  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      setOpenMenus((prev) => ({ ...prev, '/reports': true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (item: NavItem) => {
    setOpenMenus((prev) => {
      const willOpen = !prev[item.path];
      if (willOpen && !location.pathname.startsWith(item.path) && item.subItems && item.subItems.length > 0) {
        navigate(item.subItems[0].path);
      }
      return { ...prev, [item.path]: willOpen };
    });
  };

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

              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isAnySubActive = hasSubItems && item.subItems!.some(
                (s) => location.pathname === s.path || (s.path === '/reports/ringkasan' && location.pathname === '/reports')
              );
              const isOpen = openMenus[item.path] ?? isAnySubActive;
              const active = !hasSubItems && (
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              );

              return (
                <div key={item.path} style={{ marginBottom: 2 }}>
                  <button
                    className={`sidebar-item ${active || (hasSubItems && isAnySubActive) ? 'active' : ''}`}
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubmenu(item);
                      } else if (item.isExternal) {
                        window.open(item.path, '_blank');
                      } else {
                        navigate(item.path);
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <span className="sidebar-item-icon">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="sidebar-item-badge">{item.badge}</span>
                    )}
                    {!collapsed && hasSubItems && (
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', opacity: 0.65 }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                    )}
                  </button>

                  {/* Nested Sub-menus inside parent item */}
                  {!collapsed && hasSubItems && isOpen && (
                    <div
                      style={{
                        paddingLeft: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        marginTop: 2,
                        marginBottom: 6,
                        borderLeft: '1.5px solid rgba(255, 255, 255, 0.1)',
                        marginLeft: 20,
                      }}
                    >
                      {item.subItems!.map((sub) => {
                        const isSubActive =
                          location.pathname === sub.path ||
                          (sub.path === '/reports/ringkasan' && location.pathname === '/reports');

                        return (
                          <button
                            key={sub.path}
                            onClick={() => navigate(sub.path)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '7px 10px',
                              borderRadius: 6,
                              border: 'none',
                              borderLeft: isSubActive ? '2px solid #10b981' : '2px solid transparent',
                              background: isSubActive ? '#1e293b' : 'transparent',
                              color: isSubActive ? '#ffffff' : '#94a3b8',
                              fontSize: 12.5,
                              fontWeight: isSubActive ? 600 : 500,
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }
                            }}
                          >
                            {sub.icon && (
                              <span
                                style={{
                                  color: isSubActive ? '#10b981' : 'inherit',
                                  opacity: isSubActive ? 1 : 0.7,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {sub.icon}
                              </span>
                            )}
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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
