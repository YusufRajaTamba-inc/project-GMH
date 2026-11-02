import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { usePagination } from '../../utils/usePagination';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import { exportHtmlToPdf } from '../../utils/pdfExport';
import type {
  Program,
  ProgramTransaction,
  RundownItem,
  TaskItem,
  CommitteeItem,
} from './types';
import { ProgramListTab } from './components/ProgramListTab';
import { ProgramDashboardTab } from './components/ProgramDashboardTab';
import { ProgramModals } from './components/ProgramModals';
import { ProgramPrintReport } from './components/ProgramPrintReport';

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
  const [category, setCategory] = useState(lookups?.programCategories?.[0] || 'Persekutuan Alumni');
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
        {viewMode === 'list' && (
          <ProgramListTab
            fetchPrograms={fetchPrograms}
            isLoading={isLoading}
            setShowAddModal={setShowAddModal}
            toastMsg={toastMsg}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            lookups={lookups}
            displayedPrograms={displayedPrograms}
            paginatedPrograms={paginatedPrograms}
            setActiveProgram={setActiveProgram}
            setViewMode={setViewMode}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
          />
        )}

        {viewMode === 'dashboard' && activeProgram && (
          <ProgramDashboardTab
            activeProgram={activeProgram}
            setActiveProgram={setActiveProgram}
            setViewMode={setViewMode}
            setEditingProgram={setEditingProgram}
            handleDownloadPDF={handleDownloadPDF}
            isExportingPDF={isExportingPDF}
            handleToggleStatus={handleToggleStatus}
            handleDeleteProgram={handleDeleteProgram}
            toastMsg={toastMsg}
            yayasanMainCash={yayasanMainCash}
            activeTabAgenda={activeTabAgenda}
            setActiveTabAgenda={setActiveTabAgenda}
            formRundown={formRundown}
            setFormRundown={setFormRundown}
            handleAddRundown={handleAddRundown}
            handleDeleteRundown={handleDeleteRundown}
            formTask={formTask}
            setFormTask={setFormTask}
            handleAddTask={handleAddTask}
            handleToggleTask={handleToggleTask}
            handleDeleteTask={handleDeleteTask}
            formEntryCash={formEntryCash}
            setFormEntryCash={setFormEntryCash}
            handleAddCashEntry={handleAddCashEntry}
            formTransferSubsidi={formTransferSubsidi}
            setFormTransferSubsidi={setFormTransferSubsidi}
            handleTransferSubsidi={handleTransferSubsidi}
            handleDeleteTransaction={handleDeleteTransaction}
            formCommittee={formCommittee}
            setFormCommittee={setFormCommittee}
            handleAddCommittee={handleAddCommittee}
            handleDeleteCommittee={handleDeleteCommittee}
            committeeSearchQuery={committeeSearchQuery}
            setCommitteeSearchQuery={setCommitteeSearchQuery}
            showCommitteeDropdown={showCommitteeDropdown}
            setShowCommitteeDropdown={setShowCommitteeDropdown}
            filteredCommitteeMembers={filteredCommitteeMembers}
          />
        )}

        <ProgramModals
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          lookups={lookups}
          fieldLabels={fieldLabels}
          eventDatetime={eventDatetime}
          setEventDatetime={setEventDatetime}
          location={location}
          setLocation={setLocation}
          theme={theme}
          setTheme={setTheme}
          speakerName={speakerName}
          setSpeakerName={setSpeakerName}
          budgetEstimate={budgetEstimate}
          setBudgetEstimate={setBudgetEstimate}
          description={description}
          setDescription={setDescription}
          isSubmitting={isSubmitting}
          handleCreateProgram={handleCreateProgram}
          editingProgram={editingProgram}
          setEditingProgram={setEditingProgram}
          handleSaveProgramDetails={handleSaveProgramDetails}
        />
      </div>

      {activeProgram && <ProgramPrintReport activeProgram={activeProgram} />}
    </div>
  );
};

export default ProgramsPage;
