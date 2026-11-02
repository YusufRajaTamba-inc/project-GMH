import React from 'react';
import {
  Package,
  X,
  MapPin,
  RefreshCw,
  Info,
  Clock,
  Plus,
  Edit2,
  ArrowRightLeft,
  Save,
  Check,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import type { Asset, AssetLoan } from '../types';
import { CONDITION_LABEL, ASSET_TYPES } from '../types';
import { formatRupiah } from '../../../utils/currency';
import NominalInput from '../../../components/NominalInput';

interface AssetModalsProps {
  // Detail Modal
  detailAsset: Asset | null;
  setDetailAsset: (a: Asset | null) => void;
  isLoadingDetail: boolean;
  assetLoanHistory: AssetLoan[];
  openEditModal: (a: Asset) => void;
  openBorrowModal: (a: Asset) => void;

  // Add Modal
  showAddModal: boolean;
  setShowAddModal: (b: boolean) => void;
  addName: string;
  setAddName: (s: string) => void;
  addType: string;
  setAddType: (s: string) => void;
  addCategoryId: string;
  setAddCategoryId: (s: string) => void;
  categoryOptions: Array<{ id: string; label: string; code: string }>;
  addQty: number;
  setAddQty: (n: number) => void;
  addCondition: 'GOOD' | 'FAIR' | 'DAMAGED';
  setAddCondition: (c: 'GOOD' | 'FAIR' | 'DAMAGED') => void;
  conditionOptions: Array<{ code: 'GOOD' | 'FAIR' | 'DAMAGED'; label: string }>;
  addPrice: number;
  setAddPrice: (n: number) => void;
  addRentalPrice: number;
  setAddRentalPrice: (n: number) => void;
  addRoom: string;
  setAddRoom: (s: string) => void;
  locationOptions: Array<{ id: string; label: string; code: string }>;
  addBorrowable: boolean;
  setAddBorrowable: (b: boolean) => void;
  addNotes: string;
  setAddNotes: (s: string) => void;
  isSubmittingAdd: boolean;
  handleSaveAdd: (e: React.FormEvent) => void;

  // Edit Modal
  editingAsset: Asset | null;
  setEditingAsset: (a: Asset | null) => void;
  editName: string;
  setEditName: (s: string) => void;
  editType: string;
  setEditType: (s: string) => void;
  editCategoryId: string;
  setEditCategoryId: (s: string) => void;
  editQty: number;
  setEditQty: (n: number) => void;
  editCondition: 'GOOD' | 'FAIR' | 'DAMAGED';
  setEditCondition: (c: 'GOOD' | 'FAIR' | 'DAMAGED') => void;
  editPrice: number;
  setEditPrice: (n: number) => void;
  editRentalPrice: number;
  setEditRentalPrice: (n: number) => void;
  editRoom: string;
  setEditRoom: (s: string) => void;
  editBorrowable: boolean;
  setEditBorrowable: (b: boolean) => void;
  editNotes: string;
  setEditNotes: (s: string) => void;
  isSubmittingEdit: boolean;
  handleSaveEdit: (e: React.FormEvent) => void;

  // Borrow/Rent Modal
  borrowingAsset: Asset | null;
  setBorrowingAsset: (a: Asset | null) => void;
  loanMode: 'PINJAM' | 'SEWA';
  handleModeChange: (m: 'PINJAM' | 'SEWA') => void;
  selectedMemberId: string;
  setSelectedMemberId: (s: string) => void;
  membersList: Array<{ id: string; member_number: string; full_name: string; phone_number?: string }>;
  borrowerName: string;
  setBorrowerName: (s: string) => void;
  borrowerPhone: string;
  setBorrowerPhone: (s: string) => void;
  loanPurpose: string;
  setLoanPurpose: (s: string) => void;
  loanQty: number;
  handleLoanQtyChange: (n: number) => void;
  rentalFee: number;
  setRentalFee: (n: number) => void;
  borrowedAt: string;
  setBorrowedAt: (s: string) => void;
  expectedReturnAt: string;
  setExpectedReturnAt: (s: string) => void;
  loanNotes: string;
  setLoanNotes: (s: string) => void;
  isSubmittingLoan: boolean;
  handleSaveLoan: (e: React.FormEvent) => void;

  // Return Modal
  returningLoan: AssetLoan | null;
  setReturningLoan: (l: AssetLoan | null) => void;
  actualReturnAt: string;
  setActualReturnAt: (s: string) => void;
  conditionOnReturn: 'GOOD' | 'FAIR' | 'DAMAGED';
  setConditionOnReturn: (c: 'GOOD' | 'FAIR' | 'DAMAGED') => void;
  returnNotes: string;
  setReturnNotes: (s: string) => void;
  isSubmittingReturn: boolean;
  handleSaveReturn: (e: React.FormEvent) => void;

  // Approve & Reject Modals
  approvingLoan: AssetLoan | null;
  setApprovingLoan: (l: AssetLoan | null) => void;
  approvalNotes: string;
  setApprovalNotes: (s: string) => void;
  isSubmittingApproval: boolean;
  handleConfirmApprove: (e: React.FormEvent) => void;
  rejectingLoan: AssetLoan | null;
  setRejectingLoan: (l: AssetLoan | null) => void;
  rejectionReason: string;
  setRejectionReason: (s: string) => void;
  isSubmittingRejection: boolean;
  handleConfirmReject: (e: React.FormEvent) => void;
}

export const AssetModals: React.FC<AssetModalsProps> = ({
  detailAsset,
  setDetailAsset,
  isLoadingDetail,
  assetLoanHistory,
  openEditModal,
  openBorrowModal,
  showAddModal,
  setShowAddModal,
  addName,
  setAddName,
  addType,
  setAddType,
  addCategoryId,
  setAddCategoryId,
  categoryOptions,
  addQty,
  setAddQty,
  addCondition,
  setAddCondition,
  conditionOptions,
  addPrice,
  setAddPrice,
  addRentalPrice,
  setAddRentalPrice,
  addRoom,
  setAddRoom,
  locationOptions,
  addBorrowable,
  setAddBorrowable,
  addNotes,
  setAddNotes,
  isSubmittingAdd,
  handleSaveAdd,
  editingAsset,
  setEditingAsset,
  editName,
  setEditName,
  editType,
  setEditType,
  editCategoryId,
  setEditCategoryId,
  editQty,
  setEditQty,
  editCondition,
  setEditCondition,
  editPrice,
  setEditPrice,
  editRentalPrice,
  setEditRentalPrice,
  editRoom,
  setEditRoom,
  editBorrowable,
  setEditBorrowable,
  editNotes,
  setEditNotes,
  isSubmittingEdit,
  handleSaveEdit,
  borrowingAsset,
  setBorrowingAsset,
  loanMode,
  handleModeChange,
  selectedMemberId,
  setSelectedMemberId,
  membersList,
  borrowerName,
  setBorrowerName,
  borrowerPhone,
  setBorrowerPhone,
  loanPurpose,
  setLoanPurpose,
  loanQty,
  handleLoanQtyChange,
  rentalFee,
  setRentalFee,
  borrowedAt,
  setBorrowedAt,
  expectedReturnAt,
  setExpectedReturnAt,
  loanNotes,
  setLoanNotes,
  isSubmittingLoan,
  handleSaveLoan,
  returningLoan,
  setReturningLoan,
  actualReturnAt,
  setActualReturnAt,
  conditionOnReturn,
  setConditionOnReturn,
  returnNotes,
  setReturnNotes,
  isSubmittingReturn,
  handleSaveReturn,
  approvingLoan,
  setApprovingLoan,
  approvalNotes,
  setApprovalNotes,
  isSubmittingApproval,
  handleConfirmApprove,
  rejectingLoan,
  setRejectingLoan,
  rejectionReason,
  setRejectionReason,
  isSubmittingRejection,
  handleConfirmReject,
}) => {
  return (
    <>
      {/* ==================================================================== */}
      {/* MODAL: DETAIL ASET & RIWAYAT PEMINJAMAN LENGKAP */}
      {/* ==================================================================== */}
      {detailAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setDetailAsset(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 880,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--gmh-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="card-header"
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--gmh-border)',
                background: 'var(--gmh-surface-2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={20} color="#047857" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: 'var(--gmh-text)' }}>
                      {detailAsset.asset_name}
                    </h3>
                    <code
                      style={{
                        fontSize: 12,
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                      }}
                    >
                      {detailAsset.asset_code}
                    </code>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span>{detailAsset.category_label || detailAsset.asset_type || 'Inventaris Umum'}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color="var(--gmh-brand)" /> {detailAsset.location_room || 'Rumah Persekutuan GMH'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setDetailAsset(null)}
                style={{ padding: '4px 8px', borderRadius: 6 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {isLoadingDetail && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '8px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <RefreshCw size={13} className="spin" />
                  <span>Memuat relasi data aset...</span>
                </div>
              )}

              {/* 4 Metrics Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12 }}>
                {/* Stok Unit */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Stok &amp; Ketersediaan
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {detailAsset.available_quantity ?? detailAsset.quantity} / {detailAsset.quantity || 1}{' '}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Unit</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: (detailAsset.available_quantity || 0) > 0 ? '#ecfdf5' : '#fef2f2',
                        color: (detailAsset.available_quantity || 0) > 0 ? '#065f46' : '#991b1b',
                        border: `1px solid ${(detailAsset.available_quantity || 0) > 0 ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {(detailAsset.available_quantity || 0) > 0 ? 'Tersedia di Gudang' : 'Kosong / Terpakai'}
                    </span>
                  </div>
                </div>

                {/* Kondisi Fisik */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Kondisi Fisik
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background:
                          detailAsset.physical_condition === 'GOOD'
                            ? '#ecfdf5'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#fffbeb'
                            : '#fef2f2',
                        color:
                          detailAsset.physical_condition === 'GOOD'
                            ? '#065f46'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#92400e'
                            : '#991b1b',
                        border: `1px solid ${
                          detailAsset.physical_condition === 'GOOD'
                            ? '#a7f3d0'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#fde68a'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      {CONDITION_LABEL[detailAsset.physical_condition] || detailAsset.physical_condition}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                    {detailAsset.physical_condition === 'GOOD'
                      ? 'Fungsi optimal & terawat'
                      : detailAsset.physical_condition === 'FAIR'
                      ? 'Perlu pembersihan berkala'
                      : 'Kerusakan komponen fisik'}
                  </div>
                </div>

                {/* Nilai Buku */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Nilai Buku / Perolehan
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {formatRupiah(Number(detailAsset.purchase_price || 0))}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {detailAsset.purchase_date
                      ? `Perolehan: ${new Date(detailAsset.purchase_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : 'Aset Tetap Yayasan GMH'}
                  </div>
                </div>

                {/* Ketentuan Sewa */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Ketentuan Peminjaman
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {detailAsset.is_borrowable
                      ? Number(detailAsset.rental_price || 0) > 0
                        ? `${formatRupiah(Number(detailAsset.rental_price))} / hari`
                        : 'Bebas Biaya (Pelayanan)'
                      : 'Internal Saja'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {detailAsset.is_borrowable ? 'Dapat dipinjam atau disewa' : 'Khusus operasional internal GMH'}
                  </div>
                </div>
              </div>

              {/* Catatan Lengkap / Spesifikasi */}
              {detailAsset.notes && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <Info size={17} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>
                      Catatan Spesifikasi &amp; Kondisi Aset
                    </div>
                    <div style={{ fontSize: 12.5, color: '#0c4a6e', marginTop: 3, lineHeight: 1.5 }}>
                      {detailAsset.notes}
                    </div>
                  </div>
                </div>
              )}

              {/* History Peminjaman Aset */}
              <div style={{ borderTop: '1px solid var(--gmh-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="var(--gmh-brand)" />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gmh-text)' }}>
                      Riwayat Peminjaman &amp; Sirkulasi Aset Ini
                    </h4>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: assetLoanHistory.length > 0 ? '#ecfdf5' : '#f1f5f9',
                        color: assetLoanHistory.length > 0 ? '#065f46' : '#64748b',
                        fontWeight: 700,
                        border: `1px solid ${assetLoanHistory.length > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                      }}
                    >
                      {assetLoanHistory.length} Riwayat
                    </span>
                  </div>

                  {detailAsset.is_borrowable && (detailAsset.available_quantity || 0) > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const target = detailAsset;
                        setDetailAsset(null);
                        openBorrowModal(target);
                      }}
                      style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6 }}
                    >
                      <Plus size={13} /> Ajukan Pinjaman Aset Ini
                    </button>
                  )}
                </div>

                {assetLoanHistory.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 20px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <Clock size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 650, color: '#334155' }}>
                      Belum Ada Riwayat Peminjaman
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Aset ini belum pernah dipinjamkan atau disewakan. Seluruh unit tersimpan aman di gudang inventaris.
                    </div>
                  </div>
                ) : (
                  <div
                    className="table-wrapper"
                    style={{ maxHeight: 270, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  >
                    <table className="table table-compact" style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 135, whiteSpace: 'nowrap' }}>Tiket &amp; Tgl</th>
                          <th style={{ minWidth: 160 }}>Peminjam / Lembaga</th>
                          <th style={{ width: 110, whiteSpace: 'nowrap' }}>Skema &amp; Tarif</th>
                          <th style={{ minWidth: 160 }}>Keperluan Acara</th>
                          <th style={{ width: 140, whiteSpace: 'nowrap' }}>Durasi Pinjam</th>
                          <th style={{ width: 125, textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                          <th style={{ minWidth: 150 }}>Kondisi Saat Kembali</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetLoanHistory.map((lh) => {
                          const isRent = lh.loan_type === 'SEWA';
                          return (
                            <tr key={lh.id}>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: 11.5 }}>
                                  {lh.request_code || `LOAN-${lh.id.slice(0, 7).toUpperCase()}`}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                                  {new Date(lh.borrowed_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{lh.borrower_name}</span>
                                  {lh.member_number && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: '#ecfdf5',
                                        color: '#065f46',
                                        border: '1px solid #a7f3d0',
                                      }}
                                      title="Relasi Anggota: Terdaftar di Database Members"
                                    >
                                      {lh.member_number}
                                    </span>
                                  )}
                                </div>
                                {lh.borrower_institution && (
                                  <div style={{ fontSize: 11, color: '#475569' }}>{lh.borrower_institution}</div>
                                )}
                                {(lh.borrower_phone || lh.member_phone) && (
                                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>{lh.borrower_phone || lh.member_phone}</div>
                                )}
                                {lh.approver_name && (
                                  <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <ShieldCheck size={11} color="#0284c7" /> Disetujui: <strong>{lh.approver_name}</strong>
                                  </div>
                                )}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: 99,
                                    background: isRent ? '#fffbeb' : '#f0f9ff',
                                    color: isRent ? '#92400e' : '#0369a1',
                                    border: `1px solid ${isRent ? '#fde68a' : '#bae6fd'}`,
                                  }}
                                >
                                  {isRent ? 'SEWA' : 'PINJAM'}
                                </span>
                                {isRent && Number(lh.rental_fee) > 0 && (
                                  <div style={{ fontSize: 10.5, color: '#92400e', fontWeight: 600, marginTop: 2 }}>
                                    {formatRupiah(Number(lh.rental_fee))}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{lh.loan_purpose}</div>
                                {lh.notes && (
                                  <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                                    "{lh.notes}"
                                  </div>
                                )}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                <div>
                                  {new Date(lh.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d
                                </div>
                                <div>
                                  {new Date(lh.expected_return_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    display: 'inline-block',
                                    background:
                                      lh.status === 'PENDING'
                                        ? '#fffbeb'
                                        : lh.status === 'APPROVED'
                                        ? '#f0fdf4'
                                        : lh.status === 'ACTIVE'
                                        ? '#f0f9ff'
                                        : lh.status === 'RETURNED'
                                        ? '#ecfdf5'
                                        : '#fef2f2',
                                    color:
                                      lh.status === 'PENDING'
                                        ? '#92400e'
                                        : lh.status === 'APPROVED'
                                        ? '#15803d'
                                        : lh.status === 'ACTIVE'
                                        ? '#0284c7'
                                        : lh.status === 'RETURNED'
                                        ? '#065f46'
                                        : '#991b1b',
                                    border: `1px solid ${
                                      lh.status === 'PENDING'
                                        ? '#fde68a'
                                        : lh.status === 'APPROVED'
                                        ? '#bbf7d0'
                                        : lh.status === 'ACTIVE'
                                        ? '#bae6fd'
                                        : lh.status === 'RETURNED'
                                        ? '#a7f3d0'
                                        : '#fecaca'
                                    }`,
                                  }}
                                >
                                  {lh.status === 'PENDING'
                                    ? 'Menunggu Review'
                                    : lh.status === 'APPROVED'
                                    ? 'Disetujui'
                                    : lh.status === 'ACTIVE'
                                    ? 'Sedang Dipakai'
                                    : lh.status === 'RETURNED'
                                    ? 'Dikembalikan'
                                    : 'Ditolak'}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, color: '#475569' }}>
                                {lh.actual_return_at && (
                                  <div style={{ color: '#166534', fontWeight: 600 }}>
                                    Tgl Kembali:{' '}
                                    {new Date(lh.actual_return_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                )}
                                {lh.condition_on_return && (
                                  <div style={{ marginTop: 2 }}>
                                    Kondisi:{' '}
                                    <span style={{ fontWeight: 600 }}>
                                      {CONDITION_LABEL[lh.condition_on_return] || lh.condition_on_return}
                                    </span>
                                  </div>
                                )}
                                {!lh.actual_return_at && !lh.condition_on_return && (
                                  <span style={{ color: '#94a3b8' }}>Belum dikembalikan</span>
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
            </div>

            {/* Modal Footer */}
            <div
              className="card-footer"
              style={{
                padding: '12px 20px',
                background: 'var(--gmh-surface-2)',
                borderTop: '1px solid var(--gmh-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                ID Sistem:{' '}
                <code style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                  {detailAsset.id}
                </code>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const target = detailAsset;
                    setDetailAsset(null);
                    openEditModal(target);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
                >
                  <Edit2 size={13} /> Ubah Data Aset
                </button>
                {detailAsset.is_borrowable && (detailAsset.available_quantity || 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const target = detailAsset;
                      setDetailAsset(null);
                      openBorrowModal(target);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
                  >
                    <ArrowRightLeft size={13} /> Pinjam / Sewa Unit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setDetailAsset(null)}
                  style={{ borderRadius: 6 }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: TAMBAH ASET / FASILITAS BARU */}
      {/* ==================================================================== */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="var(--gmh-green-dark)" /> Daftarkan Aset, Fasilitas atau Ruangan Baru
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">
                    Nama Barang, Alat Musik, atau Ruangan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Speaker Portable Wireless 15 Inch / Keyboard Yamaha / Aula Lt. 2"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Tipe Sarana &amp; Aset</label>
                    <select className="form-select" value={addType} onChange={(e) => setAddType(e.target.value)}>
                      {ASSET_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Kategori Inventaris</label>
                    <select
                      className="form-select"
                      value={addCategoryId}
                      onChange={(e) => setAddCategoryId(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Jumlah Unit / Stok Fisik <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Kondisi Fisik Barang</label>
                    <select
                      className="form-select"
                      value={addCondition}
                      onChange={(e) => setAddCondition(e.target.value as any)}
                    >
                      {conditionOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Nilai Buku / Perolehan (Rp)</label>
                    <NominalInput value={addPrice} onChange={setAddPrice} />
                  </div>

                  <div>
                    <label className="form-label">Tarif Sewa / Hari (Rp) (Opsional)</label>
                    <NominalInput value={addRentalPrice} onChange={setAddRentalPrice} />
                    <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Isi 0 jika hanya untuk dipinjam gratis</span>
                  </div>
                </div>

                <div>
                  <label className="form-label">Lokasi Penempatan Ruangan</label>
                  <select
                    className="form-select"
                    value={addRoom}
                    onChange={(e) => setAddRoom(e.target.value)}
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc.id} value={loc.label}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    id="addBorrowable"
                    checked={addBorrowable}
                    onChange={(e) => setAddBorrowable(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="addBorrowable" style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Aset ini dapat dipinjamkan atau disewakan (Mahasiswa / Alumni / Eksternal)
                  </label>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Spesifikasi teknis, nomor seri, atau kelengkapan..."
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingAdd}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingAdd}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingAdd ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDIT ASET */}
      {/* ==================================================================== */}
      {editingAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={18} color="var(--gmh-green-dark)" /> Edit Data Aset, Jumlah &amp; Kondisi
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingAsset(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, fontSize: 12.5 }}>
                  <strong>Kode Aset:</strong> <code>{editingAsset.asset_code}</code> •{' '}
                  <strong>Stok Tersedia Saat Ini:</strong> {editingAsset.available_quantity ?? editingAsset.quantity} dari{' '}
                  {editingAsset.quantity} unit
                </div>

                <div>
                  <label className="form-label">
                    Nama Barang / Fasilitas <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Tipe Sarana &amp; Aset</label>
                    <select className="form-select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                      {ASSET_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Kategori Inventaris</label>
                    <select
                      className="form-select"
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Total Jumlah Unit Fisik <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="form-input"
                      required
                    />
                    <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                      Mengubah total unit akan otomatis menyesuaikan stok unit tersedia.
                    </span>
                  </div>

                  <div>
                    <label className="form-label">
                      Kondisi Fisik Saat Ini <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as any)}
                    >
                      {conditionOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Nilai Buku / Perolehan (Rp)</label>
                    <NominalInput value={editPrice} onChange={setEditPrice} />
                  </div>

                  <div>
                    <label className="form-label">Tarif Sewa / Hari (Rp)</label>
                    <NominalInput value={editRentalPrice} onChange={setEditRentalPrice} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Lokasi Penempatan Ruangan</label>
                  <select
                    className="form-select"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc.id} value={loc.label}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    id="editBorrowable"
                    checked={editBorrowable}
                    onChange={(e) => setEditBorrowable(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="editBorrowable" style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Aset ini dapat dipinjamkan atau disewakan (Mahasiswa / Alumni / Eksternal)
                  </label>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingAsset(null)}
                  disabled={isSubmittingEdit}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingEdit}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: FORM PEMINJAMAN & PENYEWAAN ASET / RUANGAN */}
      {/* ==================================================================== */}
      {borrowingAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRightLeft size={18} color="#047857" /> Form Peminjaman &amp; Penyewaan Aset / Ruangan
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setBorrowingAsset(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveLoan}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Asset Summary Info */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '12px 14px',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                    {borrowingAsset.asset_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d', marginTop: 3 }}>
                    <code>{borrowingAsset.asset_code}</code> • Lokasi: {borrowingAsset.location_room || 'Rumah Persekutuan'} •{' '}
                    <strong>Tersedia: {borrowingAsset.available_quantity} Unit</strong>
                  </div>
                </div>

                {/* Mode Selector: PINJAM vs SEWA */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Pilih Skema Pemakaian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div
                      onClick={() => handleModeChange('PINJAM')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: loanMode === 'PINJAM' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: loanMode === 'PINJAM' ? '#f0f9ff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>📌 Pinjam (Bebas Biaya)</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        Untuk kegiatan internal pelayanan persekutuan mahasiswa/alumni GMH.
                      </div>
                    </div>

                    <div
                      onClick={() => handleModeChange('SEWA')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: loanMode === 'SEWA' ? '2px solid #d97706' : '1px solid #e2e8f0',
                        background: loanMode === 'SEWA' ? '#fffbeb' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#b45309' }}>🏷️ Sewa (Berbayar)</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        Untuk pihak eksternal, resepsi, seminar umum, atau acara komersial alumni.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Pilih Anggota / Alumni Yayasan (Opsional)
                  </label>
                  <select
                    className="form-select"
                    value={selectedMemberId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedMemberId(mId);
                      if (mId) {
                        const m = membersList.find((mem) => mem.id === mId);
                        if (m) {
                          setBorrowerName(m.full_name);
                          if (m.phone_number) setBorrowerPhone(m.phone_number);
                        }
                      }
                    }}
                  >
                    <option value="">-- Non-Anggota / Pemohon Eksternal (Input Manual di Bawah) --</option>
                    {membersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.member_number || 'Anggota'}) {m.phone_number ? `• ${m.phone_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Nama Peminjam / Penyewa / Instansi <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: dr. Raymond Situmorang / Panitia Natal FK"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Keperluan Acara / Tujuan Penggunaan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibadah Padang Mahasiswa / Seminar Medis / Latihan Band"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Jumlah Unit Dipinjam/Sewa (Maks: {borrowingAsset.available_quantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={borrowingAsset.available_quantity}
                      value={loanQty}
                      onChange={(e) => handleLoanQtyChange(parseInt(e.target.value, 10) || 1)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      {loanMode === 'SEWA' ? 'Total Biaya Sewa (Rp)' : 'Biaya Peminjaman'}
                    </label>
                    {loanMode === 'SEWA' ? (
                      <NominalInput value={rentalFee} onChange={setRentalFee} />
                    ) : (
                      <input
                        type="text"
                        value="Gratis (Pelayanan)"
                        disabled
                        className="form-input"
                        style={{ background: '#f1f5f9', color: '#64748b' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Tanggal Mulai Pemakaian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={borrowedAt}
                      onChange={(e) => setBorrowedAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Batas Waktu Pengembalian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={expectedReturnAt}
                      onChange={(e) => setExpectedReturnAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Kelengkapan kabel, mic tambahan, atau instruksi serah terima..."
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setBorrowingAsset(null)}
                  disabled={isSubmittingLoan}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingLoan}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingLoan ? 'Memproses...' : 'Simpan Transaksi Sirkulasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: PENGEMBALIAN ASET / SELESAI SEWA */}
      {/* ==================================================================== */}
      {returningLoan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} color="#16a34a" /> Konfirmasi Pengembalian Aset / Selesai Sewa
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setReturningLoan(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveReturn}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{returningLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Peminjam: <strong>{returningLoan.borrower_name}</strong> • Jumlah:{' '}
                    <strong>{returningLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Tujuan: {returningLoan.loan_purpose}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Tanggal Pengembalian Sebenarnya <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={actualReturnAt}
                      onChange={(e) => setActualReturnAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Kondisi Fisik Saat Kembali <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={conditionOnReturn}
                      onChange={(e) => setConditionOnReturn(e.target.value as any)}
                    >
                      <option value="GOOD">Baik (Lengkap &amp; Utuh)</option>
                      <option value="FAIR">Cukup (Sedikit Baret / Aus)</option>
                      <option value="DAMAGED">Rusak / Tidak Berfungsi Normal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Pemeriksaan Fisik &amp; Kelengkapan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Kabel dan remote dicek lengkap, mic berfungsi lancar..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#15803d',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: 6,
                  }}
                >
                  ✓ Stok tersedia di inventaris akan otomatis dipulihkan sebanyak{' '}
                  <strong>{returningLoan.quantity_borrowed || 1} unit</strong>.
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setReturningLoan(null)}
                  disabled={isSubmittingReturn}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingReturn}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} /> {isSubmittingReturn ? 'Menyimpan...' : 'Konfirmasi Aset Diterima Kembali'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: APPROVE ONLINE LOAN REQUEST */}
      {/* ==================================================================== */}
      {approvingLoan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} color="#15803d" /> Setujui Permohonan Pinjaman Aset
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setApprovingLoan(null)}
                style={{ padding: '2px 8px' }}
                disabled={isSubmittingApproval}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleConfirmApprove}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0369a1' }}>
                      {approvingLoan.request_code || `REQ-${approvingLoan.id.slice(0, 8)}`}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: 11 }}>
                      {approvingLoan.loan_type === 'SEWA' ? 'Penyewaan' : 'Peminjaman Pelayanan'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 4 }}>{approvingLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text)', marginTop: 2 }}>
                    Pemohon: <strong>{approvingLoan.borrower_name}</strong>
                    {approvingLoan.borrower_institution ? ` (${approvingLoan.borrower_institution})` : ''} • Jumlah:{' '}
                    <strong>{approvingLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Periode: {new Date(approvingLoan.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                    {new Date(approvingLoan.expected_return_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Keperluan: {approvingLoan.loan_purpose}
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Persetujuan &amp; Lokasi / Jam Pengambilan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Pengajuan disetujui. Silakan ambil unit di Sekretariat Rumah Persekutuan GMH sebelum jam 17:00..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="form-input"
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                    Catatan ini akan langsung terlihat oleh pemohon di portal status tracking mereka.
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#15803d',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #bbf7d0',
                  }}
                >
                  ✓ Menyetujui permohonan ini akan otomatis mengalokasikan{' '}
                  <strong>{approvingLoan.quantity_borrowed || 1} unit</strong> dari stok inventaris yang tersedia.
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setApprovingLoan(null)}
                  disabled={isSubmittingApproval}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingApproval}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle size={14} /> {isSubmittingApproval ? 'Memproses...' : 'Konfirmasi Setujui Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REJECT ONLINE LOAN REQUEST */}
      {/* ==================================================================== */}
      {rejectingLoan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={18} color="#dc2626" /> Tolak Permohonan Pinjaman Aset
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setRejectingLoan(null)}
                style={{ padding: '2px 8px' }}
                disabled={isSubmittingRejection}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: 8, border: '1px solid #fee2e2' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#991b1b' }}>
                    {rejectingLoan.request_code || `REQ-${rejectingLoan.id.slice(0, 8)}`}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{rejectingLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text)', marginTop: 2 }}>
                    Pemohon: <strong>{rejectingLoan.borrower_name}</strong> • Jumlah:{' '}
                    <strong>{rejectingLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Alasan Penolakan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Mohon maaf, jadwal pemakaian bentrok dengan Ibadah Raya / alat sedang dalam perbaikan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="form-input"
                    required
                  />
                  <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 4 }}>
                    Alasan ini wajib diisi dan akan terbaca oleh pemohon saat melacak tiket permohonan mereka.
                  </div>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setRejectingLoan(null)}
                  disabled={isSubmittingRejection}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingRejection}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', borderColor: '#dc2626' }}
                >
                  <XCircle size={14} /> {isSubmittingRejection ? 'Menyimpan...' : 'Konfirmasi Tolak Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
