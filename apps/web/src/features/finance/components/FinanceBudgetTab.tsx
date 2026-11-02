import React from 'react';
import {
  Plus,
  AlertCircle,
  Calendar,
  Filter,
  Search,
  Lock,
  Unlock,
  PlusCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import type { BudgetCategory } from '../types';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';

interface FinanceBudgetTabProps {
  filteredBudgetList: BudgetCategory[];
  paginatedBudgetList: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
  overBudgetCount: number;
  budgetFilterPeriod: string;
  setBudgetFilterPeriod: (val: string) => void;
  budgetFilterStatus: string;
  setBudgetFilterStatus: (val: string) => void;
  budgetSearch: string;
  setBudgetSearch: (val: string) => void;
  availableBudgetPeriods: Array<{ value: string; label: string }>;
  setShowAddBudget: (val: boolean) => void;
  setTopUpTarget: (b: BudgetCategory) => void;
  setTopUpAmount: (val: number) => void;
  setTopUpReason: (val: string) => void;
  setEditingBudget: (b: any) => void;
  handleToggleCloseBudget: (b: BudgetCategory) => void;
  handleDeleteBudgetCategory: (b: BudgetCategory) => void;
  budgetCurrentPage: number;
  totalBudgetPages: number;
  budgetPageSize: number;
  setBudgetCurrentPage: (page: number) => void;
  setBudgetPageSize: (size: number) => void;
}

export const FinanceBudgetTab: React.FC<FinanceBudgetTabProps> = ({
  filteredBudgetList,
  paginatedBudgetList,
  totalBudget,
  totalSpent,
  overBudgetCount,
  budgetFilterPeriod,
  setBudgetFilterPeriod,
  budgetFilterStatus,
  setBudgetFilterStatus,
  budgetSearch,
  setBudgetSearch,
  availableBudgetPeriods,
  setShowAddBudget,
  setTopUpTarget,
  setTopUpAmount,
  setTopUpReason,
  setEditingBudget,
  handleToggleCloseBudget,
  handleDeleteBudgetCategory,
  budgetCurrentPage,
  totalBudgetPages,
  budgetPageSize,
  setBudgetCurrentPage,
  setBudgetPageSize,
}) => {
  return (
    <div>
      {/* Header & Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
            Kategori Beban &amp; Plafon Anggaran Operasional
          </h3>
          <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, margin: 0 }}>
            Setiap pos anggaran berelasi dengan periode (bulanan/tahunan). Realisasi belanja otomatis terakumulasi dari mutasi Buku Jurnal Kas pada periode terkait.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          id="btn-add-budget"
          onClick={() => setShowAddBudget(true)}
          style={{ fontWeight: 600 }}
        >
          <Plus size={14} /> + Tambah Pos Anggaran
        </button>
      </div>

      {/* Over-Budget / Full Alert Banner */}
      {overBudgetCount > 0 && (
        <div
          className="alert"
          style={{
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            color: '#92400e',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
          }}
        >
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, lineHeight: 1.5 }}>
            <strong>Pagu Anggaran Penuh / Habis:</strong> Terdapat <strong>{overBudgetCount} pos anggaran</strong> yang telah mencapai atau melampaui 100% pagu pada periode yang sedang ditampilkan.
            Jika masa periode belum selesai, klik tombol <strong>+ Top-Up</strong> untuk menambahkan nominal pagu. Jika periode/kegiatan telah selesai, silakan pilih <strong>Tutup Pagu</strong> untuk membekukan alokasi.
          </div>
        </div>
      )}

      {/* Filter Toolbar: Periode Berjalan (Default), Status & Pencarian */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 18,
          background: '#fafafa',
          border: '1px solid var(--gmh-border)',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Periode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="var(--gmh-green)" />
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text-muted)', textTransform: 'uppercase' }}>
                Periode:
              </label>
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 240, fontSize: 12.5, padding: '5px 10px', height: 34 }}
                value={budgetFilterPeriod}
                onChange={(e) => setBudgetFilterPeriod(e.target.value)}
              >
                <option value="CURRENT">⭐ Periode Berjalan (Okt &amp; Thn 2026)</option>
                <option value="2026-10">📅 Bulan Berjalan (Oktober 2026)</option>
                <option value="2026-11">📅 Bulan Depan (November 2026)</option>
                <option value="2026-09">📅 Bulan Lalu (September 2026)</option>
                <option value="2026">📆 Tahun Anggaran 2026 (Tahunan)</option>
                <option value="ALL">🌐 Semua Periode</option>
                {availableBudgetPeriods
                  .filter((p) => !['2026-10', '2026-11', '2026-09', '2026'].includes(p.value))
                  .map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Filter Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} color="var(--gmh-text-muted)" />
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text-muted)', textTransform: 'uppercase' }}>
                Status:
              </label>
              <select
                className="form-input"
                style={{ width: 'auto', minWidth: 150, fontSize: 12.5, padding: '5px 10px', height: 34 }}
                value={budgetFilterStatus}
                onChange={(e) => setBudgetFilterStatus(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">🟢 Aktif (Berjalan)</option>
                <option value="CLOSED">🔒 Ditutup / Selesai</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 220 }}>
              <Search
                size={14}
                color="var(--gmh-text-muted)"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Cari pos anggaran…"
                value={budgetSearch}
                onChange={(e) => setBudgetSearch(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 12.5, height: 34 }}
              />
            </div>
          </div>

          {/* Reset Filter Button if not default */}
          {(budgetFilterPeriod !== 'CURRENT' || budgetFilterStatus !== 'ALL' || budgetSearch) && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setBudgetFilterPeriod('CURRENT');
                setBudgetFilterStatus('ALL');
                setBudgetSearch('');
              }}
              style={{ fontSize: 11.5, padding: '4px 10px', height: 32 }}
              title="Kembalikan ke tampilan default periode berjalan"
            >
              Tampilkan Periode Berjalan
            </button>
          )}
        </div>
      </div>

      {/* Budget Summary Cards (Recalculated according to active filter) */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-label">TOTAL PAGU ANGGARAN OPERASIONAL</div>
          <div className="stat-card-value" style={{ fontSize: 20, color: 'var(--gmh-text)' }}>
            {formatRupiah(totalBudget)}
          </div>
          <div className="stat-card-meta">
            {filteredBudgetList.length} Pos Anggaran (
            {budgetFilterPeriod === 'CURRENT'
              ? 'Periode Berjalan'
              : budgetFilterPeriod === 'ALL'
              ? 'Semua Periode'
              : availableBudgetPeriods.find((p) => p.value === budgetFilterPeriod)?.label || budgetFilterPeriod}
            )
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">TOTAL REALISASI BELANJA</div>
          <div className="stat-card-value" style={{ fontSize: 20, color: '#b91c1c' }}>
            {formatRupiah(totalSpent)}
          </div>
          <div className="stat-card-meta">
            Terpakai:{' '}
            <strong>{totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">SISA SALDO PAGU ANGGARAN</div>
          <div
            className="stat-card-value"
            style={{
              fontSize: 20,
              color: totalBudget - totalSpent >= 0 ? 'var(--gmh-green)' : '#b91c1c',
            }}
          >
            {formatRupiah(totalBudget - totalSpent)}
          </div>
          <div className="stat-card-meta">Dapat Dialokasikan ke Program</div>
        </div>
      </div>

      {/* Budget Table with Pagination */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>KATEGORI BEBAN OPERASIONAL</th>
                <th style={{ minWidth: 160 }}>PERIODE ANGGARAN</th>
                <th style={{ textAlign: 'right' }}>PAGU ANGGARAN</th>
                <th style={{ textAlign: 'right' }}>REALISASI BELANJA</th>
                <th style={{ textAlign: 'right' }}>SISA ANGGARAN</th>
                <th style={{ minWidth: 150 }}>PENYERAPAN</th>
                <th style={{ textAlign: 'center' }}>STATUS</th>
                <th style={{ textAlign: 'center', width: 260, minWidth: 260 }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgetList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--gmh-text-muted)' }}>
                    <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div>Tidak ada pos pagu anggaran yang sesuai kriteria filter.</div>
                    <div style={{ fontSize: 11.5, marginTop: 4 }}>
                      Silakan klik <strong>+ Tambah Pos Anggaran</strong> atau ganti pilihan filter periode.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBudgetList.map((b) => {
                  const percent = b.budget > 0 ? Math.min(100, (b.spent / b.budget) * 100) : 0;
                  const rawPercent = b.budget > 0 ? ((b.spent / b.budget) * 100).toFixed(0) : '0';
                  const remaining = b.budget - b.spent;
                  const isOver = b.spent >= b.budget;
                  const isClosed = b.status === 'CLOSED';
                  const isCurrentPeriod =
                    (b.periodType === 'MONTHLY' && b.period === '2026-10') ||
                    (b.periodType === 'ANNUAL' && b.period === '2026');

                  return (
                    <tr
                      key={b.id || b.category}
                      style={{
                        background: isClosed ? '#f9fafb' : isOver ? '#fff5f5' : undefined,
                        opacity: isClosed ? 0.75 : 1,
                      }}
                    >
                      {/* 1. Kategori & Notes */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{b.category}</span>
                          {isClosed && (
                            <span
                              className="badge"
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                              }}
                            >
                              <Lock size={10} style={{ display: 'inline', marginRight: 2 }} /> Ditutup
                            </span>
                          )}
                        </div>
                        {b.notes && (
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2, maxWidth: 300 }}>
                            {b.notes}
                          </div>
                        )}
                      </td>

                      {/* 2. Periode Anggaran */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: b.periodType === 'ANNUAL' ? '#f5f3ff' : '#eff6ff',
                            color: b.periodType === 'ANNUAL' ? '#6d28d9' : '#1d4ed8',
                            border: `1px solid ${b.periodType === 'ANNUAL' ? '#ddd6fe' : '#bfdbfe'}`,
                            fontSize: 11,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontWeight: 600,
                          }}
                        >
                          <Calendar size={12} />
                          {b.periodName} ({b.periodType === 'ANNUAL' ? 'Tahunan' : 'Bulanan'})
                        </span>
                        {isCurrentPeriod && (
                          <div style={{ fontSize: 10.5, color: 'var(--gmh-green-dark)', marginTop: 3, fontWeight: 600 }}>
                            ● Periode Berjalan
                          </div>
                        )}
                      </td>

                      {/* 3. Pagu Anggaran */}
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(b.budget)}</td>

                      {/* 4. Realisasi Belanja */}
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                        <div>{formatRupiah(b.spent)}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', marginTop: 1 }}>
                          {b.trxCount} mutasi tercatat
                        </div>
                      </td>

                      {/* 5. Sisa Anggaran */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 600,
                          color: remaining >= 0 ? '#059669' : '#b91c1c',
                        }}
                      >
                        {formatRupiah(remaining)}
                      </td>

                      {/* 6. Penyerapan */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              background: '#e5e7eb',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: isClosed
                                  ? '#9ca3af'
                                  : isOver
                                  ? '#ef4444'
                                  : percent > 80
                                  ? '#f59e0b'
                                  : 'var(--gmh-green)',
                                borderRadius: 4,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 600, minWidth: 40 }}>
                            {rawPercent}%
                          </span>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td style={{ textAlign: 'center' }}>
                        {isClosed ? (
                          <span
                            className="badge"
                            style={{
                              background: '#f3f4f6',
                              color: '#4b5563',
                              border: '1px solid #d1d5db',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Ditutup
                          </span>
                        ) : isOver ? (
                          <span
                            className="badge"
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Penuh (100%+)
                          </span>
                        ) : percent > 80 ? (
                          <span
                            className="badge"
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Waspada
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Aman
                          </span>
                        )}
                      </td>

                      {/* 8. Aksi */}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            flexWrap: 'nowrap',
                          }}
                        >
                          {/* Tombol Top-Up (Tambahkan Nominal) */}
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              padding: '4px 9px',
                              fontSize: 11.5,
                              height: 28,
                              color: '#065f46',
                              borderColor: '#a7f3d0',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setTopUpTarget(b);
                              setTopUpAmount(0);
                              setTopUpReason('');
                            }}
                            title="Top-Up: Tambahkan nominal pagu anggaran jika alokasi kurang"
                          >
                            <PlusCircle size={13} />
                            <span>Top-Up</span>
                          </button>

                          {/* Tombol Ubah Pagu */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '4px 9px',
                              fontSize: 11.5,
                              height: 28,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                              color: '#334155',
                              borderColor: '#cbd5e1',
                              background: '#ffffff',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              let m = '10';
                              let y = '2026';
                              if (b.periodType === 'MONTHLY' && b.period.includes('-')) {
                                const parts = b.period.split('-');
                                y = parts[0];
                                m = parts[1];
                              } else if (b.periodType === 'ANNUAL') {
                                y = b.period;
                              }
                              setEditingBudget({
                                id: b.id,
                                category: b.category,
                                budget: b.budget,
                                periodType: b.periodType,
                                month: m,
                                year: y,
                                status: b.status,
                                notes: b.notes || '',
                              });
                            }}
                            title="Ubah detail pos anggaran"
                          >
                            <Edit size={12} />
                            <span>Ubah</span>
                          </button>

                          {/* Tombol Tutup / Buka Pagu */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '4px 9px',
                              fontSize: 11.5,
                              height: 28,
                              color: isClosed ? '#059669' : '#b45309',
                              borderColor: isClosed ? '#a7f3d0' : '#fde68a',
                              background: isClosed ? '#f0fdf4' : '#fffbeb',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleCloseBudget(b)}
                            title={isClosed ? 'Buka kembali pos anggaran ini' : 'Tutup pagu anggaran ini (bekukan pengeluaran)'}
                          >
                            {isClosed ? (
                              <>
                                <Unlock size={12} />
                                <span>Buka</span>
                              </>
                            ) : (
                              <>
                                <Lock size={12} />
                                <span>Tutup</span>
                              </>
                            )}
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: 11.5,
                              height: 28,
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              background: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDeleteBudgetCategory(b)}
                            title="Hapus kategori anggaran"
                          >
                            <Trash2 size={13} />
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

        {/* Pagination Component for Budget Table */}
        <Pagination
          currentPage={budgetCurrentPage}
          totalPages={totalBudgetPages}
          totalItems={filteredBudgetList.length}
          pageSize={budgetPageSize}
          pageSizeOptions={[5, 8, 15, 25]}
          onPageChange={setBudgetCurrentPage}
          onPageSizeChange={setBudgetPageSize}
          itemName="pos anggaran"
        />
      </div>
    </div>
  );
};
