import React from 'react';
import { Receipt, X, TrendingUp, History, QrCode, ExternalLink, Plus, Printer, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../../state/MemberStoreContext';
import type { ReceiptData } from '../types';
import { formatRupiah } from '../../../utils/currency';
import NominalInput from '../../../components/NominalInput';

interface MemberFinancialModalsProps {
  selectedMember: Member | null;
  // Portfolio modal
  showDonationsPortfolioModal: boolean;
  setShowDonationsPortfolioModal: (show: boolean) => void;
  memberDonationsLoading: boolean;
  memberPledges: any[];
  memberTransactions: any[];
  memberTotalPledged: number;
  memberTotalDonated: number;
  // Sub-modal: New Pledge
  showAddPledgeModal: boolean;
  setShowAddPledgeModal: (show: boolean) => void;
  newPledgeForm: {
    category: string;
    type: 'PLEDGE' | 'DONATION';
    total: number;
    initialPaid: number;
    paymentMethod: string;
    dueDate: string;
    notes: string;
  };
  setNewPledgeForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveNewPledgeForMember: (e: React.FormEvent) => void;
  // Sub-modal: Installment
  showAddInstallmentModal: boolean;
  setShowAddInstallmentModal: (show: boolean) => void;
  targetPledgeForInstallment: any | null;
  installmentForm: {
    amount: number;
    date: string;
    paymentMethod: string;
    notes: string;
  };
  setInstallmentForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveInstallmentForMember: (e: React.FormEvent) => void;
  handleOpenInstallmentForPledge: (pledge: any) => void;
  // E-Receipt modal
  selectedReceipt: ReceiptData | null;
  setSelectedReceipt: (receipt: ReceiptData | null) => void;
  lookups: any;
}

export const MemberFinancialModals: React.FC<MemberFinancialModalsProps> = ({
  selectedMember,
  showDonationsPortfolioModal,
  setShowDonationsPortfolioModal,
  memberPledges,
  memberTransactions,
  memberTotalPledged,
  memberTotalDonated,
  showAddPledgeModal,
  setShowAddPledgeModal,
  newPledgeForm,
  setNewPledgeForm,
  handleSaveNewPledgeForMember,
  showAddInstallmentModal,
  setShowAddInstallmentModal,
  targetPledgeForInstallment,
  installmentForm,
  setInstallmentForm,
  handleSaveInstallmentForMember,
  handleOpenInstallmentForPledge,
  selectedReceipt,
  setSelectedReceipt,
  lookups,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 1.B. MODAL PORTOFOLIO LENGKAP DONASI & JANJI IMAN ANGGOTA */}
      {showDonationsPortfolioModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDonationsPortfolioModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="modal-header" style={{ borderBottom: '2px solid var(--gmh-green-light)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={20} color="var(--gmh-green)" />
                  <h3 style={{ margin: 0, color: 'var(--gmh-green-dark)' }}>
                    Portofolio Donasi &amp; Janji Iman: {selectedMember.name}
                  </h3>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span><strong>NIA:</strong> {selectedMember.nia || '-'}</span>
                  <span><strong>Fakultas:</strong> {selectedMember.faculty}</span>
                  <span><strong>Jurusan:</strong> {selectedMember.major || '-'}</span>
                  <span><strong>Status:</strong> {selectedMember.status === 'ACTIVE' ? 'Aktif' : selectedMember.status}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDonationsPortfolioModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Financial KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '14px 16px', background: '#f8fafc', borderLeft: '4px solid var(--gmh-gold)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Janji Iman &amp; Komitmen</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
                    {formatRupiah(memberTotalPledged)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    {memberPledges.length} paket komitmen
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>Realisasi Diterima (Terbayar)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#047857', marginTop: 4 }}>
                    {formatRupiah(memberTotalDonated)}
                  </div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                    {memberTransactions.length} kali penyetoran
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: memberTotalPledged > memberTotalDonated ? '#fffbeb' : '#f0fdf4', borderLeft: `4px solid ${memberTotalPledged > memberTotalDonated ? '#f59e0b' : '#10b981'}` }}>
                  <div style={{ fontSize: 11, color: memberTotalPledged > memberTotalDonated ? '#92400e' : '#065f46', fontWeight: 600 }}>Sisa Kewajiban</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: memberTotalPledged > memberTotalDonated ? '#b45309' : '#059669', marginTop: 4 }}>
                    {formatRupiah(Math.max(0, memberTotalPledged - memberTotalDonated))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    {memberTotalPledged <= memberTotalDonated ? 'Semua Komitmen Selesai' : 'Perlu diselesaikan'}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: '#f1f5f9', borderLeft: '4px solid var(--gmh-green)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Persentase Ketercapaian</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gmh-green-dark)', marginTop: 4 }}>
                    {memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0}%
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#cbd5e1', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--gmh-green)',
                        width: `${Math.min(100, memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--gmh-border)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--gmh-text-muted)' }}>
                  Pencatatan langsung terintegrasi dengan modul Kas &amp; Donasi Pusat.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddPledgeModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> + Catat Komitmen / Donasi Baru
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowDonationsPortfolioModal(false);
                      navigate(`/finance/donations?memberId=${selectedMember.id}&search=${encodeURIComponent(selectedMember.name)}`);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-green-dark)' }}
                  >
                    <ExternalLink size={14} /> Buka di Donasi Pusat
                  </button>
                </div>
              </div>

              {/* SECTION 1: DAFTAR KOMITMEN JANJI IMAN */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: 'var(--gmh-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} color="var(--gmh-gold)" /> Komitmen Janji Iman &amp; Donasi Terdaftar ({memberPledges.length})
                </div>

                {memberPledges.length === 0 ? (
                  <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--gmh-border)', borderRadius: 6, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Belum ada paket komitmen janji iman terdaftar untuk {selectedMember.name}.
                  </div>
                ) : (
                  <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 6, overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>Peruntukan / Program</th>
                          <th>Tipe</th>
                          <th>Target</th>
                          <th>Terbayar</th>
                          <th>Sisa</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberPledges.map((p) => {
                          const tot = Number(p.total_pledge || 0);
                          const pd = Number(p.fulfilled_amount || 0);
                          const rem = Math.max(0, tot - pd);
                          const isDone = pd >= tot || p.status === 'COMPLETED';
                          return (
                            <tr key={p.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.category || 'Pembangunan Rumah Persekutuan'}</div>
                                {p.notes && <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>{p.notes}</div>}
                                {p.project_name && <div style={{ fontSize: 10.5, color: '#0284c7' }}>Proyek: {p.project_name}</div>}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: p.pledge_type === 'PLEDGE' ? '#eff6ff' : '#f0fdf4',
                                    color: p.pledge_type === 'PLEDGE' ? '#1d4ed8' : '#15803d',
                                    fontWeight: 600,
                                  }}
                                >
                                  {p.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi Langsung'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{formatRupiah(tot)}</td>
                              <td style={{ fontWeight: 600, color: '#047857' }}>{formatRupiah(pd)}</td>
                              <td style={{ fontWeight: 600, color: rem > 0 ? '#b45309' : '#059669' }}>
                                {formatRupiah(rem)}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: isDone ? '#dcfce7' : '#fef3c7',
                                    color: isDone ? '#15803d' : '#b45309',
                                  }}
                                >
                                  {isDone ? 'LUNAS' : 'AKTIF'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {!isDone ? (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleOpenInstallmentForPledge(p)}
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                  >
                                    + Angsur
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Tuntas</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 2: RIWAYAT TRANSAKSI ANGSURAN & SETORAN */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: 'var(--gmh-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={16} color="var(--gmh-green)" /> Riwayat Transaksi Angsuran &amp; Bukti Setoran ({memberTransactions.length})
                </div>

                {memberTransactions.length === 0 ? (
                  <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--gmh-border)', borderRadius: 6, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Belum ada riwayat transaksi penerimaan dana untuk anggota ini.
                  </div>
                ) : (
                  <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 6, overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>No. Kuitansi</th>
                          <th>Tanggal</th>
                          <th>Nominal</th>
                          <th>Metode</th>
                          <th>Keterangan</th>
                          <th style={{ textAlign: 'center' }}>E-Kuitansi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberTransactions.map((tx) => (
                          <tr key={tx.id || tx.transaction_code}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {tx.transaction_code}
                            </td>
                            <td>
                              {tx.transaction_date ? tx.transaction_date.split('T')[0] : '-'}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                              {formatRupiah(tx.amount)}
                            </td>
                            <td>
                              <span style={{ fontSize: 11, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4 }}>
                                {tx.payment_method || 'BANK_TRANSFER'}
                              </span>
                            </td>
                            <td style={{ color: '#475569' }}>
                              {tx.notes || tx.category || 'Penerimaan Donasi / Janji Iman'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setSelectedReceipt({
                                    receiptNumber: tx.transaction_code,
                                    name: selectedMember.name,
                                    category: tx.category || 'Pembangunan Rumah Persekutuan',
                                    amount: Number(tx.amount || 0),
                                    lastPayment: tx.transaction_date ? tx.transaction_date.split('T')[0] : '-',
                                  });
                                }}
                                style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <QrCode size={12} /> E-Kuitansi
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setShowDonationsPortfolioModal(false);
                  navigate(`/finance/donations?memberId=${selectedMember.id}&search=${encodeURIComponent(selectedMember.name)}`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ExternalLink size={14} /> Ke Halaman Donasi &amp; Janji Iman
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDonationsPortfolioModal(false)}>
                Tutup Portofolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1.C. MODAL CATAT DONASI / JANJI IMAN BARU */}
      {showAddPledgeModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowAddPledgeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Donasi / Janji Iman Baru</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Donatur: <strong>{selectedMember.name}</strong> ({selectedMember.nia || '-'})
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddPledgeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPledgeForMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Peruntukan / Program:</label>
                  <select
                    className="input"
                    value={newPledgeForm.category}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, category: e.target.value })}
                  >
                    {(lookups?.donationCategories || [
                      'Pembangunan Rumah Persekutuan',
                      'Pelayanan Misi & Pos Pekabar Injil',
                      'Renovasi & Audio Visual Ruang Doa',
                      'Beasiswa & Adik Asuh Binaan',
                      'Operasional & Kas Kantor GMH',
                    ]).map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tipe Komitmen:</label>
                  <select
                    className="input"
                    value={newPledgeForm.type}
                    onChange={(e) =>
                      setNewPledgeForm({ ...newPledgeForm, type: e.target.value as 'PLEDGE' | 'DONATION' })
                    }
                  >
                    <option value="PLEDGE">Janji Iman (Komitmen Bertahap)</option>
                    <option value="DONATION">Donasi Langsung (Sekaligus Lunas)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {newPledgeForm.type === 'PLEDGE' ? 'Total Target Janji Iman (Rp):' : 'Nominal Donasi (Rp):'}
                  </label>
                  <NominalInput
                    value={newPledgeForm.total}
                    onChange={(val) => {
                      setNewPledgeForm({
                        ...newPledgeForm,
                        total: val,
                        initialPaid: newPledgeForm.type === 'DONATION' ? val : newPledgeForm.initialPaid,
                      });
                    }}
                    placeholder="Masukkan nominal target..."
                  />
                </div>

                {newPledgeForm.type === 'PLEDGE' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Setoran Pertama Saat Ini (Rp) - Opsional:
                    </label>
                    <NominalInput
                      value={newPledgeForm.initialPaid}
                      onChange={(val) => setNewPledgeForm({ ...newPledgeForm, initialPaid: val })}
                      placeholder="Rp 0 jika belum ada setoran awal..."
                    />
                  </div>
                )}

                {(newPledgeForm.type === 'DONATION' || newPledgeForm.initialPaid > 0) && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                    <select
                      className="input"
                      value={newPledgeForm.paymentMethod}
                      onChange={(e) => setNewPledgeForm({ ...newPledgeForm, paymentMethod: e.target.value })}
                    >
                      {(lookups?.paymentMethods || [
                        'Transfer Bank (Rekening Mandiri)',
                        'Tunai (Kasir / Sekretariat)',
                        'QRIS Yayasan GMH',
                      ]).map((pm: string) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Target Selesai / Jatuh Tempo (Opsional):</label>
                  <input
                    type="date"
                    className="input"
                    value={newPledgeForm.dueDate}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Catatan / Komitmen:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran bulanan Rp 500.000 selama 1 tahun"
                    value={newPledgeForm.notes}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddPledgeModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Komitmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1.D. MODAL BAYAR ANGSURAN JANJI IMAN */}
      {showAddInstallmentModal && targetPledgeForInstallment && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowAddInstallmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Angsuran Janji Iman</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Untuk: <strong>{selectedMember.name}</strong> · {targetPledgeForInstallment.category}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddInstallmentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInstallmentForMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--gmh-border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Target Janji Iman:</span>
                    <strong>{formatRupiah(targetPledgeForInstallment.total_pledge)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Sudah Terbayar:</span>
                    <strong style={{ color: '#047857' }}>{formatRupiah(targetPledgeForInstallment.fulfilled_amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>Sisa Kewajiban:</span>
                    <strong style={{ color: '#b45309' }}>
                      {formatRupiah(Math.max(0, Number(targetPledgeForInstallment.total_pledge || 0) - Number(targetPledgeForInstallment.fulfilled_amount || 0)))}
                    </strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Nominal Angsuran (Rp):</label>
                  <NominalInput
                    value={installmentForm.amount}
                    onChange={(val) => setInstallmentForm({ ...installmentForm, amount: val })}
                    placeholder="Masukkan nominal angsuran..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Penyetoran:</label>
                  <input
                    type="date"
                    className="input"
                    value={installmentForm.date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                  <select
                    className="input"
                    value={installmentForm.paymentMethod}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Transfer Bank (Rekening Yayasan)</option>
                    <option value="CASH">Tunai (Kasir / Sekretariat)</option>
                    <option value="QRIS">QRIS Yayasan GMH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Keterangan / Catatan:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran tahap 2 melalui transfer BCA"
                    value={installmentForm.notes}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddInstallmentModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Angsuran &amp; Terbitkan Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1.E. MODAL E-KUITANSI DIGITAL RESMI DENGAN QR CODE */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>E-Kuitansi Resmi Yayasan GMH</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReceipt(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ background: 'var(--gmh-surface)' }}>
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid var(--gmh-green)', paddingBottom: 12, marginBottom: 16 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                      Badan Hukum · Medan, Sumatera Utara · gmhpakmk.org
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#b45309', marginTop: 4 }}>
                      TANDA BUKTI PENERIMAAN DANA DONASI / JANJI IMAN
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Nomor Kuitansi:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.receiptNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Telah Terima Dari:</span>
                    <strong>{selectedReceipt.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Peruntukan:</span>
                    <span>{selectedReceipt.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Tanggal Penyetoran:</span>
                    <span>{selectedReceipt.lastPayment}</span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      padding: '12px 16px',
                      background: 'var(--gmh-surface-2)',
                      borderRadius: 6,
                      borderLeft: '4px solid var(--gmh-green)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Nominal Diterima:</span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-green-dark)' }}>
                      {formatRupiah(selectedReceipt.amount || selectedReceipt.paid || 0)}
                    </strong>
                  </div>

                  {selectedReceipt.total && (
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span>Realisasi Total: {formatRupiah(selectedReceipt.paid || 0)} dari {formatRupiah(selectedReceipt.total)}</span>
                      <span>Sisa: {formatRupiah(selectedReceipt.remaining || 0)}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px dashed var(--gmh-border)',
                  }}
                >
                  <div
                    style={{
                      padding: 8,
                      background: '#fff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={52} color="var(--gmh-green-dark)" />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={14} /> Dokumen Sah &amp; Terverifikasi
                    </div>
                    <div>Pindai kode QR untuk memvalidasi keaslian tanda terima ini secara real-time pada sistem gmhpakmk.org.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-outline"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Cetak Kuitansi
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedReceipt(null)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
