import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  QrCode,
  Receipt,
  Download,
  CheckCircle,
  RefreshCw,
  User,
  Calendar,
  Search,
  History,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import NominalInput from '../../components/NominalInput';
import { formatRupiah } from '../../utils/currency';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

export interface Donor {
  id: string;
  receiptNumber: string;
  name: string;
  category: string;
  type: 'PLEDGE' | 'DONATION';
  total: number;
  paid: number;
  remaining: number;
  lastPayment: string;
  notes?: string;
  memberId?: string | null;
  memberNumber?: string | null;
  memberEmail?: string | null;
  memberPhone?: string | null;
  status: string;
  installmentsCount?: number;
}

export interface InstallmentItem {
  id: string;
  transaction_code: string;
  transaction_date: string;
  amount: number | string;
  payment_method: string;
  notes?: string;
  created_at: string;
  recorded_by_name?: string;
}

export interface MemberPledgeItem {
  id: string;
  category: string;
  pledge_type: string;
  total_pledge: number | string;
  fulfilled_amount: number | string;
  status: string;
  notes?: string;
  installments_count?: number;
  receipt_number?: string;
}

const DonationsPage: React.FC = () => {
  const { lookups, fieldLabels } = useDynamicConfig();

  const [donors, setDonors] = useState<Donor[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlMemberId = searchParams.get('memberId') || '';

  // Filters & Search
  const [search, setSearch] = useState(urlSearch);
  const [filterType, setFilterType] = useState<'ALL' | 'PLEDGE' | 'DONATION'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [targetPledgeForProgress, setTargetPledgeForProgress] = useState<Donor | null>(null);

  // Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailPledge, setSelectedDetailPledge] = useState<Donor | null>(null);
  const [detailInstallments, setDetailInstallments] = useState<InstallmentItem[]>([]);
  const [memberOtherPledges, setMemberOtherPledges] = useState<MemberPledgeItem[]>([]);
  const [memberTotalDonated, setMemberTotalDonated] = useState<number>(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // E-Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Form State: Tambah Komitmen / Donasi Baru
  const [donorSourceType, setDonorSourceType] = useState<'MEMBER' | 'EXTERNAL'>('MEMBER');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    type: 'PLEDGE' | 'DONATION';
    total: number;
    initialPaid: number;
    paymentMethod: string;
    notes: string;
    dueDate: string;
  }>({
    name: '',
    category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
    type: 'PLEDGE',
    total: 0,
    initialPaid: 0,
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
    dueDate: '',
  });

  // Form State: Tambah Progres / Angsuran
  const [progressFormData, setProgressFormData] = useState<{
    amount: number;
    date: string;
    paymentMethod: string;
    notes: string;
  }>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Fetch Donations List from API
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await api.finance.getDonations();
      if (res && (res.donations || res.pledges || res.data)) {
        const rows = res.donations || res.pledges || res.data || [];
        const mapped: Donor[] = rows.map((r: any, idx: number) => {
          const tot = Number(r.total_pledge || 0);
          const pd = Number(r.fulfilled_amount || 0);
          const tCode = r.receipt_number || '-';
          return {
            id: r.id || String(idx),
            receiptNumber: tCode,
            name: r.member_name || r.donor_name || 'Hamba Tuhan (Anonim)',
            category: r.category || r.project_name || 'Pembangunan Rumah Persekutuan',
            type: (r.pledge_type || (tot > pd ? 'PLEDGE' : 'DONATION')) as 'PLEDGE' | 'DONATION',
            total: tot > 0 ? tot : pd,
            paid: pd,
            remaining: Math.max(0, tot - pd),
            lastPayment: r.last_payment_date ? r.last_payment_date.split('T')[0] : (r.created_at ? r.created_at.split('T')[0] : '2026-10-30'),
            notes: r.notes || undefined,
            memberId: r.member_id || null,
            memberNumber: r.member_number || null,
            memberEmail: r.member_email || null,
            memberPhone: r.member_phone || null,
            status: r.status || (pd >= tot ? 'COMPLETED' : 'ACTIVE'),
            installmentsCount: Number(r.installments_count || (pd > 0 ? 1 : 0)),
          };
        });
        setDonors(mapped);
      }
    } catch (err: any) {
      console.warn('Gagal memuat donasi dari API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Members for Selection
  const fetchMembers = async () => {
    try {
      const res = await api.members.getAll();
      if (res && res.data) {
        setMembersList(res.data);
      }
    } catch (err) {
      console.warn('Gagal memuat daftar anggota:', err);
    }
  };

  useEffect(() => {
    fetchDonations();
    fetchMembers();
  }, []);

  // Filtered Donors
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.receiptNumber && d.receiptNumber !== '-' && d.receiptNumber.toLowerCase().includes(q)) ||
        (d.memberNumber && d.memberNumber.toLowerCase().includes(q)) ||
        (urlMemberId && d.memberId === urlMemberId) ||
        d.category.toLowerCase().includes(q);

      const matchType = filterType === 'ALL' || d.type === filterType;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'COMPLETED' && (d.status === 'COMPLETED' || d.remaining === 0)) ||
        (filterStatus === 'ACTIVE' && (d.status === 'ACTIVE' && d.remaining > 0));

      const matchCategory = filterCategory === 'ALL' || d.category === filterCategory;

      return matchSearch && matchType && matchStatus && matchCategory;
    });
  }, [donors, search, filterType, filterStatus, filterCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (lookups?.donationCategories || []).forEach((c) => set.add(c));
    donors.forEach((d) => {
      if (d.category) set.add(d.category);
    });
    return Array.from(set);
  }, [donors, lookups?.donationCategories]);

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedDonors,
  } = usePagination(filteredDonors, { initialPageSize: 10 });

  const totalTarget = donors.reduce((s, d) => s + d.total, 0);
  const totalPaid = donors.reduce((s, d) => s + d.paid, 0);
  const pct = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;
  const totalCompleted = donors.filter((d) => d.remaining === 0 || d.status === 'COMPLETED').length;
  const totalActive = donors.filter((d) => d.remaining > 0 && d.status !== 'COMPLETED').length;

  // Open Detail Modal (Fetch Full History & Member Pledges)
  const handleOpenDetail = async (donor: Donor) => {
    setSelectedDetailPledge(donor);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.finance.getPledgeDetail(donor.id);
      if (res) {
        setDetailInstallments(res.installments || []);
        setMemberOtherPledges(res.memberAllPledges || []);
        setMemberTotalDonated(Number(res.memberTotalDonated || 0));
      }
    } catch (err: any) {
      console.warn('Gagal memuat detail angsuran:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Add Progress Modal
  const handleOpenAddProgress = (donor: Donor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetPledgeForProgress(donor);
    setProgressFormData({
      amount: donor.remaining > 0 ? Math.min(donor.remaining, 5000000) : 1000000,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      notes: `Angsuran ke-${(donor.installmentsCount || 0) + 1} - ${donor.name}`,
    });
    setShowProgressModal(true);
  };

  // Save Progress / Installment
  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPledgeForProgress) return;

    if (progressFormData.amount <= 0) {
      alert('Mohon masukkan nominal angsuran yang valid.');
      return;
    }

    try {
      const res = await api.finance.addInstallment(targetPledgeForProgress.id, {
        amount: progressFormData.amount,
        date: progressFormData.date,
        paymentMethod: progressFormData.paymentMethod,
        notes: progressFormData.notes.trim() || undefined,
      });

      showToast(`Angsuran Rp ${progressFormData.amount.toLocaleString('id-ID')} berhasil dicatat!`);
      setShowProgressModal(false);

      // Refresh list
      await fetchDonations();

      // If detail modal is open for this pledge, refresh its installments
      if (selectedDetailPledge && selectedDetailPledge.id === targetPledgeForProgress.id) {
        handleOpenDetail({
          ...selectedDetailPledge,
          paid: selectedDetailPledge.paid + progressFormData.amount,
          remaining: Math.max(0, selectedDetailPledge.remaining - progressFormData.amount),
        });
      }

      // If receipt returned, preview it
      if (res?.receipt) {
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName,
          category: res.receipt.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: targetPledgeForProgress.total,
          paid: targetPledgeForProgress.paid + progressFormData.amount,
          remaining: Math.max(0, targetPledgeForProgress.remaining - progressFormData.amount),
        });
      }
    } catch (err: any) {
      alert('Gagal mencatat angsuran: ' + err.message);
    }
  };

  // Save New Pledge / Donation
  const handleSaveNewPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDonorName = formData.name.trim();

    if (donorSourceType === 'MEMBER') {
      if (!selectedMemberId) {
        alert('Mohon pilih anggota dari database.');
        return;
      }
      const mem = membersList.find((m) => m.id === selectedMemberId);
      finalDonorName = mem?.full_name || '';
    } else {
      if (!finalDonorName) {
        alert('Mohon masukkan nama donatur / keluarga.');
        return;
      }
    }

    if (formData.total <= 0) {
      alert('Mohon masukkan total komitmen yang valid.');
      return;
    }

    try {
      const payload = {
        donorName: finalDonorName,
        memberId: donorSourceType === 'MEMBER' ? selectedMemberId : null,
        category: formData.category,
        type: formData.type,
        totalAmount: formData.total,
        initialPayment: formData.initialPaid,
        paymentMethod: formData.paymentMethod,
        dueDate: formData.dueDate || null,
        notes: formData.notes.trim() || undefined,
      };

      const res = await api.finance.createPledge(payload);
      showToast(`Komitmen donasi untuk ${finalDonorName} berhasil dicatat!`);
      setShowAddModal(false);

      // Reset form
      setSelectedMemberId('');
      setFormData({
        name: '',
        category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
        type: 'PLEDGE',
        total: 0,
        initialPaid: 0,
        paymentMethod: 'BANK_TRANSFER',
        notes: '',
        dueDate: '',
      });

      await fetchDonations();

      if (res?.receipt) {
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName,
          category: res.receipt.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: formData.total,
          paid: formData.initialPaid,
          remaining: Math.max(0, formData.total - formData.initialPaid),
        });
      }
    } catch (err: any) {
      alert('Gagal mencatat komitmen donasi: ' + err.message);
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Donasi & {fieldLabels['donation.pledge'] || 'Janji Iman Pembangunan'}</h2>
          <p>
            Penggalangan dana, penelusuran riwayat cicilan angsuran donatur, relasi ID Anggota primer, dan penerbitan E-Kuitansi resmi ber-QR Code
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchDonations}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Segarkan
          </button>
          <button
            className="btn btn-primary btn-sm"
            id="btn-add-donation"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> + Catat Donasi / Janji Iman
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-label">TOTAL TERKUMPUL</div>
          <div className="stat-card-value" style={{ fontSize: 20, color: 'var(--gmh-green)' }}>
            {formatRupiah(totalPaid)}
          </div>
          <div className="stat-card-desc" style={{ color: 'var(--gmh-text-muted)', fontSize: 11 }}>
            Dari total target {formatRupiah(totalTarget)} ({pct}%)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">TARGET KOMITMEN TOTAL</div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>
            {formatRupiah(totalTarget)}
          </div>
          <div className="stat-card-desc" style={{ color: 'var(--gmh-text-muted)', fontSize: 11 }}>
            Sisa tagihan: {formatRupiah(Math.max(0, totalTarget - totalPaid))}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">KOMITMEN BERJALAN</div>
          <div className="stat-card-value" style={{ fontSize: 20, color: '#b45309' }}>
            {totalActive} Komitmen
          </div>
          <div className="stat-card-desc" style={{ color: 'var(--gmh-text-muted)', fontSize: 11 }}>
            Sedang dalam proses cicilan angsuran
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">KOMITMEN LUNAS</div>
          <div className="stat-card-value" style={{ fontSize: 20, color: 'var(--gmh-green-dark)' }}>
            {totalCompleted} Donatur
          </div>
          <div className="stat-card-desc" style={{ color: 'var(--gmh-text-muted)', fontSize: 11 }}>
            Realisasi 100% penuh
          </div>
        </div>
      </div>

      {/* Progress Bar Header Card */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Capaian Komitmen Donasi & Janji Iman Yayasan</div>
          <span className="badge badge-primary" style={{ fontWeight: 700 }}>
            {pct}% dari Target Total
          </span>
        </div>
        <div className="progress-bar-wrapper" style={{ height: 10 }}>
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--gmh-green)' }} />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">Daftar Komitmen Donatur & Angsuran</div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ width: 250, maxWidth: '100%', position: 'relative' }}>
              <Search className="search-box-icon" size={15} />
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="Cari nama, kuitansi, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="form-select form-select-sm"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{ width: 'auto', minWidth: 135 }}
            >
              <option value="ALL">Semua Tipe</option>
              <option value="PLEDGE">Janji Iman</option>
              <option value="DONATION">Donasi Langsung</option>
            </select>

            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{ width: 'auto', minWidth: 150 }}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Sedang Berjalan</option>
              <option value="COMPLETED">Lunas</option>
            </select>

            <select
              className="form-select form-select-sm"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 'auto', minWidth: 180 }}
            >
              <option value="ALL">Semua Peruntukan</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>No. Kuitansi</th>
                <th>Donatur / Anggota</th>
                <th>Kategori Peruntukan</th>
                <th>Tipe</th>
                <th>Total Komitmen</th>
                <th>Telah Disetor</th>
                <th>Sisa Tagihan</th>
                <th>Progres</th>
                <th>Tgl Terakhir</th>
                <th style={{ textAlign: 'center' }}>Aksi & E-Kuitansi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
                    Memuat data donasi dan janji iman...
                  </td>
                </tr>
              ) : paginatedDonors.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
                    Tidak ada data donatur atau janji iman yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedDonors.map((d) => {
                  const p = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 100;
                  const isDone = d.remaining <= 0 || d.status === 'COMPLETED';

                  return (
                    <tr
                      key={d.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenDetail(d)}
                      title="Klik baris untuk melihat rincian kapan-kapan donatur memberikan"
                    >
                      <td>
                        {d.receiptNumber && d.receiptNumber !== '-' ? (
                          <code style={{ fontSize: 11, background: 'var(--gmh-surface-2)', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {d.receiptNumber}
                          </code>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--gmh-primary-dark)' }}>{d.name}</div>
                        {d.memberNumber ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span
                              className="badge badge-success"
                              style={{ fontSize: 10, padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <User size={10} /> {d.memberNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 10, padding: '1px 6px' }}>
                            Donatur Eksternal
                          </span>
                        )}
                        {d.notes && <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{d.notes}</div>}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                          {d.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${d.type === 'PLEDGE' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: 11 }}>
                          {d.type === 'PLEDGE' ? 'Janji Iman' : 'Donasi Langsung'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatRupiah(d.total)}</td>
                      <td style={{ color: 'var(--gmh-green)', fontWeight: 600 }}>{formatRupiah(d.paid)}</td>
                      <td style={{ color: d.remaining > 0 ? '#b91c1c' : 'var(--gmh-green-dark)', fontWeight: 600 }}>
                        {d.remaining > 0 ? formatRupiah(d.remaining) : 'Lunas'}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="progress-bar-wrapper" style={{ flex: 1, height: 6 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${p}%`,
                                background: isDone ? 'var(--gmh-green)' : '#2563eb',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', minWidth: 32, fontWeight: 600 }}>
                            {p}%
                          </span>
                        </div>
                        {d.installmentsCount && d.installmentsCount > 0 ? (
                          <div style={{ fontSize: 10, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                            {d.installmentsCount}x angsuran
                          </div>
                        ) : null}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{d.lastPayment}</td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {/* Tambah Progres Button */}
                          {!isDone && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4, background: '#16a34a' }}
                              onClick={(e) => handleOpenAddProgress(d, e)}
                              title="Tambah Progres / Catat Pembayaran Angsuran"
                            >
                              <Plus size={12} /> + Angsuran
                            </button>
                          )}

                          {/* Detail & History Button */}
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleOpenDetail(d)}
                            title="Lihat Rincian Riwayat Angsuran & Detail Donatur"
                          >
                            <History size={12} /> Rincian
                          </button>

                          {/* E-Kuitansi Button */}
                          {d.receiptNumber && d.receiptNumber !== '-' && (
                            <button
                              className="btn btn-sm btn-outline"
                              id={`btn-receipt-${d.id}`}
                              style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() =>
                                setSelectedReceipt({
                                  receiptNumber: d.receiptNumber,
                                  name: d.name,
                                  category: d.category,
                                  amount: d.paid,
                                  lastPayment: d.lastPayment,
                                  total: d.total,
                                  paid: d.paid,
                                  remaining: d.remaining,
                                })
                              }
                              title="Buka E-Kuitansi Resmi"
                            >
                              <QrCode size={12} /> E-Kuitansi
                            </button>
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDonors.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="komitmen / donasi"
        />
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DETAIL KOMITMEN & RIWAYAT ANGSURAN ("Kapan-kapan orang itu memberikan") */}
      {/* ========================================================================= */}
      {showDetailModal && selectedDetailPledge && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 840, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={18} color="var(--gmh-green)" />
                  <h3 style={{ margin: 0 }}>Rincian Riwayat Komitmen & Angsuran</h3>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                  Penelusuran detail kapan saja donatur memberikan cicilan, nomor kuitansi, dan akumulasi donasi
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Header Box Profile */}
              <div
                style={{
                  background: 'var(--gmh-surface-2)',
                  border: '1px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gmh-text)' }}>
                    {selectedDetailPledge.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    {selectedDetailPledge.memberNumber ? (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <User size={11} /> ID Anggota: {selectedDetailPledge.memberNumber}
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                        Donatur Eksternal / Keluarga
                      </span>
                    )}

                    <span className="badge badge-primary" style={{ fontSize: 11 }}>
                      {selectedDetailPledge.category}
                    </span>

                    <span
                      className={`badge ${selectedDetailPledge.remaining <= 0 ? 'badge-success' : 'badge-warning'}`}
                      style={{ fontSize: 11 }}
                    >
                      {selectedDetailPledge.remaining <= 0 ? 'STATUS: LUNAS' : 'STATUS: SEDANG BERJALAN'}
                    </span>
                  </div>
                </div>

                {/* Quick Add Installment button */}
                {selectedDetailPledge.remaining > 0 && (
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ background: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => handleOpenAddProgress(selectedDetailPledge)}
                  >
                    <Plus size={14} /> + Tambah Angsuran Baru
                  </button>
                )}
              </div>

              {/* Progress Summary 4 Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ background: '#fff', border: '1px solid var(--gmh-border-dark)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>TOTAL KOMITMEN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                    {formatRupiah(selectedDetailPledge.total)}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--gmh-border-dark)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>TELAH DISETOR</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gmh-green)', marginTop: 4 }}>
                    {formatRupiah(selectedDetailPledge.paid)}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--gmh-border-dark)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>SISA TAGIHAN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: selectedDetailPledge.remaining > 0 ? '#b91c1c' : 'var(--gmh-green-dark)', marginTop: 4 }}>
                    {selectedDetailPledge.remaining > 0 ? formatRupiah(selectedDetailPledge.remaining) : 'Lunas (0)'}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--gmh-border-dark)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>PROGRES PENYELESAIAN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>
                    {selectedDetailPledge.total > 0
                      ? Math.round((selectedDetailPledge.paid / selectedDetailPledge.total) * 100)
                      : 100}%
                  </div>
                </div>
              </div>

              {/* SECTION: TABEL KAPAN-KAPAN ORANG ITU MEMBERIKAN */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={16} color="var(--gmh-primary-dark)" /> Riwayat Penyetoran Angsuran (Kapan-kapan Donatur Memberikan)
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                    Total: {detailInstallments.length} kali transaksi
                  </span>
                </div>

                {loadingDetail ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--gmh-text-muted)' }}>
                    Memuat rincian transaksi angsuran...
                  </div>
                ) : detailInstallments.length === 0 ? (
                  <div
                    style={{
                      background: 'var(--gmh-surface-2)',
                      padding: 24,
                      borderRadius: 8,
                      textAlign: 'center',
                      color: 'var(--gmh-text-muted)',
                      fontSize: 13,
                    }}
                  >
                    Belum ada riwayat transaksi angsuran yang tercatat untuk komitmen ini.
                    {selectedDetailPledge.remaining > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleOpenAddProgress(selectedDetailPledge)}
                        >
                          <Plus size={12} /> Catat Angsuran Pertama Sekarang
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ border: '1px solid var(--gmh-border-dark)', borderRadius: 8 }}>
                    <table className="table" style={{ margin: 0 }}>
                      <thead>
                        <tr style={{ background: 'var(--gmh-surface-2)' }}>
                          <th>No</th>
                          <th>Tanggal Penyetoran</th>
                          <th>No. Kuitansi</th>
                          <th>Nominal Angsuran</th>
                          <th>Metode Pembayaran</th>
                          <th>Keterangan / Catatan</th>
                          <th style={{ textAlign: 'center' }}>Cetak E-Kuitansi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailInstallments.map((inst, idx) => (
                          <tr key={inst.id}>
                            <td style={{ fontSize: 12 }}>{idx + 1}</td>
                            <td style={{ fontSize: 12.5, fontWeight: 600 }}>
                              {inst.transaction_date ? inst.transaction_date.split('T')[0] : '-'}
                            </td>
                            <td>
                              <code style={{ fontSize: 11, background: 'var(--gmh-surface)', padding: '2px 6px', borderRadius: 4 }}>
                                {inst.transaction_code}
                              </code>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gmh-green)' }}>
                              + {formatRupiah(Number(inst.amount))}
                            </td>
                            <td>
                              <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>
                                {inst.payment_method === 'BANK_TRANSFER'
                                  ? 'Transfer Bank'
                                  : inst.payment_method === 'QRIS'
                                  ? 'QRIS Yayasan'
                                  : 'Tunai'}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--gmh-text)' }}>
                              {inst.notes || 'Angsuran komitmen donasi'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: 11, padding: '2px 8px' }}
                                onClick={() =>
                                  setSelectedReceipt({
                                    receiptNumber: inst.transaction_code,
                                    name: selectedDetailPledge.name,
                                    category: selectedDetailPledge.category,
                                    amount: Number(inst.amount),
                                    lastPayment: inst.transaction_date ? inst.transaction_date.split('T')[0] : '2026-10-30',
                                    total: selectedDetailPledge.total,
                                    paid: selectedDetailPledge.paid,
                                    remaining: selectedDetailPledge.remaining,
                                  })
                                }
                              >
                                <QrCode size={12} /> Kuitansi
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION: RELASI DATA ANGGOTA (JIKA MEMBER ID TERSEDIA) */}
              {selectedDetailPledge.memberId && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={16} color="var(--gmh-green-dark)" />
                      <strong style={{ fontSize: 14, color: 'var(--gmh-green-dark)' }}>
                        Relasi Primer Anggota PA KMK: {selectedDetailPledge.memberNumber}
                      </strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gmh-green-dark)', fontWeight: 600 }}>
                      Total Akumulasi Seluruh Donasi Anggota Ini: {formatRupiah(memberTotalDonated)}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginBottom: 10 }}>
                    Sistem mendeteksi bahwa donatur ini adalah anggota terdaftar resmi yayasan. Di bawah ini adalah daftar semua program komitmen / donasi lain yang pernah didaftarkan atas nama anggota ini:
                  </div>

                  {memberOtherPledges.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontStyle: 'italic' }}>
                      Belum ada komitmen donasi lain oleh anggota ini.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {memberOtherPledges.map((mp) => (
                        <div
                          key={mp.id}
                          style={{
                            background: '#fff',
                            border: '1px solid #bbf7d0',
                            borderRadius: 6,
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{mp.category}</div>
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                              Tipe: {mp.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} · {mp.installments_count || 0}x angsuran
                              {mp.notes ? ` · Catatan: ${mp.notes}` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gmh-green)' }}>
                                {formatRupiah(Number(mp.fulfilled_amount))} / {formatRupiah(Number(mp.total_pledge))}
                              </div>
                              <div style={{ fontSize: 10.5, color: mp.status === 'COMPLETED' ? 'var(--gmh-green-dark)' : '#b45309', fontWeight: 600 }}>
                                {mp.status === 'COMPLETED' ? 'LUNAS (100%)' : 'BERJALAN'}
                              </div>
                            </div>

                            {mp.id !== selectedDetailPledge.id && (
                              <button
                                className="btn btn-sm btn-outline"
                                style={{ fontSize: 11, padding: '3px 8px' }}
                                onClick={() => {
                                  const found = donors.find((d) => d.id === mp.id);
                                  if (found) {
                                    handleOpenDetail(found);
                                  }
                                }}
                              >
                                Buka Rincian
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowDetailModal(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH PROGRES / ANGSURAN BARU                                   */}
      {/* ========================================================================= */}
      {showProgressModal && targetPledgeForProgress && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Tambah Progres / Catat Angsuran Donasi</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowProgressModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProgress}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Target Donor Summary Banner */}
                <div
                  style={{
                    background: 'var(--gmh-surface-2)',
                    border: '1px solid var(--gmh-border-dark)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Donatur:</span>
                    <strong>{targetPledgeForProgress.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Program Peruntukan:</span>
                    <span>{targetPledgeForProgress.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Total Komitmen:</span>
                    <span>{formatRupiah(targetPledgeForProgress.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Telah Disetor:</span>
                    <strong style={{ color: 'var(--gmh-green)' }}>{formatRupiah(targetPledgeForProgress.paid)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--gmh-border-dark)', paddingTop: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Sisa Tagihan:</span>
                    <strong style={{ color: '#b91c1c' }}>{formatRupiah(targetPledgeForProgress.remaining)}</strong>
                  </div>
                </div>

                {/* Tanggal Angsuran */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Tanggal Pembayaran Angsuran
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={progressFormData.date}
                    onChange={(e) => setProgressFormData({ ...progressFormData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Nominal Angsuran Input */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Nominal Angsuran (Rp)
                    </label>
                    {targetPledgeForProgress.remaining > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, color: 'var(--gmh-primary-dark)', padding: '0 4px', textDecoration: 'underline' }}
                        onClick={() => setProgressFormData({ ...progressFormData, amount: targetPledgeForProgress.remaining })}
                      >
                        Bayar Lunas Sisa ({formatRupiah(targetPledgeForProgress.remaining)})
                      </button>
                    )}
                  </div>
                  <NominalInput
                    value={progressFormData.amount}
                    onChange={(val) => setProgressFormData({ ...progressFormData, amount: val })}
                    placeholder="Masukkan nominal angsuran..."
                  />

                  {/* Quick Shortcut Buttons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[1000000, 2500000, 5000000, 10000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11, padding: '2px 6px' }}
                        onClick={() => setProgressFormData({ ...progressFormData, amount: amt })}
                      >
                        + {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Metode Pembayaran
                  </label>
                  <select
                    className="input"
                    value={progressFormData.paymentMethod}
                    onChange={(e) => setProgressFormData({ ...progressFormData, paymentMethod: e.target.value })}
                  >
                    {(lookups?.paymentMethods?.length
                      ? lookups.paymentMethods
                      : [
                          'Transfer Bank (BCA Rekening Yayasan GMH)',
                          'Transfer Bank Mandiri Yayasan',
                          'QRIS Yayasan GMH',
                          'Kas Tunai Kantor Yayasan',
                        ]
                    ).map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catatan / Keterangan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Catatan / Keterangan Penyetoran
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran tahap ke-4 (Transfer BCA a.n Yusuf)"
                    value={progressFormData.notes}
                    onChange={(e) => setProgressFormData({ ...progressFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProgressModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#16a34a' }}>
                  Simpan Angsuran & Terbitkan E-Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CATAT DONASI / JANJI IMAN BARU                                   */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Catat Donasi / Komitmen Janji Iman Baru</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPledge}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Pilihan Sumber Donatur: Anggota vs Eksternal */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Sumber Donatur / Pelaku Janji Iman:
                  </label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="donorSourceType"
                        checked={donorSourceType === 'MEMBER'}
                        onChange={() => setDonorSourceType('MEMBER')}
                      />
                      <span>Pilih dari Data Anggota / Alumni GMH</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="donorSourceType"
                        checked={donorSourceType === 'EXTERNAL'}
                        onChange={() => setDonorSourceType('EXTERNAL')}
                      />
                      <span>Donatur Eksternal / Keluarga / Anonim</span>
                    </label>
                  </div>
                </div>

                {/* Jika Sumber Anggota */}
                {donorSourceType === 'MEMBER' ? (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Pilih Anggota / Alumni (ID Anggota Relasi Primer)
                    </label>
                    <select
                      className="input"
                      value={selectedMemberId}
                      onChange={(e) => {
                        setSelectedMemberId(e.target.value);
                        const mem = membersList.find((m) => m.id === e.target.value);
                        if (mem) {
                          setFormData({ ...formData, name: mem.full_name });
                        }
                      }}
                      required
                    >
                      <option value="">-- Pilih Anggota Terdaftar ({membersList.length} Anggota) --</option>
                      {membersList.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.member_number || 'ALUMNI'}] {m.full_name} {m.faculty ? `(${m.faculty})` : ''}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Setiap donasi / janji iman yang dibuat akan otomatis tersimpan dalam portofolio profil anggota ini.
                    </span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Nama Donatur / Keluarga / Lembaga
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Contoh: Keluarga Sinurat / Persekutuan Alumni Jakarta"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Tipe Komitmen & Kategori */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Tipe Komitmen
                    </label>
                    <select
                      className="input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="PLEDGE">Janji Iman (Komitmen Bertahap)</option>
                      <option value="DONATION">Donasi Langsung (Sekaligus)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Kategori Peruntukan
                    </label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {(lookups?.donationCategories?.length
                        ? lookups.donationCategories
                        : [
                            'Pembangunan Rumah Persekutuan',
                            'Renovasi & Audio Visual Ruang Doa',
                            'Pelayanan Misi & Pos Pekabar Injil',
                            'Operasional Yayasan & Pelayanan Mahasiswa',
                          ]
                      ).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Total Komitmen & Setoran Awal */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Total Target Komitmen (Rp)
                    </label>
                    <NominalInput
                      value={formData.total}
                      onChange={(val) => setFormData({ ...formData, total: val })}
                      placeholder="Contoh: Rp 20.000.000"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Setoran Awal / DP (Rp)
                    </label>
                    <NominalInput
                      value={formData.initialPaid}
                      onChange={(val) => setFormData({ ...formData, initialPaid: val })}
                      placeholder="0 jika belum setor"
                    />
                    <span style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)' }}>
                      Jika &gt; 0, kuitansi awal diterbitkan.
                    </span>
                  </div>
                </div>

                {/* Metode Pembayaran jika ada Setoran Awal */}
                {formData.initialPaid > 0 && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Metode Pembayaran Setoran Awal
                    </label>
                    <select
                      className="input"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      {(lookups?.paymentMethods?.length
                        ? lookups.paymentMethods
                        : [
                            'Transfer Bank (BCA Rekening Yayasan GMH)',
                            'QRIS Yayasan GMH',
                            'Kas Tunai Kantor Yayasan',
                          ]
                      ).map((pm) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Catatan / Keterangan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Catatan / Komitmen
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Komitmen per kuartal selama tahun 2026"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Komitmen Donasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* E-RECEIPT MODAL                                                           */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>E-Kuitansi Resmi Yayasan GMH</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedReceipt(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: 'var(--gmh-surface)' }}>
              <div
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid var(--gmh-green)', paddingBottom: 12, marginBottom: 16 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                      Badan Hukum · Medan, Sumatera Utara · gmhpakmk.org
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#b45309', marginTop: 4 }}>
                      TANDA BUKTI PENERIMAAN DANA DONASI / JANJI IMAN
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Nomor Kuitansi:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.receiptNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Telah Terima Dari:</span>
                    <strong>{selectedReceipt.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Peruntukan:</span>
                    <span>{selectedReceipt.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Tanggal Penyetoran:</span>
                    <span>{selectedReceipt.lastPayment}</span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      padding: '12px 16px',
                      background: 'var(--gmh-surface-2)',
                      borderRadius: 6,
                      borderLeft: '4px solid var(--gmh-green)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Nominal Diterima:</span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-green-dark)' }}>
                      {formatRupiah(selectedReceipt.amount || selectedReceipt.paid)}
                    </strong>
                  </div>

                  {selectedReceipt.total && (
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span>Realisasi Total: {formatRupiah(selectedReceipt.paid)} dari {formatRupiah(selectedReceipt.total)}</span>
                      <span>Sisa: {formatRupiah(selectedReceipt.remaining)}</span>
                    </div>
                  )}
                </div>

                {/* QR Code Verification Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px dashed var(--gmh-border-dark)',
                  }}
                >
                  <a
                    href={`/verify-receipt?kwt=${selectedReceipt.receiptNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Klik untuk simulasi pemindaian QR verifikasi kuitansi ini"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        border: '1.5px solid #0f172a',
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        padding: 3,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          window.location.origin + '/verify-receipt?kwt=' + selectedReceipt.receiptNumber
                        )}`}
                        alt={`QR Verifikasi ${selectedReceipt.receiptNumber}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <span style={{ fontSize: 9.5, color: '#166534', fontWeight: 600, marginTop: 4 }}>
                      Pindai / Uji Validasi
                    </span>
                  </a>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', flex: 1 }}>
                    <div style={{ color: 'var(--gmh-green-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={14} /> Segel Verifikasi Digital Anti-Pemalsuan:
                    </div>
                    <div style={{ marginTop: 2, lineHeight: 1.4 }}>
                      Dokumen kuitansi ini diterbitkan sah oleh sistem digital Yayasan GMH. Pindai kode QR menggunakan kamera ponsel untuk memvalidasi keaslian tanda terima langsung dari server pusat yayasan.
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <a
                        href={`/verify-receipt?kwt=${selectedReceipt.receiptNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', fontWeight: 600, fontSize: 11, textDecoration: 'underline' }}
                      >
                        Buka Laman Validasi Resmi (Simulasi Scan) ↗
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-outline" onClick={() => window.print()}>
                <Download size={14} /> Unduh / Cetak Kuitansi
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedReceipt(null)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
