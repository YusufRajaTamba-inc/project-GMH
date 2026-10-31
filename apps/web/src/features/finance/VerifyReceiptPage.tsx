import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';

const VerifyReceiptPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const kwtParam = searchParams.get('kwt') || searchParams.get('receipt') || '';

  const [receiptCode, setReceiptCode] = useState(kwtParam);
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setData(null);

    try {
      const res = await api.finance.verifyReceipt(code.trim());
      if (res && res.valid) {
        setData(res);
      } else {
        setErrorMsg(res?.message || 'E-Kuitansi tidak ditemukan dalam catatan resmi yayasan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memvalidasi kuitansi. Pastikan nomor kuitansi benar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (kwtParam) {
      handleVerify(kwtParam);
    }
  }, [kwtParam]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Container */}
      <div style={{ maxWidth: 600, width: '100%' }}>
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/finance/donations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--gmh-text-muted)',
              fontSize: 13,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Kembali ke Sistem Yayasan
          </Link>
        </div>

        {/* Card Header */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
          }}
        >
          {/* Top Banner */}
          <div
            style={{
              background: '#044e29',
              padding: '24px 24px 20px',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginBottom: 12 }}>
              <ShieldCheck size={32} color="#86efac" />
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.2 }}>
              Portal Verifikasi Resmi E-Kuitansi
            </h2>
            <div style={{ fontSize: 12, color: '#bbf7d0', marginTop: 4 }}>
              Yayasan Global Mission House (GMH PA KMK) · Medan, Sumatera Utara
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {/* Input Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(receiptCode);
              }}
              style={{ display: 'flex', gap: 8, marginBottom: 24 }}
            >
              <input
                type="text"
                className="input"
                placeholder="Masukkan Nomor Kuitansi (e.g. KWT-GMH-202610-001)"
                value={receiptCode}
                onChange={(e) => setReceiptCode(e.target.value)}
                style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ background: '#044e29', minWidth: 100 }}
              >
                {isLoading ? 'Memeriksa...' : 'Validasi'}
              </button>
            </form>

            {/* Result: SUCCESS */}
            {data && data.valid && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #22c55e',
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <CheckCircle2 size={26} color="#16a34a" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d' }}>
                      Dokumen Kuitansi SAH & TERDAFTAR
                    </div>
                    <div style={{ fontSize: 11.5, color: '#166534' }}>
                      Transaksi ini sah tercatat dalam Buku Kas Besar Yayasan Global Mission House.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #bbf7d0',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Nomor Kuitansi Resmi:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{data.receiptNumber}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Tanggal Transaksi:</span>
                    <strong style={{ color: '#0f172a' }}>
                      {data.date ? String(data.date).split('T')[0] : '-'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Nominal Sah:</span>
                    <strong style={{ color: '#16a34a', fontSize: 16 }}>
                      {formatRupiah(Number(data.amount))}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Pos Alokasi Anggaran:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{data.purpose || 'Kas Yayasan Pusat'}</span>
                  </div>

                  {data.notes && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                      <span style={{ color: '#64748b' }}>Catatan Pembukuan:</span>
                      <span style={{ color: '#334155', maxWidth: '60%', textAlign: 'right' }}>{data.notes}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
                    <span style={{ color: '#64748b' }}>Penerbit Resmi:</span>
                    <span style={{ fontWeight: 600, color: '#044e29' }}>{data.issuer}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 11, color: '#166534', textAlign: 'center', fontStyle: 'italic' }}>
                  ✓ Segel digital ini membuktikan bahwa dana yang diserahkan telah diverifikasi dan masuk ke rekening resmi yayasan tanpa manipulasi.
                </div>
              </div>
            )}

            {/* Result: ERROR / NOT FOUND */}
            {errorMsg && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: 10,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '50%', background: '#fee2e2', marginBottom: 10 }}>
                  <XCircle size={28} color="#dc2626" />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#b91c1c' }}>
                  Kuitansi Tidak Sah / Tidak Ditemukan
                </div>
                <div style={{ fontSize: 12, color: '#991b1b', marginTop: 4 }}>
                  {errorMsg}
                </div>
                <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 10 }}>
                  Harap pastikan kode kuitansi telah sesuai dengan yang tercantum pada tanda terima fisik atau hubungi sekretariat bendahara Yayasan GMH.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyReceiptPage;
