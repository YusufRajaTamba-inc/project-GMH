import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  UserCheck,
  Calendar,
  Building,
  ArrowLeft,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  MapPin,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { api } from '../../services/api';

const PublicRegistrationPage: React.FC = () => {
  const { members, submitPublicRegistration } = useMemberStore();
  const { lookups, fieldLabels, customFields } = useDynamicConfig();

  // Form State - 100% selaras dengan form admin (MemberAddModal)
  const [formData, setFormData] = useState({
    name: '',
    type: 'ALUMNI',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    maritalStatus: 'Lajang',
    weddingDate: '',
    partnerName: '',
    childrenCount: 0,
    address: '',
    city: '',
    province: '',
    postalCode: '',
    wa: '',
    email: '',
    socialMedia: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
    faculty: '',
    major: '',
    entryYear: '' as any,
    graduationYear: '' as any,
    profession: '',
    company: '',
    ktb: '',
    ministryInterest: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberCustomFields = customFields.filter((cf) => cf.module === 'MEMBERS');

  // Real-time Duplicate NIK check terhadap database anggota
  const duplicateNikMember = useMemo(() => {
    const raw = (formData.nik || '').replace(/[^0-9]/g, '');
    if (!raw || raw.length < 16) return null;
    return members.find((m) => m.nik && m.nik.replace(/[^0-9]/g, '') === raw) || null;
  }, [formData.nik, members]);

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
        if (!clean) return 'NIK 16 digit wajib diisi.';
        if (!/^\d{16}$/.test(clean)) return 'NIK harus berupa tepat 16 digit angka.';
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

    // Cek duplikasi NIK lokal
    if (duplicateNikMember) {
      setSubmitError(`NIK ${formData.nik} sudah terdaftar atas nama ${duplicateNikMember.name} (${duplicateNikMember.nia}). Pendaftaran dengan NIK yang sama tidak diizinkan.`);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const errors: Record<string, string> = {};
    const fieldsToValidate = ['name', 'nik', 'birthDate', 'wa', 'address', 'faculty', 'major', 'entryYear'];
    if (formData.email) fieldsToValidate.push('email');
    if (formData.maritalStatus === 'Menikah') fieldsToValidate.push('weddingDate');

    for (const key of fieldsToValidate) {
      const err = validateField(key, (formData as any)[key]);
      if (err) errors[key] = err;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitError('Mohon perbaiki isian formulir yang bertanda merah sebelum mengirim.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanNik = formData.nik.replace(/[^0-9]/g, '').trim();
      const payloadData = {
        fullName: formData.name.trim(),
        nik: cleanNik,
        gender: formData.gender,
        birthPlace: formData.birthPlace?.trim() || undefined,
        birthDate: formData.birthDate,
        weddingDate: formData.maritalStatus === 'Menikah' ? formData.weddingDate : undefined,
        phoneNumber: formData.wa.trim(),
        email: formData.email?.trim() || undefined,
        homeAddress: formData.address.trim(),
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode?.trim() || undefined,
        faculty: formData.faculty,
        major: formData.major.trim(),
        entryYear: Number(formData.entryYear),
        graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
        gradYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
        currentProfession: formData.profession?.trim() || undefined,
        profession: formData.profession?.trim() || undefined,
        company: formData.company?.trim() || undefined,
        ktb: formData.ktb?.trim() || undefined,
        ministryInterest: formData.ministryInterest || undefined,
        maritalStatus: formData.maritalStatus,
        partnerName: formData.maritalStatus === 'Menikah' ? formData.partnerName : undefined,
        childrenCount: formData.maritalStatus === 'Menikah' ? Number(formData.childrenCount) : 0,
        memberType: formData.type as any,
        socialMedia: {
          linkedin: formData.socialMedia.linkedin?.trim() || undefined,
          instagram: formData.socialMedia.instagram?.trim() || undefined,
        },
        customValues,
      };

      const res = await api.registrations.publicRegister(payloadData);

      if (res.success && res.ticket) {
        setSubmittedTicket(res.ticket.registration_code);
        submitPublicRegistration({
          name: formData.name,
          nik: cleanNik,
          gender: formData.gender,
          birthPlace: formData.birthPlace,
          birthDate: formData.birthDate,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          wa: formData.wa,
          email: formData.email,
          faculty: formData.faculty,
          major: formData.major,
          entryYear: Number(formData.entryYear),
          graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
          gradYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
          profession: formData.profession,
          company: formData.company,
          ktb: formData.ktb,
          ministryInterest: formData.ministryInterest,
          maritalStatus: formData.maritalStatus,
          weddingDate: formData.maritalStatus === 'Menikah' ? formData.weddingDate : undefined,
          partnerName: formData.maritalStatus === 'Menikah' ? formData.partnerName : undefined,
          childrenCount: formData.maritalStatus === 'Menikah' ? Number(formData.childrenCount) : 0,
          memberType: formData.type as any,
          socialMedia: formData.socialMedia,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitError(res.message || 'Gagal memproses formulir pendaftaran.');
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
                Persekutuan Alumni PA KMK USU · Portal Pendaftaran Mandiri Anggota &amp; Alumni
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
                <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>Admin memeriksa data stambuk &amp; kelulusan Anda.</div>
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
                    type: 'ALUMNI',
                    nik: '',
                    gender: 'Laki-laki',
                    birthPlace: '',
                    birthDate: '',
                    maritalStatus: 'Lajang',
                    weddingDate: '',
                    partnerName: '',
                    childrenCount: 0,
                    address: '',
                    city: '',
                    province: '',
                    postalCode: '',
                    wa: '',
                    email: '',
                    socialMedia: {
                      linkedin: '',
                      instagram: '',
                      facebook: '',
                    },
                    faculty: '',
                    major: '',
                    entryYear: '' as any,
                    graduationYear: '' as any,
                    profession: '',
                    company: '',
                    ktb: '',
                    ministryInterest: '',
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
                    Formulir Pendaftaran Alumni &amp; Anggota Yayasan
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
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
                <span style={{ fontWeight: 600 }}>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* SECTION 1: IDENTITAS PRIBADI & KELUARGA (100% Selaras dengan Admin) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={18} color="var(--gmh-gold)" /> 1. Identitas Utama &amp; Tanggal Lahir (Ultah)
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Nama Lengkap &amp; Gelar *</label>
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
                      <label className="form-label">Tipe Keanggotaan *</label>
                      <select
                        name="type"
                        className="form-select"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      >
                        <option value="ALUMNI">Alumni PA KMK USU</option>
                        <option value="MAHASISWA">Mahasiswa Aktif</option>
                        <option value="STAF_YAYASAN">Staf / Pengurus Yayasan</option>
                        <option value="MITRA">Mitra / Donatur Yayasan</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>NIK (16 Digit) *</span>
                        {formData.nik && (
                          <span style={{ fontSize: 11, color: formData.nik.replace(/[^0-9]/g, '').length === 16 ? 'var(--gmh-green)' : 'var(--gmh-text-muted)', fontWeight: 600 }}>
                            {formData.nik.replace(/[^0-9]/g, '').length}/16 digit
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        name="nik"
                        className="form-input"
                        placeholder="Contoh: 1271010101960001"
                        maxLength={16}
                        value={formData.nik}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, nik: val });
                          const err = validateField('nik', val);
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            if (err) next.nik = err;
                            else delete next.nik;
                            return next;
                          });
                        }}
                        required
                        style={{
                          borderColor: duplicateNikMember || formErrors.nik ? 'var(--gmh-danger)' : undefined,
                          background: duplicateNikMember ? '#fff1f2' : undefined,
                        }}
                      />
                      {formErrors.nik && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.nik}</div>}
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
                        placeholder="Medan / Tarutung"
                        value={formData.birthPlace}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tanggal Lahir (Ultah) *</label>
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

                    {formData.maritalStatus !== 'Lajang' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">
                            {fieldLabels['member.weddingDate'] || 'Tanggal Pernikahan (Ultah Nikah)'} *
                          </label>
                          <input
                            type="date"
                            name="weddingDate"
                            className="form-input"
                            value={formData.weddingDate}
                            onChange={handleChange}
                            required={formData.maritalStatus !== 'Lajang'}
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

              {/* SECTION 2: TEMPAT TINGGAL & DOMISILI DETAIL (100% Selaras dengan Admin) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} color="var(--gmh-gold)" /> 2. Tempat Tinggal &amp; Domisili Detail
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Alamat Rumah Lengkap (Jalan, RT/RW, Kelurahan) *</label>
                      <textarea
                        name="address"
                        className="form-input"
                        rows={2}
                        placeholder="Contoh: Jl. Dr. Mansyur No. 45, Kel. Padang Bulan, Medan"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        style={{ borderColor: formErrors.address ? '#dc2626' : undefined }}
                      />
                      {formErrors.address && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.address}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kota / Kabupaten *</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        placeholder="Contoh: Medan, Jakarta, Bandung"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Wilayah / Kring Alumni</label>
                      <select name="province" className="form-select" value={formData.province} onChange={handleChange}>
                        <option value="">-- Pilih Wilayah / Kring --</option>
                        {(lookups.alumniRegions || ['Medan & Sekitarnya', 'Jabodetabek', 'Batam & Kepri', 'Riau & Pekanbaru', 'Luar Negeri / Lainnya']).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kode Pos</label>
                      <input
                        type="text"
                        name="postalCode"
                        className="form-input"
                        placeholder="Contoh: 20155"
                        value={formData.postalCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: KONTAK & MEDIA SOSIAL (100% Selaras dengan Admin) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={18} color="var(--gmh-gold)" /> 3. Kontak &amp; Media Sosial
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
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
                      <label className="form-label">Alamat Email Aktif</label>
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{ borderColor: formErrors.email ? '#dc2626' : undefined }}
                      />
                      {formErrors.email && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.email}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">LinkedIn (URL / Profil)</label>
                      <input
                        type="text"
                        placeholder="linkedin.com/in/username"
                        className="form-input"
                        value={formData.socialMedia.linkedin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: { ...formData.socialMedia, linkedin: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Instagram (@username)</label>
                      <input
                        type="text"
                        placeholder="@username"
                        className="form-input"
                        value={formData.socialMedia.instagram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: DATA AKADEMIK USU & KARIER (100% Selaras dengan Admin) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building size={18} color="var(--gmh-gold)" /> 4. Data Akademik USU &amp; Karier
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
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
                        <option value="">-- Pilih Fakultas Asal USU --</option>
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
                        {fieldLabels['member.entryYear'] || 'Tahun Masuk (Stambuk)'} *
                      </label>
                      <input
                        type="number"
                        name="entryYear"
                        className="form-input"
                        placeholder="Tahun masuk, misal: 2020"
                        value={formData.entryYear || ''}
                        onChange={handleChange}
                        min={1960}
                        max={2030}
                        required
                        style={{ borderColor: formErrors.entryYear ? '#dc2626' : undefined }}
                      />
                      {formErrors.entryYear && <div style={{ color: '#dc2626', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{formErrors.entryYear}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tahun Kelulusan (Wisuda / Opsional)</label>
                      <input
                        type="number"
                        name="graduationYear"
                        className="form-input"
                        placeholder="Contoh: 2024"
                        value={formData.graduationYear || ''}
                        onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value ? Number(e.target.value) : ('' as any) })}
                        min={1975}
                        max={2035}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {fieldLabels['member.profession'] || 'Profesi / Pekerjaan Saat Ini'}
                      </label>
                      <input
                        type="text"
                        name="profession"
                        className="form-input"
                        list="public-profession-datalist"
                        placeholder="Pilih atau ketik profesi..."
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

                    <div className="form-group">
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

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Minat Keterlibatan Pelayanan Alumni</label>
                      <select
                        name="ministryInterest"
                        className="form-select"
                        value={formData.ministryInterest}
                        onChange={handleChange}
                      >
                        <option value="">-- Belum Memilih / Belum Menentukan --</option>
                        <option value="Pelayanan Pembinaan Mahasiswa &amp; Mentor KTB">Pelayanan Pembinaan Mahasiswa &amp; Mentor KTB</option>
                        <option value="Dukungan Misi Daerah &amp; Pengutusan Pekabar Injil">Dukungan Misi Daerah &amp; Pengutusan Pekabar Injil</option>
                        <option value="Pengembangan Fasilitas Rumah Persekutuan GMH">Pengembangan Fasilitas Rumah Persekutuan GMH</option>
                        <option value="Tim Doa Syafaat &amp; Pastoral Care Alumni">Tim Doa Syafaat &amp; Pastoral Care Alumni</option>
                        <option value="Profesional Mentorship &amp; Workshop Karir">Profesional Mentorship &amp; Workshop Karir</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: DYNAMIC CUSTOM FIELDS (If configured by admin in Utility) */}
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
                  disabled={isSubmitting || !!duplicateNikMember}
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
