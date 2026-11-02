import React from 'react';
import {
  ArrowRightLeft,
  Search,
  Calendar,
  RotateCcw,
  MapPin,
  DollarSign,
  Phone,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { AssetLoan } from '../types';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';

interface AssetActiveLoansTabProps {
  isLoadingLoans: boolean;
  activeLoans: AssetLoan[];
  filteredActiveLoans: AssetLoan[];
  paginatedActiveLoans: AssetLoan[];
  searchActiveLoan: string;
  setSearchActiveLoan: (s: string) => void;
  filterActiveType: 'ALL' | 'PINJAM' | 'SEWA';
  setFilterActiveType: (s: 'ALL' | 'PINJAM' | 'SEWA') => void;
  filterActiveDateFrom: string;
  setFilterActiveDateFrom: (s: string) => void;
  filterActiveDateTo: string;
  setFilterActiveDateTo: (s: string) => void;
  pageActiveLoans: number;
  totalPagesActiveLoans: number;
  pageSizeActiveLoans: number;
  setPageActiveLoans: (p: number) => void;
  setPageSizeActiveLoans: (s: number) => void;
  openReturnModal: (l: AssetLoan) => void;
}

export const AssetActiveLoansTab: React.FC<AssetActiveLoansTabProps> = ({
  isLoadingLoans,
  activeLoans,
  filteredActiveLoans,
  paginatedActiveLoans,
  searchActiveLoan,
  setSearchActiveLoan,
  filterActiveType,
  setFilterActiveType,
  filterActiveDateFrom,
  setFilterActiveDateFrom,
  filterActiveDateTo,
  setFilterActiveDateTo,
  pageActiveLoans,
  totalPagesActiveLoans,
  pageSizeActiveLoans,
  setPageActiveLoans,
  setPageSizeActiveLoans,
  openReturnModal,
}) => {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowRightLeft size={17} color="#ea580c" /> Daftar Sirkulasi Aset Sedang Berjalan (Dipinjam / Disewa)
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 230 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gmh-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari kode, nama aset, peminjam..."
              value={searchActiveLoan}
              onChange={(e) => setSearchActiveLoan(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
            />
          </div>

          <select
            className="form-select"
            value={filterActiveType}
            onChange={(e) => setFilterActiveType(e.target.value as any)}
            style={{ fontSize: 12.5, height: 34, width: 160 }}
          >
            <option value="ALL">Semua Transaksi</option>
            <option value="PINJAM">Pinjam (Bebas Biaya)</option>
            <option value="SEWA">Sewa (Berbayar)</option>
          </select>

          {/* Filter Tanggal Dipinjam */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Calendar size={13} color="var(--gmh-text-muted)" />
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Pinjam:</span>
            <input
              type="date"
              className="form-input"
              value={filterActiveDateFrom}
              onChange={(e) => setFilterActiveDateFrom(e.target.value)}
              title="Tanggal Pinjam Dari"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>-</span>
            <input
              type="date"
              className="form-input"
              value={filterActiveDateTo}
              onChange={(e) => setFilterActiveDateTo(e.target.value)}
              title="Tanggal Pinjam Sampai"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
          </div>

          {(searchActiveLoan || filterActiveType !== 'ALL' || filterActiveDateFrom || filterActiveDateTo) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ height: 34, fontSize: 11.5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                setSearchActiveLoan('');
                setFilterActiveType('ALL');
                setFilterActiveDateFrom('');
                setFilterActiveDateTo('');
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
              <th style={{ minWidth: 230 }}>Kode &amp; Aset</th>
              <th style={{ width: 160, whiteSpace: 'nowrap' }}>Jenis Transaksi</th>
              <th style={{ minWidth: 190 }}>Nama Peminjam / Penyewa</th>
              <th style={{ minWidth: 200 }}>Keperluan / Acara</th>
              <th style={{ width: 90, textAlign: 'center', whiteSpace: 'nowrap' }}>Jumlah</th>
              <th style={{ width: 125, whiteSpace: 'nowrap' }}>Mulai Pinjam</th>
              <th style={{ width: 145, whiteSpace: 'nowrap' }}>Batas Pengembalian</th>
              <th style={{ width: 130, textAlign: 'right', whiteSpace: 'nowrap' }}>Tarif Sewa</th>
              <th style={{ width: 165, textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLoans ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Memuat sirkulasi peminjaman aset...
                </td>
              </tr>
            ) : filteredActiveLoans.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  {activeLoans.length === 0
                    ? 'Saat ini tidak ada aset atau fasilitas yang sedang dipinjam atau disewa. Seluruh unit tersedia di gudang!'
                    : 'Tidak ada peminjaman aktif yang sesuai dengan kriteria pencarian / filter tanggal.'}
                </td>
              </tr>
            ) : (
              paginatedActiveLoans.map((l) => {
                const isRent = l.loan_type === 'SEWA';
                const dueDate = new Date(l.expected_return_at);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;

                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 650, fontSize: 13.5, color: '#0f172a' }}>{l.asset_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <code style={{ fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: 4 }}>
                          {l.asset_code}
                        </code>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} color="var(--gmh-brand)" /> {l.location_room || 'Rumah Persekutuan'}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isRent ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 99,
                            background: '#fffbeb',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <DollarSign size={12} /> SEWA (Berbayar)
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 99,
                            background: '#f0f9ff',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          PINJAM (Bebas Biaya)
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{l.borrower_name}</span>
                        {l.member_number && (
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
                            {l.member_number}
                          </span>
                        )}
                      </div>
                      {(l.borrower_phone || l.member_phone) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#0369a1', marginTop: 2 }}>
                          <Phone size={11} /> {l.borrower_phone || l.member_phone}
                        </div>
                      )}
                      {l.approver_name && (
                        <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={11} color="#0284c7" /> Otorisasi: <strong>{l.approver_name}</strong>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12.5 }}>
                      <div style={{ color: '#0f172a', fontWeight: 500 }}>{l.loan_purpose}</div>
                      {l.notes && (
                        <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                          Catatan: {l.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#047857' }}>
                      {l.quantity_borrowed || 1} Unit
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#334155' }}>
                      {new Date(l.borrowed_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                        {new Date(l.expected_return_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {isOverdue ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#991b1b',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '1px 6px',
                            borderRadius: 99,
                            display: 'inline-block',
                            marginTop: 2,
                          }}
                        >
                          Terlambat {Math.abs(diffDays)} Hari!
                        </span>
                      ) : diffDays === 0 ? (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#92400e',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            padding: '1px 6px',
                            borderRadius: 99,
                            display: 'inline-block',
                            marginTop: 2,
                          }}
                        >
                          Jatuh tempo hari ini
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748b', display: 'inline-block', marginTop: 2 }}>
                          Sisa {diffDays} hari lagi
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 650, fontSize: 13, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {Number(l.rental_fee) > 0 ? (
                        <span style={{ color: '#b45309' }}>{formatRupiah(Number(l.rental_fee))}</span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 12 }}>Gratis</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ fontSize: 11.5, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 6 }}
                        onClick={() => openReturnModal(l)}
                      >
                        <Check size={13} /> Kembalikan / Selesai
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pageActiveLoans}
        totalPages={totalPagesActiveLoans}
        totalItems={filteredActiveLoans.length}
        pageSize={pageSizeActiveLoans}
        onPageChange={setPageActiveLoans}
        onPageSizeChange={setPageSizeActiveLoans}
        itemName="peminjaman aktif"
      />
    </div>
  );
};
