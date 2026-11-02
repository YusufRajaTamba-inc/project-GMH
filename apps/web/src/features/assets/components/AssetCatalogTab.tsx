import React from 'react';
import {
  Package,
  Search,
  Tag,
  MapPin,
  Eye,
  ArrowRightLeft,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { Asset } from '../types';
import { CONDITION_LABEL } from '../types';
import { formatRupiah } from '../../../utils/currency';
import { Pagination } from '../../../components/common/Pagination';

interface AssetCatalogTabProps {
  assets: Asset[];
  filteredAssets: Asset[];
  paginatedAssets: Asset[];
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  filterType: string;
  setFilterType: (s: string) => void;
  filterCondition: string;
  setFilterCondition: (s: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (p: number) => void;
  setPageSize: (s: number) => void;
  openDetailModal: (a: Asset) => void;
  openBorrowModal: (a: Asset) => void;
  openEditModal: (a: Asset) => void;
  handleDeleteAsset: (a: Asset) => void;
}

export const AssetCatalogTab: React.FC<AssetCatalogTabProps> = ({
  assets: _assets,
  filteredAssets,
  paginatedAssets,
  isLoading,
  search,
  setSearch,
  filterType,
  setFilterType,
  filterCondition,
  setFilterCondition,
  currentPage,
  totalPages,
  pageSize,
  setCurrentPage,
  setPageSize,
  openDetailModal,
  openBorrowModal,
  openEditModal,
  handleDeleteAsset,
}) => {
  return (
    <div className="card">
      <div
        className="card-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
      >
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={17} color="var(--gmh-gold)" /> Daftar Barang Inventaris, Ruangan &amp; Alat Musik
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gmh-text-muted)' }} />
            <input
              type="text"
              placeholder="Cari nama, kode, lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
            />
          </div>

          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ fontSize: 12.5, height: 34, width: 170 }}
          >
            <option value="ALL">Semua Tipe Aset</option>
            <option value="SOUND_SYSTEM">Sound System</option>
            <option value="ALAT_MUSIK">Alat Musik &amp; Band</option>
            <option value="RUANGAN">Ruangan &amp; Fasilitas</option>
            <option value="MULTIMEDIA">Multimedia &amp; Layar</option>
            <option value="GENSET_LISTRIK">Genset &amp; Listrik</option>
            <option value="BARANG">Inventaris Umum</option>
          </select>

          <select
            className="form-select"
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            style={{ fontSize: 12.5, height: 34, width: 130 }}
          >
            <option value="ALL">Semua Kondisi</option>
            <option value="GOOD">Kondisi Baik</option>
            <option value="FAIR">Kondisi Cukup</option>
            <option value="DAMAGED">Kondisi Rusak</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 125, whiteSpace: 'nowrap' }}>Kode Aset</th>
              <th style={{ minWidth: 230 }}>Nama Barang &amp; Fasilitas</th>
              <th style={{ width: 175, whiteSpace: 'nowrap' }}>Lokasi Penempatan</th>
              <th style={{ width: 120, textAlign: 'center', whiteSpace: 'nowrap' }}>Stok / Jumlah</th>
              <th style={{ width: 105, textAlign: 'center', whiteSpace: 'nowrap' }}>Kondisi Fisik</th>
              <th style={{ width: 200 }}>Ketentuan Peminjaman / Sewa</th>
              <th style={{ width: 140, textAlign: 'right', whiteSpace: 'nowrap' }}>Nilai Buku</th>
              <th style={{ width: 200, textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Memuat inventaris aset dari API...
                </td>
              </tr>
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                  Tidak ada aset yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              paginatedAssets.map((a) => {
                const isAvailable = (a.available_quantity || 0) > 0;
                const canBorrow = a.is_borrowable && isAvailable;

                return (
                  <tr
                    key={a.id}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={() => openDetailModal(a)}
                    title="Klik untuk melihat detail spesifikasi & riwayat peminjaman aset ini"
                  >
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <code
                        style={{
                          fontSize: 11.5,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '3px 8px',
                          borderRadius: 5,
                          fontWeight: 700,
                          color: '#334155',
                          letterSpacing: 0.2,
                        }}
                      >
                        {a.asset_code}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 650, fontSize: 13.5, color: '#0f172a' }}>
                        {a.asset_name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 10.5,
                            padding: '1px 7px',
                            borderRadius: 99,
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            fontWeight: 500,
                          }}
                        >
                          <Tag size={10} color="#64748b" />
                          {a.category_label || a.asset_type || 'Umum'}
                        </span>
                        {a.notes && (
                          <span
                            style={{
                              fontSize: 11,
                              color: '#64748b',
                              maxWidth: 260,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={a.notes}
                          >
                            • {a.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} color="var(--gmh-brand)" />
                        <span>{a.location_room || 'Rumah Persekutuan'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: isAvailable ? '#15803d' : '#991b1b',
                          }}
                        >
                          {a.available_quantity ?? a.quantity} / {a.quantity || 1} Unit
                        </span>
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: isAvailable ? '#ecfdf5' : '#fef2f2',
                            color: isAvailable ? '#065f46' : '#991b1b',
                            border: `1px solid ${isAvailable ? '#a7f3d0' : '#fecaca'}`,
                            marginTop: 3,
                            fontWeight: 600,
                          }}
                        >
                          {isAvailable ? 'Tersedia' : 'Kosong / Dipinjam'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            a.physical_condition === 'GOOD'
                              ? '#ecfdf5'
                              : a.physical_condition === 'FAIR'
                              ? '#fffbeb'
                              : '#fef2f2',
                          color:
                            a.physical_condition === 'GOOD'
                              ? '#065f46'
                              : a.physical_condition === 'FAIR'
                              ? '#92400e'
                              : '#991b1b',
                          border: `1px solid ${
                            a.physical_condition === 'GOOD'
                              ? '#a7f3d0'
                              : a.physical_condition === 'FAIR'
                              ? '#fde68a'
                              : '#fecaca'
                          }`,
                        }}
                      >
                        {CONDITION_LABEL[a.physical_condition] || a.physical_condition}
                      </span>
                    </td>
                    <td>
                      {a.is_borrowable ? (
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 99,
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            Dapat Dipinjam / Sewa
                          </span>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: '#0f766e',
                              marginTop: 3,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {Number(a.rental_price || 0) > 0 ? (
                              <>Tarif: {formatRupiah(Number(a.rental_price))} / hari</>
                            ) : (
                              <>Bebas Biaya (Pelayanan)</>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Internal Saja (Tidak Dipinjamkan)
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontSize: 13,
                        fontWeight: 650,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatRupiah(Number(a.purchase_price || 0))}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div
                        style={{ display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn btn-outline btn-sm"
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderColor: 'var(--gmh-border-dark)',
                            color: 'var(--gmh-text)',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title="Lihat rincian lengkap & riwayat peminjaman aset"
                          onClick={() => openDetailModal(a)}
                        >
                          <Eye size={12} color="var(--gmh-brand)" /> Detail
                        </button>

                        <button
                          className="btn btn-sm"
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            background: canBorrow ? '#047857' : '#cbd5e1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            cursor: canBorrow ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 600,
                          }}
                          disabled={!canBorrow}
                          title={
                            !a.is_borrowable
                              ? 'Aset bertanda internal saja'
                              : !isAvailable
                              ? 'Seluruh unit sedang digunakan'
                              : 'Ajukan peminjaman atau sewa'
                          }
                          onClick={() => openBorrowModal(a)}
                        >
                          <ArrowRightLeft size={12} /> Pinjam/Sewa
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 7px', borderRadius: 6 }}
                          title="Ubah data aset, jumlah unit, & kondisi"
                          onClick={() => openEditModal(a)}
                        >
                          <Edit2 size={13} color="var(--gmh-green-dark)" />
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 7px', borderColor: '#fca5a5', borderRadius: 6 }}
                          title="Hapus aset dari inventaris"
                          onClick={() => handleDeleteAsset(a)}
                        >
                          <Trash2 size={13} color="#dc2626" />
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAssets.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        itemName="barang aset"
      />
    </div>
  );
};
