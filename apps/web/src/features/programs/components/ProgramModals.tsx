import React from 'react';
import { X, Save } from 'lucide-react';
import NominalInput from '../../../components/NominalInput';
import type { Program } from '../types';

interface ProgramModalsProps {
  // Add Modal State & Handlers
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  title: string;
  setTitle: (t: string) => void;
  category: string;
  setCategory: (c: string) => void;
  lookups: any;
  fieldLabels: Record<string, string>;
  eventDatetime: string;
  setEventDatetime: (dt: string) => void;
  location: string;
  setLocation: (loc: string) => void;
  theme: string;
  setTheme: (th: string) => void;
  speakerName: string;
  setSpeakerName: (spk: string) => void;
  budgetEstimate: number | string;
  setBudgetEstimate: (b: number | string) => void;
  description: string;
  setDescription: (desc: string) => void;
  isSubmitting: boolean;
  handleCreateProgram: (e: React.FormEvent) => void;

  // Edit Modal State & Handlers
  editingProgram: Program | null;
  setEditingProgram: React.Dispatch<React.SetStateAction<Program | null>>;
  handleSaveProgramDetails: (e: React.FormEvent) => void;
}

export const ProgramModals: React.FC<ProgramModalsProps> = ({
  showAddModal,
  setShowAddModal,
  title,
  setTitle,
  category,
  setCategory,
  lookups,
  fieldLabels,
  eventDatetime,
  setEventDatetime,
  location,
  setLocation,
  theme,
  setTheme,
  speakerName,
  setSpeakerName,
  budgetEstimate,
  setBudgetEstimate,
  description,
  setDescription,
  isSubmitting,
  handleCreateProgram,
  editingProgram,
  setEditingProgram,
  handleSaveProgramDetails,
}) => {
  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MODAL: TAMBAH / JADWALKAN PROGRAM BARU                                 */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 540 }}>
            <div className="card-header">
              <div className="card-title">Jadwalkan Program / Acara Baru</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateProgram}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">
                    Nama Program / Acara <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Persekutuan Alumni Bulanan PA KMK"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">{fieldLabels['program.category'] || 'Kategori'}</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {(lookups?.programCategories || [
                        'Persekutuan Alumni',
                        'Seminar & Workshop',
                        'Retret & Doa Semalam',
                        'Rapat Kerja Yayasan',
                      ]).map((cat: string) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Waktu Pelaksanaan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDatetime}
                      onChange={(e) => setEventDatetime(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Lokasi / Venue</label>
                    <input
                      type="text"
                      placeholder="Rumah Persekutuan GMH / Zoom"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={budgetEstimate}
                      onChange={setBudgetEstimate}
                      placeholder="Estimasi total dana..."
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tema Program (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Menjadi Garam dan Terang di Dunia Kerja"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Pembicara / Pelayan Utama (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dr. Ir. T. Pardede, M.Sc"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Uraian Deskripsi / Tujuan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Catatan rincian acara atau tujuan program..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: 65 }}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan & Jadwalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL: EDIT RINCIAN PROGRAM                                            */}
      {/* ========================================================================= */}
      {editingProgram && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 560 }}>
            <div className="card-header">
              <div className="card-title">Edit Rincian Program Kegiatan</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditingProgram(null)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveProgramDetails}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">Nama Program</label>
                  <input
                    type="text"
                    value={editingProgram.program_title}
                    onChange={(e) => setEditingProgram({ ...editingProgram, program_title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={editingProgram.program_category}
                      onChange={(e) => setEditingProgram({ ...editingProgram, program_category: e.target.value })}
                    >
                      {(lookups?.programCategories || [
                        'Persekutuan Alumni',
                        'Seminar & Workshop',
                        'Retret & Doa Semalam',
                        'Rapat Kerja Yayasan',
                      ]).map((cat: string) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Waktu Pelaksanaan</label>
                    <input
                      type="datetime-local"
                      value={editingProgram.event_datetime ? editingProgram.event_datetime.slice(0, 16) : ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, event_datetime: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Lokasi / Venue</label>
                    <input
                      type="text"
                      value={editingProgram.location || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, location: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={editingProgram.budget_estimate || ''}
                      onChange={(val) => setEditingProgram({ ...editingProgram, budget_estimate: Number(val) })}
                      placeholder="Rp..."
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tema Program</label>
                  <input
                    type="text"
                    value={editingProgram.theme || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, theme: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Pembicara / Pelayan Utama</label>
                  <input
                    type="text"
                    value={editingProgram.speaker_name || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, speaker_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Uraian Deskripsi &amp; Agenda</label>
                  <textarea
                    rows={3}
                    value={editingProgram.description || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                    className="form-textarea"
                    style={{ minHeight: 65 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Link Media Google Drive</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={editingProgram.media_drive_url || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, media_drive_url: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Link Dokumen Google Drive</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={editingProgram.document_drive_url || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, document_drive_url: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingProgram(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
