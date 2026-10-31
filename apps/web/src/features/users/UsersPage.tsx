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
} from 'lucide-react';
import { api } from '../../services/api';
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
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
          setRoles(res.roles);
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
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Data Pengguna</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                Kelola data akun pengguna, hak akses modul, dan peran sistem yayasan
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
            </div>
          </div>

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
