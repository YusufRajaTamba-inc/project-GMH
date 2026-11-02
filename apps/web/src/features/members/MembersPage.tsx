import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  FileSpreadsheet,
  Upload,
  Plus,
  CheckCircle,
  Users,
  GraduationCap,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { useMemberStore } from '../../state/MemberStoreContext';
import type { Member } from '../../state/MemberStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useAuth } from '../../state/AuthContext';
import { usePagination } from '../../utils/usePagination';
import { api } from '../../services/api';
import type {
  DryRunRow,
  MemberServiceRecord,
  DraftFilters,
  ModalAlertState,
  ReceiptData,
} from './types';
import { MemberListTable } from './components/MemberListTable';
import { MemberDetailModal } from './components/MemberDetailModal';
import { MemberFinancialModals } from './components/MemberFinancialModals';
import { MemberAddModal } from './components/MemberAddModal';
import { MemberBulkImportModal } from './components/MemberBulkImportModal';
import { MemberFilterModal } from './components/MemberFilterModal';
import { MemberAlertModal } from './components/MemberAlertModal';

const MembersPage: React.FC = () => {
  const { user } = useAuth();
  const { members, addMember, deleteMember, addBulkMembersChunked } = useMemberStore();
  const { lookups, fieldLabels } = useDynamicConfig();
  const navigate = useNavigate();

  // Filters State
  const [search, setSearch] = useState('');
  const [filterEntryYear, setFilterEntryYear] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterProfession, setFilterProfession] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMaritalStatus, setFilterMaritalStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals visibility
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Mission Activities integration
  const [missionActivities, setMissionActivities] = useState<any[]>([]);

  useEffect(() => {
    api.missions
      .getAll()
      .then((res: any) => {
        if (res?.activities && Array.isArray(res.activities)) {
          setMissionActivities(res.activities);
        }
      })
      .catch(() => {});
  }, []);

  const memberServiceRecords = useMemo((): MemberServiceRecord[] => {
    if (!selectedMember) return [];
    const memberName = selectedMember.name.toLowerCase().trim();
    const memberId = selectedMember.id;
    const records: MemberServiceRecord[] = [];

    missionActivities.forEach((act) => {
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

  // Donations & Pledges State
  const [showDonationsPortfolioModal, setShowDonationsPortfolioModal] = useState(false);
  const [memberDonationsLoading, setMemberDonationsLoading] = useState(false);
  const [memberPledges, setMemberPledges] = useState<any[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [memberTotalPledged, setMemberTotalPledged] = useState(0);
  const [memberTotalDonated, setMemberTotalDonated] = useState(0);

  // New Pledge Sub-modal
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

  // Installment Sub-modal
  const [showAddInstallmentModal, setShowAddInstallmentModal] = useState(false);
  const [targetPledgeForInstallment, setTargetPledgeForInstallment] = useState<any | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });

  // E-Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

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
    } catch {
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

  // Draft filters state
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
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
    birthPlace: '',
    birthDate: '',
    bloodType: '',
    faculty: '',
    major: '',
    entryYear: '' as any,
    graduationYear: '' as any,
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    email: '',
    profession: '',
    company: '',
    ktb: '',
    ministryInterest: '',
    maritalStatus: 'Lajang',
    weddingDate: '',
    partnerName: '',
    childrenCount: 0,
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
  const [importSummary, setImportSummary] = useState({ total: 0, valid: 0, error: 0 });
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processed: 0,
    total: 0,
    percent: 0,
  });

  // Alert Modal State
  const [modalAlert, setModalAlert] = useState<ModalAlertState>({
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
    setModalAlert({ isOpen: true, title, message, detail, type });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN_OPERASIONAL'].includes(user.role);

  // Duplicate NIK check
  const duplicateNikMember = useMemo(() => {
    const raw = (newMemberData.nik || '').replace(/[^0-9]/g, '');
    if (!raw || raw.length < 16) return null;
    return members.find((m) => m.nik && m.nik.replace(/[^0-9]/g, '') === raw) || null;
  }, [newMemberData.nik, members]);

  // Filter options
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

  const availableProfessions = useMemo(() => {
    const profSet = new Set<string>();
    if (lookups.professions && Array.isArray(lookups.professions)) {
      lookups.professions.forEach((p: string) => {
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

  // Ringkasan Data Anggota & Alumni
  const summaryStats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'ACTIVE').length;
    const inactive = total - active;
    const alumni = members.filter((m) => m.type === 'ALUMNI' || !m.type).length;
    const students = members.filter((m) => m.type === 'MAHASISWA').length;
    const ktbCount = members.filter(
      (m) => m.ktb && m.ktb.trim() !== '' && m.ktb !== '-'
    ).length;
    const ktbPercent = total > 0 ? Math.round((ktbCount / total) * 100) : 0;

    const faculties = new Set(
      members.map((m) => m.faculty?.trim()).filter((f): f is string => Boolean(f && f !== '-'))
    );
    const cities = new Set(
      members.map((m) => m.city?.trim()).filter((c): c is string => Boolean(c && c !== '-'))
    );
    const employed = members.filter(
      (m) =>
        m.profession &&
        m.profession.trim() !== '' &&
        m.profession !== '-' &&
        !m.profession.toLowerCase().includes('belum') &&
        !m.profession.toLowerCase().includes('calon wisuda')
    ).length;

    return {
      total,
      active,
      inactive,
      alumni,
      students,
      ktbCount,
      ktbPercent,
      facultyCount: faculties.size,
      cityCount: cities.size,
      employed,
    };
  }, [members]);

  // Filtered members list
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

  // Pagination
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

  const handleOpenEdit = (m: Member) => {
    navigate(`/members/${m.id}/edit`);
  };

  const handleDeleteMember = (m: Member) => {
    if (confirm(`Hapus anggota ${m.name} (${m.nia}) dari database?`)) {
      deleteMember(m.id);
      showToast(`Data anggota ${m.name} telah dihapus.`);
    }
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
        partnerName: isSingle ? undefined : (newMemberData.partnerName || undefined),
        childrenCount: isSingle ? 0 : Number(newMemberData.childrenCount || 0),
        ministryInterest: newMemberData.ministryInterest || undefined,
      });

      setShowAddModal(false);
      showToast(`Anggota baru ${newMemberData.name} berhasil didaftarkan dan diterbitkan NIA!`);
      setNewMemberData({
        name: '',
        nik: '',
        gender: 'Laki-laki',
        birthPlace: '',
        birthDate: '',
        bloodType: '',
        faculty: '',
        major: '',
        entryYear: '' as any,
        graduationYear: '' as any,
        address: '',
        city: '',
        province: '',
        postalCode: '',
        phone: '',
        email: '',
        profession: '',
        company: '',
        ktb: '',
        ministryInterest: '',
        maritalStatus: 'Lajang',
        weddingDate: '',
        partnerName: '',
        childrenCount: 0,
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

  // CSV Export
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
      '\uFEFF' +
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

  // Bulk Template Download
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

        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
        const headers = parseCsvLine(headerLine, delimiter).map((h) => h.toLowerCase());

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
    if (e.target) e.target.value = '';
  };

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
        nik: '12711111029400',
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
      showAlert('Gagal Menyimpan Data', `Terjadi kesalahan saat menyimpan data ke database: ${err.message || 'Terjadi kesalahan jaringan'}`, undefined, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Pledge & Installment Handlers
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Data Anggota &amp; Alumni Yayasan GMH</h2>
          <p>
            {members.length} anggota terdaftar ·{' '}
            {members.filter((m) => m.status === 'ACTIVE').length} aktif · Terhubung ke Alumni PA KMK USU
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* Ringkasan Data Anggota & Alumni Yayasan */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {/* Card 1: Total Anggota Terdaftar */}
        <div
          className="stat-card"
          onClick={() => {
            if (filterStatus) setFilterStatus('');
            else setFilterStatus('ACTIVE');
          }}
          style={{
            cursor: 'pointer',
            borderColor: filterStatus === 'ACTIVE' ? 'var(--gmh-primary)' : undefined,
            background: filterStatus === 'ACTIVE' ? 'var(--gmh-primary-50, #f0fdf4)' : undefined,
          }}
          title="Klik untuk filter anggota aktif"
        >
          <div className="stat-card-label">TOTAL ANGGOTA &amp; ALUMNI</div>
          <div className="stat-card-icon" style={{ color: 'var(--gmh-primary)' }}>
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--gmh-text)' }}>
            {summaryStats.total}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Orang</span>
          </div>
          <div className="stat-card-meta">
            <span style={{ color: 'var(--gmh-green)', fontWeight: 600 }}>{summaryStats.active} Aktif</span>
            {summaryStats.inactive > 0 ? (
              <span> · {summaryStats.inactive} Non-Aktif</span>
            ) : (
              <span> · 100% Aktif Terdata</span>
            )}
          </div>
        </div>

        {/* Card 2: Alumni PA KMK USU */}
        <div
          className="stat-card"
          onClick={() => setFilterType(filterType === 'ALUMNI' ? '' : 'ALUMNI')}
          style={{
            cursor: 'pointer',
            borderColor: filterType === 'ALUMNI' ? 'var(--gmh-gold)' : undefined,
            background: filterType === 'ALUMNI' ? '#fefce8' : undefined,
          }}
          title="Klik untuk filter tipe Alumni"
        >
          <div className="stat-card-label">ALUMNI PA KMK USU</div>
          <div className="stat-card-icon" style={{ color: 'var(--gmh-gold)' }}>
            <GraduationCap size={20} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--gmh-text)' }}>
            {summaryStats.alumni}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Alumni</span>
          </div>
          <div className="stat-card-meta">
            <span>{summaryStats.facultyCount} Fakultas USU terdata</span>
            {summaryStats.students > 0 && <span> · {summaryStats.students} Mahasiswa</span>}
          </div>
        </div>

        {/* Card 3: Kelompok Tumbuh Bersama (KTB) */}
        <div className="stat-card">
          <div className="stat-card-label">KELOMPOK TUMBUH BERSAMA</div>
          <div className="stat-card-icon" style={{ color: 'var(--gmh-green)' }}>
            <BookOpen size={20} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--gmh-text)' }}>
            {summaryStats.ktbCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Anggota</span>
          </div>
          <div className="stat-card-meta">
            <span style={{ color: 'var(--gmh-green-dark)', fontWeight: 600 }}>{summaryStats.ktbPercent}%</span>
            <span> memiliki catatan KTB asal kampus</span>
          </div>
        </div>

        {/* Card 4: Sebaran Domisili & Karier */}
        <div className="stat-card">
          <div className="stat-card-label">SEBARAN DOMISILI &amp; KARIER</div>
          <div className="stat-card-icon" style={{ color: '#0284c7' }}>
            <MapPin size={20} strokeWidth={1.8} />
          </div>
          <div className="stat-card-value" style={{ fontSize: 24, color: 'var(--gmh-text)' }}>
            {summaryStats.cityCount}{' '}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gmh-text-muted)' }}>Kota</span>
          </div>
          <div className="stat-card-meta">
            <span>{summaryStats.employed} orang berkarier aktif / profesional</span>
          </div>
        </div>
      </div>

      {/* Main Table and Filter Toolbar */}
      <MemberListTable
        members={members}
        filtered={filtered}
        paginatedMembers={paginatedMembers}
        search={search}
        setSearch={setSearch}
        activeFilterCount={activeFilterCount}
        isFiltered={isFiltered}
        onOpenFilterModal={handleOpenFilterModal}
        onResetFilters={handleResetFilters}
        filterEntryYear={filterEntryYear}
        setFilterEntryYear={setFilterEntryYear}
        filterCity={filterCity}
        setFilterCity={setFilterCity}
        filterFaculty={filterFaculty}
        setFilterFaculty={setFilterFaculty}
        filterProfession={filterProfession}
        setFilterProfession={setFilterProfession}
        filterMaritalStatus={filterMaritalStatus}
        setFilterMaritalStatus={setFilterMaritalStatus}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        fieldLabels={fieldLabels}
        isSuperAdminOrAdmin={isSuperAdminOrAdmin}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteMember}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
      />

      {/* Modals */}
      <MemberDetailModal
        selectedMember={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={handleOpenEdit}
        isSuperAdminOrAdmin={isSuperAdminOrAdmin}
        memberServiceRecords={memberServiceRecords}
        memberPledges={memberPledges}
        memberDonationsLoading={memberDonationsLoading}
        memberTotalPledged={memberTotalPledged}
        memberTotalDonated={memberTotalDonated}
        onOpenAddPledge={() => setShowAddPledgeModal(true)}
        onOpenDonationsPortfolio={() => setShowDonationsPortfolioModal(true)}
        onOpenInstallment={handleOpenInstallmentForPledge}
      />

      <MemberFinancialModals
        selectedMember={selectedMember}
        showDonationsPortfolioModal={showDonationsPortfolioModal}
        setShowDonationsPortfolioModal={setShowDonationsPortfolioModal}
        memberDonationsLoading={memberDonationsLoading}
        memberPledges={memberPledges}
        memberTransactions={memberTransactions}
        memberTotalPledged={memberTotalPledged}
        memberTotalDonated={memberTotalDonated}
        showAddPledgeModal={showAddPledgeModal}
        setShowAddPledgeModal={setShowAddPledgeModal}
        newPledgeForm={newPledgeForm}
        setNewPledgeForm={setNewPledgeForm}
        handleSaveNewPledgeForMember={handleSaveNewPledgeForMember}
        showAddInstallmentModal={showAddInstallmentModal}
        setShowAddInstallmentModal={setShowAddInstallmentModal}
        targetPledgeForInstallment={targetPledgeForInstallment}
        installmentForm={installmentForm}
        setInstallmentForm={setInstallmentForm}
        handleSaveInstallmentForMember={handleSaveInstallmentForMember}
        handleOpenInstallmentForPledge={handleOpenInstallmentForPledge}
        selectedReceipt={selectedReceipt}
        setSelectedReceipt={setSelectedReceipt}
        lookups={lookups}
      />

      <MemberAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateMember}
        newMemberData={newMemberData}
        setNewMemberData={setNewMemberData}
        duplicateNikMember={duplicateNikMember}
        lookups={lookups}
        fieldLabels={fieldLabels}
      />

      <MemberBulkImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        bulkStep={bulkStep}
        setBulkStep={setBulkStep}
        dryRunRows={dryRunRows}
        importSummary={importSummary}
        uploadedFileName={uploadedFileName}
        isSaving={isSaving}
        saveProgress={saveProgress}
        onFileUpload={handleFileUpload}
        onDropFile={processUploadedFile}
        onDownloadTemplate={handleDownloadTemplate}
        onLoadSample={handleLoadSampleExcel}
        onCommitImport={handleCommitBulkImport}
      />

      <MemberFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onApply={handleApplyDraftFilters}
        onReset={handleResetDraftFilters}
        availableEntryYears={availableEntryYears}
        availableCities={availableCities}
        availableProfessions={availableProfessions}
        lookups={lookups}
        fieldLabels={fieldLabels}
      />

      <MemberAlertModal
        modalAlert={modalAlert}
        onClose={() => setModalAlert({ ...modalAlert, isOpen: false })}
      />
    </div>
  );
};

export default MembersPage;
