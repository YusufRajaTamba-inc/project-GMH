import React from 'react';
import {
  ArrowLeft,
  Edit,
  Download,
  FileDown,
  Loader2,
  CheckCircle2,
  Lock,
  Trash2,
  User,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Calendar,
  ArrowRightLeft,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { formatRupiah } from '../../../utils/currency';
import NominalInput from '../../../components/NominalInput';
import type { MissionActivity } from '../types';

interface MissionDashboardTabProps {
  activeActivity: MissionActivity;
  yayasanMainCash: number;
  handleBackToList: () => void;
  setEditingActivity: (act: MissionActivity) => void;
  handleExportCSV: () => void;
  handleDownloadPDF: () => void;
  isExportingPDF: boolean;
  handleToggleStatus: () => void;
  handleDeleteActivity: (act: MissionActivity) => void;
  activeTabAgenda: 'rundown' | 'tasks';
  setActiveTabAgenda: (tab: 'rundown' | 'tasks') => void;
  formRundown: { time: string; pic: string; note: string };
  setFormRundown: React.Dispatch<React.SetStateAction<{ time: string; pic: string; note: string }>>;
  handleAddRundown: (e: React.FormEvent) => void;
  handleDeleteRundown: (id: string) => void;
  formTask: { task: string; pic: string; estimated_cost: number | '' };
  setFormTask: React.Dispatch<React.SetStateAction<{ task: string; pic: string; estimated_cost: number | '' }>>;
  handleAddTask: (e: React.FormEvent) => void;
  handleToggleTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;
  formCashEntry: { type: 'IN' | 'OUT'; amount: number; category: string; description: string };
  setFormCashEntry: React.Dispatch<
    React.SetStateAction<{ type: 'IN' | 'OUT'; amount: number; category: string; description: string }>
  >;
  handleAddCashEntry: (e: React.FormEvent) => void;
  formTransferSubsidi: { type: 'AMBIL_SUBSIDI' | 'SETOR_SISA'; amount: number; notes: string };
  setFormTransferSubsidi: React.Dispatch<
    React.SetStateAction<{ type: 'AMBIL_SUBSIDI' | 'SETOR_SISA'; amount: number; notes: string }>
  >;
  handleTransferSubsidi: (e: React.FormEvent) => void;
  handleDeleteTransaction: (id: string) => void;
  formCommittee: { role: string; name: string; contact: string; member_id: string; isManual: boolean };
  setFormCommittee: React.Dispatch<
    React.SetStateAction<{ role: string; name: string; contact: string; member_id: string; isManual: boolean }>
  >;
  committeeSearchQuery: string;
  setCommitteeSearchQuery: (s: string) => void;
  showCommitteeDropdown: boolean;
  setShowCommitteeDropdown: (b: boolean) => void;
  filteredCommitteeMembers: any[];
  handleAddCommittee: (e: React.FormEvent) => void;
  handleDeleteCommittee: (id: string) => void;
}

export const MissionDashboardTab: React.FC<MissionDashboardTabProps> = ({
  activeActivity,
  yayasanMainCash,
  handleBackToList,
  setEditingActivity,
  handleExportCSV,
  handleDownloadPDF,
  isExportingPDF,
  handleToggleStatus,
  handleDeleteActivity,
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
  formCashEntry,
  setFormCashEntry,
  handleAddCashEntry,
  formTransferSubsidi,
  setFormTransferSubsidi,
  handleTransferSubsidi,
  handleDeleteTransaction,
  formCommittee,
  setFormCommittee,
  committeeSearchQuery,
  setCommitteeSearchQuery,
  showCommitteeDropdown,
  setShowCommitteeDropdown,
  filteredCommitteeMembers,
  handleAddCommittee,
  handleDeleteCommittee,
}) => {
  return (
    <div>
      {/* TOP ACTIONS NAV BAR */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleBackToList}
          id="btn-back-to-activities-list"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '7px 14px' }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Kegiatan
        </button>

        {/* Top Right Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setEditingActivity({ ...activeActivity })}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Edit size={14} /> Edit Rincian
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={14} /> Unduh Jurnal CSV
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
              color: activeActivity.status === 'COMPLETED' ? '#b45309' : '#047857',
              borderColor: activeActivity.status === 'COMPLETED' ? '#fde68a' : '#a7f3d0',
            }}
          >
            <CheckCircle2 size={14} />
            {activeActivity.status === 'COMPLETED' ? 'Buka Kembali Kegiatan' : 'Tandai Selesai'}
          </button>

          {activeActivity.status === 'COMPLETED' ? (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled
              style={{ opacity: 0.45, cursor: 'not-allowed', color: '#94a3b8', borderColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Kegiatan misi yang telah Selesai tidak dapat dihapus demi integritas arsip LPJ"
            >
              <Lock size={14} /> Terkunci (Selesai)
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleDeleteActivity(activeActivity)}
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
            ID: {activeActivity.id}
          </span>
        </div>
      </div>

      {/* MAIN HEADER CARD */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
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
                  DASHBOARD KEGIATAN TERPADU
                </span>

                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: activeActivity.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                    color: activeActivity.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                    letterSpacing: '0.5px',
                  }}
                >
                  STATUS: {activeActivity.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERJALAN'}
                </span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gmh-text)' }}>
                {activeActivity.title}
              </h1>
              {activeActivity.theme && (
                <div style={{ fontSize: 14, color: 'var(--gmh-green-mid)', fontWeight: 500 }}>
                  Tema: "{activeActivity.theme}"
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
                  {formatRupiah(Number(activeActivity.budget_estimate))}
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
                  KAS KANTONG KEGIATAN
                </span>
                <strong style={{ fontSize: 18, color: 'var(--gmh-green)' }}>
                  {formatRupiah(Number(activeActivity.cash_balance))}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 META CARDS ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {/* Card 1: Pelayan / Kordinator */}
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <User size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PELAYAN / KORDINATOR</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
              {activeActivity.coordinator || 'Belum diatur'}
            </div>
          </div>
        </div>

        {/* Card 2: Lokasi & Tempat */}
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <MapPin size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>LOKASI &amp; TEMPAT</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
              {activeActivity.location || 'MEDAN'}
            </div>
          </div>
        </div>

        {/* Card 3: Waktu */}
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>WAKTU</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
              {activeActivity.time_preview || activeActivity.event_date || 'Belum diatur'}
            </div>
          </div>
        </div>

        {/* Card 4: Status Kas */}
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <div style={{ fontSize: 13.5, fontWeight: 700, color: activeActivity.status === 'COMPLETED' ? '#15803d' : '#854d0e', marginTop: 1 }}>
              {activeActivity.status === 'COMPLETED' ? 'Selesai &amp; Tutup Kas' : 'Sedang Berjalan'}
            </div>
          </div>
        </div>
      </div>

      {/* VERTICAL FULL-WIDTH SECTIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Card 1: Uraian Deskripsi & Dokumen Drive */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} /> Uraian Deskripsi &amp; Agenda Kegiatan
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => setEditingActivity({ ...activeActivity })}
            >
              <Edit size={12} /> Edit Deskripsi
            </button>
          </div>

          <div className="card-body" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activeActivity.description || 'Tidak ada catatan deskripsi tambahan untuk rincian kegiatan ini.'}
            </p>

            {/* Drive Links */}
            {(activeActivity.media_drive_url || activeActivity.document_drive_url) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--gmh-border)' }}>
                {activeActivity.media_drive_url && (
                  <a
                    href={activeActivity.media_drive_url}
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
                {activeActivity.document_drive_url && (
                  <a
                    href={activeActivity.document_drive_url}
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
                    <ExternalLink size={13} /> Dokumen Tambahan / Surat Tugas (Google Drive)
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Agenda & Jadwal Kerja */}
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
                  Rundown waktu acara Hari-H untuk koordinasi alur acara.
                </div>

                {/* Rundown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {(activeActivity.rundown || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                      <CheckCircle2 size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                      Agenda rundown belum terdaftar.
                    </div>
                  ) : (
                    (activeActivity.rundown || []).map((rd) => (
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
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Tambah Agenda Rundown</div>
                  <form onSubmit={handleAddRundown} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        placeholder="Waktu (e.g. 18:00)"
                        value={formRundown.time}
                        onChange={(e) => setFormRundown({ ...formRundown, time: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '6px 8px' }}
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
              const totalTaskCost = (activeActivity.tasks || []).reduce(
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
                    <div>Daftar checklist persiapan logistik, surat tugas, dan perlengkapan.</div>
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
                    {(activeActivity.tasks || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                        Belum ada tugas persiapan.
                      </div>
                    ) : (
                      (activeActivity.tasks || []).map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
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
                      placeholder="Tugas baru (e.g. Modul materi)..."
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

        {/* Card 3: Kantong Dana Kegiatan & Jurnal Keuangan */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
              <DollarSign size={18} color="var(--gmh-gold)" /> Kantong Dana Kegiatan &amp; Jurnal Keuangan
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
                  Uang Masuk &amp; Keluar Kegiatan ini Terpisah
                </div>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Semoga kegiatan {activeActivity.title} berjalan sukses dan penuh berkat.
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
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Form 1: Entri Kas Kegiatan */}
              <div
                style={{
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 10,
                  padding: '16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                      <DollarSign size={15} color="#64748b" /> Form Transaksi Kas Mandiri
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: formCashEntry.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                        color: formCashEntry.type === 'IN' ? '#047857' : '#b91c1c',
                      }}
                    >
                      {formCashEntry.type === 'IN' ? 'KAS MASUK' : 'KAS KELUAR'}
                    </span>
                  </div>
                  <form onSubmit={handleAddCashEntry} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Tipe Kas</label>
                        <select
                          className="form-select"
                          style={{ fontSize: 12, padding: '7px 8px' }}
                          value={formCashEntry.type}
                          onChange={(e) => setFormCashEntry({ ...formCashEntry, type: e.target.value as any })}
                        >
                          <option value="IN">Pemasukan (Uang Masuk)</option>
                          <option value="OUT">Pengeluaran (Biaya)</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Nominal (Rp)</label>
                        <NominalInput
                          value={formCashEntry.amount}
                          onChange={(val) => setFormCashEntry({ ...formCashEntry, amount: val })}
                          placeholder="0"
                          style={{ fontSize: 12, padding: '7px 8px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Kategori Transaksi</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '7px 8px' }}
                        placeholder="Contoh: Kolekte, Konsumsi, Transportasi"
                        value={formCashEntry.category}
                        onChange={(e) => setFormCashEntry({ ...formCashEntry, category: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Keterangan / Sumber</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '7px 8px' }}
                        placeholder="Contoh: Pembelian air mineral dan snack"
                        value={formCashEntry.description}
                        onChange={(e) => setFormCashEntry({ ...formCashEntry, description: e.target.value })}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-sm"
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        fontWeight: 600,
                        padding: '8px 12px',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <Plus size={13} /> Buku Transaksi Kegiatan
                    </button>
                  </form>
                </div>
              </div>

              {/* Form 2: Subsidi / Transfer Kas Yayasan */}
              <div
                style={{
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 10,
                  padding: '16px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                      <DollarSign size={15} color="#64748b" /> Subsidi / Transfer Kas Yayasan
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? '#eff6ff' : '#fef3c7',
                        color: formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? '#1d4ed8' : '#b45309',
                      }}
                    >
                      {formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? 'Yayasan ➔ Acara' : 'Acara ➔ Yayasan'}
                    </span>
                  </div>
                  <form onSubmit={handleTransferSubsidi} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Tipe Transfer</label>
                        <select
                          className="form-select"
                          style={{ fontSize: 12, padding: '7px 8px' }}
                          value={formTransferSubsidi.type}
                          onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, type: e.target.value as any })}
                        >
                          <option value="AMBIL_SUBSIDI">Ambil Subsidi Yayasan</option>
                          <option value="SETOR_SISA">Setor Sisa Kas ke Yayasan</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Nominal (Rp)</label>
                        <NominalInput
                          value={formTransferSubsidi.amount}
                          onChange={(val) => setFormTransferSubsidi({ ...formTransferSubsidi, amount: val })}
                          placeholder="0"
                          style={{ fontSize: 12, padding: '7px 8px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Catatan Transfer</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '7px 8px' }}
                        placeholder="Contoh: Tambahan anggaran Sie Konsumsi"
                        value={formTransferSubsidi.notes}
                        onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, notes: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-sm"
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        fontWeight: 600,
                        padding: '8px 12px',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      <ArrowRightLeft size={13} /> Eksekusi Transfer Kas
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Log Jurnal Keuangan Mandiri Acara */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
              Log Jurnal Keuangan Mandiri Acara ({(activeActivity.transactions || []).length})
            </div>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ARUS KAS KEGIATAN</span>
          </div>

          <div className="table-wrapper">
            <table className="table" style={{ fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>TANGGAL</th>
                  <th style={{ width: 140 }}>KATEGORI / SUMBER</th>
                  <th>KETERANGAN</th>
                  <th style={{ width: 130, textAlign: 'right' }}>JUMLAH (RP)</th>
                  <th style={{ width: 60, textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {(activeActivity.transactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                      Belum ada catatan mutasi kas pada kegiatan ini.
                    </td>
                  </tr>
                ) : (
                  (activeActivity.transactions || []).map((trx) => (
                    <tr key={trx.id}>
                      <td style={{ color: '#475569' }}>{trx.date}</td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: trx.type === 'IN' ? '#dcfce7' : '#fee2e2',
                            color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {trx.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 500, color: 'var(--gmh-text)' }}>{trx.category}</span>
                          {trx.central_tx_code && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                background: '#e0f2fe',
                                color: '#0369a1',
                                padding: '1px 6px',
                                borderRadius: 4,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title={`Tersinkronisasi ke Kas Pusat Yayasan (${trx.central_tx_code})`}
                            >
                              <ShieldCheck size={10} /> {trx.central_tx_code}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{trx.description}</div>
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

        {/* Card 4: Susunan Pengurus & Pelayan Acara */}
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
              {(activeActivity.committees || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                  <User size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                  Belum ada susunan panitia atau pelayan acara yang ditambahkan.
                </div>
              ) : (
                (activeActivity.committees || []).map((com) => (
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

            {/* Form Tambah Panitia */}
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
                  placeholder="Peran (e.g. Pembicara / MC)"
                  value={formCommittee.role}
                  onChange={(e) => setFormCommittee({ ...formCommittee, role: e.target.value })}
                  required
                />

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
