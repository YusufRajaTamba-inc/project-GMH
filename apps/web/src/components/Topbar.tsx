import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  Lock,
  Key,
  Calendar,
  UserCheck,
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { ROLE_LABELS } from '../state/auth';
import { api } from '../services/api';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onToggleMobileSidebar?: () => void;
}

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

interface UserProfileData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role_id: string;
  phone_number?: string;
  position_title?: string;
  created_at: string;
  last_login_at?: string;
  role_name?: string;
  role_desc?: string;
}

const Topbar: React.FC<TopbarProps> = ({ title, subtitle, onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'PROGRAM' | 'REGISTRATION' | 'ASSET_LOAN'>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifCounts, setNotifCounts] = useState({
    total: 0,
    programs: 0,
    registrations: 0,
    loans: 0,
  });

  // Profile State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Refs for click outside
  const notifRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------------------------------
  // Fetch Notifications
  // --------------------------------------------------------------------------
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.notifications || []);
        setNotifCounts(res.counts || { total: 0, programs: 0, registrations: 0, loans: 0 });
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Fetch on mount & poll every 60 seconds
  useEffect(() => {
    void loadNotifications();
    const timer = setInterval(() => {
      void loadNotifications();
    }, 60000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // --------------------------------------------------------------------------
  // Fetch Profile Data
  // --------------------------------------------------------------------------
  const openProfileModal = async () => {
    setProfileModalOpen(true);
    setPasswordToast(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setLoadingProfile(true);

    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setProfileData(res.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handle Password Change
  // --------------------------------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordToast(null);

    if (!newPassword || newPassword.trim().length < 6) {
      setPasswordToast({ type: 'error', text: 'Password baru minimal harus 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordToast({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      if (res.success) {
        setPasswordToast({ type: 'success', text: res.message || 'Password akun berhasil diubah dan tersimpan di database.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordToast({ type: 'error', text: res.message || 'Gagal mengubah password.' });
      }
    } catch (err: any) {
      setPasswordToast({ type: 'error', text: err.message || 'Terjadi kesalahan saat mengubah password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === 'ALL') return true;
    return n.type === notifFilter;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    setNotificationsOpen(false);
    navigate(item.targetUrl);
  };

  return (
    <header className="topbar">
      <button
        type="button"
        className="btn btn-ghost btn-icon mobile-menu-toggle"
        onClick={onToggleMobileSidebar}
        aria-label="Buka Menu Navigasi"
        title="Menu Navigasi"
      >
        <Menu size={20} />
      </button>

      <div className="topbar-title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions" style={{ position: 'relative' }}>
        {/* Badge Peran Terverifikasi Pengguna */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 11px',
            background: 'var(--gmh-bg-alt, #f8fafc)',
            border: '1px solid var(--gmh-border, #e2e8f0)',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 650,
            color: '#1e293b',
          }}
          title={`Akun masuk: ${user.name} (${ROLE_LABELS[user.role] || user.role})`}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 6px rgba(16,185,129,0.5)',
            }}
          />
          <span>{ROLE_LABELS[user.role] || user.role}</span>
        </div>

        {/* ================================================================== */}
        {/* NOTIFICATION BELL & DROPDOWN PANEL                                 */}
        {/* ================================================================== */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            id="notification-btn"
            title="Pusat Notifikasi Yayasan"
            aria-label="Notifikasi"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            style={{
              position: 'relative',
              background: notificationsOpen ? '#f1f5f9' : 'transparent',
              color: notificationsOpen ? '#047857' : 'inherit',
            }}
          >
            <Bell size={18} />
            {notifCounts.total > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px #ffffff',
                  animation: 'pulse 2s infinite',
                }}
              >
                {notifCounts.total > 9 ? '9+' : notifCounts.total}
              </span>
            )}
          </button>

          {/* Notification Popover Dropdown */}
          {notificationsOpen && (
            <div
              className="notif-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 440,
                maxWidth: '92vw',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                zIndex: 200,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} color="#047857" />
                  <span style={{ fontWeight: 750, fontSize: 14, color: '#0f172a' }}>
                    Pusat Notifikasi Operasional
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: notifCounts.total > 0 ? '#fee2e2' : '#ecfdf5',
                      color: notifCounts.total > 0 ? '#991b1b' : '#047857',
                    }}
                  >
                    {notifCounts.total} aktif
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  disabled={notifLoading}
                  title="Perbarui notifikasi"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                >
                  <RefreshCw size={13} className={notifLoading ? 'spin' : ''} />
                </button>
              </div>

              {/* Sub-Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '8px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#ffffff',
                  overflowX: 'auto',
                }}
              >
                {[
                  { key: 'ALL', label: 'Semua', count: notifCounts.total },
                  { key: 'PROGRAM', label: 'Kegiatan (≤ 5 Hari)', count: notifCounts.programs },
                  { key: 'REGISTRATION', label: 'Verifikasi', count: notifCounts.registrations },
                  { key: 'ASSET_LOAN', label: 'Pinjaman Aset', count: notifCounts.loans },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setNotifFilter(tab.key as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11.5,
                      fontWeight: notifFilter === tab.key ? 700 : 500,
                      background: notifFilter === tab.key ? '#0f172a' : '#f1f5f9',
                      color: notifFilter === tab.key ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 99,
                        background: notifFilter === tab.key ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        color: notifFilter === tab.key ? '#ffffff' : '#475569',
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8, display: 'grid', gap: 6 }}>
                {notifLoading && notifications.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>
                    Memuat notifikasi dari database...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>
                    <CheckCircle2 size={32} style={{ color: '#cbd5e1', marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 650, color: '#475569' }}>Tidak ada notifikasi aktif</div>
                    <div style={{ fontSize: 11.5, marginTop: 2 }}>Semua kegiatan, pendaftaran, dan peminjaman aset telah tertangani.</div>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    // Visual styling based on category
                    const isProgram = n.type === 'PROGRAM';
                    const isReg = n.type === 'REGISTRATION';

                    const icon = isProgram ? <Calendar size={15} /> : isReg ? <UserCheck size={15} /> : <Package size={15} />;
                    const iconColor = isProgram ? '#0369a1' : isReg ? '#047857' : '#b45309';
                    const iconBg = isProgram ? '#f0f9ff' : isReg ? '#ecfdf5' : '#fef3c7';

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 8,
                          border: '1px solid #f1f5f9',
                          background: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#f1f5f9';
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
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

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', lineHeight: 1.35 }}>
                              {n.title}
                            </div>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 750,
                                padding: '2px 7px',
                                borderRadius: 99,
                                flexShrink: 0,
                                background: n.badgeType === 'urgent' ? '#fee2e2' : n.badgeType === 'warning' ? '#fef3c7' : '#ecfdf5',
                                color: n.badgeType === 'urgent' ? '#991b1b' : n.badgeType === 'warning' ? '#92400e' : '#047857',
                                border: `1px solid ${n.badgeType === 'urgent' ? '#fecaca' : n.badgeType === 'warning' ? '#fde68a' : '#a7f3d0'}`,
                              }}
                            >
                              {n.badgeText}
                            </span>
                          </div>

                          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 11.5, lineHeight: 1.4 }}>
                            {n.description}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: '#047857', fontWeight: 650 }}>
                            <span>Buka Halaman</span>
                            <ChevronRight size={12} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  id="btn-open-notifications-page"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/notifications');
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: 12.5,
                  }}
                >
                  <Bell size={14} />
                  <span>Buka Halaman Notifikasi</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* USER PROFILE AVATAR TRIGGER (SA)                                   */}
        {/* ================================================================== */}
        <div
          className="sidebar-user-avatar"
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => void openProfileModal()}
          title="Klik untuk melihat profil akun & ubah password"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {user.initials}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* USER PROFILE & CHANGE PASSWORD MODAL                                 */}
      {/* ==================================================================== */}
      {profileModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15,23,42,0.5)', zIndex: 1000 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: 560,
              width: '92%',
              padding: 24,
              borderRadius: 14,
              background: '#ffffff',
              boxShadow: '0 20px 40px rgba(15,23,42,0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: '#ecfdf5',
                    color: '#047857',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <User size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: '#0f172a' }}>
                    Profil Pengguna & Keamanan Akun
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Informasi identitas akun dan fasilitas pembaruan kata sandi
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Notification alert within modal */}
            {passwordToast && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: passwordToast.type === 'success' ? '#065f46' : '#991b1b',
                  background: passwordToast.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${passwordToast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                }}
              >
                {passwordToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{passwordToast.text}</span>
              </div>
            )}

            {loadingProfile ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Memuat data profil pengguna dari database...
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20 }}>
                {/* 1. Profile Info Card (Lihat Nama Pengguna) */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#0f172a',
                      color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 20,
                      fontWeight: 750,
                      letterSpacing: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {user.initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 750, color: '#0f172a' }}>
                        {profileData?.full_name || user.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        {profileData?.role_name || user.role}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                      Nama Pengguna (Username):{' '}
                      <code
                        style={{
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        @{profileData?.username || (user as any).username || 'superadmin'}
                      </code>
                    </div>

                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Email: <strong>{profileData?.email || 'admin@gmhpakmk.org'}</strong>
                      {profileData?.phone_number && <span> · No. Telp: {profileData.phone_number}</span>}
                    </div>
                  </div>
                </div>

                {/* 2. Ubah Password Form */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <Lock size={15} color="#047857" />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 750, color: '#0f172a' }}>
                      Ubah Kata Sandi (Password Akun)
                    </h4>
                  </div>

                  <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12, fontWeight: 650 }}>
                        Password Lama
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan password akun saat ini..."
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="form-input form-input-sm"
                        style={{ fontSize: 12.5 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 12, fontWeight: 650 }}>
                          Password Baru <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimal 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="form-input form-input-sm"
                          style={{ fontSize: 12.5 }}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: 12, fontWeight: 650 }}>
                          Konfirmasi Password Baru <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Ketik ulang password baru"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="form-input form-input-sm"
                          style={{ fontSize: 12.5 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{showPassword ? 'Sembunyikan karakter' : 'Tampilkan karakter'}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
                      >
                        {savingPassword ? (
                          <>
                            <RefreshCw size={13} className="spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Key size={13} />
                            <span>Simpan Password Baru</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={async () => {
                  setProfileModalOpen(false);
                  await logout();
                }}
              >
                <LogOut size={13} />
                <span>Keluar dari Akun (Logout)</span>
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setProfileModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
