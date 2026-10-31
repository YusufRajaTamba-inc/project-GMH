import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, RefreshCw, X, Save, CheckCircle, Tag, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import NominalInput from '../../components/NominalInput';
import { formatRupiah } from '../../utils/currency';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';

interface Asset {
  id: string;
  asset_code: string;
  asset_name: string;
  category_id?: string;
  category_label?: string;
  purchase_date?: string;
  purchase_price: string | number;
  physical_condition: 'GOOD' | 'FAIR' | 'DAMAGED';
  location_room?: string;
  is_borrowable: boolean;
}

const CONDITION_BADGE: Record<string, string> = {
  GOOD: 'badge-success',
  FAIR: 'badge-warning',
  DAMAGED: 'badge-danger',
};

const CONDITION_LABEL: Record<string, string> = {
  GOOD: 'Baik',
  FAIR: 'Cukup',
  DAMAGED: 'Rusak',
};

const AssetsPage: React.FC = () => {
  const { lookups, rawLookups, fieldLabels } = useDynamicConfig();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dynamic asset category options derived from system_lookups
  const categoryOptions = useMemo(() => {
    const fromRaw = rawLookups['ASSET_CATEGORY'] || rawLookups['assetCategories'] || [];
    if (fromRaw.length > 0) {
      return fromRaw.map((item: any) => ({
        id: item.id || item.code,
        label: item.label || item.code,
        code: item.code,
      }));
    }
    return (lookups.assetCategories || []).map((label, idx) => ({
      id: `CAT-${idx}`,
      label,
      code: `CAT_${idx}`,
    }));
  }, [rawLookups, lookups.assetCategories]);

  // Form State
  const [name, setName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [condition, setCondition] = useState<'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [room, setRoom] = useState('Rumah Persekutuan GMH');
  const [borrowable, setBorrowable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default category when options arrive
  useEffect(() => {
    if (categoryOptions.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categoryOptions[0].id);
    }
  }, [categoryOptions, selectedCategoryId]);

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedAssets,
  } = usePagination(assets, { initialPageSize: 10 });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const assetRes = await api.assets.getAll();
      if (assetRes) {
        setAssets(assetRes.assets || assetRes.data || []);
      }
    } catch (err: any) {
      showToast('Gagal memuat inventaris aset: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama aset wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.assets.create({
        assetName: name.trim(),
        categoryId: selectedCategoryId || null,
        purchasePrice: price,
        physicalCondition: condition,
        locationRoom: room.trim(),
        isBorrowable: borrowable,
      });

      showToast(`Aset baru "${name.trim()}" berhasil didaftarkan ke API!`);
      setShowAddModal(false);
      setName('');
      setPrice(0);
      setRoom('Rumah Persekutuan GMH');
      setCondition('GOOD');
      await loadData();
    } catch (err: any) {
      alert('Gagal menyimpan aset: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Inventaris Sarana & Fasilitas Rumah Persekutuan</h2>
          <p>Katalog perlengkapan sarana doa, sound system, IT, dan aset yayasan di Rumah Persekutuan GMH PA KMK</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Tambah Aset Barang
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary Stat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Unit Aset Terdaftar</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gmh-green-dark)', marginTop: 4 }}>
            {assets.length} Barang
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nilai Total Buku Aset</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gmh-gold)', marginTop: 4 }}>
            {formatRupiah(totalAssetValue)}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={17} color="var(--gmh-gold)" /> Daftar Barang Inventaris Yayasan (Database API)
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kode Aset</th>
                <th>Nama Barang & Fasilitas</th>
                <th>Kategori Master</th>
                <th>Lokasi Penempatan</th>
                <th>Nilai Perolehan</th>
                <th>Kondisi Fisik</th>
                <th>Peminjaman</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Memuat inventaris aset dari API...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Belum ada barang inventaris tercatat di database.
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--gmh-border-pale)', padding: '2px 6px', borderRadius: 4 }}>
                        {a.asset_code}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 13.5 }}>{a.asset_name}</td>
                    <td>
                      <span className="badge badge-neutral">
                        <Tag size={11} style={{ marginRight: 4 }} />
                        {a.category_label || 'Inventaris Umum'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="var(--gmh-gold)" />
                        {a.location_room || 'Rumah Persekutuan'}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>
                      {formatRupiah(Number(a.purchase_price || 0))}
                    </td>
                    <td>
                      <span className={`badge ${CONDITION_BADGE[a.physical_condition] || 'badge-neutral'}`}>
                        {CONDITION_LABEL[a.physical_condition] || a.physical_condition}
                      </span>
                    </td>
                    <td>
                      {a.is_borrowable ? (
                        <span className="badge badge-success" style={{ fontSize: 11 }}>Dapat Dipinjam</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>Internal Saja</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={assets.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="barang aset"
        />
      </div>

      {/* Modal Add Asset */}
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
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <div className="card-header">
              <div className="card-title">Daftarkan Aset Barang Baru</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveAsset}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">
                    {fieldLabels['asset.name'] || 'Nama Barang / Peralatan'} <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sound System Yamaha StagePas 600BT"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">{fieldLabels['asset.category'] || 'Kategori Inventaris'}</label>
                    <select
                      className="form-select"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">{fieldLabels['asset.condition'] || 'Kondisi Fisik'}</label>
                    <select
                      className="form-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                    >
                      <option value="GOOD">Baik</option>
                      <option value="FAIR">Cukup</option>
                      <option value="DAMAGED">Rusak</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">{fieldLabels['asset.price'] || 'Nilai Perolehan / Taksiran (Rp)'}</label>
                  <NominalInput value={price} onChange={setPrice} />
                </div>

                <div>
                  <label className="form-label">{fieldLabels['asset.location'] || 'Lokasi Penempatan Ruangan'}</label>
                  <input
                    type="text"
                    placeholder="Contoh: Aula Utama Lt. 1 / Ruang Doa"
                    list="asset-locations-datalist"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="form-input"
                  />
                  <datalist id="asset-locations-datalist">
                    {(lookups.assetLocations || [
                      'Aula Utama Lt. 1 GMH',
                      'Ruang Doa & Konseling Lt. 2',
                      'Sekretariat Yayasan',
                      'Gudang Sarana & Logistik',
                    ]).map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="borrowable"
                    checked={borrowable}
                    onChange={(e) => setBorrowable(e.target.checked)}
                  />
                  <label htmlFor="borrowable" style={{ fontSize: 13, cursor: 'pointer' }}>
                    Dapat dipinjamkan untuk kegiatan persekutuan mahasiswa/alumni
                  </label>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Aset ke API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
