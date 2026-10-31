import React, { useState, useEffect } from 'react';
import { Lock, Plus, FileDown, CheckCircle, Eye, ShieldCheck, Printer } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';
import { canAccessPayroll } from '../../state/auth';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import NominalInput from '../../components/NominalInput';
import { formatRupiah } from '../../utils/currency';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';

interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  base: number;
  mission: number;
  transport: number;
  deduction: number;
}

const INITIAL_PAYROLL: StaffPayroll[] = [
  { id: '1', name: 'Pdt. Andi Simanjuntak', role: 'Direktur Eksekutif Yayasan', base: 8000000, mission: 0, transport: 1000000, deduction: 500000 },
  { id: '2', name: 'Grace Silalahi', role: 'Staff Administrasi & Keuangan', base: 4500000, mission: 0, transport: 500000, deduction: 0 },
  { id: '3', name: 'Ev. Benyamin Tobing', role: 'Pekabar Injil Pos Simalungun', base: 3500000, mission: 1000000, transport: 750000, deduction: 0 },
  { id: '4', name: 'Ev. Ratna Napitupulu', role: 'Pekabar Injil Pos Tobasa', base: 3500000, mission: 1000000, transport: 750000, deduction: 200000 },
];

const PayrollPage: React.FC = () => {
  const { user, isModuleAllowed } = useAuth();
  const { addTransaction } = useFinanceStore();
  const { lookups, fieldLabels } = useDynamicConfig();

  const hasAccess = canAccessPayroll(user.role) || isModuleAllowed('PAYROLL');

  const [payrollData, setPayrollData] = useState<StaffPayroll[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState('Oktober 2026');
  const [isProcessed, setIsProcessed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<StaffPayroll | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedPayroll,
  } = usePagination(payrollData, { initialPageSize: 10 });

  const fetchStaffPayroll = async () => {
    setIsLoading(true);
    try {
      const res = await api.payroll.getStaff();
      if (res && (res.staff || res.data)) {
        const staffList = res.staff || res.data || [];
        const mapped: StaffPayroll[] = staffList.map((s: any) => ({
          id: s.id,
          name: s.full_name || 'Staf Yayasan',
          role: s.position_title || 'Staf Yayasan GMH',
          base: Number(s.base_salary || 4500000),
          mission: s.position_title?.toLowerCase().includes('pekabar') ? 1000000 : 0,
          transport: 500000,
          deduction: 0,
        }));
        setPayrollData(mapped.length > 0 ? mapped : INITIAL_PAYROLL);
      } else {
        setPayrollData(INITIAL_PAYROLL);
      }
    } catch (err: any) {
      console.warn('Gagal memuat staf payroll:', err);
      setPayrollData(INITIAL_PAYROLL);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchStaffPayroll();
    }
  }, [hasAccess]);

  // Form State for Add Staff Salary
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    base: 0,
    mission: 0,
    transport: 0,
    deduction: 0,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!hasAccess) {
    return (
      <div className="empty-state">
        <Lock size={48} className="empty-state-icon" />
        <h3>Akses Ditolak (Privileged Module)</h3>
        <p>
          Modul Penggajian hanya dapat diakses oleh <strong>Bendahara Yayasan</strong>, <strong>Dewan Pengawas</strong>, dan <strong>Super Admin</strong>.
          <br />
          Bendahara Admin tidak memiliki otorisasi untuk melihat nominal gaji atau honorarium pekabar Injil.
        </p>
      </div>
    );
  }

  const totalBase = payrollData.reduce((s, p) => s + p.base, 0);
  const totalMission = payrollData.reduce((s, p) => s + p.mission, 0);
  const totalTransport = payrollData.reduce((s, p) => s + p.transport, 0);
  const totalDeduction = payrollData.reduce((s, p) => s + p.deduction, 0);
  const totalNet = totalBase + totalMission + totalTransport - totalDeduction;

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.base <= 0) {
      alert('Mohon isi nama dan gaji pokok yang valid.');
      return;
    }

    const newStaff: StaffPayroll = {
      id: String(Date.now()),
      name: formData.name.trim(),
      role: formData.role.trim() || 'Staf Yayasan',
      base: formData.base,
      mission: formData.mission,
      transport: formData.transport,
      deduction: formData.deduction,
    };

    setPayrollData([...payrollData, newStaff]);
    setShowAddModal(false);
    setFormData({
      name: '',
      role: '',
      base: 0,
      mission: 0,
      transport: 0,
      deduction: 0,
    });
    showToast(`Data staf ${newStaff.name} berhasil ditambahkan ke daftar payroll.`);
  };

  const handleProcessPayroll = () => {
    if (isProcessed) {
      alert('Payroll periode ini sudah diproses.');
      return;
    }

    // Log the payroll expense into the foundation's central ledger
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      desc: `Pembayaran Beban Gaji Staf Yayasan & Honorarium Misi — Periode ${period}`,
      category: 'Honorarium Pembicara Seminar',
      amount: totalNet,
      type: 'DEBIT',
      account: 'KAS_BANK',
      source: 'PAYROLL',
      notes: `Total ${payrollData.length} penerima gaji. Diproses oleh ${user.name}`,
      recordedBy: user.name,
    });

    setIsProcessed(true);
    showToast(`Payroll ${period} berhasil diproses & otomatis tercatat sebagai beban gaji di kas yayasan!`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Penggajian Staf & Misionaris (Payroll)</h2>
          <p>
            Manajemen gaji staf kantor yayasan dan tunjangan hidup pekabar Injil daerah — bersifat sangat rahasia
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: 12, padding: '6px 12px' }}
            id="payroll-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>Oktober 2026</option>
            <option>September 2026</option>
            <option>Agustus 2026</option>
          </select>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} /> Tambah Penerima Gaji
          </button>
          <button
            className={`btn btn-sm ${isProcessed ? 'btn-success' : 'btn-primary'}`}
            id="btn-run-payroll"
            onClick={handleProcessPayroll}
          >
            {isProcessed ? <ShieldCheck size={14} /> : <FileDown size={14} />}
            {isProcessed ? 'Payroll Terbayar' : 'Finalisasi & Bayar'}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        <Lock size={15} style={{ flexShrink: 0 }} />
        <span>
          Data gaji bersifat <strong>sangat rahasia</strong>. Hak akses hanya dimiliki oleh{' '}
          <strong>Bendahara Yayasan</strong> dan <strong>Dewan Pengawas</strong>. Seluruh proses pembayaran otomatis terintegrasi ke buku kas yayasan.
        </span>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Rekapitulasi Gaji & Tunjangan — {period}</div>
          <span className={`badge ${isProcessed ? 'badge-success' : 'badge-warning'}`}>
            {isProcessed ? 'Final — Dana Telah Ditransfer' : 'Draft — Menunggu Finalisasi'}
          </span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Penerima</th>
                <th>Jabatan / Pos Pelayanan</th>
                <th style={{ textAlign: 'right' }}>Gaji Pokok</th>
                <th style={{ textAlign: 'right' }}>Tunjangan Misi</th>
                <th style={{ textAlign: 'right' }}>Transport</th>
                <th style={{ textAlign: 'right' }}>Potongan</th>
                <th style={{ textAlign: 'right' }}>Gaji Bersih</th>
                <th>Slip Gaji</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Memuat data staf dan slip gaji dari API...
                  </td>
                </tr>
              ) : (
                paginatedPayroll.map((p) => {
                const net = p.base + p.mission + p.transport - p.deduction;
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-green-dark)' }}>{p.name}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{p.role}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatRupiah(p.base)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: p.mission > 0 ? 'var(--gmh-success)' : 'var(--gmh-text-light)',
                      }}
                    >
                      {p.mission > 0 ? formatRupiah(p.mission) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--gmh-success)' }}>
                      {p.transport > 0 ? formatRupiah(p.transport) : '—'}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: p.deduction > 0 ? '#b91c1c' : 'var(--gmh-text-light)',
                      }}
                    >
                      {p.deduction > 0 ? `(${formatRupiah(p.deduction)})` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gmh-green)' }}>
                      {formatRupiah(net)}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setSelectedSlip(p)}
                      >
                        <Eye size={12} /> Pratinjau Slip
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--gmh-surface-2)' }}>
                <td colSpan={2} style={{ fontWeight: 700, padding: '12px 16px', fontSize: 13 }}>
                  TOTAL BEBAN GAJI
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>
                  {formatRupiah(totalBase)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>
                  {formatRupiah(totalMission)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>
                  {formatRupiah(totalTransport)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px', color: '#b91c1c' }}>
                  ({formatRupiah(totalDeduction)})
                </td>
                <td
                  style={{
                    textAlign: 'right',
                    fontWeight: 700,
                    padding: '12px 16px',
                    color: 'var(--gmh-green)',
                    fontSize: 16,
                  }}
                >
                  {formatRupiah(totalNet)}
                </td>
                <td style={{ padding: '12px 16px' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={payrollData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="staf / penerima gaji"
        />
      </div>

      {/* ADD STAFF SALARY MODAL WITH NOMINAL SEPARATORS */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>Tambah Data Penerima Gaji / Misionaris</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStaff}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label form-required">Nama Staf / Misionaris</label>
                    <input
                      className="form-input"
                      placeholder="Contoh: Ev. Daniel Sibarani"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">
                      {fieldLabels['payroll.department'] || 'Jabatan / Pos Pelayanan Misi'}
                    </label>
                    <input
                      className="form-input"
                      list="payroll-roles-datalist"
                      placeholder="Contoh: Pekabar Injil Pos Dairi / Staf Keuangan"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                    <datalist id="payroll-roles-datalist">
                      {(lookups?.departments || [
                        'Sekretariat & Administrasi',
                        'Pelayanan Misi & Pekabar Injil',
                        'Pembinaan Mahasiswa & KTB',
                        'Sarana, Gedung & Logistik',
                        'Keuangan & Akuntansi',
                      ]).map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">
                      {fieldLabels['baseSalary'] || 'Gaji Pokok (Rp)'} — Separator Otomatis
                    </label>
                    <NominalInput
                      value={formData.base}
                      onChange={(val) => setFormData({ ...formData, base: val })}
                      placeholder="misal: 3.500.000"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {fieldLabels['allowanceType'] || 'Tunjangan Misi Daerah (Rp)'} — Separator Otomatis
                    </label>
                    <NominalInput
                      value={formData.mission}
                      onChange={(val) => setFormData({ ...formData, mission: val })}
                      placeholder="0 jika tidak ada tunjangan misi"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Tunjangan Transport / Operasional (Rp) — Separator Otomatis
                    </label>
                    <NominalInput
                      value={formData.transport}
                      onChange={(val) => setFormData({ ...formData, transport: val })}
                      placeholder="0 jika tidak ada"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {fieldLabels['deductionType'] || 'Potongan Pinjaman / Iuran (Rp)'} — Separator Otomatis
                    </label>
                    <NominalInput
                      value={formData.deduction}
                      onChange={(val) => setFormData({ ...formData, deduction: val })}
                      placeholder="0 jika tidak ada potongan"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan Penerima Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIDENTIAL SALARY SLIP MODAL */}
      {selectedSlip && (
        <div className="modal-overlay" onClick={() => setSelectedSlip(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={18} color="var(--gmh-gold)" />
                <h3>Slip Gaji Elektronik (Rahasia)</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedSlip(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ background: 'var(--gmh-surface)' }}>
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  fontSize: 12.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid var(--gmh-green)', paddingBottom: 10, marginBottom: 14 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 42, height: 42, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ color: 'var(--gmh-text-muted)', fontSize: 11 }}>
                      Slip Gaji Staf & Honorarium Misionaris · Periode {period}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Nama Penerima:</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedSlip.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Jabatan:</div>
                    <div style={{ fontWeight: 600 }}>{selectedSlip.role}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--gmh-border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gaji Pokok:</span>
                    <strong>{formatRupiah(selectedSlip.base)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tunjangan Misi Daerah:</span>
                    <strong style={{ color: 'var(--gmh-green)' }}>{formatRupiah(selectedSlip.mission)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tunjangan Transport:</span>
                    <strong style={{ color: 'var(--gmh-green)' }}>{formatRupiah(selectedSlip.transport)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Potongan:</span>
                    <strong style={{ color: '#b91c1c' }}>({formatRupiah(selectedSlip.deduction)})</strong>
                  </div>

                  <div
                    style={{
                      background: 'var(--gmh-surface-2)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--gmh-green-dark)' }}>Total Gaji Bersih (Take Home Pay):</span>
                    <strong style={{ fontSize: 16, color: 'var(--gmh-green)', fontFamily: 'var(--font-heading)' }}>
                      {formatRupiah(selectedSlip.base + selectedSlip.mission + selectedSlip.transport - selectedSlip.deduction)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedSlip(null)}>
                Tutup
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => alert(`Mengunduh Slip Gaji PDF ber-password untuk ${selectedSlip.name}`)}
              >
                <Printer size={14} /> Cetak Slip PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
