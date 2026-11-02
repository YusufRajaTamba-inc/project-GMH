import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  History,
  ExternalLink,
} from 'lucide-react';
import type { Division } from '../types';

interface OrganizationDivisionsTabProps {
  divisions: Division[];
  loadingDivisions: boolean;
  openNewDivisionModal: () => void;
  openEditDivisionModal: (d: Division) => void;
  deleteDivision: (id: string) => Promise<void>;
  openDivisionMembersModal: (d: Division) => void;
  openAddDivisionMemberModal: (d: Division) => void;
}

export const OrganizationDivisionsTab: React.FC<OrganizationDivisionsTabProps> = ({
  divisions,
  loadingDivisions,
  openNewDivisionModal,
  openEditDivisionModal,
  deleteDivision,
  openDivisionMembersModal,
  openAddDivisionMemberModal,
}) => {
  const navigate = useNavigate();

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <div
        className="org-section-header"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          background: '#ffffff',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Divisi & Departemen Pelayanan Yayasan
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              Divisi dapat ditambah secara dinamis. Setiap divisi mengelola daftar anggota bertugas dan riwayat pejabat/alumni divisi.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm org-btn-mobile-full"
            onClick={openNewDivisionModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
          >
            <Plus size={14} /> Tambah Divisi Baru
          </button>
        </div>
      </div>

      {loadingDivisions ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          Memuat daftar divisi dari database...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {divisions.map((div) => (
            <div
              key={div.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 18,
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>
                      {div.id}
                    </span>
                    <h3 style={{ margin: '6px 0 0', fontSize: 15.5, fontWeight: 750, color: '#0f172a' }}>
                      {div.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => openEditDivisionModal(div)}
                      title="Ubah Divisi"
                      style={{ padding: '3px 6px' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => void deleteDivision(div.id)}
                      title="Hapus Divisi"
                      style={{ padding: '3px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12.5, lineHeight: 1.45 }}>
                  {div.description || 'Tidak ada deskripsi rincian tugas divisi.'}
                </p>
              </div>

              {/* Koordinator Divisi Box */}
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>
                  Koordinator / Ketua Divisi:
                </div>
                {div.head_name ? (
                  <div style={{ marginTop: 4, fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                    {div.head_member_id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/members/${div.head_member_id}`)}
                        title="Buka Profil Anggota & Alumni"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          fontWeight: 700,
                          color: '#047857',
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          textAlign: 'left',
                        }}
                      >
                        <span>{div.head_name}</span>
                        <ExternalLink size={11} style={{ opacity: 0.7 }} />
                      </button>
                    ) : (
                      <span>{div.head_name}</span>
                    )}
                    {div.head_phone && <span style={{ fontWeight: 400, color: '#64748b', fontSize: 11.5 }}> · {div.head_phone}</span>}
                  </div>
                ) : (
                  <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                    Belum ditetapkan
                  </div>
                )}
              </div>

              {/* Stats Counter & Kelola Anggota Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  <strong style={{ color: '#047857' }}>{div.active_members_count}</strong> aktif · <strong>{div.total_history_count}</strong> riwayat
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => openDivisionMembersModal(div)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 8px' }}
                  >
                    <History size={12} /> Riwayat & Anggota
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => openAddDivisionMemberModal(div)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 8px' }}
                  >
                    <Plus size={12} /> Tugaskan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
