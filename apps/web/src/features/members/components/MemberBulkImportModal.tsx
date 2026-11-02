import React, { useRef } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DryRunRow } from '../types';

interface MemberBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkStep: 'UPLOAD' | 'DRY_RUN' | 'SUCCESS';
  setBulkStep: React.Dispatch<React.SetStateAction<'UPLOAD' | 'DRY_RUN' | 'SUCCESS'>>;
  dryRunRows: DryRunRow[];
  importSummary: { total: number; valid: number; error: number };
  uploadedFileName: string;
  isSaving: boolean;
  saveProgress: {
    currentBatch: number;
    totalBatches: number;
    processed: number;
    total: number;
    percent: number;
  };
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDropFile: (file: File) => void;
  onDownloadTemplate: () => void;
  onLoadSample: () => void;
  onCommitImport: () => void;
}

export const MemberBulkImportModal: React.FC<MemberBulkImportModalProps> = ({
  isOpen,
  onClose,
  bulkStep,
  setBulkStep,
  dryRunRows,
  importSummary,
  uploadedFileName,
  isSaving,
  saveProgress,
  onFileUpload,
  onDropFile,
  onDownloadTemplate,
  onLoadSample,
  onCommitImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={22} color="var(--gmh-green)" />
            <div>
              <h3>Impor Bulk Data Anggota via File Excel</h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Mendukung format .xlsx dan .csv dengan sistem Two-Phase Dry Run Validation
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {bulkStep === 'UPLOAD' && (
            <div>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .txt, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: 'none' }}
                onChange={onFileUpload}
              />

              {/* Clickable Dropzone Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--gmh-green)';
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--gmh-border-dark)';
                  e.currentTarget.style.background = 'var(--gmh-surface-2)';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--gmh-border-dark)';
                  e.currentTarget.style.background = 'var(--gmh-surface-2)';
                  const file = e.dataTransfer.files?.[0];
                  if (file) onDropFile(file);
                }}
                style={{
                  border: '2px dashed var(--gmh-border-dark)',
                  borderRadius: 10,
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'var(--gmh-surface-2)',
                  marginBottom: 20,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: 'var(--gmh-green)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Upload size={28} />
                </div>

                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                  Klik untuk Memilih File atau Drag &amp; Drop ke Sini
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--gmh-text-muted)', marginBottom: 18, maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.5 }}>
                  Mendukung format file <strong>.xlsx</strong> dan <strong>.csv</strong>. Kolom wajib: Nama Lengkap, NIK (16 digit), Fakultas, Jurusan, Tahun Masuk, Nomor HP/WA.
                </div>

                <div
                  style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650 }}
                  >
                    <Upload size={14} /> Pilih File dari Komputer
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onDownloadTemplate}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650 }}
                    title="Unduh format template CSV/Excel yang sudah disesuaikan dengan sistem"
                  >
                    <Download size={14} /> Unduh Format Template Excel (.csv)
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={onLoadSample}
                    style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}
                  >
                    Simulasikan Unggah Contoh (4 Baris)
                  </button>
                </div>
              </div>
            </div>
          )}

          {bulkStep === 'DRY_RUN' && (
            <div>
              {isSaving ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      border: '4px solid #e2e8f0',
                      borderTopColor: 'var(--gmh-green)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 16px',
                    }}
                  />
                  <h4 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                    Menyimpan ke Database Yayasan...
                  </h4>
                  <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, marginBottom: 18 }}>
                    Memproses <strong>Batch {saveProgress.currentBatch}</strong> dari {saveProgress.totalBatches} ({saveProgress.processed} dari {saveProgress.total} data tersimpan bertahap per 100 baris)
                  </p>

                  <div style={{ width: '100%', maxWidth: 440, height: 12, background: '#f1f5f9', borderRadius: 999, margin: '0 auto', overflow: 'hidden', border: '1px solid var(--gmh-border)' }}>
                    <div
                      style={{
                        width: `${saveProgress.percent}%`,
                        height: '100%',
                        background: 'var(--gmh-green)',
                        borderRadius: 999,
                        transition: 'width 0.25s ease',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--gmh-green)' }}>
                    {saveProgress.percent}% Selesai
                  </div>
                </div>
              ) : (
                <>
                  {uploadedFileName && (
                    <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)', marginBottom: 14 }}>
                      Berkas yang diproses: <strong style={{ color: 'var(--gmh-text-main)' }}>{uploadedFileName}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <div className="card" style={{ flex: 1, padding: '12px 16px' }}>
                      <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Total Baris Terdeteksi</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{importSummary.total}</div>
                    </div>
                    <div className="card" style={{ flex: 1, padding: '12px 16px', borderLeft: '4px solid var(--gmh-green)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Valid &amp; Siap Disimpan</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-green)' }}>{importSummary.valid}</div>
                    </div>
                    <div className="card" style={{ flex: 1, padding: '12px 16px', borderLeft: '4px solid var(--gmh-danger)' }}>
                      <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Error Validasi</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-danger)' }}>{importSummary.error}</div>
                    </div>
                  </div>

                  <div className="table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Baris</th>
                          <th>Status</th>
                          <th>Nama Lengkap</th>
                          <th>NIK</th>
                          <th>Fakultas / Jurusan</th>
                          <th>Tahun Masuk</th>
                          <th>Catatan Validasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunRows.map((r) => (
                          <tr key={r.index} style={{ background: r.status === 'ERROR' ? '#fff1f2' : undefined }}>
                            <td>#{r.index}</td>
                            <td>
                              {r.status === 'VALID' ? (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle size={10} /> Valid
                                </span>
                              ) : (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <AlertTriangle size={10} /> Error
                                </span>
                              )}
                            </td>
                            <td style={{ fontWeight: 600 }}>{r.name}</td>
                            <td><code>{r.nik}</code></td>
                            <td>{r.faculty} - {r.major}</td>
                            <td>{r.entryYear}</td>
                            <td style={{ fontSize: 11.5, color: r.status === 'ERROR' ? 'var(--gmh-danger)' : 'var(--gmh-text-muted)' }}>
                              {r.errorReason || 'Semua kolom valid'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {bulkStep === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <CheckCircle size={48} color="var(--gmh-green)" style={{ marginBottom: 12 }} />
              <h3>Impor Bulk Berhasil Diselesaikan!</h3>
              <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13.5 }}>
                {importSummary.valid} data anggota alumni telah masuk ke database yayasan dan telah diterbitkan Nomor Induk Anggota (NIA) resmi.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {bulkStep === 'UPLOAD' && (
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
          )}
          {bulkStep === 'DRY_RUN' && (
            <>
              <button
                className="btn btn-outline btn-sm"
                disabled={isSaving}
                onClick={() => setBulkStep('UPLOAD')}
              >
                Unggah Ulang
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={importSummary.valid === 0 || isSaving}
                onClick={onCommitImport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isSaving ? (
                  <>Menyimpan ({saveProgress.percent}%)...</>
                ) : (
                  <>Simpan {importSummary.valid} Baris Valid (Batch 100)</>
                )}
              </button>
            </>
          )}
          {bulkStep === 'SUCCESS' && (
            <button className="btn btn-primary btn-sm" onClick={onClose}>
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
