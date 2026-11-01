import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Calendar,
  UserCheck,
  Package,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface NotificationItem {
  id: string;
  rawId: string;
  type: 'PROGRAM' | 'REGISTRATION' | 'ASSET_LOAN';
  title: string;
  category?: string;
  description: string;
  date?: string;
  daysLeft?: number;
  badgeText: string;
  badgeType: 'urgent' | 'warning' | 'info';
  targetUrl: string;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, programs: 0, registrations: 0, loans: 0 });
  const [activeTab, setActiveTab] = useState<'ALL' | 'PROGRAM' | 'REGISTRATION' | 'ASSET_LOAN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.notifications || []);
        setCounts(res.counts || { total: 0, programs: 0, registrations: 0, loans: 0 });
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredList = notifications.filter((item) => {
    const matchTab = activeTab === 'ALL' || item.type === activeTab;
    const matchSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchSearch;
  });

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2>Pusat Notifikasi & Pengingat Operasional Yayasan</h2>
          <p>
            Pemantauan langsung agenda kegiatan mendekati waktu (H-5), berkas pendaftaran mandiri yang perlu diverifikasi, dan tenggat peminjaman sarana aset.
          </p>
        </div>
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadNotifications}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Perbarui Notifikasi</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          className="card"
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            border: activeTab === 'ALL' ? '2px solid #0f172a' : '1px solid var(--gmh-border)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#f1f5f9',
                color: '#0f172a',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Notifikasi Aktif</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{counts.total}</div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('PROGRAM')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            border: activeTab === 'PROGRAM' ? '2px solid #0284c7' : '1px solid var(--gmh-border)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#f0f9ff',
                color: '#0284c7',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kegiatan (≤ 5 Hari)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7' }}>{counts.programs}</div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('REGISTRATION')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            border: activeTab === 'REGISTRATION' ? '2px solid #16a34a' : '1px solid var(--gmh-border)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Verifikasi Pendaftaran</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>{counts.registrations}</div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => setActiveTab('ASSET_LOAN')}
          style={{
            padding: '16px 20px',
            cursor: 'pointer',
            border: activeTab === 'ASSET_LOAN' ? '2px solid #d97706' : '1px solid var(--gmh-border)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#fffbeb',
                color: '#d97706',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Peminjaman Aset</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{counts.loans}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card">
        {/* Filter Tabs & Search Header */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'Semua Notifikasi', count: counts.total },
              { key: 'PROGRAM', label: 'Kegiatan Mendekati (≤ 5 Hari)', count: counts.programs },
              { key: 'REGISTRATION', label: 'Verifikasi Pendaftar', count: counts.registrations },
              { key: 'ASSET_LOAN', label: 'Peminjaman Aset', count: counts.loans },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className="btn btn-sm"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  background: activeTab === tab.key ? 'var(--gmh-green)' : 'var(--gmh-bg-alt, #f8fafc)',
                  color: activeTab === tab.key ? '#ffffff' : 'var(--gmh-text)',
                  border: activeTab === tab.key ? '1px solid var(--gmh-green)' : '1px solid var(--gmh-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: activeTab === tab.key ? '#ffffff' : '#475569',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari notifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input form-input-sm"
              style={{ width: 220, paddingLeft: 32, fontSize: 12.5 }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gmh-text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* List Content */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLoading && notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gmh-text-muted)' }}>
              Memuat data notifikasi...
            </div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
              <CheckCircle2 size={40} style={{ color: '#cbd5e1', marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#475569' }}>
                Tidak Ada Notifikasi Aktif Pada Kategori Ini
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Semua data operasional telah ditangani atau tidak ada jadwal mendekati waktu.
              </div>
            </div>
          ) : (
            filteredList.map((item) => {
              const isProgram = item.type === 'PROGRAM';
              const isReg = item.type === 'REGISTRATION';

              const icon = isProgram ? <Calendar size={20} /> : isReg ? <UserCheck size={20} /> : <Package size={20} />;
              const iconColor = isProgram ? '#0284c7' : isReg ? '#16a34a' : '#d97706';
              const iconBg = isProgram ? '#f0f9ff' : isReg ? '#f0fdf4' : '#fffbeb';

              return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '16px 20px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: iconBg,
                        color: iconColor,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {icon}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 750,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: item.badgeType === 'urgent' ? '#fee2e2' : item.badgeType === 'warning' ? '#fef3c7' : '#ecfdf5',
                            color: item.badgeType === 'urgent' ? '#991b1b' : item.badgeType === 'warning' ? '#92400e' : '#047857',
                            border: `1px solid ${item.badgeType === 'urgent' ? '#fecaca' : item.badgeType === 'warning' ? '#fde68a' : '#a7f3d0'}`,
                          }}
                        >
                          {item.badgeText}
                        </span>
                        {item.category && (
                          <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                            {item.category}
                          </span>
                        )}
                      </div>

                      <div style={{ color: '#475569', fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
                        {item.description}
                      </div>

                      {item.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                          <Clock size={12} />
                          <span>Jadwal / Waktu: {item.date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(item.targetUrl)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                    >
                      <span>Buka Halaman</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
