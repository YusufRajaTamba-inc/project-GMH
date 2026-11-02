import React from 'react';
import {
  Globe,
  Search,
  RefreshCw,
  Plus,
  Lock,
  Trash2,
  FileText,
  ChevronRight,
  User,
  UserPlus,
  MapPin,
  Edit,
} from 'lucide-react';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';
import type { MissionActivity, MissionaryPerson } from '../types';

interface MissionListTabProps {
  activities: MissionActivity[];
  isLoading: boolean;
  fetchActivities: () => void;
  onOpenRintisModal: () => void;
  yayasanMainCash: number;
  search: string;
  setSearch: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterMonth: string;
  setFilterMonth: (s: string) => void;
  filterYear: string;
  setFilterYear: (s: string) => void;
  filteredActivitiesCount: number;
  paginatedActivities: MissionActivity[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setCurrentPage: (p: number) => void;
  setPageSize: (s: number) => void;
  onOpenDashboard: (id: string) => void;
  onDeleteActivity: (act: MissionActivity) => void;
  missionaries: MissionaryPerson[];
  onOpenAddMissionary: () => void;
  onEditMissionary: (m: MissionaryPerson) => void;
  onDeleteMissionary: (m: MissionaryPerson) => void;
  onToggleMissionaryStatus: (m: MissionaryPerson) => void;
}

export const MissionListTab: React.FC<MissionListTabProps> = ({
  activities,
  isLoading,
  fetchActivities,
  onOpenRintisModal,
  yayasanMainCash,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  filteredActivitiesCount,
  paginatedActivities,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  setCurrentPage,
  setPageSize,
  onOpenDashboard,
  onDeleteActivity,
  missionaries,
  onOpenAddMissionary,
  onEditMissionary,
  onDeleteMissionary,
  onToggleMissionaryStatus,
}) => {
  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Pelayanan Misi &amp; Program Kegiatan Terpadu</h2>
          <p>
            Manajemen terpadu agenda misi, pos pelayanan, rundown acara, panitia, serta kantong kas mandiri kegiatan yayasan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchActivities}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Memperbarui…' : 'Segarkan Data'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenRintisModal}
            id="btn-rintis-kegiatan-baru"
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a' }}
          >
            <Plus size={14} /> Rintis Dokumen Kegiatan Baru
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-label">TOTAL KEGIATAN MISI</div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {activities.length} Kegiatan
          </div>
          <div className="stat-card-meta">
            {activities.filter((a) => a.status === 'ON_PROGRESS').length} Sedang Berjalan Aktif
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">TOTAL TAKSASI ANGGARAN</div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {formatRupiah(activities.reduce((s, a) => s + (Number(a.budget_estimate) || 0), 0))}
          </div>
          <div className="stat-card-meta">Estimasi Biaya Program</div>
        </div>

        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-green)',
              '--stat-color-pale': 'var(--gmh-green-pale)',
            } as React.CSSProperties
          }
        >
          <div className="stat-card-label">KAS KANTONG MANDIRI</div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-green)' }}>
            {formatRupiah(activities.reduce((s, a) => s + (Number(a.cash_balance) || 0), 0))}
          </div>
          <div className="stat-card-meta">Saldo di Seluruh Kegiatan</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">SALDO UTAMA KAS YAYASAN</div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-gold)' }}>
            {formatRupiah(yayasanMainCash)}
          </div>
          <div className="stat-card-meta">Siap Disubsidi ke Misi</div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ padding: '12px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
            <Search className="search-box-icon" />
            <input
              className="form-input"
              id="search-missions"
              placeholder="Cari nama kegiatan misi, tema, kordinator, atau lokasi pos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 150 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="ON_PROGRESS">Sedang Berjalan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PLANNING">Perencanaan</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 140 }}
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            <option value="01">Januari (01)</option>
            <option value="02">Februari (02)</option>
            <option value="03">Maret (03)</option>
            <option value="04">April (04)</option>
            <option value="05">Mei (05)</option>
            <option value="06">Juni (06)</option>
            <option value="07">Juli (07)</option>
            <option value="08">Agustus (08)</option>
            <option value="09">September (09)</option>
            <option value="10">Oktober (10)</option>
            <option value="11">November (11)</option>
            <option value="12">Desember (12)</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 120 }}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="">Semua Tahun</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          {(search || filterStatus || filterMonth || filterYear) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterMonth('');
                setFilterYear('');
              }}
              style={{ fontSize: 12, color: '#64748b' }}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* LIST OF MISSION ACTIVITIES */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="var(--gmh-green)" />
            Daftar Kegiatan Pelayanan Misi ({filteredActivitiesCount})
          </div>
          <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
            Klik tombol "Buka Dashboard Terpadu" untuk kelola kas mandiri, rundown &amp; panitia
          </span>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {paginatedActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <Globe size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
              <div>Tidak ada kegiatan pelayanan misi yang sesuai dengan filter pencarian.</div>
            </div>
          ) : (
            paginatedActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 10,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: act.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                          color: act.status === 'COMPLETED' ? '#065f46' : '#92400e',
                        }}
                      >
                        {act.status === 'COMPLETED' ? 'STATUS: SELESAI' : 'STATUS: SEDANG BERJALAN'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                        ID: <code style={{ fontSize: 11 }}>{act.id}</code>
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: '0 0 4px 0',
                        color: 'var(--gmh-text)',
                        cursor: 'pointer',
                      }}
                      onClick={() => onOpenDashboard(act.id)}
                    >
                      {act.title}
                    </h3>
                    {act.theme && (
                      <div style={{ fontSize: 13, color: 'var(--gmh-green-mid)', fontWeight: 500, marginBottom: 4 }}>
                        Tema: "{act.theme}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {act.status === 'COMPLETED' ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled
                        style={{ opacity: 0.45, cursor: 'not-allowed', color: '#94a3b8', borderColor: '#cbd5e1' }}
                        title="Kegiatan misi yang telah Selesai tidak dapat dihapus demi integritas arsip LPJ"
                      >
                        <Lock size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => onDeleteActivity(act)}
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        title="Hapus dokumen kegiatan"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenDashboard(act.id)}
                      id={`btn-open-dashboard-${act.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        padding: '6px 14px',
                        background: '#0f172a',
                      }}
                    >
                      <FileText size={14} /> Buka Dashboard Terpadu <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Summary Bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    background: '#f9fafb',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: 'var(--gmh-text-muted)',
                  }}
                >
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Kordinator Pelayan:</span>
                    <strong style={{ color: 'var(--gmh-text)' }}>{act.coordinator || 'Belum diatur'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Lokasi / Pos:</span>
                    <strong style={{ color: 'var(--gmh-text)' }}>{act.location || 'Belum diatur'}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Waktu Pelaksanaan:</span>
                    <strong style={{ color: 'var(--gmh-text)' }}>{act.time_preview || act.event_date}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Kas Kantong Mandiri:</span>
                    <strong style={{ color: 'var(--gmh-green)', fontSize: 13 }}>
                      {formatRupiah(Number(act.cash_balance))}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Component */}
        <div style={{ padding: '0 20px 16px' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="kegiatan misi"
          />
        </div>
      </div>

      {/* PERSONIL PEKABAR INJIL & POS PELAYANAN (DYNAMIC & RELATE KE ANGGOTA) */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="var(--gmh-gold)" /> Personil Pekabar Injil &amp; Pos Pelayanan ({missionaries.length})
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onOpenAddMissionary}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--gmh-green-dark)' }}
          >
            <UserPlus size={14} /> + Tambah Personil Pekabar Injil
          </button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Pekabar Injil</th>
                <th>Pos Pelayanan</th>
                <th>Wilayah</th>
                <th>Sejak</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {missionaries.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-green-dark)' }}>{m.name}</div>
                      {m.member_id ? (
                        <span style={{ fontSize: 10, color: 'var(--gmh-green)', fontWeight: 600 }}>
                          ✓ Anggota Terdaftar
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>
                          Non-Anggota / Manual
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#1e293b' }}>{m.pos}</strong>
                    {m.contact && <div style={{ fontSize: 11, color: '#64748b' }}>{m.contact}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={12} color="var(--gmh-text-light)" />
                      <span style={{ fontSize: 13 }}>{m.region}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{m.since}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onToggleMissionaryStatus(m)}
                      className={`badge ${m.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Klik untuk ubah status aktif/cuti"
                    >
                      {m.status === 'ACTIVE' ? 'Aktif Melayani' : 'Cuti / Furlough'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onEditMissionary(m)}
                        style={{ padding: '3px 6px', color: '#0284c7' }}
                        title="Edit personil"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDeleteMissionary(m)}
                        style={{ padding: '3px 6px', color: '#dc2626' }}
                        title="Hapus personil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
