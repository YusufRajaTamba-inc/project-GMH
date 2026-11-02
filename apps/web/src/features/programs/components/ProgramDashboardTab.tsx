import React from 'react';
import {
  Clock,
  MapPin,
  User,
  ArrowLeft,
  DollarSign,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  CheckCircle2,
  FileText,
  Calendar,
  CheckCircle,
  FileDown,
  Loader2,
} from 'lucide-react';
import NominalInput from '../../../components/NominalInput';
import type { Program } from '../types';
import { CATEGORY_BADGE, CATEGORY_LABEL, formatRupiah } from '../types';

interface ProgramDashboardTabProps {
  activeProgram: Program;
  setActiveProgram: (p: Program | null) => void;
  setViewMode: (mode: 'list' | 'dashboard') => void;
  setEditingProgram: (p: Program | null) => void;
  handleDownloadPDF: () => void;
  isExportingPDF: boolean;
  handleToggleStatus: () => void;
  handleDeleteProgram: () => void;
  toastMsg: string | null;
  yayasanMainCash: number;

  // Agenda & Tasks
  activeTabAgenda: 'rundown' | 'tasks';
  setActiveTabAgenda: (t: 'rundown' | 'tasks') => void;
  formRundown: { time: string; pic: string; note: string };
  setFormRundown: React.Dispatch<React.SetStateAction<{ time: string; pic: string; note: string }>>;
  handleAddRundown: (e: React.FormEvent) => void;
  handleDeleteRundown: (id: string) => void;
  formTask: { task: string; pic: string; estimated_cost: string | number };
  setFormTask: React.Dispatch<React.SetStateAction<{ task: string; pic: string; estimated_cost: string | number }>>;
  handleAddTask: (e: React.FormEvent) => void;
  handleToggleTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;

  // Cash Ledger & Subsidi
  formEntryCash: {
    type: 'IN' | 'OUT';
    category: string;
    description: string;
    amount: number | string;
    date: string;
  };
  setFormEntryCash: React.Dispatch<React.SetStateAction<{
    type: 'IN' | 'OUT';
    category: string;
    description: string;
    amount: number | string;
    date: string;
  }>>;
  handleAddCashEntry: (e: React.FormEvent) => void;
  formTransferSubsidi: {
    type: 'AMBIL_SUBSIDI' | 'SETOR_SISA';
    amount: number | string;
    notes: string;
  };
  setFormTransferSubsidi: React.Dispatch<React.SetStateAction<{
    type: 'AMBIL_SUBSIDI' | 'SETOR_SISA';
    amount: number | string;
    notes: string;
  }>>;
  handleTransferSubsidi: (e: React.FormEvent) => void;
  handleDeleteTransaction: (id: string) => void;

  // Committee
  formCommittee: {
    role: string;
    name: string;
    contact: string;
    member_id: string;
    isManual: boolean;
  };
  setFormCommittee: React.Dispatch<React.SetStateAction<{
    role: string;
    name: string;
    contact: string;
    member_id: string;
    isManual: boolean;
  }>>;
  handleAddCommittee: (e: React.FormEvent) => void;
  handleDeleteCommittee: (id: string) => void;
  committeeSearchQuery: string;
  setCommitteeSearchQuery: (q: string) => void;
  showCommitteeDropdown: boolean;
  setShowCommitteeDropdown: (show: boolean) => void;
  filteredCommitteeMembers: any[];
}

export const ProgramDashboardTab: React.FC<ProgramDashboardTabProps> = ({
  activeProgram,
  setActiveProgram,
  setViewMode,
  setEditingProgram,
  handleDownloadPDF,
  isExportingPDF,
  handleToggleStatus,
  handleDeleteProgram,
  toastMsg,
  yayasanMainCash,
  activeTabAgenda,
  setActiveTabAgenda,
  formRundown,
  setFormRundown,
  handleAddRundown,
  handleDeleteRundown,
  formTask,
  setFormTask,
  handleAddTask,
  handleToggleTask,
  handleDeleteTask,
  formEntryCash,
  setFormEntryCash,
  handleAddCashEntry,
  formTransferSubsidi,
  setFormTransferSubsidi,
  handleTransferSubsidi,
  handleDeleteTransaction,
  formCommittee,
  setFormCommittee,
  handleAddCommittee,
  handleDeleteCommittee,
  committeeSearchQuery,
  setCommitteeSearchQuery,
  showCommitteeDropdown,
  setShowCommitteeDropdown,
  filteredCommitteeMembers,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* TOP NAV & ACTIONS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingBottom: 4,
        }}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            setViewMode('list');
            setActiveProgram(null);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <ArrowLeft size={15} /> Kembali ke Daftar Program
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setEditingProgram({ ...activeProgram })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Edit size={14} /> Edit Rincian
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            title="Langsung unduh dan simpan dokumen PDF ke perangkat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              opacity: isExportingPDF ? 0.75 : 1,
              cursor: isExportingPDF ? 'wait' : 'pointer',
            }}
          >
            {isExportingPDF ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Menyiapkan PDF…
              </>
            ) : (
              <>
                <FileDown size={14} /> Unduh Laporan PDF
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleToggleStatus}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: activeProgram.status === 'COMPLETED' ? '#b45309' : '#047857',
              borderColor: activeProgram.status === 'COMPLETED' ? '#fde68a' : '#a7f3d0',
            }}
          >
            <CheckCircle2 size={14} />
            {activeProgram.status === 'COMPLETED' ? 'Buka Kembali Program' : 'Tandai Terlaksana'}
          </button>

          {activeProgram.status === 'COMPLETED' ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled
              style={{
                opacity: 0.45,
                cursor: 'not-allowed',
                color: '#94a3b8',
                borderColor: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="Program yang telah selesai tidak dapat dihapus demi integritas arsip yayasan"
            >
              <Lock size={14} /> Terkunci (Selesai)
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleDeleteProgram}
              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            >
              <Trash2 size={14} /> Hapus
            </button>
          )}

          <span
            style={{
              fontSize: 11.5,
              padding: '4px 8px',
              background: '#f3f4f6',
              borderRadius: 6,
              color: '#4b5563',
              fontFamily: 'monospace',
            }}
          >
            ID: {activeProgram.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* MAIN HERO CARD */}
      <div className="card">
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#e2e8f0',
                    color: '#334155',
                    letterSpacing: '0.5px',
                  }}
                >
                  DASHBOARD PROGRAM TERPADU
                </span>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: activeProgram.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                    color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                    letterSpacing: '0.5px',
                  }}
                >
                  STATUS: {activeProgram.status === 'COMPLETED' ? 'TERLAKSANA' : 'SEDANG BERJALAN'}
                </span>

                <span className={`badge ${CATEGORY_BADGE[activeProgram.program_category] || 'badge-primary'}`}>
                  {CATEGORY_LABEL[activeProgram.program_category] || activeProgram.program_category}
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gmh-text)' }}>
                {activeProgram.program_title}
              </h1>
              {activeProgram.theme && (
                <div style={{ fontSize: 14, color: 'var(--gmh-green-mid)', fontWeight: 500 }}>
                  Tema: "{activeProgram.theme}"
                </div>
              )}
            </div>

            {/* Top Right Stats Box */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  textAlign: 'right',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, display: 'block' }}>
                  TAKSASI DANA
                </span>
                <strong style={{ fontSize: 18, color: 'var(--gmh-text)' }}>
                  {formatRupiah(Number(activeProgram.budget_estimate))}
                </strong>
              </div>

              <div
                style={{
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '8px 16px',
                  textAlign: 'right',
                  background: '#f0fdf4',
                }}
              >
                <span style={{ fontSize: 10.5, color: '#166534', fontWeight: 600, display: 'block' }}>
                  KAS KANTONG PROGRAM
                </span>
                <strong style={{ fontSize: 18, color: 'var(--gmh-green)' }}>
                  {formatRupiah(Number(activeProgram.cash_balance))}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 META CARDS */}
      {(() => {
        const evtDate = new Date(activeProgram.event_datetime);
        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 12,
            }}
          >
            {/* Meta 1: Tanggal & Waktu */}
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>WAKTU PELAKSANAAN</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {evtDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {evtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </div>
              </div>
            </div>

            {/* Meta 2: Lokasi / Venue */}
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>TEMPAT / VENUE</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {activeProgram.location || 'Rumah Persekutuan GMH'}
                </div>
              </div>
            </div>

            {/* Meta 3: Pembicara / Pelayan Utama */}
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PEMBICARA / PELAYAN</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {activeProgram.speaker_name || '-'}
                </div>
              </div>
            </div>

            {/* Meta 4: Status Kas */}
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <DollarSign size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>STATUS KAS</div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                    marginTop: 1,
                  }}
                >
                  {activeProgram.status === 'COMPLETED' ? 'Selesai & Tutup Kas' : 'Sedang Berjalan'}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* VERTICAL FULL-WIDTH SECTIONS                                               */}
      {/* ========================================================================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 1. URAIAN DESKRIPSI & DOKUMEN DRIVE */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} /> Uraian Deskripsi &amp; Agenda Kegiatan
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => setEditingProgram({ ...activeProgram })}
            >
              <Edit size={12} /> Edit Deskripsi
            </button>
          </div>

          <div className="card-body" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activeProgram.description || 'Tidak ada catatan deskripsi tambahan untuk rincian program ini.'}
            </p>

            {/* Drive Links */}
            {(activeProgram.media_drive_url || activeProgram.document_drive_url) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--gmh-border)' }}>
                {activeProgram.media_drive_url && (
                  <a
                    href={activeProgram.media_drive_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--gmh-info)',
                      fontSize: 12,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={13} /> Tautan Dokumentasi Foto / Video (Google Drive)
                  </a>
                )}
                {activeProgram.document_drive_url && (
                  <a
                    href={activeProgram.document_drive_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--gmh-info)',
                      fontSize: 12,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={13} /> Dokumen Materi / Warta / Surat Tugas (Google Drive)
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. AGENDA & JADWAL KERJA */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} /> Agenda &amp; Jadwal Kerja
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTabAgenda === 'rundown' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '3px 10px',
                  fontSize: 11.5,
                  background: activeTabAgenda === 'rundown' ? '#0f172a' : 'transparent',
                }}
                onClick={() => setActiveTabAgenda('rundown')}
              >
                Rundown Acara
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTabAgenda === 'tasks' ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '3px 10px',
                  fontSize: 11.5,
                  background: activeTabAgenda === 'tasks' ? '#0f172a' : 'transparent',
                }}
                onClick={() => setActiveTabAgenda('tasks')}
              >
                Tugas Persiapan
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* Tab 1: Rundown Acara */}
            {activeTabAgenda === 'rundown' && (
              <div>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#64748b',
                    marginBottom: 12,
                  }}
                >
                  Rundown waktu acara Hari-H untuk koordinasi tertib dan teratur.
                </div>

                {/* Rundown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {(activeProgram.rundown || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                      <CheckCircle2 size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                      Agenda rundown acara belum terdaftar.
                    </div>
                  ) : (
                    (activeProgram.rundown || []).map((rd) => (
                      <div
                        key={rd.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '10px 14px',
                          background: '#ffffff',
                          border: '1px solid var(--gmh-border)',
                          borderRadius: 6,
                          fontSize: 12.5,
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: 10 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: 'var(--gmh-green-mid)',
                              marginRight: 8,
                              fontSize: 11.5,
                              display: 'inline-block',
                              background: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {rd.time}
                          </span>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--gmh-text)',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'break-word',
                              lineHeight: 1.5,
                              marginTop: 4,
                            }}
                          >
                            {rd.note}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            PIC: {rd.pic}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRundown(rd.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            padding: 4,
                          }}
                          title="Hapus baris rundown"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Form Tambah Rundown */}
                <div style={{ borderTop: '1px solid var(--gmh-border)', paddingTop: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>Tambah Agenda Rundown</div>
                  <form onSubmit={handleAddRundown} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '7px 10px' }}
                        placeholder="Waktu (e.g. 19:00 - 19:30)"
                        value={formRundown.time}
                        onChange={(e) => setFormRundown({ ...formRundown, time: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '7px 10px' }}
                        placeholder="Penanggung Jawab (PIC)"
                        value={formRundown.pic}
                        onChange={(e) => setFormRundown({ ...formRundown, pic: e.target.value })}
                      />
                    </div>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      style={{
                        fontSize: 12.5,
                        padding: '8px 10px',
                        minHeight: 72,
                        resize: 'vertical',
                        width: '100%',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                      placeholder="Uraian detail rincian acara (huruf tidak akan hilang ketika habis baris)..."
                      value={formRundown.note}
                      onChange={(e) => setFormRundown({ ...formRundown, note: e.target.value })}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-sm"
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        fontWeight: 600,
                        padding: '6px 14px',
                        alignSelf: 'flex-start',
                      }}
                    >
                      + Tambah Agenda Rundown
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 2: Tugas Persiapan */}
            {activeTabAgenda === 'tasks' && (() => {
              const totalTaskCost = (activeProgram.tasks || []).reduce(
                (acc, t) => acc + (Number(t.estimated_cost) || 0),
                0
              );
              return (
                <div>
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '10px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    <div>Daftar checklist persiapan sound, materi, konsumsi, dan perlengkapan.</div>
                    {totalTaskCost > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#047857',
                          background: '#ecfdf5',
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        Total Estimasi Biaya: {formatRupiah(totalTaskCost)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(activeProgram.tasks || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                        Belum ada tugas persiapan.
                      </div>
                    ) : (
                      (activeProgram.tasks || []).map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: t.done ? '#f0fdf4' : '#ffffff',
                            border: '1px solid var(--gmh-border)',
                            borderRadius: 6,
                            fontSize: 12.5,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={() => handleToggleTask(t.id)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                            <span
                              style={{
                                textDecoration: t.done ? 'line-through' : 'none',
                                color: t.done ? '#15803d' : 'var(--gmh-text)',
                                fontWeight: t.done ? 400 : 500,
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {t.task} <small style={{ color: '#64748b' }}>({t.pic})</small>
                            </span>
                            {t.estimated_cost !== undefined && Number(t.estimated_cost) > 0 && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  marginLeft: 4,
                                }}
                              >
                                {formatRupiah(Number(t.estimated_cost))}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#9ca3af',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form Tambah Task */}
                  <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 2, minWidth: 150, fontSize: 12, padding: '6px 8px' }}
                      placeholder="Tugas baru (e.g. Siapkan Slide & Sound)..."
                      value={formTask.task}
                      onChange={(e) => setFormTask({ ...formTask, task: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, minWidth: 90, fontSize: 12, padding: '6px 8px' }}
                      placeholder="PIC"
                      value={formTask.pic}
                      onChange={(e) => setFormTask({ ...formTask, pic: e.target.value })}
                    />
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <NominalInput
                        value={formTask.estimated_cost}
                        onChange={(val) => setFormTask({ ...formTask, estimated_cost: val })}
                        placeholder="Biaya (Rp)..."
                        style={{ fontSize: 12, padding: '6px 8px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-sm"
                      style={{ background: '#0f172a', color: '#ffffff', fontWeight: 600, padding: '6px 14px', height: 34 }}
                    >
                      + Tambah
                    </button>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 3. KANTONG DANA PROGRAM & JURNAL KEUANGAN */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
              <DollarSign size={18} color="var(--gmh-gold)" /> Kantong Dana Program &amp; Jurnal Keuangan
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#f1f5f9',
                color: '#475569',
              }}
            >
              KAS MANDIRI
            </span>
          </div>

          <div className="card-body">
            {/* Banner Subtitle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                border: '1px solid var(--gmh-border)',
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-text)' }}>
                  Uang Masuk &amp; Keluar Program ini Terpisah
                </div>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Semoga program {activeProgram.program_title} berjalan sukses dan memberkati banyak orang.
                </div>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  background: yayasanMainCash >= 0 ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${yayasanMainCash >= 0 ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: 8,
                  padding: '6px 14px',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: yayasanMainCash >= 0 ? '#166534' : '#991b1b',
                    fontWeight: 700,
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  SALDO UTAMA YAYASAN
                </span>
                <strong
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: yayasanMainCash >= 0 ? '#15803d' : '#b91c1c',
                  }}
                >
                  {formatRupiah(yayasanMainCash)}
                </strong>
              </div>
            </div>

            {/* 2 Sub-Forms: Entri Kas & Subsidi Yayasan */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Sub-form 1: Catat Kas Masuk / Keluar */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
                  Catat Kas Masuk / Keluar Program
                </div>
                <form onSubmit={handleAddCashEntry} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select
                      className="form-select"
                      value={formEntryCash.type}
                      onChange={(e) => setFormEntryCash({ ...formEntryCash, type: e.target.value as any })}
                      style={{ fontSize: 12, padding: '6px 8px' }}
                    >
                      <option value="OUT">Pengeluaran (Keluar)</option>
                      <option value="IN">Pemasukan (Masuk)</option>
                    </select>
                    <select
                      className="form-select"
                      value={formEntryCash.category}
                      onChange={(e) => setFormEntryCash({ ...formEntryCash, category: e.target.value })}
                      style={{ fontSize: 12, padding: '6px 8px' }}
                    >
                      <option value="Konsumsi & Logistik">Konsumsi &amp; Logistik</option>
                      <option value="Honor / Transport Pembicara">Honor / Transport</option>
                      <option value="Sewa Tempat / Alat">Sewa Tempat / Alat</option>
                      <option value="Perlengkapan & Acara">Perlengkapan &amp; Acara</option>
                      <option value="Persembahan / Donasi Peserta">Persembahan / Donasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
                    <NominalInput
                      value={formEntryCash.amount}
                      onChange={(val) => setFormEntryCash({ ...formEntryCash, amount: val })}
                      placeholder="Jumlah Nominal (Rp)..."
                      style={{ fontSize: 12, padding: '6px 8px' }}
                    />
                    <input
                      type="date"
                      className="form-input"
                      value={formEntryCash.date}
                      onChange={(e) => setFormEntryCash({ ...formEntryCash, date: e.target.value })}
                      style={{ fontSize: 12, padding: '6px 8px' }}
                    />
                  </div>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Keterangan transaksi kas program..."
                    value={formEntryCash.description}
                    onChange={(e) => setFormEntryCash({ ...formEntryCash, description: e.target.value })}
                    style={{ fontSize: 12, padding: '6px 8px' }}
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{
                      background: formEntryCash.type === 'IN' ? 'var(--gmh-green)' : '#dc2626',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '6px 12px',
                    }}
                  >
                    {formEntryCash.type === 'IN' ? '+ Simpan Pemasukan' : '- Simpan Pengeluaran'}
                  </button>
                </form>
              </div>

              {/* Sub-form 2: Tarik Subsidi / Setor Sisa ke Yayasan */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
                  Transfer Subsidi dari / ke Kas Yayasan
                </div>
                <form onSubmit={handleTransferSubsidi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select
                    className="form-select"
                    value={formTransferSubsidi.type}
                    onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, type: e.target.value as any })}
                    style={{ fontSize: 12, padding: '6px 8px' }}
                  >
                    <option value="AMBIL_SUBSIDI">Ambil Subsidi dari Kas Yayasan (+ Masuk ke Program)</option>
                    <option value="SETOR_SISA">Setor Sisa Kas ke Kas Yayasan (- Keluar dari Program)</option>
                  </select>

                  <NominalInput
                    value={formTransferSubsidi.amount}
                    onChange={(val) => setFormTransferSubsidi({ ...formTransferSubsidi, amount: val })}
                    placeholder="Jumlah Nominal Subsidi (Rp)..."
                    style={{ fontSize: 12, padding: '6px 8px' }}
                  />

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Catatan transfer subsidi (e.g. Subsidi Konsumsi)..."
                    value={formTransferSubsidi.notes}
                    onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, notes: e.target.value })}
                    style={{ fontSize: 12, padding: '6px 8px' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      fontWeight: 600,
                      padding: '6px 12px',
                    }}
                  >
                    Eksekusi Transfer Subsidi
                  </button>
                </form>
              </div>
            </div>

            {/* 3 Metric Cards: Pemasukan, Pengeluaran, Sisa Kas Program */}
            {(() => {
              const trxs = activeProgram.transactions || [];
              const totalIn = trxs.filter((t) => t.type === 'IN').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
              const totalOut = trxs.filter((t) => t.type === 'OUT').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
              const balance = totalIn - totalOut;
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>TOTAL PEMASUKAN</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
                      {formatRupiah(totalIn)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>TOTAL PENGELUARAN</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#b91c1c', marginTop: 2 }}>
                      {formatRupiah(totalOut)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: balance >= 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${balance >= 0 ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: balance >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                      SISA KAS PROGRAM
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: balance >= 0 ? '#15803d' : '#b91c1c',
                        marginTop: 2,
                      }}
                    >
                      {formatRupiah(balance)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Table Log Transaksi Kas Mandiri */}
            <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
              Jurnal Transaksi Kas Program
            </div>
            <div className="table-wrapper" style={{ maxHeight: 260, overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Tanggal</th>
                    <th>Keterangan</th>
                    <th style={{ width: 140 }}>Kategori</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Nominal</th>
                    <th style={{ width: 40, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeProgram.transactions || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                        Belum ada catatan mutasi kas pada program ini.
                      </td>
                    </tr>
                  ) : (
                    (activeProgram.transactions || []).map((trx) => (
                      <tr key={trx.id}>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{trx.date}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--gmh-text)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                            {trx.description}
                          </div>
                          {trx.central_tx_code && (
                            <div style={{ fontSize: 10, color: 'var(--gmh-info)', fontFamily: 'monospace' }}>
                              Ref: {trx.central_tx_code}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: trx.type === 'IN' ? '#dcfce7' : '#fee2e2',
                              color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {trx.category}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {trx.type === 'IN' ? `+ ${formatRupiah(trx.amount)}` : `- ${formatRupiah(trx.amount)}`}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(trx.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                            title="Hapus transaksi"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. SUSUNAN PENGURUS & PELAYAN ACARA */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={16} /> Susunan Pengurus &amp; Pelayan Acara
            </div>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PANITIA ACARA</span>
          </div>

          <div className="card-body">
            {/* Committee List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {(activeProgram.committees || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                  <User size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                  Belum ada susunan pelayan atau panitia acara yang ditambahkan.
                </div>
              ) : (
                (activeProgram.committees || []).map((com) => (
                  <div
                    key={com.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#e2e8f0',
                          color: '#334155',
                        }}
                      >
                        {com.role}
                      </span>
                      <strong style={{ color: 'var(--gmh-text)' }}>{com.name}</strong>
                      {com.member_id ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: '#dbeafe',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                          }}
                        >
                          ✓ Anggota Yayasan
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: '#f1f5f9',
                            color: '#64748b',
                          }}
                        >
                          Manual / Eksternal
                        </span>
                      )}
                      {com.contact && (
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          · {com.contact}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCommittee(com.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Form Tambah Pelayan */}
            <form onSubmit={handleAddCommittee} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--gmh-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text)' }}>
                  Tambah Pengurus / Pelayan Acara
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFormCommittee((prev) => ({
                      ...prev,
                      isManual: !prev.isManual,
                      member_id: '',
                      name: '',
                      contact: '',
                    }));
                    setCommitteeSearchQuery('');
                    setShowCommitteeDropdown(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {formCommittee.isManual ? '← Cari dari Data Anggota' : '+ Opsi Input Manual'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: 12, padding: '6px 8px' }}
                  placeholder="Peran (e.g. Pembicara / MC / Musik)"
                  value={formCommittee.role}
                  onChange={(e) => setFormCommittee({ ...formCommittee, role: e.target.value })}
                  required
                />

                {/* Name input */}
                {!formCommittee.isManual ? (
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: 12, padding: '6px 8px', width: '100%' }}
                      placeholder="Ketik cari nama anggota..."
                      value={committeeSearchQuery || formCommittee.name}
                      onChange={(e) => {
                        setCommitteeSearchQuery(e.target.value);
                        setFormCommittee({ ...formCommittee, name: e.target.value, member_id: '' });
                        setShowCommitteeDropdown(true);
                      }}
                      onFocus={() => setShowCommitteeDropdown(true)}
                      required
                    />
                    {showCommitteeDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          border: '1px solid var(--gmh-border)',
                          borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          maxHeight: 180,
                          overflowY: 'auto',
                          zIndex: 50,
                          marginTop: 4,
                        }}
                      >
                        {filteredCommitteeMembers.length === 0 ? (
                          <div style={{ padding: '8px 10px', fontSize: 11.5, color: '#94a3b8' }}>
                            Anggota tidak ditemukan.
                            <button
                              type="button"
                              onClick={() => {
                                setFormCommittee({ ...formCommittee, isManual: true, name: committeeSearchQuery });
                                setShowCommitteeDropdown(false);
                              }}
                              style={{
                                display: 'block',
                                marginTop: 4,
                                background: 'none',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'left',
                                padding: 0,
                              }}
                            >
                              Input nama "{committeeSearchQuery}" secara manual
                            </button>
                          </div>
                        ) : (
                          filteredCommitteeMembers.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setFormCommittee({
                                  ...formCommittee,
                                  name: m.name,
                                  contact: m.phone || m.email || '',
                                  member_id: m.id,
                                  isManual: false,
                                });
                                setCommitteeSearchQuery(m.name);
                                setShowCommitteeDropdown(false);
                              }}
                              style={{
                                padding: '6px 10px',
                                fontSize: 12,
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{m.name}</div>
                              <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                {m.nia} • {m.faculty || m.profession || 'Alumni'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: 12, padding: '6px 8px' }}
                    placeholder="Nama lengkap (Manual)"
                    value={formCommittee.name}
                    onChange={(e) => setFormCommittee({ ...formCommittee, name: e.target.value })}
                    required
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                  placeholder="Kontak / Keterangan (Opsional)"
                  value={formCommittee.contact}
                  onChange={(e) => setFormCommittee({ ...formCommittee, contact: e.target.value })}
                />
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: '#0f172a', color: '#ffffff', fontWeight: 600, padding: '6px 16px' }}
                >
                  + Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
