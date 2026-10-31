import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  User,
  GraduationCap,
  Phone,
  Briefcase,
  Globe,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import type { Member } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { api } from '../../services/api';

export const MemberEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { members, updateMember } = useMemberStore();
  const { lookups, fieldLabels } = useDynamicConfig();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    faculty: lookups?.faculties?.[0] || 'Fakultas Teknik',
    major: '',
    entryYear: 2020,
    graduationYear: 2024,
    address: '',
    city: 'Medan',
    province: 'Sumatera Utara',
    postalCode: '',
    phone: '',
    email: '',
    profession: '',
    company: '',
    ktb: '',
    maritalStatus: 'Lajang',
    weddingDate: '',
    socialMedia: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
    status: 'ACTIVE',
    type: 'ALUMNI',
  });

  const [originalMember, setOriginalMember] = useState<Member | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (!id) return;

    const fromStore = members.find((m) => m.id === id);
    if (fromStore) {
      setOriginalMember(fromStore);
      setFormData({
        ...fromStore,
        socialMedia: {
          linkedin: fromStore.socialMedia?.linkedin || '',
          instagram: fromStore.socialMedia?.instagram || '',
          facebook: fromStore.socialMedia?.facebook || '',
        },
      });
      setIsLoading(false);
    } else {
      api.members
        .getById(id)
        .then((res: any) => {
          if (res?.data) {
            setOriginalMember(res.data);
            setFormData({
              ...res.data,
              socialMedia: {
                linkedin: res.data.socialMedia?.linkedin || '',
                instagram: res.data.socialMedia?.instagram || '',
                facebook: res.data.socialMedia?.facebook || '',
              },
            });
          }
        })
        .catch((err) => {
          console.warn('Gagal memuat anggota:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, members]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !originalMember) return;

    if (!formData.name?.trim()) {
      alert('Nama lengkap anggota wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const isSingle = formData.maritalStatus === 'Lajang';
      const updatedMember: Member = {
        ...originalMember,
        ...formData,
        name: formData.name.trim(),
        nik: formData.nik?.trim() || undefined,
        weddingDate: isSingle ? undefined : formData.weddingDate,
      };

      updateMember(id, updatedMember);
      try {
        await api.members.update(id, updatedMember);
      } catch (apiErr) {
        console.warn('Backend sync warning:', apiErr);
      }

      showToast(`Data anggota ${updatedMember.name} berhasil diperbarui!`);

      setTimeout(() => {
        navigate(`/members/${id}`);
      }, 700);
    } catch (err) {
      alert('Gagal menyimpan perubahan anggota.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper calculate age
  const calculatedAge = () => {
    if (!formData.birthDate) return null;
    try {
      const b = new Date(formData.birthDate);
      if (isNaN(b.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
        age--;
      }
      return age > 0 ? `${age} Tahun` : null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="animate-spin" style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ color: 'var(--gmh-text-muted)' }}>Memuat data formulir anggota…</p>
      </div>
    );
  }

  if (!originalMember) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <AlertCircle size={44} color="#b91c1c" style={{ margin: '0 auto 12px' }} />
        <h3>Data Anggota Tidak Ditemukan</h3>
        <p style={{ color: 'var(--gmh-text-muted)', marginBottom: 20 }}>
          Anggota dengan ID tersebut tidak tersedia di sistem.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/members')}>
          ← Kembali ke Direktori Anggota
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60, maxWidth: 1040, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--gmh-green-dark)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <CheckCircle size={18} color="var(--gmh-gold)" />
          {toastMsg}
        </div>
      )}

      {/* Top Navigation & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/members/${id}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Kembali ke Profil Anggota
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate(`/members/${id}`)}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={isSaving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
          >
            <Save size={15} /> {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Page Title Card Banner */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '3px 9px',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 700,
                color: '#d8f3dc',
              }}
            >
              NIA: {originalMember.nia}
            </span>
            <span
              style={{
                background: 'var(--gmh-gold)',
                color: '#1b4332',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {originalMember.type}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ubah Data Anggota: {originalMember.name}</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 13 }}>
            Perbarui data kependudukan, riwayat akademik USU & PA KMK, kontak domisili, dan karier profesional
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* SECTION 1: BIODATA KEPENDUDUKAN */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1.5px solid var(--gmh-border)', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--gmh-green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="var(--gmh-green)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                1. Biodata Kependudukan
              </h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Identitas kependudukan resmi dan data personal anggota
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-required">Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Yusuf Tamba, S.T."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                NIK (Nomor Induk Kependudukan 16 Digit)
              </label>
              <input
                type="text"
                className="form-input"
                maxLength={16}
                value={formData.nik || ''}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="Contoh: 1271010102000008"
              />
              <div className="form-hint">
                {formData.nik ? `${formData.nik.length}/16 digit terisi` : 'Opsional, untuk pendataan arsip yayasan'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-required">Jenis Kelamin</label>
              <select
                className="form-select"
                value={formData.gender || 'Laki-laki'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tempat Lahir</label>
              <input
                type="text"
                className="form-input"
                value={formData.birthPlace || ''}
                onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                placeholder="Contoh: Medan, Pangururan, Balige"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Tanggal Lahir</label>
                {calculatedAge() && (
                  <span className="badge badge-primary" style={{ fontSize: 11 }}>
                    Usia: {calculatedAge()}
                  </span>
                )}
              </div>
              <input
                type="date"
                className="form-input"
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required">
                {fieldLabels['member.maritalStatus'] || fieldLabels['maritalStatus'] || 'Status Pernikahan'}
              </label>
              <select
                className="form-select"
                value={formData.maritalStatus || 'Lajang'}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              >
                {(lookups?.maritalStatuses?.length ? lookups.maritalStatuses : ['Lajang', 'Menikah', 'Duda / Janda']).map((ms) => (
                  <option key={ms} value={ms}>
                    {ms}
                  </option>
                ))}
              </select>
            </div>

            {formData.maritalStatus !== 'Lajang' && (
              <div className="form-group">
                <label className="form-label">Tanggal Pernikahan (HUT Pernikahan)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.weddingDate || ''}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                />
                <div className="form-hint">Digunakan untuk ucapan selamat hari ulang tahun pernikahan</div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: AKADEMIK USU & PA KMK */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1.5px solid var(--gmh-border)', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#1d4ed8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e40af' }}>
                2. Riwayat Akademik USU &amp; PA KMK
              </h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Fakultas, program studi, stambuk, dan riwayat kelompok binaan
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-required">
                {fieldLabels['member.faculty'] || fieldLabels['faculty'] || 'Fakultas Asal USU'}
              </label>
              <select
                className="form-select"
                value={formData.faculty || ''}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              >
                {(lookups?.faculties || []).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-required">Program Studi / Jurusan</label>
              <input
                type="text"
                className="form-input"
                value={formData.major || ''}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                placeholder="Contoh: Teknologi Informasi, Teknik Sipil, Manajemen"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required">Tahun Masuk (Stambuk)</label>
              <input
                type="number"
                className="form-input"
                min={1970}
                max={2030}
                value={formData.entryYear || 2020}
                onChange={(e) => setFormData({ ...formData, entryYear: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tahun Kelulusan (Alumni)</label>
              <input
                type="number"
                className="form-input"
                min={1970}
                max={2035}
                value={formData.graduationYear || 2024}
                onChange={(e) => setFormData({ ...formData, graduationYear: Number(e.target.value) })}
                placeholder="Kosongkan bila masih berstatus mahasiswa aktif"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {fieldLabels['member.ktb'] || fieldLabels['ktb'] || 'Kelompok Tumbuh Bersama (KTB / Pemuridan)'}
              </label>
              <input
                type="text"
                list="ktb-options"
                className="form-input"
                value={formData.ktb || ''}
                onChange={(e) => setFormData({ ...formData, ktb: e.target.value })}
                placeholder="Contoh: KTB Filipi, KTB Timotius 2020"
              />
              <datalist id="ktb-options">
                {(lookups?.ktbGroups || []).map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label form-required">Tipe Keanggotaan</label>
              <select
                className="form-select"
                value={formData.type || 'ALUMNI'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="ALUMNI">Alumni PA KMK USU</option>
                <option value="MAHASISWA">Mahasiswa Aktif</option>
                <option value="STAF_YAYASAN">Staf / Pengurus Yayasan</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: KONTAK & ALAMAT DOMISILI */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1.5px solid var(--gmh-border)', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} color="var(--gmh-green)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                3. Kontak &amp; Alamat Domisili
              </h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Saluran komunikasi aktif, nomor WhatsApp, email, dan alamat domisili saat ini
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-required">No. WhatsApp / HP</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Contoh: 081234567890"
                required
              />
              <div className="form-hint">Digunakan untuk notifikasi bukti kuitansi donasi dan kabar yayasan</div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Contoh: nama@domain.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-required">Kota Domisili</label>
              <input
                type="text"
                className="form-input"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Contoh: Medan, Jakarta, Pekanbaru, Batam"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {fieldLabels['member.region'] || fieldLabels['region'] || 'Wilayah / Kring Domisili Alumni'}
              </label>
              <select
                className="form-select"
                value={formData.province || 'Sumatera Utara'}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              >
                <option value="">-- Pilih Wilayah Alumni --</option>
                {(lookups?.alumniRegions || []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Alamat Lengkap Domisili</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Contoh: Jl. Pintu Air IV No. 28, Padang Bulan, Medan"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: KARIER & PEKERJAAN */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1.5px solid var(--gmh-border)', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} color="#b45309" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#92400e' }}>
                4. Karier &amp; Pekerjaan Profesional
              </h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Informasi bidang profesi, keahlian, dan instansi tempat bekerja saat ini
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Profesi / Bidang Pekerjaan</label>
              <input
                type="text"
                className="form-input"
                value={formData.profession || ''}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="Contoh: Software Engineer, Dokter Spesialis, Guru, Wiraswasta"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Perusahaan / Instansi / Tempat Bekerja</label>
              <input
                type="text"
                className="form-input"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Contoh: PT Telkom Indonesia, RS Adam Malik, dsb."
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: MEDIA SOSIAL & STATUS */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1.5px solid var(--gmh-border)', paddingBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="#6d28d9" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#5b21b6' }}>
                5. Media Sosial &amp; Status Akun Yayasan
              </h3>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Tautan jejaring profesional dan keaktifan database alumni yayasan
              </div>
            </div>
          </div>

          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">LinkedIn</label>
              <input
                type="text"
                className="form-input"
                value={formData.socialMedia?.linkedin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, linkedin: e.target.value },
                  })
                }
                placeholder="linkedin.com/in/username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instagram</label>
              <input
                type="text"
                className="form-input"
                value={formData.socialMedia?.instagram || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                  })
                }
                placeholder="@username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Facebook</label>
              <input
                type="text"
                className="form-input"
                value={formData.socialMedia?.facebook || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value },
                  })
                }
                placeholder="facebook.com/username"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-required">Status Database Keanggotaan</label>
              <select
                className="form-select"
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ACTIVE">🟢 Aktif (Terdaftar &amp; Terhubung)</option>
                <option value="MUTATED">🟡 Mutasi / Di Luar Kota</option>
                <option value="DECEASED">⚪ Telah Berpulang (Deceased)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: '#fff',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--gmh-border-dark)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)' }}>
            Pastikan seluruh data yang diperbarui telah sesuai dengan dokumen kependudukan dan catatan alumni.
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(`/members/${id}`)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Save size={16} /> {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MemberEditPage;
