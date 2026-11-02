import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Member } from '../../../state/MemberStoreContext';

interface MemberAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newMemberData: any;
  setNewMemberData: React.Dispatch<React.SetStateAction<any>>;
  duplicateNikMember: Member | null;
  lookups: any;
  fieldLabels: Record<string, string>;
}

export const MemberAddModal: React.FC<MemberAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  newMemberData,
  setNewMemberData,
  duplicateNikMember,
  lookups,
  fieldLabels,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 740, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3>Tambah Data Anggota Baru (Admin)</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. Identitas Utama */}
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6 }}>
              1. Identitas Utama &amp; Tanggal Lahir (Ultah)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Nama Lengkap &amp; Gelar *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Tipe Keanggotaan *</label>
                <select
                  className="form-select"
                  value={newMemberData.type || 'ALUMNI'}
                  onChange={(e) => setNewMemberData({ ...newMemberData, type: e.target.value })}
                  required
                >
                  <option value="ALUMNI">Alumni PA KMK USU</option>
                  <option value="MAHASISWA">Mahasiswa Aktif</option>
                  <option value="STAF_YAYASAN">Staf / Pengurus Yayasan</option>
                  <option value="MITRA">Mitra / Donatur Yayasan</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>NIK (16 Digit) *</span>
                  {newMemberData.nik && (
                    <span style={{ fontSize: 11, color: newMemberData.nik.replace(/[^0-9]/g, '').length === 16 ? 'var(--gmh-green)' : 'var(--gmh-text-muted)', fontWeight: 600 }}>
                      {newMemberData.nik.replace(/[^0-9]/g, '').length}/16 digit
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  maxLength={16}
                  className="form-input"
                  placeholder="Contoh: 1271010101960001"
                  style={{
                    borderColor: duplicateNikMember ? 'var(--gmh-danger)' : undefined,
                    background: duplicateNikMember ? '#fff1f2' : undefined,
                  }}
                  value={newMemberData.nik}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewMemberData({ ...newMemberData, nik: val });
                  }}
                  required
                />
                {duplicateNikMember && (
                  <div
                    style={{
                      marginTop: 6,
                      padding: '8px 12px',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#9f1239',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, color: '#e11d48' }} />
                    <div>
                      <strong>NIK Terdeteksi Duplikat:</strong> Sudah terdaftar atas nama <strong>{duplicateNikMember.name}</strong> ({duplicateNikMember.nia}).
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Jenis Kelamin</label>
                <select
                  className="form-select"
                  value={newMemberData.gender}
                  onChange={(e) => setNewMemberData({ ...newMemberData, gender: e.target.value })}
                >
                  <option>Laki-laki</option>
                  <option>Perempuan</option>
                </select>
              </div>
              <div>
                <label className="form-label">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Medan / Tarutung"
                  className="form-input"
                  value={newMemberData.birthPlace}
                  onChange={(e) => setNewMemberData({ ...newMemberData, birthPlace: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Tanggal Lahir (Ultah) *</label>
                <input
                  type="date"
                  className="form-input"
                  value={newMemberData.birthDate}
                  onChange={(e) => setNewMemberData({ ...newMemberData, birthDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">{fieldLabels['member.maritalStatus'] || 'Status Pernikahan'}</label>
                <select
                  className="form-select"
                  value={newMemberData.maritalStatus}
                  onChange={(e) => setNewMemberData({ ...newMemberData, maritalStatus: e.target.value })}
                >
                  {(lookups.maritalStatuses || ['Lajang', 'Menikah', 'Duda/Janda']).map((st: string) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              {newMemberData.maritalStatus !== 'Lajang' && (
                <>
                  <div>
                    <label className="form-label">Tanggal Pernikahan (Ultah Nikah)</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newMemberData.weddingDate}
                      onChange={(e) => setNewMemberData({ ...newMemberData, weddingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Lengkap Pasangan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama Suami / Istri"
                      value={newMemberData.partnerName || ''}
                      onChange={(e) => setNewMemberData({ ...newMemberData, partnerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Jumlah Anak</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      value={newMemberData.childrenCount || 0}
                      onChange={(e) => setNewMemberData({ ...newMemberData, childrenCount: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}
            </div>

            {/* 2. Tempat Tinggal Detail */}
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
              2. Tempat Tinggal &amp; Domisili Detail
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Alamat Rumah Lengkap (Jalan, RT/RW, Kelurahan)</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Contoh: Jl. Dr. Mansyur No. 45, Kel. Padang Bulan, Medan"
                  value={newMemberData.address}
                  onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Kota / Kabupaten</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Medan, Jakarta, Pekanbaru"
                  value={newMemberData.city || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Wilayah / Kring Alumni</label>
                <select
                  className="form-select"
                  value={newMemberData.province || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, province: e.target.value })}
                >
                  <option value="">-- Pilih Wilayah / Kring --</option>
                  {(lookups.alumniRegions || ['Medan & Sekitarnya', 'Jabodetabek', 'Batam & Kepri', 'Riau & Pekanbaru', 'Luar Negeri / Lainnya']).map((r: string) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Kode Pos</label>
                <input
                  type="text"
                  className="form-input"
                  value={newMemberData.postalCode}
                  onChange={(e) => setNewMemberData({ ...newMemberData, postalCode: e.target.value })}
                />
              </div>
            </div>

            {/* 3. Kontak & Media Sosial */}
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
              3. Kontak &amp; Media Sosial
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={newMemberData.phone}
                  onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">LinkedIn (URL / Profil)</label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/username"
                  className="form-input"
                  value={newMemberData.socialMedia.linkedin}
                  onChange={(e) =>
                    setNewMemberData({
                      ...newMemberData,
                      socialMedia: { ...newMemberData.socialMedia, linkedin: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="form-label">Instagram (@username)</label>
                <input
                  type="text"
                  placeholder="@username"
                  className="form-input"
                  value={newMemberData.socialMedia.instagram}
                  onChange={(e) =>
                    setNewMemberData({
                      ...newMemberData,
                      socialMedia: { ...newMemberData.socialMedia, instagram: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* 4. Akademik USU & Karier */}
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
              4. Data Akademik USU &amp; Karier
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <div>
                <label className="form-label">{fieldLabels['member.faculty'] || 'Fakultas'} *</label>
                <select
                  className="form-select"
                  value={newMemberData.faculty || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, faculty: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Fakultas Asal USU --</option>
                  {(lookups.faculties || []).map((f: string) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{fieldLabels['member.major'] || 'Jurusan'} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newMemberData.major}
                  onChange={(e) => setNewMemberData({ ...newMemberData, major: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Tahun Masuk (Stambuk) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Tahun masuk, misal: 2020"
                  value={newMemberData.entryYear || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, entryYear: e.target.value ? Number(e.target.value) : ('' as any) })}
                  required
                />
              </div>
              <div>
                <label className="form-label">Tahun Kelulusan (Wisuda / Opsional)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Contoh: 2024"
                  value={newMemberData.graduationYear || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, graduationYear: e.target.value ? Number(e.target.value) : undefined })}
                  min={1975}
                  max={2030}
                />
              </div>
              <div>
                <label className="form-label">{fieldLabels['member.profession'] || 'Profesi / Pekerjaan'}</label>
                <input
                  type="text"
                  className="form-input"
                  list="member-professions-list"
                  placeholder="Pilih atau ketik profesi..."
                  value={newMemberData.profession}
                  onChange={(e) => setNewMemberData({ ...newMemberData, profession: e.target.value })}
                />
                <datalist id="member-professions-list">
                  {(lookups.professions || []).map((prof: string) => (
                    <option key={prof} value={prof} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="form-label">Perusahaan / Instansi</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: PT Telkom, RS Adam Malik"
                  value={newMemberData.company}
                  onChange={(e) => setNewMemberData({ ...newMemberData, company: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">{fieldLabels['member.ktb'] || 'KTB Asal'}</label>
                <input
                  type="text"
                  className="form-input"
                  list="member-ktb-list"
                  placeholder="Pilih atau ketik KTB..."
                  value={newMemberData.ktb}
                  onChange={(e) => setNewMemberData({ ...newMemberData, ktb: e.target.value })}
                />
                <datalist id="member-ktb-list">
                  {(lookups.ktbGroups || []).map((ktb: string) => (
                    <option key={ktb} value={ktb} />
                  ))}
                </datalist>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Minat Keterlibatan Pelayanan Alumni</label>
                <select
                  className="form-select"
                  value={newMemberData.ministryInterest || ''}
                  onChange={(e) => setNewMemberData({ ...newMemberData, ministryInterest: e.target.value })}
                >
                  <option value="">-- Belum Memilih / Belum Menentukan --</option>
                  <option value="Pelayanan Pembinaan Mahasiswa & Mentor KTB">Pelayanan Pembinaan Mahasiswa & Mentor KTB</option>
                  <option value="Dukungan Misi Daerah & Pengutusan Pekabar Injil">Dukungan Misi Daerah & Pengutusan Pekabar Injil</option>
                  <option value="Pengembangan Fasilitas Rumah Persekutuan GMH">Pengembangan Fasilitas Rumah Persekutuan GMH</option>
                  <option value="Tim Doa Syafaat & Pastoral Care Alumni">Tim Doa Syafaat & Pastoral Care Alumni</option>
                  <option value="Profesional Mentorship & Workshop Karir">Profesional Mentorship & Workshop Karir</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan &amp; Terbitkan NIA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
