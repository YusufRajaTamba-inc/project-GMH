import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  CheckCircle,
  ArrowRightLeft,
  Inbox,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import type { Asset, AssetLoan } from './types';
import { AssetCatalogTab } from './components/AssetCatalogTab';
import { AssetRequestsTab } from './components/AssetRequestsTab';
import { AssetActiveLoansTab } from './components/AssetActiveLoansTab';
import { AssetHistoryTab } from './components/AssetHistoryTab';
import { AssetModals } from './components/AssetModals';

export * from './types';

const AssetsPage: React.FC = () => {
  const { lookups, rawLookups } = useDynamicConfig();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests' | 'active_loans' | 'history'>('catalog');

  // Main Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loans, setLoans] = useState<AssetLoan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingLoans, setIsLoadingLoans] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters & Search for Catalog
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState('ALL');

  // Modals state
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [borrowingAsset, setBorrowingAsset] = useState<Asset | null>(null);
  const [returningLoan, setReturningLoan] = useState<AssetLoan | null>(null);

  // Add Asset Form State
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState('SOUND_SYSTEM');
  const [addCategoryId, setAddCategoryId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addCondition, setAddCondition] = useState<'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [addPrice, setAddPrice] = useState(0);
  const [addRentalPrice, setAddRentalPrice] = useState(0);
  const [addRoom, setAddRoom] = useState('Aula Utama Lt. 1');
  const [addBorrowable, setAddBorrowable] = useState(true);
  const [addNotes, setAddNotes] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Asset Form State
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('BARANG');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editCondition, setEditCondition] = useState<'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [editPrice, setEditPrice] = useState(0);
  const [editRentalPrice, setEditRentalPrice] = useState(0);
  const [editRoom, setEditRoom] = useState('');
  const [editBorrowable, setEditBorrowable] = useState(true);
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Borrow/Rent Form State
  const [loanMode, setLoanMode] = useState<'PINJAM' | 'SEWA'>('PINJAM');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanQty, setLoanQty] = useState(1);
  const [rentalFee, setRentalFee] = useState(0);
  const [borrowedAt, setBorrowedAt] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [loanNotes, setLoanNotes] = useState('');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  // Return Form State
  const [actualReturnAt, setActualReturnAt] = useState(new Date().toISOString().split('T')[0]);
  const [conditionOnReturn, setConditionOnReturn] = useState<'GOOD' | 'FAIR' | 'DAMAGED'>('GOOD');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Online Requests & Approvals State
  const [filterRequestStatus, setFilterRequestStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchRequest, setSearchRequest] = useState('');
  const [filterRequestDateFrom, setFilterRequestDateFrom] = useState('');
  const [filterRequestDateTo, setFilterRequestDateTo] = useState('');
  const [approvingLoan, setApprovingLoan] = useState<AssetLoan | null>(null);

  // Active Loans Filters State
  const [searchActiveLoan, setSearchActiveLoan] = useState('');
  const [filterActiveType, setFilterActiveType] = useState<'ALL' | 'PINJAM' | 'SEWA'>('ALL');
  const [filterActiveDateFrom, setFilterActiveDateFrom] = useState('');
  const [filterActiveDateTo, setFilterActiveDateTo] = useState('');

  // History Loans Filters State
  const [searchHistoryLoan, setSearchHistoryLoan] = useState('');
  const [filterHistoryCondition, setFilterHistoryCondition] = useState<'ALL' | 'GOOD' | 'FAIR' | 'DAMAGED'>('ALL');
  const [filterHistoryDateFrom, setFilterHistoryDateFrom] = useState('');
  const [filterHistoryDateTo, setFilterHistoryDateTo] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [rejectingLoan, setRejectingLoan] = useState<AssetLoan | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // Relational Members
  const [membersList, setMembersList] = useState<Array<{ id: string; member_number: string; full_name: string; phone_number?: string }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Dynamic asset category options
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

  // Dynamic asset location options
  const locationOptions = useMemo(() => {
    const fromRaw = rawLookups['ASSET_LOCATION'] || rawLookups['assetLocations'] || [];
    if (fromRaw.length > 0) {
      return fromRaw.map((item: any) => ({
        id: item.id || item.code,
        label: item.label || item.code,
        code: item.code,
      }));
    }
    return (lookups.assetLocations || []).map((label, idx) => ({
      id: `LOC-${idx}`,
      label,
      code: `LOC_${idx}`,
    }));
  }, [rawLookups, lookups.assetLocations]);

  // Dynamic physical condition options
  const conditionOptions = useMemo(() => {
    const fromRaw = rawLookups['PHYSICAL_CONDITION'] || rawLookups['ASSET_CONDITION'] || [];
    if (fromRaw.length > 0) {
      return fromRaw.map((item: any) => ({
        code: item.code as 'GOOD' | 'FAIR' | 'DAMAGED',
        label: item.label || item.code,
      }));
    }
    return [
      { code: 'GOOD' as const, label: 'Baik & Berfungsi Penuh' },
      { code: 'FAIR' as const, label: 'Cukup / Perlu Perawatan Ringan' },
      { code: 'DAMAGED' as const, label: 'Rusak / Dalam Perbaikan' },
    ];
  }, [rawLookups]);

  // Set default category & location
  useEffect(() => {
    if (categoryOptions.length > 0 && !addCategoryId) {
      setAddCategoryId(categoryOptions[0].id);
    }
    if (locationOptions.length > 0 && (!addRoom || addRoom === 'Aula Utama Lt. 1')) {
      setAddRoom(locationOptions[0].label);
    }
  }, [categoryOptions, locationOptions, addCategoryId, addRoom]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Assets from API
  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const res = await api.assets.getAll();
      if (res && res.assets) {
        setAssets(res.assets);
      } else if (res && res.data) {
        setAssets(res.data);
      }
    } catch (err: any) {
      showToast('Gagal memuat inventaris aset: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Loans from API
  const loadLoans = async () => {
    setIsLoadingLoans(true);
    try {
      const res = await api.assets.getLoans();
      if (res && res.loans) {
        setLoans(res.loans);
      } else if (res && res.data) {
        setLoans(res.data);
      }
    } catch (err: any) {
      showToast('Gagal memuat daftar peminjaman/sewa: ' + err.message);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  // Load Members from API
  const loadMembers = async () => {
    try {
      const res = await api.members.getAll({ limit: 'all' });
      if (res && res.members) {
        setMembersList(res.members);
      } else if (res && res.data) {
        setMembersList(res.data);
      }
    } catch (err: any) {
      console.warn('Members fetch fallback:', err);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadAssets(), loadLoans(), loadMembers()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Filter Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterType !== 'ALL' && a.asset_type !== filterType) return false;
      if (filterCondition !== 'ALL' && a.physical_condition !== filterCondition) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (a.asset_name || '').toLowerCase().includes(q);
        const matchCode = (a.asset_code || '').toLowerCase().includes(q);
        const matchRoom = (a.location_room || '').toLowerCase().includes(q);
        const matchCat = (a.category_label || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRoom && !matchCat) return false;
      }
      return true;
    });
  }, [assets, filterType, filterCondition, search]);

  // Pagination for catalog
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedAssets,
  } = usePagination(filteredAssets, { initialPageSize: 10 });

  // Requests Filtering & Pagination
  const pendingRequests = useMemo(() => loans.filter((l) => l.status === 'PENDING'), [loans]);
  const allRequests = useMemo(
    () =>
      loans.filter(
        (l) =>
          l.status === 'PENDING' ||
          l.status === 'APPROVED' ||
          l.status === 'REJECTED' ||
          (Boolean(l.request_code) && l.status !== 'ACTIVE' && l.status !== 'RETURNED' && l.status !== 'BORROWED')
      ),
    [loans]
  );

  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      if (filterRequestStatus !== 'ALL' && r.status !== filterRequestStatus) return false;
      if (searchRequest.trim()) {
        const q = searchRequest.toLowerCase();
        const matchCode = (r.request_code || '').toLowerCase().includes(q);
        const matchAssetCode = (r.asset_code || '').toLowerCase().includes(q);
        const matchAssetName = (r.asset_name || '').toLowerCase().includes(q);
        const matchBorrower =
          (r.borrower_name || '').toLowerCase().includes(q) || (r.member_full_name || '').toLowerCase().includes(q);
        const matchPhone =
          (r.borrower_phone || '').toLowerCase().includes(q) || (r.member_phone || '').toLowerCase().includes(q);
        const matchInst = (r.borrower_institution || '').toLowerCase().includes(q);
        const matchPurpose = (r.loan_purpose || '').toLowerCase().includes(q);
        if (!matchCode && !matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchInst && !matchPurpose)
          return false;
      }
      const loanDate = (r.borrowed_at || '').slice(0, 10);
      if (filterRequestDateFrom && loanDate < filterRequestDateFrom) return false;
      if (filterRequestDateTo && loanDate > filterRequestDateTo) return false;
      return true;
    });
  }, [allRequests, filterRequestStatus, searchRequest, filterRequestDateFrom, filterRequestDateTo]);

  const {
    currentPage: pageRequests,
    setCurrentPage: setPageRequests,
    pageSize: pageSizeRequests,
    setPageSize: setPageSizeRequests,
    totalPages: totalPagesRequests,
    paginatedItems: paginatedRequests,
  } = usePagination(filteredRequests, { initialPageSize: 10 });

  // Active Loans Filtering & Pagination
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'ACTIVE' || l.status === 'BORROWED'), [loans]);

  const filteredActiveLoans = useMemo(() => {
    return activeLoans.filter((l) => {
      if (filterActiveType !== 'ALL' && l.loan_type !== filterActiveType) return false;
      if (searchActiveLoan.trim()) {
        const q = searchActiveLoan.toLowerCase();
        const matchAssetCode = (l.asset_code || '').toLowerCase().includes(q);
        const matchAssetName = (l.asset_name || '').toLowerCase().includes(q);
        const matchBorrower =
          (l.borrower_name || '').toLowerCase().includes(q) || (l.member_full_name || '').toLowerCase().includes(q);
        const matchPhone =
          (l.borrower_phone || '').toLowerCase().includes(q) || (l.member_phone || '').toLowerCase().includes(q);
        const matchPurpose = (l.loan_purpose || '').toLowerCase().includes(q);
        const matchReq = (l.request_code || '').toLowerCase().includes(q);
        const matchRoom = (l.location_room || '').toLowerCase().includes(q);
        if (!matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchPurpose && !matchReq && !matchRoom)
          return false;
      }
      const loanDate = (l.borrowed_at || '').slice(0, 10);
      if (filterActiveDateFrom && loanDate < filterActiveDateFrom) return false;
      if (filterActiveDateTo && loanDate > filterActiveDateTo) return false;
      return true;
    });
  }, [activeLoans, filterActiveType, searchActiveLoan, filterActiveDateFrom, filterActiveDateTo]);

  const {
    currentPage: pageActiveLoans,
    setCurrentPage: setPageActiveLoans,
    pageSize: pageSizeActiveLoans,
    setPageSize: setPageSizeActiveLoans,
    totalPages: totalPagesActiveLoans,
    paginatedItems: paginatedActiveLoans,
  } = usePagination(filteredActiveLoans, { initialPageSize: 10 });

  // History Loans Filtering & Pagination
  const historyLoans = useMemo(() => loans.filter((l) => l.status === 'RETURNED'), [loans]);

  const filteredHistoryLoans = useMemo(() => {
    return historyLoans.filter((l) => {
      if (filterHistoryCondition !== 'ALL' && (l.condition_on_return || 'GOOD') !== filterHistoryCondition)
        return false;
      if (searchHistoryLoan.trim()) {
        const q = searchHistoryLoan.toLowerCase();
        const matchAssetCode = (l.asset_code || '').toLowerCase().includes(q);
        const matchAssetName = (l.asset_name || '').toLowerCase().includes(q);
        const matchBorrower =
          (l.borrower_name || '').toLowerCase().includes(q) || (l.member_full_name || '').toLowerCase().includes(q);
        const matchPhone =
          (l.borrower_phone || '').toLowerCase().includes(q) || (l.member_phone || '').toLowerCase().includes(q);
        const matchPurpose = (l.loan_purpose || '').toLowerCase().includes(q);
        const matchNotes = (l.notes || '').toLowerCase().includes(q);
        const matchReq = (l.request_code || '').toLowerCase().includes(q);
        if (!matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchPurpose && !matchNotes && !matchReq)
          return false;
      }
      const loanDate = (l.borrowed_at || '').slice(0, 10);
      if (filterHistoryDateFrom && loanDate < filterHistoryDateFrom) return false;
      if (filterHistoryDateTo && loanDate > filterHistoryDateTo) return false;
      return true;
    });
  }, [historyLoans, filterHistoryCondition, searchHistoryLoan, filterHistoryDateFrom, filterHistoryDateTo]);

  const {
    currentPage: pageHistoryLoans,
    setCurrentPage: setPageHistoryLoans,
    pageSize: pageSizeHistoryLoans,
    setPageSize: setPageSizeHistoryLoans,
    totalPages: totalPagesHistoryLoans,
    paginatedItems: paginatedHistoryLoans,
  } = usePagination(filteredHistoryLoans, { initialPageSize: 10 });

  // Aggregate stats
  const totalPhysicalUnits = useMemo(() => assets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0), [assets]);
  const totalAvailableUnits = useMemo(() => assets.reduce((sum, a) => sum + (Number(a.available_quantity) || 0), 0), [assets]);
  const totalInUseUnits = Math.max(0, totalPhysicalUnits - totalAvailableUnits);
  const totalBookValue = useMemo(() => assets.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0), [assets]);

  // History of loans for selected detailAsset
  const assetLoanHistory = useMemo(() => {
    if (!detailAsset) return [];
    if (detailAsset.loans && detailAsset.loans.length > 0) {
      return detailAsset.loans;
    }
    return loans.filter((l) => l.asset_id === detailAsset.id || l.asset_code === detailAsset.asset_code);
  }, [loans, detailAsset]);

  // Open detail modal
  const openDetailModal = async (asset: Asset) => {
    setDetailAsset(asset);
    setIsLoadingDetail(true);
    try {
      const res = await api.assets.getById(asset.id);
      if (res && res.asset) {
        setDetailAsset(res.asset);
      }
    } catch (err: any) {
      console.error('Failed to load asset detail from DB:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Add Asset Handlers
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      alert('Nama aset atau fasilitas wajib diisi.');
      return;
    }
    setIsSubmittingAdd(true);
    try {
      await api.assets.create({
        assetName: addName.trim(),
        assetType: addType,
        categoryId: addCategoryId || null,
        quantity: Math.max(1, addQty),
        physicalCondition: addCondition,
        purchasePrice: addPrice,
        rentalPrice: addRentalPrice,
        locationRoom: addRoom.trim(),
        isBorrowable: addBorrowable,
        notes: addNotes.trim() || null,
      });

      showToast(`Aset "${addName.trim()}" (${addQty} unit) berhasil didaftarkan!`);
      setShowAddModal(false);
      setAddName('');
      setAddQty(1);
      setAddPrice(0);
      setAddRentalPrice(0);
      setAddNotes('');
      await loadAll();
    } catch (err: any) {
      alert('Gagal mendaftarkan aset: ' + err.message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Asset Handlers
  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditName(asset.asset_name);
    setEditType(asset.asset_type || 'BARANG');
    setEditCategoryId(asset.category_id || (categoryOptions[0]?.id ?? ''));
    setEditQty(asset.quantity || 1);
    setEditCondition(asset.physical_condition || 'GOOD');
    setEditPrice(Number(asset.purchase_price) || 0);
    setEditRentalPrice(Number(asset.rental_price) || 0);
    setEditRoom(asset.location_room || 'Rumah Persekutuan');
    setEditBorrowable(asset.is_borrowable);
    setEditNotes(asset.notes || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    if (!editName.trim()) {
      alert('Nama aset wajib diisi.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      await api.assets.update(editingAsset.id, {
        assetName: editName.trim(),
        assetType: editType,
        categoryId: editCategoryId || null,
        quantity: Math.max(1, editQty),
        physicalCondition: editCondition,
        purchasePrice: editPrice,
        rentalPrice: editRentalPrice,
        locationRoom: editRoom.trim(),
        isBorrowable: editBorrowable,
        notes: editNotes.trim() || null,
      });

      showToast(`Data aset "${editName.trim()}" berhasil diperbarui!`);
      setEditingAsset(null);
      await loadAll();
    } catch (err: any) {
      alert('Gagal memperbarui aset: ' + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (asset: Asset) => {
    if (!window.confirm(`Yakin ingin menghapus aset "${asset.asset_name}" (${asset.asset_code}) dari inventaris yayasan?`)) {
      return;
    }
    try {
      await api.assets.delete(asset.id);
      showToast(`Aset "${asset.asset_name}" berhasil dihapus.`);
      await loadAll();
    } catch (err: any) {
      alert('Gagal menghapus aset: ' + err.message);
    }
  };

  // Borrow/Rent Handlers
  const openBorrowModal = (asset: Asset) => {
    setBorrowingAsset(asset);
    setLoanMode('PINJAM');
    setSelectedMemberId('');
    setBorrowerName('');
    setBorrowerPhone('');
    setLoanPurpose('');
    setLoanQty(1);
    setRentalFee(Number(asset.rental_price || 0));
    setBorrowedAt(new Date().toISOString().split('T')[0]);
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 3);
    setExpectedReturnAt(returnDate.toISOString().split('T')[0]);
    setLoanNotes('');
  };

  const handleModeChange = (mode: 'PINJAM' | 'SEWA') => {
    setLoanMode(mode);
    if (mode === 'PINJAM') {
      setRentalFee(0);
    } else if (borrowingAsset) {
      setRentalFee(Number(borrowingAsset.rental_price || 0) * loanQty);
    }
  };

  const handleLoanQtyChange = (qty: number) => {
    const clamped = Math.max(1, Math.min(qty, borrowingAsset?.available_quantity || 1));
    setLoanQty(clamped);
    if (loanMode === 'SEWA' && borrowingAsset) {
      setRentalFee(Number(borrowingAsset.rental_price || 0) * clamped);
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingAsset) return;
    if (!borrowerName.trim()) {
      alert('Nama peminjam atau penyewa wajib diisi.');
      return;
    }
    if (!loanPurpose.trim()) {
      alert('Keperluan atau nama acara wajib diisi.');
      return;
    }
    if (!expectedReturnAt) {
      alert('Batas tanggal pengembalian wajib ditentukan.');
      return;
    }

    setIsSubmittingLoan(true);
    try {
      await api.assets.createLoan({
        assetId: borrowingAsset.id,
        borrowerName: borrowerName.trim(),
        borrowerPhone: borrowerPhone.trim() || null,
        borrowerMemberId: selectedMemberId || null,
        loanPurpose: loanPurpose.trim(),
        loanType: loanMode,
        rentalFee: loanMode === 'SEWA' ? rentalFee : 0,
        borrowedAt,
        expectedReturnAt,
        quantityBorrowed: loanQty,
        notes: loanNotes.trim() || null,
      });

      showToast(`Pencatatan ${loanMode === 'SEWA' ? 'penyewaan' : 'peminjaman'} "${borrowingAsset.asset_name}" berhasil disimpan!`);
      setBorrowingAsset(null);
      await loadAll();
      setActiveTab('active_loans');
    } catch (err: any) {
      alert('Gagal mencatat peminjaman/sewa: ' + err.message);
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  // Return Handlers
  const openReturnModal = (loan: AssetLoan) => {
    setReturningLoan(loan);
    setActualReturnAt(new Date().toISOString().split('T')[0]);
    setConditionOnReturn('GOOD');
    setReturnNotes('');
  };

  const handleSaveReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningLoan) return;

    setIsSubmittingReturn(true);
    try {
      await api.assets.returnLoan(returningLoan.id, {
        actualReturnAt,
        conditionOnReturn,
        notes: returnNotes.trim() || undefined,
      });

      showToast(`Aset "${returningLoan.asset_name}" telah dikembalikan ke inventaris!`);
      setReturningLoan(null);
      await loadAll();
    } catch (err: any) {
      alert('Gagal memproses pengembalian: ' + err.message);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Online Requests Approval/Rejection/Handover Handlers
  const openApproveModal = (loan: AssetLoan) => {
    setApprovingLoan(loan);
    setApprovalNotes('Pengajuan disetujui. Silakan ambil unit di Sekretariat Rumah Persekutuan GMH.');
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingLoan) return;
    setIsSubmittingApproval(true);
    try {
      await api.assets.approveLoan(approvingLoan.id, {
        approvalNotes: approvalNotes.trim() || undefined,
      });
      showToast(`Permohonan ${approvingLoan.request_code || approvingLoan.asset_name} berhasil DISETUJUI!`);
      setApprovingLoan(null);
      await loadAll();
    } catch (err: any) {
      alert('Gagal menyetujui permohonan: ' + err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const openRejectModal = (loan: AssetLoan) => {
    setRejectingLoan(loan);
    setRejectionReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLoan) return;
    if (!rejectionReason.trim()) {
      alert('Alasan penolakan permohonan wajib diisi agar pemohon mengetahui keterangannya.');
      return;
    }
    setIsSubmittingRejection(true);
    try {
      await api.assets.rejectLoan(rejectingLoan.id, {
        rejectionReason: rejectionReason.trim(),
      });
      showToast(`Permohonan ${rejectingLoan.request_code || rejectingLoan.asset_name} telah DITOLAK.`);
      setRejectingLoan(null);
      await loadAll();
    } catch (err: any) {
      alert('Gagal menolak permohonan: ' + err.message);
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const handleHandoverLoan = async (loan: AssetLoan) => {
    if (
      !window.confirm(
        `Serahkan aset "${loan.asset_name}" (${loan.quantity_borrowed || 1} unit) kepada "${loan.borrower_name}"?\nStatus akan berubah menjadi AKTIF DIPINJAM.`
      )
    ) {
      return;
    }
    setIsSubmittingHandover(true);
    try {
      await api.assets.handoverLoan(loan.id);
      showToast(`Aset "${loan.asset_name}" telah diserahkan kepada ${loan.borrower_name}! Status aktif berjalan.`);
      await loadAll();
      setActiveTab('active_loans');
    } catch (err: any) {
      alert('Gagal menyerahkan aset: ' + err.message);
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-text">
          <h2>Inventaris &amp; Fasilitas Rumah Persekutuan</h2>
          <p>
            Katalog fasilitas sound system, alat musik, proyektor, serta pengelolaan sirkulasi peminjaman dan penyewaan ruangan GMH PA KMK
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link
            to="/pinjam-aset"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--gmh-gold)', color: 'var(--gmh-text)' }}
          >
            <ExternalLink size={14} color="var(--gmh-gold)" /> Portal Pemohon (Publik)
          </Link>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadAll}
            disabled={isLoading || isLoadingLoans}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading || isLoadingLoans ? 'spin' : ''} /> Segarkan
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Tambah Aset / Fasilitas
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Total Fisik Aset
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
            {totalPhysicalUnits} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Unit</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{assets.length} item terdaftar</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Tersedia di Gudang
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
            {totalAvailableUnits} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Unit</span>
          </div>
          <div style={{ fontSize: 12, color: '#047857', marginTop: 2, fontWeight: 500 }}>Siap pakai / dipinjamkan</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Sedang Dipinjam / Sewa
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
            {totalInUseUnits} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Unit</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{activeLoans.length} peminjaman aktif</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Nilai Buku Aset
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
            {formatRupiah(totalBookValue)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>Estimasi perolehan yayasan</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--gmh-border)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: 13.5,
            fontWeight: activeTab === 'catalog' ? 700 : 500,
            color: activeTab === 'catalog' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            borderBottom: activeTab === 'catalog' ? '3px solid var(--gmh-green-dark)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Package size={16} />
          Katalog Aset &amp; Fasilitas
          <span
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 12,
              background: activeTab === 'catalog' ? 'var(--gmh-green-dark)' : '#e2e8f0',
              color: activeTab === 'catalog' ? '#fff' : '#475569',
            }}
          >
            {assets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: 13.5,
            fontWeight: activeTab === 'requests' ? 700 : 500,
            color: activeTab === 'requests' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            borderBottom: activeTab === 'requests' ? '3px solid var(--gmh-green-dark)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Inbox size={16} />
          Permohonan Pinjaman
          {pendingRequests.length > 0 ? (
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#dc2626',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {pendingRequests.length} Menunggu
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 12,
                background: activeTab === 'requests' ? 'var(--gmh-green-dark)' : '#e2e8f0',
                color: activeTab === 'requests' ? '#fff' : '#475569',
              }}
            >
              {allRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active_loans')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: 13.5,
            fontWeight: activeTab === 'active_loans' ? 700 : 500,
            color: activeTab === 'active_loans' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            borderBottom: activeTab === 'active_loans' ? '3px solid var(--gmh-green-dark)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowRightLeft size={16} />
          Peminjaman &amp; Sewa Aktif
          {activeLoans.length > 0 && (
            <span
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 12,
                background: '#ea580c',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {activeLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: 13.5,
            fontWeight: activeTab === 'history' ? 700 : 500,
            color: activeTab === 'history' ? 'var(--gmh-green-dark)' : 'var(--gmh-text-muted)',
            borderBottom: activeTab === 'history' ? '3px solid var(--gmh-green-dark)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={16} />
          Riwayat Pengembalian
          <span
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 12,
              background: activeTab === 'history' ? 'var(--gmh-green-dark)' : '#e2e8f0',
              color: activeTab === 'history' ? '#fff' : '#475569',
            }}
          >
            {historyLoans.length}
          </span>
        </button>
      </div>

      {/* TAB 1: KATALOG ASET & FASILITAS */}
      {activeTab === 'catalog' && (
        <AssetCatalogTab
          assets={assets}
          filteredAssets={filteredAssets}
          paginatedAssets={paginatedAssets}
          isLoading={isLoading}
          search={search}
          setSearch={setSearch}
          filterType={filterType}
          setFilterType={setFilterType}
          filterCondition={filterCondition}
          setFilterCondition={setFilterCondition}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
          openDetailModal={openDetailModal}
          openBorrowModal={openBorrowModal}
          openEditModal={openEditModal}
          handleDeleteAsset={handleDeleteAsset}
        />
      )}

      {/* TAB 2: PERMOHONAN PINJAMAN */}
      {activeTab === 'requests' && (
        <AssetRequestsTab
          isLoadingLoans={isLoadingLoans}
          filteredRequests={filteredRequests}
          paginatedRequests={paginatedRequests}
          pendingRequestsCount={pendingRequests.length}
          searchRequest={searchRequest}
          setSearchRequest={setSearchRequest}
          filterRequestStatus={filterRequestStatus}
          setFilterRequestStatus={setFilterRequestStatus}
          filterRequestDateFrom={filterRequestDateFrom}
          setFilterRequestDateFrom={setFilterRequestDateFrom}
          filterRequestDateTo={filterRequestDateTo}
          setFilterRequestDateTo={setFilterRequestDateTo}
          pageRequests={pageRequests}
          totalPagesRequests={totalPagesRequests}
          pageSizeRequests={pageSizeRequests}
          setPageRequests={setPageRequests}
          setPageSizeRequests={setPageSizeRequests}
          openApproveModal={openApproveModal}
          openRejectModal={openRejectModal}
          handleHandoverLoan={handleHandoverLoan}
          isSubmittingHandover={isSubmittingHandover}
          setActiveTab={setActiveTab}
        />
      )}

      {/* TAB 3: PEMINJAMAN & SEWA AKTIF */}
      {activeTab === 'active_loans' && (
        <AssetActiveLoansTab
          isLoadingLoans={isLoadingLoans}
          activeLoans={activeLoans}
          filteredActiveLoans={filteredActiveLoans}
          paginatedActiveLoans={paginatedActiveLoans}
          searchActiveLoan={searchActiveLoan}
          setSearchActiveLoan={setSearchActiveLoan}
          filterActiveType={filterActiveType}
          setFilterActiveType={setFilterActiveType}
          filterActiveDateFrom={filterActiveDateFrom}
          setFilterActiveDateFrom={setFilterActiveDateFrom}
          filterActiveDateTo={filterActiveDateTo}
          setFilterActiveDateTo={setFilterActiveDateTo}
          pageActiveLoans={pageActiveLoans}
          totalPagesActiveLoans={totalPagesActiveLoans}
          pageSizeActiveLoans={pageSizeActiveLoans}
          setPageActiveLoans={setPageActiveLoans}
          setPageSizeActiveLoans={setPageSizeActiveLoans}
          openReturnModal={openReturnModal}
        />
      )}

      {/* TAB 4: RIWAYAT PENGEMBALIAN */}
      {activeTab === 'history' && (
        <AssetHistoryTab
          isLoadingLoans={isLoadingLoans}
          historyLoans={historyLoans}
          filteredHistoryLoans={filteredHistoryLoans}
          paginatedHistoryLoans={paginatedHistoryLoans}
          searchHistoryLoan={searchHistoryLoan}
          setSearchHistoryLoan={setSearchHistoryLoan}
          filterHistoryCondition={filterHistoryCondition}
          setFilterHistoryCondition={setFilterHistoryCondition}
          filterHistoryDateFrom={filterHistoryDateFrom}
          setFilterHistoryDateFrom={setFilterHistoryDateFrom}
          filterHistoryDateTo={filterHistoryDateTo}
          setFilterHistoryDateTo={setFilterHistoryDateTo}
          pageHistoryLoans={pageHistoryLoans}
          totalPagesHistoryLoans={totalPagesHistoryLoans}
          pageSizeHistoryLoans={pageSizeHistoryLoans}
          setPageHistoryLoans={setPageHistoryLoans}
          setPageSizeHistoryLoans={setPageSizeHistoryLoans}
        />
      )}

      {/* ALL MODALS */}
      <AssetModals
        detailAsset={detailAsset}
        setDetailAsset={setDetailAsset}
        isLoadingDetail={isLoadingDetail}
        assetLoanHistory={assetLoanHistory}
        openEditModal={openEditModal}
        openBorrowModal={openBorrowModal}
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        addName={addName}
        setAddName={setAddName}
        addType={addType}
        setAddType={setAddType}
        addCategoryId={addCategoryId}
        setAddCategoryId={setAddCategoryId}
        categoryOptions={categoryOptions}
        addQty={addQty}
        setAddQty={setAddQty}
        addCondition={addCondition}
        setAddCondition={setAddCondition}
        conditionOptions={conditionOptions}
        addPrice={addPrice}
        setAddPrice={setAddPrice}
        addRentalPrice={addRentalPrice}
        setAddRentalPrice={setAddRentalPrice}
        addRoom={addRoom}
        setAddRoom={setAddRoom}
        locationOptions={locationOptions}
        addBorrowable={addBorrowable}
        setAddBorrowable={setAddBorrowable}
        addNotes={addNotes}
        setAddNotes={setAddNotes}
        isSubmittingAdd={isSubmittingAdd}
        handleSaveAdd={handleSaveAdd}
        editingAsset={editingAsset}
        setEditingAsset={setEditingAsset}
        editName={editName}
        setEditName={setEditName}
        editType={editType}
        setEditType={setEditType}
        editCategoryId={editCategoryId}
        setEditCategoryId={setEditCategoryId}
        editQty={editQty}
        setEditQty={setEditQty}
        editCondition={editCondition}
        setEditCondition={setEditCondition}
        editPrice={editPrice}
        setEditPrice={setEditPrice}
        editRentalPrice={editRentalPrice}
        setEditRentalPrice={setEditRentalPrice}
        editRoom={editRoom}
        setEditRoom={setEditRoom}
        editBorrowable={editBorrowable}
        setEditBorrowable={setEditBorrowable}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        isSubmittingEdit={isSubmittingEdit}
        handleSaveEdit={handleSaveEdit}
        borrowingAsset={borrowingAsset}
        setBorrowingAsset={setBorrowingAsset}
        loanMode={loanMode}
        handleModeChange={handleModeChange}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        membersList={membersList}
        borrowerName={borrowerName}
        setBorrowerName={setBorrowerName}
        borrowerPhone={borrowerPhone}
        setBorrowerPhone={setBorrowerPhone}
        loanPurpose={loanPurpose}
        setLoanPurpose={setLoanPurpose}
        loanQty={loanQty}
        handleLoanQtyChange={handleLoanQtyChange}
        rentalFee={rentalFee}
        setRentalFee={setRentalFee}
        borrowedAt={borrowedAt}
        setBorrowedAt={setBorrowedAt}
        expectedReturnAt={expectedReturnAt}
        setExpectedReturnAt={setExpectedReturnAt}
        loanNotes={loanNotes}
        setLoanNotes={setLoanNotes}
        isSubmittingLoan={isSubmittingLoan}
        handleSaveLoan={handleSaveLoan}
        returningLoan={returningLoan}
        setReturningLoan={setReturningLoan}
        actualReturnAt={actualReturnAt}
        setActualReturnAt={setActualReturnAt}
        conditionOnReturn={conditionOnReturn}
        setConditionOnReturn={setConditionOnReturn}
        returnNotes={returnNotes}
        setReturnNotes={setReturnNotes}
        isSubmittingReturn={isSubmittingReturn}
        handleSaveReturn={handleSaveReturn}
        approvingLoan={approvingLoan}
        setApprovingLoan={setApprovingLoan}
        approvalNotes={approvalNotes}
        setApprovalNotes={setApprovalNotes}
        isSubmittingApproval={isSubmittingApproval}
        handleConfirmApprove={handleConfirmApprove}
        rejectingLoan={rejectingLoan}
        setRejectingLoan={setRejectingLoan}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isSubmittingRejection={isSubmittingRejection}
        handleConfirmReject={handleConfirmReject}
      />
    </div>
  );
};

export default AssetsPage;
