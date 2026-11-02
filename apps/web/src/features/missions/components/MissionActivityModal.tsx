import React, { useState, useEffect, useMemo } from 'react';
import NominalInput from '../../../components/NominalInput';
import type { MissionActivity } from '../types';
import { generateTimePreview } from '../types';
import { api } from '../../../services/api';

interface MissionActivityModalProps {
  showRintisModal: boolean;
  onCloseRintis: () => void;
  onCreated: (newAct: MissionActivity) => void;
  editingActivity: MissionActivity | null;
  onCloseEdit: () => void;
  onUpdated: (updatedAct: MissionActivity) => void;
  showToast: (msg: string) => void;
}

export const MissionActivityModal: React.FC<MissionActivityModalProps> = ({
  showRintisModal,
  onCloseRintis,
  onCreated,
  editingActivity,
  onCloseEdit,
  onUpdated,
  showToast,
}) => {
  const [formRintis, setFormRintis] = useState({
    title: '',
    theme: '',
    budgetEstimate: 0,
    coordinator: '',
    location: '',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00',
    description: '',
    mediaDriveUrl: '',
    documentDriveUrl: '',
  });

  const [editForm, setEditForm] = useState<MissionActivity | null>(null);

  useEffect(() => {
    if (editingActivity) {
      setEditForm({ ...editingActivity });
    } else {
      setEditForm(null);
    }
  }, [editingActivity]);

  const timePreviewComputed = useMemo(() => {
    return generateTimePreview(formRintis.eventDate, formRintis.startTime, formRintis.endTime);
  }, [formRintis.eventDate, formRintis.startTime, formRintis.endTime]);

  const handleSimpanRintis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRintis.title.trim()) {
      alert('Nama kegiatan wajib diisi.');
      return;
    }
    try {
      const payload = {
        title: formRintis.title.trim(),
        theme: formRintis.theme.trim() || undefined,
        budgetEstimate: formRintis.budgetEstimate || 0,
        coordinator: formRintis.coordinator.trim() || undefined,
        location: formRintis.location.trim() || undefined,
        eventDate: formRintis.eventDate || undefined,
        startTime: formRintis.startTime || undefined,
        endTime: formRintis.endTime || undefined,
        timePreview: timePreviewComputed,
        description: formRintis.description.trim() || undefined,
        mediaDriveUrl: formRintis.mediaDriveUrl.trim() || undefined,
        documentDriveUrl: formRintis.documentDriveUrl.trim() || undefined,
        status: 'ON_PROGRESS',
        cashBalance: 0,
        transactions: [],
        rundown: [],
        tasks: [],
        committees: [],
      };

      const res = await api.missions.create(payload);
      const created: MissionActivity = res?.activity || {
        id: `act-${Date.now()}`,
        ...payload,
        budget_estimate: payload.budgetEstimate,
        cash_balance: 0,
      };

      onCreated(created);
      showToast(`Dokumen kegiatan "${created.title}" berhasil dirintis!`);
      onCloseRintis();
      setFormRintis({
        title: '',
        theme: '',
        budgetEstimate: 0,
        coordinator: '',
        location: '',
        eventDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '12:00',
        description: '',
        mediaDriveUrl: '',
        documentDriveUrl: '',
      });
    } catch (err: any) {
      alert('Gagal membuat kegiatan: ' + err.message);
    }
  };

  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      const res = await api.missions.update(editForm.id, {
        title: editForm.title,
        theme: editForm.theme,
        budgetEstimate: editForm.budget_estimate,
        coordinator: editForm.coordinator,
        location: editForm.location,
        timePreview: editForm.time_preview,
        description: editForm.description,
        mediaDriveUrl: editForm.media_drive_url,
        documentDriveUrl: editForm.document_drive_url,
      });

      const updated = res?.activity || { ...editForm };
      onUpdated(updated);
      showToast('Rincian kegiatan berhasil diperbarui.');
      onCloseEdit();
    } catch (err: any) {
      alert('Gagal update: ' + err.message);
    }
  };

  return (
    <>
      {/* FLOATING MODAL: RINTIS DOKUMEN KEGIATAN BARU */}
      {showRintisModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={onCloseRintis}
        >
          <div
            className="modal"
            style={{
              maxWidth: 540,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>Rintis Dokumen Kegiatan Baru</div>
              <button
                type="button"
                onClick={onCloseRintis}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanRintis} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Nama Kegiatan / Agenda Resmi (Wajib)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Perayaan Natal Yayasan MMB 2026"
                    value={formRintis.title}
                    onChange={(e) => setFormRintis({ ...formRintis, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tema Kegiatan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Terang Dunia Terbitlah"
                      value={formRintis.theme}
                      onChange={(e) => setFormRintis({ ...formRintis, theme: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Taksasi Dana Dibutuhkan (Rp)</label>
                    <NominalInput
                      value={formRintis.budgetEstimate}
                      onChange={(val) => setFormRintis({ ...formRintis, budgetEstimate: val })}
                      placeholder="Perkiraan dana..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Kordinator Kegiatan / Pelayan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Yusuf (Kordinator Natal), Angel (Logistik), dll."
                    value={formRintis.coordinator}
                    onChange={(e) => setFormRintis({ ...formRintis, coordinator: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Tempat / Lokasi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Aula Serbaguna Wisma MMB"
                    value={formRintis.location}
                    onChange={(e) => setFormRintis({ ...formRintis, location: e.target.value })}
                  />
                </div>

                <div
                  style={{
                    border: '1px solid var(--gmh-border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gmh-text)' }}>Format Waktu</span>
                    <span style={{ fontSize: 11, color: '#64748b', cursor: 'pointer' }}>Tulis Manual</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Tanggal Kegiatan</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formRintis.eventDate}
                      onChange={(e) => setFormRintis({ ...formRintis, eventDate: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Jam Mulai</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formRintis.startTime}
                        onChange={(e) => setFormRintis({ ...formRintis, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Jam Selesai</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formRintis.endTime}
                        onChange={(e) => setFormRintis({ ...formRintis, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--gmh-text)',
                    }}
                  >
                    <strong>Pratinjau:</strong> {timePreviewComputed}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gambaran Ringkas Acara (Deskripsi)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Uraikan deskripsi singkat maksud diadakan perayaan natal atau retreat ini..."
                    value={formRintis.description}
                    onChange={(e) => setFormRintis({ ...formRintis, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tautan Foto/Video (Google Drive)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={formRintis.mediaDriveUrl}
                      onChange={(e) => setFormRintis({ ...formRintis, mediaDriveUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Dokumen Tambahan / Surat (Google Drive)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={formRintis.documentDriveUrl}
                      onChange={(e) => setFormRintis({ ...formRintis, documentDriveUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--gmh-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: '#f8fafc',
                }}
              >
                <button type="button" className="btn btn-outline" onClick={onCloseRintis}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '8px 20px',
                  }}
                >
                  Simpan &amp; Buka Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING MODAL: EDIT RINCIAN DOKUMEN KEGIATAN */}
      {editForm && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={onCloseEdit}
        >
          <div
            className="modal"
            style={{
              maxWidth: 540,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Edit Rincian: {editForm.title}</div>
              <button type="button" className="btn-close" onClick={onCloseEdit}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSimpanEdit} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nama Kegiatan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tema</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.theme || ''}
                      onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={Number(editForm.budget_estimate) || 0}
                      onChange={(val) => setEditForm({ ...editForm, budget_estimate: val })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Kordinator</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.coordinator || ''}
                      onChange={(e) => setEditForm({ ...editForm, coordinator: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lokasi</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Waktu Pelaksanaan (Teks)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.time_preview || ''}
                    onChange={(e) => setEditForm({ ...editForm, time_preview: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Ringkas</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tautan Foto/Video</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.media_drive_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, media_drive_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dokumen Surat Tambahan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.document_drive_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, document_drive_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--gmh-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: '#f8fafc',
                }}
              >
                <button type="button" className="btn btn-outline" onClick={onCloseEdit}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 600 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
