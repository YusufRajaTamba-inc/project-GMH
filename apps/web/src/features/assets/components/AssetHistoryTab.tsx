import React from 'react';
import {
  Clock,
  Search,
  Calendar,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import type { AssetLoan } from '../types';
import { CONDITION_LABEL } from '../types';
import { Pagination } from '../../../components/common/Pagination';

interface AssetHistoryTabProps {
  isLoadingLoans: boolean;
  historyLoans: AssetLoan[];
  filteredHistoryLoans: AssetLoan[];
  paginatedHistoryLoans: AssetLoan[];
  searchHistoryLoan: string;
  setSearchHistoryLoan: (s: string) => void;
  filterHistoryCondition: 'ALL' | 'GOOD' | 'FAIR' | 'DAMAGED';
  setFilterHistoryCondition: (s: 'ALL' | 'GOOD' | 'FAIR' | 'DAMAGED') => void;
  filterHistoryDateFrom: string;
  setFilterHistoryDateFrom: (s: string) => void;
  filterHistoryDateTo: string;
  setFilterHistoryDateTo: (s: string) => void;
  pageHistoryLoans: number;
  totalPagesHistoryLoans: number;
  pageSizeHistoryLoans: number;
  setPageHistoryLoans: (p: number) => void;
  setPageSizeHistoryLoans: (s: number) => void;
}

export const AssetHistoryTab: React.FC<AssetHistoryTabProps> = ({
  isLoadingLoans,
  historyLoans,
  filteredHistoryLoans,
  paginatedHistoryLoans,
  searchHistoryLoan,
  setSearchHistoryLoan,
  filterHistoryCondition,
  setFilterHistoryCondition,
  filterHistoryDateFrom,
  setFilterHistoryDateFrom,
  filterHistoryDateTo,
  setFilterHistoryDateTo,
  pageHistoryLoans,
  totalPagesHistoryLoans,
  pageSizeHistoryLoans,
  setPageHistoryLoans,
  setPageSizeHistoryLoans,
}) => {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={17} color="var(--gmh-green-dark)" /> Riwayat Pengembalian &amp; Catatan Selesai Pinjam/Sewa
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 230 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gmh-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari kode, nama aset, peminjam..."
              value={searchHistoryLoan}
              onChange={(e) => setSearchHistoryLoan(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
            />
          </div>

          <select
            className="form-select"
            value={filterHistoryCondition}
            onChange={(e) => setFilterHistoryCondition(e.target.value as any)}
            style={{ fontSize: 12.5, height: 34, width: 155 }}
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="GOOD">Kondisi Baik</option>
            <option value="FAIR">Kondisi Cukup</option>
            <option value="DAMAGED">Kondisi Rusak</option>
          </select>

          {/* Filter Tanggal Dipinjam */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Calendar size={13} color="var(--gmh-text-muted)" />
            <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Pinjam:</span>
            <input
              type="date"
              className="form-input"
              value={filterHistoryDateFrom}
              onChange={(e) => setFilterHistoryDateFrom(e.target.value)}
              title="Tanggal Pinjam Dari"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>-</span>
            <input
              type="date"
              className="form-input"
              value={filterHistoryDateTo}
              onChange={(e) => setFilterHistoryDateTo(e.target.value)}
              title="Tanggal Pinjam Sampai"
              style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
            />
          </div>

          {(searchHistoryLoan || filterHistoryCondition !== 'ALL' || filterHistoryDateFrom || filterHistoryDateTo) && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ height: 34, fontSize: 11.5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                setSearchHistoryLoan('');
                setFilterHistoryCondition('ALL');
                setFilterHistoryDateFrom('');
                setFilterHistoryDateTo('');
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
              <th style={{ width: 110, textAlign: 'center', whiteSpace: 'nowrap' }}>Jenis</th>
              <th style={{ minWidth: 190 }}>Peminjam / Penyewa</th>
              <th style={{ minWidth: 200 }}>Keperluan Acara</th>
              <th style={{ width: 85, textAlign: 'center', whiteSpace: 'nowrap' }}>Jumlah</th>
              <th style={{ width: 125, whiteSpace: 'nowrap' }}>Tanggal Dipinjam</th>
              <th style={{ width: 145, whiteSpace: 'nowrap' }}>Tanggal Dikembalikan</th>
              <th style={{ width: 135, textAlign: 'center', whiteSpace: 'nowrap' }}>Kondisi Fisik Saat Kembali</th>
              <th style={{ minWidth: 220 }}>Catatan Petugas</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLoans ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Memuat riwayat pengembalian aset...
                </td>
              </tr>
            ) : filteredHistoryLoans.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  {historyLoans.length === 0
                    ? 'Belum ada riwayat pengembalian aset yang tercatat.'
                    : 'Tidak ada riwayat pengembalian yang sesuai dengan kriteria pencarian / filter tanggal.'}
                </td>
              </tr>
            ) : (
              paginatedHistoryLoans.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 650, fontSize: 13.5, color: '#0f172a' }}>{l.asset_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <code style={{ fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: 4 }}>
                        {l.asset_code}
                      </code>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: l.loan_type === 'SEWA' ? '#fffbeb' : '#f0f9ff',
                        color: l.loan_type === 'SEWA' ? '#92400e' : '#0369a1',
                        border: `1px solid ${l.loan_type === 'SEWA' ? '#fde68a' : '#bae6fd'}`,
                      }}
                    >
                      {l.loan_type}
                    </span>
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
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{l.borrower_phone || l.member_phone}</div>
                    )}
                    {l.approver_name && (
                      <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={11} color="#0284c7" /> Otorisasi: <strong>{l.approver_name}</strong>
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#0f172a' }}>{l.loan_purpose}</td>
                  <td style={{ textAlign: 'center', fontWeight: 650, color: '#047857' }}>
                    {l.quantity_borrowed || 1} Unit
                  </td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#334155' }}>
                    {new Date(l.borrowed_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ fontSize: 12.5, fontWeight: 650, color: '#15803d', whiteSpace: 'nowrap' }}>
                    {l.actual_return_at
                      ? new Date(l.actual_return_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 9px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          (l.condition_on_return || 'GOOD') === 'GOOD'
                            ? '#ecfdf5'
                            : (l.condition_on_return || 'GOOD') === 'FAIR'
                            ? '#fffbeb'
                            : '#fef2f2',
                        color:
                          (l.condition_on_return || 'GOOD') === 'GOOD'
                            ? '#065f46'
                            : (l.condition_on_return || 'GOOD') === 'FAIR'
                            ? '#92400e'
                            : '#991b1b',
                        border: `1px solid ${
                          (l.condition_on_return || 'GOOD') === 'GOOD'
                            ? '#a7f3d0'
                            : (l.condition_on_return || 'GOOD') === 'FAIR'
                            ? '#fde68a'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      {CONDITION_LABEL[l.condition_on_return || 'GOOD'] || l.condition_on_return || 'Baik'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#475569' }}>{l.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pageHistoryLoans}
        totalPages={totalPagesHistoryLoans}
        totalItems={filteredHistoryLoans.length}
        pageSize={pageSizeHistoryLoans}
        onPageChange={setPageHistoryLoans}
        onPageSizeChange={setPageSizeHistoryLoans}
        itemName="riwayat pengembalian"
      />
    </div>
  );
};
