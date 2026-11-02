import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { CommitteeRecord } from '../types';

interface OrganizationCommitteesTabProps {
  committees: CommitteeRecord[];
  paginatedCommittees: CommitteeRecord[];
  loadingCommittees: boolean;
  committeeSearch: string;
  setCommitteeSearch: (val: string) => void;
  committeeFilterStatus: string;
  setCommitteeFilterStatus: (val: string) => void;
  committeePage: number;
  setCommitteePage: (page: number) => void;
  committeePageSize: number;
  setCommitteePageSize: (size: number) => void;
  committeeTotalPages: number;
  openNewCommitteeModal: () => void;
  openEditCommitteeModal: (c: CommitteeRecord) => void;
  deleteCommittee: (id: string) => Promise<void>;
}

export const OrganizationCommitteesTab: React.FC<OrganizationCommitteesTabProps> = ({
  committees,
  paginatedCommittees,
  loadingCommittees,
  committeeSearch,
  setCommitteeSearch,
  committeeFilterStatus,
  setCommitteeFilterStatus,
  committeePage,
  setCommitteePage,
  committeePageSize,
  setCommitteePageSize,
  committeeTotalPages,
  openNewCommitteeModal,
  openEditCommitteeModal,
  deleteCommittee,
}) => {
  const navigate = useNavigate();

  return (
    <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
      {/* Header & Controls Toolbar */}
      <header className="org-section-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Log Record Riwayat Kepanitiaan & Pelayanan Anggota
            </h2>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12 }}>
              Pencatatan riwayat keterlibatan anggota yayasan dalam panitia natal, retret, pokja pembangunan, dan event pelayanan lainnya.
            </p>
          </div>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 650, whiteSpace: 'nowrap' }}>
            Order: Created At DESC
          </span>
        </div>

        <div className="org-toolbar-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              aria-label="Cari kepanitiaan"
              placeholder="Cari panitia / anggota..."
              value={committeeSearch}
              onChange={(e) => setCommitteeSearch(e.target.value)}
              className="form-input form-input-sm"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <select
            value={committeeFilterStatus}
            onChange={(e) => setCommitteeFilterStatus(e.target.value)}
            className="form-select form-select-sm"
            style={{ fontSize: 12.5, height: 34, flex: '1 1 130px', minWidth: 120, boxSizing: 'border-box' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Aktif Melayani</option>
            <option value="SELESAI">Selesai / Demisioner</option>
          </select>

          <button
            type="button"
            className="btn btn-primary btn-sm org-btn-mobile-full"
            onClick={openNewCommitteeModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} /> Catat Kepanitiaan
          </button>
        </div>
      </header>

      {loadingCommittees ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          Memuat data kepanitiaan...
        </div>
      ) : paginatedCommittees.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          <Calendar size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
          <div style={{ fontWeight: 650, color: '#334155' }}>Belum ada record kepanitiaan yang dicatat</div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Klik tombol "Catat Kepanitiaan" untuk mencatat kepanitiaan yang pernah diemban oleh anggota.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop View Table (> 768px) */}
          <div className="desktop-only-table">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 125 }}>Dicatat Pada</th>
                    <th>Nama Anggota (Relasi Anggota)</th>
                    <th>Kepanitiaan / Event</th>
                    <th style={{ width: 160 }}>Posisi / Jabatan</th>
                    <th style={{ width: 110 }}>Tahun / Periode</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th>Keterangan / Tanggung Jawab</th>
                    <th style={{ width: 85, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCommittees.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(row.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                          {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#0f172a', fontSize: 13 }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${row.member_id}`)}
                            title="Buka Profil Anggota & Alumni"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontWeight: 650,
                              color: '#047857',
                              fontSize: 13,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textAlign: 'left',
                            }}
                          >
                            <span>{row.member_name}</span>
                            <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                          <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                            {row.member_number}
                          </span>
                          {row.faculty && <span>{row.faculty} {row.graduation_year ? `'${String(row.graduation_year).slice(-2)}` : ''}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#1e293b', fontSize: 13 }}>
                          {row.committee_name}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>
                          {row.role_title}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                        {row.period || row.event_year || '—'}
                      </td>
                      <td>
                        {row.status === 'AKTIF' ? (
                          <span style={{ fontSize: 11, fontWeight: 750, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                            Selesai
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                        {row.description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => openEditCommitteeModal(row)}
                            title="Edit Record"
                            style={{ padding: '4px 6px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => void deleteCommittee(row.id)}
                            title="Hapus Record"
                            style={{ padding: '4px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
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

          {/* Mobile View Cards (<= 768px) */}
          <div className="mobile-only-cards">
            {paginatedCommittees.map((row) => (
              <div key={row.id} className="mobile-record-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${row.member_id}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        fontWeight: 700,
                        color: '#047857',
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        textAlign: 'left',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span>{row.member_name}</span>
                      <ExternalLink size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                    </button>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 3 }}>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                        {row.member_number}
                      </span>
                      {row.faculty && <span>{row.faculty} {row.graduation_year ? `'${String(row.graduation_year).slice(-2)}` : ''}</span>}
                    </div>
                  </div>
                  {row.status === 'AKTIF' ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Aktif
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Selesai
                    </span>
                  )}
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Kepanitiaan:</span>
                    <span style={{ fontWeight: 650, color: '#0f172a', textAlign: 'right' }}>{row.committee_name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Posisi / Jabatan:</span>
                    <span style={{ fontWeight: 650, color: '#047857', textAlign: 'right' }}>{row.role_title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Periode:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{row.period || row.event_year || '—'}</span>
                  </div>
                  {row.description && (
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6, color: '#475569', fontSize: 11.5, lineHeight: 1.4 }}>
                      {row.description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => openEditCommitteeModal(row)}
                      style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => void deleteCommittee(row.id)}
                      style={{ padding: '5px 10px', fontSize: 12, color: '#b91c1c', borderColor: '#fecaca', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
        <Pagination
          currentPage={committeePage}
          totalPages={committeeTotalPages}
          totalItems={committees.length}
          pageSize={committeePageSize}
          onPageChange={setCommitteePage}
          onPageSizeChange={setCommitteePageSize}
        />
      </div>
    </section>
  );
};
