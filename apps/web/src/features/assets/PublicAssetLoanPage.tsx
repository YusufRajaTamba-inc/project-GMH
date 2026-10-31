import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';

interface AssetOption {
  id: string;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  quantity: number;
  available_quantity: number;
  physical_condition: string;
  location_room: string;
  rental_price: number;
  is_borrowable: boolean;
  notes?: string;
  category_label?: string;
}

interface LoanRequestItem {
  id: string;
  request_code: string;
  borrower_name: string;
  borrower_phone: string;
  borrower_email?: string;
  borrower_institution?: string;
  loan_purpose: string;
  loan_type: string;
  rental_fee: number;
  borrowed_at: string;
  expected_return_at: string;
  actual_return_at?: string;
  condition_on_return?: string;
  quantity_borrowed: number;
  notes?: string;
  status: string;
  approval_notes?: string;
  rejection_reason?: string;
  approved_at?: string;
  created_at: string;
  asset_code: string;
  asset_name: string;
  asset_type: string;
  location_room: string;
  category_label?: string;
}

const PublicAssetLoanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tracking' ? 'tracking' : 'form';
  const initialTrackCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState<'form' | 'tracking'>(initialTab);

  // Available assets for dropdown
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Form State
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerInstitution, setBorrowerInstitution] = useState('Alumni PA KMK USU');
  const [loanType, setLoanType] = useState<'PINJAM' | 'SEWA'>('PINJAM');
  const [borrowedAt, setBorrowedAt] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [quantityBorrowed, setQuantityBorrowed] = useState(1);
  const [loanPurpose, setLoanPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestCode, setSubmittedRequestCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking State
  const [searchQuery, setSearchQuery] = useState(initialTrackCode);
  const [isSearching, setIsSearching] = useState(false);
  const [trackedRequests, setTrackedRequests] = useState<LoanRequestItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load available assets
  useEffect(() => {
    const loadAssets = async () => {
      setLoadingAssets(true);
      try {
        const res: any = await api.assets.getAvailable();
        if (res?.assets) {
          setAssets(res.assets);
          if (res.assets.length > 0 && !selectedAssetId) {
            setSelectedAssetId(res.assets[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load available assets:', err);
      } finally {
        setLoadingAssets(false);
      }
    };
    loadAssets();
  }, []);

  // Auto track if code is provided in URL
  useEffect(() => {
    if (initialTrackCode) {
      handleTrackSearch(initialTrackCode);
    }
  }, [initialTrackCode]);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !borrowerName || !borrowerPhone || !loanPurpose || !borrowedAt || !expectedReturnAt) {
      alert('Mohon lengkapi seluruh field formulir yang bertanda bintang (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await api.assets.publicRequest({
        assetId: selectedAssetId,
        borrowerName,
        borrowerPhone,
        borrowerEmail: borrowerEmail || undefined,
        borrowerInstitution: borrowerInstitution || undefined,
        loanPurpose,
        loanType,
        borrowedAt,
        expectedReturnAt,
        quantityBorrowed,
        notes: notes || undefined,
      });

      if (res.success && res.requestCode) {
        setSubmittedRequestCode(res.requestCode);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      alert('Gagal mengirim permohonan pinjaman: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      alert('Masukkan nomor tiket pengajuan atau nomor WhatsApp pemohon.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res: any = await api.assets.trackRequest(q);
      if (res?.requests) {
        setTrackedRequests(res.requests);
      } else {
        setTrackedRequests([]);
      }
    } catch (err) {
      console.error('Tracking failed:', err);
      setTrackedRequests([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetForm = () => {
    setSubmittedRequestCode(null);
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerEmail('');
    setLoanPurpose('');
    setNotes('');
    setQuantityBorrowed(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', paddingBottom: 80 }}>
      {/* Top Navbar */}
      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 24px',
          color: '#fff',
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                padding: 3,
              }}
            >
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan GMH"
                style={{ width: 30, height: 30, objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>Yayasan Global Mission House</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>PA KMK USU · Pengajuan Pinjaman & Sewa Aset</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link
              to="/assets"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                color: '#94a3b8',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <ArrowLeft size={14} /> Ke Inventaris Internal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1040, margin: '28px auto 0', padding: '0 20px' }}>
        {/* Banner Hero */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '24px 28px',
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                background: '#ecfdf5',
                color: '#047857',
                fontSize: 11.5,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '99px',
                marginBottom: 8,
                letterSpacing: 0.3,
              }}
            >
              LAYANAN PEMINJAMAN RESMI
            </span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
              Peminjaman & Sewa Fasilitas Aset Yayasan
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13.5, maxWidth: 640 }}>
              Fasilitas alat musik, sound system, proyektor, dan aula Rumah Persekutuan GMH dapat diajukan secara daring oleh
              alumni, pengurus persekutuan cabang kampus, maupun pelayanan jemaat.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: 4,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              onClick={() => {
                setActiveTab('form');
                setSearchParams({ tab: 'form' });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'form' ? '#0f172a' : 'transparent',
                color: activeTab === 'form' ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: activeTab === 'form' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Formulir Pengajuan
            </button>
            <button
              onClick={() => {
                setActiveTab('tracking');
                setSearchParams({ tab: 'tracking' });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'tracking' ? '#0f172a' : 'transparent',
                color: activeTab === 'tracking' ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: activeTab === 'tracking' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Lacak Status Pengajuan
            </button>
          </div>
        </section>

        {/* ================================================================== */}
        {/* VIEW 1: FORMULIR PENGAJUAN */}
        {/* ================================================================== */}
        {activeTab === 'form' && (
          <div>
            {/* SUCCESS CONFIRMATION MODAL / CARD */}
            {submittedRequestCode ? (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: 12,
                  padding: '36px 32px',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                  maxWidth: 680,
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#047857',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle size={32} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                  Permohonan Pinjaman Berhasil Dikirim!
                </h2>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                  Data permohonan Anda telah masuk ke sistem inventaris yayasan dan sedang menunggu verifikasi serta persetujuan
                  dari pengurus/admin.
                </p>

                {/* Ticket Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: 10,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    maxWidth: 420,
                    margin: '0 auto 28px',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
                      NOMOR TIKET PENGAJUAN
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: 0.5, marginTop: 2 }}>
                      {submittedRequestCode}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(submittedRequestCode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      cursor: 'pointer',
                      color: copiedCode ? '#047857' : '#0f172a',
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'Tersalin' : 'Salin Tiket'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSearchQuery(submittedRequestCode);
                      setActiveTab('tracking');
                      setSearchParams({ tab: 'tracking', code: submittedRequestCode });
                      handleTrackSearch(submittedRequestCode);
                    }}
                    style={{
                      background: '#0f172a',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    Lacak Progres Pengajuan <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={resetForm}
                    style={{
                      background: 'transparent',
                      color: '#475569',
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Buat Pengajuan Baru
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  display: 'grid',
                  gap: 22,
                }}
              >
                {/* Section 1: Pemilihan Aset */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 14 }}>
                    1. Pilihan Aset & Fasilitas Yayasan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Pilih Aset / Fasilitas GMH *
                      </label>
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          color: '#0f172a',
                          background: '#fff',
                          outline: 'none',
                        }}
                      >
                        {assets.map((a) => (
                          <option key={a.id} value={a.id}>
                            [{a.asset_code}] {a.asset_name} (Tersedia: {a.available_quantity} unit) · {a.location_room}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Jumlah Unit yang Dipinjam *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedAsset?.available_quantity || 1}
                        value={quantityBorrowed}
                        onChange={(e) => setQuantityBorrowed(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        Stok tersedia saat ini: <strong>{selectedAsset?.available_quantity || 0} unit</strong>
                      </div>
                    </div>
                  </div>

                  {/* Asset Brief Card */}
                  {selectedAsset && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12.5,
                        color: '#475569',
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div>
                        <strong>Kategori:</strong> {selectedAsset.category_label || selectedAsset.asset_type} ·{' '}
                        <strong>Lokasi:</strong> {selectedAsset.location_room} ·{' '}
                        <strong>Kondisi:</strong> {selectedAsset.physical_condition === 'GOOD' ? 'Baik & Berfungsi' : selectedAsset.physical_condition}
                      </div>
                      <div>
                        <strong>Tarif Sewa Komersial:</strong>{' '}
                        <span style={{ color: '#047857', fontWeight: 600 }}>
                          {formatRupiah(Number(selectedAsset.rental_price || 0))} / pemakaian
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Skema Pinjam vs Sewa */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 14 }}>
                    2. Jenis Skema Permohonan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '14px 16px',
                        borderRadius: 8,
                        border: loanType === 'PINJAM' ? '2px solid #047857' : '1px solid #e2e8f0',
                        background: loanType === 'PINJAM' ? '#ecfdf5' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="loanType"
                        value="PINJAM"
                        checked={loanType === 'PINJAM'}
                        onChange={() => setLoanType('PINJAM')}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Peminjaman Pelayanan (Gratis)</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Untuk kegiatan persekutuan PA KMK USU, retreat alumni, pembinaan mahasiswa, atau kegiatan misi yayasan.
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '14px 16px',
                        borderRadius: 8,
                        border: loanType === 'SEWA' ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        background: loanType === 'SEWA' ? '#f1f5f9' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="loanType"
                        value="SEWA"
                        checked={loanType === 'SEWA'}
                        onChange={() => setLoanType('SEWA')}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Penyewaan Fasilitas (Berbayar)</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Untuk acara eksternal, seminar instansi, ibadah keluarga, atau pernikahan dengan kontribusi kas yayasan.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Section 3: Data Pemohon */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 14 }}>
                    3. Identitas Pemohon & Penanggung Jawab
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Nama Lengkap Pemohon *
                      </label>
                      <input
                        type="text"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                        placeholder="Contoh: dr. Raymond Situmorang / Yohana Siregar"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Nomor WhatsApp / HP Aktif *
                      </label>
                      <input
                        type="tel"
                        value={borrowerPhone}
                        onChange={(e) => setBorrowerPhone(e.target.value)}
                        placeholder="Contoh: 081260458921"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                        Nomor ini juga digunakan untuk melacak status pengajuan.
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Email Pemohon (Opsional)
                      </label>
                      <input
                        type="email"
                        value={borrowerEmail}
                        onChange={(e) => setBorrowerEmail(e.target.value)}
                        placeholder="alumni@alumni.usu.ac.id"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Asal Komisi / Persekutuan / Instansi
                      </label>
                      <input
                        type="text"
                        value={borrowerInstitution}
                        onChange={(e) => setBorrowerInstitution(e.target.value)}
                        placeholder="Contoh: Alumni PA KMK FK USU / Panitia Paskah"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Jadwal & Keperluan Acara */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 14 }}>
                    4. Jadwal Penggunaan & Keperluan Acara
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Tanggal Mulai Penggunaan *
                      </label>
                      <input
                        type="date"
                        value={borrowedAt}
                        onChange={(e) => setBorrowedAt(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Tanggal Rencana Selesai / Pengembalian *
                      </label>
                      <input
                        type="date"
                        value={expectedReturnAt}
                        onChange={(e) => setExpectedReturnAt(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 7,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Tujuan Kegiatan / Deskripsi Acara *
                    </label>
                    <textarea
                      rows={3}
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value)}
                      placeholder="Jelaskan nama acara, tempat pelaksanaan, dan kebutuhan teknis..."
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 7,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 13.5,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Catatan Tambahan / Perlengkapan Khusus
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Butuh kabel jack 10 meter, mic wireless 2 unit, adaptor cadangan"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 7,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 13.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || loadingAssets}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px 24px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={15} className="spin" /> Mengirim Permohonan...
                      </>
                    ) : (
                      <>
                        Kirim Permohonan Pinjaman <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW 2: TRACKING PROGRES PENGAJUAN */}
        {/* ================================================================== */}
        {activeTab === 'tracking' && (
          <div>
            {/* Search Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '24px',
                marginBottom: 20,
                boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                Lacak Status & Progres Permohonan Aset
              </h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 13 }}>
                Masukkan nomor tiket pengajuan (contoh: <code>REQ-AST-20261102-001</code>) atau nomor WhatsApp yang Anda gunakan saat mengajukan.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrackSearch()}
                  placeholder="Ketik nomor tiket pengajuan atau nomor WA..."
                  style={{
                    flex: 1,
                    minWidth: 260,
                    padding: '10px 14px',
                    borderRadius: 7,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleTrackSearch()}
                  disabled={isSearching}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 7,
                    border: 'none',
                    fontWeight: 650,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSearching ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                  Lacak Pengajuan
                </button>
              </div>
            </div>

            {/* Results */}
            {hasSearched && (
              <div>
                {trackedRequests.length === 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: '#64748b',
                    }}
                  >
                    <AlertCircle size={36} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                      Data Permohonan Tidak Ditemukan
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, maxWidth: 480, marginInline: 'auto' }}>
                      Tidak ditemukan permohonan dengan kata kunci "{searchQuery}". Pastikan nomor tiket pengajuan atau nomor HP pemohon sudah sesuai.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 18 }}>
                    {trackedRequests.map((req) => {
                      const isPending = req.status === 'PENDING';
                      const isApproved = req.status === 'APPROVED';
                      const isRejected = req.status === 'REJECTED';
                      const isActive = req.status === 'ACTIVE';
                      const isReturned = req.status === 'RETURNED';

                      return (
                        <article
                          key={req.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                          }}
                        >
                          {/* Header Request */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              borderBottom: '1px solid #f1f5f9',
                              paddingBottom: 16,
                              marginBottom: 20,
                              gap: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                                  {req.request_code || 'TIKET-ASET'}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: req.loan_type === 'SEWA' ? '#f1f5f9' : '#ecfdf5',
                                    color: req.loan_type === 'SEWA' ? '#0f172a' : '#047857',
                                  }}
                                >
                                  {req.loan_type === 'SEWA' ? 'PENYEWAAN' : 'PEMINJAMAN PELAYANAN'}
                                </span>
                              </div>
                              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3 }}>
                                Diajukan oleh <strong>{req.borrower_name}</strong> ({req.borrower_institution || 'Alumni / Jemaat'}) ·{' '}
                                No. WA: {req.borrower_phone}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isPending && (
                                <span
                                  style={{
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    padding: '5px 12px',
                                    borderRadius: '99px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <Clock size={13} /> Menunggu Verifikasi Admin
                                </span>
                              )}
                              {isApproved && (
                                <span
                                  style={{
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    padding: '5px 12px',
                                    borderRadius: '99px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <CheckCircle size={13} /> Disetujui · Siap Diambil
                                </span>
                              )}
                              {isRejected && (
                                <span
                                  style={{
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '5px 12px',
                                    borderRadius: '99px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <XCircle size={13} /> Pengajuan Ditolak
                                </span>
                              )}
                              {isActive && (
                                <span
                                  style={{
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    padding: '5px 12px',
                                    borderRadius: '99px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <ShieldCheck size={13} /> Sedang Digunakan (Aktif)
                                </span>
                              )}
                              {isReturned && (
                                <span
                                  style={{
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    padding: '5px 12px',
                                    borderRadius: '99px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <CheckCircle size={13} /> Selesai Dikembalikan
                                </span>
                              )}
                            </div>
                          </div>

                          {/* TIMELINE STEPPER PROGRES */}
                          <div style={{ marginBottom: 24, padding: '16px 20px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                              Alur & Progres Pengajuan
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                              {/* Step 1 */}
                              <div style={{ display: 'flex', gap: 10 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: '#047857',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Check size={14} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>1. Pengajuan Dikirim</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                    {new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>

                              {/* Step 2 */}
                              <div style={{ display: 'flex', gap: 10 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: isPending ? '#f59e0b' : isRejected ? '#dc2626' : '#047857',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isPending ? <Clock size={14} /> : isRejected ? <XCircle size={14} /> : <Check size={14} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>2. Verifikasi Pengurus</div>
                                  <div style={{ fontSize: 11, color: isPending ? '#b45309' : isRejected ? '#b91c1c' : '#047857', marginTop: 2 }}>
                                    {isPending ? 'Dalam Tinjauan' : isRejected ? 'Permohonan Ditolak' : 'Disetujui Pengurus'}
                                  </div>
                                </div>
                              </div>

                              {/* Step 3 */}
                              <div style={{ display: 'flex', gap: 10 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: isActive || isReturned ? '#047857' : isApproved ? '#0284c7' : '#cbd5e1',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isActive || isReturned ? <Check size={14} /> : <Building2 size={14} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>3. Serah Terima Aset</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                    {isApproved
                                      ? 'Siap Diambil di GMH'
                                      : isActive
                                      ? 'Aset Sedang Dipakai'
                                      : isReturned
                                      ? 'Sudah Diserahkan'
                                      : 'Menunggu Persetujuan'}
                                  </div>
                                </div>
                              </div>

                              {/* Step 4 */}
                              <div style={{ display: 'flex', gap: 10 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: isReturned ? '#047857' : '#cbd5e1',
                                    color: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isReturned ? <Check size={14} /> : <Package size={14} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>4. Selesai / Dikembalikan</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                    {isReturned ? 'Peminjaman Selesai' : 'Belum Dikembalikan'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Approval / Rejection Feedback Box */}
                          {isApproved && req.approval_notes && (
                            <div
                              style={{
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                borderRadius: 8,
                                padding: '12px 16px',
                                marginBottom: 18,
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#065f46', marginBottom: 2 }}>
                                CATATAN PERSETUJUAN DARI PENGURUS / ADMIN:
                              </div>
                              <div style={{ fontSize: 13, color: '#047857' }}>{req.approval_notes}</div>
                              <div style={{ fontSize: 11.5, color: '#065f46', marginTop: 4 }}>
                                Silakan hubungi staf sekretariat GMH sebelum jadwal pengambilan untuk serah terima fisik aset.
                              </div>
                            </div>
                          )}

                          {isRejected && req.rejection_reason && (
                            <div
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 8,
                                padding: '12px 16px',
                                marginBottom: 18,
                              }}
                            >
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>
                                ALASAN PENOLAKAN DARI PENGURUS / ADMIN:
                              </div>
                              <div style={{ fontSize: 13, color: '#b91c1c' }}>{req.rejection_reason}</div>
                            </div>
                          )}

                          {/* Item & Schedule Details */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ASET YANG DIPINJAM</div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                                [{req.asset_code}] {req.asset_name}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>
                                {req.quantity_borrowed} Unit · {req.location_room}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>JADWAL PEMAKAIAN</div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                                {new Date(req.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                                {new Date(req.expected_return_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>
                                {req.loan_type === 'SEWA' ? `Estimasi Kontribusi: ${formatRupiah(Number(req.rental_fee || 0))}` : 'Bebas Biaya (Pelayanan)'}
                              </div>
                            </div>

                            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>KEPERLUAN ACARA</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>
                                {req.loan_purpose}
                              </div>
                              {req.notes && (
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Catatan: {req.notes}</div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicAssetLoanPage;
