import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Share2,
  Copy,
  Check,
  MessageSquare,
  X,
  RefreshCw,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import type { Registration } from '../../state/MemberStoreContext';
import { useAuth } from '../../state/AuthContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

const RegistrationsPage: React.FC = () => {
  const { user } = useAuth();
  const { registrations, approveRegistration, rejectRegistration, isLoading, refreshFromApi } = useMemberStore();
  const { fieldLabels, lookups } = useDynamicConfig();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN_OPERASIONAL'].includes(user.role);

  const pendingList = useMemo(() => registrations.filter((r) => r.status === 'PENDING'), [registrations]);

  // Dropdown options
  const availableFaculties = useMemo(() => {
    const set = new Set<string>();
    lookups.faculties?.forEach((f) => set.add(f));
    registrations.forEach((r) => r.faculty && set.add(r.faculty));
    return Array.from(set).sort();
  }, [lookups.faculties, registrations]);

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    registrations.forEach((r) => r.entryYear && set.add(Number(r.entryYear)));
    return Array.from(set).sort((a, b) => b - a);
  }, [registrations]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    lookups.alumniRegions?.forEach((c: string) => set.add(c));
    registrations.forEach((r) => r.city && set.add(r.city));
    return Array.from(set).sort();
  }, [lookups.alumniRegions, registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    const baseList = activeTab === 'PENDING' ? pendingList : registrations;

    return baseList.filter((r) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = r.name?.toLowerCase().includes(q);
        const matchTicket = r.ticket?.toLowerCase().includes(q);
        const matchEmail = r.email?.toLowerCase().includes(q);
        const matchWa = r.wa?.toLowerCase().includes(q);
        const matchFaculty = r.faculty?.toLowerCase().includes(q);
        const matchMajor = r.major?.toLowerCase().includes(q);
        const matchCity = r.city?.toLowerCase().includes(q);
        const matchNik = r.nik?.toLowerCase().includes(q);
        if (!matchName && !matchTicket && !matchEmail && !matchWa && !matchFaculty && !matchMajor && !matchCity && !matchNik) {
          return false;
        }
      }

      // 2. Status Filter (only on ALL tab)
      if (activeTab === 'ALL' && filterStatus) {
        if (r.status !== filterStatus) return false;
      }

      // 3. Faculty Filter
      if (filterFaculty && r.faculty !== filterFaculty) {
        return false;
      }

      // 4. Entry Year Filter
      if (filterYear && String(r.entryYear) !== filterYear) {
        return false;
      }

      // 5. City Filter
      if (filterCity && r.city !== filterCity) {
        return false;
      }

      return true;
    });
  }, [registrations, pendingList, activeTab, searchQuery, filterStatus, filterFaculty, filterYear, filterCity]);

  // Active filter count
  const activeFilterCount =
    (activeTab === 'ALL' && filterStatus ? 1 : 0) +
    (filterFaculty ? 1 : 0) +
    (filterYear ? 1 : 0) +
    (filterCity ? 1 : 0);

  // Table pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedRegistrations,
  } = usePagination(filteredRegistrations, { initialPageSize: 10 });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('');
    setFilterFaculty('');
    setFilterYear('');
    setFilterCity('');
    setCurrentPage(1);
  };

  const handleApprove = (reg: Registration) => {
    const createdMember = approveRegistration(reg.id);
    if (createdMember) {
      showToast(
        `Pendaftaran ${reg.name} disetujui! NIA resmi diterbitkan: ${createdMember.nia}`
      );
      if (selectedReg?.id === reg.id) {
        setSelectedReg(null);
      }
    }
  };

  const handleConfirmReject = (regId: string) => {
    rejectRegistration(regId, rejectReasonInput || 'Data tidak memenuhi syarat.');
    setShowRejectModal(null);
    setRejectReasonInput('');
    showToast('Pendaftaran telah ditolak dan notifikasi perbaikan disiapkan.');
    if (selectedReg?.id === regId) {
      setSelectedReg(null);
    }
  };

  // Public Form URL
  const publicFormUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register`
    : 'https://gmhpakmk.org/register';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicFormUrl);
      setIsCopied(true);
      showToast('Tautan formulir pendaftaran berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showToast('Gagal menyalin tautan. Silakan salin manual.');
    }
  };

  const handleShareWhatsApp = () => {
    const message = `Shalom & Salam Sejahtera rekan-rekan Alumni dan Mahasiswa PA KMK USU.\n\nMari mengisi formulir pendaftaran anggota Yayasan Global Mission House secara mandiri melalui tautan resmi berikut:\n${publicFormUrl}\n\nData yang diisi akan diverifikasi oleh pengurus yayasan untuk penerbitan Nomor Induk Anggota (NIA) resmi. Terima kasih atas partisipasi rekan-rekan!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromApi();
      showToast('Data pendaftaran berhasil diperbarui dari API database!');
    } catch (err: any) {
      showToast('Gagal menyegarkan data: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Verifikasi Pendaftaran Anggota & Alumni</h2>
          <p>
            Tinjau, setujui, dan terbitkan Nomor Induk Anggota (NIA) dari formulir pendaftaran mandiri publik
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            id="btn-refresh-reg"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isRefreshing || isLoading ? 'spin' : ''} />
            {isRefreshing ? 'Menyegarkan...' : 'Segarkan'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            id="btn-share-public-form"
            onClick={() => setShowShareModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <Share2 size={15} /> Bagikan Form Publik
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Alert pending count */}
      {pendingList.length > 0 ? (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <Clock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>{pendingList.length} pendaftaran mandiri</strong> sedang menunggu verifikasi Anda untuk diterbitkan Kartu Anggota & NIA.
          </span>
        </div>
      ) : (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Semua antrean pendaftaran telah selesai diverifikasi oleh pengurus yayasan.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('PENDING');
            setCurrentPage(1);
          }}
        >
          Menunggu Verifikasi ({pendingList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('ALL');
            setCurrentPage(1);
          }}
        >
          Semua Riwayat ({registrations.length})
        </button>
      </div>

      <div className="card">
        {/* Search & Filter Toolbar */}
        <div
          className="card-header"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, minWidth: 280, maxWidth: 520 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder={
                  activeTab === 'PENDING'
                    ? 'Cari nama, no. tiket, stambuk, WhatsApp di antrean menunggu...'
                    : 'Cari nama, no. tiket, stambuk, email di semua riwayat...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ paddingLeft: 34, paddingRight: searchQuery ? 32 : 12, fontSize: 13, height: 38 }}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--gmh-text-muted)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--gmh-text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              className={`btn btn-sm ${activeFilterCount > 0 ? 'btn-primary' : 'btn-outline'}`}
              id="btn-filter-reg"
              onClick={() => setShowFilterModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, whiteSpace: 'nowrap' }}
            >
              <SlidersHorizontal size={14} />
              <span>Filter Data</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: activeFilterCount > 0 ? '#fff' : 'var(--gmh-green)',
                    color: 'var(--gmh-green-dark)',
                    borderRadius: 99,
                    padding: '1px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--gmh-text-muted)' }}>
            Menampilkan <strong>{filteredRegistrations.length}</strong> dari{' '}
            <strong>{activeTab === 'PENDING' ? pendingList.length : registrations.length}</strong> data
          </div>
        </div>

        {/* Active Filter Chips */}
        {(activeFilterCount > 0 || searchQuery) && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
              padding: '8px 20px 14px',
              borderBottom: '1px solid var(--gmh-border)',
              background: 'var(--gmh-surface-2)',
            }}
          >
            <span style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Filter Aktif:</span>
            {searchQuery && (
              <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                Pencarian: "{searchQuery}"
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              </span>
            )}
            {activeTab === 'ALL' && filterStatus && (
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                Status: {filterStatus === 'PENDING' ? 'Menunggu' : filterStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterStatus('')} />
              </span>
            )}
            {filterFaculty && (
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                Fakultas: {filterFaculty}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterFaculty('')} />
              </span>
            )}
            {filterYear && (
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                Stambuk: {filterYear}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterYear('')} />
              </span>
            )}
            {filterCity && (
              <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px' }}>
                Kota: {filterCity}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterCity('')} />
              </span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '2px 8px', color: 'var(--gmh-danger)' }}
              onClick={handleResetFilters}
            >
              Reset Semua
            </button>
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>No. Tiket</th>
                <th>Nama Lengkap</th>
                <th>{fieldLabels['member.faculty'] || 'Fakultas'} / {fieldLabels['member.entryYear'] || 'Stambuk'}</th>
                <th>Kota Domisili</th>
                <th>WhatsApp</th>
                <th>Tgl Submit</th>
                <th>Status</th>
                <th>Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--gmh-text-muted)' }}>
                    Tidak ada data pendaftaran yang sesuai dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                paginatedRegistrations.map((r) => {
                  const displayTicket = r.ticket && r.ticket !== '-'
                    ? r.ticket
                    : `REG-GMH-${String(r.id).substring(0, 8).toUpperCase()}`;

                  return (
                    <tr key={r.id}>
                      <td>
                        <code
                          style={{
                            fontSize: 11.5,
                            background: 'var(--gmh-surface-2)',
                            color: 'var(--gmh-green-dark)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            border: '1px solid var(--gmh-border)',
                          }}
                        >
                          {displayTicket}
                        </code>
                      </td>
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-green-dark)' }}>{r.name}</span>
                            {r.memberType === 'MAHASISWA' ? (
                              <span className="badge badge-info" style={{ fontSize: 10, padding: '1px 6px' }}>Mahasiswa</span>
                            ) : r.memberType === 'STAF_YAYASAN' ? (
                              <span className="badge badge-warning" style={{ fontSize: 10, padding: '1px 6px' }}>Staf Yayasan</span>
                            ) : r.memberType === 'MITRA' ? (
                              <span className="badge badge-neutral" style={{ fontSize: 10, padding: '1px 6px', background: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5' }}>Mitra</span>
                            ) : (
                              <span className="badge badge-success" style={{ fontSize: 10, padding: '1px 6px' }}>Alumni</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{r.email}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{r.faculty}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>
                          {r.major} · Stambuk {r.entryYear}
                        </div>
                      </td>
                      <td>{r.city}</td>
                      <td style={{ fontSize: 13 }}>{r.wa}</td>
                      <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{r.submittedAt}</td>
                      <td>
                        {r.status === 'PENDING' && <span className="badge badge-warning">Menunggu</span>}
                        {r.status === 'APPROVED' && <span className="badge badge-success">Disetujui</span>}
                        {r.status === 'REJECTED' && <span className="badge badge-danger">Ditolak</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Lihat Detail Pendaftaran"
                            id={`btn-view-reg-${r.id}`}
                            onClick={() => setSelectedReg(r)}
                          >
                            <Eye size={14} />
                          </button>

                          {isSuperAdminOrAdmin && r.status === 'PENDING' && (
                            <>
                              <button
                                className="btn btn-sm"
                                title="Setujui dan Terbitkan NIA"
                                id={`btn-approve-${r.id}`}
                                style={{
                                  background: 'var(--gmh-green-pale)',
                                  color: 'var(--gmh-green)',
                                  padding: '5px 10px',
                                  fontWeight: 600,
                                }}
                                onClick={() => handleApprove(r)}
                              >
                                <CheckCircle size={13} /> Setujui
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                title="Tolak Pendaftaran"
                                id={`btn-reject-${r.id}`}
                                onClick={() => setShowRejectModal(r.id)}
                              >
                                <XCircle size={13} /> Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Registrations Table Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRegistrations.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="pendaftaran"
        />
      </div>

      {/* DETAIL MODAL */}
      {selectedReg && (
        <div className="modal-overlay" onClick={() => setSelectedReg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 660 }}>
            <div className="modal-header">
              <div>
                <h3>Detail Verifikasi Pendaftaran</h3>
                <code style={{ fontSize: 12, background: 'var(--gmh-surface-2)', padding: '2px 8px', borderRadius: 4 }}>
                  {selectedReg.ticket}
                </code>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReg(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Nama Lengkap', selectedReg.name],
                  ['Tipe Keanggotaan', selectedReg.memberType === 'MAHASISWA' ? 'Mahasiswa Aktif' : selectedReg.memberType === 'STAF_YAYASAN' ? 'Staf / Pengurus Yayasan' : selectedReg.memberType === 'MITRA' ? 'Mitra / Donatur Yayasan' : 'Alumni PA KMK USU'],
                  ['NIK (16 Digit)', selectedReg.nik || '-'],
                  ['Jenis Kelamin', selectedReg.gender || '-'],
                  ['Tempat Lahir', selectedReg.birthPlace || '-'],
                  ['Tanggal Lahir', selectedReg.birthDate || '-'],
                  ['Status Pernikahan', selectedReg.maritalStatus || 'Lajang'],
                  ['Tanggal Pernikahan', selectedReg.weddingDate || '-'],
                  ['Nama Pasangan', selectedReg.partnerName || '-'],
                  ['Jumlah Anak', selectedReg.childrenCount !== undefined ? `${selectedReg.childrenCount} Orang` : '-'],
                  ['Alamat Domisili', selectedReg.address || '-'],
                  ['Kota Domisili', selectedReg.city],
                  ['Wilayah / Kring Alumni', selectedReg.province || '-'],
                  ['Kode Pos', selectedReg.postalCode || '-'],
                  ['Nomor WhatsApp', selectedReg.wa],
                  ['Alamat Email', selectedReg.email],
                  ['LinkedIn', selectedReg.socialMedia?.linkedin || '-'],
                  ['Instagram', selectedReg.socialMedia?.instagram || '-'],
                  ['Fakultas Asal USU', selectedReg.faculty],
                  ['Program Studi / Jurusan', selectedReg.major],
                  ['Stambuk / Tahun Masuk', String(selectedReg.entryYear)],
                  ['Tahun Kelulusan', selectedReg.gradYear || selectedReg.graduationYear ? String(selectedReg.gradYear || selectedReg.graduationYear) : '-'],
                  ['Kelompok KTB Asal', selectedReg.ktb || '-'],
                  ['Profesi Saat Ini', selectedReg.profession || '-'],
                  ['Instansi / Perusahaan', selectedReg.company || '-'],
                  ['Minat Pelayanan Alumni', selectedReg.ministryInterest || '-'],
                  ['Tanggal Pengajuan', selectedReg.submittedAt],
                  ['Status Saat Ini', selectedReg.status],
                ].map(([k, v]) => (
                  <div key={k} style={{ borderBottom: '1px solid var(--gmh-border)', paddingBottom: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              {selectedReg.status === 'REJECTED' && selectedReg.rejectionReason && (
                <div className="alert alert-danger" style={{ marginTop: 14 }}>
                  <span><strong>Alasan Penolakan:</strong> {selectedReg.rejectionReason}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedReg(null)}>
                Tutup
              </button>
              {isSuperAdminOrAdmin && selectedReg.status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowRejectModal(selectedReg.id)}
                  >
                    Tolak Pendaftaran
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    id="modal-btn-approve"
                    onClick={() => handleApprove(selectedReg)}
                  >
                    Setujui & Terbitkan NIA Resmi
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Tolak Pendaftaran</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowRejectModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  {fieldLabels['registration.rejectionReason'] || fieldLabels['rejectionReason'] || 'Alasan Penolakan / Permintaan Revisi'} *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {(lookups.rejectionReasons || [
                    'NIK tidak valid atau kurang dari 16 digit',
                    'Fakultas / Stambuk tidak sesuai database alumni',
                    'Nomor WhatsApp tidak aktif untuk konfirmasi',
                    'Data duplikat dengan anggota yang sudah terdaftar',
                  ]).map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setRejectReasonInput(reason)}
                      style={{ fontSize: 11, padding: '2px 8px' }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Pilih template alasan di atas atau ketik alasan penolakan..."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowRejectModal(null)}>
                Batal
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleConfirmReject(showRejectModal)}
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAGIKAN FORM PUBLIK */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--gmh-green-pale)',
                    color: 'var(--gmh-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Share2 size={18} />
                </div>
                <div>
                  <h3>Bagikan Form Pendaftaran Publik</h3>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                    Sebarkan formulir untuk diisi mandiri oleh alumni & mahasiswa PA KMK USU
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowShareModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Info Card */}
              <div
                style={{
                  background: 'var(--gmh-surface-2)',
                  border: '1px solid var(--gmh-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <img
                  src="/logo-yayasan.png"
                  alt="Logo GMH"
                  style={{ width: 44, height: 44, objectFit: 'contain', background: '#fff', padding: 3, borderRadius: 6, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Portal Pendaftaran Alumni & Mahasiswa</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Setelah diisi pendaftar, data otomatis masuk ke antrean verifikasi untuk penerbitan NIA resmi.
                  </div>
                </div>
              </div>

              {/* Tautan Input & Copy */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tautan Formulir Publik:</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    type="text"
                    readOnly
                    value={publicFormUrl}
                    className="form-input"
                    style={{ background: 'var(--gmh-surface-2)', fontSize: 13, fontFamily: 'monospace' }}
                  />
                  <button
                    className={`btn btn-sm ${isCopied ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleCopyLink}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, justifyContent: 'center' }}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'Tersalin!' : 'Salin Tautan'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  className="btn btn-outline"
                  onClick={handleShareWhatsApp}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderColor: '#25D366',
                    color: '#128C7E',
                    background: '#F0FDF4',
                    fontWeight: 600,
                  }}
                >
                  <MessageSquare size={16} color="#25D366" />
                  Bagikan ke WhatsApp
                </button>
                <a
                  href={publicFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  <ExternalLink size={16} />
                  Buka Form di Tab Baru
                </a>
              </div>

              {/* Quick instructions / tips */}
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', lineHeight: 1.5, background: 'var(--gmh-surface)', padding: 12, borderRadius: 6 }}>
                💡 <strong>Tips Pembagian:</strong> Anda dapat membagikan tautan ini ke grup WhatsApp angkatan PA KMK, media sosial yayasan, atau membukanya di tablet/laptop registrasi saat ada persekutuan tatap muka.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowShareModal(false)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FILTER PENDAFTARAN */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={18} color="var(--gmh-gold)" />
                <h3>Filter Data Pendaftaran</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowFilterModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeTab === 'ALL' && (
                <div className="form-group">
                  <label className="form-label">Status Verifikasi:</label>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Semua Status (Menunggu, Disetujui, Ditolak)</option>
                    <option value="PENDING">Menunggu Verifikasi</option>
                    <option value="APPROVED">Disetujui (NIA Terbit)</option>
                    <option value="REJECTED">Ditolak</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{fieldLabels['member.faculty'] || 'Fakultas Asal USU'}:</label>
                <select
                  className="form-select"
                  value={filterFaculty}
                  onChange={(e) => {
                    setFilterFaculty(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Semua Fakultas</option>
                  {availableFaculties.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{fieldLabels['member.entryYear'] || 'Stambuk / Tahun Masuk'}:</label>
                <select
                  className="form-select"
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Semua Angkatan / Stambuk</option>
                  {availableYears.map((y) => (
                    <option key={y} value={String(y)}>Stambuk {y}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kota Domisili:</label>
                <select
                  className="form-select"
                  value={filterCity}
                  onChange={(e) => {
                    setFilterCity(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Semua Kota Domisili</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetFilters}
                style={{ color: 'var(--gmh-danger)', borderColor: 'var(--gmh-danger)' }}
              >
                Reset Filter
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowFilterModal(false)}
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsPage;
