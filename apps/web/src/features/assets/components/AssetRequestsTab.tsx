import React from 'react';
import {
  Inbox,
  Search,
  Calendar,
  RotateCcw,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  CheckCheck,
} from 'lucide-react';
import type { AssetLoan } from '../types';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';

interface AssetRequestsTabProps {
  isLoadingLoans: boolean;
  filteredRequests: AssetLoan[];
  paginatedRequests: AssetLoan[];
  pendingRequestsCount: number;
  searchRequest: string;
  setSearchRequest: (s: string) => void;
  filterRequestStatus: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  setFilterRequestStatus: (s: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
  filterRequestDateFrom: string;
  setFilterRequestDateFrom: (s: string) => void;
  filterRequestDateTo: string;
  setFilterRequestDateTo: (s: string) => void;
  pageRequests: number;
  totalPagesRequests: number;
  pageSizeRequests: number;
  setPageRequests: (p: number) => void;
  setPageSizeRequests: (s: number) => void;
  openApproveModal: (loan: AssetLoan) => void;
  openRejectModal: (loan: AssetLoan) => void;
  handleHandoverLoan: (loan: AssetLoan) => void;
  isSubmittingHandover: boolean;
  setActiveTab: (tab: 'catalog' | 'requests' | 'active_loans' | 'history') => void;
}

export const AssetRequestsTab: React.FC<AssetRequestsTabProps> = ({
  isLoadingLoans,
  filteredRequests,
  paginatedRequests,
  pendingRequestsCount,
  searchRequest,
  setSearchRequest,
  filterRequestStatus,
  setFilterRequestStatus,
  filterRequestDateFrom,
  setFilterRequestDateFrom,
  filterRequestDateTo,
  setFilterRequestDateTo,
  pageRequests,
  totalPagesRequests,
  pageSizeRequests,
  setPageRequests,
  setPageSizeRequests,
  openApproveModal,
  openRejectModal,
  handleHandoverLoan,
  isSubmittingHandover,
  setActiveTab,
}) => {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Inbox size={17} color="var(--gmh-gold)" /> Antrean &amp; Riwayat Permohonan Pinjaman Aset Online
        </div>

        {/* Filter and Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 230 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gmh-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari kode, nama aset, peminjam..."
              value={searchRequest}
              onChange={(e) => setSearchRequest(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
            />
          </div>

          <select
            className="form-select"
            value={filterRequestStatus}
            onChange={(e) => setFilterRequestStatus(e.target.value as any)}
            style={{ fontSize: 12.5, height: 34, width: 175 }}
          >
            <option value="ALL">Semua Status Permohonan</option>
            <option value="PENDING">Menunggu Review ({pendingRequestsCount})</option>
            <option value="APPROVED">Disetujui (Siap Ambil)</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          {/* Filter Tanggal Dipinjam */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Calendar size={13} color="var(--gmh-text-muted)" />
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Pinjam:</span>
            <input
              type="date"
              className="form-input"
              value={filterRequestDateFrom}
              onChange={(e) => setFilterRequestDateFrom(e.target.value)}
              title="Tanggal Pinjam Dari"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>-</span>
            <input
              type="date"
              className="form-input"
              value={filterRequestDateTo}
              onChange={(e) => setFilterRequestDateTo(e.target.value)}
              title="Tanggal Pinjam Sampai"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
          </div>

          {(searchRequest || filterRequestStatus !== 'ALL' || filterRequestDateFrom || filterRequestDateTo) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ height: 34, fontSize: 11.5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                setSearchRequest('');
                setFilterRequestStatus('ALL');
                setFilterRequestDateFrom('');
                setFilterRequestDateTo('');
              }}
              title="Reset Filter"
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 160, whiteSpace: 'nowrap' }}>No. Tiket &amp; Tgl</th>
              <th style={{ minWidth: 200 }}>Pemohon &amp; Lembaga</th>
              <th style={{ minWidth: 200 }}>Aset &amp; Jumlah</th>
              <th style={{ width: 180, whiteSpace: 'nowrap' }}>Skema &amp; Durasi</th>
              <th style={{ minWidth: 200 }}>Tujuan Penggunaan</th>
              <th style={{ width: 165, textAlign: 'center', whiteSpace: 'nowrap' }}>Status Approval</th>
              <th style={{ width: 180, textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi Pengurus</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLoans ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Memuat antrean permohonan pinjaman...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Tidak ada permohonan peminjaman aset yang sesuai filter saat ini.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((req) => {
                const isRent = req.loan_type === 'SEWA';
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';
                const isActive = req.status === 'ACTIVE' || req.status === 'BORROWED';

                return (
                  <tr key={req.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#0369a1',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        {req.request_code || `REQ-${req.id.slice(0, 8)}`}
                      </span>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {new Date(req.created_at || req.borrowed_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 650, fontSize: 13.5, color: '#0f172a' }}>{req.borrower_name}</div>
                      {req.borrower_institution && (
                        <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 500, marginTop: 1 }}>
                          {req.borrower_institution}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginTop: 3 }}>
                        {req.borrower_phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={10} color="#0284c7" /> {req.borrower_phone}
                          </span>
                        )}
                        {req.borrower_email && <span>• {req.borrower_email}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{req.asset_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <code style={{ fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: 4 }}>
                          {req.asset_code}
                        </code>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#047857' }}>
                          {req.quantity_borrowed || 1} Unit
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ marginBottom: 4 }}>
                        {isRent ? (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 99,
                              background: '#fffbeb',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                            }}
                          >
                            SEWA ({formatRupiah(Number(req.rental_fee || 0))})
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 99,
                              background: '#f0f9ff',
                              color: '#0369a1',
                              border: '1px solid #bae6fd',
                            }}
                          >
                            PINJAM PELAYANAN
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#334155' }}>
                        {new Date(req.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                        {new Date(req.expected_return_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>{req.loan_purpose}</div>
                      {req.notes && (
                        <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                          Catatan: {req.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isPending && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#fffbeb',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={11} /> Menunggu Review
                        </span>
                      )}
                      {isApproved && (
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 99,
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle size={11} /> Disetujui (Siap Ambil)
                          </span>
                          {req.approval_notes && (
                            <div style={{ fontSize: 10.5, color: '#166534', marginTop: 3, maxWidth: 170, margin: '3px auto 0', whiteSpace: 'normal' }}>
                              "{req.approval_notes}"
                            </div>
                          )}
                        </div>
                      )}
                      {isRejected && (
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 99,
                              background: '#fef2f2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <XCircle size={11} /> Ditolak
                          </span>
                          {req.rejection_reason && (
                            <div style={{ fontSize: 10.5, color: '#991b1b', marginTop: 3, maxWidth: 170, margin: '3px auto 0', whiteSpace: 'normal' }}>
                              Alasan: "{req.rejection_reason}"
                            </div>
                          )}
                        </div>
                      )}
                      {isActive && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#fff7ed',
                            color: '#c2410c',
                            border: '1px solid #ffedd5',
                          }}
                        >
                          Sedang Berjalan (Dipinjam)
                        </span>
                      )}
                      {req.status === 'RETURNED' && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: 99,
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          Selesai Dikembalikan
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isPending && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 6 }}
                            onClick={() => openApproveModal(req)}
                          >
                            <CheckCircle size={12} /> Setujui
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: 11.5,
                              borderColor: '#fca5a5',
                              color: '#dc2626',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                            }}
                            onClick={() => openRejectModal(req)}
                          >
                            <XCircle size={12} /> Tolak
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: 11.5,
                            background: '#0284c7',
                            borderColor: '#0284c7',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            borderRadius: 6,
                          }}
                          onClick={() => handleHandoverLoan(req)}
                          disabled={isSubmittingHandover}
                        >
                          <CheckCheck size={13} /> Serahkan Aset
                        </button>
                      )}

                      {isActive && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6 }}
                          onClick={() => {
                            setActiveTab('active_loans');
                          }}
                        >
                          Lihat di Peminjaman Aktif
                        </button>
                      )}

                      {isRejected && (
                        <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                          Tidak ada aksi lanjutan
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pageRequests}
        totalPages={totalPagesRequests}
        totalItems={filteredRequests.length}
        pageSize={pageSizeRequests}
        onPageChange={setPageRequests}
        onPageSizeChange={setPageSizeRequests}
        itemName="permohonan"
      />
    </div>
  );
};
