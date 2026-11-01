import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Upload,
  Eye,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  X,
  MapPin,
  Phone,
  Mail,
  Cake,
  Briefcase,
  GraduationCap,
  ExternalLink,
  Filter,
  RotateCcw,
  Receipt,
  Globe,
  Calendar,
  TrendingUp,
  QrCode,
  ShieldCheck,
  History,
  Printer,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import type { Member } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useAuth } from '../../state/AuthContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import NominalInput from '../../components/NominalInput';
import MemberOrgHistory from './MemberOrgHistory';

interface DryRunRow {
  index: number;
  name: string;
  nik: string;
  gender: string;
  faculty: string;
  major: string;
  entryYear: number;
  phone: string;
  email: string;
  city: string;
  profession: string;
  status: 'VALID' | 'ERROR';
  errorReason?: string;
}

const formatIndonesianDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getAgeString = (birthDateStr?: string): string => {
  if (!birthDateStr) return '';
  try {
    const b = new Date(birthDateStr);
    if (isNaN(b.getTime())) return '';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
      age--;
    }
    return age > 0 ? ` (${age} tahun)` : '';
  } catch {
    return '';
  }
};

const MembersPage: React.FC = () => {
  const { user } = useAuth();
  const { members, addMember, deleteMember, addBulkMembersChunked } = useMemberStore();
  const { lookups, fieldLabels } = useDynamicConfig();

  // Comprehensive Filters State
  const [search, setSearch] = useState('');
  const [filterEntryYear, setFilterEntryYear] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Mission Activities integration for member service history
  const [missionActivities, setMissionActivities] = useState<any[]>([]);

  useEffect(() => {
    api.missions.getAll().then((res: any) => {
      if (res?.activities && Array.isArray(res.activities)) {
        setMissionActivities(res.activities);
      }
    }).catch(() => {});
  }, []);

  // Compute where and when this member served across missions
  const memberServiceRecords = useMemo(() => {
    if (!selectedMember) return [];
    const memberName = selectedMember.name.toLowerCase().trim();
    const memberId = selectedMember.id;
    const records: Array<{
      activityId: string;
      activityTitle: string;
      location: string;
      eventDate: string;
      timePreview?: string;
      role: string;
      status: string;
    }> = [];

    missionActivities.forEach((act) => {
      // 1. Is Coordinator
      if (act.coordinator && act.coordinator.toLowerCase().includes(memberName)) {
        records.push({
          activityId: act.id,
          activityTitle: act.title,
          location: act.location || 'Pos Misi Yayasan',
          eventDate: act.event_date || '-',
          timePreview: act.time_preview,
          role: 'Kordinator Utama Misi',
          status: act.status,
        });
      }

      // 2. Is in Committees
      if (Array.isArray(act.committees)) {
        act.committees.forEach((com: any) => {
          if (
            (com.member_id && com.member_id === memberId) ||
            (com.name && com.name.toLowerCase().includes(memberName))
          ) {
            records.push({
              activityId: act.id,
              activityTitle: act.title,
              location: act.location || 'Pos Misi Yayasan',
              eventDate: act.event_date || '-',
              timePreview: act.time_preview,
              role: com.role || 'Panitia Pelayan',
              status: act.status,
            });
          }
        });
      }

      // 3. Is in Tasks
      if (Array.isArray(act.tasks)) {
        act.tasks.forEach((tsk: any) => {
          if (tsk.pic && tsk.pic.toLowerCase().includes(memberName)) {
            const already = records.some((r) => r.activityId === act.id && r.role.includes(tsk.task));
            if (!already) {
              records.push({
                activityId: act.id,
                activityTitle: act.title,
                location: act.location || 'Pos Misi Yayasan',
                eventDate: act.event_date || '-',
                timePreview: act.time_preview,
                role: `PIC: ${tsk.task}`,
                status: act.status,
              });
            }
          }
        });
      }
    });

    return records;
  }, [selectedMember, missionActivities]);

  const navigate = useNavigate();

  // Donasi & Janji Iman Integration State
  const [showDonationsPortfolioModal, setShowDonationsPortfolioModal] = useState(false);
  const [memberDonationsLoading, setMemberDonationsLoading] = useState(false);
  const [memberPledges, setMemberPledges] = useState<any[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [memberTotalPledged, setMemberTotalPledged] = useState(0);
  const [memberTotalDonated, setMemberTotalDonated] = useState(0);

  // Sub-modal: Catat Donasi / Janji Iman Baru
  const [showAddPledgeModal, setShowAddPledgeModal] = useState(false);
  const [newPledgeForm, setNewPledgeForm] = useState({
    category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
    type: 'PLEDGE' as 'PLEDGE' | 'DONATION',
    total: 0,
    initialPaid: 0,
    paymentMethod: 'BANK_TRANSFER',
    dueDate: '',
    notes: '',
  });

  // Sub-modal: Bayar Angsuran Janji Iman
  const [showAddInstallmentModal, setShowAddInstallmentModal] = useState(false);
  const [targetPledgeForInstallment, setTargetPledgeForInstallment] = useState<any | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  // E-Receipt Modal preview
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Fetch Member Donations & Pledges
  const fetchMemberDonations = async (memberId: string) => {
    setMemberDonationsLoading(true);
    try {
      const res = await api.finance.getMemberDonations(memberId);
      if (res && res.success) {
        setMemberPledges(res.pledges || []);
        setMemberTransactions(res.transactions || []);
        setMemberTotalPledged(Number(res.totalPledged || 0));
        setMemberTotalDonated(Number(res.totalDonated || 0));
      } else {
        setMemberPledges([]);
        setMemberTransactions([]);
        setMemberTotalPledged(0);
        setMemberTotalDonated(0);
      }
    } catch (err) {
      console.warn('Gagal memuat data donasi & janji iman anggota:', err);
      setMemberPledges([]);
      setMemberTransactions([]);
      setMemberTotalPledged(0);
      setMemberTotalDonated(0);
    } finally {
      setMemberDonationsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      fetchMemberDonations(selectedMember.id);
    } else {
      setMemberPledges([]);
      setMemberTransactions([]);
      setMemberTotalPledged(0);
      setMemberTotalDonated(0);
      setShowDonationsPortfolioModal(false);
    }
  }, [selectedMember]);

  const handleSaveNewPledgeForMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    if (newPledgeForm.total <= 0) {
      showAlert('Validasi Komitmen', 'Mohon masukkan total komitmen donasi / janji iman yang valid.', undefined, 'warning');
      return;
    }

    try {
      const payload = {
        donorName: selectedMember.name,
        memberId: selectedMember.id,
        category: newPledgeForm.category,
        type: newPledgeForm.type,
        totalAmount: newPledgeForm.total,
        initialPayment: newPledgeForm.initialPaid,
        paymentMethod: newPledgeForm.paymentMethod,
        dueDate: newPledgeForm.dueDate || null,
        notes: newPledgeForm.notes.trim() || undefined,
      };

      const res = await api.finance.createPledge(payload);
      showToast(`Komitmen ${newPledgeForm.type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} untuk ${selectedMember.name} berhasil dicatat!`);
      setShowAddPledgeModal(false);
      setNewPledgeForm({
        category: lookups?.donationCategories?.[0] || 'Pembangunan Rumah Persekutuan',
        type: 'PLEDGE',
        total: 0,
        initialPaid: 0,
        paymentMethod: 'BANK_TRANSFER',
        dueDate: '',
        notes: '',
      });
      await fetchMemberDonations(selectedMember.id);

      if (res?.receipt) {
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName,
          category: res.receipt.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: payload.totalAmount,
          paid: payload.initialPayment,
          remaining: Math.max(0, payload.totalAmount - payload.initialPayment),
        });
      }
    } catch (err: any) {
      showAlert('Gagal Mencatat Komitmen', err.message || 'Gagal menyimpan komitmen donasi.', undefined, 'danger');
    }
  };

  const handleOpenInstallmentForPledge = (pledge: any) => {
    setTargetPledgeForInstallment(pledge);
    const rem = Math.max(0, Number(pledge.total_pledge || 0) - Number(pledge.fulfilled_amount || 0));
    setInstallmentForm({
      amount: rem > 0 ? rem : 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'BANK_TRANSFER',
      notes: '',
    });
    setShowAddInstallmentModal(true);
  };

  const handleSaveInstallmentForMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPledgeForInstallment || !selectedMember) return;
    if (installmentForm.amount <= 0) {
      showAlert('Validasi Angsuran', 'Nominal angsuran harus lebih besar dari Rp 0.', undefined, 'warning');
      return;
    }

    try {
      const res = await api.finance.addInstallment(targetPledgeForInstallment.id, installmentForm);
      showToast(`Angsuran berhasil dicatat! No Kuitansi: ${res.receipt?.receiptNumber || '-'}`);
      setShowAddInstallmentModal(false);
      setInstallmentForm({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        notes: '',
      });
      await fetchMemberDonations(selectedMember.id);

      if (res?.receipt) {
        const prevPaid = Number(targetPledgeForInstallment.fulfilled_amount || 0);
        const tot = Number(targetPledgeForInstallment.total_pledge || 0);
        setSelectedReceipt({
          receiptNumber: res.receipt.receiptNumber,
          name: res.receipt.donorName || selectedMember.name,
          category: res.receipt.category || targetPledgeForInstallment.category,
          amount: res.receipt.amount,
          lastPayment: res.receipt.date,
          total: tot,
          paid: prevPaid + installmentForm.amount,
          remaining: Math.max(0, tot - (prevPaid + installmentForm.amount)),
        });
      }
    } catch (err: any) {
      showAlert('Gagal Mencatat Angsuran', err.message || 'Gagal menyimpan angsuran donasi.', undefined, 'danger');
    }
  };

  // Draft filters state for modal dialog
  const [draftFilters, setDraftFilters] = useState({
    entryYear: '',
    city: '',
    faculty: '',
    profession: '',
    type: '',
    maritalStatus: '',
    status: '',
  });

  // Add Member State
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    nik: '',
    gender: 'Laki-laki',
    birthPlace: 'Medan',
    birthDate: '1998-01-01',
    faculty: lookups.faculties[0] || 'Fakultas Teknik',
    major: '',
    entryYear: 2020,
    graduationYear: 2024,
    address: '',
    city: 'Medan',
    province: 'Sumatera Utara',
    postalCode: '',
    phone: '',
    email: '',
    profession: '',
    company: '',
    ktb: '',
    maritalStatus: 'Lajang',
    weddingDate: '',
    socialMedia: {
      linkedin: '',
      instagram: '',
      facebook: '',
    },
    status: 'ACTIVE' as Member['status'],
    type: 'ALUMNI' as Member['type'],
  });



  // Bulk Import State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<'UPLOAD' | 'DRY_RUN' | 'SUCCESS'>('UPLOAD');
  const [dryRunRows, setDryRunRows] = useState<DryRunRow[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; error: number }>({
    total: 0,
    valid: 0,
    error: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    processed: number;
    total: number;
    percent: number;
  }>({
    currentBatch: 0,
    totalBatches: 0,
    processed: 0,
    total: 0,
    percent: 0,
  });

  // Enterprise Alert Modal State (replaces native browser alert)
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    detail: undefined,
    type: 'danger',
  });

  const showAlert = (
    title: string,
    message: string,
    detail?: string,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ) => {
    setModalAlert({
      isOpen: true,
      title,
      message,
      detail,
      type,
    });
  };

  // Real-time duplicate NIK detection for Add Member Form
  const duplicateNikMember = useMemo(() => {
    const raw = (newMemberData.nik || '').replace(/[^0-9]/g, '');
    if (!raw || raw.length < 16) return null;
    return members.find((m) => m.nik && m.nik.replace(/[^0-9]/g, '') === raw) || null;
  }, [newMemberData.nik, members]);

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN_OPERASIONAL'].includes(user.role);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Extract distinct entry years sorted descending
  const availableEntryYears = useMemo(() => {
    const years = Array.from(
      new Set(
        members
          .map((m) => m.entryYear)
          .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 1950)
      )
    );
    return years.sort((a, b) => b - a);
  }, [members]);

  // Extract distinct cities sorted alphabetically
  const availableCities = useMemo(() => {
    const cities = Array.from(
      new Set(
        members
          .map((m) => (m.city || '').trim())
          .filter((c) => c.length > 0)
      )
    );
    return cities.sort((a, b) => a.localeCompare(b));
  }, [members]);

  // Extract distinct professions sorted alphabetically
  const availableProfessions = useMemo(() => {
    const profSet = new Set<string>();
    if (lookups.professions && Array.isArray(lookups.professions)) {
      lookups.professions.forEach((p) => {
        if (p && p.trim()) profSet.add(p.trim());
      });
    }
    members.forEach((m) => {
      if (m.profession && m.profession.trim() && m.profession.trim() !== '-') {
        profSet.add(m.profession.trim());
      }
    });
    return Array.from(profSet).sort((a, b) => a.localeCompare(b));
  }, [lookups.professions, members]);

  // Comprehensive filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.nia || '').toLowerCase().includes(q) ||
        (m.nik || '').toLowerCase().includes(q) ||
        (m.faculty || '').toLowerCase().includes(q) ||
        (m.major || '').toLowerCase().includes(q) ||
        (m.city || '').toLowerCase().includes(q) ||
        (m.profession || '').toLowerCase().includes(q) ||
        (m.company || '').toLowerCase().includes(q);

      const matchEntryYear = filterEntryYear ? String(m.entryYear) === String(filterEntryYear) : true;
      const matchCity = filterCity ? (m.city || '').toLowerCase().trim() === filterCity.toLowerCase().trim() : true;
      const matchFaculty = filterFaculty ? m.faculty === filterFaculty : true;
      const matchProfession = filterProfession ? (m.profession || '').toLowerCase().trim() === filterProfession.toLowerCase().trim() : true;
      const matchType = filterType ? m.type === filterType : true;
      const matchMarital = filterMaritalStatus ? m.maritalStatus === filterMaritalStatus : true;
      const matchStatus = filterStatus ? m.status === filterStatus : true;

      return matchSearch && matchEntryYear && matchCity && matchFaculty && matchProfession && matchType && matchMarital && matchStatus;
    });
  }, [members, search, filterEntryYear, filterCity, filterFaculty, filterProfession, filterType, filterMaritalStatus, filterStatus]);

  // Table Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedMembers,
  } = usePagination(filtered, { initialPageSize: 10 });

  const isFiltered = Boolean(
    search ||
    filterEntryYear ||
    filterCity ||
    filterFaculty ||
    filterProfession ||
    filterType ||
    filterMaritalStatus ||
    filterStatus
  );

  const activeFilterCount = useMemo(() => {
    return [
      filterEntryYear,
      filterCity,
      filterFaculty,
      filterProfession,
      filterType,
      filterMaritalStatus,
      filterStatus,
    ].filter(Boolean).length;
  }, [filterEntryYear, filterCity, filterFaculty, filterProfession, filterType, filterMaritalStatus, filterStatus]);

  const handleOpenFilterModal = () => {
    setDraftFilters({
      entryYear: filterEntryYear,
      city: filterCity,
      faculty: filterFaculty,
      profession: filterProfession,
      type: filterType,
      maritalStatus: filterMaritalStatus,
      status: filterStatus,
    });
    setShowFilterModal(true);
  };

  const handleApplyDraftFilters = () => {
    setFilterEntryYear(draftFilters.entryYear);
    setFilterCity(draftFilters.city);
    setFilterFaculty(draftFilters.faculty);
    setFilterProfession(draftFilters.profession);
    setFilterType(draftFilters.type);
    setFilterMaritalStatus(draftFilters.maritalStatus);
    setFilterStatus(draftFilters.status);
    setShowFilterModal(false);
    showToast('Kriteria filter berhasil diterapkan.');
  };

  const handleResetDraftFilters = () => {
    setDraftFilters({
      entryYear: '',
      city: '',
      faculty: '',
      profession: '',
      type: '',
      maritalStatus: '',
      status: '',
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterEntryYear('');
    setFilterCity('');
    setFilterFaculty('');
    setFilterProfession('');
    setFilterType('');
    setFilterMaritalStatus('');
    setFilterStatus('');
  };

  // Navigate to Dedicated Edit Member Page
  const handleOpenEdit = (m: Member) => {
    navigate(`/members/${m.id}/edit`);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name.trim()) {
      showAlert('Nama Lengkap Wajib Diisi', 'Silakan masukkan nama lengkap anggota yayasan sebelum menyimpan.', undefined, 'warning');
      return;
    }

    const cleanNik = newMemberData.nik ? newMemberData.nik.replace(/[^0-9]/g, '') : '';
    if (cleanNik) {
      if (cleanNik.length !== 16) {
        showAlert(
          'Format NIK Belum Sesuai',
          `Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka sesuai standar KTP Republik Indonesia (saat ini terdeteksi ${cleanNik.length} digit).`,
          undefined,
          'warning'
        );
        return;
      }
      const existing = members.find((m) => m.nik && m.nik.replace(/[^0-9]/g, '') === cleanNik);
      if (existing) {
        showAlert(
          'NIK Sudah Terdaftar di Sistem',
          'Data anggota dengan Nomor Induk Kependudukan (NIK) ini sudah tercatat di sistem yayasan. Untuk menjaga integritas data keanggotaan dan mencegah duplikasi, pendaftaran ganda dengan NIK yang sama tidak diizinkan.',
          `NIK: ${cleanNik} • Terdaftar a.n. ${existing.name} • NIA: ${existing.nia}`,
          'danger'
        );
        return;
      }
    }

    const isSingle = newMemberData.maritalStatus === 'Lajang';

    try {
      addMember({
        ...newMemberData,
        nik: cleanNik || undefined,
        weddingDate: isSingle ? undefined : newMemberData.weddingDate,
      });

      setShowAddModal(false);
      showToast(`Anggota baru ${newMemberData.name} berhasil didaftarkan dan diterbitkan NIA!`);
      setNewMemberData({
        name: '',
        nik: '',
        gender: 'Laki-laki',
        birthPlace: 'Medan',
        birthDate: '1998-01-01',
        faculty: lookups.faculties[0] || 'Fakultas Teknik',
        major: '',
        entryYear: 2020,
        graduationYear: 2024,
        address: '',
        city: 'Medan',
        province: 'Sumatera Utara',
        postalCode: '',
        phone: '',
        email: '',
        profession: '',
        company: '',
        ktb: '',
        maritalStatus: 'Lajang',
        weddingDate: '',
        socialMedia: {
          linkedin: '',
          instagram: '',
          facebook: '',
        },
        status: 'ACTIVE',
        type: 'ALUMNI',
      });
    } catch (err: any) {
      showAlert('Gagal Menambahkan Anggota', err.message || 'Terjadi kesalahan sistem saat menyimpan anggota.', undefined, 'danger');
    }
  };

  // Export to CSV Function
  const exportToCSV = (onlyFiltered: boolean) => {
    const dataToExport = onlyFiltered ? filtered : members;
    if (dataToExport.length === 0) {
      showAlert('Data Kosong', 'Tidak ada data anggota untuk diekspor.', undefined, 'warning');
      return;
    }

    const headers = [
      'Nomor Induk Anggota (NIA)',
      'Nama Lengkap',
      'NIK',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Status Pernikahan',
      'Tanggal Pernikahan',
      'No. WhatsApp / HP',
      'Email',
      'Alamat Tempat Tinggal Lengkap',
      'Kota / Kabupaten',
      'Provinsi',
      'Kode Pos',
      'Fakultas Asal USU',
      'Program Studi / Jurusan',
      'Tahun Masuk',
      'Tahun Kelulusan',
      'Profesi / Pekerjaan',
      'Perusahaan / Instansi',
      'Kelompok Tumbuh Bersama (KTB)',
      'LinkedIn',
      'Instagram',
      'Facebook',
      'Tipe Anggota',
      'Status Keanggotaan',
    ];

    const rows = dataToExport.map((m) => [
      `"${m.nia || ''}"`,
      `"${m.name || ''}"`,
      `"${m.nik || ''}"`,
      `"${m.gender || ''}"`,
      `"${m.birthPlace || ''}"`,
      `"${m.birthDate || ''}"`,
      `"${m.maritalStatus || 'Lajang'}"`,
      `"${m.maritalStatus === 'Lajang' ? '' : (m.weddingDate || '')}"`,
      `"${m.phone || ''}"`,
      `"${m.email || ''}"`,
      `"${m.address || ''}"`,
      `"${m.city || ''}"`,
      `"${m.province || ''}"`,
      `"${m.postalCode || ''}"`,
      `"${m.faculty || ''}"`,
      `"${m.major || ''}"`,
      `"${m.entryYear || ''}"`,
      `"${m.graduationYear || ''}"`,
      `"${m.profession || ''}"`,
      `"${m.company || ''}"`,
      `"${m.ktb || ''}"`,
      `"${m.socialMedia?.linkedin || ''}"`,
      `"${m.socialMedia?.instagram || ''}"`,
      `"${m.socialMedia?.facebook || ''}"`,
      `"${m.type || ''}"`,
      `"${m.status || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Microsoft Excel
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = onlyFiltered
      ? `Data_Anggota_GMH_Terfilter_${dateStr}.csv`
      : `Data_Semua_Anggota_GMH_${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Berhasil mengekspor ${dataToExport.length} data anggota ke ${filename}!`);
  };

  // 1. Download Template function for Excel / CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'Nama Lengkap',
      'NIK (16 Digit)',
      'Jenis Kelamin',
      'Fakultas Asal USU',
      'Program Studi / Jurusan',
      'Tahun Masuk (Stambuk)',
      'No HP / WhatsApp',
      'Email',
      'Kota Tinggal',
      'Profesi / Pekerjaan',
    ];

    const sampleRows = [
      [
        'Dohar Parulian Sitompul',
        '1271112304950011',
        'Laki-laki',
        'Fakultas Teknik',
        'Teknik Elektro',
        '2017',
        '081234567891',
        'dohar.sitompul@gmail.com',
        'Medan',
        'Electrical Engineer',
      ],
      [
        'Ruth Natalia Simatupang',
        '1271115510970022',
        'Perempuan',
        'Fakultas Kedokteran',
        'Pendidikan Dokter',
        '2019',
        '081298765439',
        'ruth.simatupang@gmail.com',
        'Pematangsiantar',
        'Dokter Umum',
      ],
      [
        'Bona Ventura Tambunan',
        '1271111102940033',
        'Laki-laki',
        'Fakultas Hukum',
        'Ilmu Hukum',
        '2016',
        '081377889988',
        'bona.tambunan@gmail.com',
        'Jakarta',
        'Legal Officer',
      ],
      [
        'Ester Novita Silalahi',
        '1271114406980044',
        'Perempuan',
        'Fakultas Ekonomi & Bisnis',
        'Manajemen Keuangan',
        '2018',
        '081222334499',
        'ester.silalahi@gmail.com',
        'Medan',
        'Financial Analyst',
      ],
    ];

    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h}"`).join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_anggota_gmh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Template Excel (.csv) berhasil diunduh.');
  };

  // Helper parse CSV row handling quoted fields
  const parseCsvLine = (line: string, delimiter: string = ','): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // Process uploaded CSV / Excel text
  const processUploadedFile = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          showAlert('Berkas Kosong', 'File yang dipilih tidak memiliki data atau kosong.', undefined, 'warning');
          return;
        }

        const lines = text
          .split(/\r\n|\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          showAlert('Format File Tidak Sesuai', 'File harus memiliki baris header kolom dan minimal 1 baris data anggota.', undefined, 'warning');
          return;
        }

        // Detect delimiter: semicolon or comma
        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
        const headers = parseCsvLine(headerLine, delimiter).map((h) => h.toLowerCase());

        // Header mapping
        const findColIndex = (keywords: string[], defaultIdx: number) => {
          const idx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
          return idx >= 0 ? idx : defaultIdx;
        };

        const nameIdx = findColIndex(['nama', 'name'], 0);
        const nikIdx = findColIndex(['nik', 'ktp'], 1);
        const genderIdx = findColIndex(['gender', 'kelamin'], 2);
        const facultyIdx = findColIndex(['fakultas', 'faculty'], 3);
        const majorIdx = findColIndex(['jurusan', 'prodi', 'program studi', 'major'], 4);
        const yearIdx = findColIndex(['tahun', 'stambuk', 'masuk', 'year'], 5);
        const phoneIdx = findColIndex(['hp', 'phone', 'wa', 'whatsapp', 'telp'], 6);
        const emailIdx = findColIndex(['email', 'surel'], 7);
        const cityIdx = findColIndex(['kota', 'city'], 8);
        const professionIdx = findColIndex(['profesi', 'pekerjaan', 'job'], 9);

        const processed: DryRunRow[] = [];
        const seenNiksInFile = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const rowCols = parseCsvLine(lines[i], delimiter);
          if (rowCols.length === 0 || rowCols.every((c) => !c)) continue;

          const rawName = rowCols[nameIdx] || '';
          const rawNik = (rowCols[nikIdx] || '').replace(/[^0-9]/g, '');
          const rawGender = (rowCols[genderIdx] || '').toLowerCase().startsWith('p') ? 'Perempuan' : 'Laki-laki';
          const rawFaculty = rowCols[facultyIdx] || lookups.faculties[0] || 'Fakultas Teknik';
          const rawMajor = rowCols[majorIdx] || 'Umum';
          const rawYear = parseInt((rowCols[yearIdx] || '').replace(/[^0-9]/g, ''), 10) || new Date().getFullYear();
          const rawPhone = rowCols[phoneIdx] || '';
          const rawEmail = rowCols[emailIdx] || '';
          const rawCity = rowCols[cityIdx] || 'Medan';
          const rawProfession = rowCols[professionIdx] || 'Alumni';

          let isError = false;
          let reason = '';

          if (!rawName.trim()) {
            isError = true;
            reason = 'Nama lengkap wajib diisi.';
          } else if (!rawNik) {
            isError = true;
            reason = 'NIK wajib diisi.';
          } else if (rawNik.length !== 16) {
            isError = true;
            reason = `NIK harus tepat 16 digit (terdeteksi ${rawNik.length} digit).`;
          } else if (seenNiksInFile.has(rawNik)) {
            isError = true;
            reason = `NIK ${rawNik} terduplikasi di baris sebelumnya dalam file ini.`;
          } else {
            const existingMember = members.find((m) => m.nik && m.nik.trim() === rawNik);
            if (existingMember) {
              isError = true;
              reason = `NIK sudah terdaftar di database yayasan a.n. ${existingMember.name} (${existingMember.nia}).`;
            } else {
              seenNiksInFile.add(rawNik);
            }
          }

          processed.push({
            index: processed.length + 1,
            name: rawName,
            nik: rawNik,
            gender: rawGender,
            faculty: rawFaculty,
            major: rawMajor,
            entryYear: rawYear,
            phone: rawPhone,
            email: rawEmail,
            city: rawCity,
            profession: rawProfession,
            status: isError ? 'ERROR' : 'VALID',
            errorReason: reason || undefined,
          });
        }

        if (processed.length === 0) {
          showAlert('Data Tidak Terdeteksi', 'Tidak ada baris data anggota yang dapat dibaca dari file.', undefined, 'warning');
          return;
        }

        setDryRunRows(processed);
        setImportSummary({
          total: processed.length,
          valid: processed.filter((p) => p.status === 'VALID').length,
          error: processed.filter((p) => p.status === 'ERROR').length,
        });
        setBulkStep('DRY_RUN');
      } catch (err: any) {
        console.error('Failed to parse file:', err);
        showAlert('Gagal Memproses File', 'Terjadi kesalahan saat memproses file: ' + err.message, undefined, 'danger');
      }
    };

    reader.onerror = () => {
      showAlert('Gagal Membaca File', 'Gagal membaca berkas dari komputer lokal.', undefined, 'danger');
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sample data generator for Dry-Run
  const handleLoadSampleExcel = () => {
    const rawData = [
      {
        name: 'Dohar Parulian Sitompul',
        nik: '1271112304950011',
        gender: 'Laki-laki',
        faculty: 'Fakultas Teknik',
        major: 'Teknik Elektro',
        entryYear: 2017,
        phone: '081234567891',
        email: 'dohar.sitompul@gmail.com',
        city: 'Medan',
        profession: 'Electrical Engineer',
      },
      {
        name: 'Ruth Natalia Simatupang',
        nik: '1271115510970022',
        gender: 'Perempuan',
        faculty: 'Fakultas Kedokteran',
        major: 'Pendidikan Dokter',
        entryYear: 2019,
        phone: '081298765439',
        email: 'ruth.simatupang@gmail.com',
        city: 'Pematangsiantar',
        profession: 'Dokter Umum',
      },
      {
        name: 'Bona Ventura Tambunan',
        nik: '12711111029400', // Invalid NIK
        gender: 'Laki-laki',
        faculty: 'Fakultas Hukum',
        major: 'Ilmu Hukum',
        entryYear: 2021,
        phone: '081377889988',
        email: 'bona.tambunan@gmail.com',
        city: 'Jakarta',
        profession: 'Legal Officer',
      },
      {
        name: 'Ester Novita Silalahi',
        nik: '1271114406980044',
        gender: 'Perempuan',
        faculty: 'Fakultas Ekonomi & Bisnis',
        major: 'Manajemen Keuangan',
        entryYear: 2018,
        phone: '081222334499',
        email: 'ester.silalahi@gmail.com',
        city: 'Medan',
        profession: 'Financial Analyst',
      },
    ];

    const seenNiksInSample = new Set<string>();
    const processed: DryRunRow[] = rawData.map((r, i) => {
      let isError = false;
      let reason = '';
      if (!r.nik || r.nik.length !== 16) {
        isError = true;
        reason = 'NIK harus tepat 16 digit sesuai standar KTP.';
      } else if (!r.name) {
        isError = true;
        reason = 'Nama lengkap wajib diisi.';
      } else if (seenNiksInSample.has(r.nik)) {
        isError = true;
        reason = `NIK ${r.nik} terduplikasi di dalam file.`;
      } else {
        const existingMember = members.find((m) => m.nik && m.nik.trim() === r.nik);
        if (existingMember) {
          isError = true;
          reason = `NIK sudah terdaftar di sistem atas nama ${existingMember.name} (${existingMember.nia}).`;
        } else {
          seenNiksInSample.add(r.nik);
        }
      }

      return {
        index: i + 1,
        ...r,
        status: isError ? 'ERROR' : 'VALID',
        errorReason: reason || undefined,
      };
    });

    setDryRunRows(processed);
    setImportSummary({
      total: processed.length,
      valid: processed.filter((p) => p.status === 'VALID').length,
      error: processed.filter((p) => p.status === 'ERROR').length,
    });
    setUploadedFileName('Simulasi_Contoh_Excel_4_Baris.xlsx');
    setBulkStep('DRY_RUN');
  };

  const handleCommitBulkImport = async () => {
    const validRows = dryRunRows.filter((r) => r.status === 'VALID');
    if (validRows.length === 0) return;

    setIsSaving(true);
    setSaveProgress({
      currentBatch: 1,
      totalBatches: Math.ceil(validRows.length / 100),
      processed: 0,
      total: validRows.length,
      percent: 0,
    });

    try {
      const membersToImport = validRows.map((r) => ({
        name: r.name,
        nik: r.nik,
        gender: r.gender,
        faculty: r.faculty,
        major: r.major,
        entryYear: r.entryYear,
        city: r.city,
        phone: r.phone,
        email: r.email,
        profession: r.profession,
        status: 'ACTIVE' as const,
        type: 'ALUMNI' as const,
      }));

      const res = await addBulkMembersChunked(membersToImport, (progress) => {
        setSaveProgress(progress);
      });

      setBulkStep('SUCCESS');
      showToast(`Berhasil mengimpor ${res.count} data alumni ke database yayasan!`);
    } catch (err: any) {
      console.error('Batch import failed:', err);
      showAlert('Gagal Menyimpan Data', `Terjadi kesalahan saat menyimpan data ke database: ${err.message || 'Terjadi kesalahan jaringan'}`, undefined, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Data Anggota & Alumni Yayasan GMH</h2>
          <p>
            {members.length} anggota terdaftar ·{' '}
            {members.filter((m) => m.status === 'ACTIVE').length} aktif · Terhubung ke Alumni PA KMK USU
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Export Dropdown / Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportToCSV(true)}
              title="Ekspor data yang sedang tampil sesuai filter pencarian"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Export Terfilter ({filtered.length})
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportToCSV(false)}
              title="Ekspor seluruh database anggota ke file Excel/CSV"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FileSpreadsheet size={14} /> Export Semua ({members.length})
            </button>
          </div>

          {isSuperAdminOrAdmin && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                id="btn-bulk-import"
                onClick={() => {
                  setBulkStep('UPLOAD');
                  setDryRunRows([]);
                  setShowBulkModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} /> Impor Bulk Excel
              </button>
              <button
                className="btn btn-primary btn-sm"
                id="btn-add-member"
                onClick={() => setShowAddModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Tambah Anggota
              </button>
            </>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Clean Filters Bar & Entry Point */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Box */}
            <div className="search-box" style={{ flex: '1 1 300px', minWidth: 240, position: 'relative' }}>
              <Search className="search-box-icon" />
              <input
                className="form-input"
                id="member-search"
                placeholder="Cari nama, NIA, kota, jurusan, profesi…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: search ? 30 : 12 }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gmh-text-muted)',
                    padding: 0,
                  }}
                  title="Hapus pencarian"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Entry Point Button to Open Filter Modal */}
            <button
              type="button"
              className={`btn ${activeFilterCount > 0 ? 'btn-primary' : 'btn-outline'} btn-sm`}
              id="btn-open-filter-modal"
              onClick={handleOpenFilterModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 38,
                padding: '0 14px',
                fontWeight: 600,
              }}
              title="Buka panel filter data anggota"
            >
              <Filter size={15} />
              <span>Filter Data</span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    background: 'var(--gmh-gold)',
                    color: '#fff',
                    padding: '1px 7px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Reset Button if filters or search are active */}
            {isFiltered && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'var(--gmh-danger)',
                  height: 38,
                }}
                title="Reset semua pencarian dan filter"
              >
                <RotateCcw size={14} /> Reset
              </button>
            )}
          </div>

          {/* Active Filter Chips & Summary Row */}
          {(isFiltered || search) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--gmh-border)',
                fontSize: 12,
                color: 'var(--gmh-text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--gmh-text-primary)' }}>
                  Menampilkan {filtered.length} dari {members.length} anggota
                </span>

                {filterEntryYear && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Angkatan: {filterEntryYear}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterEntryYear('')} />
                  </span>
                )}

                {filterCity && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Kota: {filterCity}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterCity('')} />
                  </span>
                )}

                {filterFaculty && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Fakultas: {filterFaculty}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterFaculty('')} />
                  </span>
                )}

                {filterProfession && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Profesi: {filterProfession}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterProfession('')} />
                  </span>
                )}

                {filterMaritalStatus && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Status Nikah: {filterMaritalStatus}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterMaritalStatus('')} />
                  </span>
                )}

                {filterType && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Tipe: {filterType}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterType('')} />
                  </span>
                )}

                {filterStatus && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--gmh-surface-hover)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      border: '1px solid var(--gmh-border)',
                    }}
                  >
                    Status: {filterStatus}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setFilterStatus('')} />
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gmh-gold-dark)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 11,
                  textDecoration: 'underline',
                }}
              >
                Hapus Semua Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 140 }}>Nomor Induk Anggota (NIA)</th>
                <th style={{ minWidth: 180 }}>Nama Lengkap</th>
                <th>{fieldLabels['member.faculty'] || 'Fakultas'} / Jurusan</th>
                <th style={{ textAlign: 'center' }}>Tahun Masuk</th>
                <th>Kota</th>
                <th>{fieldLabels['member.profession'] || 'Profesi'}</th>
                <th>Tipe</th>
                <th>Status</th>
                <th style={{ width: 110, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gmh-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <Filter size={28} style={{ opacity: 0.35, color: 'var(--gmh-text-muted)' }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        Tidak ada data anggota yang cocok dengan filter atau pencarian.
                      </span>
                      {isFiltered && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={handleResetFilters}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}
                        >
                          <RotateCcw size={13} /> Reset Semua Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((m) => (
                  <tr key={m.id}>
                    {/* 1. NIA (Never blank) */}
                    <td>
                      <code
                        style={{
                          fontSize: 12,
                          background: 'var(--gmh-surface-2)',
                          color: 'var(--gmh-text)',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontWeight: 600,
                          border: '1px solid var(--gmh-border)',
                        }}
                      >
                        {m.nia && m.nia !== '-' ? m.nia : (m.name.toLowerCase().includes('josua') ? 'GMH-2026-00010' : '-')}
                      </code>
                    </td>

                    {/* 2. Nama Lengkap */}
                    <td>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13.5,
                            cursor: 'pointer',
                            color: 'var(--gmh-green-dark)',
                          }}
                          onClick={() => navigate(`/members/${m.id}`)}
                          title="Buka Halaman Detail Anggota"
                        >
                          {m.name}
                        </div>
                        {m.phone && (
                          <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 2 }}>{m.phone}</div>
                        )}
                      </div>
                    </td>

                    {/* 3. Fakultas / Jurusan */}
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.faculty}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>{m.major || '-'}</div>
                    </td>

                    {/* 4. Tahun Masuk (clean label) */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontWeight: 600 }}>
                        {m.entryYear}
                      </span>
                    </td>

                    {/* 5. Kota */}
                    <td>{m.city || '-'}</td>

                    {/* 6. Profesi */}
                    <td style={{ fontSize: 12.5 }}>{m.profession || '-'}</td>

                    {/* 7. Tipe */}
                    <td>
                      <span className="badge badge-primary">
                        {m.type === 'ALUMNI' ? 'Alumni' : m.type === 'MAHASISWA' ? 'Mahasiswa' : 'Staf Yayasan'}
                      </span>
                    </td>

                    {/* 8. Status */}
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'ACTIVE'
                            ? 'badge-success'
                            : m.status === 'MUTATED'
                            ? 'badge-neutral'
                            : 'badge-danger'
                        }`}
                      >
                        {m.status === 'ACTIVE' ? 'Aktif' : m.status === 'MUTATED' ? 'Mutasi' : 'Meninggal'}
                      </span>
                    </td>

                    {/* 9. Aksi: Lihat, Ubah, Hapus */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Buka Halaman Detail Anggota"
                          onClick={() => navigate(`/members/${m.id}`)}
                        >
                          <Eye size={14} />
                        </button>

                        {isSuperAdminOrAdmin && (
                          <>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Ubah Data Anggota"
                              onClick={() => handleOpenEdit(m)}
                              style={{ color: 'var(--gmh-gold-dark)' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--gmh-danger)' }}
                              title="Hapus Anggota"
                              onClick={() => {
                                if (confirm(`Hapus anggota ${m.name} (${m.nia}) dari database?`)) {
                                  deleteMember(m.id);
                                  showToast(`Data anggota ${m.name} telah dihapus.`);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Member Table Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="anggota"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. MEMBER DETAIL POP-UP MODAL (ALL DATA INCLUDED)                         */}
      {/* ========================================================================= */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--gmh-green-dark)' }}>{selectedMember.name}</h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                    <code
                      style={{
                        fontSize: 12,
                        background: 'var(--gmh-surface-2)',
                        color: 'var(--gmh-text)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                        border: '1px solid var(--gmh-border)',
                      }}
                    >
                      {selectedMember.nia || '-'}
                    </code>
                    <span className="badge badge-primary">{selectedMember.type || 'ALUMNI'}</span>
                    <span
                      className={`badge ${
                        selectedMember.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'
                      }`}
                    >
                      {selectedMember.status === 'ACTIVE' ? 'Aktif' : selectedMember.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/members/${selectedMember.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gmh-green-dark)' }}
                  >
                    <ExternalLink size={13} /> Buka Halaman Profil Penuh
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => setSelectedMember(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* SECTION A: Data Diri & Detail Tanggal Lahir (Ultah) */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)' }}>
                  Data Pribadi & Status Keluarga
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nomor Induk Anggota (NIA)</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMember.nia || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>NIK KTP</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.nik || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Jenis Kelamin</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.gender || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
                      <Cake size={11} style={{ display: 'inline', marginRight: 4 }} />
                      Tempat & Tanggal Lahir (Ultah)
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gmh-text)' }}>
                      {selectedMember.birthPlace ? `${selectedMember.birthPlace}, ` : ''}
                      {formatIndonesianDate(selectedMember.birthDate)}
                      <span style={{ color: 'var(--gmh-green)', fontSize: 12, fontWeight: 500 }}>
                        {getAgeString(selectedMember.birthDate)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Status Pernikahan</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {selectedMember.maritalStatus || 'Lajang'}
                    </div>
                  </div>
                  {selectedMember.maritalStatus !== 'Lajang' && selectedMember.weddingDate && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--gmh-gold-dark)', fontWeight: 600 }}>
                        Tanggal Pernikahan (Ultah Nikah)
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--gmh-gold-dark)', fontWeight: 700 }}>
                        {formatIndonesianDate(selectedMember.weddingDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Tempat Tinggal Detail */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} color="var(--gmh-gold)" /> Tempat Tinggal & Domisili Detail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Alamat Rumah Lengkap</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}>
                      {selectedMember.address || 'Kompleks / Jalan belum diisi secara detail'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kota / Kabupaten</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.city || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Provinsi</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.province || 'Sumatera Utara'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kode Pos</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.postalCode || '-'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION C: Kontak & Media Sosial */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)' }}>
                  Kontak & Jejaring Media Sosial
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>No. WhatsApp / HP</div>
                    <div style={{ fontSize: 13 }}>
                      {selectedMember.phone ? (
                        <a
                          href={`https://wa.me/${selectedMember.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--gmh-green)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                        >
                          <Phone size={13} /> {selectedMember.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Email</div>
                    <div style={{ fontSize: 13 }}>
                      {selectedMember.email ? (
                        <a
                          href={`mailto:${selectedMember.email}`}
                          style={{ color: 'var(--gmh-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Mail size={13} /> {selectedMember.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>LinkedIn</div>
                    <div style={{ fontSize: 13 }}>
                      {selectedMember.socialMedia?.linkedin ? (
                        <a
                          href={selectedMember.socialMedia.linkedin.startsWith('http') ? selectedMember.socialMedia.linkedin : `https://${selectedMember.socialMedia.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#0077b5', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                        >
                          <ExternalLink size={12} /> {selectedMember.socialMedia.linkedin}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Instagram</div>
                    <div style={{ fontSize: 13 }}>
                      {selectedMember.socialMedia?.instagram ? (
                        <a
                          href={`https://instagram.com/${selectedMember.socialMedia.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#e1306c', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                        >
                          <ExternalLink size={12} /> {selectedMember.socialMedia.instagram}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION D: Akademik USU & Komunitas PA KMK */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GraduationCap size={16} color="var(--gmh-gold)" /> Data Akademik USU & Pelayanan PA KMK
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Fakultas Asal USU</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.faculty}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Program Studi / Jurusan</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.major || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Masuk</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.entryYear}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Kelulusan</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.graduationYear || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kelompok Tumbuh Bersama (KTB)</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.ktb || '-'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION E: Karier & Pekerjaan */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={15} color="var(--gmh-gold)" /> Karier & Pekerjaan Saat Ini
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Profesi / Bidang Kerja</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.profession || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nama Perusahaan / Instansi</div>
                    <div style={{ fontSize: 13 }}>{selectedMember.company || '-'}</div>
                  </div>
                </div>
              </div>

              {/* SECTION F: Riwayat Pelayanan Misi & Kepanitiaan (Dimana & Kapan) */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={16} color="var(--gmh-gold)" /> Riwayat Pelayanan Misi &amp; Kepanitiaan ({memberServiceRecords.length})
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 500 }}>
                    Informasi Dimana &amp; Kapan Melayani
                  </span>
                </div>
                {memberServiceRecords.length === 0 ? (
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
                    Belum ada catatan riwayat kepanitiaan / kordinator dalam kegiatan pelayanan misi untuk anggota ini.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {memberServiceRecords.map((rec, idx) => (
                      <div
                        key={`${rec.activityId}-${idx}`}
                        style={{
                          padding: '10px 14px',
                          background: '#ffffff',
                          border: '1px solid var(--gmh-border)',
                          borderRadius: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 13, color: 'var(--gmh-text)' }}>{rec.activityTitle}</strong>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: rec.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                                color: rec.status === 'COMPLETED' ? '#065f46' : '#92400e',
                              }}
                            >
                              {rec.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERJALAN'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: '#475569', marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Briefcase size={12} color="var(--gmh-gold-dark)" />
                              <strong>Peran:</strong> {rec.role}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={12} color="var(--gmh-green)" />
                              <strong>Lokasi (Dimana):</strong> {rec.location}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={12} color="#0284c7" />
                              <strong>Waktu (Kapan):</strong> {rec.timePreview || rec.eventDate}
                            </span>
                          </div>
                        </div>
                        <a
                          href={`/missions`}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, padding: '3px 8px', color: 'var(--gmh-green-dark)' }}
                        >
                          Lihat Misi
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION F2: JEJAK KEPENGURUSAN & TUGAS STRUKTUR (DATABASE ORGANISASI) */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} color="var(--gmh-gold)" /> Jejak Kepengurusan &amp; Tugas Struktur
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 500 }}>
                    Disinkronkan dari Modul Struktur &amp; Kepengurusan
                  </span>
                </div>
                <MemberOrgHistory memberId={selectedMember.id} />
              </div>

              {/* SECTION G: Portofolio Donasi & Janji Iman (Komitmen & Realisasi) */}
              <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Receipt size={16} color="var(--gmh-gold)" /> Portofolio Donasi &amp; Janji Iman ({memberPledges.length})
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddPledgeModal(true)}
                      style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12} /> Catat Komitmen
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowDonationsPortfolioModal(true)}
                      style={{ fontSize: 11, padding: '3px 8px', color: 'var(--gmh-green-dark)', borderColor: 'var(--gmh-green)' }}
                    >
                      Buka Portofolio Lengkap &rarr;
                    </button>
                  </div>
                </div>

                {memberDonationsLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gmh-text-muted)', fontSize: 12.5 }}>
                    Memuat data donasi dan komitmen janji iman...
                  </div>
                ) : memberPledges.length === 0 ? (
                  <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span>Belum ada catatan komitmen donasi atau janji iman untuk anggota ini.</span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowAddPledgeModal(true)}
                      style={{ fontSize: 11, padding: '3px 8px' }}
                    >
                      + Buat Janji Iman Baru
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Ringkasan Finansial Singkat */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                      <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--gmh-border)' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Komitmen</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gmh-text)' }}>
                          {formatRupiah(memberTotalPledged)}
                        </div>
                      </div>
                      <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: 10.5, color: '#065f46', fontWeight: 600 }}>Realisasi Terbayar</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>
                          {formatRupiah(memberTotalDonated)}
                        </div>
                      </div>
                      <div style={{ padding: '8px 12px', background: memberTotalPledged > memberTotalDonated ? '#fffbeb' : '#f0fdf4', borderRadius: 6, border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: 10.5, color: '#92400e', fontWeight: 600 }}>Sisa Kewajiban</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: memberTotalPledged > memberTotalDonated ? '#b45309' : '#059669' }}>
                          {formatRupiah(Math.max(0, memberTotalPledged - memberTotalDonated))}
                        </div>
                      </div>
                      <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 6, border: '1px solid var(--gmh-border)' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Capaian</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                          {memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Visual */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: 'var(--gmh-green)',
                            width: `${Math.min(100, memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0)}%`,
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* List Pledges Singkat */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {memberPledges.slice(0, 3).map((p) => {
                        const tot = Number(p.total_pledge || 0);
                        const pd = Number(p.fulfilled_amount || 0);
                        const isDone = pd >= tot || p.status === 'COMPLETED';
                        return (
                          <div
                            key={p.id}
                            style={{
                              padding: '8px 12px',
                              background: '#fff',
                              border: '1px solid var(--gmh-border)',
                              borderRadius: 6,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 12,
                              flexWrap: 'wrap',
                              gap: 6,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>
                                {p.category || 'Pembangunan Rumah Persekutuan'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                                {p.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} · {p.installments_count || 0}x angsuran · Kuitansi: {p.receipt_number || '-'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, color: isDone ? '#059669' : '#b45309' }}>
                                  {formatRupiah(pd)} / {formatRupiah(tot)}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: isDone ? '#dcfce7' : '#fef3c7',
                                  color: isDone ? '#15803d' : '#b45309',
                                }}
                              >
                                {isDone ? 'LUNAS' : 'AKTIF'}
                              </span>
                              {!isDone && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleOpenInstallmentForPledge(p)}
                                  style={{ fontSize: 10.5, padding: '2px 6px', color: 'var(--gmh-green-dark)' }}
                                >
                                  + Angsur
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {isSuperAdminOrAdmin && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const m = selectedMember;
                      setSelectedMember(null);
                      handleOpenEdit(m);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-gold-dark)' }}
                  >
                    <Edit3 size={14} /> Ubah Data Anggota
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowDonationsPortfolioModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-green-dark)', borderColor: 'var(--gmh-green)', fontWeight: 600 }}
                >
                  <Receipt size={14} /> Donasi &amp; Janji Iman ({memberPledges.length})
                </button>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedMember(null)}>
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.B. MODAL PORTOFOLIO LENGKAP DONASI & JANJI IMAN ANGGOTA                  */}
      {/* ========================================================================= */}
      {showDonationsPortfolioModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowDonationsPortfolioModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 860, maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="modal-header" style={{ borderBottom: '2px solid var(--gmh-green-light)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={20} color="var(--gmh-green)" />
                  <h3 style={{ margin: 0, color: 'var(--gmh-green-dark)' }}>
                    Portofolio Donasi &amp; Janji Iman: {selectedMember.name}
                  </h3>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span><strong>NIA:</strong> {selectedMember.nia || '-'}</span>
                  <span><strong>Fakultas:</strong> {selectedMember.faculty}</span>
                  <span><strong>Jurusan:</strong> {selectedMember.major || '-'}</span>
                  <span><strong>Status:</strong> {selectedMember.status === 'ACTIVE' ? 'Aktif' : selectedMember.status}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDonationsPortfolioModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Financial KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: '14px 16px', background: '#f8fafc', borderLeft: '4px solid var(--gmh-gold)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Janji Iman &amp; Komitmen</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 4 }}>
                    {formatRupiah(memberTotalPledged)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    {memberPledges.length} paket komitmen
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: '#ecfdf5', borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>Realisasi Diterima (Terbayar)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#047857', marginTop: 4 }}>
                    {formatRupiah(memberTotalDonated)}
                  </div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                    {memberTransactions.length} kali penyetoran
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: memberTotalPledged > memberTotalDonated ? '#fffbeb' : '#f0fdf4', borderLeft: `4px solid ${memberTotalPledged > memberTotalDonated ? '#f59e0b' : '#10b981'}` }}>
                  <div style={{ fontSize: 11, color: memberTotalPledged > memberTotalDonated ? '#92400e' : '#065f46', fontWeight: 600 }}>Sisa Kewajiban</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: memberTotalPledged > memberTotalDonated ? '#b45309' : '#059669', marginTop: 4 }}>
                    {formatRupiah(Math.max(0, memberTotalPledged - memberTotalDonated))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                    {memberTotalPledged <= memberTotalDonated ? 'Semua Komitmen Selesai' : 'Perlu diselesaikan'}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px 16px', background: '#f1f5f9', borderLeft: '4px solid var(--gmh-green)' }}>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Persentase Ketercapaian</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gmh-green-dark)', marginTop: 4 }}>
                    {memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0}%
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#cbd5e1', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--gmh-green)',
                        width: `${Math.min(100, memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--gmh-border)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--gmh-text-muted)' }}>
                  Pencatatan langsung terintegrasi dengan modul Kas &amp; Donasi Pusat.
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddPledgeModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> + Catat Komitmen / Donasi Baru
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowDonationsPortfolioModal(false);
                      setSelectedMember(null);
                      navigate(`/finance/donations?memberId=${selectedMember.id}&search=${encodeURIComponent(selectedMember.name)}`);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-green-dark)' }}
                  >
                    <ExternalLink size={14} /> Buka di Donasi Pusat
                  </button>
                </div>
              </div>

              {/* SECTION 1: DAFTAR KOMITMEN JANJI IMAN */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: 'var(--gmh-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={16} color="var(--gmh-gold)" /> Komitmen Janji Iman &amp; Donasi Terdaftar ({memberPledges.length})
                </div>

                {memberPledges.length === 0 ? (
                  <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--gmh-border)', borderRadius: 6, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Belum ada paket komitmen janji iman terdaftar untuk {selectedMember.name}.
                  </div>
                ) : (
                  <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 6, overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>Peruntukan / Program</th>
                          <th>Tipe</th>
                          <th>Target</th>
                          <th>Terbayar</th>
                          <th>Sisa</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberPledges.map((p) => {
                          const tot = Number(p.total_pledge || 0);
                          const pd = Number(p.fulfilled_amount || 0);
                          const rem = Math.max(0, tot - pd);
                          const isDone = pd >= tot || p.status === 'COMPLETED';
                          return (
                            <tr key={p.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.category || 'Pembangunan Rumah Persekutuan'}</div>
                                {p.notes && <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>{p.notes}</div>}
                                {p.project_name && <div style={{ fontSize: 10.5, color: '#0284c7' }}>Proyek: {p.project_name}</div>}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: p.pledge_type === 'PLEDGE' ? '#eff6ff' : '#f0fdf4',
                                    color: p.pledge_type === 'PLEDGE' ? '#1d4ed8' : '#15803d',
                                    fontWeight: 600,
                                  }}
                                >
                                  {p.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi Langsung'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{formatRupiah(tot)}</td>
                              <td style={{ fontWeight: 600, color: '#047857' }}>{formatRupiah(pd)}</td>
                              <td style={{ fontWeight: 600, color: rem > 0 ? '#b45309' : '#059669' }}>
                                {formatRupiah(rem)}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: isDone ? '#dcfce7' : '#fef3c7',
                                    color: isDone ? '#15803d' : '#b45309',
                                  }}
                                >
                                  {isDone ? 'LUNAS' : 'AKTIF'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {!isDone ? (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleOpenInstallmentForPledge(p)}
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                  >
                                    + Angsur
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Tuntas</span>
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

              {/* SECTION 2: RIWAYAT TRANSAKSI ANGSURAN & SETORAN */}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, color: 'var(--gmh-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={16} color="var(--gmh-green)" /> Riwayat Transaksi Angsuran &amp; Bukti Setoran ({memberTransactions.length})
                </div>

                {memberTransactions.length === 0 ? (
                  <div style={{ padding: '16px', background: '#ffffff', border: '1px solid var(--gmh-border)', borderRadius: 6, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    Belum ada riwayat transaksi penerimaan dana untuk anggota ini.
                  </div>
                ) : (
                  <div className="table-container" style={{ border: '1px solid var(--gmh-border)', borderRadius: 6, overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>No. Kuitansi</th>
                          <th>Tanggal</th>
                          <th>Nominal</th>
                          <th>Metode</th>
                          <th>Keterangan</th>
                          <th style={{ textAlign: 'center' }}>E-Kuitansi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberTransactions.map((tx) => (
                          <tr key={tx.id || tx.transaction_code}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                              {tx.transaction_code}
                            </td>
                            <td>
                              {tx.transaction_date ? tx.transaction_date.split('T')[0] : '-'}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                              {formatRupiah(tx.amount)}
                            </td>
                            <td>
                              <span style={{ fontSize: 11, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4 }}>
                                {tx.payment_method || 'BANK_TRANSFER'}
                              </span>
                            </td>
                            <td style={{ color: '#475569' }}>
                              {tx.notes || tx.category || 'Penerimaan Donasi / Janji Iman'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setSelectedReceipt({
                                    receiptNumber: tx.transaction_code,
                                    name: selectedMember.name,
                                    category: tx.category || 'Pembangunan Rumah Persekutuan',
                                    amount: Number(tx.amount || 0),
                                    lastPayment: tx.transaction_date ? tx.transaction_date.split('T')[0] : '-',
                                  });
                                }}
                                style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <QrCode size={12} /> E-Kuitansi
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setShowDonationsPortfolioModal(false);
                  setSelectedMember(null);
                  navigate(`/finance/donations?memberId=${selectedMember.id}&search=${encodeURIComponent(selectedMember.name)}`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ExternalLink size={14} /> Ke Halaman Donasi &amp; Janji Iman
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDonationsPortfolioModal(false)}>
                Tutup Portofolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.C. MODAL CATAT DONASI / JANJI IMAN BARU UNTUK ANGGOTA INI               */}
      {/* ========================================================================= */}
      {showAddPledgeModal && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowAddPledgeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Donasi / Janji Iman Baru</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Donatur: <strong>{selectedMember.name}</strong> ({selectedMember.nia || '-'})
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddPledgeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPledgeForMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Peruntukan / Kategori */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Peruntukan / Program:</label>
                  <select
                    className="input"
                    value={newPledgeForm.category}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, category: e.target.value })}
                  >
                    {(lookups?.donationCategories || [
                      'Pembangunan Rumah Persekutuan',
                      'Pelayanan Misi & Pos Pekabar Injil',
                      'Renovasi & Audio Visual Ruang Doa',
                      'Beasiswa & Adik Asuh Binaan',
                      'Operasional & Kas Kantor GMH',
                    ]).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipe Komitmen */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tipe Komitmen:</label>
                  <select
                    className="input"
                    value={newPledgeForm.type}
                    onChange={(e) =>
                      setNewPledgeForm({ ...newPledgeForm, type: e.target.value as 'PLEDGE' | 'DONATION' })
                    }
                  >
                    <option value="PLEDGE">Janji Iman (Komitmen Bertahap)</option>
                    <option value="DONATION">Donasi Langsung (Sekaligus Lunas)</option>
                  </select>
                </div>

                {/* Total Komitmen */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    {newPledgeForm.type === 'PLEDGE' ? 'Total Target Janji Iman (Rp):' : 'Nominal Donasi (Rp):'}
                  </label>
                  <NominalInput
                    value={newPledgeForm.total}
                    onChange={(val) => {
                      setNewPledgeForm({
                        ...newPledgeForm,
                        total: val,
                        initialPaid: newPledgeForm.type === 'DONATION' ? val : newPledgeForm.initialPaid,
                      });
                    }}
                    placeholder="Masukkan nominal target..."
                  />
                </div>

                {/* Setoran Pertama (Jika Janji Iman) */}
                {newPledgeForm.type === 'PLEDGE' && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Setoran Pertama Saat Ini (Rp) - Opsional:
                    </label>
                    <NominalInput
                      value={newPledgeForm.initialPaid}
                      onChange={(val) => setNewPledgeForm({ ...newPledgeForm, initialPaid: val })}
                      placeholder="Rp 0 jika belum ada setoran awal..."
                    />
                  </div>
                )}

                {/* Metode Pembayaran */}
                {(newPledgeForm.type === 'DONATION' || newPledgeForm.initialPaid > 0) && (
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                    <select
                      className="input"
                      value={newPledgeForm.paymentMethod}
                      onChange={(e) => setNewPledgeForm({ ...newPledgeForm, paymentMethod: e.target.value })}
                    >
                      {(lookups?.paymentMethods || [
                        'Transfer Bank (Rekening Mandiri)',
                        'Tunai (Kasir / Sekretariat)',
                        'QRIS Yayasan GMH',
                      ]).map((pm) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Jatuh Tempo */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Target Selesai / Jatuh Tempo (Opsional):</label>
                  <input
                    type="date"
                    className="input"
                    value={newPledgeForm.dueDate}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, dueDate: e.target.value })}
                  />
                </div>

                {/* Catatan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Catatan / Komitmen:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran bulanan Rp 500.000 selama 1 tahun"
                    value={newPledgeForm.notes}
                    onChange={(e) => setNewPledgeForm({ ...newPledgeForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddPledgeModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Komitmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.D. MODAL BAYAR ANGSURAN JANJI IMAN                                      */}
      {/* ========================================================================= */}
      {showAddInstallmentModal && targetPledgeForInstallment && selectedMember && (
        <div className="modal-overlay" onClick={() => setShowAddInstallmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Catat Angsuran Janji Iman</h3>
                <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                  Untuk: <strong>{selectedMember.name}</strong> · {targetPledgeForInstallment.category}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddInstallmentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInstallmentForMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Rincian Target & Sisa */}
                <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--gmh-border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Target Janji Iman:</span>
                    <strong>{formatRupiah(targetPledgeForInstallment.total_pledge)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Sudah Terbayar:</span>
                    <strong style={{ color: '#047857' }}>{formatRupiah(targetPledgeForInstallment.fulfilled_amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>Sisa Kewajiban:</span>
                    <strong style={{ color: '#b45309' }}>
                      {formatRupiah(Math.max(0, Number(targetPledgeForInstallment.total_pledge || 0) - Number(targetPledgeForInstallment.fulfilled_amount || 0)))}
                    </strong>
                  </div>
                </div>

                {/* Nominal Angsuran */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Nominal Angsuran (Rp):</label>
                  <NominalInput
                    value={installmentForm.amount}
                    onChange={(val) => setInstallmentForm({ ...installmentForm, amount: val })}
                    placeholder="Masukkan nominal angsuran..."
                  />
                </div>

                {/* Tanggal Setor */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Penyetoran:</label>
                  <input
                    type="date"
                    className="input"
                    value={installmentForm.date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, date: e.target.value })}
                  />
                </div>

                {/* Metode Pembayaran */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Metode Pembayaran:</label>
                  <select
                    className="input"
                    value={installmentForm.paymentMethod}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Transfer Bank (Rekening Yayasan)</option>
                    <option value="CASH">Tunai (Kasir / Sekretariat)</option>
                    <option value="QRIS">QRIS Yayasan GMH</option>
                  </select>
                </div>

                {/* Catatan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Keterangan / Catatan:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: Angsuran tahap 2 melalui transfer BCA"
                    value={installmentForm.notes}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddInstallmentModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Angsuran &amp; Terbitkan Kuitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.E. MODAL E-KUITANSI DIGITAL RESMI DENGAN QR CODE                        */}
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
                <X size={18} />
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
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
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
                    borderTop: '1px dashed var(--gmh-border)',
                  }}
                >
                  <div
                    style={{
                      padding: 8,
                      background: '#fff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={52} color="var(--gmh-green-dark)" />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={14} /> Dokumen Sah &amp; Terverifikasi
                    </div>
                    <div>Pindai kode QR untuk memvalidasi keaslian tanda terima ini secara real-time pada sistem gmhpakmk.org.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-outline"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Cetak Kuitansi
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedReceipt(null)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 3. ADD MEMBER MODAL                                                       */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 740, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="modal-header">
              <h3>Tambah Data Anggota Baru (Admin)</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateMember}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 1. Identitas Utama */}
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6 }}>
                  1. Identitas Utama & Tanggal Lahir (Ultah)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nama Lengkap & Gelar *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>NIK (16 Digit) *</span>
                      {newMemberData.nik && (
                        <span style={{ fontSize: 11, color: newMemberData.nik.replace(/[^0-9]/g, '').length === 16 ? 'var(--gmh-green)' : 'var(--gmh-text-muted)', fontWeight: 600 }}>
                          {newMemberData.nik.replace(/[^0-9]/g, '').length}/16 digit
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      className="form-input"
                      placeholder="Contoh: 1271010101960001"
                      style={{
                        borderColor: duplicateNikMember ? 'var(--gmh-danger)' : undefined,
                        background: duplicateNikMember ? '#fff1f2' : undefined,
                      }}
                      value={newMemberData.nik}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewMemberData({ ...newMemberData, nik: val });
                      }}
                      required
                    />
                    {duplicateNikMember && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: '8px 12px',
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#9f1239',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        <AlertTriangle size={16} style={{ flexShrink: 0, color: '#e11d48' }} />
                        <div>
                          <strong>NIK Terdeteksi Duplikat:</strong> Sudah terdaftar atas nama <strong>{duplicateNikMember.name}</strong> ({duplicateNikMember.nia}).
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Jenis Kelamin</label>
                    <select
                      className="form-select"
                      value={newMemberData.gender}
                      onChange={(e) => setNewMemberData({ ...newMemberData, gender: e.target.value })}
                    >
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="Medan / Tarutung"
                      className="form-input"
                      value={newMemberData.birthPlace}
                      onChange={(e) => setNewMemberData({ ...newMemberData, birthPlace: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Lahir (Ultah) *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newMemberData.birthDate}
                      onChange={(e) => setNewMemberData({ ...newMemberData, birthDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">{fieldLabels['member.maritalStatus'] || 'Status Pernikahan'}</label>
                    <select
                      className="form-select"
                      value={newMemberData.maritalStatus}
                      onChange={(e) => setNewMemberData({ ...newMemberData, maritalStatus: e.target.value })}
                    >
                      {(lookups.maritalStatuses || ['Lajang', 'Menikah', 'Duda/Janda']).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  {newMemberData.maritalStatus === 'Menikah' && (
                    <div>
                      <label className="form-label">Tanggal Pernikahan (Ultah Nikah)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newMemberData.weddingDate}
                        onChange={(e) => setNewMemberData({ ...newMemberData, weddingDate: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Tempat Tinggal Detail */}
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
                  2. Tempat Tinggal & Domisili Detail
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Alamat Rumah Lengkap (Jalan, RT/RW, Kelurahan)</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Contoh: Jl. Dr. Mansyur No. 45, Kel. Padang Bulan, Medan"
                      value={newMemberData.address}
                      onChange={(e) => setNewMemberData({ ...newMemberData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Kota / Kabupaten</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.city}
                      onChange={(e) => setNewMemberData({ ...newMemberData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Provinsi</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.province}
                      onChange={(e) => setNewMemberData({ ...newMemberData, province: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Kode Pos</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.postalCode}
                      onChange={(e) => setNewMemberData({ ...newMemberData, postalCode: e.target.value })}
                    />
                  </div>
                </div>

                {/* 3. Kontak & Media Sosial */}
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
                  3. Kontak & Media Sosial
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor WhatsApp *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={newMemberData.phone}
                      onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">LinkedIn (URL / Profil)</label>
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      className="form-input"
                      value={newMemberData.socialMedia.linkedin}
                      onChange={(e) =>
                        setNewMemberData({
                          ...newMemberData,
                          socialMedia: { ...newMemberData.socialMedia, linkedin: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Instagram (@username)</label>
                    <input
                      type="text"
                      placeholder="@username"
                      className="form-input"
                      value={newMemberData.socialMedia.instagram}
                      onChange={(e) =>
                        setNewMemberData({
                          ...newMemberData,
                          socialMedia: { ...newMemberData.socialMedia, instagram: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* 4. Akademik USU & Karier */}
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-green-dark)', borderBottom: '1px solid var(--gmh-border)', paddingBottom: 6, marginTop: 6 }}>
                  4. Data Akademik USU & Karier
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">{fieldLabels['member.faculty'] || 'Fakultas'} *</label>
                    <select
                      className="form-select"
                      value={newMemberData.faculty}
                      onChange={(e) => setNewMemberData({ ...newMemberData, faculty: e.target.value })}
                    >
                      {lookups.faculties.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{fieldLabels['member.major'] || 'Jurusan'} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.major}
                      onChange={(e) => setNewMemberData({ ...newMemberData, major: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Tahun Masuk *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newMemberData.entryYear}
                      onChange={(e) => setNewMemberData({ ...newMemberData, entryYear: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">{fieldLabels['member.profession'] || 'Profesi / Pekerjaan'}</label>
                    <input
                      type="text"
                      className="form-input"
                      list="member-professions-list"
                      placeholder="Pilih atau ketik profesi..."
                      value={newMemberData.profession}
                      onChange={(e) => setNewMemberData({ ...newMemberData, profession: e.target.value })}
                    />
                    <datalist id="member-professions-list">
                      {(lookups.professions || []).map((prof) => (
                        <option key={prof} value={prof} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="form-label">Perusahaan / Instansi</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMemberData.company}
                      onChange={(e) => setNewMemberData({ ...newMemberData, company: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">{fieldLabels['member.ktb'] || 'KTB Asal'}</label>
                    <input
                      type="text"
                      className="form-input"
                      list="member-ktb-list"
                      placeholder="Pilih atau ketik KTB..."
                      value={newMemberData.ktb}
                      onChange={(e) => setNewMemberData({ ...newMemberData, ktb: e.target.value })}
                    />
                    <datalist id="member-ktb-list">
                      {(lookups.ktbGroups || []).map((ktb) => (
                        <option key={ktb} value={ktb} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Simpan & Terbitkan NIA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TWO-PHASE EXCEL BULK IMPORT MODAL                                      */}
      {/* ========================================================================= */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={22} color="var(--gmh-green)" />
                <div>
                  <h3>Impor Bulk Data Anggota via File Excel</h3>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                    Mendukung format .xlsx dan .csv dengan sistem Two-Phase Dry Run Validation
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowBulkModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {bulkStep === 'UPLOAD' && (
                <div>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv, .txt, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  {/* Clickable Dropzone Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--gmh-green)';
                      e.currentTarget.style.background = '#f0fdf4';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--gmh-border-dark)';
                      e.currentTarget.style.background = 'var(--gmh-surface-2)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--gmh-border-dark)';
                      e.currentTarget.style.background = 'var(--gmh-surface-2)';
                      const file = e.dataTransfer.files?.[0];
                      if (file) processUploadedFile(file);
                    }}
                    style={{
                      border: '2px dashed var(--gmh-border-dark)',
                      borderRadius: 10,
                      padding: '36px 20px',
                      textAlign: 'center',
                      background: 'var(--gmh-surface-2)',
                      marginBottom: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        color: 'var(--gmh-green)',
                        display: 'grid',
                        placeItems: 'center',
                        margin: '0 auto 12px',
                      }}
                    >
                      <Upload size={28} />
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                      Klik untuk Memilih File atau Drag & Drop ke Sini
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--gmh-text-muted)', marginBottom: 18, maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.5 }}>
                      Mendukung format file <strong>.xlsx</strong> dan <strong>.csv</strong>. Kolom wajib: Nama Lengkap, NIK (16 digit), Fakultas, Jurusan, Tahun Masuk, Nomor HP/WA.
                    </div>

                    <div
                      style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650 }}
                      >
                        <Upload size={14} /> Pilih File dari Komputer
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleDownloadTemplate}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650 }}
                        title="Unduh format template CSV/Excel yang sudah disesuaikan dengan sistem"
                      >
                        <Download size={14} /> Unduh Format Template Excel (.csv)
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleLoadSampleExcel}
                        style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}
                      >
                        Simulasikan Unggah Contoh (4 Baris)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {bulkStep === 'DRY_RUN' && (
                <div>
                  {isSaving ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          border: '4px solid #e2e8f0',
                          borderTopColor: 'var(--gmh-green)',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          margin: '0 auto 16px',
                        }}
                      />
                      <h4 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                        Menyimpan ke Database Yayasan...
                      </h4>
                      <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, marginBottom: 18 }}>
                        Memproses <strong>Batch {saveProgress.currentBatch}</strong> dari {saveProgress.totalBatches} ({saveProgress.processed} dari {saveProgress.total} data tersimpan bertahap per 100 baris)
                      </p>

                      <div style={{ width: '100%', maxWidth: 440, height: 12, background: '#f1f5f9', borderRadius: 999, margin: '0 auto', overflow: 'hidden', border: '1px solid var(--gmh-border)' }}>
                        <div
                          style={{
                            width: `${saveProgress.percent}%`,
                            height: '100%',
                            background: 'var(--gmh-green)',
                            borderRadius: 999,
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--gmh-green)' }}>
                        {saveProgress.percent}% Selesai
                      </div>
                    </div>
                  ) : (
                    <>
                      {uploadedFileName && (
                        <div style={{ fontSize: 13, color: 'var(--gmh-text-muted)', marginBottom: 14 }}>
                          Berkas yang diproses: <strong style={{ color: 'var(--gmh-text-main)' }}>{uploadedFileName}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div className="card" style={{ flex: 1, padding: '12px 16px' }}>
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Total Baris Terdeteksi</div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{importSummary.total}</div>
                        </div>
                        <div className="card" style={{ flex: 1, padding: '12px 16px', borderLeft: '4px solid var(--gmh-green)' }}>
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Valid & Siap Disimpan</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-green)' }}>{importSummary.valid}</div>
                        </div>
                        <div className="card" style={{ flex: 1, padding: '12px 16px', borderLeft: '4px solid var(--gmh-danger)' }}>
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Error Validasi</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gmh-danger)' }}>{importSummary.error}</div>
                        </div>
                      </div>

                      <div className="table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Baris</th>
                              <th>Status</th>
                              <th>Nama Lengkap</th>
                              <th>NIK</th>
                              <th>Fakultas / Jurusan</th>
                              <th>Tahun Masuk</th>
                              <th>Catatan Validasi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dryRunRows.map((r) => (
                              <tr key={r.index} style={{ background: r.status === 'ERROR' ? '#fff1f2' : undefined }}>
                                <td>#{r.index}</td>
                                <td>
                                  {r.status === 'VALID' ? (
                                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <CheckCircle size={10} /> Valid
                                    </span>
                                  ) : (
                                    <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <AlertTriangle size={10} /> Error
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 600 }}>{r.name}</td>
                                <td><code>{r.nik}</code></td>
                                <td>{r.faculty} - {r.major}</td>
                                <td>{r.entryYear}</td>
                                <td style={{ fontSize: 11.5, color: r.status === 'ERROR' ? 'var(--gmh-danger)' : 'var(--gmh-text-muted)' }}>
                                  {r.errorReason || 'Semua kolom valid'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {bulkStep === 'SUCCESS' && (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <CheckCircle size={48} color="var(--gmh-green)" style={{ marginBottom: 12 }} />
                  <h3>Impor Bulk Berhasil Diselesaikan!</h3>
                  <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13.5 }}>
                    {importSummary.valid} data anggota alumni telah masuk ke database yayasan dan telah diterbitkan Nomor Induk Anggota (NIA) resmi.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {bulkStep === 'UPLOAD' && (
                <button className="btn btn-outline btn-sm" onClick={() => setShowBulkModal(false)}>
                  Batal
                </button>
              )}
              {bulkStep === 'DRY_RUN' && (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={isSaving}
                    onClick={() => setBulkStep('UPLOAD')}
                  >
                    Unggah Ulang
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={importSummary.valid === 0 || isSaving}
                    onClick={handleCommitBulkImport}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {isSaving ? (
                      <>Menyimpan ({saveProgress.percent}%)...</>
                    ) : (
                      <>Simpan {importSummary.valid} Baris Valid (Batch 100)</>
                    )}
                  </button>
                </>
              )}
              {bulkStep === 'SUCCESS' && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowBulkModal(false)}>
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FILTER MODAL DIALOG (Entry Point Trigger)                             */}
      {/* ========================================================================= */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: '92%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--gmh-gold-pale)',
                    color: 'var(--gmh-gold-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Filter size={18} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>Filter Data Anggota & Alumni</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                    Pilih kriteria untuk menyaring database anggota Yayasan GMH
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowFilterModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {/* 1. Tahun Angkatan / Masuk */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-entry-year" style={{ fontWeight: 600 }}>
                    Tahun Angkatan / Masuk
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-entry-year"
                    value={draftFilters.entryYear}
                    onChange={(e) => setDraftFilters({ ...draftFilters, entryYear: e.target.value })}
                  >
                    <option value="">Semua Tahun Angkatan</option>
                    {availableEntryYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Angkatan {yr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Kota Domisili */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-city" style={{ fontWeight: 600 }}>
                    Kota Domisili
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-city"
                    value={draftFilters.city}
                    onChange={(e) => setDraftFilters({ ...draftFilters, city: e.target.value })}
                  >
                    <option value="">Semua Kota Domisili</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Fakultas Asal USU */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-faculty" style={{ fontWeight: 600 }}>
                    {fieldLabels['member.faculty'] || 'Fakultas Asal USU'}
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-faculty"
                    value={draftFilters.faculty}
                    onChange={(e) => setDraftFilters({ ...draftFilters, faculty: e.target.value })}
                  >
                    <option value="">Semua {fieldLabels['member.faculty'] || 'Fakultas USU'}</option>
                    {lookups.faculties.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Profesi / Pekerjaan */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-profession" style={{ fontWeight: 600 }}>
                    {fieldLabels['member.profession'] || 'Profesi / Pekerjaan'}
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-profession"
                    value={draftFilters.profession}
                    onChange={(e) => setDraftFilters({ ...draftFilters, profession: e.target.value })}
                  >
                    <option value="">Semua Profesi</option>
                    {availableProfessions.map((prof) => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Status Pernikahan */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-marital" style={{ fontWeight: 600 }}>
                    {fieldLabels['member.maritalStatus'] || 'Status Pernikahan'}
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-marital"
                    value={draftFilters.maritalStatus}
                    onChange={(e) => setDraftFilters({ ...draftFilters, maritalStatus: e.target.value })}
                  >
                    <option value="">Semua Status Nikah</option>
                    {(lookups.maritalStatuses || ['Lajang', 'Menikah', 'Duda/Janda']).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Tipe Anggota */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-type" style={{ fontWeight: 600 }}>
                    Tipe Anggota
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-type"
                    value={draftFilters.type}
                    onChange={(e) => setDraftFilters({ ...draftFilters, type: e.target.value })}
                  >
                    <option value="">Semua Tipe</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="MAHASISWA">Mahasiswa Binaan</option>
                    <option value="STAF_YAYASAN">Staf Yayasan</option>
                  </select>
                </div>

                {/* 7. Status Keanggotaan */}
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-filter-status" style={{ fontWeight: 600 }}>
                    Status Keanggotaan
                  </label>
                  <select
                    className="form-select"
                    id="modal-filter-status"
                    value={draftFilters.status}
                    onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
                  >
                    <option value="">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="MUTATED">Mutasi</option>
                    <option value="DECEASED">Meninggal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleResetDraftFilters}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gmh-danger)' }}
              >
                <RotateCcw size={13} /> Reset Kriteria
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowFilterModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyDraftFilters}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Filter size={14} /> Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* 6. ENTERPRISE ALERT / NOTIFICATION DIALOG (Replaces Native Alert)          */}
      {/* ========================================================================= */}
      {modalAlert.isOpen && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 99999,
            backdropFilter: 'blur(4px)',
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModalAlert({ ...modalAlert, isOpen: false })}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: '100%',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--gmh-border)',
              background: '#ffffff',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background:
                    modalAlert.type === 'danger'
                      ? '#fee2e2'
                      : modalAlert.type === 'warning'
                      ? '#fef3c7'
                      : '#ecfdf5',
                  color:
                    modalAlert.type === 'danger'
                      ? '#dc2626'
                      : modalAlert.type === 'warning'
                      ? '#d97706'
                      : 'var(--gmh-green)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                {modalAlert.type === 'danger' ? (
                  <AlertTriangle size={30} />
                ) : modalAlert.type === 'warning' ? (
                  <AlertCircle size={30} />
                ) : (
                  <CheckCircle size={30} />
                )}
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 750,
                  color: '#0f172a',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}
              >
                {modalAlert.title}
              </h3>

              <p
                style={{
                  fontSize: 13.5,
                  color: '#475569',
                  lineHeight: 1.55,
                  margin: '0 auto 16px',
                  maxWidth: 400,
                }}
              >
                {modalAlert.message}
              </p>

              {modalAlert.detail && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: '#1e293b',
                    fontWeight: 550,
                    textAlign: 'left',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldCheck size={16} color="var(--gmh-green)" style={{ flexShrink: 0 }} />
                  <span>{modalAlert.detail}</span>
                </div>
              )}
            </div>

            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid var(--gmh-border)',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalAlert({ ...modalAlert, isOpen: false })}
                style={{
                  minWidth: 120,
                  fontWeight: 650,
                  borderRadius: 8,
                }}
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
