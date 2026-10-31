import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, RefreshCw, Plus, X, Save, Clock, Phone } from 'lucide-react';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';

interface PrayerRequest {
  id: string;
  sender_name: string;
  sender_phone?: string;
  sender_email?: string;
  is_anonymous: boolean;
  prayer_content: string;
  status: 'NEW' | 'PRAYING' | 'ANSWERED' | 'ARCHIVED';
  counselor_notes?: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, string> = {
  NEW: 'badge-warning',
  PRAYING: 'badge-info',
  ANSWERED: 'badge-success',
  ARCHIVED: 'badge-neutral',
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Permohonan Baru',
  PRAYING: 'Sedang Didoakan',
  ANSWERED: 'Doa Terjawab',
  ARCHIVED: 'Arsip',
};

const PrayerPage: React.FC = () => {
  const { lookups, fieldLabels } = useDynamicConfig();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<'PENDING' | 'PRAYING' | 'ALL'>('PENDING');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State for new prayer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [category, setCategory] = useState(lookups.prayerCategories?.[0] || 'Kesehatan & Kesembuhan');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lookups.prayerCategories?.length > 0 && !category) {
      setCategory(lookups.prayerCategories[0]);
    }
  }, [lookups.prayerCategories, category]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchPrayers = async () => {
    setIsLoading(true);
    try {
      const res = await api.prayer.getAll();
      if (res) {
        setPrayers(res.prayers || res.data || []);
      }
    } catch (err: any) {
      showToast('Gagal memuat pokok doa: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.prayer.updateStatus(id, { status: newStatus });
      showToast(`Status pokok doa diperbarui menjadi "${STATUS_LABEL[newStatus] || newStatus}"!`);
      await fetchPrayers();
    } catch (err: any) {
      alert('Gagal mengubah status doa: ' + err.message);
    }
  };

  const handleCreatePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Isi pokok doa wajib ditulis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalContent = category ? `[${category}] ${content.trim()}` : content.trim();
      await api.prayer.publicSubmit({
        senderName: isAnon ? 'Hamba Tuhan (Anonim)' : name.trim(),
        senderPhone: phone.trim() || undefined,
        isAnonymous: isAnon,
        prayerContent: finalContent,
      });

      showToast('Permohonan doa berhasil dikirim dan tersimpan di database!');
      setShowAddModal(false);
      setName('');
      setPhone('');
      setContent('');
      setIsAnon(false);
      await fetchPrayers();
    } catch (err: any) {
      alert('Gagal mengirim doa: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = prayers.filter((p) => p.status === 'NEW').length;
  const prayingCount = prayers.filter((p) => p.status === 'PRAYING').length;

  const displayedPrayers = prayers.filter((p) => {
    if (tab === 'PENDING') return p.status === 'NEW';
    if (tab === 'PRAYING') return p.status === 'PRAYING';
    return true;
  });

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedPrayers,
  } = usePagination(displayedPrayers, { initialPageSize: 10 });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Permohonan Pokok Doa</h2>
          <p>Kelola dan doakan permohonan doa dari alumni, mahasiswa, pekabar Injil, dan jemaat GMH PA KMK</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchPrayers}
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
            <Plus size={14} /> Ajukan Pokok Doa
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab-btn ${tab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setTab('PENDING')}
        >
          Perlu Ditangani ({pendingCount})
        </button>
        <button
          className={`tab-btn ${tab === 'PRAYING' ? 'active' : ''}`}
          onClick={() => setTab('PRAYING')}
        >
          Sedang Didoakan ({prayingCount})
        </button>
        <button
          className={`tab-btn ${tab === 'ALL' ? 'active' : ''}`}
          onClick={() => setTab('ALL')}
        >
          Semua Permohonan ({prayers.length})
        </button>
      </div>

      {/* Prayer Request Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {isLoading ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
              Memuat permohonan doa dari API...
            </div>
          </div>
        ) : displayedPrayers.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
              Tidak ada pokok doa pada kategori ini.
            </div>
          </div>
        ) : (
          paginatedPrayers.map((p) => {
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-';

            return (
              <div key={p.id} className="card">
                <div className="card-body" style={{ padding: '18px 24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--gmh-green-dark)' }}>
                          {p.is_anonymous ? 'Hamba Tuhan (Anonim)' : p.sender_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--gmh-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 2,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {dateStr}
                          </span>
                          {p.sender_phone && !p.is_anonymous && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={11} /> {p.sender_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge ${STATUS_BADGE[p.status] || 'badge-neutral'}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--gmh-text)',
                      lineHeight: 1.6,
                      marginBottom: 16,
                      background: 'var(--gmh-card-bg)',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--gmh-border)',
                      fontStyle: 'italic',
                    }}
                  >
                    "{p.prayer_content}"
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.status !== 'PRAYING' && p.status !== 'ANSWERED' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleUpdateStatus(p.id, 'PRAYING')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Heart size={13} color="var(--gmh-danger)" /> Tandai Sedang Didoakan
                      </button>
                    )}

                    {p.status !== 'ANSWERED' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateStatus(p.id, 'ANSWERED')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <CheckCircle size={13} /> Tandai Sudah Terjawab
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayedPrayers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="pokok doa"
        />
      </div>

      {/* Modal Add Prayer */}
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
              <div className="card-title">Ajukan Pokok Doa Baru</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreatePrayer}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="is-anon"
                    checked={isAnon}
                    onChange={(e) => setIsAnon(e.target.checked)}
                  />
                  <label htmlFor="is-anon" style={{ fontSize: 13, cursor: 'pointer' }}>
                    Kirim secara anonim (Nama disamarkan)
                  </label>
                </div>

                {!isAnon && (
                  <>
                    <div>
                      <label className="form-label">
                        {fieldLabels['prayer.senderName'] || 'Nama Pengirim'} <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nama lengkap Anda"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-input"
                        required={!isAnon}
                      />
                    </div>

                    <div>
                      <label className="form-label">{fieldLabels['prayer.phone'] || 'Nomor WhatsApp / HP (Opsional)'}</label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="form-label">{fieldLabels['prayer.category'] || 'Kategori Pokok Doa'}</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {(lookups.prayerCategories || [
                      'Kesehatan & Kesembuhan',
                      'Pelayanan Misi & Pekabar Injil',
                      'Studi & Pekerjaan Alumni',
                      'Keluarga & Pernikahan',
                      'Pembangunan Rumah Persekutuan',
                      'Pertumbuhan Rohani & KTB',
                      'Ucapan Syukur',
                    ]).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    {fieldLabels['prayer.content'] || 'Isi Permohonan Pokok Doa'} <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan pergumulan, doa pemulihan kesehatan, pekerjaan, keluarga, atau studi yang ingin didoakan..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea"
                    required
                  />
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
                  <Save size={14} /> {isSubmitting ? 'Mengirim...' : 'Kirim Pokok Doa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerPage;
