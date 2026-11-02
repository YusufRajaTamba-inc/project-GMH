import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Landmark,
  ArrowDownRight,
  Search,
  AlertCircle,
} from 'lucide-react';
import type { FinancialTransaction } from '../../../state/FinanceStoreContext';
import { MONTH_NAMES_MAP } from '../types';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';

interface FinanceJournalTabProps {
  periodKey: string;
  setPeriodKey: (key: string) => void;
  activePeriod: any;
  currentMonthKey: string;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  distinctTransactionPeriods: string[];
  periodTransactions: FinancialTransaction[];
  displayed: FinancialTransaction[];
  paginatedTransactions: FinancialTransaction[];
  opBalance: number;
  buildingBalance: number;
  bankBalance: number;
  periodStats: {
    totalIn: number;
    totalOut: number;
    net: number;
    bldIn: number;
  };
  search: string;
  setSearch: (s: string) => void;
  filterFlow: string;
  setFilterFlow: (f: string) => void;
  filterCategory: string;
  setFilterCategory: (c: string) => void;
  allCategories: string[];
  setEditingTrx: (t: FinancialTransaction) => void;
  handleDeleteTransaction: (t: FinancialTransaction) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (p: number) => void;
  setPageSize: (s: number) => void;
}

export const FinanceJournalTab: React.FC<FinanceJournalTabProps> = ({
  periodKey,
  setPeriodKey,
  activePeriod,
  currentMonthKey,
  handlePrevMonth,
  handleNextMonth,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  distinctTransactionPeriods,
  periodTransactions,
  displayed,
  paginatedTransactions,
  opBalance,
  buildingBalance,
  bankBalance,
  periodStats,
  search,
  setSearch,
  filterFlow,
  setFilterFlow,
  filterCategory,
  setFilterCategory,
  allCategories,
  setEditingTrx,
  handleDeleteTransaction,
  currentPage,
  totalPages,
  pageSize,
  setCurrentPage,
  setPageSize,
}) => {
  return (
    <>
      {/* INTEGRATED CASH PERIOD CONTROLLER */}
      <div
        style={{
          padding: '12px 18px',
          marginBottom: 16,
          background: '#ffffff',
          border: '1px solid var(--gmh-border)',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Left: Label & Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={18} color="var(--gmh-text-muted)" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gmh-text)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                PERIODE KAS:
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ width: 30, height: 32, padding: 0, borderRadius: 6 }}
                onClick={handlePrevMonth}
                title="Mundur 1 Periode"
              >
                <ChevronLeft size={15} />
              </button>

              <select
                className="form-select"
                style={{
                  width: 'auto',
                  minWidth: 260,
                  height: 32,
                  padding: '4px 28px 4px 10px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  color: 'var(--gmh-text)',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                }}
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
              >
                <optgroup label="Bulan Kalender">
                  {distinctTransactionPeriods.map((ym) => {
                    const [yr, mo] = ym.split('-');
                    const moName = MONTH_NAMES_MAP[mo] || mo;
                    const isCurrent = ym === currentMonthKey;
                    return (
                      <option key={ym} value={ym}>
                        {moName} {yr} {isCurrent ? '(Bulan Berjalan)' : ''}
                      </option>
                    );
                  })}
                </optgroup>

                <optgroup label="Siklus Cut-Off Kas (Tgl 16 - 15)">
                  {periodKey.startsWith('CYCLE:') &&
                    !['CYCLE:2026-10', 'CYCLE:2026-09', 'CYCLE:2026-08', 'CYCLE:2026-07', 'CYCLE:2026-06'].includes(periodKey) && (
                      <option value={periodKey}>🔄 {activePeriod.label}</option>
                    )}
                  <option value="CYCLE:2026-10">🔄 Siklus 16 Okt – 15 Nov 2026</option>
                  <option value="CYCLE:2026-09">🔄 Siklus 16 Sep – 15 Okt 2026</option>
                  <option value="CYCLE:2026-08">🔄 Siklus 16 Agu – 15 Sep 2026</option>
                  <option value="CYCLE:2026-07">🔄 Siklus 16 Jul – 15 Agu 2026</option>
                  <option value="CYCLE:2026-06">🔄 Siklus 16 Jun – 15 Jul 2026</option>
                </optgroup>

                <optgroup label="Tahun Anggaran">
                  <option value="YEAR:2026">📆 Tahun Anggaran 2026 (Tahunan)</option>
                  <option value="YEAR:2025">📆 Tahun Anggaran 2025</option>
                </optgroup>

                <optgroup label="Lainnya">
                  <option value="ALL">🌐 Semua Periode (Akumulasi Seluruh Mutasi)</option>
                  <option value="CUSTOM">🎯 Rentang Tanggal Manual...</option>
                </optgroup>
              </select>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ width: 30, height: 32, padding: 0, borderRadius: 6 }}
                onClick={handleNextMonth}
                title="Maju 1 Periode"
              >
                <ChevronRight size={15} />
              </button>

              {periodKey !== currentMonthKey && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, padding: '4px 8px' }}
                  onClick={() => setPeriodKey(currentMonthKey)}
                  title={`Kembali ke bulan berjalan (${MONTH_NAMES_MAP[currentMonthKey.split('-')[1]] || 'Oktober'} ${currentMonthKey.split('-')[0]})`}
                >
                  ↺ Bulan Berjalan
                </button>
              )}
            </div>
          </div>

          {/* Right: Active Date Range Pill & Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid var(--gmh-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Calendar size={13} />
              Rentang: {activePeriod.dateRangeText}
            </span>

            <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
              {periodTransactions.length} Mutasi Tercatat
            </span>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM selected */}
        {periodKey === 'CUSTOM' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px dashed var(--gmh-border)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Filter Rentang Tanggal Manual:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Dari:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '4px 8px', fontSize: 12, height: 30 }}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Sampai:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '4px 8px', fontSize: 12, height: 30 }}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: '#dc2626', padding: '2px 6px' }}
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Reset Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* TOP BALANCES GRID */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {/* Kas Operasional */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-green)',
              '--stat-color-pale': 'var(--gmh-green-pale)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">SALDO KAS OPERASIONAL (KANTOR)</div>
            <Wallet size={18} color="var(--gmh-text-muted)" />
          </div>
          <div
            className="stat-card-value"
            style={{
              fontSize: 22,
              color: 'var(--gmh-text)',
            }}
          >
            {formatRupiah(opBalance)}
          </div>
          <div className="stat-card-meta">
            Pemasukan Kas Periode Ini:{' '}
            <strong>
              {formatRupiah(periodStats.totalIn)}
            </strong>
            {periodStats.bldIn > 0 && (
              <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginLeft: 4 }}>
                ({formatRupiah(periodStats.bldIn)} Pembangunan)
              </span>
            )}
          </div>
        </div>

        {/* Belanja Kantor */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-text-muted)',
              '--stat-color-pale': 'var(--gmh-surface-2)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">TOTAL BELANJA ({activePeriod.shortLabel.toUpperCase()})</div>
            <div className="stat-card-icon">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {formatRupiah(periodStats.totalOut)}
          </div>
          <div className="stat-card-meta">
            Arus Kas Bersih:{' '}
            <strong>
              {periodStats.net >= 0 ? '+' : ''}{formatRupiah(periodStats.net)}
            </strong>
          </div>
        </div>

        {/* Kas Pembangunan & Bank */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-text-muted)',
              '--stat-color-pale': 'var(--gmh-surface-2)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">KAS PEMBANGUNAN &amp; BANK</div>
            <Landmark size={18} color="var(--gmh-text-muted)" />
          </div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {formatRupiah(buildingBalance + bankBalance)}
          </div>
          <div className="stat-card-meta">
            Khusus Pembangunan: <strong>{formatRupiah(buildingBalance)}</strong>
            {periodStats.bldIn > 0 && (
              <span style={{ marginLeft: 6, fontWeight: 600 }}>
                (+{formatRupiah(periodStats.bldIn)} periode ini)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ padding: '12px 18px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 280 }}>
            <Search className="search-box-icon" />
            <input
              className="form-input"
              id="search-transactions"
              placeholder="Cari deskripsi transaksi, nomor referensi, atau pihak relasi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 160 }}
            id="filter-flow"
            value={filterFlow}
            onChange={(e) => setFilterFlow(e.target.value)}
          >
            <option value="">Semua Aliran Kas</option>
            <option value="CREDIT">Pemasukan Kas (+)</option>
            <option value="DEBIT">Pengeluaran Kas (-)</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 180 }}
            id="filter-category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ACTIVE PERIOD INFO & FILTER BADGES */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--gmh-border)',
          marginBottom: 14,
          fontSize: 12.5,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Calendar size={15} color="var(--gmh-green-mid)" />
          <span>
            Jurnal Mutasi Kas Periode: <strong>{activePeriod.label}</strong>{' '}
            <span style={{ color: '#64748b' }}>({activePeriod.dateRangeText})</span>
          </span>
          {filterFlow && (
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
              Aliran: {filterFlow === 'CREDIT' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
            </span>
          )}
          {filterCategory && (
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
              Kategori: {filterCategory}
            </span>
          )}
        </div>
        <div style={{ fontWeight: 600, color: 'var(--gmh-text-muted)', fontSize: 12 }}>
          Menampilkan {displayed.length} dari {periodTransactions.length} Mutasi Periode Ini
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>KODE REF / TANGGAL</th>
                <th style={{ minWidth: 140 }}>KATEGORI AKUN</th>
                <th style={{ minWidth: 260 }}>DESKRIPSI MUTASI</th>
                <th style={{ minWidth: 140 }}>SUMBER / PIHAK RELASI</th>
                <th style={{ minWidth: 130, textAlign: 'right' }}>NOMINAL</th>
                <th style={{ minWidth: 90, textAlign: 'center' }}>STATUS</th>
                <th style={{ minWidth: 110, textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gmh-text-muted)' }}>
                    <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div>Tidak ada transaksi mutasi kas yang sesuai dengan kriteria pencarian.</div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const isCredit = t.type === 'CREDIT';
                  return (
                    <tr key={t.id}>
                      {/* 1. KODE REF / TANGGAL */}
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            fontFamily: 'monospace',
                            color: 'var(--gmh-text)',
                          }}
                        >
                          {t.code}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                          {t.date}
                        </div>
                      </td>

                      {/* 2. KATEGORI AKUN */}
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--gmh-text)' }}>
                          {t.category}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {t.account === 'KAS_PEMBANGUNAN'
                              ? 'Kas Pembangunan'
                              : t.account === 'KAS_BANK'
                              ? 'Kas Bank'
                              : 'Kas Operasional'}
                          </span>
                        </div>
                      </td>

                      {/* 3. DESKRIPSI MUTASI */}
                      <td>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: '#1f2937',
                            lineHeight: 1.45,
                            maxWidth: 420,
                          }}
                        >
                          {t.desc}
                        </div>
                        {t.notes && t.notes !== t.desc && (
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                            Catatan: {t.notes}
                          </div>
                        )}
                      </td>

                      {/* 4. SUMBER / PIHAK RELASI */}
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--gmh-text)' }}>
                          {t.party || 'Pihak Relasi'}
                        </div>
                      </td>

                      {/* 5. NOMINAL */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: 'var(--gmh-text)',
                          }}
                        >
                          {isCredit ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                        </span>
                      </td>

                      {/* 6. STATUS */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            background: t.status === 'Approved' ? '#ecfdf5' : '#fffbeb',
                            color: t.status === 'Approved' ? '#166534' : '#92400e',
                            border: `1px solid ${t.status === 'Approved' ? '#bbf7d0' : '#fde68a'}`,
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontWeight: 600,
                          }}
                        >
                          {t.status || 'Approved'}
                        </span>
                      </td>

                      {/* 7. AKSI */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }}
                            onClick={() => setEditingTrx({ ...t })}
                            title="Edit transaksi"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: 11.5,
                              height: 'auto',
                            }}
                            onClick={() => handleDeleteTransaction(t)}
                            title="Hapus transaksi"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayed.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="transaksi"
        />
      </div>
    </>
  );
};
