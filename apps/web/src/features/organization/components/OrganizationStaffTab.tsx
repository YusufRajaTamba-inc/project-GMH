import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Briefcase,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import type { StaffMember } from '../types';

interface OrganizationStaffTabProps {
  staffList: StaffMember[];
  loadingStaff: boolean;
  staffSearch: string;
  setStaffSearch: (val: string) => void;
  openNewStaffModal: () => void;
  openEditStaffModal: (s: StaffMember) => void;
  deleteStaff: (id: string) => Promise<void>;
}

export const OrganizationStaffTab: React.FC<OrganizationStaffTabProps> = ({
  staffList,
  loadingStaff,
  staffSearch,
  setStaffSearch,
  openNewStaffModal,
  openEditStaffModal,
  deleteStaff,
}) => {
  const navigate = useNavigate();

  return (
    <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
      {/* Header Controls */}
      <header className="org-section-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            Direktori Staf Penuh Waktu (Full-Time Staff Yayasan)
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
            Pekerja penuh waktu yayasan yang bertanggung jawab menjalankan roda operasional kantor, pemuridan, dan pemeliharaan aset.
          </p>
        </div>

        <div className="org-toolbar-controls" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              aria-label="Cari staf"
              placeholder="Cari nama / posisi staf..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="form-input form-input-sm"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm org-btn-mobile-full"
            onClick={openNewStaffModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5, whiteSpace: 'nowrap' }}
          >
            <Plus size={14} /> Tambah Staf Full-Time
          </button>
        </div>
      </header>

      {loadingStaff ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          Memuat data staf penuh waktu dari database...
        </div>
      ) : staffList.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          <Briefcase size={32} style={{ color: '#cbd5e1', marginBottom: 8 }} />
          <div style={{ fontWeight: 650, color: '#334155' }}>Belum ada data staf penuh waktu</div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Klik tombol "Tambah Staf Full-Time" untuk mendaftarkan staf baru dari basis data anggota.
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
                    <th>Nama Staf (Relasi Anggota)</th>
                    <th style={{ width: 175 }}>Posisi / Pekerjaan</th>
                    <th style={{ width: 175 }}>Departemen / Divisi</th>
                    <th style={{ width: 125 }}>Tgl Bergabung</th>
                    <th style={{ width: 105 }}>Status</th>
                    <th>Tugas & Tanggung Jawab</th>
                    <th style={{ width: 85, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/members/${s.member_id}`)}
                            title="Buka Profil Anggota & Alumni"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: '#047857',
                              fontSize: 13.5,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              textAlign: 'left',
                            }}
                          >
                            <span>{s.member_name}</span>
                            <ExternalLink size={11} style={{ opacity: 0.7 }} />
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, marginTop: 2 }}>
                          <span style={{ fontFamily: 'monospace' }}>{s.member_number}</span>
                          {s.phone_number && <span>· {s.phone_number}</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 650, color: '#0369a1', fontSize: 13 }}>
                          {s.position_title}
                        </div>
                        <span style={{ fontSize: 10.5, color: '#64748b' }}>{s.employment_type}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>
                          {s.department_name || 'Kantor Operasional GMH'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>
                        {s.joined_date
                          ? new Date(s.joined_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        {s.is_active ? (
                          <span style={{ fontSize: 11, fontWeight: 750, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                            Aktif
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                        {s.job_description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => openEditStaffModal(s)}
                            title="Edit Staf"
                            style={{ padding: '4px 6px' }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => void deleteStaff(s.id)}
                            title="Hapus Staf"
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
            {staffList.map((s) => (
              <div key={s.id} className="mobile-record-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${s.member_id}`)}
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
                      <span>{s.member_name}</span>
                      <ExternalLink size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                    </button>
                    <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 3 }}>
                      <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                        {s.member_number}
                      </span>
                      {s.phone_number && <span>· {s.phone_number}</span>}
                    </div>
                  </div>
                  {s.is_active ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Aktif
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 650, padding: '3px 8px', borderRadius: 99, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Non-Aktif
                    </span>
                  )}
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Posisi:</span>
                    <span style={{ fontWeight: 650, color: '#0369a1', textAlign: 'right' }}>{s.position_title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Tipe:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{s.employment_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Departemen:</span>
                    <span style={{ fontWeight: 600, color: '#334155', textAlign: 'right' }}>{s.department_name || 'Kantor Operasional GMH'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: '#64748b' }}>Tgl Bergabung:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {s.joined_date
                        ? new Date(s.joined_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  {s.job_description && (
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 6, color: '#475569', fontSize: 11.5, lineHeight: 1.4 }}>
                      {s.job_description}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 2 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => openEditStaffModal(s)}
                    style={{ padding: '5px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => void deleteStaff(s.id)}
                    style={{ padding: '5px 10px', fontSize: 12, color: '#b91c1c', borderColor: '#fecaca', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
