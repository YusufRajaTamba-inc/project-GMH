import React from 'react';
import {
  Plus,
  Edit,
  FileText,
  PlusCircle,
  Lock,
  Check,
  Target,
  AlertCircle,
  Info,
  Loader2,
  FileDown,
} from 'lucide-react';
import type {
  FinancialTransaction,
  TransactionType,
  AccountType,
  BudgetPeriodType,
  BudgetStatus,
} from '../../../state/FinanceStoreContext';
import { exportHtmlToPdf } from '../../../utils/pdfExport';
import NominalInput from '../../../components/NominalInput';
import { formatRupiah } from '../../../utils/currency';
import type {
  BudgetCategory,
  TransactionFormData,
  BudgetFormData,
  EditingBudgetData,
} from '../types';
import { MONTH_OPTIONS, YEAR_OPTIONS } from '../types';

interface FinanceModalsProps {
  // Modal 1: Add Transaction
  showAdd: boolean;
  setShowAdd: (val: boolean) => void;
  formData: TransactionFormData;
  setFormData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
  handleSaveTransaction: (e: React.FormEvent) => void;
  allCategories: string[];
  activeLinkedBudgetForAdd?: BudgetCategory;

  // Modal 2: Edit Transaction
  editingTrx: FinancialTransaction | null;
  setEditingTrx: React.Dispatch<React.SetStateAction<FinancialTransaction | null>>;
  handleUpdateTransaction: (e: React.FormEvent) => void;
  activeLinkedBudgetForEdit?: BudgetCategory;
  transactions: FinancialTransaction[];

  // Modal 3: Export Modal
  showExportModal: boolean;
  setShowExportModal: (val: boolean) => void;
  activePeriod: { label: string; shortLabel: string; dateRangeText: string };
  opBalance: number;
  periodStats: { totalIn: number; totalOut: number; net: number; bldIn: number };
  displayed: FinancialTransaction[];
  isExportingFinancePDF: boolean;
  setIsExportingFinancePDF: (val: boolean) => void;
  showToast: (msg: string) => void;

  // Modal 4: Add Budget Category
  showAddBudget: boolean;
  setShowAddBudget: (val: boolean) => void;
  budgetForm: BudgetFormData;
  setBudgetForm: React.Dispatch<React.SetStateAction<BudgetFormData>>;
  handleSaveBudgetCategory: (e: React.FormEvent) => void;

  // Modal 5: Edit Budget Category
  editingBudget: EditingBudgetData | null;
  setEditingBudget: React.Dispatch<React.SetStateAction<EditingBudgetData | null>>;
  handleUpdateBudgetCategory: (e: React.FormEvent) => void;

  // Modal 6: Top-Up Budget
  topUpTarget: BudgetCategory | null;
  setTopUpTarget: React.Dispatch<React.SetStateAction<BudgetCategory | null>>;
  topUpAmount: number;
  setTopUpAmount: (val: number) => void;
  topUpReason: string;
  setTopUpReason: (val: string) => void;
  handleSaveTopUp: (e: React.FormEvent) => void;
}

export const FinanceModals: React.FC<FinanceModalsProps> = ({
  showAdd,
  setShowAdd,
  formData,
  setFormData,
  handleSaveTransaction,
  allCategories,
  activeLinkedBudgetForAdd,
  editingTrx,
  setEditingTrx,
  handleUpdateTransaction,
  activeLinkedBudgetForEdit,
  transactions,
  showExportModal,
  setShowExportModal,
  activePeriod,
  opBalance,
  periodStats,
  displayed,
  isExportingFinancePDF,
  setIsExportingFinancePDF,
  showToast,
  showAddBudget,
  setShowAddBudget,
  budgetForm,
  setBudgetForm,
  handleSaveBudgetCategory,
  editingBudget,
  setEditingBudget,
  handleUpdateBudgetCategory,
  topUpTarget,
  setTopUpTarget,
  topUpAmount,
  setTopUpAmount,
  topUpReason,
  setTopUpReason,
  handleSaveTopUp,
}) => {
  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH ENTRI KAS BARU */}
      {/* ========================================================================= */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Entri Mutasi Kas Yayasan Baru</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Jenis Aliran Kas</label>
                      <select
                        className="form-select"
                        id="trx-type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                      >
                        <option value="DEBIT">Pengeluaran Kas (-)</option>
                        <option value="CREDIT">Pemasukan Kas (+)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Rekening Kas / Sumber Dana</label>
                      <select
                        className="form-select"
                        id="trx-account"
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value as AccountType })}
                      >
                        <option value="KAS_OPERASIONAL">Kas Tunai Kantor Yayasan (Petty Cash)</option>
                        <option value="KAS_BANK">Kas Rekening Bank Operasional</option>
                        <option value="KAS_PEMBANGUNAN">Kas Khusus Pembangunan Rumah Persekutuan</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Tanggal Transaksi</label>
                      <input
                        className="form-input"
                        id="trx-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Kategori Akun</label>
                      <select
                        className="form-select"
                        id="trx-category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* RELASI PAGU ANGGARAN VISUAL CARD */}
                  <div
                    style={{
                      background: formData.type === 'CREDIT' ? '#f0fdf4' : activeLinkedBudgetForAdd ? '#f8fafc' : '#f8fafc',
                      border:
                        formData.type === 'CREDIT'
                          ? '1px solid #bbf7d0'
                          : activeLinkedBudgetForAdd
                          ? '1px solid #cbd5e1'
                          : '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 13,
                    }}
                  >
                    {formData.type === 'CREDIT' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
                        <Info size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Pemasukan Kas (+):</strong> Transaksi ini menambah likuiditas kas yayasan dan tidak memotong alokasi pagu anggaran belanja operasional.
                        </div>
                      </div>
                    ) : activeLinkedBudgetForAdd ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#0f172a' }}>
                            <Target size={16} color="var(--gmh-green)" />
                            <span>Relasi Pagu: {activeLinkedBudgetForAdd.category}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {activeLinkedBudgetForAdd.periodName}
                            </span>
                            {activeLinkedBudgetForAdd.status === 'CLOSED' ? (
                              <span
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Lock size={10} /> Pagu Ditutup
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Check size={10} /> Pagu Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3 Metric Pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Alokasi Pagu</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                              {formatRupiah(activeLinkedBudgetForAdd.budget)}
                            </div>
                          </div>
                          <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sudah Terpakai</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                              {formatRupiah(activeLinkedBudgetForAdd.spent)} (
                              {activeLinkedBudgetForAdd.budget > 0
                                ? Math.round((activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget) * 100)
                                : 0}
                              %)
                            </div>
                          </div>
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border:
                                activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent >= 0
                                  ? '1px solid #bbf7d0'
                                  : '1px solid #fecaca',
                            }}
                          >
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sisa Pagu Tersedia</div>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color:
                                  activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent >= 0
                                    ? '#166534'
                                    : '#dc2626',
                              }}
                            >
                              {formatRupiah(activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            height: 6,
                            background: '#e2e8f0',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(
                                100,
                                activeLinkedBudgetForAdd.budget > 0
                                  ? (activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget) * 100
                                  : 0
                              )}%`,
                              background:
                                activeLinkedBudgetForAdd.spent >= activeLinkedBudgetForAdd.budget
                                  ? '#ef4444'
                                  : activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget >= 0.8
                                  ? '#f59e0b'
                                  : 'var(--gmh-green)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        {/* Dynamic Simulation / Warning Box */}
                        {(() => {
                          const remaining = activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent;
                          const trxAmount = Number(formData.amount) || 0;
                          const projectedRemaining = remaining - trxAmount;

                          if (activeLinkedBudgetForAdd.status === 'CLOSED') {
                            return (
                              <div
                                style={{
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  padding: '7px 10px',
                                  borderRadius: 6,
                                  color: '#92400e',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Lock size={13} style={{ flexShrink: 0 }} />
                                <span>
                                  <strong>Pagu Telah Ditutup:</strong> Pengeluaran pada pos ini telah dibekukan. Tetap dapat disimpan bila telah mendapat otorisasi bendahara.
                                </span>
                              </div>
                            );
                          }

                          if (trxAmount > 0 && projectedRemaining < 0) {
                            return (
                              <div
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '7px 10px',
                                  borderRadius: 6,
                                  color: '#991b1b',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 6,
                                }}
                              >
                                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <strong>Peringatan Defisit Pagu:</strong> Transaksi senilai{' '}
                                  <strong>{formatRupiah(trxAmount)}</strong> ini melampaui sisa pagu sebesar{' '}
                                  <strong>{formatRupiah(Math.abs(projectedRemaining))}</strong>. Anda dapat melakukan Top-Up pagu di Tab Anggaran jika diperlukan.
                                </div>
                              </div>
                            );
                          }

                          if (trxAmount > 0) {
                            return (
                              <div
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  color: '#166534',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Check size={13} style={{ flexShrink: 0 }} />
                                <span>
                                  Estimasi sisa pagu setelah mutasi ini:{' '}
                                  <strong>{formatRupiah(projectedRemaining)}</strong> (Aman / dalam batas pagu).
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>
                              Pengeluaran ini akan otomatis tercatat mengurangi alokasi pagu{' '}
                              <strong>{activeLinkedBudgetForAdd.periodName}</strong>.
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>
                          Kategori <strong>"{formData.category}"</strong> belum didaftarkan memiliki plafon pagu pada periode ini. Transaksi tetap akan dicatat langsung ke Buku Jurnal Kas.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Sumber / Pihak Relasi</label>
                    <input
                      className="form-input"
                      id="trx-party"
                      placeholder="Contoh: Toko ATK Gramedia, PT Telkom Indonesia, 5 Orang Staff, dsb."
                      value={formData.party}
                      onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Deskripsi Mutasi Lengkap</label>
                    <textarea
                      className="form-input"
                      id="trx-desc"
                      rows={2}
                      placeholder="Uraian detail transaksi, keperluan belanja, atau sumber donasi"
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      required
                    />
                  </div>

                  {/* NOMINAL INPUT WITH AUTO SEPARATOR */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Transaksi (Rp) — Format Otomatis</label>
                    <NominalInput
                      id="trx-amount"
                      value={formData.amount}
                      onChange={(val) => setFormData({ ...formData, amount: val })}
                      placeholder="Contoh: 1.250.000"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Status Verifikasi</label>
                      <select
                        className="form-select"
                        id="trx-status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="Approved">Approved (Terverifikasi)</option>
                        <option value="Pending Review">Pending Review</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nomor Nota / SPJ / Bukti Fisik</label>
                      <input
                        className="form-input"
                        id="trx-notes"
                        placeholder="Contoh: Nota No. 049/ATK/X/2026"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" id="btn-save-transaction" style={{ fontWeight: 600 }}>
                  Simpan ke Jurnal Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT TRANSAKSI */}
      {/* ========================================================================= */}
      {editingTrx && (
        <div className="modal-overlay" onClick={() => setEditingTrx(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Edit Transaksi Jurnal ({editingTrx.code})</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingTrx(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Jenis Aliran Kas</label>
                      <select
                        className="form-select"
                        value={editingTrx.type}
                        onChange={(e) => setEditingTrx({ ...editingTrx, type: e.target.value as TransactionType })}
                      >
                        <option value="DEBIT">Pengeluaran Kas (-)</option>
                        <option value="CREDIT">Pemasukan Kas (+)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Tanggal</label>
                      <input
                        className="form-input"
                        type="date"
                        value={editingTrx.date}
                        onChange={(e) => setEditingTrx({ ...editingTrx, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Kategori Akun</label>
                      <select
                        className="form-select"
                        value={editingTrx.category}
                        onChange={(e) => setEditingTrx({ ...editingTrx, category: e.target.value })}
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Sumber / Pihak Relasi</label>
                      <input
                        className="form-input"
                        value={editingTrx.party || ''}
                        onChange={(e) => setEditingTrx({ ...editingTrx, party: e.target.value })}
                        placeholder="Contoh: Toko ATK, 5 Orang Staff"
                        required
                      />
                    </div>
                  </div>

                  {/* RELASI PAGU ANGGARAN VISUAL CARD (EDIT MODE) */}
                  <div
                    style={{
                      background: editingTrx.type === 'CREDIT' ? '#f0fdf4' : activeLinkedBudgetForEdit ? '#f8fafc' : '#f8fafc',
                      border:
                        editingTrx.type === 'CREDIT'
                          ? '1px solid #bbf7d0'
                          : activeLinkedBudgetForEdit
                          ? '1px solid #cbd5e1'
                          : '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 13,
                    }}
                  >
                    {editingTrx.type === 'CREDIT' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
                        <Info size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Pemasukan Kas (+):</strong> Transaksi ini menambah saldo kas yayasan dan tidak memotong pagu anggaran belanja.
                        </div>
                      </div>
                    ) : activeLinkedBudgetForEdit ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#0f172a' }}>
                            <Target size={16} color="var(--gmh-green)" />
                            <span>Relasi Pagu: {activeLinkedBudgetForEdit.category}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {activeLinkedBudgetForEdit.periodName}
                            </span>
                            {activeLinkedBudgetForEdit.status === 'CLOSED' ? (
                              <span
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Lock size={10} /> Pagu Ditutup
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Check size={10} /> Pagu Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3 Metric Pills */}
                        {(() => {
                          const origTrx = transactions.find((t) => t.id === editingTrx.id);
                          const origDebit = origTrx && origTrx.type === 'DEBIT' ? Number(origTrx.amount) || 0 : 0;
                          const baseSpent = Math.max(0, activeLinkedBudgetForEdit.spent - origDebit);
                          const currentEditAmount = Number(editingTrx.amount) || 0;
                          const projectedSpent = baseSpent + currentEditAmount;
                          const projectedRemaining = activeLinkedBudgetForEdit.budget - projectedSpent;

                          return (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Alokasi Pagu</div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                    {formatRupiah(activeLinkedBudgetForEdit.budget)}
                                  </div>
                                </div>
                                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Total Realisasi</div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                                    {formatRupiah(projectedSpent)} (
                                    {activeLinkedBudgetForEdit.budget > 0
                                      ? Math.round((projectedSpent / activeLinkedBudgetForEdit.budget) * 100)
                                      : 0}
                                    %)
                                  </div>
                                </div>
                                <div
                                  style={{
                                    background: '#ffffff',
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: projectedRemaining >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                  }}
                                >
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sisa Pagu</div>
                                  <div
                                    style={{
                                      fontSize: 12.5,
                                      fontWeight: 700,
                                      color: projectedRemaining >= 0 ? '#166534' : '#dc2626',
                                    }}
                                  >
                                    {formatRupiah(projectedRemaining)}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div
                                style={{
                                  height: 6,
                                  background: '#e2e8f0',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(
                                      100,
                                      activeLinkedBudgetForEdit.budget > 0
                                        ? (projectedSpent / activeLinkedBudgetForEdit.budget) * 100
                                        : 0
                                    )}%`,
                                    background:
                                      projectedSpent >= activeLinkedBudgetForEdit.budget
                                        ? '#ef4444'
                                        : projectedSpent / activeLinkedBudgetForEdit.budget >= 0.8
                                        ? '#f59e0b'
                                        : 'var(--gmh-green)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>

                              {projectedRemaining < 0 ? (
                                <div
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    padding: '7px 10px',
                                    borderRadius: 6,
                                    color: '#991b1b',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 6,
                                  }}
                                >
                                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <div>
                                    <strong>Peringatan Defisit:</strong> Perubahan nominal ini menyebabkan total belanja melampaui pagu sebesar{' '}
                                    <strong>{formatRupiah(Math.abs(projectedRemaining))}</strong>.
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    color: '#166534',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <Check size={13} style={{ flexShrink: 0 }} />
                                  <span>
                                    Sisa alokasi pagu tersedia: <strong>{formatRupiah(projectedRemaining)}</strong>.
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>
                          Kategori <strong>"{editingTrx.category}"</strong> belum didaftarkan memiliki plafon pagu pada periode ini.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Deskripsi Mutasi</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={editingTrx.desc}
                      onChange={(e) => setEditingTrx({ ...editingTrx, desc: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Nominal Transaksi (Rp)</label>
                    <NominalInput
                      value={editingTrx.amount}
                      onChange={(val) => setEditingTrx({ ...editingTrx, amount: val })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editingTrx.status || 'Approved'}
                        onChange={(e) => setEditingTrx({ ...editingTrx, status: e.target.value as any })}
                      >
                        <option value="Approved">Approved</option>
                        <option value="Pending Review">Pending Review</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Catatan Tambahan</label>
                      <input
                        className="form-input"
                        value={editingTrx.notes || ''}
                        onChange={(e) => setEditingTrx({ ...editingTrx, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingTrx(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPORT / CETAK LAPORAN RESMI GMH PA KMK */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Laporan Mutasi Kas & Keuangan Yayasan GMH</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowExportModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                id="finance-operational-report-preview"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderBottom: '2px solid var(--gmh-green)',
                    paddingBottom: 12,
                    marginBottom: 16,
                  }}
                >
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>
                      Laporan Pertanggungjawaban Mutasi Kas Operasional · Periode: {activePeriod.label} ({activePeriod.dateRangeText})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Saldo Kas Kantor</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gmh-green)' }}>
                      {formatRupiah(opBalance)}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Total Pemasukan Periode</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#059669' }}>
                      {formatRupiah(periodStats.totalIn)}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Total Belanja Periode</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#b91c1c' }}>
                      {formatRupiah(periodStats.totalOut)}
                    </div>
                  </div>
                </div>

                <div className="table-wrapper" style={{ border: '1px solid var(--gmh-border)', borderRadius: 4, overflowX: 'auto' }}>
                  <table className="table table-compact" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Tgl</th>
                        <th>Kode</th>
                        <th>Kategori</th>
                        <th>Pihak Relasi</th>
                        <th>Keterangan</th>
                        <th style={{ textAlign: 'right' }}>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.slice(0, 7).map((t) => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td><code>{t.code}</code></td>
                          <td>{t.category}</td>
                          <td>{t.party || '-'}</td>
                          <td>{t.desc.slice(0, 38)}…</td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              color: t.type === 'CREDIT' ? '#059669' : '#b91c1c',
                            }}
                          >
                            {t.type === 'CREDIT' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px dashed #d1d5db', fontSize: 11.5 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div>Mengetahui,</div>
                    <div style={{ marginTop: 40, fontWeight: 700 }}>Pengurus Harian Yayasan</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div>Medan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ marginTop: 40, fontWeight: 700 }}>Bendahara Kas Operasional</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)} disabled={isExportingFinancePDF}>
                Tutup
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={isExportingFinancePDF}
                onClick={async () => {
                  try {
                    setIsExportingFinancePDF(true);
                    const cleanPeriod = activePeriod.shortLabel.replace(/[^a-zA-Z0-9]/g, '_');
                    await exportHtmlToPdf('finance-operational-report-preview', {
                      filename: `LPJ_Kas_Operasional_${cleanPeriod}_2026.pdf`,
                    });
                    setShowExportModal(false);
                    showToast('Laporan PDF Kas Operasional berhasil diunduh.');
                  } catch (err: any) {
                    alert('Gagal mengunduh PDF: ' + (err.message || 'Terjadi kesalahan sistem'));
                  } finally {
                    setIsExportingFinancePDF(false);
                  }
                }}
              >
                {isExportingFinancePDF ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyiapkan PDF…
                  </>
                ) : (
                  <>
                    <FileDown size={14} /> Unduh File PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TAMBAH POS KATEGORI ANGGARAN BARU */}
      {/* ========================================================================= */}
      {showAddBudget && (
        <div className="modal-overlay" onClick={() => setShowAddBudget(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Tambah Pos Kategori Anggaran</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddBudget(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudgetCategory}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Nama Kategori */}
                  <div className="form-group">
                    <label className="form-label form-required">Nama Kategori Beban / Anggaran</label>
                    <input
                      className="form-input"
                      id="budget-category-name"
                      placeholder="Contoh: Operasional Kantor, Transport Misi, Logistik Acara, dsb."
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                      required
                    />
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Pos ini akan otomatis tersedia sebagai kategori beban pengeluaran di Buku Jurnal Kas.
                    </div>
                  </div>

                  {/* Tipe Periode Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Tipe Periode Pagu Anggaran</label>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          border: `1.5px solid ${budgetForm.periodType === 'MONTHLY' ? 'var(--gmh-green)' : 'var(--gmh-border)'}`,
                          borderRadius: 8,
                          background: budgetForm.periodType === 'MONTHLY' ? 'var(--gmh-green-pale)' : '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="periodType"
                          value="MONTHLY"
                          checked={budgetForm.periodType === 'MONTHLY'}
                          onChange={() => setBudgetForm({ ...budgetForm, periodType: 'MONTHLY' })}
                        />
                        📅 Periode Bulanan
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          border: `1.5px solid ${budgetForm.periodType === 'ANNUAL' ? 'var(--gmh-green)' : 'var(--gmh-border)'}`,
                          borderRadius: 8,
                          background: budgetForm.periodType === 'ANNUAL' ? 'var(--gmh-green-pale)' : '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="periodType"
                          value="ANNUAL"
                          checked={budgetForm.periodType === 'ANNUAL'}
                          onChange={() => setBudgetForm({ ...budgetForm, periodType: 'ANNUAL' })}
                        />
                        📆 Periode Tahunan
                      </label>
                    </div>
                  </div>

                  {/* Pilihan Periode Detail */}
                  {budgetForm.periodType === 'MONTHLY' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label form-required">Bulan Anggaran</label>
                        <select
                          className="form-select"
                          value={budgetForm.month}
                          onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label form-required">Tahun</label>
                        <select
                          className="form-select"
                          value={budgetForm.year}
                          onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label form-required">Tahun Anggaran</label>
                      <select
                        className="form-select"
                        value={budgetForm.year}
                        onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            Tahun Anggaran {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Nominal Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Plafon Pagu Anggaran (Rp)</label>
                    <NominalInput
                      id="budget-amount"
                      value={budgetForm.budget}
                      onChange={(val) => setBudgetForm({ ...budgetForm, budget: val })}
                      placeholder="Contoh: 3.500.000"
                      required
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="form-group">
                    <label className="form-label">Deskripsi / Peruntukan Alokasi</label>
                    <textarea
                      className="form-input"
                      id="budget-notes"
                      rows={2}
                      placeholder="Uraian peruntukan alokasi anggaran pos ini (opsional)"
                      value={budgetForm.notes}
                      onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddBudget(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" id="btn-save-budget" style={{ fontWeight: 600 }}>
                  Simpan Pos Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: UBAH PAGU ANGGARAN */}
      {/* ========================================================================= */}
      {editingBudget && (
        <div className="modal-overlay" onClick={() => setEditingBudget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Ubah Pagu: {editingBudget.category}</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingBudget(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBudgetCategory}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Nama Kategori */}
                  <div className="form-group">
                    <label className="form-label form-required">Nama Kategori</label>
                    <input
                      className="form-input"
                      value={editingBudget.category}
                      onChange={(e) => setEditingBudget({ ...editingBudget, category: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tipe Periode & Waktu */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Tipe Periode</label>
                      <select
                        className="form-select"
                        value={editingBudget.periodType}
                        onChange={(e) =>
                          setEditingBudget({
                            ...editingBudget,
                            periodType: e.target.value as BudgetPeriodType,
                          })
                        }
                      >
                        <option value="MONTHLY">📅 Bulanan</option>
                        <option value="ANNUAL">📆 Tahunan</option>
                      </select>
                    </div>

                    {editingBudget.periodType === 'MONTHLY' ? (
                      <div className="form-group">
                        <label className="form-label form-required">Bulan</label>
                        <select
                          className="form-select"
                          value={editingBudget.month}
                          onChange={(e) => setEditingBudget({ ...editingBudget, month: e.target.value })}
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label form-required">Tahun Anggaran</label>
                        <select
                          className="form-select"
                          value={editingBudget.year}
                          onChange={(e) => setEditingBudget({ ...editingBudget, year: e.target.value })}
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {editingBudget.periodType === 'MONTHLY' && (
                    <div className="form-group">
                      <label className="form-label form-required">Tahun</label>
                      <select
                        className="form-select"
                        value={editingBudget.year}
                        onChange={(e) => setEditingBudget({ ...editingBudget, year: e.target.value })}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Nominal Plafon */}
                  <div className="form-group">
                    <label className="form-label form-required">Pagu Batas Belanja (Rp)</label>
                    <NominalInput
                      value={editingBudget.budget}
                      onChange={(val) => setEditingBudget({ ...editingBudget, budget: val })}
                      required
                    />
                  </div>

                  {/* Status Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Status Pagu Anggaran</label>
                    <select
                      className="form-select"
                      value={editingBudget.status}
                      onChange={(e) =>
                        setEditingBudget({
                          ...editingBudget,
                          status: e.target.value as BudgetStatus,
                        })
                      }
                    >
                      <option value="ACTIVE">🟢 Aktif (Berjalan / Belanja Diizinkan)</option>
                      <option value="CLOSED">🔒 Ditutup (Beku / Selesai)</option>
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Jika berstatus Ditutup, alokasi pos ini dianggap selesai dan tidak direkomendasikan untuk belanja baru.
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="form-group">
                    <label className="form-label">Deskripsi / Peruntukan Alokasi</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={editingBudget.notes}
                      onChange={(e) => setEditingBudget({ ...editingBudget, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingBudget(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: TAMBAHKAN NOMINAL PAGU ANGGARAN (TOP-UP) */}
      {/* ========================================================================= */}
      {topUpTarget && (
        <div className="modal-overlay" onClick={() => setTopUpTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Top-Up Nominal Pagu Anggaran</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setTopUpTarget(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopUp}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Summary Card Info Pos */}
                  <div
                    style={{
                      background: '#f9fafb',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gmh-text)', marginBottom: 2 }}>
                      {topUpTarget.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginBottom: 10 }}>
                      Periode: <strong>{topUpTarget.periodName}</strong> ({topUpTarget.periodType === 'ANNUAL' ? 'Tahunan' : 'Bulanan'})
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Pagu Saat Ini</div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gmh-text)' }}>
                          {formatRupiah(topUpTarget.budget)}
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Realisasi Belanja</div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#b91c1c' }}>
                          {formatRupiah(topUpTarget.spent)}
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Sisa Saldo</div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: topUpTarget.budget - topUpTarget.spent >= 0 ? '#059669' : '#b91c1c',
                          }}
                        >
                          {formatRupiah(topUpTarget.budget - topUpTarget.spent)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Nominal Tambahan */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Penambahan / Top-Up (Rp)</label>
                    <NominalInput
                      id="topup-amount"
                      value={topUpAmount}
                      onChange={(val) => setTopUpAmount(val)}
                      placeholder="Contoh: 1.500.000"
                      required
                    />
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Nominal ini akan ditambahkan ke pagu yang sudah ada.
                    </div>
                  </div>

                  {/* Kalkulasi Pratinjau Plafon Baru */}
                  {topUpAmount > 0 && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 8,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 12.5,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#065f46' }}>
                        <span>Plafon Pagu Baru Setelah Top-Up:</span>
                        <strong>{formatRupiah(topUpTarget.budget + topUpAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                        <span>Estimasi Sisa Saldo Tersedia Baru:</span>
                        <strong>{formatRupiah(topUpTarget.budget + topUpAmount - topUpTarget.spent)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Alasan / Catatan Penambahan */}
                  <div className="form-group">
                    <label className="form-label">Alasan / Catatan Penambahan Pagu</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Contoh: Penambahan kebutuhan operasional karena lonjakan pengiriman logistik misi"
                      value={topUpReason}
                      onChange={(e) => setTopUpReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setTopUpTarget(null)}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={topUpAmount <= 0}
                  style={{ fontWeight: 600 }}
                >
                  <PlusCircle size={14} /> Simpan & Top-Up Pagu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
