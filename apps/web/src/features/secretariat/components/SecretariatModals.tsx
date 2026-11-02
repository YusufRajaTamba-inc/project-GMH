import React from 'react';
import {
  Send,
  Inbox,
  X,
  CheckCircle,
  FileText,
  Check,
  Copy,
  Download,
  ExternalLink,
  Edit3,
  FileCheck,
  Printer,
} from 'lucide-react';
import type {
  OutgoingLetter,
  IncomingLetter,
  LetterCategory,
  OutgoingFormData,
  IncomingFormData,
} from '../types';
import { formatDateID, getLetterFileTitle } from '../types';

// ============================================================================
// MODAL 1: BUAT SURAT KELUAR
// ============================================================================
interface CreateOutgoingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoNumber: boolean;
  setIsAutoNumber: (val: boolean) => void;
  generatedPreviewNumber: string;
  outgoingFormData: OutgoingFormData;
  setOutgoingFormData: React.Dispatch<React.SetStateAction<OutgoingFormData>>;
  categories: LetterCategory[];
  handleCreateOutgoing: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export const CreateOutgoingModal: React.FC<CreateOutgoingModalProps> = ({
  isOpen,
  onClose,
  isAutoNumber,
  setIsAutoNumber,
  generatedPreviewNumber,
  outgoingFormData,
  setOutgoingFormData,
  categories,
  handleCreateOutgoing,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-card" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Send size={18} color="var(--gmh-green)" />
            <div style={{ fontWeight: 700, fontSize: 16 }}>Formulir Buat Surat Keluar Yayasan</div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateOutgoing}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Auto Numbering Banner */}
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#166534', fontSize: 13 }}>
                  <CheckCircle size={15} /> Penomoran Otomatis Dinamis (Sistem Utility)
                </div>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#166534' }}>
                  <input
                    type="checkbox"
                    checked={!isAutoNumber}
                    onChange={(e) => setIsAutoNumber(!e.target.checked)}
                  />
                  Edit manual nomor
                </label>
              </div>

              {isAutoNumber ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#166534' }}>Estimasi Nomor (dikonfirmasi atomik saat disimpan):</span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#15803d',
                      background: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: 4,
                      border: '1px solid #86efac',
                    }}
                  >
                    {generatedPreviewNumber || 'Menghitung nomor surat...'}
                  </span>
                </div>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ketik nomor surat manual..."
                    value={outgoingFormData.letter_number}
                    onChange={(e) => setOutgoingFormData({ ...outgoingFormData, letter_number: e.target.value })}
                    required={!isAutoNumber}
                    style={{ fontFamily: 'monospace', fontWeight: 600 }}
                  />
                </div>
              )}
            </div>

            {/* Grid Category & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Klasifikasi Jenis Surat *</label>
                <select
                  className="form-select"
                  value={outgoingFormData.category_code}
                  onChange={(e) => {
                    const selected = categories.find((c) => c.code === e.target.value);
                    setOutgoingFormData({
                      ...outgoingFormData,
                      category_code: e.target.value,
                      category_label: selected?.label || e.target.value,
                    });
                  }}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.code} - {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat *</label>
                <input
                  type="date"
                  className="form-input"
                  value={outgoingFormData.letter_date}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, letter_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Perihal / Hal Surat *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Undangan Rapat Evaluasi Proyek Rumah Persekutuan"
                value={outgoingFormData.subject}
                onChange={(e) => setOutgoingFormData({ ...outgoingFormData, subject: e.target.value })}
                required
              />
            </div>

            {/* Recipient & Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Kepada Yth. (Tujuan / Penerima) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Instansi, Pejabat, atau Anggota"
                  value={outgoingFormData.recipient}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, recipient: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Alamat / Kota Penerima</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Medan / Jl. Balai Kota No. 1"
                  value={outgoingFormData.recipient_address}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, recipient_address: e.target.value })}
                />
              </div>
            </div>

            {/* Signer Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Nama Penandatangan *</label>
                <input
                  type="text"
                  className="form-input"
                  value={outgoingFormData.signer_name}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, signer_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Jabatan Penandatangan</label>
                <input
                  type="text"
                  className="form-input"
                  value={outgoingFormData.signer_position}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, signer_position: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Lampiran</label>
                <input
                  type="text"
                  className="form-input"
                  value={outgoingFormData.attachment_count}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, attachment_count: e.target.value })}
                  placeholder="-"
                />
              </div>
            </div>

            {/* Content Summary */}
            <div>
              <label className="form-label">Ringkasan Isi / Keterangan Surat</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Tuliskan intisari pokok surat atau keterangan arsip sekretariat..."
                value={outgoingFormData.content_summary}
                onChange={(e) => setOutgoingFormData({ ...outgoingFormData, content_summary: e.target.value })}
              />
            </div>

            {/* Status & File URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
              <div>
                <label className="form-label">Status Penerbitan</label>
                <select
                  className="form-select"
                  value={outgoingFormData.status}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, status: e.target.value })}
                >
                  <option value="TERKIRIM">Send (Terkirim)</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DITERIMA">Arrived (Diterima)</option>
                  <option value="DIARSIPKAN">Diarsipkan</option>
                </select>
              </div>

              <div>
                <label className="form-label">Tautan Dokumen / Scan Surat (Opsional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://... atau nomor rak arsip"
                  value={outgoingFormData.file_url}
                  onChange={(e) => setOutgoingFormData({ ...outgoingFormData, file_url: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={15} /> {isSubmitting ? 'Menerbitkan...' : 'Simpan & Terbitkan Surat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 2: PRATINJAU INFORMASI SURAT KELUAR & WORD DOKUMEN
// ============================================================================
interface PreviewOutgoingModalProps {
  previewOutgoing: OutgoingLetter | null;
  onClose: () => void;
  copiedField: string | null;
  handleCopyText: (text: string, fieldName: string) => void;
  downloadWordDraft: (letter: OutgoingLetter) => void;
  handleUpdateLetterStatus: (letter: OutgoingLetter, newStatus: string) => Promise<void>;
  setPreviewOutgoing: React.Dispatch<React.SetStateAction<OutgoingLetter | null>>;
  setEditingOutgoing: (letter: OutgoingLetter) => void;
}

export const PreviewOutgoingModal: React.FC<PreviewOutgoingModalProps> = ({
  previewOutgoing,
  onClose,
  copiedField,
  handleCopyText,
  downloadWordDraft,
  handleUpdateLetterStatus,
  setPreviewOutgoing,
  setEditingOutgoing,
}) => {
  if (!previewOutgoing) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal modal-card"
        style={{
          maxWidth: 720,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={18} color="var(--gmh-green)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Informasi Surat Keluar & Nomor Resmi</div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 400 }}>
                Nomor surat resmi yayasan telah diterbitkan & tercatat di database
              </div>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero Banner: Nomor Surat Resmi */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Nomor Surat Resmi yang Diterbitkan:
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', fontFamily: 'monospace', marginTop: 4 }}>
                {previewOutgoing.letter_number}
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                Klasifikasi: <strong>{previewOutgoing.category_label || previewOutgoing.category_code}</strong> · Tanggal:{' '}
                <strong>{formatDateID(previewOutgoing.letter_date)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => handleCopyText(previewOutgoing.letter_number, 'number')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: copiedField === 'number' ? '#ecfdf5' : '#ffffff',
                borderColor: copiedField === 'number' ? '#10b981' : '#0284c7',
                color: copiedField === 'number' ? '#047857' : '#0284c7',
                fontWeight: 600,
                fontSize: 12.5,
                padding: '8px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              title="Salin nomor surat ke clipboard"
            >
              {copiedField === 'number' ? <Check size={14} /> : <Copy size={14} />}
              {copiedField === 'number' ? 'Nomor Tersalin!' : 'Salin Nomor'}
            </button>
          </div>

          {/* Panduan Arahkan Buka di Word / Google Docs */}
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <FileText size={20} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.55 }}>
              <strong>Lanjutkan Penulisan Naskah Surat:</strong>
              <br />
              Sistem telah mencatat nomor surat dan metadata arsip di database. Untuk menyusun naskah surat lengkap, penataan paragraf, dan cetak kop surat, silakan buka atau salin ke pengolah kata pilihan Anda:
            </div>
          </div>

          {/* Info Judul File Otomatis */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>Judul File Dokumen:</span>
              <strong style={{ color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {getLetterFileTitle(previewOutgoing)}
              </strong>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>.doc / Google Docs</span>
          </div>

          {/* Action Buttons: Word Desktop, Google Docs, Salin Judul File */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => downloadWordDraft(previewOutgoing)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12.5,
                padding: '10px 14px',
                fontWeight: 600,
                borderRadius: 8,
              }}
              title="Download template file Word (.doc) menggunakan judul tujuan surat & kepada untuk diedit di desktop"
            >
              <Download size={15} /> Buka / Unduh di Word (.doc)
            </button>

            <a
              href={`https://docs.new?title=${encodeURIComponent(getLetterFileTitle(previewOutgoing))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12.5,
                padding: '10px 14px',
                fontWeight: 600,
                borderColor: '#4285F4',
                color: '#1a73e8',
                background: '#f8fafd',
                textDecoration: 'none',
                borderRadius: 8,
              }}
              title="Buka dokumen baru di Google Docs dengan judul tujuan surat & kepada"
            >
              <ExternalLink size={15} color="#4285F4" /> Buka Google Docs (Baru)
            </a>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleCopyText(getLetterFileTitle(previewOutgoing), 'title')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 12.5,
                padding: '10px 14px',
                fontWeight: 600,
                borderColor: copiedField === 'title' ? '#10b981' : 'var(--gmh-border)',
                color: copiedField === 'title' ? '#047857' : 'var(--gmh-text)',
                borderRadius: 8,
              }}
              title="Salin judul file dokumen (perihal surat & tujuan penerima) ke clipboard"
            >
              {copiedField === 'title' ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
              {copiedField === 'title' ? 'Judul File Tersalin!' : 'Salin Judul File'}
            </button>
          </div>

          {/* Metadata Informasi Terdaftar */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12 }}>
              Ringkasan Informasi yang Tercatat:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px 20px', fontSize: 12.5 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: 11.5 }}>Perihal / Hal Surat:</span>
                <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.subject}</div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: 11.5 }}>Kepada Yth. (Tujuan / Penerima):</span>
                <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.recipient}</div>
                {previewOutgoing.recipient_address && (
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{previewOutgoing.recipient_address}</div>
                )}
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: 11.5 }}>Nama & Jabatan Penandatangan:</span>
                <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.signer_name}</div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                  {previewOutgoing.signer_position || 'Ketua Umum Pengurus Yayasan'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: 11.5 }}>Lampiran & Status:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{previewOutgoing.attachment_count || '-'}</span>
                  <select
                    value={previewOutgoing.status?.toUpperCase() || 'TERKIRIM'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      await handleUpdateLetterStatus(previewOutgoing, newStatus);
                      setPreviewOutgoing({ ...previewOutgoing, status: newStatus });
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      outline: 'none',
                      background:
                        previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                          ? '#dcfce7'
                          : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                          ? '#dbeafe'
                          : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                          ? '#f1f5f9'
                          : '#fef3c7',
                      color:
                        previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                          ? '#15803d'
                          : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                          ? '#1d4ed8'
                          : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                          ? '#475569'
                          : '#b45309',
                      borderColor:
                        previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                          ? '#86efac'
                          : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                          ? '#93c5fd'
                          : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                          ? '#cbd5e1'
                          : '#fde68a',
                    }}
                    title="Ubah status surat langsung"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="TERKIRIM">Send</option>
                    <option value="DITERIMA">Arrived</option>
                    <option value="DIARSIPKAN">Diarsipkan</option>
                  </select>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: 11.5 }}>Ringkasan Isi / Catatan Khusus:</span>
                <div
                  style={{
                    color: '#334155',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '10px 14px',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {previewOutgoing.content_summary || 'Tidak ada catatan ringkasan khusus.'}
                </div>
              </div>

              {previewOutgoing.file_url && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#64748b', fontSize: 11.5 }}>Tautan Dokumen / File Scan:</span>
                  <div style={{ marginTop: 4 }}>
                    <a
                      href={previewOutgoing.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#0284c7',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <ExternalLink size={13} /> {previewOutgoing.file_url}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--gmh-border)',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
            ID Arsip: <code style={{ fontSize: 11 }}>{previewOutgoing.id?.slice(0, 8)}</code>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const letterToEdit = previewOutgoing;
                onClose();
                setEditingOutgoing(letterToEdit);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={14} /> Ubah Data
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 3: EDIT SURAT KELUAR
// ============================================================================
interface EditOutgoingModalProps {
  editingOutgoing: OutgoingLetter | null;
  onClose: () => void;
  setEditingOutgoing: React.Dispatch<React.SetStateAction<OutgoingLetter | null>>;
  handleUpdateOutgoing: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export const EditOutgoingModal: React.FC<EditOutgoingModalProps> = ({
  editingOutgoing,
  onClose,
  setEditingOutgoing,
  handleUpdateOutgoing,
  isSubmitting,
}) => {
  if (!editingOutgoing) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-card" style={{ maxWidth: 640, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            Ubah Surat Keluar: {editingOutgoing.letter_number}
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUpdateOutgoing}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat</label>
                <input
                  type="date"
                  className="form-input"
                  value={editingOutgoing.letter_date}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, letter_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                <select
                  className="form-select"
                  value={editingOutgoing.status}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, status: e.target.value })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="TERKIRIM">Send (Terkirim)</option>
                  <option value="DITERIMA">Arrived (Diterima)</option>
                  <option value="DIARSIPKAN">Diarsipkan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
              <input
                type="text"
                className="form-input"
                value={editingOutgoing.subject}
                onChange={(e) => setEditingOutgoing({ ...editingOutgoing, subject: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Kepada Yth. (Penerima) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingOutgoing.recipient}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, recipient: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Alamat Penerima</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingOutgoing.recipient_address || ''}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, recipient_address: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Penandatangan</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingOutgoing.signer_name}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, signer_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Jabatan</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingOutgoing.signer_position || ''}
                  onChange={(e) => setEditingOutgoing({ ...editingOutgoing, signer_position: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Ringkasan Isi Surat</label>
              <textarea
                className="form-input"
                rows={3}
                value={editingOutgoing.content_summary || ''}
                onChange={(e) => setEditingOutgoing({ ...editingOutgoing, content_summary: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4: CATAT SURAT MASUK
// ============================================================================
interface CreateIncomingModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomingFormData: IncomingFormData;
  setIncomingFormData: React.Dispatch<React.SetStateAction<IncomingFormData>>;
  handleCreateIncoming: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export const CreateIncomingModal: React.FC<CreateIncomingModalProps> = ({
  isOpen,
  onClose,
  incomingFormData,
  setIncomingFormData,
  handleCreateIncoming,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-card" style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Inbox size={18} color="#16a34a" />
            <div style={{ fontWeight: 700, fontSize: 16 }}>Formulir Pencatatan Surat Masuk</div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateIncoming}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Nomor Surat Asal (Dari Pengirim) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 054/DPMPTSP-MDN/II/2026"
                  value={incomingFormData.sender_letter_number}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_letter_number: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>No. Agenda Masuk</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Auto (AG-YYYY-XXXX)"
                  value={incomingFormData.agenda_number}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, agenda_number: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat Pengirim *</label>
                <input
                  type="date"
                  className="form-input"
                  value={incomingFormData.letter_date}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, letter_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Diterima *</label>
                <input
                  type="date"
                  className="form-input"
                  value={incomingFormData.received_date}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, received_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Nama Pengirim *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama individu / kepala dinas"
                  value={incomingFormData.sender_name}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Instansi / Lembaga Asal</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Dinas PTSP Kota Medan / Bank BNI"
                  value={incomingFormData.sender_institution}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_institution: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Tanggapan Dokumen Administrasi PBG Gedung GMH"
                value={incomingFormData.subject}
                onChange={(e) => setIncomingFormData({ ...incomingFormData, subject: e.target.value })}
                required
              />
            </div>

            {/* Disposition section */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>
                Lembar Disposisi Surat Masuk
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Disposisi Diteruskan Kepada:</label>
                  <select
                    className="form-select"
                    value={incomingFormData.disposition_to}
                    onChange={(e) => setIncomingFormData({ ...incomingFormData, disposition_to: e.target.value })}
                  >
                    <option value="Ketua Pembina Yayasan">Ketua Pembina Yayasan</option>
                    <option value="Ketua Umum Pengurus Harian">Ketua Umum Pengurus Harian</option>
                    <option value="Sekretaris Umum">Sekretaris Umum</option>
                    <option value="Bendahara Yayasan">Bendahara Yayasan</option>
                    <option value="Koordinator Sarana & Aset">Koordinator Sarana & Aset</option>
                    <option value="Bidang Misi & Pelayanan">Bidang Misi & Pelayanan</option>
                    <option value="Bidang KTB & Alumni">Bidang KTB & Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Status Disposisi:</label>
                  <select
                    className="form-select"
                    value={incomingFormData.status}
                    onChange={(e) => setIncomingFormData({ ...incomingFormData, status: e.target.value })}
                  >
                    <option value="DITERIMA">DITERIMA (Baru)</option>
                    <option value="DIDISPOSISIKAN">DIDISPOSISIKAN</option>
                    <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="DIARSIPKAN">DIARSIPKAN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Petunjuk / Catatan Instruksi Disposisi:</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Instruksi tindak lanjut dari pimpinan yayasan..."
                  value={incomingFormData.disposition_notes}
                  onChange={(e) => setIncomingFormData({ ...incomingFormData, disposition_notes: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Tautan Dokumen / File Scan Surat</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://... atau nomor ordner fisik"
                value={incomingFormData.file_url}
                onChange={(e) => setIncomingFormData({ ...incomingFormData, file_url: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
            >
              <Inbox size={15} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Surat Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 5: LEMBAR DISPOSISI SURAT MASUK
// ============================================================================
interface PreviewIncomingModalProps {
  previewIncoming: IncomingLetter | null;
  onClose: () => void;
}

export const PreviewIncomingModal: React.FC<PreviewIncomingModalProps> = ({
  previewIncoming,
  onClose,
}) => {
  if (!previewIncoming) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-card" style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <FileCheck size={18} color="#16a34a" /> Lembar Disposisi Surat Masuk
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          <div
            style={{
              border: '2px solid #0f172a',
              padding: 24,
              background: '#ffffff',
              color: '#0f172a',
            }}
          >
            {/* Header Disposisi */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase' }}>
                Yayasan Global Mission House (GMH PA KMK)
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
                LEMBAR DISPOSISI SURAT MASUK
              </div>
            </div>

            {/* Agenda Info Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 0', width: 150, fontWeight: 600 }}>Nomor Agenda</td>
                  <td style={{ width: 10 }}>:</td>
                  <td style={{ fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>
                    {previewIncoming.agenda_number}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Tanggal Diterima</td>
                  <td>:</td>
                  <td>{formatDateID(previewIncoming.received_date)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Surat Dari</td>
                  <td>:</td>
                  <td style={{ fontWeight: 600 }}>
                    {previewIncoming.sender_name}{' '}
                    {previewIncoming.sender_institution && `(${previewIncoming.sender_institution})`}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Nomor Surat Asal</td>
                  <td>:</td>
                  <td style={{ fontFamily: 'monospace' }}>{previewIncoming.sender_letter_number}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Tanggal Surat</td>
                  <td>:</td>
                  <td>{formatDateID(previewIncoming.letter_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', fontWeight: 600 }}>Perihal</td>
                  <td>:</td>
                  <td style={{ fontWeight: 700 }}>{previewIncoming.subject}</td>
                </tr>
              </tbody>
            </table>

            {/* Disposition Instruction Box */}
            <div
              style={{
                border: '1.5px solid #0f172a',
                padding: 16,
                background: '#f8fafc',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1e40af' }}>
                DITERUSKAN KEPADA: {previewIncoming.disposition_to || '-'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                INSTRUKSI / CATATAN TINDAK LANJUT:
              </div>
              <div
                style={{
                  minHeight: 70,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: 10,
                  borderRadius: 4,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {previewIncoming.disposition_notes || '- Tidak ada catatan instruksi khusus -'}
              </div>
            </div>

            {/* Paraf / Tanda Tangan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'center', fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Disposisi Oleh (Pimpinan Yayasan):</div>
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  (Paraf / Tanda Tangan)
                </div>
                <div style={{ borderTop: '1px solid #0f172a', width: '80%', margin: '0 auto', paddingTop: 4 }}>
                  Ketua Umum / Sekretaris
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600 }}>Penerima Disposisi:</div>
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  (Paraf / Tanda Tangan)
                </div>
                <div style={{ borderTop: '1px solid #0f172a', width: '80%', margin: '0 auto', paddingTop: 4 }}>
                  {previewIncoming.disposition_to || 'Pejabat Terkait'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <span className="badge badge-success">Status: {previewIncoming.status}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
            >
              Tutup
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
            >
              <Printer size={15} /> Cetak Lembar Disposisi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 6: EDIT SURAT MASUK
// ============================================================================
interface EditIncomingModalProps {
  editingIncoming: IncomingLetter | null;
  onClose: () => void;
  setEditingIncoming: React.Dispatch<React.SetStateAction<IncomingLetter | null>>;
  handleUpdateIncoming: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}

export const EditIncomingModal: React.FC<EditIncomingModalProps> = ({
  editingIncoming,
  onClose,
  setEditingIncoming,
  handleUpdateIncoming,
  isSubmitting,
}) => {
  if (!editingIncoming) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-card" style={{ maxWidth: 640, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            Ubah Surat Masuk: {editingIncoming.agenda_number}
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUpdateIncoming}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Nomor Surat Asal *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingIncoming.sender_letter_number}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_letter_number: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                <select
                  className="form-select"
                  value={editingIncoming.status}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, status: e.target.value })}
                >
                  <option value="DITERIMA">DITERIMA</option>
                  <option value="DIDISPOSISIKAN">DIDISPOSISIKAN</option>
                  <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DIARSIPKAN">DIARSIPKAN</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Pengirim *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingIncoming.sender_name}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Instansi Asal</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingIncoming.sender_institution || ''}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_institution: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
              <input
                type="text"
                className="form-input"
                value={editingIncoming.subject}
                onChange={(e) => setEditingIncoming({ ...editingIncoming, subject: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Disposisi Kepada</label>
                <select
                  className="form-select"
                  value={editingIncoming.disposition_to || ''}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, disposition_to: e.target.value })}
                >
                  <option value="Ketua Pembina Yayasan">Ketua Pembina Yayasan</option>
                  <option value="Ketua Umum Pengurus Harian">Ketua Umum Pengurus Harian</option>
                  <option value="Sekretaris Umum">Sekretaris Umum</option>
                  <option value="Bendahara Yayasan">Bendahara Yayasan</option>
                  <option value="Koordinator Sarana & Aset">Koordinator Sarana & Aset</option>
                  <option value="Bidang Misi & Pelayanan">Bidang Misi & Pelayanan</option>
                  <option value="Bidang KTB & Alumni">Bidang KTB & Alumni</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Diterima</label>
                <input
                  type="date"
                  className="form-input"
                  value={editingIncoming.received_date}
                  onChange={(e) => setEditingIncoming({ ...editingIncoming, received_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Petunjuk / Catatan Disposisi</label>
              <textarea
                className="form-input"
                rows={3}
                value={editingIncoming.disposition_notes || ''}
                onChange={(e) => setEditingIncoming({ ...editingIncoming, disposition_notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={isSubmitting}
              style={{ color: '#fff' }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
