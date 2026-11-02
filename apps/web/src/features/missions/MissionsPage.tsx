import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../services/api';
import { exportHtmlToPdf } from '../../utils/pdfExport';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import { useMemberStore } from '../../state/MemberStoreContext';
import { usePagination } from '../../utils/usePagination';
import type {
  MissionActivity,
  MissionTransaction,
  RundownItem,
  TaskItem,
  CommitteeItem,
  MissionaryPerson,
} from './types';
import { MissionListTab } from './components/MissionListTab';
import { MissionDashboardTab } from './components/MissionDashboardTab';
import { MissionActivityModal } from './components/MissionActivityModal';
import { MissionaryModal } from './components/MissionaryModal';
import { MissionPrintReport } from './components/MissionPrintReport';

export * from './types';

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

  // Independent Cash Form States
  const [formCashEntry, setFormCashEntry] = useState<{
    type: 'IN' | 'OUT';
    amount: number;
    category: string;
    description: string;
  }>({
    type: 'IN',
    amount: 0,
    category: '',
    description: '',
  });

  const [formTransferSubsidi, setFormTransferSubsidi] = useState<{
    type: 'AMBIL_SUBSIDI' | 'SETOR_SISA';
    amount: number;
    notes: string;
  }>({
    type: 'AMBIL_SUBSIDI',
    amount: 0,
    notes: '',
  });

  // Right Column Forms (Rundown, Task, Committee)
  const [activeTabAgenda, setActiveTabAgenda] = useState<'rundown' | 'tasks'>('rundown');
  const [formRundown, setFormRundown] = useState({ time: '', pic: '', note: '' });

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

  const saveMissionaries = (list: MissionaryPerson[]) => {
    setMissionaries(list);
  };

  const filteredCommitteeMembers = useMemo(() => {
    const q = committeeSearchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.nia && m.nia.toLowerCase().includes(q)) ||
          (m.faculty && m.faculty.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [members, committeeSearchQuery]);

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

  // Submit Cash Transaction Entry
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

  // Rundown Handlers
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

  // Task Handlers
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

  // Committee Handlers
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

  // Directly export and save PDF
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

        {/* VIEW 1: DAFTAR DOKUMEN KEGIATAN & PELAYANAN MISI */}
        {viewMode === 'list' && (
          <MissionListTab
            activities={activities}
            isLoading={isLoading}
            fetchActivities={fetchActivities}
            onOpenRintisModal={() => setShowRintisModal(true)}
            yayasanMainCash={yayasanMainCash}
            search={search}
            setSearch={setSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
            filteredActivitiesCount={filteredActivities.length}
            paginatedActivities={paginatedActivities}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            setCurrentPage={setCurrentPage}
            setPageSize={setPageSize}
            onOpenDashboard={handleOpenDashboard}
            onDeleteActivity={handleDeleteActivity}
            missionaries={missionaries}
            onOpenAddMissionary={() => {
              setEditingMissionary(null);
              setShowMissionaryModal(true);
            }}
            onEditMissionary={(m) => {
              setEditingMissionary(m);
              setShowMissionaryModal(true);
            }}
            onDeleteMissionary={(m) => {
              if (confirm(`Hapus personil pekabar Injil "${m.name}"?`)) {
                const updated = missionaries.filter((x) => x.id !== m.id);
                saveMissionaries(updated);
                showToast(`Personil "${m.name}" berhasil dihapus.`);
              }
            }}
            onToggleMissionaryStatus={(m) => {
              const next = m.status === 'ACTIVE' ? 'FURLOUGH' : 'ACTIVE';
              const updated = missionaries.map((x) => (x.id === m.id ? { ...x, status: next as any } : x));
              saveMissionaries(updated);
              showToast(`Status "${m.name}" diubah menjadi ${next === 'ACTIVE' ? 'Aktif' : 'Cuti'}.`);
            }}
          />
        )}

        {/* VIEW 2: DASHBOARD KEGIATAN TERPADU */}
        {viewMode === 'dashboard' && activeActivity && (
          <MissionDashboardTab
            activeActivity={activeActivity}
            yayasanMainCash={yayasanMainCash}
            handleBackToList={handleBackToList}
            setEditingActivity={setEditingActivity}
            handleExportCSV={handleExportCSV}
            handleDownloadPDF={handleDownloadPDF}
            isExportingPDF={isExportingPDF}
            handleToggleStatus={handleToggleStatus}
            handleDeleteActivity={handleDeleteActivity}
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
            formCashEntry={formCashEntry}
            setFormCashEntry={setFormCashEntry}
            handleAddCashEntry={handleAddCashEntry}
            formTransferSubsidi={formTransferSubsidi}
            setFormTransferSubsidi={setFormTransferSubsidi}
            handleTransferSubsidi={handleTransferSubsidi}
            handleDeleteTransaction={handleDeleteTransaction}
            formCommittee={formCommittee}
            setFormCommittee={setFormCommittee}
            committeeSearchQuery={committeeSearchQuery}
            setCommitteeSearchQuery={setCommitteeSearchQuery}
            showCommitteeDropdown={showCommitteeDropdown}
            setShowCommitteeDropdown={setShowCommitteeDropdown}
            filteredCommitteeMembers={filteredCommitteeMembers}
            handleAddCommittee={handleAddCommittee}
            handleDeleteCommittee={handleDeleteCommittee}
          />
        )}

        {/* MODALS */}
        <MissionActivityModal
          showRintisModal={showRintisModal}
          onCloseRintis={() => setShowRintisModal(false)}
          onCreated={(newAct) => {
            setActivities((prev) => [newAct, ...prev]);
            setSelectedActivityId(newAct.id);
            setViewMode('dashboard');
          }}
          editingActivity={editingActivity}
          onCloseEdit={() => setEditingActivity(null)}
          onUpdated={(updatedAct) => {
            setActivities((prev) => prev.map((a) => (a.id === updatedAct.id ? updatedAct : a)));
          }}
          showToast={showToast}
        />

        <MissionaryModal
          isOpen={showMissionaryModal}
          onClose={() => setShowMissionaryModal(false)}
          editingMissionary={editingMissionary}
          missionaries={missionaries}
          saveMissionaries={saveMissionaries}
          showToast={showToast}
          members={members}
        />
      </div>

      {/* PRINT-ONLY OFFICIAL PDF REPORT */}
      {activeActivity && (
        <MissionPrintReport
          activeActivity={activeActivity}
          totalMasuk={totalMasuk}
          totalKeluar={totalKeluar}
        />
      )}
    </div>
  );
};

export default MissionsPage;
