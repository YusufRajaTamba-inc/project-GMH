import React, { useState, useEffect, useMemo } from 'react';
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
  Sliders,
  Award,
  Mail,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';

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
      { icon: <Award size={16} />, label: 'Struktur & Kepengurusan', path: '/organization' },
    ],
  },
  {
    label: 'Keuangan Yayasan',
    items: [
      { icon: <DollarSign size={16} />, label: 'Kas Operasional', path: '/finance/operational' },
      { icon: <Heart size={16} />, label: 'Donasi & Janji Iman', path: '/finance/donations' },
      { icon: <Building2 size={16} />, label: 'Proyek Yayasan', path: '/building' },
      { icon: <DollarSign size={16} />, label: 'Penggajian (Payroll)', path: '/payroll' },
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
      { icon: <Mail size={16} />, label: 'Sekretariat', path: '/secretariat' },
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
      {
        icon: <Settings size={16} />,
        label: 'Pengaturan Sistem',
        path: '/settings',
        subItems: [
          { icon: <UserCog size={14} />, label: 'Data Pengguna', path: '/users' },
          { icon: <Sliders size={14} />, label: 'Sistem Utility', path: '/utility' },
        ],
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const { user, logout, isRouteAllowed } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed] = useState(false);

  // Filter sections and items based on signed permissions
  const visibleSections = useMemo(() => {
    return navSections
      .map((section) => {
        const visibleItems = section.items
          .map((item) => {
            if (item.subItems && item.subItems.length > 0) {
              const visibleSubItems = item.subItems.filter((sub) => isRouteAllowed(sub.path));
              if (visibleSubItems.length === 0) return null;
              return { ...item, subItems: visibleSubItems };
            }
            if (!isRouteAllowed(item.path)) return null;
            return item;
          })
          .filter((item): item is NavItem => item !== null);

        if (visibleItems.length === 0) return null;
        return { ...section, items: visibleItems };
      })
      .filter((section): section is NavSection => section !== null);
  }, [isRouteAllowed]);

  // Keep submenu open if currently on that route
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/reports': true,
    '/settings': true,
  });

  useEffect(() => {
    if (location.pathname.startsWith('/reports')) {
      setOpenMenus((prev) => ({ ...prev, '/reports': true }));
    }
    if (
      location.pathname.startsWith('/users') ||
      location.pathname.startsWith('/utility') ||
      location.pathname.startsWith('/settings')
    ) {
      setOpenMenus((prev) => ({ ...prev, '/settings': true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (item: NavItem) => {
    setOpenMenus((prev) => {
      const willOpen = !prev[item.path];
      const isSubActive =
        item.subItems &&
        item.subItems.some(
          (s) =>
            location.pathname === s.path ||
            (s.path !== '/' && location.pathname.startsWith(s.path)) ||
            (s.path === '/reports/ringkasan' && location.pathname === '/reports')
        );
      if (willOpen && !isSubActive && item.subItems && item.subItems.length > 0) {
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
        {visibleSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {

              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isAnySubActive =
                hasSubItems &&
                item.subItems!.some(
                  (s) =>
                    location.pathname === s.path ||
                    (s.path !== '/' && location.pathname.startsWith(s.path)) ||
                    (s.path === '/reports/ringkasan' && location.pathname === '/reports')
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
                          (sub.path !== '/' && location.pathname.startsWith(sub.path)) ||
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
        <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div className="sidebar-user-avatar">{user.initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info" style={{ minWidth: 0, overflow: 'hidden' }}>
                <div className="sidebar-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div className="sidebar-user-role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.department}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            title="Keluar dari akun (Logout)"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
