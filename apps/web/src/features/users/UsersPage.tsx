import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Power,
  ArrowLeft,
  Save,
  Shield,
  Info,
  CheckCircle,
  RefreshCw,
  X,
  ShieldCheck,
  Lock,
  Check,
  RotateCcw,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { api, type SystemModuleInfo, type RolePermissionMatrixItem } from '../../services/api';
import { useAuth } from '../../state/AuthContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  phone_number?: string;
  full_name: string;
  role_id: string;
  role_name?: string;
  role_description?: string;
  position_title?: string;
  birth_date?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number }>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // View state: 'list' | 'form'
  const [view, setView] = useState<'list' | 'form'>('list');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Form State (for Add or Edit)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formRoleId, setFormRoleId] = useState('SUPER_ADMIN');
  const [formPositionTitle, setFormPositionTitle] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal
  const [detailUser, setDetailUser] = useState<SystemUser | null>(null);

  // Tab 2: Hak Akses Role (RBAC) State
  const { user: currentUser, refreshProfile } = useAuth();
  const [mainTab, setMainTab] = useState<'users' | 'permissions'>('users');
  const [selectedRole, setSelectedRole] = useState<string>('SUPER_ADMIN');
  const [matrixData, setMatrixData] = useState<RolePermissionMatrixItem[]>([]);
  const [modulesList, setModulesList] = useState<SystemModuleInfo[]>([]);
  const [rolePermsMap, setRolePermsMap] = useState<Record<string, boolean>>({});
  const [isSavingPerms, setIsSavingPerms] = useState<boolean>(false);
  const [activeSignature, setActiveSignature] = useState<string>('');
  const [activeIntegrityHash, setActiveIntegrityHash] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isPermsLoading, setIsPermsLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadPermissions = async () => {
    setIsPermsLoading(true);
    try {
      const res = await api.users.getPermissionsMatrix();
      if (res && res.success) {
        if (res.roles) {
          const cleanRoles = (res.roles as SystemRole[]).filter((r: SystemRole) => !['ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA'].includes(r.id));
          setRoles(cleanRoles);
        }
        if (res.modules) setModulesList(res.modules);
        if (res.permissions) {
          setMatrixData(res.permissions);
          const initialMap: Record<string, boolean> = {};
          res.permissions
            .filter((p) => p.role_id === selectedRole)
            .forEach((p) => {
              initialMap[p.module_key] = p.can_access;
            });
          setRolePermsMap(initialMap);
          setHasUnsavedChanges(false);
        }
      }
    } catch (err: any) {
      showToast('Gagal memuat matriks hak akses: ' + err.message);
    } finally {
      setIsPermsLoading(false);
    }
  };

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    const map: Record<string, boolean> = {};
    matrixData
      .filter((p) => p.role_id === roleId)
      .forEach((p) => {
        map[p.module_key] = p.can_access;
      });
    setRolePermsMap(map);
    setHasUnsavedChanges(false);
  };

  const handleToggleModule = (modKey: string) => {
    if (selectedRole === 'SUPER_ADMIN' && (modKey === 'USERS' || modKey === 'DASHBOARD')) {
      alert('Modul USERS dan DASHBOARD tidak dapat dinonaktifkan untuk Super Admin demi menjaga akses sistem.');
      return;
    }
    setRolePermsMap((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
    setHasUnsavedChanges(true);
  };

  const handleSelectAll = () => {
    const map: Record<string, boolean> = {};
    modulesList.forEach((m) => {
      map[m.key] = true;
    });
    setRolePermsMap(map);
    setHasUnsavedChanges(true);
  };

  const handleDeselectAll = () => {
    const map: Record<string, boolean> = {};
    modulesList.forEach((m) => {
      if (selectedRole === 'SUPER_ADMIN' && (m.key === 'USERS' || m.key === 'DASHBOARD')) {
        map[m.key] = true;
      } else {
        map[m.key] = false;
      }
    });
    setRolePermsMap(map);
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    try {
      const res = await api.users.updateRolePermissions(selectedRole, rolePermsMap);
      if (res && res.success) {
        showToast(res.message || 'Hak akses berhasil disimpan dan ditandatangani HMAC-SHA256.');
        if (res.permissions) {
          setActiveSignature(res.permissions.signature);
          setActiveIntegrityHash(res.permissions.integrityHash);
        }
        setHasUnsavedChanges(false);
        await loadPermissions();
        if (currentUser.role === selectedRole) {
          await refreshProfile();
        }
      }
    } catch (err: any) {
      alert('Gagal menyimpan hak akses: ' + err.message);
    } finally {
      setIsSavingPerms(false);
    }
  };

  const getRoleAllowedCount = (roleId: string) => {
    if (roleId === selectedRole && hasUnsavedChanges) {
      return Object.values(rolePermsMap).filter(Boolean).length;
    }
    return matrixData.filter((p) => p.role_id === roleId && p.can_access).length;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.users.getAll();
      if (res) {
        setUsers(res.users || res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.roles) {
          const cleanRoles = (res.roles as SystemRole[]).filter((r: SystemRole) => !['ANGGOTA_ALUMNI', 'ALUMNI_ANGGOTA'].includes(r.id));
          setRoles(cleanRoles);
        }
      }
    } catch (err: any) {
      showToast('Gagal memuat data pengguna: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    void loadPermissions();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole !== 'ALL' && u.role_id !== filterRole) return false;
      if (filterStatus === 'ACTIVE' && !u.is_active) return false;
      if (filterStatus === 'INACTIVE' && u.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (u.full_name || '').toLowerCase().includes(q);
        const matchUser = (u.username || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone_number || '').toLowerCase().includes(q);
        const matchRole = (u.role_name || '').toLowerCase().includes(q);
        const matchPos = (u.position_title || '').toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchEmail && !matchPhone && !matchRole && !matchPos) return false;
      }
      return true;
    });
  }, [users, filterRole, filterStatus, search]);

  // Pagination for user list
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedUsers,
  } = usePagination(filteredUsers, { initialPageSize: 10 });

  // Open Form to Add User
  const handleAddNew = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormBirthDate('');
    setFormRoleId(roles[0]?.id || 'SUPER_ADMIN');
    setFormPositionTitle('');
    setFormIsActive(true);
    setView('form');
  };

  // Open Form to Edit User
  const handleEdit = (u: SystemUser) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormFullName(u.full_name);
    setFormEmail(u.email);
    setFormPhone(u.phone_number || '');
    setFormPassword('');
    setFormBirthDate(u.birth_date ? u.birth_date.split('T')[0] : '');
    setFormRoleId(u.role_id);
    setFormPositionTitle(u.position_title || '');
    setFormIsActive(u.is_active);
    setView('form');
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim() || !formEmail.trim() || !formRoleId) {
      alert('Username, Nama Lengkap, Email, dan Role wajib diisi.');
      return;
    }

    if (!editingUserId && !formPassword.trim()) {
      alert('Password awal wajib diisi untuk pengguna baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        await api.users.update(editingUserId, {
          username: formUsername.trim(),
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phoneNumber: formPhone.trim() || null,
          password: formPassword.trim() || undefined,
          birthDate: formBirthDate || null,
          roleId: formRoleId,
          positionTitle: formPositionTitle.trim() || null,
          isActive: formIsActive,
        });
        showToast(`Data pengguna "${formFullName.trim()}" berhasil diperbarui!`);
      } else {
        await api.users.create({
          username: formUsername.trim(),
          fullName: formFullName.trim(),
          email: formEmail.trim(),
          phoneNumber: formPhone.trim() || null,
          password: formPassword.trim(),
          birthDate: formBirthDate || null,
          roleId: formRoleId,
          positionTitle: formPositionTitle.trim() || null,
          isActive: formIsActive,
        });
        showToast(`Akun pengguna baru "${formFullName.trim()}" berhasil didaftarkan!`);
      }
      setView('list');
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan data pengguna: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (u: SystemUser) => {
    try {
      const res = await api.users.toggleStatus(u.id);
      showToast(res.message || 'Status pengguna berhasil diubah.');
      await loadData();
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Handle Delete User
  const handleDelete = async (u: SystemUser) => {
    if (u.username === 'superadmin') {
      alert('Akun Super Admin sistem utama tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus akun pengguna "${u.full_name}" (@${u.username})?`)) {
      return;
    }

    try {
      await api.users.delete(u.id);
      showToast(`Pengguna "${u.full_name}" berhasil dihapus.`);
      await loadData();
    } catch (err: any) {
      alert('Gagal menghapus pengguna: ' + err.message);
    }
  };

  // Role Description Helper for Selected Role in Form
  const selectedRoleDesc = useMemo(() => {
    const found = roles.find((r) => r.id === formRoleId);
    return found ? found.description : 'Hak akses standar sistem yayasan';
  }, [roles, formRoleId]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 1: DAFTAR PENGGUNA (DATA PENGGUNA) */}
      {/* ==================================================================== */}
      {view === 'list' && (
        <div>
          {/* Header */}
          <div
            className="page-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div className="page-header-text">
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {mainTab === 'users' ? 'Data Pengguna' : 'Pengaturan Hak Akses Role (RBAC)'}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                {mainTab === 'users'
                  ? 'Kelola data akun pengguna, peran sistem, dan status akses backoffice yayasan'
                  : 'Konfigurasi hak akses modul per peran dengan tanda tangan kriptografis HMAC-SHA256'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {mainTab === 'users' ? (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={loadData}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAddNew}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 14px',
                      fontWeight: 600,
                    }}
                  >
                    <Plus size={15} /> Tambah Pengguna
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={loadPermissions}
                    disabled={isPermsLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={14} className={isPermsLoading ? 'spin' : ''} /> Segarkan Matriks
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSavePermissions}
                    disabled={isSavingPerms}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: hasUnsavedChanges ? '#16a34a' : '#0f172a',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 16px',
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    <Save size={15} /> {isSavingPerms ? 'Menyimpan...' : 'Simpan Hak Akses'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setMainTab('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontWeight: 650,
                fontSize: 13.5,
                border: 'none',
                background: mainTab === 'users' ? '#0f172a' : '#f1f5f9',
                color: mainTab === 'users' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={16} /> Data Pengguna & Akun ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setMainTab('permissions');
                if (modulesList.length === 0) {
                  void loadPermissions();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                fontWeight: 650,
                fontSize: 13.5,
                border: 'none',
                background: mainTab === 'permissions' ? '#0f172a' : '#f1f5f9',
                color: mainTab === 'permissions' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Shield size={16} /> Pengaturan Hak Akses Role (RBAC)
              {hasUnsavedChanges && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginLeft: 2 }} />
              )}
            </button>
          </div>

          {mainTab === 'users' ? (
            <div>

          {/* 3 Top Summary KPI Cards (Matching Screenshot 1) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Total Pengguna */}
            <div
              style={{
                ...cardStyle,
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
                  TOTAL PENGGUNA
                </div>
                <div style={{ fontSize: 28, fontWeight: 750, color: '#0f172a', marginTop: 4 }}>
                  {stats.total || users.length}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>pengguna terdaftar</div>
              </div>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#f1f5f9',
                  color: '#0284c7',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Users size={22} />
              </span>
            </div>

            {/* Pengguna Aktif */}
            <div
              style={{
                ...cardStyle,
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 0.5 }}>
                  AKTIF
                </div>
                <div style={{ fontSize: 28, fontWeight: 750, color: '#16a34a', marginTop: 4 }}>
                  {stats.active || users.filter((u) => u.is_active).length}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>pengguna aktif</div>
              </div>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <UserCheck size={22} />
              </span>
            </div>

            {/* Pengguna Non-Aktif */}
            <div
              style={{
                ...cardStyle,
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: 0.5 }}>
                  NON-AKTIF
                </div>
                <div style={{ fontSize: 28, fontWeight: 750, color: '#dc2626', marginTop: 4 }}>
                  {stats.inactive || users.filter((u) => !u.is_active).length}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>akses dinonaktifkan</div>
              </div>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <UserX size={22} />
              </span>
            </div>
          </div>

          {/* Table Container with Filter Header */}
          <div style={cardStyle}>
            {/* Filter and Search Bar */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Cari nama atau email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
                  />
                </div>

                {/* Filter Role */}
                <select
                  className="form-select"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  style={{ width: 190, fontSize: 12.5, height: 34 }}
                >
                  <option value="ALL">Semua Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: 140, fontSize: 12.5, height: 34 }}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Hanya Aktif</option>
                  <option value="INACTIVE">Hanya Non-Aktif</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: '#64748b' }}>
                Menampilkan <strong>{filteredUsers.length}</strong> pengguna
              </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>NAMA</th>
                    <th>EMAIL</th>
                    <th>NO. HP</th>
                    <th>ROLE</th>
                    <th>POSISI</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                    <th>TANGGAL DIBUAT</th>
                    <th style={{ textAlign: 'center', width: 120 }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                        Memuat data pengguna dari sistem...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#94a3b8' }}>
                        Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 650, color: '#0f172a' }}>{u.full_name}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                            <code>@{u.username}</code>
                          </div>
                        </td>
                        <td style={{ color: '#334155' }}>{u.email}</td>
                        <td style={{ color: '#334155' }}>{u.phone_number || '—'}</td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: '#f1f5f9',
                              color: '#334155',
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {u.role_name || u.role_id}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: 12.5 }}>{u.position_title || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: 12,
                              background: u.is_active ? '#dcfce7' : '#fee2e2',
                              color: u.is_active ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {u.is_active ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                            {/* View Detail */}
                            <button
                              type="button"
                              onClick={() => setDetailUser(u)}
                              title="Lihat detail akun"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleEdit(u)}
                              title="Ubah data pengguna"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#0284c7',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Toggle Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              title={u.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: u.is_active ? '#eab308' : '#16a34a',
                                cursor: 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Power size={15} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              title="Hapus akun"
                              disabled={u.username === 'superadmin'}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: u.username === 'superadmin' ? '#cbd5e1' : '#dc2626',
                                cursor: u.username === 'superadmin' ? 'not-allowed' : 'pointer',
                                padding: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="pengguna"
            />
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* TAB 2: PENGATURAN HAK AKSES PERAN (RBAC) */
        /* ==================================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Security Cryptographic Status Card */}
          <div
            style={{
              ...cardStyle,
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: '#0f172a',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    Tanda Tangan Kriptografis HMAC-SHA256 & Anti-Tampering
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#dcfce7',
                      color: '#15803d',
                    }}
                  >
                    Aktif & Terlindungi
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
                  Respons menu otentikasi ditandatangani dengan server secret. Jika klien memodifikasi daftar menu di browser, signature otomatis ditolak dan seluruh API memblokir akses (HTTP 403 Forbidden).
                </p>
              </div>
            </div>

            {activeSignature && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  color: '#0369a1',
                }}
              >
                <KeyRound size={14} />
                <span>Sig: {activeSignature.slice(0, 16)}...</span>
                {activeIntegrityHash && <span style={{ color: '#64748b' }}>| Hash: {activeIntegrityHash.slice(0, 10)}...</span>}
              </div>
            )}
          </div>

          {/* Role Selector Grid */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 10 }}>
              PILIH PERAN (ROLE) YANG INGIN DIATUR:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {roles.map((r) => {
                const isSelected = r.id === selectedRole;
                const count = getRoleAllowedCount(r.id);
                const totalMod = modulesList.length || 16;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    style={{
                      ...cardStyle,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                      background: isSelected ? '#f8fafc' : '#ffffff',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#0f172a' : '#334155' }}>
                        {r.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: count === totalMod ? '#dcfce7' : count > 0 ? '#e0f2fe' : '#fee2e2',
                          color: count === totalMod ? '#15803d' : count > 0 ? '#0369a1' : '#b91c1c',
                        }}
                      >
                        {count}/{totalMod} Modul
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Role Control Bar */}
          {(() => {
            const activeRoleObj = roles.find((r) => r.id === selectedRole);
            const activeAllowedCount = getRoleAllowedCount(selectedRole);
            const totalMod = modulesList.length || 16;

            return (
              <div
                style={{
                  ...cardStyle,
                  padding: '16px 20px',
                  background: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                      Konfigurasi Hak Akses: {activeRoleObj?.name || selectedRole}
                    </h3>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 650,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      {activeAllowedCount} dari {totalMod} Modul Diaktifkan
                    </span>
                    {hasUnsavedChanges && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#b45309',
                          background: '#fef3c7',
                          padding: '2px 8px',
                          borderRadius: 8,
                        }}
                      >
                        <AlertTriangle size={12} /> Ada perubahan belum disimpan
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                    {activeRoleObj?.description || 'Pengaturan akses modul dan batasan API untuk peran ini.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleSelectAll}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                  >
                    <Check size={14} /> Pilih Semua
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleDeselectAll}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                  >
                    <RotateCcw size={14} /> Batalkan Semua
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSavePermissions}
                    disabled={isSavingPerms}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      background: hasUnsavedChanges ? '#16a34a' : '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 16px',
                      fontWeight: 650,
                      cursor: 'pointer',
                    }}
                  >
                    <Save size={14} /> {isSavingPerms ? 'Menyimpan...' : 'Simpan Hak Akses'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Category Modules Accordion / Groups */}
          {[
            { key: 'Utama', label: 'Modul Utama & Eksekutif', icon: '🏛️', desc: 'Ringkasan data, KPI statistik, dan shortcut navigasi sistem' },
            { key: 'Keanggotaan', label: 'Modul Keanggotaan & Kepengurusan', icon: '👥', desc: 'Database jemaat/alumni, pendaftaran mandiri, dan bagan pengurus' },
            { key: 'Keuangan Yayasan', label: 'Modul Keuangan Yayasan', icon: '💰', desc: 'Kas kantor operasional, penerimaan donasi, janji iman, dan penggajian payroll' },
            { key: 'Program Yayasan', label: 'Modul Program & Pelayanan', icon: '🌍', desc: 'Pos pelayanan misi daerah, persekutuan alumni, seminar, dan permohonan doa' },
            { key: 'Manajemen', label: 'Modul Manajemen & Operasional', icon: '📦', desc: 'Inventaris aset yayasan, penomoran persuratan resmi, dan laporan yayasan' },
            { key: 'Pengaturan Sistem', label: 'Modul Pengaturan Sistem & Keamanan', icon: '⚙️', desc: 'Data pengguna login, matriks hak akses, dan utilitas kamus data dinamis' },
          ].map((cat) => {
            const catModules = modulesList.filter((m) => m.category === cat.key);
            if (catModules.length === 0) return null;

            const catAllowedCount = catModules.filter((m) => Boolean(rolePermsMap[m.key])).length;

            return (
              <div key={cat.key} style={{ ...cardStyle, overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{cat.label}</span>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>— {cat.desc}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: catAllowedCount === catModules.length ? '#dcfce7' : catAllowedCount > 0 ? '#e0f2fe' : '#f1f5f9',
                      color: catAllowedCount === catModules.length ? '#15803d' : catAllowedCount > 0 ? '#0369a1' : '#64748b',
                    }}
                  >
                    {catAllowedCount} / {catModules.length} Aktif
                  </span>
                </div>

                <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                  {catModules.map((m) => {
                    const isAllowed = Boolean(rolePermsMap[m.key]);
                    const isSuperAdminLocked = selectedRole === 'SUPER_ADMIN' && (m.key === 'USERS' || m.key === 'DASHBOARD');

                    return (
                      <div
                        key={m.key}
                        style={{
                          border: isAllowed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '12px 14px',
                          background: isAllowed ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 10,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                              {m.label}
                            </div>
                            <code
                              style={{
                                fontSize: 11,
                                background: isAllowed ? '#dcfce7' : '#f1f5f9',
                                color: isAllowed ? '#166534' : '#475569',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontWeight: 600,
                              }}
                            >
                              {m.path}
                            </code>
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                            {m.description}
                          </p>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: 10,
                            borderTop: '1px solid',
                            borderColor: isAllowed ? 'rgba(34, 197, 94, 0.2)' : '#f1f5f9',
                          }}
                        >
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            API: <code style={{ fontSize: 10.5 }}>/api/v1{m.path === '/' ? '/dashboard' : m.path}</code>
                          </div>

                          {isSuperAdminLocked ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: '#0f172a',
                                background: '#e2e8f0',
                                padding: '4px 10px',
                                borderRadius: 6,
                              }}
                            >
                              <Lock size={12} /> Terkunci (Super Admin)
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleModule(m.key)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: isAllowed ? '#15803d' : '#94a3b8',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                }}
                              />
                              {isAllowed ? 'Akses Diizinkan' : 'Akses Ditolak (403)'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}

      {/* ==================================================================== */}
      {/* VIEW 2: FORM TAMBAH / UBAH PENGGUNA (Matching Screenshot 2) */}
      {/* ==================================================================== */}
      {view === 'form' && (
        <div>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {editingUserId ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                {editingUserId
                  ? 'Perbarui data pengguna dan status akses'
                  : 'Isi informasi akun pengguna untuk modul pengaturan sistem'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setView('list')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Kembali ke Daftar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 16px',
                  fontWeight: 600,
                }}
              >
                <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)', gap: 20 }}>
            {/* Left Column: Form Data Pengguna */}
            <div style={{ ...cardStyle, padding: 24 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  Form Data Pengguna
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                  Isi informasi akun pengguna untuk modul pengaturan sistem
                </p>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Bagian: Informasi Akun */}
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    Informasi Akun
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Username <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: CRW2026010 / staf.keuangan"
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Baselius Suni"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Email <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="baseliussuni@gmail.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        No. HP
                      </label>
                      <input
                        type="text"
                        placeholder="+62 82144284551"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {editingUserId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Awal'}
                        {!editingUserId && <span style={{ color: '#dc2626' }}> *</span>}
                      </label>
                      <input
                        type="password"
                        placeholder={editingUserId ? '••••••••' : 'Masukkan password akun'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="form-input"
                        required={!editingUserId}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={formBirthDate}
                        onChange={(e) => setFormBirthDate(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian: Akses & Otoritas */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    Akses
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Role <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={formRoleId}
                        onChange={(e) => setFormRoleId(e.target.value)}
                        required
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        {selectedRoleDesc}
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                        Jabatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Nahkoda / Perwira / Staf IT / Bendahara"
                        value={formPositionTitle}
                        onChange={(e) => setFormPositionTitle(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Status Akses */}
                  <div style={{ marginTop: 14 }}>
                    <label className="form-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      Status Akses Akun
                    </label>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="formIsActive"
                          checked={formIsActive}
                          onChange={() => setFormIsActive(true)}
                        />
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>Aktif</span> (Dapat login)
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="formIsActive"
                          checked={!formIsActive}
                          onChange={() => setFormIsActive(false)}
                        />
                        <span style={{ fontWeight: 600, color: '#dc2626' }}>Non-aktif</span> (Akses diblokir)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setView('list')}
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSubmitting}
                    style={{
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Panduan Pengisian (Matching Screenshot 2) */}
            <div style={{ ...cardStyle, padding: 22, height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Info size={17} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Panduan Pengisian
                </h4>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                Informasi penggunaan data pengguna
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>• Username:</strong> Digunakan untuk login ke sistem yayasan.
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>• Role:</strong> Menentukan hak akses ke modul dan fitur yayasan (RBAC).
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>• No. HP:</strong> Opsional, digunakan untuk keperluan notifikasi operasional & WhatsApp.
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>• Akun Baru:</strong> Akan langsung dapat login menggunakan kredensial yang didaftarkan.
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>• Status Non-aktif:</strong> Menonaktifkan akses tanpa menghapus histori data transaksi pengguna.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL DETAIL PENGGUNA */}
      {/* ==================================================================== */}
      {detailUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={17} color="#0284c7" /> Profil & Hak Akses Pengguna
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setDetailUser(null)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>NAMA LENGKAP</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                  {detailUser.full_name}
                </div>
                <div style={{ fontSize: 12, color: '#0284c7' }}>@{detailUser.username}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{detailUser.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>NO. TELEPON / HP</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{detailUser.phone_number || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ROLE SISTEM</div>
                  <div style={{ fontWeight: 650, color: '#166534', marginTop: 2 }}>
                    {detailUser.role_name || detailUser.role_id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>JABATAN / POSISI</div>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>{detailUser.position_title || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUS AKSES</div>
                  <div style={{ marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: detailUser.is_active ? '#dcfce7' : '#fee2e2',
                        color: detailUser.is_active ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {detailUser.is_active ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TERAKHIR LOGIN</div>
                  <div style={{ fontSize: 12, marginTop: 2, color: '#475569' }}>
                    {detailUser.last_login_at
                      ? new Date(detailUser.last_login_at).toLocaleString('id-ID')
                      : 'Belum pernah login'}
                  </div>
                </div>
              </div>

              {detailUser.role_description && (
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 12, color: '#475569' }}>
                  <strong>Otoritas:</strong> {detailUser.role_description}
                </div>
              )}
            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDetailUser(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const target = detailUser;
                  setDetailUser(null);
                  handleEdit(target);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit2 size={13} /> Ubah Pengguna Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
