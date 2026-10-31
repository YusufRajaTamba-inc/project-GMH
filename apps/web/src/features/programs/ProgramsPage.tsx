import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  X,
  Save,
  CheckCircle,
  MapPin,
  User,
  Clock,
  ArrowLeft,
  DollarSign,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  CheckCircle2,
  FileText,
  Search,
  Eye,
  FileDown,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import NominalInput from '../../components/NominalInput';
import { exportHtmlToPdf } from '../../utils/pdfExport';

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

export interface ProgramTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
  central_tx_code?: string;
}

export interface Program {
  id: string;
  program_title: string;
  program_category: string;
  event_datetime: string;
  location: string;
  theme?: string;
  speaker_name?: string;
  budget_estimate?: number;
  cash_balance?: number;
  status?: string;
  description?: string;
  media_drive_url?: string;
  document_drive_url?: string;
  transactions?: ProgramTransaction[];
  rundown?: RundownItem[];
  tasks?: TaskItem[];
  committees?: CommitteeItem[];
  created_at?: string;
}

const CATEGORY_BADGE: Record<string, string> = {
  FELLOWSHIP: 'badge-primary',
  SEMINAR: 'badge-gold',
  RETREAT: 'badge-info',
  ADMIN: 'badge-neutral',
  'Persekutuan Alumni': 'badge-primary',
  'Seminar & Workshop': 'badge-gold',
  'Retret & Doa Semalam': 'badge-info',
  'Rapat Kerja Yayasan': 'badge-neutral',
};

const CATEGORY_LABEL: Record<string, string> = {
  FELLOWSHIP: 'Persekutuan Alumni',
  SEMINAR: 'Seminar & Workshop',
  RETREAT: 'Retret & Doa Semalam',
  ADMIN: 'Rapat Kerja Yayasan',
};

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
};

const ProgramsPage: React.FC = () => {
  const { lookups, fieldLabels } = useDynamicConfig();
  const { getOperationalBalance, addTransaction, refreshFromApi } = useFinanceStore();
  const yayasanMainCash = getOperationalBalance();

  // Navigation mode: list or dashboard
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);

  // Program list state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Members for committee autocomplete
  const [members, setMembers] = useState<any[]>([]);

  // Modal Add Program State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(lookups.programCategories?.[0] || 'Persekutuan Alumni');
  const [eventDatetime, setEventDatetime] = useState('');
  const [location, setLocation] = useState('Rumah Persekutuan GMH');
  const [theme, setTheme] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Edit Program State
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Detail sub-form states
  const [activeTabAgenda, setActiveTabAgenda] = useState<'rundown' | 'tasks'>('rundown');

  // Form Rundown
  const [formRundown, setFormRundown] = useState<{ time: string; pic: string; note: string }>({
    time: '',
    pic: '',
    note: '',
  });

  // Form Task
  const [formTask, setFormTask] = useState<{ task: string; pic: string; estimated_cost: string | number }>({
    task: '',
    pic: '',
    estimated_cost: '',
  });

  // Form Committee
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

  // Form Cash Entry (Independent Cash)
  const [formEntryCash, setFormEntryCash] = useState<{
    type: 'IN' | 'OUT';
    category: string;
    description: string;
    amount: number | string;
    date: string;
  }>({
    type: 'OUT',
    category: 'Konsumsi & Logistik',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Form Transfer Subsidi
  const [formTransferSubsidi, setFormTransferSubsidi] = useState<{
    type: 'AMBIL_SUBSIDI' | 'SETOR_SISA';
    amount: number | string;
    notes: string;
  }>({
    type: 'AMBIL_SUBSIDI',
    amount: '',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch all programs from API
  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const res = await api.programs.getAll();
      if (res) {
        const rawList = res.programs || res.data || [];
        setPrograms(rawList);
        if (activeProgram) {
          const updatedActive = rawList.find((p: Program) => p.id === activeProgram.id);
          if (updatedActive) setActiveProgram(updatedActive);
        }
      }
    } catch (err: any) {
      showToast('Gagal memuat agenda program: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch members for committee autocomplete
  const fetchMembers = async () => {
    try {
      const res = await api.members.getAll({ limit: 300 });
      if (res && res.members) {
        setMembers(res.members);
      }
    } catch (err) {
      console.warn('Gagal memuat daftar anggota:', err);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchMembers();
  }, []);

  // Filtered members for autocomplete
  const filteredCommitteeMembers = useMemo(() => {
    const q = committeeSearchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members
      .filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.nia && m.nia.toLowerCase().includes(q)) ||
          (m.faculty && m.faculty.toLowerCase().includes(q)) ||
          (m.profession && m.profession.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [members, committeeSearchQuery]);

  // Create new program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDatetime) {
      alert('Nama program dan waktu pelaksanaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.programs.create({
        programTitle: title.trim(),
        programCategory: category,
        eventDatetime,
        location: location.trim(),
        theme: theme.trim(),
        speakerName: speakerName.trim(),
        budgetEstimate: budgetEstimate ? Number(budgetEstimate) : 0,
        description: description.trim(),
      });

      showToast(`Program "${title.trim()}" berhasil dibuat!`);
      setShowAddModal(false);
      setTitle('');
      setTheme('');
      setSpeakerName('');
      setEventDatetime('');
      setBudgetEstimate('');
      setDescription('');
      await fetchPrograms();

      if (res?.program) {
        setActiveProgram(res.program);
        setViewMode('dashboard');
      }
    } catch (err: any) {
      alert('Gagal membuat program: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update existing program details
  const handleSaveProgramDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    try {
      const res = await api.programs.update(editingProgram.id, {
        programTitle: editingProgram.program_title,
        programCategory: editingProgram.program_category,
        eventDatetime: editingProgram.event_datetime,
        location: editingProgram.location,
        theme: editingProgram.theme,
        speakerName: editingProgram.speaker_name,
        budgetEstimate: editingProgram.budget_estimate,
        description: editingProgram.description,
        mediaDriveUrl: editingProgram.media_drive_url,
        documentDriveUrl: editingProgram.document_drive_url,
      });

      if (res?.program) {
        setActiveProgram(res.program);
        setPrograms((prev) => prev.map((p) => (p.id === res.program.id ? res.program : p)));
      }
      showToast('Rincian program berhasil disimpan.');
      setEditingProgram(null);
    } catch (err: any) {
      alert('Gagal memperbarui rincian program: ' + err.message);
    }
  };

  // Toggle status COMPLETED / ON_PROGRESS
  const handleToggleStatus = async () => {
    if (!activeProgram) return;
    const nextStatus = activeProgram.status === 'COMPLETED' ? 'ON_PROGRESS' : 'COMPLETED';
    const confirmMsg =
      nextStatus === 'COMPLETED'
        ? `Tandai program "${activeProgram.program_title}" sebagai SELESAI / Terlaksana?`
        : `Buka kembali program "${activeProgram.program_title}" ke status SEDANG BERJALAN?`;

    if (confirm(confirmMsg)) {
      try {
        const res = await api.programs.updateStatus(activeProgram.id, nextStatus);
        if (res?.program) {
          setActiveProgram(res.program);
          setPrograms((prev) => prev.map((p) => (p.id === res.program.id ? res.program : p)));
        } else {
          setActiveProgram({ ...activeProgram, status: nextStatus });
          setPrograms((prev) =>
            prev.map((p) => (p.id === activeProgram.id ? { ...p, status: nextStatus } : p))
          );
        }
        showToast(
          nextStatus === 'COMPLETED'
            ? 'Program ditandai Selesai & Terlaksana.'
            : 'Program dibuka kembali ke status Sedang Berjalan.'
        );
      } catch (err: any) {
        alert('Gagal memperbarui status: ' + err.message);
      }
    }
  };

  // Delete program
  const handleDeleteProgram = async () => {
    if (!activeProgram) return;
    if (activeProgram.status === 'COMPLETED') {
      alert('Program yang telah selesai tidak dapat dihapus demi integritas arsip yayasan.');
      return;
    }
    if (confirm(`Yakin ingin menghapus seluruh dokumen dan jadwal program "${activeProgram.program_title}"?`)) {
      try {
        await api.programs.delete(activeProgram.id);
        showToast(`Program "${activeProgram.program_title}" berhasil dihapus.`);
        setActiveProgram(null);
        setViewMode('list');
        await fetchPrograms();
      } catch (err: any) {
        alert('Gagal menghapus program: ' + err.message);
      }
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Directly export and save PDF without opening printer window
  const handleDownloadPDF = async () => {
    if (!activeProgram) return;
    try {
      setIsExportingPDF(true);
      showToast('Sedang memproses dan menyusun file PDF program...');
      const cleanTitle = (activeProgram.program_title || 'Program')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_');
      const filename = `LPJ_Program_${cleanTitle}_2026.pdf`;
      await exportHtmlToPdf('program-official-print-report', {
        filename,
      });
      showToast('File PDF program berhasil disimpan ke perangkat Anda.');
    } catch (err: any) {
      console.error('Gagal simpan PDF:', err);
      alert('Gagal membuat file PDF: ' + (err.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Add Cash Entry (Independent Ledger)
  const handleAddCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
    if (!formEntryCash.amount || Number(formEntryCash.amount) <= 0) {
      alert('Nominal transaksi kas valid wajib diisi.');
      return;
    }

    try {
      const res = await api.programs.addTransaction(activeProgram.id, {
        type: formEntryCash.type,
        category: formEntryCash.category,
        description: formEntryCash.description.trim() || 'Operasional Program',
        amount: Number(formEntryCash.amount),
        date: formEntryCash.date,
      });

      if (res?.program) {
        setActiveProgram(res.program);
        setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? res.program : p)));
      } else {
        const newTrx: ProgramTransaction = {
          id: `trx-${Date.now()}`,
          date: formEntryCash.date,
          type: formEntryCash.type,
          category: formEntryCash.category,
          description: formEntryCash.description,
          amount: Number(formEntryCash.amount),
        };
        const updated = [newTrx, ...(activeProgram.transactions || [])];
        const newBal = updated.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedProg = { ...activeProgram, transactions: updated, cash_balance: newBal };
        setActiveProgram(updatedProg);
        setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
      }

      showToast(
        formEntryCash.type === 'IN'
          ? `Pemasukan Rp ${Number(formEntryCash.amount).toLocaleString('id-ID')} dicatat ke kas program.`
          : `Pengeluaran Rp ${Number(formEntryCash.amount).toLocaleString('id-ID')} dicatat ke kas program.`
      );

      setFormEntryCash({
        type: 'OUT',
        category: 'Konsumsi & Logistik',
        description: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: any) {
      alert('Gagal mencatat transaksi: ' + err.message);
    }
  };

  // Transfer Subsidi (two-way sync with central foundation ledger)
  const handleTransferSubsidi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
    if (!formTransferSubsidi.amount || Number(formTransferSubsidi.amount) <= 0) {
      alert('Nominal transfer subsidi valid wajib diisi.');
      return;
    }

    const isAmbil = formTransferSubsidi.type === 'AMBIL_SUBSIDI';

    try {
      const trxType: 'IN' | 'OUT' = isAmbil ? 'IN' : 'OUT';
      const payload = {
        type: trxType,
        category: isAmbil ? 'Subsidi Kas Yayasan' : 'Setor Sisa Kas ke Yayasan',
        description: formTransferSubsidi.notes.trim()
          ? `[${isAmbil ? 'Subsidi Yayasan' : 'Setor Sisa Kas'}] ${formTransferSubsidi.notes.trim()}`
          : `Transfer subsidi kas ${isAmbil ? 'dari' : 'ke'} yayasan`,
        amount: Number(formTransferSubsidi.amount),
        date: new Date().toISOString().slice(0, 10),
        transferType: formTransferSubsidi.type,
        isSubsidiTransfer: true,
      };

      const res = await api.programs.addTransaction(activeProgram.id, payload);

      if (res?.program) {
        setActiveProgram(res.program);
        setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? res.program : p)));
      } else {
        const newTrx: ProgramTransaction = {
          id: `trx-${Date.now()}`,
          date: payload.date,
          type: trxType,
          category: payload.category,
          description: payload.description,
          amount: payload.amount,
          central_tx_code: res?.centralTxCode,
        };
        const updated = [newTrx, ...(activeProgram.transactions || [])];
        const newBal = updated.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedProg = { ...activeProgram, transactions: updated, cash_balance: newBal };
        setActiveProgram(updatedProg);
        setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
      }

      // Sync central foundation finance store locally
      addTransaction({
        date: new Date().toISOString().slice(0, 10),
        desc: isAmbil
          ? `[Subsidi Kas Program] ${activeProgram.program_title}${formTransferSubsidi.notes ? ` - ${formTransferSubsidi.notes}` : ''}`
          : `[Setor Sisa Kas Program] ${activeProgram.program_title}${formTransferSubsidi.notes ? ` - ${formTransferSubsidi.notes}` : ''}`,
        category: isAmbil ? 'Operasional Program Yayasan' : 'Pengembalian Sisa Operasional',
        party: activeProgram.speaker_name || 'Panitia Program',
        amount: Number(formTransferSubsidi.amount),
        type: isAmbil ? 'DEBIT' : 'CREDIT',
        account: 'KAS_OPERASIONAL',
        source: 'OPERASIONAL',
        status: 'Approved',
        notes: formTransferSubsidi.notes,
      });

      await refreshFromApi().catch(() => {});

      showToast(
        isAmbil
          ? `Subsidi Rp ${Number(formTransferSubsidi.amount).toLocaleString('id-ID')} berhasil dialokasikan ke kas program!`
          : `Sisa kas Rp ${Number(formTransferSubsidi.amount).toLocaleString('id-ID')} berhasil disetorkan ke kas yayasan!`
      );
      setFormTransferSubsidi({ type: 'AMBIL_SUBSIDI', amount: '', notes: '' });
    } catch (err: any) {
      alert('Gagal mengeksekusi transfer kas: ' + err.message);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (trxId: string) => {
    if (!activeProgram) return;
    if (confirm('Hapus transaksi kas program ini?')) {
      try {
        await api.programs.deleteTransaction(activeProgram.id, trxId);
        const updated = (activeProgram.transactions || []).filter((t) => t.id !== trxId);
        const newBal = updated.reduce((acc, t) => (t.type === 'IN' ? acc + t.amount : acc - t.amount), 0);
        const updatedProg = { ...activeProgram, transactions: updated, cash_balance: newBal };
        setActiveProgram(updatedProg);
        setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
        await refreshFromApi().catch(() => {});
        showToast('Transaksi kas berhasil dihapus.');
      } catch (err: any) {
        alert('Gagal menghapus transaksi: ' + err.message);
      }
    }
  };

  // Add Rundown Item
  const handleAddRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
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

    const updatedRundown = [...(activeProgram.rundown || []), newItem];
    const updatedProg = { ...activeProgram, rundown: updatedRundown };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));

    try {
      await api.programs.updateRundown(activeProgram.id, updatedRundown);
      showToast('Agenda rundown berhasil ditambahkan.');
      setFormRundown({ time: '', pic: '', note: '' });
    } catch (err: any) {
      console.warn('Gagal simpan rundown:', err);
    }
  };

  // Delete Rundown Item
  const handleDeleteRundown = async (rdId: string) => {
    if (!activeProgram) return;
    const updatedRundown = (activeProgram.rundown || []).filter((r) => r.id !== rdId);
    const updatedProg = { ...activeProgram, rundown: updatedRundown };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
    try {
      await api.programs.updateRundown(activeProgram.id, updatedRundown);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Add Task Item
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
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

    const updatedTasks = [...(activeProgram.tasks || []), newTask];
    const updatedProg = { ...activeProgram, tasks: updatedTasks };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));

    try {
      await api.programs.updateTasks(activeProgram.id, updatedTasks);
      showToast('Tugas persiapan berhasil ditambahkan.');
      setFormTask({ task: '', pic: '', estimated_cost: '' });
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Toggle Task Done
  const handleToggleTask = async (taskId: string) => {
    if (!activeProgram) return;
    const updatedTasks = (activeProgram.tasks || []).map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    const updatedProg = { ...activeProgram, tasks: updatedTasks };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
    try {
      await api.programs.updateTasks(activeProgram.id, updatedTasks);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Delete Task Item
  const handleDeleteTask = async (taskId: string) => {
    if (!activeProgram) return;
    const updatedTasks = (activeProgram.tasks || []).filter((t) => t.id !== taskId);
    const updatedProg = { ...activeProgram, tasks: updatedTasks };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
    try {
      await api.programs.updateTasks(activeProgram.id, updatedTasks);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Add Committee
  const handleAddCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProgram) return;
    if (!formCommittee.name.trim() || !formCommittee.role.trim()) {
      alert('Peran dan nama pelayan/panitia wajib diisi.');
      return;
    }

    const newCom: CommitteeItem = {
      id: `com-${Date.now()}`,
      role: formCommittee.role.trim(),
      name: formCommittee.name.trim(),
      contact: formCommittee.contact.trim() || undefined,
      member_id: formCommittee.isManual ? undefined : formCommittee.member_id || undefined,
    };

    const updatedCommittees = [...(activeProgram.committees || []), newCom];
    const updatedProg = { ...activeProgram, committees: updatedCommittees };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));

    try {
      await api.programs.updateCommittees(activeProgram.id, updatedCommittees);
      showToast(`Pelayan/Panitia "${newCom.name}" berhasil ditambahkan.`);
      setFormCommittee({ role: '', name: '', contact: '', member_id: '', isManual: false });
      setCommitteeSearchQuery('');
      setShowCommitteeDropdown(false);
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Delete Committee
  const handleDeleteCommittee = async (comId: string) => {
    if (!activeProgram) return;
    const updated = (activeProgram.committees || []).filter((c) => c.id !== comId);
    const updatedProg = { ...activeProgram, committees: updated };
    setActiveProgram(updatedProg);
    setPrograms((prev) => prev.map((p) => (p.id === activeProgram.id ? updatedProg : p)));
    try {
      await api.programs.updateCommittees(activeProgram.id, updated);
      showToast('Susunan pelayan diperbarui.');
    } catch (err: any) {
      console.warn(err);
    }
  };

  // Filter programs for list view
  const displayedPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchCat = filterCategory ? p.program_category === filterCategory : true;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q
        ? p.program_title.toLowerCase().includes(q) ||
          (p.theme && p.theme.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.speaker_name && p.speaker_name.toLowerCase().includes(q))
        : true;
      return matchCat && matchSearch;
    });
  }, [programs, filterCategory, searchQuery]);

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedPrograms,
  } = usePagination(displayedPrograms, { initialPageSize: 10 });

  return (
    <div className="programs-page-wrapper">
      <div className="no-print">
      {/* ========================================================================= */}
      {/* 1. LIST VIEW MODE                                                         */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div>
          <div className="page-header">
            <div className="page-header-text">
              <h2>Program &amp; Persekutuan</h2>
              <p>Jadwal kegiatan persekutuan alumni PA KMK, seminar pembekalan, dan program kerja yayasan</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={fetchPrograms}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan
              </button>
              <button
                className="btn btn-primary btn-sm"
                id="btn-add-program"
                onClick={() => setShowAddModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Tambah Program
              </button>
            </div>
          </div>

          {toastMsg && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <CheckCircle size={16} />
              <span>{toastMsg}</span>
            </div>
          )}

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} color="var(--gmh-gold)" /> Agenda Program Yayasan (Database API)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 220 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari program, tema, lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: 12, padding: '6px 10px 6px 30px' }}
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto', fontSize: 12, padding: '6px 12px' }}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  id="filter-program-type"
                >
                  <option value="">Semua Kategori Program</option>
                  {(lookups?.programCategories || [
                    'Persekutuan Alumni',
                    'Seminar & Workshop',
                    'Retret & Doa Semalam',
                    'Rapat Kerja Yayasan',
                  ]).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Program &amp; Tema</th>
                    <th>Tanggal &amp; Waktu</th>
                    <th>Tempat Pelaksanaan</th>
                    <th>Pembicara / Pelayan</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: 110 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                        Memuat program dari API...
                      </td>
                    </tr>
                  ) : displayedPrograms.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                        Belum ada program yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedPrograms.map((p) => {
                      const evtDate = new Date(p.event_datetime);
                      const isUpcoming = evtDate.getTime() > Date.now();
                      const isCompleted = p.status === 'COMPLETED' || (!isUpcoming && !p.status);

                      return (
                        <tr
                          key={p.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setActiveProgram(p);
                            setViewMode('dashboard');
                          }}
                        >
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-text)' }}>
                              {p.program_title}
                            </div>
                            {p.theme && (
                              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontStyle: 'italic' }}>
                                Tema: "{p.theme}"
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              <Clock size={13} color="var(--gmh-text-muted)" />
                              {evtDate.toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', paddingLeft: 19 }}>
                              {evtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </div>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MapPin size={13} color="var(--gmh-gold)" />
                              {p.location || 'Rumah Persekutuan GMH'}
                            </div>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {p.speaker_name ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <User size={13} color="var(--gmh-text-muted)" />
                                {p.speaker_name}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>-</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${CATEGORY_BADGE[p.program_category] || 'badge-primary'}`}>
                              {CATEGORY_LABEL[p.program_category] || p.program_category}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${isCompleted ? 'badge-neutral' : 'badge-info'}`}>
                              {isCompleted ? 'Terlaksana' : 'Akan Datang'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{
                                fontSize: 11.5,
                                padding: '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: 'var(--gmh-primary)',
                              }}
                              onClick={() => {
                                setActiveProgram(p);
                                setViewMode('dashboard');
                              }}
                            >
                              <Eye size={13} /> Lihat Detail
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
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayedPrograms.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="program"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DASHBOARD DETAIL PROGRAM MODE                                          */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' && activeProgram && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* TOP NAV & ACTIONS */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingBottom: 4,
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setViewMode('list');
                setActiveProgram(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <ArrowLeft size={15} /> Kembali ke Daftar Program
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditingProgram({ ...activeProgram })}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Edit size={14} /> Edit Rincian
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
                  color: activeProgram.status === 'COMPLETED' ? '#b45309' : '#047857',
                  borderColor: activeProgram.status === 'COMPLETED' ? '#fde68a' : '#a7f3d0',
                }}
              >
                <CheckCircle2 size={14} />
                {activeProgram.status === 'COMPLETED' ? 'Buka Kembali Program' : 'Tandai Terlaksana'}
              </button>

              {activeProgram.status === 'COMPLETED' ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled
                  style={{
                    opacity: 0.45,
                    cursor: 'not-allowed',
                    color: '#94a3b8',
                    borderColor: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Program yang telah selesai tidak dapat dihapus demi integritas arsip yayasan"
                >
                  <Lock size={14} /> Terkunci (Selesai)
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleDeleteProgram}
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
                ID: {activeProgram.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          {toastMsg && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* MAIN HERO CARD */}
          <div className="card">
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
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
                      DASHBOARD PROGRAM TERPADU
                    </span>

                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: activeProgram.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                        color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                        letterSpacing: '0.5px',
                      }}
                    >
                      STATUS: {activeProgram.status === 'COMPLETED' ? 'TERLAKSANA' : 'SEDANG BERJALAN'}
                    </span>

                    <span className={`badge ${CATEGORY_BADGE[activeProgram.program_category] || 'badge-primary'}`}>
                      {CATEGORY_LABEL[activeProgram.program_category] || activeProgram.program_category}
                    </span>
                  </div>

                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--gmh-text)' }}>
                    {activeProgram.program_title}
                  </h1>
                  {activeProgram.theme && (
                    <div style={{ fontSize: 14, color: 'var(--gmh-green-mid)', fontWeight: 500 }}>
                      Tema: "{activeProgram.theme}"
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
                      {formatRupiah(Number(activeProgram.budget_estimate))}
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
                      KAS KANTONG PROGRAM
                    </span>
                    <strong style={{ fontSize: 18, color: 'var(--gmh-green)' }}>
                      {formatRupiah(Number(activeProgram.cash_balance))}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 META CARDS */}
          {(() => {
            const evtDate = new Date(activeProgram.event_datetime);
            return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12,
                }}
              >
                {/* Meta 1: Tanggal & Waktu */}
                <div
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                    }}
                  >
                    <Clock size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>WAKTU PELAKSANAAN</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                      {evtDate.toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {evtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                  </div>
                </div>

                {/* Meta 2: Lokasi / Venue */}
                <div
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#b45309',
                    }}
                  >
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>TEMPAT / VENUE</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                      {activeProgram.location || 'Rumah Persekutuan GMH'}
                    </div>
                  </div>
                </div>

                {/* Meta 3: Pembicara / Pelayan Utama */}
                <div
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#ecfdf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#059669',
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>PEMBICARA / PELAYAN</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gmh-text)', marginTop: 1 }}>
                      {activeProgram.speaker_name || '-'}
                    </div>
                  </div>
                </div>

                {/* Meta 4: Status Kas */}
                <div
                  className="card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
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
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                        marginTop: 1,
                      }}
                    >
                      {activeProgram.status === 'COMPLETED' ? 'Selesai & Tutup Kas' : 'Sedang Berjalan'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* VERTICAL FULL-WIDTH SECTIONS (DESKRIPSI & AGENDA DI ATAS KEUANGAN)         */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. URAIAN DESKRIPSI & DOKUMEN DRIVE (BARIS SENDIRI) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Uraian Deskripsi &amp; Agenda Kegiatan
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 8px', fontSize: 11 }}
                  onClick={() => setEditingProgram({ ...activeProgram })}
                >
                  <Edit size={12} /> Edit Deskripsi
                </button>
              </div>

              <div className="card-body" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 12px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {activeProgram.description || 'Tidak ada catatan deskripsi tambahan untuk rincian program ini.'}
                </p>

                {/* Drive Links */}
                {(activeProgram.media_drive_url || activeProgram.document_drive_url) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--gmh-border)' }}>
                    {activeProgram.media_drive_url && (
                      <a
                        href={activeProgram.media_drive_url}
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
                    {activeProgram.document_drive_url && (
                      <a
                        href={activeProgram.document_drive_url}
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
                        <ExternalLink size={13} /> Dokumen Materi / Warta / Surat Tugas (Google Drive)
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. AGENDA & JADWAL KERJA (BARIS SENDIRI DI ATAS UANG MASUK & KELUAR) */}
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
                      Rundown waktu acara Hari-H untuk koordinasi tertib dan teratur.
                    </div>

                    {/* Rundown List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                      {(activeProgram.rundown || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                          <CheckCircle2 size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                          Agenda rundown acara belum terdaftar.
                        </div>
                      ) : (
                        (activeProgram.rundown || []).map((rd) => (
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
                      <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8 }}>Tambah Agenda Rundown</div>
                      <form onSubmit={handleAddRundown} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 8 }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, padding: '7px 10px' }}
                            placeholder="Waktu (e.g. 19:00 - 19:30)"
                            value={formRundown.time}
                            onChange={(e) => setFormRundown({ ...formRundown, time: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ fontSize: 12, padding: '7px 10px' }}
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
                  const totalTaskCost = (activeProgram.tasks || []).reduce(
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
                        <div>Daftar checklist persiapan sound, materi, konsumsi, dan perlengkapan.</div>
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
                        {(activeProgram.tasks || []).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                            Belum ada tugas persiapan.
                          </div>
                        ) : (
                          (activeProgram.tasks || []).map((t) => (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
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
                          placeholder="Tugas baru (e.g. Siapkan Slide & Sound)..."
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

            {/* 3. KANTONG DANA PROGRAM & JURNAL KEUANGAN (UANG MASUK & KELUAR) */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
                  <DollarSign size={18} color="var(--gmh-gold)" /> Kantong Dana Program &amp; Jurnal Keuangan
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
                      Uang Masuk &amp; Keluar Program ini Terpisah
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                      Semoga program {activeProgram.program_title} berjalan sukses dan memberkati banyak orang.
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

                {/* 2 Sub-Forms: Entri Kas & Subsidi Yayasan */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  {/* Sub-form 1: Catat Kas Masuk / Keluar */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
                      Catat Kas Masuk / Keluar Program
                    </div>
                    <form onSubmit={handleAddCashEntry} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <select
                          className="form-select"
                          value={formEntryCash.type}
                          onChange={(e) => setFormEntryCash({ ...formEntryCash, type: e.target.value as any })}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        >
                          <option value="OUT">Pengeluaran (Keluar)</option>
                          <option value="IN">Pemasukan (Masuk)</option>
                        </select>
                        <select
                          className="form-select"
                          value={formEntryCash.category}
                          onChange={(e) => setFormEntryCash({ ...formEntryCash, category: e.target.value })}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        >
                          <option value="Konsumsi & Logistik">Konsumsi &amp; Logistik</option>
                          <option value="Honor / Transport Pembicara">Honor / Transport</option>
                          <option value="Sewa Tempat / Alat">Sewa Tempat / Alat</option>
                          <option value="Perlengkapan & Acara">Perlengkapan &amp; Acara</option>
                          <option value="Persembahan / Donasi Peserta">Persembahan / Donasi</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
                        <NominalInput
                          value={formEntryCash.amount}
                          onChange={(val) => setFormEntryCash({ ...formEntryCash, amount: val })}
                          placeholder="Jumlah Nominal (Rp)..."
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        />
                        <input
                          type="date"
                          className="form-input"
                          value={formEntryCash.date}
                          onChange={(e) => setFormEntryCash({ ...formEntryCash, date: e.target.value })}
                          style={{ fontSize: 12, padding: '6px 8px' }}
                        />
                      </div>

                      <input
                        type="text"
                        className="form-input"
                        placeholder="Keterangan transaksi kas program..."
                        value={formEntryCash.description}
                        onChange={(e) => setFormEntryCash({ ...formEntryCash, description: e.target.value })}
                        style={{ fontSize: 12, padding: '6px 8px' }}
                        required
                      />

                      <button
                        type="submit"
                        className="btn btn-sm"
                        style={{
                          background: formEntryCash.type === 'IN' ? 'var(--gmh-green)' : '#dc2626',
                          color: '#ffffff',
                          fontWeight: 600,
                          padding: '6px 12px',
                        }}
                      >
                        {formEntryCash.type === 'IN' ? '+ Simpan Pemasukan' : '- Simpan Pengeluaran'}
                      </button>
                    </form>
                  </div>

                  {/* Sub-form 2: Tarik Subsidi / Setor Sisa ke Yayasan */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
                      Transfer Subsidi dari / ke Kas Yayasan
                    </div>
                    <form onSubmit={handleTransferSubsidi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <select
                        className="form-select"
                        value={formTransferSubsidi.type}
                        onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, type: e.target.value as any })}
                        style={{ fontSize: 12, padding: '6px 8px' }}
                      >
                        <option value="AMBIL_SUBSIDI">Ambil Subsidi dari Kas Yayasan (+ Masuk ke Program)</option>
                        <option value="SETOR_SISA">Setor Sisa Kas ke Kas Yayasan (- Keluar dari Program)</option>
                      </select>

                      <NominalInput
                        value={formTransferSubsidi.amount}
                        onChange={(val) => setFormTransferSubsidi({ ...formTransferSubsidi, amount: val })}
                        placeholder="Jumlah Nominal Subsidi (Rp)..."
                        style={{ fontSize: 12, padding: '6px 8px' }}
                      />

                      <input
                        type="text"
                        className="form-input"
                        placeholder="Catatan transfer subsidi (e.g. Subsidi Konsumsi)..."
                        value={formTransferSubsidi.notes}
                        onChange={(e) => setFormTransferSubsidi({ ...formTransferSubsidi, notes: e.target.value })}
                        style={{ fontSize: 12, padding: '6px 8px' }}
                      />

                      <button
                        type="submit"
                        className="btn btn-sm"
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          fontWeight: 600,
                          padding: '6px 12px',
                        }}
                      >
                        Eksekusi Transfer Subsidi
                      </button>
                    </form>
                  </div>
                </div>

                {/* 3 Metric Cards: Pemasukan, Pengeluaran, Sisa Kas Program */}
                {(() => {
                  const trxs = activeProgram.transactions || [];
                  const totalIn = trxs.filter((t) => t.type === 'IN').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
                  const totalOut = trxs.filter((t) => t.type === 'OUT').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
                  const balance = totalIn - totalOut;
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 8,
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>TOTAL PEMASUKAN</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
                          {formatRupiah(totalIn)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: 8,
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>TOTAL PENGELUARAN</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#b91c1c', marginTop: 2 }}>
                          {formatRupiah(totalOut)}
                        </div>
                      </div>
                      <div
                        style={{
                          background: balance >= 0 ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${balance >= 0 ? '#86efac' : '#fca5a5'}`,
                          borderRadius: 8,
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: 11, color: balance >= 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                          SISA KAS PROGRAM
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: balance >= 0 ? '#15803d' : '#b91c1c',
                            marginTop: 2,
                          }}
                        >
                          {formatRupiah(balance)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Table Log Transaksi Kas Mandiri */}
                <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--gmh-text)' }}>
                  Jurnal Transaksi Kas Program
                </div>
                <div className="table-wrapper" style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table className="table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>Tanggal</th>
                        <th>Keterangan</th>
                        <th style={{ width: 140 }}>Kategori</th>
                        <th style={{ width: 120, textAlign: 'right' }}>Nominal</th>
                        <th style={{ width: 40, textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeProgram.transactions || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
                            Belum ada catatan mutasi kas pada program ini.
                          </td>
                        </tr>
                      ) : (
                        (activeProgram.transactions || []).map((trx) => (
                          <tr key={trx.id}>
                            <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{trx.date}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--gmh-text)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {trx.description}
                              </div>
                              {trx.central_tx_code && (
                                <div style={{ fontSize: 10, color: 'var(--gmh-info)', fontFamily: 'monospace' }}>
                                  Ref: {trx.central_tx_code}
                                </div>
                              )}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: trx.type === 'IN' ? '#dcfce7' : '#fee2e2',
                                  color: trx.type === 'IN' ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {trx.category}
                              </span>
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
            </div>

            {/* 4. SUSUNAN PENGURUS & PELAYAN ACARA (BARIS SENDIRI) */}
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
                  {(activeProgram.committees || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>
                      <User size={24} style={{ opacity: 0.3, margin: '0 auto 4px' }} />
                      Belum ada susunan pelayan atau panitia acara yang ditambahkan.
                    </div>
                  ) : (
                    (activeProgram.committees || []).map((com) => (
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

                {/* Form Tambah Pelayan */}
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
                      placeholder="Peran (e.g. Pembicara / MC / Musik)"
                      value={formCommittee.role}
                      onChange={(e) => setFormCommittee({ ...formCommittee, role: e.target.value })}
                      required
                    />

                    {/* Name input */}
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
      {/* 3. MODAL: JADWALKAN PROGRAM BARU                                          */}
      {/* ========================================================================= */}
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
          <div className="card" style={{ width: '100%', maxWidth: 540 }}>
            <div className="card-header">
              <div className="card-title">Jadwalkan Program / Acara Baru</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateProgram}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">
                    Nama Program / Acara <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Persekutuan Alumni Bulanan PA KMK"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">{fieldLabels['program.category'] || 'Kategori'}</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {(lookups?.programCategories || [
                        'Persekutuan Alumni',
                        'Seminar & Workshop',
                        'Retret & Doa Semalam',
                        'Rapat Kerja Yayasan',
                      ]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Waktu Pelaksanaan <span style={{ color: 'var(--gmh-danger)' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={eventDatetime}
                      onChange={(e) => setEventDatetime(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Lokasi / Venue</label>
                    <input
                      type="text"
                      placeholder="Rumah Persekutuan GMH / Zoom"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={budgetEstimate}
                      onChange={setBudgetEstimate}
                      placeholder="Estimasi total dana..."
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tema Program (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Menjadi Garam dan Terang di Dunia Kerja"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Pembicara / Pelayan Utama (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dr. Ir. T. Pardede, M.Sc"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Uraian Deskripsi / Tujuan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Catatan rincian acara atau tujuan program..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    style={{ minHeight: 65 }}
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
                  <Save size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan & Jadwalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: EDIT RINCIAN PROGRAM                                            */}
      {/* ========================================================================= */}
      {editingProgram && (
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
          <div className="card" style={{ width: '100%', maxWidth: 560 }}>
            <div className="card-header">
              <div className="card-title">Edit Rincian Program Kegiatan</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditingProgram(null)}
                style={{ padding: '2px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveProgramDetails}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="form-label">Nama Program</label>
                  <input
                    type="text"
                    value={editingProgram.program_title}
                    onChange={(e) => setEditingProgram({ ...editingProgram, program_title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Kategori</label>
                    <select
                      className="form-select"
                      value={editingProgram.program_category}
                      onChange={(e) => setEditingProgram({ ...editingProgram, program_category: e.target.value })}
                    >
                      {(lookups?.programCategories || [
                        'Persekutuan Alumni',
                        'Seminar & Workshop',
                        'Retret & Doa Semalam',
                        'Rapat Kerja Yayasan',
                      ]).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Waktu Pelaksanaan</label>
                    <input
                      type="datetime-local"
                      value={editingProgram.event_datetime ? editingProgram.event_datetime.slice(0, 16) : ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, event_datetime: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Lokasi / Venue</label>
                    <input
                      type="text"
                      value={editingProgram.location || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, location: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Taksasi Dana (Rp)</label>
                    <NominalInput
                      value={editingProgram.budget_estimate || ''}
                      onChange={(val) => setEditingProgram({ ...editingProgram, budget_estimate: Number(val) })}
                      placeholder="Rp..."
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tema Program</label>
                  <input
                    type="text"
                    value={editingProgram.theme || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, theme: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Pembicara / Pelayan Utama</label>
                  <input
                    type="text"
                    value={editingProgram.speaker_name || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, speaker_name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Uraian Deskripsi &amp; Agenda</label>
                  <textarea
                    rows={3}
                    value={editingProgram.description || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                    className="form-textarea"
                    style={{ minHeight: 65 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Link Media Google Drive</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={editingProgram.media_drive_url || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, media_drive_url: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Link Dokumen Google Drive</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={editingProgram.document_drive_url || ''}
                      onChange={(e) => setEditingProgram({ ...editingProgram, document_drive_url: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setEditingProgram(null)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div> {/* END .no-print */}

      {/* ========================================================================= */}
      {/* VIEW 3: DOKUMEN LAPORAN RESMI PERTANGGUNGJAWABAN PROGRAM (PRINT / PDF)     */}
      {/* ========================================================================= */}
      {activeProgram && (() => {
        const progTotalMasuk = (activeProgram.transactions || [])
          .filter((t) => t.type === 'IN')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const progTotalKeluar = (activeProgram.transactions || [])
          .filter((t) => t.type === 'OUT')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        return (
          <div
            id="program-official-print-report"
            className="print-only"
            style={{
              padding: '4mm 0',
              color: '#0f172a',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.45,
            }}
          >
            {/* 1. KOP SURAT FORMAL YAYASAN */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottom: '3px double #0f172a',
                marginBottom: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src="/logo-yayasan.png"
                  alt="Logo Yayasan GMH"
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: 'contain',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 15.5,
                      fontWeight: 900,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: '#1b4332',
                    }}
                  >
                    YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', letterSpacing: 0.3 }}>
                    BADAN PENGURUS PELAYANAN PROGRAM &amp; PERSEKUTUAN ALUMNI
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                    Sekretariat: Jl. PA KMK No. 12, Medan • Email: info@gmhpakmk.org • Website: www.gmhpakmk.org
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  KODE DOKUMEN LPJ
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                  LPJ/GMH-PROG/{activeProgram.id.slice(0, 12)}
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                  Tgl Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* 2. JUDUL DOKUMEN RESMI */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  margin: 0,
                  letterSpacing: 0.8,
                  color: '#0f172a',
                }}
              >
                LAPORAN PERTANGGUNGJAWABAN KEGIATAN &amp; REALISASI KAS PROGRAM
              </h1>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginTop: 3 }}>
                DOKUMEN INTEGRASI ARUS KAS &amp; AKTIVITAS PROGRAM YAYASAN
              </div>
            </div>

            {/* 3. INFORMASI POKOK PROGRAM */}
            <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: 4,
                  marginBottom: 8,
                  color: '#1e293b',
                }}
              >
                I. Informasi Pokok Program Kegiatan
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
                <tbody>
                  <tr>
                    <td style={{ width: 180, padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Nama Program</td>
                    <td style={{ width: 10, padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px', fontWeight: 700, color: '#0f172a' }}>{activeProgram.program_title}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Kategori Program</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px', fontWeight: 600 }}>{activeProgram.program_category}</td>
                  </tr>
                  {activeProgram.theme && (
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Tema Acara</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px', fontStyle: 'italic' }}>"{activeProgram.theme}"</td>
                    </tr>
                  )}
                  {activeProgram.speaker_name && (
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Pembicara / Pelayan</td>
                      <td style={{ padding: '3px 0' }}>:</td>
                      <td style={{ padding: '3px 4px', fontWeight: 600 }}>{activeProgram.speaker_name}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Lokasi / Tempat</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px' }}>{activeProgram.location || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Waktu Pelaksanaan</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px' }}>
                      {new Date(activeProgram.event_datetime).toLocaleString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Status Penyelenggaraan</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td
                      style={{
                        padding: '3px 4px',
                        fontWeight: 700,
                        color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                      }}
                    >
                      {activeProgram.status === 'COMPLETED' ? 'TERLAKSANA & TUTUP KAS' : 'SEDANG BERJALAN'}
                    </td>
                  </tr>
                  {activeProgram.description && (
                    <tr>
                      <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569', verticalAlign: 'top' }}>
                        Uraian Program
                      </td>
                      <td style={{ padding: '3px 0', verticalAlign: 'top' }}>:</td>
                      <td style={{ padding: '3px 4px', color: '#334155' }}>{activeProgram.description}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. REKAPITULASI REALISASI KEUANGAN (4 KARTU) */}
            <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: 4,
                  marginBottom: 8,
                  color: '#1e293b',
                }}
              >
                II. Ringkasan Realisasi Keuangan &amp; Kas Mandiri Program
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Taksasi Anggaran (Rencana)
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                    {formatRupiah(Number(activeProgram.budget_estimate))}
                  </div>
                </div>

                <div style={{ border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 10px', background: '#f0fdf4' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    Total Pemasukan Kas Acara
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                    + {formatRupiah(progTotalMasuk)}
                  </div>
                </div>

                <div style={{ border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', background: '#fef2f2' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Total Pengeluaran Kas Acara
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>
                    - {formatRupiah(progTotalKeluar)}
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                    Sisa Saldo Kas Program
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                    {formatRupiah(Number(activeProgram.cash_balance))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. TABEL MUTASI KAS MANDIRI */}
            <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: 4,
                  marginBottom: 8,
                  color: '#1e293b',
                }}
              >
                III. Buku Log Mutasi Kas Mandiri Program ({(activeProgram.transactions || []).length} Transaksi)
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
                  {(activeProgram.transactions || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 12, color: '#94a3b8' }}>
                        Belum ada catatan mutasi transaksi kas pada program ini.
                      </td>
                    </tr>
                  ) : (
                    (activeProgram.transactions || []).map((t, idx) => (
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
                      SISA SALDO KAS PROGRAM:
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a' }}>
                      {formatRupiah(Number(activeProgram.cash_balance))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 6. RUNDOWN ACARA */}
            <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
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
                  {(activeProgram.rundown || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada agenda rundown yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    (activeProgram.rundown || []).map((rd, idx) => (
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

            {/* 7. TUGAS PERSIAPAN KEGIATAN (Checklist) */}
            <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
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
                  {(activeProgram.tasks || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada tugas persiapan yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    (activeProgram.tasks || []).map((tsk, idx) => (
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
                {(activeProgram.tasks || []).length > 0 && (() => {
                  const totalTskCost = (activeProgram.tasks || []).reduce(
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

            {/* 8. SUSUNAN PANITIA & PELAYAN */}
            <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: 4,
                  marginBottom: 6,
                  color: '#1e293b',
                }}
              >
                VI. Susunan Panitia &amp; Tim Pelayan Program
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
                  {(activeProgram.committees || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada struktur panitia/pelayan yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    (activeProgram.committees || []).map((com, idx) => (
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

            {/* 9. LEMBAR PENGESAHAN & TANDA TANGAN */}
            <div
              className="signature-section print-avoid-break"
              style={{
                marginTop: 36,
                paddingTop: 22,
                borderTop: '1px dashed #94a3b8',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
              }}
            >
              <table
                className="print-avoid-break"
                style={{
                  width: '100%',
                  fontSize: 10.5,
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <tbody>
                  <tr>
                    {/* Kolom Kiri: Pelaksana Teknis / Pembuat Laporan */}
                    <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 85 }}>
                      <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                        Kordinator / Panitia Program,
                      </div>
                    </td>

                    {/* Kolom Kanan: Pengesah / Pimpinan Yayasan */}
                    <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 85 }}>
                      <div style={{ color: '#475569', marginBottom: 6 }}>
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
                        {activeProgram.speaker_name || 'Kordinator Program'}
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
        );
      })()}
    </div>
  );
};

export default ProgramsPage;
