import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trash2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import type {
  LookupMember,
  CommitteeRecord,
  OrgPosition,
  OrgTenure,
  StaffMember,
  Division,
  DivisionMember,
  CommitteeFormState,
  PositionFormState,
  TenureFormState,
  StaffFormState,
  DivisionFormState,
  DivisionMemberFormState,
} from '../types';

// ============================================================================
// MODAL 1: Catat / Edit Kepanitiaan
// ============================================================================
interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCommittee: CommitteeRecord | null;
  committeeForm: CommitteeFormState;
  setCommitteeForm: React.Dispatch<React.SetStateAction<CommitteeFormState>>;
  saveCommittee: (e: React.FormEvent) => Promise<void>;
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  searchMembers: (val: string) => Promise<void>;
  memberOptions: LookupMember[];
}

export const CommitteeModal: React.FC<CommitteeModalProps> = ({
  isOpen,
  onClose,
  editingCommittee,
  committeeForm,
  setCommitteeForm,
  saveCommittee,
  memberSearchQuery,
  setMemberSearchQuery,
  searchMembers,
  memberOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 540, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {editingCommittee ? 'Ubah Record Kepanitiaan' : 'Catat Kepanitiaan Baru'}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={saveCommittee} style={{ display: 'grid', gap: 14 }}>
          {/* Member Picker */}
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Pilih Anggota yang Melayani <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ marginBottom: 6 }}>
              <input
                placeholder="Ketik untuk filter nama anggota..."
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  void searchMembers(e.target.value);
                }}
                className="form-input form-input-sm"
                style={{ fontSize: 12 }}
              />
            </div>
            <select
              required
              value={committeeForm.member_id}
              onChange={(e) => setCommitteeForm({ ...committeeForm, member_id: e.target.value })}
              className="form-select form-select-sm"
              style={{ fontSize: 13 }}
            >
              <option value="">-- Pilih Anggota Terdaftar --</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Nama Kepanitiaan / Kegiatan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              required
              placeholder="Contoh: Panitia Natal Bersama Alumni 2025"
              value={committeeForm.committee_name}
              onChange={(e) => setCommitteeForm({ ...committeeForm, committee_name: e.target.value })}
              className="form-input form-input-sm"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Posisi / Jabatan Kepanitiaan <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                required
                placeholder="Contoh: Ketua Panitia / Sie Acara"
                value={committeeForm.role_title}
                onChange={(e) => setCommitteeForm({ ...committeeForm, role_title: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Tahun / Periode
              </label>
              <input
                placeholder="Contoh: 2025"
                value={committeeForm.period}
                onChange={(e) => setCommitteeForm({ ...committeeForm, period: e.target.value, event_year: Number(e.target.value) || 2025 })}
                className="form-input form-input-sm"
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Status Kepanitiaan
            </label>
            <select
              value={committeeForm.status}
              onChange={(e) => setCommitteeForm({ ...committeeForm, status: e.target.value as 'AKTIF' | 'SELESAI' })}
              className="form-select form-select-sm"
            >
              <option value="AKTIF">Aktif (Sedang Bertugas)</option>
              <option value="SELESAI">Selesai / Demisioner</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Keterangan / Tanggung Jawab / Pencapaian
            </label>
            <textarea
              rows={3}
              placeholder="Rincian deskripsi tugas atau hasil kegiatan..."
              value={committeeForm.description}
              onChange={(e) => setCommitteeForm({ ...committeeForm, description: e.target.value })}
              className="form-input form-input-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 2: Tambah / Ubah Struktur Jabatan Inti
// ============================================================================
interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPosition: OrgPosition | null;
  positionForm: PositionFormState;
  setPositionForm: React.Dispatch<React.SetStateAction<PositionFormState>>;
  savePosition: (e: React.FormEvent) => Promise<void>;
}

export const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  editingPosition,
  positionForm,
  setPositionForm,
  savePosition,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 520, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {editingPosition ? 'Ubah Struktur Jabatan' : 'Tambah Struktur Jabatan Baru'}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={savePosition} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Nama Jabatan Kepengurusan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              required
              placeholder="Contoh: Ketua Dewan Pembina / Bendahara Umum"
              value={positionForm.title}
              onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
              className="form-input form-input-sm"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Kategori Badan
              </label>
              <select
                value={positionForm.category}
                onChange={(e) => setPositionForm({ ...positionForm, category: e.target.value })}
                className="form-select form-select-sm"
              >
                <option value="DEWAN_PEMBINA">Dewan Pembina</option>
                <option value="DEWAN_PENGAWAS">Dewan Pengawas</option>
                <option value="PENGURUS_HARIAN">Dewan Pengurus Harian</option>
                <option value="LAINNYA">Struktur Khusus Lainnya</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Kode Jabatan (Opsional)
              </label>
              <input
                placeholder="Contoh: KETUA_UMUM"
                value={positionForm.position_code}
                onChange={(e) => setPositionForm({ ...positionForm, position_code: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Deskripsi Fungsi & Tanggung Jawab Jabatan
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan peran pokok dan wewenang jabatan ini dalam yayasan..."
              value={positionForm.function_description}
              onChange={(e) => setPositionForm({ ...positionForm, function_description: e.target.value })}
              className="form-input form-input-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Jabatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 2B: Tugaskan Pejabat ke Posisi
// ============================================================================
interface AssignTenureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPositionForHistory: OrgPosition | null;
  tenureForm: TenureFormState;
  setTenureForm: React.Dispatch<React.SetStateAction<TenureFormState>>;
  saveTenure: (e: React.FormEvent) => Promise<void>;
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  searchMembers: (val: string) => Promise<void>;
  memberOptions: LookupMember[];
}

export const AssignTenureModal: React.FC<AssignTenureModalProps> = ({
  isOpen,
  onClose,
  selectedPositionForHistory,
  tenureForm,
  setTenureForm,
  saveTenure,
  memberSearchQuery,
  setMemberSearchQuery,
  searchMembers,
  memberOptions,
}) => {
  if (!isOpen || !selectedPositionForHistory) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 520, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Tugaskan Pejabat: {selectedPositionForHistory.title}
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>Pilih anggota yayasan yang memegang jabatan ini</span>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={saveTenure} style={{ display: 'grid', gap: 14 }}>
          {/* Member lookup */}
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ marginBottom: 6 }}>
              <input
                placeholder="Ketik untuk filter nama anggota..."
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  void searchMembers(e.target.value);
                }}
                className="form-input form-input-sm"
                style={{ fontSize: 12 }}
              />
            </div>
            <select
              required
              value={tenureForm.member_id}
              onChange={(e) => setTenureForm({ ...tenureForm, member_id: e.target.value })}
              className="form-select form-select-sm"
            >
              <option value="">-- Pilih Anggota Terdaftar --</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Periode Menjabat <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                required
                placeholder="Contoh: 2024 - 2027"
                value={tenureForm.period}
                onChange={(e) => setTenureForm({ ...tenureForm, period: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Nomor SK Pengangkatan
              </label>
              <input
                placeholder="Contoh: SK-GMH/01/2024"
                value={tenureForm.decree_number}
                onChange={(e) => setTenureForm({ ...tenureForm, decree_number: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={tenureForm.is_current}
                onChange={(e) => setTenureForm({ ...tenureForm, is_current: e.target.checked })}
              />
              <span>Tetapkan sebagai Pejabat Aktif Saat Ini</span>
            </label>
            <div style={{ fontSize: 11, color: '#64748b', marginLeft: 22, marginTop: 2 }}>
              Jika dicentang, pejabat aktif sebelumnya pada posisi ini otomatis diubah menjadi demisioner/riwayat masa lalu.
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Catatan Pelayanan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan surat keputusan rapat alumni / pelantikan..."
              value={tenureForm.notes}
              onChange={(e) => setTenureForm({ ...tenureForm, notes: e.target.value })}
              className="form-input form-input-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Pejabat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 2C: Riwayat Pejabat Posisi
// ============================================================================
interface PositionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPositionForHistory: OrgPosition | null;
  loadingTenures: boolean;
  positionTenures: OrgTenure[];
  deleteTenure: (tenureId: string) => Promise<void>;
  openAssignTenureModal: () => void;
}

export const PositionHistoryModal: React.FC<PositionHistoryModalProps> = ({
  isOpen,
  onClose,
  selectedPositionForHistory,
  loadingTenures,
  positionTenures,
  deleteTenure,
  openAssignTenureModal,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !selectedPositionForHistory) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 680, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Riwayat Pejabat: {selectedPositionForHistory.title}
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Rekam jejak seluruh anggota yang pernah memegang jabatan ini dari masa ke masa
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {loadingTenures ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Memuat riwayat pejabat dari database...
          </div>
        ) : positionTenures.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Belum ada data riwayat pejabat untuk jabatan ini.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {positionTenures.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  background: t.is_current ? '#f0fdf4' : '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${t.member_id}`)}
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
                      <span>{t.member_name}</span>
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </button>
                    {t.is_current ? (
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: '#22c55e', color: '#ffffff', padding: '1px 6px', borderRadius: 99 }}>
                        Pejabat Aktif
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, fontWeight: 650, background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: 99 }}>
                        Demisioner
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                    Periode: <strong style={{ color: '#0f172a' }}>{t.period}</strong>
                    {t.decree_number && <span> · No. SK: {t.decree_number}</span>}
                  </div>

                  {t.notes && (
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                      "{t.notes}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => void deleteTenure(t.id)}
                  title="Hapus Record Riwayat"
                  style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '4px 6px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openAssignTenureModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Catat Riwayat / Pejabat Baru
          </button>

          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 3: Tambah / Ubah Staf Full-Time
// ============================================================================
interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: StaffMember | null;
  staffForm: StaffFormState;
  setStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>;
  saveStaff: (e: React.FormEvent) => Promise<void>;
  divisions: Division[];
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  searchMembers: (val: string) => Promise<void>;
  memberOptions: LookupMember[];
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  editingStaff,
  staffForm,
  setStaffForm,
  saveStaff,
  divisions,
  memberSearchQuery,
  setMemberSearchQuery,
  searchMembers,
  memberOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 540, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {editingStaff ? 'Ubah Data Staf Full-Time' : 'Tambah Staf Penuh Waktu Baru'}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={saveStaff} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ marginBottom: 6 }}>
              <input
                placeholder="Ketik untuk filter nama anggota..."
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  void searchMembers(e.target.value);
                }}
                className="form-input form-input-sm"
                style={{ fontSize: 12 }}
              />
            </div>
            <select
              required
              value={staffForm.member_id}
              onChange={(e) => setStaffForm({ ...staffForm, member_id: e.target.value })}
              className="form-select form-select-sm"
            >
              <option value="">-- Pilih Anggota Terdaftar --</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Posisi / Jabatan Staf <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                required
                placeholder="Contoh: Manajer Operasional"
                value={staffForm.position_title}
                onChange={(e) => setStaffForm({ ...staffForm, position_title: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Divisi / Departemen
              </label>
              <select
                value={staffForm.department_id}
                onChange={(e) => setStaffForm({ ...staffForm, department_id: e.target.value })}
                className="form-select form-select-sm"
              >
                <option value="">-- Kantor Operasional Yayasan --</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Tanggal Bergabung
              </label>
              <input
                type="date"
                value={staffForm.joined_date}
                onChange={(e) => setStaffForm({ ...staffForm, joined_date: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Status Staf
              </label>
              <select
                value={staffForm.status}
                onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value, is_active: e.target.value === 'AKTIF' })}
                className="form-select form-select-sm"
              >
                <option value="AKTIF">Aktif</option>
                <option value="CUTI">Cuti</option>
                <option value="PURNA_TUGAS">Purna Tugas / Resign</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Deskripsi Tugas & Tanggung Jawab
            </label>
            <textarea
              rows={3}
              placeholder="Rincian deskripsi pekerjaan harian staf..."
              value={staffForm.job_description}
              onChange={(e) => setStaffForm({ ...staffForm, job_description: e.target.value })}
              className="form-input form-input-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Staf
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4: Tambah / Ubah Divisi
// ============================================================================
interface DivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDivision: Division | null;
  divisionForm: DivisionFormState;
  setDivisionForm: React.Dispatch<React.SetStateAction<DivisionFormState>>;
  saveDivision: (e: React.FormEvent) => Promise<void>;
  memberOptions: LookupMember[];
}

export const DivisionModal: React.FC<DivisionModalProps> = ({
  isOpen,
  onClose,
  editingDivision,
  divisionForm,
  setDivisionForm,
  saveDivision,
  memberOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 520, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {editingDivision ? 'Ubah Data Divisi' : 'Tambah Divisi Pelayanan Baru'}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={saveDivision} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Nama Divisi / Departemen <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              required
              placeholder="Contoh: Divisi Misi & Penginjilan"
              value={divisionForm.name}
              onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
              className="form-input form-input-sm"
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Koordinator / Ketua Divisi (Pilih dari Anggota)
            </label>
            <select
              value={divisionForm.head_member_id}
              onChange={(e) => setDivisionForm({ ...divisionForm, head_member_id: e.target.value })}
              className="form-select form-select-sm"
            >
              <option value="">-- Belum Ditetapkan --</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Deskripsi / Fokus Pelayanan Divisi
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan ruang lingkup dan program kerja divisi..."
              value={divisionForm.description}
              onChange={(e) => setDivisionForm({ ...divisionForm, description: e.target.value })}
              className="form-input form-input-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Divisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4B: Kelola Anggota Divisi & Record History
// ============================================================================
interface DivisionMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDivision: Division | null;
  loadingDivisionMembers: boolean;
  divisionMembers: DivisionMember[];
  divisionMemberFilterStatus: string;
  setDivisionMemberFilterStatus: (val: string) => void;
  loadDivisionMembers: (divId: string, status?: string) => Promise<void>;
  deleteDivisionMember: (assignmentId: string) => Promise<void>;
  openAddDivisionMemberModal: () => void;
}

export const DivisionMembersModal: React.FC<DivisionMembersModalProps> = ({
  isOpen,
  onClose,
  selectedDivision,
  loadingDivisionMembers,
  divisionMembers,
  divisionMemberFilterStatus,
  setDivisionMemberFilterStatus,
  loadDivisionMembers,
  deleteDivisionMember,
  openAddDivisionMemberModal,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !selectedDivision) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 720, width: '100%', padding: 24, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1060 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              Anggota & Riwayat Divisi: {selectedDivision.name}
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Daftar seluruh anggota yang aktif bertugas maupun yang pernah menjabat di divisi ini
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Filter Status Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'AKTIF', 'DEMISIONER'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setDivisionMemberFilterStatus(st);
                  void loadDivisionMembers(selectedDivision.id, st);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                  background: divisionMemberFilterStatus === st ? '#0f172a' : '#f8fafc',
                  color: divisionMemberFilterStatus === st ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                {st === 'ALL' ? 'Semua Status' : st === 'AKTIF' ? 'Aktif' : 'Demisioner / Alumni Divisi'}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={openAddDivisionMemberModal}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Plus size={13} /> Tugaskan Anggota
          </button>
        </div>

        {loadingDivisionMembers ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Memuat anggota divisi...
          </div>
        ) : divisionMembers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            Belum ada anggota yang terdaftar pada divisi ini.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {divisionMembers.map((m) => (
              <div
                key={m.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  background: m.status === 'AKTIF' ? '#ffffff' : '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/members/${m.member_id}`)}
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
                      <span>{m.member_name}</span>
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#ecfdf5', color: '#047857' }}>
                      {m.role_title}
                    </span>
                    {m.status === 'AKTIF' ? (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#22c55e', color: '#fff', padding: '1px 5px', borderRadius: 99 }}>
                        Aktif
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, background: '#e2e8f0', color: '#64748b', padding: '1px 5px', borderRadius: 99 }}>
                        Demisioner
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                    Periode: <strong>{m.period}</strong> · No. Anggota: {m.member_number}
                    {m.faculty && <span> ({m.faculty})</span>}
                  </div>

                  {m.notes && (
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3 }}>
                      Catatan: {m.notes}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => void deleteDivisionMember(m.id)}
                  title="Hapus Penugasan"
                  style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '4px 6px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL 4C: Tugaskan Anggota ke Divisi
// ============================================================================
interface AddDivisionMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDivision: Division | null;
  divisionMemberForm: DivisionMemberFormState;
  setDivisionMemberForm: React.Dispatch<React.SetStateAction<DivisionMemberFormState>>;
  saveDivisionMember: (e: React.FormEvent) => Promise<void>;
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  searchMembers: (val: string) => Promise<void>;
  memberOptions: LookupMember[];
}

export const AddDivisionMemberModal: React.FC<AddDivisionMemberModalProps> = ({
  isOpen,
  onClose,
  selectedDivision,
  divisionMemberForm,
  setDivisionMemberForm,
  saveDivisionMember,
  memberSearchQuery,
  setMemberSearchQuery,
  searchMembers,
  memberOptions,
}) => {
  if (!isOpen || !selectedDivision) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060, padding: 16 }}>
      <div className="modal-card modal-content" style={{ maxWidth: 500, width: '100%', padding: 22, borderRadius: 16, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1070 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: '#0f172a' }}>
            Tugaskan Anggota ke: {selectedDivision.name}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#64748b', borderRadius: 8, padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={saveDivisionMember} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Pilih Anggota <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ marginBottom: 6 }}>
              <input
                placeholder="Ketik untuk filter nama anggota..."
                value={memberSearchQuery}
                onChange={(e) => {
                  setMemberSearchQuery(e.target.value);
                  void searchMembers(e.target.value);
                }}
                className="form-input form-input-sm"
                style={{ fontSize: 12 }}
              />
            </div>
            <select
              required
              value={divisionMemberForm.member_id}
              onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, member_id: e.target.value })}
              className="form-select form-select-sm"
            >
              <option value="">-- Pilih Anggota Terdaftar --</option>
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.member_number}) {m.faculty ? `— ${m.faculty}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Peran / Jabatan Divisi <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                required
                placeholder="Contoh: Koordinator / Staf"
                value={divisionMemberForm.role_title}
                onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, role_title: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
                Periode Pelayanan
              </label>
              <input
                placeholder="Contoh: 2024 - Sekarang"
                value={divisionMemberForm.period}
                onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, period: e.target.value })}
                className="form-input form-input-sm"
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Status Keanggotaan Divisi
            </label>
            <select
              value={divisionMemberForm.status}
              onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, status: e.target.value as 'AKTIF' | 'DEMISIONER' })}
              className="form-select form-select-sm"
            >
              <option value="AKTIF">Aktif</option>
              <option value="DEMISIONER">Demisioner / Riwayat Lampau</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12.5, fontWeight: 650 }}>
              Catatan Penugasan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan penugasan khusus..."
              value={divisionMemberForm.notes}
              onChange={(e) => setDivisionMemberForm({ ...divisionMemberForm, notes: e.target.value })}
              className="form-input form-input-sm"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Tugaskan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
