import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  UserCheck,
  Calendar,
  Building,
  Heart,
  Globe,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { api } from '../../services/api';

const PublicRegistrationPage: React.FC = () => {
  const { submitPublicRegistration } = useMemberStore();
  const { lookups, fieldLabels, customFields } = useDynamicConfig();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    wa: '',
    email: '',
    address: '',
    city: 'Medan',
    province: 'Sumatera Utara',
    faculty: lookups.faculties[0] || 'Fakultas Teknik',
    major: '',
    entryYear: 2020,
    gradYear: 2024,
    ktb: '',
    profession: '',
    company: '',
    ministryInterest: 'Pelayanan Mahasiswa & KTB',
    maritalStatus: 'Lajang',
    weddingDate: '',
    partnerName: '',
    childrenCount: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberCustomFields = customFields.filter((cf) => cf.module === 'MEMBERS');

  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || String(value).trim().length < 3) return 'Nama lengkap wajib diisi minimal 3 karakter.';
        return null;
      case 'wa': {
        const clean = String(value).trim().replace(/\s+/g, '');
        if (!clean) return 'Nomor WhatsApp wajib diisi.';
        if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(clean)) return 'Format nomor WhatsApp tidak valid (contoh: 08123456789 atau +6281234567890).';
        return null;
      }
      case 'email': {
        if (value && String(value).trim()) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) return 'Format email tidak valid.';
        }
        return null;
      }
      case 'nik': {
        const clean = String(value).trim().replace(/\s+/g, '');
        if (clean && !/^\d{16}$/.test(clean)) return 'NIK harus berupa tepat 16 digit angka.';
        return null;
      }
      case 'address':
        if (!value || String(value).trim().length < 5) return 'Alamat domisili lengkap wajib diisi minimal 5 karakter.';
        return null;
      case 'birthDate':
        if (!value) return 'Tanggal lahir wajib diisi untuk data keanggotaan.';
        return null;
      case 'faculty':
        if (!value) return 'Fakultas asal USU wajib dipilih.';
        return null;
      case 'major':
        if (!value || String(value).trim().length < 2) return 'Program studi / jurusan wajib diisi.';
        return null;
      case 'entryYear': {
        const y = Number(value);
        const cur = new Date().getFullYear();
        if (!y || isNaN(y) || y < 1960 || y > cur + 1) return `Tahun stambuk harus antara 1960 dan ${cur + 1}.`;
        return null;
      }
      case 'weddingDate':
        if (formData.maritalStatus === 'Menikah' && !value) return 'Tanggal pernikahan wajib diisi untuk status Menikah.';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setFormErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  };

  const handleCustomChange = (fieldName: string, value: any) => {
    setCustomValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors: Record<string, string> = {};
    const fieldsToValidate = ['name', 'nik', 'birthDate', 'wa', 'email', 'address', 'faculty', 'major', 'entryYear'];
    if (formData.maritalStatus === 'Menikah') fieldsToValidate.push('weddingDate');

    for (const key of fieldsToValidate) {
      const err = validateField(key, (formData as any)[key]);
      if (err) errors[key] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('Mohon perbaiki data formulir yang bertanda merah sebelum mengirim.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.registrations.publicRegister({
        fullName: formData.name.trim(),
        nik: formData.nik?.trim() || undefined,
        gender: formData.gender,
        birthDate: formData.birthDate,
        weddingDate: formData.maritalStatus === 'Menikah' ? formData.weddingDate : undefined,
        phoneNumber: formData.wa.trim(),
        email: formData.email?.trim() || undefined,
        faculty: formData.faculty,
        major: formData.major.trim(),
        entryYear: Number(formData.entryYear),
        homeAddress: formData.address.trim(),
        city: formData.city,
        province: formData.province,
        currentProfession: formData.profession?.trim() || undefined,
        maritalStatus: formData.maritalStatus,
      });

      if (res.success && res.ticket) {
        setSubmittedTicket(res.ticket.registration_code);
        submitPublicRegistration({
          name: formData.name,
          nik: formData.nik,
          gender: formData.gender,
          birthDate: formData.birthDate,
          faculty: formData.faculty,
          major: formData.major,
          entryYear: Number(formData.entryYear),
          wa: formData.wa,
          email: formData.email,
          city: formData.city,
          address: formData.address,
          profession: formData.profession,
          company: formData.company,
          ktb: formData.ktb,
          maritalStatus: formData.maritalStatus,
          weddingDate: formData.maritalStatus === 'Menikah' ? formData.weddingDate : undefined,
          partnerName: formData.maritalStatus === 'Menikah' ? formData.partnerName : undefined,
          childrenCount: formData.maritalStatus === 'Menikah' ? Number(formData.childrenCount) : 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitError(res.message || 'Gagal memproses pendaftaran.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem saat mengirim formulir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gmh-surface)', paddingBottom: 60 }}>
      {/* Public Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #081C15 0%, #1B4332 100%)',
          color: '#fff',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan GMH"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2 }}>
                Yayasan Global Mission House
              </div>
              <div style={{ fontSize: 12, color: 'var(--gmh-green-pale)', opacity: 0.9 }}>
                Persekutuan Alumni PA KMK USU · Portal Pendaftaran Mandiri Anggota & Alumni
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="btn btn-sm"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Ke Panel Pengurus
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 880, margin: '32px auto 0', padding: '0 16px' }}>
        {submittedTicket ? (
          /* Confirmation Card */
          <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--gmh-green-pale)',
                color: 'var(--gmh-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle size={40} />
            </div>

            <h2 style={{ fontSize: 26, color: 'var(--gmh-green-dark)', marginBottom: 8 }}>
              Pendaftaran Anda Berhasil Diterima!
            </h2>
            <p style={{ color: 'var(--gmh-text-muted)', fontSize: 15, maxWidth: 540, margin: '0 auto 24px' }}>
              Terima kasih telah mengisi formulir database alumni PA KMK USU. Data Anda telah masuk ke dalam antrean verifikasi Pengurus Yayasan Global Mission House.
            </p>

            {/* Ticket Box */}
            <div
              style={{
                maxWidth: 440,
                margin: '0 auto 28px',
                padding: '20px 24px',
                background: 'var(--gmh-surface-2)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px dashed var(--gmh-border-dark)',
              }}
            >
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
                Nomor Tiket Registrasi Publik
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--gmh-green)',
                  margin: '8px 0',
                }}
              >
                {submittedTicket}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Simpan nomor tiket ini untuk keperluan pengecekan status verifikasi kartu anggota Anda.
              </div>
            </div>

            {/* Next Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left', margin: '0 auto 32px', maxWidth: 680 }}>
              <div style={{ padding: 14, background: 'var(--gmh-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gmh-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gmh-green)', marginBottom: 4 }}>1. Verifikasi Admin</div>
                <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>Admin memeriksa data stambuk & kelulusan Anda.</div>
              </div>
              <div style={{ padding: 14, background: 'var(--gmh-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gmh-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gmh-green)', marginBottom: 4 }}>2. Penerbitan NIA</div>
                <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>Nomor Induk Anggota (NIA) resmi diterbitkan otomatis.</div>
              </div>
              <div style={{ padding: 14, background: 'var(--gmh-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gmh-border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gmh-green)', marginBottom: 4 }}>3. Notifikasi WhatsApp</div>
                <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>Konfirmasi dan kartu digital dikirimkan ke {formData.wa || 'WhatsApp'}.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSubmittedTicket(null);
                  setFormData({
                    name: '',
                    nik: '',
                    gender: 'Laki-laki',
                    birthPlace: '',
                    birthDate: '',
                    wa: '',
                    email: '',
                    address: '',
                    city: 'Medan',
                    province: 'Sumatera Utara',
                    faculty: lookups.faculties[0] || 'Fakultas Teknik',
                    major: '',
                    entryYear: 2020,
                    gradYear: 2024,
                    ktb: '',
                    profession: '',
                    company: '',
                    ministryInterest: 'Pelayanan Mahasiswa & KTB',
                    maritalStatus: 'Lajang',
                    weddingDate: '',
                    partnerName: '',
                    childrenCount: 0,
                  });
                }}
              >
                Isi Formulir Baru Lainnya
              </button>
              <Link to="/registrations" className="btn btn-primary btn-sm">
                Lihat di Verifikasi Pengurus <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Form Content */
          <div>
            {/* Intro banner */}
            <div
              style={{
                background: 'var(--gmh-white)',
                border: '1px solid var(--gmh-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                marginBottom: 24,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gmh-green-pale)',
                    color: 'var(--gmh-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileCheck size={24} />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gmh-green-dark)', marginBottom: 6 }}>
                    Formulir Pendaftaran Alumni & Anggota Yayasan
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--gmh-text-muted)', lineHeight: 1.6 }}>
                    Formulir ini diperuntukkan bagi alumni PA KMK USU, staf yayasan, dan mitra pergerakan misi GMH. Seluruh data dilindungi dengan standar keamanan privasi data yayasan dan digunakan untuk koordinasi persekutuan alumni, warta yayasan, serta pengingat hari ulang tahun.
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 2px 6px rgba(239,68,68,0.08)',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
                <span style={{ fontWeight: 600 }}>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* SECTION 1: IDENTITAS DIRI */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={18} color="var(--gmh-gold)" /> 1. Identitas Pribadi
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Nama Lengkap & Gelar *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        placeholder="Contoh: Yusuf Panjaitan, S.T."
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.name ? '#dc2626' : undefined }}
                      />
                      {formErrors.name && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.name}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nomor Induk Kependudukan (NIK) *</label>
                      <input
                        type="text"
                        name="nik"
                        className="form-input"
                        placeholder="16 digit NIK KTP"
                        value={formData.nik}
                        onChange={handleChange}
                        maxLength={16}
                        required
                        style={{ borderColor: formErrors.nik ? '#dc2626' : undefined }}
                      />
                      {formErrors.nik && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.nik}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jenis Kelamin</label>
                      <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tempat Lahir</label>
                      <input
                        type="text"
                        name="birthPlace"
                        className="form-input"
                        placeholder="Kota Tempat Lahir"
                        value={formData.birthPlace}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tanggal Lahir (Pengingat Ultah) *</label>
                      <input
                        type="date"
                        name="birthDate"
                        className="form-input"
                        value={formData.birthDate}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.birthDate ? '#dc2626' : undefined }}
                      />
                      {formErrors.birthDate && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.birthDate}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nomor WhatsApp Aktif *</label>
                      <input
                        type="tel"
                        name="wa"
                        className="form-input"
                        placeholder="Contoh: 081234567890"
                        value={formData.wa}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.wa ? '#dc2626' : undefined }}
                      />
                      {formErrors.wa ? (
                        <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.wa}</div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                          Digunakan untuk pengiriman Nomor Induk Anggota (NIA) resmi
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Alamat Email Aktif *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.email ? '#dc2626' : undefined }}
                      />
                      {formErrors.email && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.email}</div>}
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Alamat Domisili Lengkap *</label>
                      <textarea
                        name="address"
                        className="form-input"
                        rows={2}
                        placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Kecamatan"
                        value={formData.address}
                        onChange={handleChange}
                        style={{ borderColor: formErrors.address ? '#dc2626' : undefined }}
                      />
                      {formErrors.address && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.address}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kota / Kabupaten Domisili</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        placeholder="Contoh: Medan, Jakarta, Bandung"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Wilayah / Kring Alumni</label>
                      <select name="province" className="form-select" value={formData.province} onChange={handleChange}>
                        {lookups.alumniRegions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATA AKADEMIK ALUMNI USU */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building size={18} color="var(--gmh-gold)" /> 2. Data Akademik Alumni PA KMK USU
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">
                        {fieldLabels['member.faculty'] || 'Fakultas Asal USU'} *
                      </label>
                      <select
                        name="faculty"
                        className="form-select"
                        value={formData.faculty}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.faculty ? '#dc2626' : undefined }}
                      >
                        {lookups.faculties.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      {formErrors.faculty && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.faculty}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {fieldLabels['member.major'] || 'Program Studi / Jurusan'} *
                      </label>
                      <input
                        type="text"
                        name="major"
                        className="form-input"
                        placeholder="Contoh: Teknik Informatika, Kedokteran Umum"
                        value={formData.major}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.major ? '#dc2626' : undefined }}
                      />
                      {formErrors.major && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.major}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {fieldLabels['member.entryYear'] || 'Stambuk / Tahun Masuk'} *
                      </label>
                      <input
                        type="number"
                        name="entryYear"
                        className="form-input"
                        placeholder="Tahun masuk, misal: 2016"
                        value={formData.entryYear}
                        onChange={handleChange}
                        min={1970}
                        max={2030}
                        required
                        style={{ borderColor: formErrors.entryYear ? '#dc2626' : undefined }}
                      />
                      {formErrors.entryYear && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.entryYear}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tahun Kelulusan (Opsional)</label>
                      <input
                        type="number"
                        name="gradYear"
                        className="form-input"
                        placeholder="Tahun wisuda / lulus"
                        value={formData.gradYear}
                        onChange={handleChange}
                        min={1975}
                        max={2030}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">
                        {fieldLabels['member.ktb'] || 'Kelompok Tumbuh Bersama (KTB) Asal Kampus'}
                      </label>
                      <input
                        type="text"
                        name="ktb"
                        className="form-input"
                        list="public-ktb-datalist"
                        placeholder="Pilih atau ketik KTB saat mahasiswa / Pemimpin KTB"
                        value={formData.ktb}
                        onChange={handleChange}
                      />
                      <datalist id="public-ktb-datalist">
                        {(lookups.ktbGroups || []).map((ktb) => (
                          <option key={ktb} value={ktb} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROFESI & MINAT PELAYANAN */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={18} color="var(--gmh-gold)" /> 3. Profesi & Minat Pelayanan Alumni
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">
                        {fieldLabels['member.profession'] || 'Profesi / Pekerjaan Saat Ini'}
                      </label>
                      <input
                        type="text"
                        name="profession"
                        className="form-input"
                        list="public-profession-datalist"
                        placeholder="Pilih atau ketik: Dosen, Dokter, ASN, Wirausaha..."
                        value={formData.profession}
                        onChange={handleChange}
                      />
                      <datalist id="public-profession-datalist">
                        {(lookups.professions || []).map((prof) => (
                          <option key={prof} value={prof} />
                        ))}
                      </datalist>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nama Instansi / Perusahaan / Usaha</label>
                      <input
                        type="text"
                        name="company"
                        className="form-input"
                        placeholder="Contoh: PT Telkom, RS Adam Malik"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Minat Keterlibatan Pelayanan Alumni</label>
                      <select
                        name="ministryInterest"
                        className="form-select"
                        value={formData.ministryInterest}
                        onChange={handleChange}
                      >
                        <option>Pelayanan Pembinaan Mahasiswa & Mentor KTB</option>
                        <option>Dukungan Misi Daerah & Pengutusan Pekabar Injil</option>
                        <option>Pengembangan Fasilitas Rumah Persekutuan GMH</option>
                        <option>Tim Doa Syafaat & Pastoral Care Alumni</option>
                        <option>Profesional Mentorship & Workshop Karir</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: DATA KELUARGA & ULTAH PERNIKAHAN */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Heart size={18} color="var(--gmh-gold)" /> 4. Status Pernikahan & Keluarga
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">{fieldLabels['member.maritalStatus'] || 'Status Pernikahan'}</label>
                      <select
                        name="maritalStatus"
                        className="form-select"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                      >
                        {(lookups.maritalStatuses || ['Lajang', 'Menikah', 'Duda/Janda']).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.maritalStatus === 'Menikah' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">
                            {fieldLabels['member.weddingDate'] || 'Tanggal Pernikahan (Pengingat Ultah Nikah)'} *
                          </label>
                          <input
                            type="date"
                            name="weddingDate"
                            className="form-input"
                            value={formData.weddingDate}
                            onChange={handleChange}
                            required={formData.maritalStatus === 'Menikah'}
                            style={{ borderColor: formErrors.weddingDate ? '#dc2626' : undefined }}
                          />
                          {formErrors.weddingDate && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.weddingDate}</div>}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Nama Lengkap Pasangan</label>
                          <input
                            type="text"
                            name="partnerName"
                            className="form-input"
                            placeholder="Nama Suami / Istri"
                            value={formData.partnerName}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Jumlah Anak</label>
                          <input
                            type="number"
                            name="childrenCount"
                            className="form-input"
                            min={0}
                            value={formData.childrenCount}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* DYNAMIC CUSTOM FIELDS (If configured by admin in Utility) */}
              {memberCustomFields.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={18} color="var(--gmh-gold)" /> 5. Informasi Tambahan
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {memberCustomFields.map((cf) => (
                        <div key={cf.id} className="form-group">
                          <label className="form-label">
                            {cf.fieldLabel} {cf.isRequired && '*'}
                          </label>

                          {cf.fieldType === 'select' ? (
                            <select
                              className="form-select"
                              value={customValues[cf.fieldName] || ''}
                              onChange={(e) => handleCustomChange(cf.fieldName, e.target.value)}
                              required={cf.isRequired}
                            >
                              <option value="">-- Pilih --</option>
                              {cf.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={cf.fieldType}
                              className="form-input"
                              value={customValues[cf.fieldName] || ''}
                              onChange={(e) => handleCustomChange(cf.fieldName, e.target.value)}
                              required={cf.isRequired}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: 220, padding: '12px 24px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  disabled={isSubmitting}
                  id="btn-submit-registration"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Mengirim Data ke Sistem...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Pendaftaran Alumni</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicRegistrationPage;
