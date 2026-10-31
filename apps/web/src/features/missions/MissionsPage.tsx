import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Calendar,
  Clock,
  User,
  Plus,
  ArrowLeft,
  DollarSign,
  Download,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Search,
  Check,
  FileText,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck,
  Lock,
  UserPlus,
  FileDown,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatRupiah } from '../../utils/currency';
import NominalInput from '../../components/NominalInput';
import { exportHtmlToPdf } from '../../utils/pdfExport';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import { useMemberStore } from '../../state/MemberStoreContext';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';

export interface MissionTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
  central_tx_code?: string;
}

export interface RundownItem {
  id: string;
  time: string;
  pic: string;
  note: string;
}

export interface TaskItem {
  id: string;
  task: string;
  pic: string;
  done: boolean;
  estimated_cost?: number;
}

export interface CommitteeItem {
  id: string;
  role: string;
  name: string;
  contact?: string;
  member_id?: string;
}

export interface MissionaryPerson {
  id: string;
  name: string;
  member_id?: string;
  pos: string;
  region: string;
  since: string;
  status: 'ACTIVE' | 'FURLOUGH';
  contact?: string;
}

export interface MissionActivity {
  id: string;
  title: string;
  theme?: string;
  budget_estimate: number | string;
  coordinator?: string;
  location?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  time_preview?: string;
  description?: string;
  media_drive_url?: string;
  document_drive_url?: string;
  status: 'ON_PROGRESS' | 'COMPLETED' | 'PLANNING' | string;
  cash_balance: number | string;
  transactions?: MissionTransaction[];
  rundown?: RundownItem[];
  tasks?: TaskItem[];
  committees?: CommitteeItem[];
}

// Dynamic time preview formatter
const generateTimePreview = (dateStr: string, start: string, end: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `${dateStr} (${start} - ${end} WIB)`;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    const timePart = start && end ? `(Pkl. ${start} - ${end} WIB)` : start ? `(Pkl. ${start} WIB)` : '';
    return `${dayName}, ${dayNum} ${monthName} ${year} ${timePart}`.trim();
  } catch {
    return `${dateStr} (${start} - ${end})`;
  }
};

export const MissionsPage: React.FC = () => {
  // Navigation View: 'list' (Daftar Kegiatan Misi) or 'dashboard' (Dashboard Terpadu)
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [activities, setActivities] = useState<MissionActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Member database integration
  const { members } = useMemberStore();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modals
  const [showRintisModal, setShowRintisModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MissionActivity | null>(null);

  // Form State for "Rintis Dokumen Kegiatan Baru" (Persis Gambar 1)
  const [formRintis, setFormRintis] = useState({
    title: '',
    theme: '',
    budgetEstimate: 0,
    coordinator: '',
    location: '',
    eventDate: '2026-10-30',
    startTime: '09:00',
    endTime: '12:00',
    description: '',
    mediaDriveUrl: '',
    documentDriveUrl: '',
  });

  // Independent Cash Form States (Persis Gambar 2 & 3)
  const [formCashEntry, setFormCashEntry] = useState({
    type: 'IN' as 'IN' | 'OUT',
    amount: 0,
    category: '',
    description: '',
  });

  const [formTransferSubsidi, setFormTransferSubsidi] = useState({
    type: 'AMBIL_SUBSIDI' as 'AMBIL_SUBSIDI' | 'SETOR_SISA',
    amount: 0,
    notes: '',
  });

  // Right Column Forms (Rundown, Task, Committee)
  const [activeTabAgenda, setActiveTabAgenda] = useState<'rundown' | 'tasks'>('rundown');
  const [formRundown, setFormRundown] = useState({ time: '', pic: '', note: '' });
  
  // Task form with estimated_cost
  const [formTask, setFormTask] = useState<{ task: string; pic: string; estimated_cost: number | '' }>({
    task: '',
    pic: '',
    estimated_cost: '',
  });

  // Committee form with member picker & manual option
  const [formCommittee, setFormCommittee] = useState<{
    role: string;
    name: string;
    contact: string;
    member_id: string;
    isManual: boolean;
  }>({
    role: '',
    name: '',
    contact: '',
    member_id: '',
    isManual: false,
  });
  const [committeeSearchQuery, setCommitteeSearchQuery] = useState('');
  const [showCommitteeDropdown, setShowCommitteeDropdown] = useState(false);

  // Dynamic Missionaries State (Personil Pekabar Injil)
  const [missionaries, setMissionaries] = useState<MissionaryPerson[]>([]);
  const [showMissionaryModal, setShowMissionaryModal] = useState(false);
  const [editingMissionary, setEditingMissionary] = useState<MissionaryPerson | null>(null);
  const [formMissionary, setFormMissionary] = useState({
    name: '',
    member_id: '',
    pos: 'Pos Pelayanan Simalungun',
    region: 'Sumatera Utara',
    since: '2026-01',
    status: 'ACTIVE' as 'ACTIVE' | 'FURLOUGH',
    contact: '',
    isManual: false,
  });
  const [missionarySearchQuery, setMissionarySearchQuery] = useState('');
  const [showMissionaryDropdown, setShowMissionaryDropdown] = useState(false);

  const saveMissionaries = (list: MissionaryPerson[]) => {
    setMissionaries(list);
  };

  const filteredCommitteeMembers = useMemo(() => {
    const q = committeeSearchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nia && m.nia.toLowerCase().includes(q)) ||
        (m.faculty && m.faculty.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [members, committeeSearchQuery]);

  const filteredMissionaryMembers = useMemo(() => {
    const q = missionarySearchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nia && m.nia.toLowerCase().includes(q)) ||
        (m.faculty && m.faculty.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [members, missionarySearchQuery]);

  // Real Foundation Main Cash Balance from Finance Store
  const { getOperationalBalance, getMainFoundationBalance, refreshFromApi, addTransaction } = useFinanceStore();
  const yayasanMainCash = getMainFoundationBalance ? getMainFoundationBalance() : getOperationalBalance();

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch activities from API
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await api.missions.getAll().catch(() => null);
      const list = res?.activities || res?.data || [];
      if (Array.isArray(list)) {
        setActivities(list);
        if (list.length > 0) {
          if (!selectedActivityId || !list.find((a: any) => a.id === selectedActivityId)) {
            setSelectedActivityId(list[0].id);
          }
        } else {
          setSelectedActivityId('');
        }
      }
    } catch (err) {
      console.warn('Gagal memuat kegiatan misi dari API:', err);
      setActivities([]);
      setSelectedActivityId('');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMissionaries = async () => {
    try {
      const res = await api.organization.getStaff({ department_id: 'PELAYANAN_MISI' }).catch(() => null);
      const staff = res?.staff || [];
      if (Array.isArray(staff) && staff.length > 0) {
        const mapped: MissionaryPerson[] = staff.map((s: any) => ({
          id: s.id,
          name: s.member_name || s.full_name || 'Misionaris',
          member_id: s.member_id || '',
          pos: s.position_title || 'Pos Pelayanan Misi',
          region: 'Sumatera Utara',
          since: s.joined_date ? s.joined_date.slice(0, 7) : '2023-01',
          status: s.is_active ? 'ACTIVE' : 'FURLOUGH',
          contact: s.phone_number || '',
        }));
        setMissionaries(mapped);
      }
    } catch {}
  };

  useEffect(() => {
    fetchActivities();
    fetchMissionaries();
  }, []);

  // Filtered Activities with month, year, search, and status
  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const s = search.toLowerCase().trim();
      const matchSearch =
        !s ||
        (a.title || '').toLowerCase().includes(s) ||
        (a.theme || '').toLowerCase().includes(s) ||
        (a.coordinator || '').toLowerCase().includes(s) ||
        (a.location || '').toLowerCase().includes(s);

      const matchStatus = filterStatus ? a.status === filterStatus : true;

      let matchMonth = true;
      let matchYear = true;
      if (a.event_date) {
        const parts = a.event_date.split('-');
        if (parts.length >= 2) {
          if (filterYear) matchYear = parts[0] === filterYear;
          if (filterMonth) matchMonth = parts[1] === filterMonth;
        }
      } else {
        if (filterMonth || filterYear) {
          matchMonth = false;
          matchYear = false;
        }
      }

      return matchSearch && matchStatus && matchMonth && matchYear;
    });
  }, [activities, search, filterStatus, filterMonth, filterYear]);

  // Pagination for Activities List
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedActivities,
  } = usePagination(filteredActivities, { initialPageSize: 6 });

  // Selected Active Activity
  const activeActivity = useMemo(() => {
    return activities.find((a) => a.id === selectedActivityId) || activities[0] || null;
  }, [activities, selectedActivityId]);

  const totalMasuk = useMemo(() => {
    if (!activeActivity || !activeActivity.transactions) return 0;
    return activeActivity.transactions
      .filter((t) => t.type === 'IN')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [activeActivity]);

  const totalKeluar = useMemo(() => {
    if (!activeActivity || !activeActivity.transactions) return 0;
    return activeActivity.transactions
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [activeActivity]);

  // Open Dashboard View
  const handleOpenDashboard = (actId: string) => {
    setSelectedActivityId(actId);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to List View
  const handleBackToList = () => {
    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit "Rintis Dokumen Kegiatan Baru" (Persis Gambar 1)
  const handleSimpanRintis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRintis.title.trim()) {
      alert('Nama kegiatan / agenda resmi wajib diisi.');
      return;
    }

    const timePreview = generateTimePreview(
      formRintis.eventDate,
      formRintis.startTime,
      formRintis.endTime
    );

    const payload = {
      title: formRintis.title.trim(),
      theme: formRintis.theme.trim(),
      budgetEstimate: formRintis.budgetEstimate,
      coordinator: formRintis.coordinator.trim() || 'Belum diatur',
      location: formRintis.location.trim() || 'Belum diatur',
      eventDate: formRintis.eventDate,
      startTime: formRintis.startTime,
      endTime: formRintis.endTime,
      timePreview: timePreview,
      description: formRintis.description.trim(),
      mediaDriveUrl: formRintis.mediaDriveUrl.trim(),
      documentDriveUrl: formRintis.documentDriveUrl.trim(),
    };

    try {
      const res = await api.missions.create(payload);
      if (res?.activity) {
        setActivities((prev) => [res.activity, ...prev]);
        setSelectedActivityId(res.activity.id);
      } else {
        const localNew: MissionActivity = {
          id: `ACT-${Date.now()}`,
          title: payload.title,
          theme: payload.theme,
          budget_estimate: payload.budgetEstimate,
          coordinator: payload.coordinator,
          location: payload.location,
          event_date: payload.eventDate,
          start_time: payload.startTime,
          end_time: payload.endTime,
          time_preview: payload.timePreview,
          description: payload.description,
          media_drive_url: payload.mediaDriveUrl,
          document_drive_url: payload.documentDriveUrl,
          status: 'ON_PROGRESS',
          cash_balance: 0,
          transactions: [
            {
              id: `trx-${Date.now()}`,
              date: formRintis.eventDate,
              type: 'IN',
              category: 'Pembukaan Kantong Kas',
              description: 'Pembukaan kantong kas kegiatan mandiri baru oleh staf.',
              amount: 0,
            },
          ],
          rundown: [],
          tasks: [],
          committees: [],
        };
        setActivities((prev) => [localNew, ...prev]);
        setSelectedActivityId(localNew.id);
      }

      showToast(`Dokumen kegiatan "${formRintis.title}" berhasil dirintis!`);
      setShowRintisModal(false);
      setViewMode('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('Gagal merintis kegiatan: ' + (err.message || 'Terjadi kesalahan sistem.'));
    }
  };

  // Submit Cash Transaction Entry (Entri Kas Kegiatan)
  const handleAddCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity) return;
    if (formCashEntry.amount <= 0) {
      alert('Jumlah nominal harus lebih besar dari Rp 0.');
      return;
    }
    if (!formCashEntry.description.trim()) {
      alert('Keterangan / sumber dana transaksi wajib diisi.');
      return;
    }

    try {
      const payload = {
        type: formCashEntry.type,
        category: formCashEntry.category.trim() || (formCashEntry.type === 'IN' ? 'Pemasukan Mandiri' : 'Pengeluaran Mandiri'),
        description: formCashEntry.description.trim(),
        amount: formCashEntry.amount,
        date: new Date().toISOString().slice(0, 10),
      };

      const res = await api.missions.addTransaction(activeActivity.id, payload);
      if (res?.activity) {
        setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? res.activity : a)));
      } else {
        const newTrx: MissionTransaction = {
          id: `trx-${Date.now()}`,
          date: payload.date,
          type: payload.type,
          category: payload.category,
          description: payload.description,
          amount: payload.amount,
        };
        const currentTrxs = activeActivity.transactions || [];
        const updatedTrxs = [newTrx, ...currentTrxs];
        const newBal = updatedTrxs.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedAct: MissionActivity = {
          ...activeActivity,
          transactions: updatedTrxs,
          cash_balance: newBal,
        };
        setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
      }

      showToast(`Transaksi kas ${formCashEntry.type === 'IN' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat.`);
      setFormCashEntry({
        type: 'IN',
        amount: 0,
        category: '',
        description: '',
      });
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + (err.message || 'Terjadi kendala.'));
    }
  };

  // Submit Transfer / Subsidi Yayasan
  const handleTransferSubsidi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity) return;
    if (formTransferSubsidi.amount <= 0) {
      alert('Nominal transfer harus lebih besar dari Rp 0.');
      return;
    }

    const isAmbil = formTransferSubsidi.type === 'AMBIL_SUBSIDI';

    // Validation checks
    const activeBalanceNum = Number(activeActivity.cash_balance) || 0;
    if (!isAmbil && formTransferSubsidi.amount > activeBalanceNum) {
      alert(
        `Nominal setor sisa kas (Rp ${formTransferSubsidi.amount.toLocaleString(
          'id-ID'
        )}) tidak boleh melebihi saldo kas kegiatan saat ini (Rp ${activeBalanceNum.toLocaleString(
          'id-ID'
        )}).`
      );
      return;
    }

    if (isAmbil && formTransferSubsidi.amount > yayasanMainCash && yayasanMainCash > 0) {
      const proceed = confirm(
        `Perhatian: Nominal subsidi (Rp ${formTransferSubsidi.amount.toLocaleString(
          'id-ID'
        )}) lebih besar dari saldo kas yayasan yang tersedia (Rp ${yayasanMainCash.toLocaleString(
          'id-ID'
        )}). Tetap lanjutkan alokasi?`
      );
      if (!proceed) return;
    }

    const payload = {
      type: isAmbil ? ('IN' as const) : ('OUT' as const),
      category: isAmbil ? 'Subsidi Kas Yayasan' : 'Setor Sisa Kas ke Yayasan',
      description:
        formTransferSubsidi.notes.trim() ||
        (isAmbil ? 'Pencairan subsidi dari kas utama yayasan' : 'Pengembalian sisa kas ke yayasan'),
      amount: formTransferSubsidi.amount,
      date: new Date().toISOString().slice(0, 10),
      transferType: formTransferSubsidi.type,
      isSubsidiTransfer: true,
    };

    try {
      const res = await api.missions.addTransaction(activeActivity.id, payload);
      if (res?.activity) {
        setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? res.activity : a)));
      } else {
        const newTrx: MissionTransaction = {
          id: `trx-${Date.now()}`,
          ...payload,
          central_tx_code: res?.centralTxCode,
        };
        const currentTrxs = activeActivity.transactions || [];
        const updatedTrxs = [newTrx, ...currentTrxs];
        const newBal = updatedTrxs.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedAct: MissionActivity = {
          ...activeActivity,
          transactions: updatedTrxs,
          cash_balance: newBal,
        };
        setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
      }

      // Sync central foundation finance store locally
      addTransaction({
        date: new Date().toISOString().slice(0, 10),
        desc: isAmbil
          ? `[Subsidi Kas Kegiatan] ${activeActivity.title}${formTransferSubsidi.notes ? ` - ${formTransferSubsidi.notes}` : ''}`
          : `[Setor Sisa Kas Kegiatan] ${activeActivity.title}${formTransferSubsidi.notes ? ` - ${formTransferSubsidi.notes}` : ''}`,
        category: isAmbil ? 'Operasional Misi' : 'Pengembalian Sisa Operasional',
        party: activeActivity.coordinator || 'Panitia Misi',
        amount: formTransferSubsidi.amount,
        type: isAmbil ? 'DEBIT' : 'CREDIT',
        account: 'KAS_OPERASIONAL',
        source: 'OPERASIONAL',
        status: 'Approved',
        notes: formTransferSubsidi.notes,
      });

      // Synchronize with API finance ledger
      await refreshFromApi().catch(() => {});

      showToast(
        isAmbil
          ? `Subsidi Rp ${formTransferSubsidi.amount.toLocaleString('id-ID')} berhasil dialokasikan ke kas kegiatan!`
          : `Sisa kas Rp ${formTransferSubsidi.amount.toLocaleString('id-ID')} berhasil disetorkan kembali ke kas yayasan!`
      );
      setFormTransferSubsidi({ type: 'AMBIL_SUBSIDI', amount: 0, notes: '' });
    } catch (err: any) {
      alert('Gagal mengeksekusi transfer kas: ' + err.message);
    }
  };

  // Delete Cash Transaction
  const handleDeleteTransaction = async (trxId: string) => {
    if (!activeActivity) return;
    if (confirm('Hapus baris transaksi kas kegiatan ini?')) {
      try {
        await api.missions.deleteTransaction(activeActivity.id, trxId);
        const updated = (activeActivity.transactions || []).filter((t) => t.id !== trxId);
        const newBal = updated.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedAct: MissionActivity = {
          ...activeActivity,
          transactions: updated,
          cash_balance: newBal,
        };
        setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
        await refreshFromApi().catch(() => {});
        showToast('Transaksi kas kegiatan telah dihapus.');
      } catch (err: any) {
        alert('Gagal menghapus transaksi: ' + err.message);
      }
    }
  };

  // Add Rundown Item
  const handleAddRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity) return;
    if (!formRundown.note.trim()) {
      alert('Uraian detail rincian acara wajib diisi.');
      return;
    }

    const newItem: RundownItem = {
      id: `rd-${Date.now()}`,
      time: formRundown.time.trim() || '18:00',
      pic: formRundown.pic.trim() || 'Tim Acara',
      note: formRundown.note.trim(),
    };

    const updatedRundown = [...(activeActivity.rundown || []), newItem];
    const updatedAct = { ...activeActivity, rundown: updatedRundown };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));

    try {
      await api.missions.updateRundown(activeActivity.id, updatedRundown);
      showToast('Agenda rundown berhasil ditambahkan.');
      setFormRundown({ time: '', pic: '', note: '' });
    } catch (err: any) {
      console.warn('Gagal simpan rundown:', err);
    }
  };

  // Delete Rundown Item
  const handleDeleteRundown = async (rdId: string) => {
    if (!activeActivity) return;
    const updatedRundown = (activeActivity.rundown || []).filter((r) => r.id !== rdId);
    const updatedAct = { ...activeActivity, rundown: updatedRundown };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
    try {
      await api.missions.updateRundown(activeActivity.id, updatedRundown);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Add Task Item
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity) return;
    if (!formTask.task.trim()) {
      alert('Uraian tugas persiapan wajib diisi.');
      return;
    }

    const newTask: TaskItem = {
      id: `tsk-${Date.now()}`,
      task: formTask.task.trim(),
      pic: formTask.pic.trim() || 'Panitia',
      done: false,
      estimated_cost: formTask.estimated_cost ? Number(formTask.estimated_cost) : undefined,
    };

    const updatedTasks = [...(activeActivity.tasks || []), newTask];
    const updatedAct = { ...activeActivity, tasks: updatedTasks };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));

    try {
      await api.missions.updateTasks(activeActivity.id, updatedTasks);
      showToast('Tugas persiapan berhasil ditambahkan.');
      setFormTask({ task: '', pic: '', estimated_cost: '' });
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Toggle Task Done
  const handleToggleTask = async (taskId: string) => {
    if (!activeActivity) return;
    const updatedTasks = (activeActivity.tasks || []).map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    const updatedAct = { ...activeActivity, tasks: updatedTasks };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
    try {
      await api.missions.updateTasks(activeActivity.id, updatedTasks);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!activeActivity) return;
    const updatedTasks = (activeActivity.tasks || []).filter((t) => t.id !== taskId);
    const updatedAct = { ...activeActivity, tasks: updatedTasks };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
    try {
      await api.missions.updateTasks(activeActivity.id, updatedTasks);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Add Committee Member
  const handleAddCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivity) return;
    if (!formCommittee.name.trim()) {
      alert('Nama pengurus / pelayan wajib diisi.');
      return;
    }

    const newCom: CommitteeItem = {
      id: `com-${Date.now()}`,
      role: formCommittee.role.trim() || 'Pelayan Acara',
      name: formCommittee.name.trim(),
      contact: formCommittee.contact.trim(),
      member_id: formCommittee.member_id || undefined,
    };

    const updatedCommittees = [...(activeActivity.committees || []), newCom];
    const updatedAct = { ...activeActivity, committees: updatedCommittees };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));

    try {
      await api.missions.updateCommittees(activeActivity.id, updatedCommittees);
      showToast(`Pelayan "${newCom.name}" berhasil ditambahkan.`);
      setFormCommittee({ role: '', name: '', contact: '', member_id: '', isManual: false });
      setCommitteeSearchQuery('');
      setShowCommitteeDropdown(false);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Delete Committee Member
  const handleDeleteCommittee = async (comId: string) => {
    if (!activeActivity) return;
    const updated = (activeActivity.committees || []).filter((c) => c.id !== comId);
    const updatedAct = { ...activeActivity, committees: updated };
    setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
    try {
      await api.missions.updateCommittees(activeActivity.id, updated);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Toggle Activity Status
  const handleToggleStatus = async () => {
    if (!activeActivity) return;
    const nextStatus = activeActivity.status === 'COMPLETED' ? 'ON_PROGRESS' : 'COMPLETED';
    try {
      await api.missions.updateStatus(activeActivity.id, nextStatus);
      const updatedAct: MissionActivity = { ...activeActivity, status: nextStatus };
      setActivities((prev) => prev.map((a) => (a.id === activeActivity.id ? updatedAct : a)));
      showToast(`Status kegiatan diubah menjadi ${nextStatus === 'COMPLETED' ? 'Selesai' : 'Sedang Berjalan'}.`);
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!activeActivity) return;
    const trxs = activeActivity.transactions || [];
    let csv = 'TANGGAL,TIPE,KATEGORI/SUMBER,KETERANGAN,JUMLAH (RP)\n';
    trxs.forEach((t) => {
      csv += `"${t.date}","${t.type}","${t.category}","${t.description.replace(/"/g, '""')}","${t.amount}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jurnal_Kas_${activeActivity.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File Jurnal CSV berhasil diunduh.');
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Directly export and save PDF without opening printer window
  const handleDownloadPDF = async () => {
    if (!activeActivity) return;
    try {
      setIsExportingPDF(true);
      showToast('Sedang memproses dan menyusun file PDF...');
      const cleanTitle = (activeActivity.title || 'Kegiatan')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_');
      const filename = `LPJ_Misi_${cleanTitle}_2026.pdf`;
      await exportHtmlToPdf('mission-official-print-report', {
        filename,
      });
      showToast('File PDF berhasil disimpan ke perangkat Anda.');
    } catch (err: any) {
      console.error('Gagal simpan PDF:', err);
      alert('Gagal membuat file PDF: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (act: MissionActivity) => {
    if (act.status === 'COMPLETED') {
      alert('Kegiatan misi yang telah berstatus Selesai / Rampung LPJ tidak dapat dihapus demi integritas arsip yayasan.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen kegiatan "${act.title}"?`)) {
      try {
        await api.missions.delete(act.id);
        const updated = activities.filter((a) => a.id !== act.id);
        setActivities(updated);
        showToast(`Kegiatan "${act.title}" telah dihapus.`);
        if (viewMode === 'dashboard') {
          setViewMode('list');
        }
      } catch (err: any) {
        alert('Gagal menghapus kegiatan: ' + err.message);
      }
    }
  };

  // Real-time time preview for Rintis Modal
  const timePreviewComputed = useMemo(() => {
    return generateTimePreview(formRintis.eventDate, formRintis.startTime, formRintis.endTime);
  }, [formRintis.eventDate, formRintis.startTime, formRintis.endTime]);

  return (
    <div className="missions-page-wrapper">
      {/* SCREEN INTERACTIVE VIEW (HIDDEN ON PRINT) */}
      <div className="no-print">
        {/* TOAST MESSAGE */}
      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 18 }}>
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: DAFTAR DOKUMEN KEGIATAN & PELAYANAN MISI (LIST VIEW)              */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div>
          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="page-header-text">
              <h2>Pelayanan Misi & Program Kegiatan Terpadu</h2>
              <p>
                Manajemen terpadu agenda misi, pos pelayanan, rundown acara, panitia, serta kantong kas mandiri kegiatan yayasan.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={fetchActivities}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Memperbarui…' : 'Segarkan Data'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowRintisModal(true)}
                id="btn-rintis-kegiatan-baru"
                style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a' }}
              >
                <Plus size={14} /> Rintis Dokumen Kegiatan Baru
              </button>
            </div>
          </div>

          {/* KPI METRIC CARDS */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-label">TOTAL KEGIATAN MISI</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
                {activities.length} Kegiatan
              </div>
              <div className="stat-card-meta">
                {activities.filter((a) => a.status === 'ON_PROGRESS').length} Sedang Berjalan Aktif
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">TOTAL TAKSASI ANGGARAN</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
                {formatRupiah(activities.reduce((s, a) => s + (Number(a.budget_estimate) || 0), 0))}
              </div>
              <div className="stat-card-meta">Estimasi Biaya Program</div>
            </div>

            <div
              className="stat-card"
              style={
                {
                  '--stat-color': 'var(--gmh-green)',
                  '--stat-color-pale': 'var(--gmh-green-pale)',
                } as React.CSSProperties
              }
            >
              <div className="stat-card-label">KAS KANTONG MANDIRI</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-green)' }}>
                {formatRupiah(activities.reduce((s, a) => s + (Number(a.cash_balance) || 0), 0))}
              </div>
              <div className="stat-card-meta">Saldo di Seluruh Kegiatan</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">SALDO UTAMA KAS YAYASAN</div>
              <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-gold)' }}>
                {formatRupiah(yayasanMainCash)}
              </div>
              <div className="stat-card-meta">Siap Disubsidi ke Misi</div>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
                <Search className="search-box-icon" />
                <input
                  className="form-input"
                  id="search-missions"
                  placeholder="Cari nama kegiatan misi, tema, kordinator, atau lokasi pos…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 150 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="ON_PROGRESS">Sedang Berjalan</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PLANNING">Perencanaan</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 140 }}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">Semua Bulan</option>
                <option value="01">Januari (01)</option>
                <option value="02">Februari (02)</option>
                <option value="03">Maret (03)</option>
                <option value="04">April (04)</option>
                <option value="05">Mei (05)</option>
                <option value="06">Juni (06)</option>
                <option value="07">Juli (07)</option>
                <option value="08">Agustus (08)</option>
                <option value="09">September (09)</option>
                <option value="10">Oktober (10)</option>
                <option value="11">November (11)</option>
                <option value="12">Desember (12)</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 120 }}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">Semua Tahun</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>

              {(search || filterStatus || filterMonth || filterYear) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('');
                    setFilterMonth('');
                    setFilterYear('');
                  }}
                  style={{ fontSize: 12, color: '#64748b' }}
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* LIST OF MISSION ACTIVITIES */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="var(--gmh-green)" />
                Daftar Kegiatan Pelayanan Misi ({filteredActivities.length})
              </div>
              <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Klik tombol "Buka Dashboard Terpadu" untuk kelola kas mandiri, rundown & panitia
              </span>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginatedActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                  <Globe size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  <div>Tidak ada kegiatan pelayanan misi yang sesuai dengan filter pencarian.</div>
                </div>
              ) : (
                paginatedActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 10,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span
                            className="badge"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: act.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                              color: act.status === 'COMPLETED' ? '#065f46' : '#92400e',
                            }}
                          >
                            {act.status === 'COMPLETED' ? 'STATUS: SELESAI' : 'STATUS: SEDANG BERJALAN'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                            ID: <code style={{ fontSize: 11 }}>{act.id}</code>
                          </span>
                        </div>
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            margin: '0 0 4px 0',
                            color: 'var(--gmh-text)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenDashboard(act.id)}
                        >
                          {act.title}
                        </h3>
                        {act.theme && (
                          <div style={{ fontSize: 13, color: 'var(--gmh-green-mid)', fontWeight: 500, marginBottom: 4 }}>
                            Tema: "{act.theme}"
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {act.status === 'COMPLETED' ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled
                            style={{ opacity: 0.45, cursor: 'not-allowed', color: '#94a3b8', borderColor: '#cbd5e1' }}
                            title="Kegiatan misi yang telah Selesai tidak dapat dihapus demi integritas arsip LPJ"
                          >
                            <Lock size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDeleteActivity(act)}
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            title="Hapus dokumen kegiatan"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenDashboard(act.id)}
                          id={`btn-open-dashboard-${act.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 600,
                            padding: '6px 14px',
                            background: '#0f172a',
                          }}
                        >
                          <FileText size={14} /> Buka Dashboard Terpadu <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Summary Bar */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                        background: '#f9fafb',
                        padding: '12px 16px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        color: 'var(--gmh-text-muted)',
                      }}
                    >
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Kordinator Pelayan:</span>
                        <strong style={{ color: 'var(--gmh-text)' }}>{act.coordinator || 'Belum diatur'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Lokasi / Pos:</span>
                        <strong style={{ color: 'var(--gmh-text)' }}>{act.location || 'Belum diatur'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Waktu Pelaksanaan:</span>
                        <strong style={{ color: 'var(--gmh-text)' }}>{act.time_preview || act.event_date}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 11, color: '#9ca3af' }}>Kas Kantong Mandiri:</span>
                        <strong style={{ color: 'var(--gmh-green)', fontSize: 13 }}>
                          {formatRupiah(Number(act.cash_balance))}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Component */}
            <div style={{ padding: '0 20px 16px' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                pageSizeOptions={[6, 12, 24]}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="kegiatan misi"
              />
            </div>
          </div>

          {/* PERSONIL PEKABAR INJIL & POS PELAYANAN (DYNAMIC & RELATE KE ANGGOTA) */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="var(--gmh-gold)" /> Personil Pekabar Injil &amp; Pos Pelayanan ({missionaries.length})
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setEditingMissionary(null);
                  setFormMissionary({
                    name: '',
                    member_id: '',
                    pos: 'Pos Pelayanan Simalungun',
                    region: 'Sumatera Utara',
                    since: new Date().toISOString().slice(0, 7),
                    status: 'ACTIVE',
                    contact: '',
                    isManual: false,
                  });
                  setMissionarySearchQuery('');
                  setShowMissionaryModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--gmh-green-dark)' }}
              >
                <UserPlus size={14} /> + Tambah Personil Pekabar Injil
              </button>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pekabar Injil</th>
                    <th>Pos Pelayanan</th>
                    <th>Wilayah</th>
                    <th>Sejak</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {missionaries.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-green-dark)' }}>{m.name}</div>
                          {m.member_id ? (
                            <span style={{ fontSize: 10, color: 'var(--gmh-green)', fontWeight: 600 }}>
                              ✓ Anggota Terdaftar
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>
                              Non-Anggota / Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#1e293b' }}>{m.pos}</strong>
                        {m.contact && <div style={{ fontSize: 11, color: '#64748b' }}>{m.contact}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} color="var(--gmh-text-light)" />
                          <span style={{ fontSize: 13 }}>{m.region}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{m.since}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            const next = m.status === 'ACTIVE' ? 'FURLOUGH' : 'ACTIVE';
                            const updated = missionaries.map((x) => (x.id === m.id ? { ...x, status: next as any } : x));
                            saveMissionaries(updated);
                            showToast(`Status "${m.name}" diubah menjadi ${next === 'ACTIVE' ? 'Aktif' : 'Cuti'}.`);
                          }}
                          className={`badge ${m.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Klik untuk ubah status aktif/cuti"
                        >
                          {m.status === 'ACTIVE' ? 'Aktif Melayani' : 'Cuti / Furlough'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingMissionary(m);
                              setFormMissionary({
                                name: m.name,
                                member_id: m.member_id || '',
                                pos: m.pos,
                                region: m.region,
                                since: m.since,
                                status: m.status,
                                contact: m.contact || '',
                                isManual: !m.member_id,
                              });
                              setMissionarySearchQuery(m.name);
                              setShowMissionaryModal(true);
                            }}
                            style={{ padding: '3px 6px', color: '#0284c7' }}
                            title="Edit personil"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (confirm(`Hapus personil pekabar Injil "${m.name}"?`)) {
                                const updated = missionaries.filter((x) => x.id !== m.id);
                                saveMissionaries(updated);
                                showToast(`Personil "${m.name}" berhasil dihapus.`);
                              }
                            }}
                            style={{ padding: '3px 6px', color: '#dc2626' }}
                            title="Hapus personil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DASHBOARD KEGIATAN TERPADU (PERSIS GAMBAR 2 & 3)                  */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' && activeActivity && (
        <div>
          {/* TOP ACTIONS NAV BAR */}
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleBackToList}
              id="btn-back-to-activities-list"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '7px 14px' }}
            >
              <ArrowLeft size={16} /> Kembali ke Daftar Kegiatan
            </button>

            {/* Top Right Action Buttons from Image 2 */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditingActivity({ ...activeActivity })}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit size={14} /> Edit Rincian
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCSV}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Unduh Jurnal CSV
              </button>

              <button
                type="button"
                className="btn btn-sm"
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                title="Langsung unduh dan simpan dokumen PDF ke perangkat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  opacity: isExportingPDF ? 0.75 : 1,
                  cursor: isExportingPDF ? 'wait' : 'pointer',
                }}
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyiapkan PDF…
                  </>
                ) : (
                  <>
                    <FileDown size={14} /> Unduh Laporan PDF
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleToggleStatus}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: activeActivity.status === 'COMPLETED' ? '#b45309' : '#047857',
                  borderColor: activeActivity.status === 'COMPLETED' ? '#fde68a' : '#a7f3d0',
                }}
              >
                <CheckCircle2 size={14} />
                {activeActivity.status === 'COMPLETED' ? 'Buka Kembali Kegiatan' : 'Tandai Selesai'}
              </button>

              {activeActivity.status === 'COMPLETED' ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled
                  style={{ opacity: 0.45, cursor: 'not-allowed', color: '#94a3b8', borderColor: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Kegiatan misi yang telah Selesai tidak dapat dihapus demi integritas arsip LPJ"
                >
                  <Lock size={14} /> Terkunci (Selesai)
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDeleteActivity(activeActivity)}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              )}

              <span
                style={{
                  fontSize: 11.5,
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  borderRadius: 6,
                  color: '#4b5563',
                  fontFamily: 'monospace',
                }}
              >
                ID: {activeActivity.id}
              </span>
            </div>
          </div>

          {/* MAIN HEADER CARD (PERSIS GAMBAR 2) */}
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#e2e8f0',
                        color: '#334155',
                        letterSpacing: '0.5px',
                      }}
                    >
                      DASHBOARD KEGIATAN TERPADU
                    </span>

                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: activeActivity.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                        color: activeActivity.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                        letterSpacing: '0.5px',
                      }}
                    >
                      STATUS: {activeActivity.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERJALAN'}
                    </span>
                  </div>

                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gmh-text)' }}>
                    {activeActivity.title}
                  </h1>
                  {activeActivity.theme && (
                    <div style={{ fontSize: 14, color: 'var(--gmh-green-mid)', fontWeight: 500 }}>
                      Tema: "{activeActivity.theme}"
                    </div>
                  )}
                </div>

                {/* Top Right Stats Box */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div
                    style={{
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 8,
                      padding: '8px 16px',
                      textAlign: 'right',
                      background: '#f8fafc',
                    }}
                  >
                    <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, display: 'block' }}>
                      TAKSASI DANA
                    </span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-text)' }}>
                      {formatRupiah(Number(activeActivity.budget_estimate))}
                    </strong>
                  </div>

                  <div
                    style={{
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '8px 16px',
                      textAlign: 'right',
                      background: '#f0fdf4',
                    }}
                  >
                    <span style={{ fontSize: 10.5, color: '#166534', fontWeight: 600, display: 'block' }}>
                      KAS KANTONG KEGIATAN
                    </span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-green)' }}>
                      {formatRupiah(Number(activeActivity.cash_balance))}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 META CARDS ROW (PERSIS GAMBAR 2) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            {/* Card 1: Pelayan / Kordinator */}
            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PELAYAN / KORDINATOR</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {activeActivity.coordinator || 'Belum diatur'}
                </div>
              </div>
            </div>

            {/* Card 2: Lokasi & Tempat */}
            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>LOKASI & TEMPAT</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {activeActivity.location || 'MEDAN'}
                </div>
              </div>
            </div>

            {/* Card 3: Waktu */}
            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <Clock size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>WAKTU</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                  {activeActivity.time_preview || activeActivity.event_date || 'Belum diatur'}
                </div>
              </div>
            </div>

            {/* Card 4: Status Kas */}
            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                }}
              >
                <DollarSign size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>STATUS KAS</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: activeActivity.status === 'COMPLETED' ? '#15803d' : '#854d0e', marginTop: 1 }}>
                  {activeActivity.status === 'COMPLETED' ? 'Selesai & Tutup Kas' : 'Sedang Berjalan'}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VERTICAL FULL-WIDTH SECTIONS (DESKRIPSI & AGENDA DI ATAS KEUANGAN)         */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Card 1: Uraian Deskripsi & Dokumen Drive (Baris Sendiri) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Uraian Deskripsi &amp; Agenda Kegiatan
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setEditingActivity({ ...activeActivity })}
                >
                  <Edit size={12} /> Edit Deskripsi
                </button>
              </div>

              <div className="card-body" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {activeActivity.description || 'Tidak ada catatan deskripsi tambahan untuk rincian kegiatan ini.'}
                </p>

                {/* Drive Links */}
                {(activeActivity.media_drive_url || activeActivity.document_drive_url) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--gmh-border)' }}>
                    {activeActivity.media_drive_url && (
                      <a
                        href={activeActivity.media_drive_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--gmh-info)',
                          fontSize: 12,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} /> Tautan Dokumentasi Foto / Video (Google Drive)
                      </a>
                    )}
                    {activeActivity.document_drive_url && (
                      <a
                        href={activeActivity.document_drive_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--gmh-info)',
                          fontSize: 12,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={13} /> Dokumen Tambahan / Surat Tugas (Google Drive)
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Agenda & Jadwal Kerja (Baris Sendiri di Atas Keuangan) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} /> Agenda &amp; Jadwal Kerja
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTabAgenda === 'rundown' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '3px 10px',
                      fontSize: 11.5,
                      background: activeTabAgenda === 'rundown' ? '#0f172a' : 'transparent',
                    }}
                    onClick={() => setActiveTabAgenda('rundown')}
                  >
                    Rundown Acara
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTabAgenda === 'tasks' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '3px 10px',
                      fontSize: 11.5,
                      background: activeTabAgenda === 'tasks' ? '#0f172a' : 'transparent',
                    }}
                    onClick={() => setActiveTabAgenda('tasks')}
                  >
                    Tugas Persiapan
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Tab 1: Rundown Acara */}
                {activeTabAgenda === 'rundown' && (
                  <div>
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#64748b',
                        marginBottom: 12,
                      }}
                    >
                      Rundown waktu acara Hari-H untuk koordinasi alur acara.
                    </div>

                    {/* Rundown List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      {(activeActivity.rundown || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                          <CheckCircle2 size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                          Agenda rundown belum terdaftar.
                        </div>
                      ) : (
                        (activeActivity.rundown || []).map((rd) => (
                          <div
                            key={rd.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              padding: '10px 14px',
                              background: '#ffffff',
                              border: '1px solid var(--gmh-border)',
                              borderRadius: 6,
                              fontSize: 12.5,
                              gap: 12,
                            }}
                          >
                            <div style={{ flex: 1, paddingRight: 10 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--gmh-green-mid)',
                                  marginRight: 8,
                                  fontSize: 11.5,
                                  display: 'inline-block',
                                  background: '#f1f5f9',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                {rd.time}
                              </span>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--gmh-text)',
                                  wordBreak: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  overflowWrap: 'break-word',
                                  lineHeight: 1.5,
                                  marginTop: 4,
                                }}
                              >
                                {rd.note}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                PIC: {rd.pic}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteRundown(rd.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                padding: 4,
                              }}
                              title="Hapus baris rundown"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Form Tambah Rundown dengan Textarea Besar */}
                    <div style={{ borderTop: '1px solid var(--gmh-border)', paddingTop: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Tambah Agenda Rundown</div>
                      <form onSubmit={handleAddRundown} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, padding: '6px 8px' }}
                            placeholder="Waktu (e.g. 18:00)"
                            value={formRundown.time}
                            onChange={(e) => setFormRundown({ ...formRundown, time: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, padding: '6px 8px' }}
                            placeholder="Penanggung Jawab (PIC)"
                            value={formRundown.pic}
                            onChange={(e) => setFormRundown({ ...formRundown, pic: e.target.value })}
                          />
                        </div>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          style={{
                            fontSize: 12.5,
                            padding: '8px 10px',
                            minHeight: 72,
                            resize: 'vertical',
                            width: '100%',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5,
                          }}
                          placeholder="Uraian detail rincian acara (huruf tidak akan hilang ketika habis baris)..."
                          value={formRundown.note}
                          onChange={(e) => setFormRundown({ ...formRundown, note: e.target.value })}
                          required
                        />
                        <button
                          type="submit"
                          className="btn btn-sm"
                          style={{
                            background: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 600,
                            padding: '6px 14px',
                            alignSelf: 'flex-start',
                          }}
                        >
                          + Tambah Agenda Rundown
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Tab 2: Tugas Persiapan */}
                {activeTabAgenda === 'tasks' && (() => {
                  const totalTaskCost = (activeActivity.tasks || []).reduce(
                    (acc, t) => acc + (Number(t.estimated_cost) || 0),
                    0
                  );
                  return (
                    <div>
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '10px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#64748b',
                          marginBottom: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                          border: '1px solid var(--gmh-border)',
                        }}
                      >
                        <div>Daftar checklist persiapan logistik, surat tugas, dan perlengkapan.</div>
                        {totalTaskCost > 0 && (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#047857',
                              background: '#ecfdf5',
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            Total Estimasi Biaya: {formatRupiah(totalTaskCost)}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        {(activeActivity.tasks || []).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                            Belum ada tugas persiapan.
                          </div>
                        ) : (
                          (activeActivity.tasks || []).map((t) => (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                background: t.done ? '#f0fdf4' : '#ffffff',
                                border: '1px solid var(--gmh-border)',
                                borderRadius: 6,
                                fontSize: 12.5,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                                <input
                                  type="checkbox"
                                  checked={t.done}
                                  onChange={() => handleToggleTask(t.id)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                                <span
                                  style={{
                                    textDecoration: t.done ? 'line-through' : 'none',
                                    color: t.done ? '#15803d' : 'var(--gmh-text)',
                                    fontWeight: t.done ? 400 : 500,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {t.task} <small style={{ color: '#64748b' }}>({t.pic})</small>
                                </span>
                                {t.estimated_cost !== undefined && Number(t.estimated_cost) > 0 && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      background: '#ecfdf5',
                                      color: '#047857',
                                      border: '1px solid #a7f3d0',
                                      marginLeft: 4,
                                    }}
                                  >
                                    {formatRupiah(Number(t.estimated_cost))}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#9ca3af',
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Form Tambah Task */}
                      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 2, minWidth: 150, fontSize: 12, padding: '6px 8px' }}
                          placeholder="Tugas baru (e.g. Modul materi)..."
                          value={formTask.task}
                          onChange={(e) => setFormTask({ ...formTask, task: e.target.value })}
                          required
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, minWidth: 90, fontSize: 12, padding: '6px 8px' }}
                          placeholder="PIC"
                          value={formTask.pic}
                          onChange={(e) => setFormTask({ ...formTask, pic: e.target.value })}
                        />
                        <div style={{ width: 140, flexShrink: 0 }}>
                          <NominalInput
                            value={formTask.estimated_cost}
                            onChange={(val) => setFormTask({ ...formTask, estimated_cost: val })}
                            placeholder="Biaya (Rp)..."
                            style={{ fontSize: 12, padding: '6px 8px' }}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-sm"
                          style={{ background: '#0f172a', color: '#ffffff', fontWeight: 600, padding: '6px 14px', height: 34 }}
                        >
                          + Tambah
                        </button>
                      </form>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Card 3: Kantong Dana Kegiatan & Jurnal Keuangan (Uang Masuk & Keluar) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
                  <DollarSign size={18} color="var(--gmh-gold)" /> Kantong Dana Kegiatan &amp; Jurnal Keuangan
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    KAS MANDIRI
                  </span>
                </div>

                <div className="card-body">
                  {/* Banner Subtitle */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      marginBottom: 16,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gmh-text)' }}>
                        Uang Masuk &amp; Keluar Kegiatan ini Terpisah
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                        Semoga kegiatan {activeActivity.title} berjalan sukses dan penuh berkat.
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'right',
                        background: yayasanMainCash >= 0 ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${yayasanMainCash >= 0 ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: 8,
                        padding: '6px 14px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: yayasanMainCash >= 0 ? '#166534' : '#991b1b',
                          fontWeight: 700,
                          display: 'block',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        SALDO UTAMA YAYASAN
                      </span>
                      <strong
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: yayasanMainCash >= 0 ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {formatRupiah(yayasanMainCash)}
                      </strong>
                    </div>
                  </div>

                  {/* 2 Sub-Forms: Entri Kas & Subsidi Yayasan (Persis Gambar 2) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginBottom: 16,
                    }}
                  >
                    {/* Form 1: Entri Kas Kegiatan */}
                    <div
                      style={{
                        border: '1px solid var(--gmh-border)',
                        borderRadius: 10,
                        padding: '16px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                          <Clock size={15} color="#64748b" /> Entri Kas Kegiatan
                        </div>
                        <form onSubmit={handleAddCashEntry} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                            <div>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Arus Transaksi</label>
                              <select
                                className="form-select"
                                style={{ fontSize: 12, padding: '7px 8px' }}
                                value={formCashEntry.type}
                                onChange={(e) => setFormCashEntry({ ...formCashEntry, type: e.target.value as any })}
                              >
                                <option value="IN">Uang Masuk (Pemasukan)</option>
                                <option value="OUT">Uang Keluar (Pengeluaran)</option>
                              </select>
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Jumlah (Rp)</label>
                              <NominalInput
                                value={formCashEntry.amount}
                                onChange={(val) => setFormCashEntry({ ...formCashEntry, amount: val })}
                                placeholder="0"
                                style={{ fontSize: 12, padding: '7px 8px' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Keterangan / Sumber Dana</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: 12, padding: '7px 8px' }}
                              placeholder="Contoh: Pembelian lilin / Donasi"
                              value={formCashEntry.description}
                              onChange={(e) => setFormCashEntry({ ...formCashEntry, description: e.target.value })}
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              fontWeight: 600,
                              padding: '8px 12px',
                              marginTop: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              borderRadius: 6,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Plus size={13} /> Buku Transaksi Kegiatan
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Form 2: Subsidi / Transfer Kas Yayasan */}
                    <div
                      style={{
                        border: '1px solid var(--gmh-border)',
                        borderRadius: 10,
                        padding: '16px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#1e293b' }}>
                            <DollarSign size={15} color="#64748b" /> Subsidi / Transfer Kas Yayasan
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? '#eff6ff' : '#fef3c7',
                              color: formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? '#1d4ed8' : '#b45309',
                            }}
                          >
                            {formTransferSubsidi.type === 'AMBIL_SUBSIDI' ? 'Yayasan ➔ Acara' : 'Acara ➔ Yayasan'}
                          </span>
                        </div>
                        <form onSubmit={handleTransferSubsidi} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                            <div>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Tipe Transfer</label>
                              <select
                                className="form-select"
                                style={{ fontSize: 12, padding: '7px 8px' }}
                                value={formTransferSubsidi.type}
                                onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, type: e.target.value as any })}
                              >
                                <option value="AMBIL_SUBSIDI">Ambil Subsidi Yayasan</option>
                                <option value="SETOR_SISA">Setor Sisa Kas ke Yayasan</option>
                              </select>
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Nominal (Rp)</label>
                              <NominalInput
                                value={formTransferSubsidi.amount}
                                onChange={(val) => setFormTransferSubsidi({ ...formTransferSubsidi, amount: val })}
                                placeholder="0"
                                style={{ fontSize: 12, padding: '7px 8px' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="form-label" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Catatan Transfer</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: 12, padding: '7px 8px' }}
                              placeholder="Contoh: Tambahan anggaran Sie Konsumsi"
                              value={formTransferSubsidi.notes}
                              onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, notes: e.target.value })}
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn btn-sm"
                            style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              fontWeight: 600,
                              padding: '8px 12px',
                              marginTop: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              borderRadius: 6,
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <ArrowRightLeft size={13} /> Eksekusi Transfer Kas
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Log Jurnal Keuangan Mandiri Acara (Persis Gambar 2 & 3) */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
                    Log Jurnal Keuangan Mandiri Acara ({(activeActivity.transactions || []).length})
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ARUS KAS KEGIATAN</span>
                </div>

                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 110 }}>TANGGAL</th>
                        <th style={{ width: 140 }}>KATEGORI / SUMBER</th>
                        <th>KETERANGAN</th>
                        <th style={{ width: 130, textAlign: 'right' }}>JUMLAH (RP)</th>
                        <th style={{ width: 60, textAlign: 'center' }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeActivity.transactions || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                            Belum ada catatan mutasi kas pada kegiatan ini.
                          </td>
                        </tr>
                      ) : (
                        (activeActivity.transactions || []).map((trx) => (
                          <tr key={trx.id}>
                            <td style={{ color: '#475569' }}>{trx.date}</td>
                            <td>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: trx.type === 'IN' ? '#dcfce7' : '#fee2e2',
                                  color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {trx.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 500, color: 'var(--gmh-text)' }}>{trx.category}</span>
                                {trx.central_tx_code && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      background: '#e0f2fe',
                                      color: '#0369a1',
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                    title={`Tersinkronisasi ke Kas Pusat Yayasan (${trx.central_tx_code})`}
                                  >
                                    <ShieldCheck size={10} /> {trx.central_tx_code}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748b' }}>{trx.description}</div>
                            </td>
                            <td
                              style={{
                                textAlign: 'right',
                                fontWeight: 700,
                                color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {trx.type === 'IN' ? `+ ${formatRupiah(trx.amount)}` : `- ${formatRupiah(trx.amount)}`}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(trx.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  padding: 4,
                                }}
                                title="Hapus transaksi"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </div>

            {/* Card 4: Susunan Pengurus & Pelayan Acara (Baris Sendiri) */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={16} /> Susunan Pengurus &amp; Pelayan Acara
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PANITIA ACARA</span>
                </div>

                <div className="card-body">
                  {/* Committee List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(activeActivity.committees || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                        <User size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                        Belum ada susunan panitia atau pelayan acara yang ditambahkan.
                      </div>
                    ) : (
                      (activeActivity.committees || []).map((com) => (
                        <div
                          key={com.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: '#f8fafc',
                            border: '1px solid var(--gmh-border)',
                            borderRadius: 6,
                            fontSize: 12.5,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#e2e8f0',
                                color: '#334155',
                              }}
                            >
                              {com.role}
                            </span>
                            <strong style={{ color: 'var(--gmh-text)' }}>{com.name}</strong>
                            {com.member_id ? (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                ✓ Anggota Yayasan
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                }}
                              >
                                Manual / Eksternal
                              </span>
                            )}
                            {com.contact && (
                              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                                · {com.contact}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCommittee(com.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#9ca3af',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form Tambah Panitia dengan Search Anggota & Opsi Manual */}
                  <form onSubmit={handleAddCommittee} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid var(--gmh-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text)' }}>
                        Tambah Pengurus / Pelayan Acara
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormCommittee((prev) => ({
                            ...prev,
                            isManual: !prev.isManual,
                            member_id: '',
                            name: '',
                            contact: '',
                          }));
                          setCommitteeSearchQuery('');
                          setShowCommitteeDropdown(false);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {formCommittee.isManual ? '← Cari dari Data Anggota' : '+ Opsi Input Manual'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        placeholder="Peran (e.g. Pembicara / MC)"
                        value={formCommittee.role}
                        onChange={(e) => setFormCommittee({ ...formCommittee, role: e.target.value })}
                        required
                      />

                      {/* Name input: Autocomplete if !isManual, Text input if isManual */}
                      {!formCommittee.isManual ? (
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, padding: '6px 8px', width: '100%' }}
                            placeholder="Ketik cari nama anggota..."
                            value={committeeSearchQuery || formCommittee.name}
                            onChange={(e) => {
                              setCommitteeSearchQuery(e.target.value);
                              setFormCommittee({ ...formCommittee, name: e.target.value, member_id: '' });
                              setShowCommitteeDropdown(true);
                            }}
                            onFocus={() => setShowCommitteeDropdown(true)}
                            required
                          />
                          {showCommitteeDropdown && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: '#ffffff',
                                border: '1px solid var(--gmh-border)',
                                borderRadius: 6,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                maxHeight: 180,
                                overflowY: 'auto',
                                zIndex: 50,
                                marginTop: 4,
                              }}
                            >
                              {filteredCommitteeMembers.length === 0 ? (
                                <div style={{ padding: '8px 10px', fontSize: 11.5, color: '#94a3b8' }}>
                                  Anggota tidak ditemukan.
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormCommittee({ ...formCommittee, isManual: true, name: committeeSearchQuery });
                                      setShowCommitteeDropdown(false);
                                    }}
                                    style={{
                                      display: 'block',
                                      marginTop: 4,
                                      background: 'none',
                                      border: 'none',
                                      color: '#2563eb',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      padding: 0,
                                    }}
                                  >
                                    Input nama "{committeeSearchQuery}" secara manual
                                  </button>
                                </div>
                              ) : (
                                filteredCommitteeMembers.map((m) => (
                                  <div
                                    key={m.id}
                                    onClick={() => {
                                      setFormCommittee({
                                        ...formCommittee,
                                        name: m.name,
                                        contact: m.phone || m.email || '',
                                        member_id: m.id,
                                        isManual: false,
                                      });
                                      setCommitteeSearchQuery(m.name);
                                      setShowCommitteeDropdown(false);
                                    }}
                                    style={{
                                      padding: '6px 10px',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f1f5f9',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                                  >
                                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{m.name}</div>
                                    <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                      {m.nia} • {m.faculty || m.profession || 'Alumni'}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: 12, padding: '6px 8px' }}
                          placeholder="Nama lengkap (Manual)"
                          value={formCommittee.name}
                          onChange={(e) => setFormCommittee({ ...formCommittee, name: e.target.value })}
                          required
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, fontSize: 12, padding: '6px 8px' }}
                        placeholder="Kontak / Keterangan (Opsional)"
                        value={formCommittee.contact}
                        onChange={(e) => setFormCommittee({ ...formCommittee, contact: e.target.value })}
                      />
                      <button
                        type="submit"
                        className="btn btn-sm"
                        style={{ background: '#0f172a', color: '#ffffff', fontWeight: 600, padding: '6px 16px' }}
                      >
                        + Tambah
                      </button>
                    </div>
                  </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL: RINTIS DOKUMEN KEGIATAN BARU (PERSIS GAMBAR 1)            */}
      {/* ========================================================================= */}
      {showRintisModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowRintisModal(false)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 540,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>Rintis Dokumen Kegiatan Baru</div>
              <button
                type="button"
                onClick={() => setShowRintisModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSimpanRintis} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. Nama Kegiatan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>
                    Nama Kegiatan / Agenda Resmi (Wajib)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Perayaan Natal Yayasan MMB 2026"
                    value={formRintis.title}
                    onChange={(e) => setFormRintis({ ...formRintis, title: e.target.value })}
                    required
                  />
                </div>

                {/* 2. Tema & Taksasi Dana */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tema Kegiatan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Terang Dunia Terbitlah"
                      value={formRintis.theme}
                      onChange={(e) => setFormRintis({ ...formRintis, theme: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Taksasi Dana Dibutuhkan (Rp)</label>
                    <NominalInput
                      value={formRintis.budgetEstimate}
                      onChange={(val) => setFormRintis({ ...formRintis, budgetEstimate: val })}
                      placeholder="Perkiraan dana..."
                    />
                  </div>
                </div>

                {/* 3. Kordinator Kegiatan */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Kordinator Kegiatan / Pelayan</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Yusuf (Kordinator Natal), Angel (Logistik), dll."
                    value={formRintis.coordinator}
                    onChange={(e) => setFormRintis({ ...formRintis, coordinator: e.target.value })}
                  />
                </div>

                {/* 4. Tempat / Lokasi */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Tempat / Lokasi</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Aula Serbaguna Wisma MMB"
                    value={formRintis.location}
                    onChange={(e) => setFormRintis({ ...formRintis, location: e.target.value })}
                  />
                </div>

                {/* 5. Box Format Waktu (Persis Gambar 1) */}
                <div
                  style={{
                    border: '1px solid var(--gmh-border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gmh-text)' }}>Format Waktu</span>
                    <span style={{ fontSize: 11, color: '#64748b', cursor: 'pointer' }}>Tulis Manual</span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 8 }}>
                    <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Tanggal Kegiatan</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formRintis.eventDate}
                      onChange={(e) => setFormRintis({ ...formRintis, eventDate: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Jam Mulai</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formRintis.startTime}
                        onChange={(e) => setFormRintis({ ...formRintis, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Jam Selesai</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formRintis.endTime}
                        onChange={(e) => setFormRintis({ ...formRintis, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: 'var(--gmh-text)',
                    }}
                  >
                    <strong>Pratinjau:</strong> {timePreviewComputed}
                  </div>
                </div>

                {/* 6. Deskripsi Acara */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Gambaran Ringkas Acara (Deskripsi)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Uraikan deskripsi singkat maksud diadakan perayaan natal atau retreat ini..."
                    value={formRintis.description}
                    onChange={(e) => setFormRintis({ ...formRintis, description: e.target.value })}
                  />
                </div>

                {/* 7. Google Drive Links */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Tautan Foto/Video (Google Drive)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={formRintis.mediaDriveUrl}
                      onChange={(e) => setFormRintis({ ...formRintis, mediaDriveUrl: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Dokumen Tambahan / Surat (Google Drive)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://drive.google.com/..."
                      value={formRintis.documentDriveUrl}
                      onChange={(e) => setFormRintis({ ...formRintis, documentDriveUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer (Persis Gambar 1) */}
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--gmh-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowRintisModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '8px 20px',
                  }}
                >
                  Simpan &amp; Buka Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING MODAL: EDIT RINCIAN DOKUMEN KEGIATAN                             */}
      {/* ========================================================================= */}
      {editingActivity && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setEditingActivity(null)}
        >
          <div
            className="modal"
            style={{
              maxWidth: 540,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Edit Rincian: {editingActivity.title}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingActivity(null)}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await api.missions.update(editingActivity.id, {
                    title: editingActivity.title,
                    theme: editingActivity.theme,
                    budgetEstimate: editingActivity.budget_estimate,
                    coordinator: editingActivity.coordinator,
                    location: editingActivity.location,
                    timePreview: editingActivity.time_preview,
                    description: editingActivity.description,
                    mediaDriveUrl: editingActivity.media_drive_url,
                    documentDriveUrl: editingActivity.document_drive_url,
                  });
                  if (res?.activity) {
                    setActivities((prev) => prev.map((a) => (a.id === editingActivity.id ? res.activity : a)));
                  } else {
                    setActivities((prev) => prev.map((a) => (a.id === editingActivity.id ? { ...editingActivity } : a)));
                  }
                  showToast('Rincian kegiatan berhasil diperbarui.');
                  setEditingActivity(null);
                } catch (err: any) {
                  alert('Gagal update: ' + err.message);
                }
              }}
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nama Kegiatan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingActivity.title}
                    onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tema</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingActivity.theme || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, theme: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={Number(editingActivity.budget_estimate) || 0}
                      onChange={(val) => setEditingActivity({ ...editingActivity, budget_estimate: val })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Kordinator</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingActivity.coordinator || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, coordinator: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lokasi</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingActivity.location || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Waktu Pelaksanaan (Teks)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingActivity.time_preview || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, time_preview: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Ringkas</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={editingActivity.description || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Tautan Foto/Video</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingActivity.media_drive_url || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, media_drive_url: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dokumen Surat Tambahan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingActivity.document_drive_url || ''}
                      onChange={(e) => setEditingActivity({ ...editingActivity, document_drive_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--gmh-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingActivity(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontWeight: 600 }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Personil Pekabar Injil */}
      {showMissionaryModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 28, 21, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => {
            setShowMissionaryModal(false);
            setEditingMissionary(null);
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={18} color="var(--gmh-green)" />
                {editingMissionary ? 'Edit Data Pekabar Injil' : 'Tambah Personil Pekabar Injil'}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowMissionaryModal(false);
                  setEditingMissionary(null);
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formMissionary.name.trim()) {
                  alert('Nama pekabar injil wajib diisi.');
                  return;
                }

                if (editingMissionary) {
                  const updated = missionaries.map((m) =>
                    m.id === editingMissionary.id
                      ? {
                          ...m,
                          name: formMissionary.name.trim(),
                          member_id: formMissionary.member_id || undefined,
                          pos: formMissionary.pos,
                          region: formMissionary.region,
                          since: formMissionary.since,
                          status: formMissionary.status,
                          contact: formMissionary.contact.trim() || undefined,
                        }
                      : m
                  );
                  saveMissionaries(updated);
                  showToast(`Data "${formMissionary.name}" berhasil diperbarui.`);
                } else {
                  const newPerson: MissionaryPerson = {
                    id: `m-staff-${Date.now()}`,
                    name: formMissionary.name.trim(),
                    member_id: formMissionary.member_id || undefined,
                    pos: formMissionary.pos,
                    region: formMissionary.region,
                    since: formMissionary.since,
                    status: formMissionary.status,
                    contact: formMissionary.contact.trim() || undefined,
                  };
                  saveMissionaries([newPerson, ...missionaries]);
                  showToast(`Personil "${newPerson.name}" berhasil ditambahkan.`);
                }

                setShowMissionaryModal(false);
                setEditingMissionary(null);
              }}
            >
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Search Anggota or Manual */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                      Nama Lengkap Pekabar Injil
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormMissionary((prev) => ({
                          ...prev,
                          isManual: !prev.isManual,
                          name: '',
                          member_id: '',
                        }));
                        setMissionarySearchQuery('');
                        setShowMissionaryDropdown(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {formMissionary.isManual ? '← Cari dari Data Anggota' : '+ Opsi Input Manual'}
                    </button>
                  </div>

                  {!formMissionary.isManual ? (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ketik cari nama alumni / staf yayasan..."
                        value={missionarySearchQuery || formMissionary.name}
                        onChange={(e) => {
                          setMissionarySearchQuery(e.target.value);
                          setFormMissionary({ ...formMissionary, name: e.target.value, member_id: '' });
                          setShowMissionaryDropdown(true);
                        }}
                        onFocus={() => setShowMissionaryDropdown(true)}
                        required
                      />
                      {showMissionaryDropdown && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            border: '1px solid var(--gmh-border)',
                            borderRadius: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            maxHeight: 180,
                            overflowY: 'auto',
                            zIndex: 50,
                            marginTop: 4,
                          }}
                        >
                          {filteredMissionaryMembers.length === 0 ? (
                            <div style={{ padding: '8px 10px', fontSize: 11.5, color: '#94a3b8' }}>
                              Tidak ditemukan.
                              <button
                                type="button"
                                onClick={() => {
                                  setFormMissionary({ ...formMissionary, isManual: true, name: missionarySearchQuery });
                                  setShowMissionaryDropdown(false);
                                }}
                                style={{
                                  display: 'block',
                                  marginTop: 4,
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Gunakan "{missionarySearchQuery}" secara manual
                              </button>
                            </div>
                          ) : (
                            filteredMissionaryMembers.map((m) => (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setFormMissionary({
                                    ...formMissionary,
                                    name: m.name,
                                    member_id: m.id,
                                    contact: m.phone || m.email || '',
                                    isManual: false,
                                  });
                                  setMissionarySearchQuery(m.name);
                                  setShowMissionaryDropdown(false);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f1f5f9',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                              >
                                <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{m.name}</div>
                                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                                  {m.nia} • {m.faculty || m.profession || 'Alumni'}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ev. Benyamin Tobing, S.Th"
                      value={formMissionary.name}
                      onChange={(e) => setFormMissionary({ ...formMissionary, name: e.target.value })}
                      required
                    />
                  )}
                  {formMissionary.member_id && (
                    <div style={{ marginTop: 4, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                      ✓ Terhubung dengan ID Anggota Yayasan: {formMissionary.member_id}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Pos Pelayanan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Pos Pelayanan Simalungun"
                      value={formMissionary.pos}
                      onChange={(e) => setFormMissionary({ ...formMissionary, pos: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Wilayah</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sumatera Utara"
                      value={formMissionary.region}
                      onChange={(e) => setFormMissionary({ ...formMissionary, region: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Mulai Melayani (Tahun-Bulan)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2024-01"
                      value={formMissionary.since}
                      onChange={(e) => setFormMissionary({ ...formMissionary, since: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 12 }}>Status Pelayanan</label>
                    <select
                      className="form-select"
                      value={formMissionary.status}
                      onChange={(e) => setFormMissionary({ ...formMissionary, status: e.target.value as any })}
                    >
                      <option value="ACTIVE">Aktif Melayani</option>
                      <option value="FURLOUGH">Cuti / Furlough</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 12 }}>Kontak / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 0812-3456-7890"
                    value={formMissionary.contact}
                    onChange={(e) => setFormMissionary({ ...formMissionary, contact: e.target.value })}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid var(--gmh-border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: '#f8fafc',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowMissionaryModal(false);
                    setEditingMissionary(null);
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 600 }}>
                  {editingMissionary ? 'Simpan Perubahan' : 'Tambahkan Personil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div> {/* END .no-print */}

      {/* ========================================================================= */}
      {/* VIEW 3: DOKUMEN LAPORAN RESMI PERTANGGUNGJAWABAN MISI (PRINT ONLY)       */}
      {/* ========================================================================= */}
      {activeActivity && (
        <div
          id="mission-official-print-report"
          className="print-only"
          style={{
            color: '#0f172a',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.45,
          }}
        >
          {/* ========================================================================= */}
          {/* LEMBAR 1: INFORMASI KEGIATAN & REKAPITULASI KAS MANDIRI                  */}
          {/* ========================================================================= */}
          <div
            className="pdf-page"
            style={{
              width: 794,
              minHeight: 1120,
              boxSizing: 'border-box',
              padding: '24px 32px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pageBreakAfter: 'always',
              breakAfter: 'page',
              marginBottom: 20,
            }}
          >
            <div>
              {/* 1. KOP SURAT FORMAL YAYASAN (HALAMAN 1) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottom: '3px double #0f172a',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: 'contain',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#1b4332',
                      }}
                    >
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: 0.3 }}>
                      BADAN PENGURUS PELAYANAN MISI &amp; PENGABARAN INJIL
                    </div>
                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                      Sekretariat: Jl. PA KMK No. 12, Medan • Email: info@gmhpakmk.org • Website: www.gmhpakmk.org
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    KODE DOKUMEN LPJ
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace' }}>
                    LPJ/GMH-MISI/{activeActivity.id}
                  </div>
                  <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                    Tgl Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                    Halaman 1 dari 2
                  </div>
                </div>
              </div>

              {/* 2. JUDUL DOKUMEN RESMI */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <h1
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    margin: 0,
                    letterSpacing: 0.8,
                    color: '#0f172a',
                  }}
                >
                  LAPORAN PERTANGGUNGJAWABAN KEGIATAN &amp; REALISASI KAS MISI
                </h1>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginTop: 3 }}>
                  DOKUMEN INTEGRASI ARUS KAS &amp; AKTIVITAS PROGRAM MISI
                </div>
              </div>

              {/* 3. INFORMASI POKOK KEGIATAN */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 8,
                    color: '#1e293b',
                  }}
                >
                  I. Informasi Pokok Pelayanan Misi
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: 170, padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Nama Kegiatan</td>
                      <td style={{ width: 10, padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px', fontWeight: 700, color: '#0f172a' }}>{activeActivity.title}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Tema Pelayanan</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px', fontStyle: 'italic' }}>"{activeActivity.theme}"</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Pelayan / Kordinator</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px', fontWeight: 600 }}>{activeActivity.coordinator}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Lokasi &amp; Pos Pelayanan</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px' }}>{activeActivity.location}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Waktu Pelaksanaan</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px' }}>{activeActivity.time_preview || activeActivity.event_date}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Status Penyelenggaraan</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td
                        style={{
                          padding: '3px 4px',
                          fontWeight: 700,
                          color: activeActivity.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                        }}
                      >
                        {activeActivity.status === 'COMPLETED' ? 'SELESAI & TUTUP KAS' : 'SEDANG BERJALAN'}
                      </td>
                    </tr>
                    {activeActivity.description && (
                      <tr>
                        <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569', verticalAlign: 'top' }}>
                          Uraian Pelayanan
                        </td>
                        <td style={{ padding: '3px 0', verticalAlign: 'top' }}>:</td>
                        <td style={{ padding: '3px 4px', color: '#334155' }}>{activeActivity.description}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 4. REKAPITULASI REALISASI KEUANGAN (4 KARTU) */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 8,
                    color: '#1e293b',
                  }}
                >
                  II. Ringkasan Realisasi Keuangan &amp; Kas Mandiri Kegiatan
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '7px 9px', background: '#f8fafc' }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Taksasi Anggaran (Rencana)
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      {formatRupiah(Number(activeActivity.budget_estimate))}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #bbf7d0', borderRadius: 6, padding: '7px 9px', background: '#f0fdf4' }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      Total Pemasukan Kas Acara
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                      + {formatRupiah(totalMasuk)}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #fecaca', borderRadius: 6, padding: '7px 9px', background: '#fef2f2' }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      Total Pengeluaran Kas Acara
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>
                      - {formatRupiah(totalKeluar)}
                    </div>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '7px 9px', background: '#f8fafc' }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Sisa Saldo Kas Kegiatan
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                      {formatRupiah(Number(activeActivity.cash_balance))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. TABEL MUTASI KAS MANDIRI */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 8,
                    color: '#1e293b',
                  }}
                >
                  III. Buku Log Mutasi Kas Mandiri Kegiatan ({(activeActivity.transactions || []).length} Transaksi)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '5px 6px', textAlign: 'center', width: 28 }}>NO</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 85 }}>TANGGAL</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 95 }}>ARUS</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 160 }}>KATEGORI / SUMBER</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left' }}>KETERANGAN / URAIAN</th>
                      <th style={{ padding: '5px 6px', textAlign: 'right', width: 110 }}>JUMLAH (RP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeActivity.transactions || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 12, color: '#94a3b8' }}>
                          Belum ada catatan mutasi transaksi kas pada kegiatan ini.
                        </td>
                      </tr>
                    ) : (
                      (activeActivity.transactions || []).map((t, idx) => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '5px 6px', color: '#334155' }}>{t.date}</td>
                          <td
                            style={{
                              padding: '5px 6px',
                              fontWeight: 700,
                              color: t.type === 'IN' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {t.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN'}
                          </td>
                          <td style={{ padding: '5px 6px', fontWeight: 600 }}>{t.category}</td>
                          <td style={{ padding: '5px 6px', color: '#334155' }}>{t.description || '-'}</td>
                          <td
                            style={{
                              padding: '5px 6px',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: t.type === 'IN' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {t.type === 'IN' ? `+ ${formatRupiah(t.amount)}` : `- ${formatRupiah(t.amount)}`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                      <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right' }}>
                        SISA SALDO KAS KEGIATAN:
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a' }}>
                        {formatRupiah(Number(activeActivity.cash_balance))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* FOOTER HALAMAN 1 */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                borderTop: '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 8.5,
                color: '#64748b',
              }}
            >
              <span>Yayasan Global Mission House (GMH PA KMK) • Sistem Informasi Manajemen Terpadu</span>
              <span>Dokumen Resmi LPJ • Halaman 1 dari 2</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LEMBAR 2: RUNDOWN, TUGAS, SUSUNAN PANITIA & LEMBAR PENGESAHAN            */}
          {/* ========================================================================= */}
          <div
            className="pdf-page"
            style={{
              width: 794,
              minHeight: 1120,
              boxSizing: 'border-box',
              padding: '24px 32px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              pageBreakAfter: 'always',
              breakAfter: 'page',
            }}
          >
            <div>
              {/* 1. KOP SURAT FORMAL YAYASAN (HALAMAN 2) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottom: '3px double #0f172a',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: 'contain',
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#1b4332',
                      }}
                    >
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: 0.3 }}>
                      BADAN PENGURUS PELAYANAN MISI &amp; PENGABARAN INJIL
                    </div>
                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                      Sekretariat: Jl. PA KMK No. 12, Medan • Email: info@gmhpakmk.org • Website: www.gmhpakmk.org
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    KODE DOKUMEN LPJ
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace' }}>
                    LPJ/GMH-MISI/{activeActivity.id}
                  </div>
                  <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                    Tgl Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 8.5, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                    Halaman 2 dari 2
                  </div>
                </div>
              </div>

              {/* SUB-HEADER LAMPIRAN */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '6px 12px',
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>
                  LAMPIRAN RESMI LPJ: {activeActivity.title.toUpperCase()}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>
                  Lembar Pelaksanaan Agenda, Checklist Tugas &amp; Pengesahan
                </div>
              </div>

              {/* 4. RUNDOWN ACARA (Full Width) */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 6,
                    color: '#1e293b',
                  }}
                >
                  IV. Agenda Rundown Acara
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 120 }}>WAKTU</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 170 }}>PENANGGUNG JAWAB (PIC)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left' }}>URAIAN AGENDA ACARA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeActivity.rundown || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                          Belum ada agenda rundown yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      (activeActivity.rundown || []).map((rd, idx) => (
                        <tr key={rd.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '5px 6px', fontWeight: 600 }}>{rd.time}</td>
                          <td style={{ padding: '5px 6px', color: '#334155' }}>{rd.pic}</td>
                          <td style={{ padding: '5px 6px' }}>{rd.note}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 5. TUGAS PERSIAPAN KEGIATAN (Checklist) */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 6,
                    color: '#1e293b',
                  }}
                >
                  V. Daftar Tugas Persiapan Kegiatan &amp; Estimasi Biaya (Checklist)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left' }}>URAIAN TUGAS PERSIAPAN</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 140 }}>PENANGGUNG JAWAB (PIC)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'right', width: 120 }}>ESTIMASI BIAYA (RP)</th>
                      <th style={{ padding: '5px 6px', textAlign: 'center', width: 110 }}>STATUS REALISASI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeActivity.tasks || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                          Belum ada tugas persiapan yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      (activeActivity.tasks || []).map((tsk, idx) => (
                        <tr key={tsk.id} style={{ borderBottom: '1px solid #e2e8f0', background: tsk.done ? '#fcfdfd' : '#ffffff' }}>
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '5px 6px', fontWeight: tsk.done ? 400 : 600 }}>
                            {tsk.task}
                          </td>
                          <td style={{ padding: '5px 6px', color: '#334155' }}>{tsk.pic}</td>
                          <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: tsk.estimated_cost ? '#0f172a' : '#94a3b8' }}>
                            {tsk.estimated_cost ? formatRupiah(Number(tsk.estimated_cost)) : '-'}
                          </td>
                          <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 8.5,
                                fontWeight: 700,
                                letterSpacing: 0.3,
                                background: tsk.done ? '#dcfce7' : '#fef3c7',
                                color: tsk.done ? '#15803d' : '#b45309',
                                border: `1px solid ${tsk.done ? '#86efac' : '#fde68a'}`,
                              }}
                            >
                              {tsk.done ? '✓ SELESAI' : '⏳ DALAM PROSES'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {(activeActivity.tasks || []).length > 0 && (() => {
                    const totalTskCost = (activeActivity.tasks || []).reduce(
                      (sum, t) => sum + (Number(t.estimated_cost) || 0),
                      0
                    );
                    return (
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                          <td colSpan={3} style={{ padding: '6px', textAlign: 'right', fontWeight: 800 }}>
                            TOTAL ESTIMASI BIAYA PERSIAPAN:
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                            {formatRupiah(totalTskCost)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>

              {/* 6. SUSUNAN PANITIA & PELAYAN (Full Width) */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: 4,
                    marginBottom: 6,
                    color: '#1e293b',
                  }}
                >
                  VI. Susunan Panitia &amp; Tim Pelayan Kegiatan
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 220 }}>PERAN / SEKSI / JABATAN</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left' }}>NAMA PELAYAN / ANGGOTA</th>
                      <th style={{ padding: '5px 6px', textAlign: 'left', width: 170 }}>KONTAK / KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeActivity.committees || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                          Belum ada struktur panitia/pelayan yang dicatat.
                        </td>
                      </tr>
                    ) : (
                      (activeActivity.committees || []).map((com, idx) => (
                        <tr key={com.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '5px 6px', fontWeight: 600 }}>{com.role}</td>
                          <td style={{ padding: '5px 6px', fontWeight: 500, color: '#1e293b' }}>{com.name}</td>
                          <td style={{ padding: '5px 6px', color: '#475569' }}>{com.contact || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 7. LEMBAR PENGESAHAN & TANDA TANGAN */}
              <div
                className="signature-section print-avoid-break"
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px dashed #94a3b8',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    fontSize: 10,
                  }}
                >
                  <tbody>
                    <tr>
                      {/* Kolom Kiri: Pelaksana Teknis / Pembuat Laporan */}
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 65 }}>
                        <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                          Kordinator Pelayanan Misi,
                        </div>
                      </td>

                      {/* Kolom Kanan: Pengesah / Pimpinan Yayasan */}
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 65 }}>
                        <div style={{ color: '#475569', marginBottom: 4 }}>
                          Medan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                          Mengetahui,<br />
                          <strong>Ketua Yayasan GMH PA KMK</strong>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      {/* Nama Kordinator */}
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                        <strong style={{ borderBottom: '1px solid #0f172a', paddingBottom: 4, display: 'inline-block', minWidth: 200 }}>
                          {activeActivity.coordinator || 'Kordinator Misi'}
                        </strong>
                      </td>

                      {/* Nama Ketua Yayasan */}
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                        <strong style={{ borderBottom: '1px solid #0f172a', paddingBottom: 4, display: 'inline-block', minWidth: 200 }}>
                          BPH Yayasan GMH PA KMK
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FOOTER HALAMAN 2 */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 10,
                borderTop: '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 8.5,
                color: '#64748b',
              }}
            >
              <span>Yayasan Global Mission House (GMH PA KMK) • Sistem Informasi Manajemen Terpadu</span>
              <span>Dokumen Resmi LPJ • Halaman 2 dari 2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionsPage;
