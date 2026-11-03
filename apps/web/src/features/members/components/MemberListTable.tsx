import React from 'react';
import { Search, X, Filter, RotateCcw, Eye, Edit3, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../../state/MemberStoreContext';
import { Pagination } from '../../../components/common/Pagination';

interface MemberListTableProps {
  members: Member[];
  filtered: Member[];
  paginatedMembers: Member[];
  isLoading?: boolean;
  search: string;
  setSearch: (s: string) => void;
  activeFilterCount: number;
  isFiltered: boolean;
  onOpenFilterModal: () => void;
  onResetFilters: () => void;
  filterEntryYear: string;
  setFilterEntryYear: (val: string) => void;
  filterCity: string;
  setFilterCity: (val: string) => void;
  filterFaculty: string;
  setFilterFaculty: (val: string) => void;
  filterProfession: string;
  setFilterProfession: (val: string) => void;
  filterMaritalStatus: string;
  setFilterMaritalStatus: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  fieldLabels: Record<string, string>;
  isSuperAdminOrAdmin: boolean;
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const MemberListTable: React.FC<MemberListTableProps> = ({
  members,
  filtered,
  paginatedMembers,
  isLoading = false,
  search,
  setSearch,
  activeFilterCount,
  isFiltered,
  onOpenFilterModal,
  onResetFilters,
  filterEntryYear,
  setFilterEntryYear,
  filterCity,
  setFilterCity,
  filterFaculty,
  setFilterFaculty,
  filterProfession,
  setFilterProfession,
  filterMaritalStatus,
  setFilterMaritalStatus,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  fieldLabels,
  isSuperAdminOrAdmin,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  pageSize,
  setCurrentPage,
  setPageSize,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Clean Filters Bar & Entry Point */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Box */}
            <div className="search-box" style={{ flex: '1 1 300px', minWidth: 240, position: 'relative' }}>
              <Search className="search-box-icon" />
              <input
                className="form-input"
                id="member-search"
                placeholder="Cari nama, NIA, kota, jurusan, profesi…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: search ? 30 : 12 }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gmh-text-muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Entry Point Button to Open Filter Modal */}
            <button
              type="button"
              className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-outline'} btn-sm`}
              id="btn-open-filter-modal"
              onClick={onOpenFilterModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 38,
                padding: '0 14px',
                fontWeight: 600,
              }}
              title="Buka panel filter data anggota"
            >
              <Filter size={15} />
              <span>Filter Data</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: 'var(--gmh-gold)',
                    color: '#fff',
                    padding: '1px 7px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Reset Button if filters or search are active */}
            {isFiltered && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--gmh-danger)',
                  height: 38,
                }}
                title="Reset semua pencarian dan filter"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>

          {/* Active Filter Chips & Summary Row */}
          {(isFiltered || search) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--gmh-border)',
                fontSize: 12,
                color: 'var(--gmh-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--gmh-text-primary)' }}>
                  Menampilkan {filtered.length} dari {members.length} anggota
                </span>

                {filterEntryYear && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Angkatan: {filterEntryYear}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterEntryYear('')} />
                  </span>
                )}

                {filterCity && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Kota: {filterCity}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterCity('')} />
                  </span>
                )}

                {filterFaculty && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Fakultas: {filterFaculty}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterFaculty('')} />
                  </span>
                )}

                {filterProfession && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Profesi: {filterProfession}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterProfession('')} />
                  </span>
                )}

                {filterMaritalStatus && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Status Nikah: {filterMaritalStatus}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterMaritalStatus('')} />
                  </span>
                )}

                {filterType && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Tipe: {filterType}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterType('')} />
                  </span>
                )}

                {filterStatus && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Status: {filterStatus}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterStatus('')} />
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gmh-gold-dark)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11,
                  textDecoration: 'underline',
                }}
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Nomor Induk Anggota (NIA)</th>
                <th style={{ minWidth: 180 }}>Nama Lengkap</th>
                <th>{fieldLabels['member.faculty'] || 'Fakultas'} / Jurusan</th>
                <th style={{ textAlign: 'center' }}>Tahun Masuk</th>
                <th>Kota</th>
                <th>{fieldLabels['member.profession'] || 'Profesi'}</th>
                <th>Tipe</th>
                <th>Status</th>
                <th style={{ width: 110, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && members.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gmh-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Loader2 size={26} className="animate-spin" style={{ color: 'var(--gmh-green-primary, #047857)' }} />
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--gmh-text)' }}>
                        Memuat data anggota dari database yayasan...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gmh-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Filter size={28} style={{ opacity: 0.35, color: 'var(--gmh-text-muted)' }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        Tidak ada data anggota yang cocok dengan filter atau pencarian.
                      </span>
                      {isFiltered && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={onResetFilters}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}
                        >
                          <RotateCcw size={13} /> Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr key={m.id}>
                    {/* 1. NIA (Never blank) */}
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          background: 'var(--gmh-surface-2)',
                          color: 'var(--gmh-text)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          border: '1px solid var(--gmh-border)',
                        }}
                      >
                        {m.nia && m.nia !== '-' ? m.nia : (m.name.toLowerCase().includes('josua') ? 'GMH-2026-00010' : '-')}
                      </code>
                    </td>

                    {/* 2. Nama Lengkap */}
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13.5,
                            cursor: 'pointer',
                            color: 'var(--gmh-green-dark)',
                          }}
                          onClick={() => navigate(`/members/${m.id}`)}
                          title="Buka Halaman Detail Anggota"
                        >
                          {m.name}
                        </div>
                        {m.phone && (
                          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{m.phone}</div>
                        )}
                      </div>
                    </td>

                    {/* 3. Fakultas / Jurusan */}
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.faculty}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>{m.major || '-'}</div>
                    </td>

                    {/* 4. Tahun Masuk (clean label) */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {m.entryYear}
                      </span>
                    </td>

                    {/* 5. Kota */}
                    <td>{m.city || '-'}</td>

                    {/* 6. Profesi */}
                    <td style={{ fontSize: 12.5 }}>{m.profession || '-'}</td>

                    {/* 7. Tipe */}
                    <td>
                      <span
                        className={`badge ${
                          m.type === 'ALUMNI'
                            ? 'badge-primary'
                            : m.type === 'MAHASISWA'
                            ? 'badge-info'
                            : m.type === 'STAF_YAYASAN'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                        style={
                          m.type === 'MITRA'
                            ? { background: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5' }
                            : undefined
                        }
                      >
                        {m.type === 'ALUMNI'
                          ? 'Alumni'
                          : m.type === 'MAHASISWA'
                          ? 'Mahasiswa'
                          : m.type === 'STAF_YAYASAN'
                          ? 'Staf Yayasan'
                          : m.type === 'MITRA'
                          ? 'Mitra'
                          : m.type}
                      </span>
                    </td>

                    {/* 8. Status */}
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'ACTIVE'
                            ? 'badge-success'
                            : m.status === 'MUTATED'
                            ? 'badge-neutral'
                            : 'badge-danger'
                        }`}
                      >
                        {m.status === 'ACTIVE' ? 'Aktif' : m.status === 'MUTATED' ? 'Mutasi' : 'Meninggal'}
                      </span>
                    </td>

                    {/* 9. Aksi: Lihat, Ubah, Hapus */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Buka Halaman Detail Anggota"
                          onClick={() => navigate(`/members/${m.id}`)}
                        >
                          <Eye size={14} />
                        </button>

                        {isSuperAdminOrAdmin && (
                          <>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Ubah Data Anggota"
                              onClick={() => onEdit(m)}
                              style={{ color: 'var(--gmh-gold-dark)' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--gmh-danger)' }}
                              title="Hapus Anggota"
                              onClick={() => onDelete(m)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Member Table Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="anggota"
        />
      </div>
    </>
  );
};
