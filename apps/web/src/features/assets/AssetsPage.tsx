import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  X,
  Save,
  CheckCircle,
  Tag,
  MapPin,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Volume2,
  Music,
  Home,
  Layers,
  DollarSign,
  Phone,
  Check,
  Search,
  Clock,
  ExternalLink,
  Inbox,
  XCircle,
  CheckCheck,
  Eye,
  Info,
  ShieldCheck,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import NominalInput from '../../components/NominalInput';
import { formatRupiah } from '../../utils/currency';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';

export interface Asset {
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
  quantity: number;
  available_quantity: number;
  asset_type?: string;
  rental_price?: string | number;
  borrow_status?: string;
  notes?: string;
  loans?: AssetLoan[];
}

export interface AssetLoan {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_type?: string;
  location_room?: string;
  category_label?: string;
  borrower_name: string;
  borrower_phone?: string;
  borrower_email?: string;
  borrower_institution?: string;
  borrower_member_id?: string;
  member_full_name?: string;
  member_phone?: string;
  member_number?: string;
  loan_purpose: string;
  loan_type: 'PINJAM' | 'SEWA';
  rental_fee: string | number;
  borrowed_at: string;
  expected_return_at: string;
  actual_return_at?: string;
  condition_on_return?: 'GOOD' | 'FAIR' | 'DAMAGED';
  quantity_borrowed: number;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | 'BORROWED';
  request_code?: string;
  approval_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approver_name?: string;
  approver_email?: string;
  approved_at?: string;
  created_at: string;
}

const CONDITION_LABEL: Record<string, string> = {
  GOOD: 'Baik',
  FAIR: 'Cukup',
  DAMAGED: 'Rusak',
};

const ASSET_TYPES = [
  { code: 'SOUND_SYSTEM', label: 'Sound System & Audio', icon: Volume2 },
  { code: 'ALAT_MUSIK', label: 'Alat Musik & Band', icon: Music },
  { code: 'RUANGAN', label: 'Ruangan & Fasilitas Gedung', icon: Home },
  { code: 'MULTIMEDIA', label: 'Multimedia & Proyektor', icon: Layers },
  { code: 'GENSET_LISTRIK', label: 'Genset & Utilitas Listrik', icon: Package },
  { code: 'BARANG', label: 'Inventaris & Perlengkapan Umum', icon: Package },
];

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

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState('ALL');

  // Modals
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

  // Relational Database State: Members & Detail Asset Loading
  const [membersList, setMembersList] = useState<Array<{ id: string; member_number: string; full_name: string; phone_number?: string }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // 1. Dynamic asset category options derived from PostgreSQL system_lookups
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

  // 2. Dynamic asset location options derived from PostgreSQL system_lookups
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

  // 3. Dynamic physical condition options derived from PostgreSQL system_lookups
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

  // Load Loans from API (relational JOIN with assets, system_lookups, members, users)
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

  // Load Members from API for relational borrower linking
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

  // --------------------------------------------------------------------------
  // TAB: Online Requests Filtering & Pagination
  // --------------------------------------------------------------------------
  const pendingRequests = useMemo(() => loans.filter((l) => l.status === 'PENDING'), [loans]);
  const allRequests = useMemo(
    () => loans.filter((l) => l.status === 'PENDING' || l.status === 'APPROVED' || l.status === 'REJECTED' || (Boolean(l.request_code) && l.status !== 'ACTIVE' && l.status !== 'RETURNED' && l.status !== 'BORROWED')),
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
        const matchBorrower = (r.borrower_name || '').toLowerCase().includes(q) || (r.member_full_name || '').toLowerCase().includes(q);
        const matchPhone = (r.borrower_phone || '').toLowerCase().includes(q) || (r.member_phone || '').toLowerCase().includes(q);
        const matchInst = (r.borrower_institution || '').toLowerCase().includes(q);
        const matchPurpose = (r.loan_purpose || '').toLowerCase().includes(q);
        if (!matchCode && !matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchInst && !matchPurpose) return false;
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

  // --------------------------------------------------------------------------
  // TAB: Active Loans Filtering & Pagination
  // --------------------------------------------------------------------------
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'ACTIVE' || l.status === 'BORROWED'), [loans]);

  const filteredActiveLoans = useMemo(() => {
    return activeLoans.filter((l) => {
      if (filterActiveType !== 'ALL' && l.loan_type !== filterActiveType) return false;
      if (searchActiveLoan.trim()) {
        const q = searchActiveLoan.toLowerCase();
        const matchAssetCode = (l.asset_code || '').toLowerCase().includes(q);
        const matchAssetName = (l.asset_name || '').toLowerCase().includes(q);
        const matchBorrower = (l.borrower_name || '').toLowerCase().includes(q) || (l.member_full_name || '').toLowerCase().includes(q);
        const matchPhone = (l.borrower_phone || '').toLowerCase().includes(q) || (l.member_phone || '').toLowerCase().includes(q);
        const matchPurpose = (l.loan_purpose || '').toLowerCase().includes(q);
        const matchReq = (l.request_code || '').toLowerCase().includes(q);
        const matchRoom = (l.location_room || '').toLowerCase().includes(q);
        if (!matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchPurpose && !matchReq && !matchRoom) return false;
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

  // --------------------------------------------------------------------------
  // TAB: History Loans Filtering & Pagination
  // --------------------------------------------------------------------------
  const historyLoans = useMemo(() => loans.filter((l) => l.status === 'RETURNED'), [loans]);

  const filteredHistoryLoans = useMemo(() => {
    return historyLoans.filter((l) => {
      if (filterHistoryCondition !== 'ALL' && (l.condition_on_return || 'GOOD') !== filterHistoryCondition) return false;
      if (searchHistoryLoan.trim()) {
        const q = searchHistoryLoan.toLowerCase();
        const matchAssetCode = (l.asset_code || '').toLowerCase().includes(q);
        const matchAssetName = (l.asset_name || '').toLowerCase().includes(q);
        const matchBorrower = (l.borrower_name || '').toLowerCase().includes(q) || (l.member_full_name || '').toLowerCase().includes(q);
        const matchPhone = (l.borrower_phone || '').toLowerCase().includes(q) || (l.member_phone || '').toLowerCase().includes(q);
        const matchPurpose = (l.loan_purpose || '').toLowerCase().includes(q);
        const matchNotes = (l.notes || '').toLowerCase().includes(q);
        const matchReq = (l.request_code || '').toLowerCase().includes(q);
        if (!matchAssetCode && !matchAssetName && !matchBorrower && !matchPhone && !matchPurpose && !matchNotes && !matchReq) return false;
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

  // History of loans for selected detailAsset (prioritize direct relational loans from GET /assets/:id)
  const assetLoanHistory = useMemo(() => {
    if (!detailAsset) return [];
    if (detailAsset.loans && detailAsset.loans.length > 0) {
      return detailAsset.loans;
    }
    return loans.filter((l) => l.asset_id === detailAsset.id || l.asset_code === detailAsset.asset_code);
  }, [loans, detailAsset]);

  // Handler to open detail modal and fetch live relational record from PostgreSQL
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

  // --------------------------------------------------------------------------
  // Handlers: Add Asset
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Handlers: Edit Asset
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Handlers: Delete Asset
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Handlers: Borrow / Rent Asset
  // --------------------------------------------------------------------------
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
    // Default 3 days ahead
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

  // --------------------------------------------------------------------------
  // Handlers: Return Asset
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Handlers: Online Loan Requests Approvals & Handover
  // --------------------------------------------------------------------------
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
          <h2>Inventaris & Fasilitas Rumah Persekutuan</h2>
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
          Katalog Aset & Fasilitas
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
          Peminjaman & Sewa Aktif
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

      {/* ==================================================================== */}
      {/* TAB 1: KATALOG ASET & FASILITAS */}
      {/* ==================================================================== */}
      {activeTab === 'catalog' && (
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
          >
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={17} color="var(--gmh-gold)" /> Daftar Barang Inventaris, Ruangan & Alat Musik
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
                <option value="ALAT_MUSIK">Alat Musik & Band</option>
                <option value="RUANGAN">Ruangan & Fasilitas</option>
                <option value="MULTIMEDIA">Multimedia & Layar</option>
                <option value="GENSET_LISTRIK">Genset & Listrik</option>
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
                  <th style={{ minWidth: 230 }}>Nama Barang & Fasilitas</th>
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
      )}

      {/* ==================================================================== */}
      {/* TAB: PERMOHONAN PINJAMAN (ONLINE & ANGGOTA/ALUMNI) */}
      {/* ==================================================================== */}
      {activeTab === 'requests' && (
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
          >
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Inbox size={17} color="var(--gmh-gold)" /> Antrean & Riwayat Permohonan Pinjaman Aset Online
            </div>

            {/* Filter and Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 230 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--gmh-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari kode, nama aset, peminjam..."
                  value={searchRequest}
                  onChange={(e) => setSearchRequest(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 32, fontSize: 12.5, height: 34 }}
                />
              </div>

              <select
                className="form-select"
                value={filterRequestStatus}
                onChange={(e) => setFilterRequestStatus(e.target.value as any)}
                style={{ fontSize: 12.5, height: 34, width: 175 }}
              >
                <option value="ALL">Semua Status Permohonan</option>
                <option value="PENDING">Menunggu Review ({pendingRequests.length})</option>
                <option value="APPROVED">Disetujui (Siap Ambil)</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              {/* Filter Tanggal Dipinjam */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '3px 8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <Calendar size={13} color="var(--gmh-text-muted)" />
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>Pinjam:</span>
                <input
                  type="date"
                  className="form-input"
                  value={filterRequestDateFrom}
                  onChange={(e) => setFilterRequestDateFrom(e.target.value)}
                  title="Tanggal Pinjam Dari"
                  style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
                />
                <span style={{ fontSize: 11.5, color: '#94a3b8' }}>-</span>
                <input
                  type="date"
                  className="form-input"
                  value={filterRequestDateTo}
                  onChange={(e) => setFilterRequestDateTo(e.target.value)}
                  title="Tanggal Pinjam Sampai"
                  style={{ fontSize: 11.5, height: 28, padding: '2px 6px', width: 125 }}
                />
              </div>

              {(searchRequest || filterRequestStatus !== 'ALL' || filterRequestDateFrom || filterRequestDateTo) && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ height: 34, fontSize: 11.5, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => {
                    setSearchRequest('');
                    setFilterRequestStatus('ALL');
                    setFilterRequestDateFrom('');
                    setFilterRequestDateTo('');
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
                  <th style={{ width: 160, whiteSpace: 'nowrap' }}>No. Tiket & Tgl</th>
                  <th style={{ minWidth: 200 }}>Pemohon & Lembaga</th>
                  <th style={{ minWidth: 200 }}>Aset & Jumlah</th>
                  <th style={{ width: 180, whiteSpace: 'nowrap' }}>Skema & Durasi</th>
                  <th style={{ minWidth: 200 }}>Tujuan Penggunaan</th>
                  <th style={{ width: 165, textAlign: 'center', whiteSpace: 'nowrap' }}>Status Approval</th>
                  <th style={{ width: 180, textAlign: 'center', whiteSpace: 'nowrap' }}>Aksi Pengurus</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLoans ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                      Memuat antrean permohonan pinjaman...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--gmh-text-muted)' }}>
                      Tidak ada permohonan peminjaman aset yang sesuai filter saat ini.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => {
                    const isRent = req.loan_type === 'SEWA';
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';
                    const isActive = req.status === 'ACTIVE' || req.status === 'BORROWED';

                    return (
                      <tr key={req.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 12,
                              color: '#0369a1',
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              padding: '2px 7px',
                              borderRadius: 4,
                            }}
                          >
                            {req.request_code || `REQ-${req.id.slice(0, 8)}`}
                          </span>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            {new Date(req.created_at || req.borrowed_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 650, fontSize: 13.5, color: '#0f172a' }}>{req.borrower_name}</div>
                          {req.borrower_institution && (
                            <div style={{ fontSize: 11.5, color: '#475569', fontWeight: 500, marginTop: 1 }}>
                              {req.borrower_institution}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginTop: 3 }}>
                            {req.borrower_phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Phone size={10} color="#0284c7" /> {req.borrower_phone}
                              </span>
                            )}
                            {req.borrower_email && <span>• {req.borrower_email}</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{req.asset_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <code style={{ fontSize: 11, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '1px 5px', borderRadius: 4 }}>
                              {req.asset_code}
                            </code>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#047857' }}>
                              {req.quantity_borrowed || 1} Unit
                            </span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ marginBottom: 4 }}>
                            {isRent ? (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: 99,
                                  background: '#fffbeb',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                SEWA ({formatRupiah(Number(req.rental_fee || 0))})
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: 99,
                                  background: '#f0f9ff',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd',
                                }}
                              >
                                PINJAM PELAYANAN
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#334155' }}>
                            {new Date(req.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                            {new Date(req.expected_return_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5 }}>
                          <div style={{ color: '#0f172a', fontWeight: 500 }}>{req.loan_purpose}</div>
                          {req.notes && (
                            <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                              Catatan: {req.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {isPending && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: 99,
                                background: '#fffbeb',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Clock size={11} /> Menunggu Review
                            </span>
                          )}
                          {isApproved && (
                            <div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 99,
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <CheckCircle size={11} /> Disetujui (Siap Ambil)
                              </span>
                              {req.approval_notes && (
                                <div style={{ fontSize: 10.5, color: '#166534', marginTop: 3, maxWidth: 170, margin: '3px auto 0', whiteSpace: 'normal' }}>
                                  "{req.approval_notes}"
                                </div>
                              )}
                            </div>
                          )}
                          {isRejected && (
                            <div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 99,
                                  background: '#fef2f2',
                                  color: '#991b1b',
                                  border: '1px solid #fecaca',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <XCircle size={11} /> Ditolak
                              </span>
                              {req.rejection_reason && (
                                <div style={{ fontSize: 10.5, color: '#991b1b', marginTop: 3, maxWidth: 170, margin: '3px auto 0', whiteSpace: 'normal' }}>
                                  Alasan: {req.rejection_reason}
                                </div>
                              )}
                            </div>
                          )}
                          {isActive && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: 99,
                                background: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <ArrowRightLeft size={11} /> Sedang Digunakan
                            </span>
                          )}
                          {req.status === 'RETURNED' && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 9px',
                                borderRadius: 99,
                                background: '#ecfdf5',
                                color: '#065f46',
                                border: '1px solid #a7f3d0',
                              }}
                            >
                              Selesai Dikembalikan
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {isPending && (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 10px', fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 6 }}
                                onClick={() => openApproveModal(req)}
                              >
                                <CheckCircle size={12} /> Setujui
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 11.5,
                                  borderColor: '#fca5a5',
                                  color: '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6,
                                }}
                                onClick={() => openRejectModal(req)}
                              >
                                <XCircle size={12} /> Tolak
                              </button>
                            </div>
                          )}

                          {isApproved && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{
                                padding: '4px 10px',
                                fontSize: 11.5,
                                background: '#0284c7',
                                borderColor: '#0284c7',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                borderRadius: 6,
                              }}
                              onClick={() => handleHandoverLoan(req)}
                              disabled={isSubmittingHandover}
                            >
                              <CheckCheck size={13} /> Serahkan Aset
                            </button>
                          )}

                          {isActive && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 6 }}
                              onClick={() => {
                                setActiveTab('active_loans');
                              }}
                            >
                              Lihat di Peminjaman Aktif
                            </button>
                          )}

                          {isRejected && (
                            <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                              Tidak ada aksi lanjutan
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pageRequests}
            totalPages={totalPagesRequests}
            totalItems={filteredRequests.length}
            pageSize={pageSizeRequests}
            onPageChange={setPageRequests}
            onPageSizeChange={setPageSizeRequests}
            itemName="permohonan"
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PEMINJAMAN & SEWA AKTIF */}
      {/* ==================================================================== */}
      {activeTab === 'active_loans' && (
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
                  <th style={{ minWidth: 230 }}>Kode & Aset</th>
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
      )}

      {/* ==================================================================== */}
      {/* TAB 3: RIWAYAT PENGEMBALIAN */}
      {/* ==================================================================== */}
      {activeTab === 'history' && (
        <div className="card">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
          >
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={17} color="var(--gmh-green-dark)" /> Riwayat Pengembalian & Catatan Selesai Pinjam/Sewa
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
                  <th style={{ minWidth: 230 }}>Kode & Aset</th>
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
      )}

      {/* ==================================================================== */}
      {/* MODAL: DETAIL ASET & RIWAYAT PEMINJAMAN LENGKAP */}
      {/* ==================================================================== */}
      {detailAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setDetailAsset(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 880,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--gmh-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="card-header"
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--gmh-border)',
                background: 'var(--gmh-surface-2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={20} color="#047857" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, color: 'var(--gmh-text)' }}>
                      {detailAsset.asset_name}
                    </h3>
                    <code
                      style={{
                        fontSize: 12,
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                      }}
                    >
                      {detailAsset.asset_code}
                    </code>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span>{detailAsset.category_label || detailAsset.asset_type || 'Inventaris Umum'}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color="var(--gmh-brand)" /> {detailAsset.location_room || 'Rumah Persekutuan GMH'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setDetailAsset(null)}
                style={{ padding: '4px 8px', borderRadius: 6 }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {isLoadingDetail && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    padding: '8px 14px',
                    borderRadius: 6,
                    fontSize: 12,
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <RefreshCw size={13} className="spin" />
                  <span>Memuat relasi data aset...</span>
                </div>
              )}

              {/* 4 Metrics Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12 }}>
                {/* Stok Unit */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Stok & Ketersediaan
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {detailAsset.available_quantity ?? detailAsset.quantity} / {detailAsset.quantity || 1}{' '}
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>Unit</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: (detailAsset.available_quantity || 0) > 0 ? '#ecfdf5' : '#fef2f2',
                        color: (detailAsset.available_quantity || 0) > 0 ? '#065f46' : '#991b1b',
                        border: `1px solid ${(detailAsset.available_quantity || 0) > 0 ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {(detailAsset.available_quantity || 0) > 0 ? 'Tersedia di Gudang' : 'Kosong / Terpakai'}
                    </span>
                  </div>
                </div>

                {/* Kondisi Fisik */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Kondisi Fisik
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background:
                          detailAsset.physical_condition === 'GOOD'
                            ? '#ecfdf5'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#fffbeb'
                            : '#fef2f2',
                        color:
                          detailAsset.physical_condition === 'GOOD'
                            ? '#065f46'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#92400e'
                            : '#991b1b',
                        border: `1px solid ${
                          detailAsset.physical_condition === 'GOOD'
                            ? '#a7f3d0'
                            : detailAsset.physical_condition === 'FAIR'
                            ? '#fde68a'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      {CONDITION_LABEL[detailAsset.physical_condition] || detailAsset.physical_condition}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                    {detailAsset.physical_condition === 'GOOD'
                      ? 'Fungsi optimal & terawat'
                      : detailAsset.physical_condition === 'FAIR'
                      ? 'Perlu pembersihan berkala'
                      : 'Kerusakan komponen fisik'}
                  </div>
                </div>

                {/* Nilai Buku */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Nilai Buku / Perolehan
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {formatRupiah(Number(detailAsset.purchase_price || 0))}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {detailAsset.purchase_date
                      ? `Perolehan: ${new Date(detailAsset.purchase_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : 'Aset Tetap Yayasan GMH'}
                  </div>
                </div>

                {/* Ketentuan Sewa */}
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    Ketentuan Peminjaman
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                    {detailAsset.is_borrowable
                      ? Number(detailAsset.rental_price || 0) > 0
                        ? `${formatRupiah(Number(detailAsset.rental_price))} / hari`
                        : 'Bebas Biaya (Pelayanan)'
                      : 'Internal Saja'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {detailAsset.is_borrowable ? 'Dapat dipinjam atau disewa' : 'Khusus operasional internal GMH'}
                  </div>
                </div>
              </div>

              {/* Catatan Lengkap / Spesifikasi */}
              {detailAsset.notes && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <Info size={17} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>
                      Catatan Spesifikasi & Kondisi Aset
                    </div>
                    <div style={{ fontSize: 12.5, color: '#0c4a6e', marginTop: 3, lineHeight: 1.5 }}>
                      {detailAsset.notes}
                    </div>
                  </div>
                </div>
              )}

              {/* History Peminjaman Aset */}
              <div style={{ borderTop: '1px solid var(--gmh-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} color="var(--gmh-brand)" />
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gmh-text)' }}>
                      Riwayat Peminjaman & Sirkulasi Aset Ini
                    </h4>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: assetLoanHistory.length > 0 ? '#ecfdf5' : '#f1f5f9',
                        color: assetLoanHistory.length > 0 ? '#065f46' : '#64748b',
                        fontWeight: 700,
                        border: `1px solid ${assetLoanHistory.length > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                      }}
                    >
                      {assetLoanHistory.length} Riwayat
                    </span>
                  </div>

                  {detailAsset.is_borrowable && (detailAsset.available_quantity || 0) > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const target = detailAsset;
                        setDetailAsset(null);
                        openBorrowModal(target);
                      }}
                      style={{ fontSize: 11.5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 6 }}
                    >
                      <Plus size={13} /> Ajukan Pinjaman Aset Ini
                    </button>
                  )}
                </div>

                {assetLoanHistory.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 20px',
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <Clock size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, fontWeight: 650, color: '#334155' }}>
                      Belum Ada Riwayat Peminjaman
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                      Aset ini belum pernah dipinjamkan atau disewakan. Seluruh unit tersimpan aman di gudang inventaris.
                    </div>
                  </div>
                ) : (
                  <div
                    className="table-wrapper"
                    style={{ maxHeight: 270, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  >
                    <table className="table table-compact" style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ width: 135, whiteSpace: 'nowrap' }}>Tiket & Tgl</th>
                          <th style={{ minWidth: 160 }}>Peminjam / Lembaga</th>
                          <th style={{ width: 110, whiteSpace: 'nowrap' }}>Skema & Tarif</th>
                          <th style={{ minWidth: 160 }}>Keperluan Acara</th>
                          <th style={{ width: 140, whiteSpace: 'nowrap' }}>Durasi Pinjam</th>
                          <th style={{ width: 125, textAlign: 'center', whiteSpace: 'nowrap' }}>Status</th>
                          <th style={{ minWidth: 150 }}>Kondisi Saat Kembali</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetLoanHistory.map((lh) => {
                          const isRent = lh.loan_type === 'SEWA';
                          return (
                            <tr key={lh.id}>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: 11.5 }}>
                                  {lh.request_code || `LOAN-${lh.id.slice(0, 7).toUpperCase()}`}
                                </div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                                  {new Date(lh.borrowed_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{lh.borrower_name}</span>
                                  {lh.member_number && (
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
                                      {lh.member_number}
                                    </span>
                                  )}
                                </div>
                                {lh.borrower_institution && (
                                  <div style={{ fontSize: 11, color: '#475569' }}>{lh.borrower_institution}</div>
                                )}
                                {(lh.borrower_phone || lh.member_phone) && (
                                  <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>{lh.borrower_phone || lh.member_phone}</div>
                                )}
                                {lh.approver_name && (
                                  <div style={{ fontSize: 10, color: '#0369a1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <ShieldCheck size={11} color="#0284c7" /> Disetujui: <strong>{lh.approver_name}</strong>
                                  </div>
                                )}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: 99,
                                    background: isRent ? '#fffbeb' : '#f0f9ff',
                                    color: isRent ? '#92400e' : '#0369a1',
                                    border: `1px solid ${isRent ? '#fde68a' : '#bae6fd'}`,
                                  }}
                                >
                                  {isRent ? 'SEWA' : 'PINJAM'}
                                </span>
                                {isRent && Number(lh.rental_fee) > 0 && (
                                  <div style={{ fontSize: 10.5, color: '#92400e', fontWeight: 600, marginTop: 2 }}>
                                    {formatRupiah(Number(lh.rental_fee))}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{lh.loan_purpose}</div>
                                {lh.notes && (
                                  <div style={{ fontSize: 10.5, color: '#64748b', fontStyle: 'italic', marginTop: 2 }}>
                                    "{lh.notes}"
                                  </div>
                                )}
                              </td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                <div>
                                  {new Date(lh.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d
                                </div>
                                <div>
                                  {new Date(lh.expected_return_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    display: 'inline-block',
                                    background:
                                      lh.status === 'PENDING'
                                        ? '#fffbeb'
                                        : lh.status === 'APPROVED'
                                        ? '#f0fdf4'
                                        : lh.status === 'ACTIVE'
                                        ? '#f0f9ff'
                                        : lh.status === 'RETURNED'
                                        ? '#ecfdf5'
                                        : '#fef2f2',
                                    color:
                                      lh.status === 'PENDING'
                                        ? '#92400e'
                                        : lh.status === 'APPROVED'
                                        ? '#15803d'
                                        : lh.status === 'ACTIVE'
                                        ? '#0284c7'
                                        : lh.status === 'RETURNED'
                                        ? '#065f46'
                                        : '#991b1b',
                                    border: `1px solid ${
                                      lh.status === 'PENDING'
                                        ? '#fde68a'
                                        : lh.status === 'APPROVED'
                                        ? '#bbf7d0'
                                        : lh.status === 'ACTIVE'
                                        ? '#bae6fd'
                                        : lh.status === 'RETURNED'
                                        ? '#a7f3d0'
                                        : '#fecaca'
                                    }`,
                                  }}
                                >
                                  {lh.status === 'PENDING'
                                    ? 'Menunggu Review'
                                    : lh.status === 'APPROVED'
                                    ? 'Disetujui'
                                    : lh.status === 'ACTIVE'
                                    ? 'Sedang Dipakai'
                                    : lh.status === 'RETURNED'
                                    ? 'Dikembalikan'
                                    : 'Ditolak'}
                                </span>
                              </td>
                              <td style={{ fontSize: 11, color: '#475569' }}>
                                {lh.actual_return_at && (
                                  <div style={{ color: '#166534', fontWeight: 600 }}>
                                    Tgl Kembali:{' '}
                                    {new Date(lh.actual_return_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                )}
                                {lh.condition_on_return && (
                                  <div style={{ marginTop: 2 }}>
                                    Kondisi:{' '}
                                    <span style={{ fontWeight: 600 }}>
                                      {CONDITION_LABEL[lh.condition_on_return] || lh.condition_on_return}
                                    </span>
                                  </div>
                                )}
                                {!lh.actual_return_at && !lh.condition_on_return && (
                                  <span style={{ color: '#94a3b8' }}>Belum dikembalikan</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="card-footer"
              style={{
                padding: '12px 20px',
                background: 'var(--gmh-surface-2)',
                borderTop: '1px solid var(--gmh-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                ID Sistem:{' '}
                <code style={{ fontSize: 11, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                  {detailAsset.id}
                </code>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    const target = detailAsset;
                    setDetailAsset(null);
                    openEditModal(target);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
                >
                  <Edit2 size={13} /> Ubah Data Aset
                </button>
                {detailAsset.is_borrowable && (detailAsset.available_quantity || 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const target = detailAsset;
                      setDetailAsset(null);
                      openBorrowModal(target);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
                  >
                    <ArrowRightLeft size={13} /> Pinjam / Sewa Unit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setDetailAsset(null)}
                  style={{ borderRadius: 6 }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: TAMBAH ASET / FASILITAS BARU */}
      {/* ==================================================================== */}
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
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="var(--gmh-green-dark)" /> Daftarkan Aset, Fasilitas atau Ruangan Baru
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveAdd}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">
                    Nama Barang, Alat Musik, atau Ruangan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Speaker Portable Wireless 15 Inch / Keyboard Yamaha / Aula Lt. 2"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Tipe Sarana & Aset</label>
                    <select className="form-select" value={addType} onChange={(e) => setAddType(e.target.value)}>
                      {ASSET_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Kategori Inventaris</label>
                    <select
                      className="form-select"
                      value={addCategoryId}
                      onChange={(e) => setAddCategoryId(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Jumlah Unit / Stok Fisik <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Kondisi Fisik Barang</label>
                    <select
                      className="form-select"
                      value={addCondition}
                      onChange={(e) => setAddCondition(e.target.value as any)}
                    >
                      {conditionOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Nilai Buku / Perolehan (Rp)</label>
                    <NominalInput value={addPrice} onChange={setAddPrice} />
                  </div>

                  <div>
                    <label className="form-label">Tarif Sewa / Hari (Rp) (Opsional)</label>
                    <NominalInput value={addRentalPrice} onChange={setAddRentalPrice} />
                    <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Isi 0 jika hanya untuk dipinjam gratis</span>
                  </div>
                </div>

                <div>
                  <label className="form-label">Lokasi Penempatan Ruangan</label>
                  <select
                    className="form-select"
                    value={addRoom}
                    onChange={(e) => setAddRoom(e.target.value)}
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc.id} value={loc.label}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    id="addBorrowable"
                    checked={addBorrowable}
                    onChange={(e) => setAddBorrowable(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="addBorrowable" style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Aset ini dapat dipinjamkan atau disewakan (Mahasiswa / Alumni / Eksternal)
                  </label>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Spesifikasi teknis, nomor seri, atau kelengkapan..."
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingAdd}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingAdd}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingAdd ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDIT ASET (GANTI JUMLAH, KONDISI, TARIF SEWA, DSB) */}
      {/* ==================================================================== */}
      {editingAsset && (
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
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={18} color="var(--gmh-green-dark)" /> Edit Data Aset, Jumlah & Kondisi
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setEditingAsset(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, fontSize: 12.5 }}>
                  <strong>Kode Aset:</strong> <code>{editingAsset.asset_code}</code> •{' '}
                  <strong>Stok Tersedia Saat Ini:</strong> {editingAsset.available_quantity ?? editingAsset.quantity} dari{' '}
                  {editingAsset.quantity} unit
                </div>

                <div>
                  <label className="form-label">
                    Nama Barang / Fasilitas <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Tipe Sarana & Aset</label>
                    <select className="form-select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                      {ASSET_TYPES.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Kategori Inventaris</label>
                    <select
                      className="form-select"
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                    >
                      <option value="">Pilih Kategori</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Perubahan Jumlah & Kondisi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Total Jumlah Unit Fisik <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editQty}
                      onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="form-input"
                      required
                    />
                    <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                      Mengubah total unit akan otomatis menyesuaikan stok unit tersedia.
                    </span>
                  </div>

                  <div>
                    <label className="form-label">
                      Kondisi Fisik Saat Ini <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as any)}
                    >
                      {conditionOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Nilai Buku / Perolehan (Rp)</label>
                    <NominalInput value={editPrice} onChange={setEditPrice} />
                  </div>

                  <div>
                    <label className="form-label">Tarif Sewa / Hari (Rp)</label>
                    <NominalInput value={editRentalPrice} onChange={setEditRentalPrice} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Lokasi Penempatan Ruangan</label>
                  <select
                    className="form-select"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                  >
                    {locationOptions.map((loc) => (
                      <option key={loc.id} value={loc.label}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <input
                    type="checkbox"
                    id="editBorrowable"
                    checked={editBorrowable}
                    onChange={(e) => setEditBorrowable(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="editBorrowable" style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Aset ini dapat dipinjamkan atau disewakan (Mahasiswa / Alumni / Eksternal)
                  </label>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingAsset(null)}
                  disabled={isSubmittingEdit}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingEdit}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: FORM PEMINJAMAN & PENYEWAAN ASET / RUANGAN */}
      {/* ==================================================================== */}
      {borrowingAsset && (
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
          <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowRightLeft size={18} color="#047857" /> Form Peminjaman & Penyewaan Aset / Ruangan
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setBorrowingAsset(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveLoan}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Asset Summary Info */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '12px 14px',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>
                    {borrowingAsset.asset_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d', marginTop: 3 }}>
                    <code>{borrowingAsset.asset_code}</code> • Lokasi: {borrowingAsset.location_room || 'Rumah Persekutuan'} •{' '}
                    <strong>Tersedia: {borrowingAsset.available_quantity} Unit</strong>
                  </div>
                </div>

                {/* Mode Selector: PINJAM vs SEWA */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Pilih Skema Pemakaian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div
                      onClick={() => handleModeChange('PINJAM')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: loanMode === 'PINJAM' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: loanMode === 'PINJAM' ? '#f0f9ff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1' }}>📌 Pinjam (Bebas Biaya)</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        Untuk kegiatan internal pelayanan persekutuan mahasiswa/alumni GMH.
                      </div>
                    </div>

                    <div
                      onClick={() => handleModeChange('SEWA')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: loanMode === 'SEWA' ? '2px solid #d97706' : '1px solid #e2e8f0',
                        background: loanMode === 'SEWA' ? '#fffbeb' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#b45309' }}>🏷️ Sewa (Berbayar)</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                        Untuk pihak eksternal, resepsi, seminar umum, atau acara komersial alumni.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Pilih Anggota / Alumni Yayasan (Opsional)
                  </label>
                  <select
                    className="form-select"
                    value={selectedMemberId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedMemberId(mId);
                      if (mId) {
                        const m = membersList.find((mem) => mem.id === mId);
                        if (m) {
                          setBorrowerName(m.full_name);
                          if (m.phone_number) setBorrowerPhone(m.phone_number);
                        }
                      }
                    }}
                  >
                    <option value="">-- Non-Anggota / Pemohon Eksternal (Input Manual di Bawah) --</option>
                    {membersList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.member_number || 'Anggota'}) {m.phone_number ? `• ${m.phone_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Nama Peminjam / Penyewa / Instansi <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: dr. Raymond Situmorang / Panitia Natal FK"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={borrowerPhone}
                      onChange={(e) => setBorrowerPhone(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Keperluan Acara / Tujuan Penggunaan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibadah Padang Mahasiswa / Seminar Medis / Latihan Band"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Jumlah Unit Dipinjam/Sewa (Maks: {borrowingAsset.available_quantity})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={borrowingAsset.available_quantity}
                      value={loanQty}
                      onChange={(e) => handleLoanQtyChange(parseInt(e.target.value, 10) || 1)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      {loanMode === 'SEWA' ? 'Total Biaya Sewa (Rp)' : 'Biaya Peminjaman'}
                    </label>
                    {loanMode === 'SEWA' ? (
                      <NominalInput value={rentalFee} onChange={setRentalFee} />
                    ) : (
                      <input
                        type="text"
                        value="Gratis (Pelayanan)"
                        disabled
                        className="form-input"
                        style={{ background: '#f1f5f9', color: '#64748b' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Tanggal Mulai Pemakaian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={borrowedAt}
                      onChange={(e) => setBorrowedAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Batas Waktu Pengembalian <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={expectedReturnAt}
                      onChange={(e) => setExpectedReturnAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Kelengkapan kabel, mic tambahan, atau instruksi serah terima..."
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setBorrowingAsset(null)}
                  disabled={isSubmittingLoan}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingLoan}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> {isSubmittingLoan ? 'Memproses...' : 'Simpan Transaksi Sirkulasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: PENGEMBALIAN ASET / SELESAI SEWA */}
      {/* ==================================================================== */}
      {returningLoan && (
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
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={18} color="#16a34a" /> Konfirmasi Pengembalian Aset / Selesai Sewa
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setReturningLoan(null)} style={{ padding: '2px 8px' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveReturn}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{returningLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Peminjam: <strong>{returningLoan.borrower_name}</strong> • Jumlah:{' '}
                    <strong>{returningLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Tujuan: {returningLoan.loan_purpose}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">
                      Tanggal Pengembalian Sebenarnya <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={actualReturnAt}
                      onChange={(e) => setActualReturnAt(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Kondisi Fisik Saat Kembali <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={conditionOnReturn}
                      onChange={(e) => setConditionOnReturn(e.target.value as any)}
                    >
                      <option value="GOOD">Baik (Lengkap & Utuh)</option>
                      <option value="FAIR">Cukup (Sedikit Baret / Aus)</option>
                      <option value="DAMAGED">Rusak / Tidak Berfungsi Normal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Pemeriksaan Fisik & Kelengkapan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Kabel dan remote dicek lengkap, mic berfungsi lancar..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#15803d',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: 6,
                  }}
                >
                  ✓ Stok tersedia di inventaris akan otomatis dipulihkan sebanyak{' '}
                  <strong>{returningLoan.quantity_borrowed || 1} unit</strong>.
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setReturningLoan(null)}
                  disabled={isSubmittingReturn}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingReturn}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={14} /> {isSubmittingReturn ? 'Menyimpan...' : 'Konfirmasi Aset Diterima Kembali'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: APPROVE ONLINE LOAN REQUEST */}
      {/* ==================================================================== */}
      {approvingLoan && (
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
          <div className="card" style={{ width: '100%', maxWidth: 520 }}>
            <div className="card-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} color="#15803d" /> Setujui Permohonan Pinjaman Aset
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setApprovingLoan(null)}
                style={{ padding: '2px 8px' }}
                disabled={isSubmittingApproval}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleConfirmApprove}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0369a1' }}>
                      {approvingLoan.request_code || `REQ-${approvingLoan.id.slice(0, 8)}`}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: 11 }}>
                      {approvingLoan.loan_type === 'SEWA' ? 'Penyewaan' : 'Peminjaman Pelayanan'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginTop: 4 }}>{approvingLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text)', marginTop: 2 }}>
                    Pemohon: <strong>{approvingLoan.borrower_name}</strong>
                    {approvingLoan.borrower_institution ? ` (${approvingLoan.borrower_institution})` : ''} • Jumlah:{' '}
                    <strong>{approvingLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Periode: {new Date(approvingLoan.borrowed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                    {new Date(approvingLoan.expected_return_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    Keperluan: {approvingLoan.loan_purpose}
                  </div>
                </div>

                <div>
                  <label className="form-label">Catatan Persetujuan & Lokasi / Jam Pengambilan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Pengajuan disetujui. Silakan ambil unit di Sekretariat Rumah Persekutuan GMH sebelum jam 17:00..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="form-input"
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                    Catatan ini akan langsung terlihat oleh pemohon di portal status tracking mereka.
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: '#15803d',
                    background: '#f0fdf4',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #bbf7d0',
                  }}
                >
                  ✓ Menyetujui permohonan ini akan otomatis mengalokasikan{' '}
                  <strong>{approvingLoan.quantity_borrowed || 1} unit</strong> dari stok inventaris yang tersedia.
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setApprovingLoan(null)}
                  disabled={isSubmittingApproval}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingApproval}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle size={14} /> {isSubmittingApproval ? 'Memproses...' : 'Konfirmasi Setujui Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REJECT ONLINE LOAN REQUEST */}
      {/* ==================================================================== */}
      {rejectingLoan && (
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
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={18} color="#dc2626" /> Tolak Permohonan Pinjaman Aset
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setRejectingLoan(null)}
                style={{ padding: '2px 8px' }}
                disabled={isSubmittingRejection}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleConfirmReject}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fef2f2', padding: '12px 14px', borderRadius: 8, border: '1px solid #fee2e2' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#991b1b' }}>
                    {rejectingLoan.request_code || `REQ-${rejectingLoan.id.slice(0, 8)}`}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>{rejectingLoan.asset_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text)', marginTop: 2 }}>
                    Pemohon: <strong>{rejectingLoan.borrower_name}</strong> • Jumlah:{' '}
                    <strong>{rejectingLoan.quantity_borrowed || 1} Unit</strong>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Alasan Penolakan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Mohon maaf, jadwal pemakaian bentrok dengan Ibadah Raya / alat sedang dalam perbaikan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="form-input"
                    required
                  />
                  <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 4 }}>
                    Alasan ini wajib diisi dan akan terbaca oleh pemohon saat melacak tiket permohonan mereka.
                  </div>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setRejectingLoan(null)}
                  disabled={isSubmittingRejection}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingRejection}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', borderColor: '#dc2626' }}
                >
                  <XCircle size={14} /> {isSubmittingRejection ? 'Menyimpan...' : 'Konfirmasi Tolak Permohonan'}
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
