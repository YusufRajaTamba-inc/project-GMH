import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  History,
  ExternalLink,
} from 'lucide-react';
import type { OrgPosition } from '../types';

interface OrganizationPositionsTabProps {
  categorizedPositions: Record<string, OrgPosition[]>;
  loadingPositions: boolean;
  openNewPositionModal: () => void;
  openEditPositionModal: (p: OrgPosition) => void;
  deletePosition: (id: string) => Promise<void>;
  openHistoryModal: (p: OrgPosition) => void;
  openAssignTenureModal: (p: OrgPosition) => void;
}

export const OrganizationPositionsTab: React.FC<OrganizationPositionsTabProps> = ({
  categorizedPositions,
  loadingPositions,
  openNewPositionModal,
  openEditPositionModal,
  deletePosition,
  openHistoryModal,
  openAssignTenureModal,
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
              Susunan Struktur Kepengurusan Yayasan GMH Inti
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              Struktur jabatan dibuat dinamis. Setiap jabatan dapat dilihat riwayat siapa saja yang pernah menjabat dari periode ke periode.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm org-btn-mobile-full"
            onClick={openNewPositionModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, fontSize: 12.5 }}
          >
            <Plus size={14} /> Tambah Jabatan Baru
          </button>
        </div>
      </div>

      {loadingPositions ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          Memuat susunan kepengurusan dari database...
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Category Groups */}
          {[
            { key: 'DEWAN_PEMBINA', label: '1. Dewan Pembina Yayasan', badge: 'Penjaga Visi & Doktrin', color: '#1e3a8a', bg: '#eff6ff' },
            { key: 'DEWAN_PENGAWAS', label: '2. Dewan Pengawas Yayasan', badge: 'Tata Kelola & Audit Aset', color: '#7c2d12', bg: '#fff7ed' },
            { key: 'PENGURUS_HARIAN', label: '3. Dewan Pengurus Harian (Badan Pelaksana)', badge: 'Eksekutif Operasional', color: '#065f46', bg: '#ecfdf5' },
            { key: 'LAINNYA', label: '4. Posisi Struktur Lainnya', badge: 'Struktural Khusus', color: '#475569', bg: '#f8fafc' },
          ].map((cat) => {
            const groupPositions = categorizedPositions[cat.key] || [];
            if (groupPositions.length === 0 && cat.key === 'LAINNYA') return null;

            return (
              <div key={cat.key} style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#ffffff', overflow: 'hidden' }}>
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
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{cat.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: '3px 9px', borderRadius: 99 }}>
                    {cat.badge}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 14, padding: 16 }}>
                  {groupPositions.map((pos: OrgPosition) => (
                    <div
                      key={pos.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 9,
                        padding: 16,
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12,
                        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 750, color: '#0f172a' }}>
                              {pos.title}
                            </h3>
                            <code style={{ fontSize: 10.5, color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>
                              {pos.position_code}
                            </code>
                          </div>

                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => openEditPositionModal(pos)}
                              title="Ubah Jabatan & Fungsi"
                              style={{ padding: '3px 6px' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => void deletePosition(pos.id)}
                              title="Hapus Jabatan"
                              style={{ padding: '3px 6px', color: '#b91c1c', borderColor: '#fecaca' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Job function */}
                        <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.45 }}>
                          {pos.function_description || 'Belum ada rincian tugas dan fungsi jabatan yang diisi.'}
                        </p>
                      </div>

                      {/* Current Holder Card */}
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: pos.current_member_name ? '#f0fdf4' : '#fffbeb',
                          border: `1px solid ${pos.current_member_name ? '#bbf7d0' : '#fde68a'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pos.current_member_name ? '#15803d' : '#b45309', textTransform: 'uppercase' }}>
                            Pejabat Aktif ({pos.current_period || 'Periode Belum Ditugaskan'})
                          </span>
                          {pos.current_member_name && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>
                              Aktif
                            </span>
                          )}
                        </div>

                        {pos.current_member_name ? (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontWeight: 750, color: '#0f172a', fontSize: 13.5 }}>
                              <button
                                type="button"
                                onClick={() => pos.current_member_id && navigate(`/members/${pos.current_member_id}`)}
                                title="Buka Profil Anggota & Alumni"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  padding: 0,
                                  fontWeight: 750,
                                  color: '#047857',
                                  fontSize: 13.5,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  textAlign: 'left',
                                }}
                              >
                                <span>{pos.current_member_name}</span>
                                <ExternalLink size={12} style={{ opacity: 0.7 }} />
                              </button>
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', gap: 6, marginTop: 2 }}>
                              <span>{pos.current_member_number}</span>
                              {pos.current_member_phone && <span>· {pos.current_member_phone}</span>}
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: 4, fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>
                            Belum ada anggota yang ditugaskan menjabat periode ini.
                          </div>
                        )}
                      </div>

                      {/* Action Footer: History & Tugaskan */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                          paddingTop: 8,
                          borderTop: '1px solid #f1f5f9',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openHistoryModal(pos)}
                          title={`Lihat Riwayat Jabatan (${pos.total_tenures_count})`}
                          style={{
                            flex: '1 1 110px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '5px 6px',
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <History size={12} style={{ flexShrink: 0 }} />
                          <span>Riwayat ({pos.total_tenures_count})</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => openAssignTenureModal(pos)}
                          title="Tugaskan Pejabat ke Posisi Ini"
                          style={{
                            flex: '1 1 120px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            fontSize: 11,
                            padding: '5px 6px',
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Plus size={12} style={{ flexShrink: 0 }} />
                          <span>Tugaskan Pejabat</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
