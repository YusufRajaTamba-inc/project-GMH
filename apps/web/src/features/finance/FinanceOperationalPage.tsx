import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  BookOpen,
  Upload,
  PieChart,
  History,
} from 'lucide-react';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import type {
  FinancialTransaction,
  BudgetPeriodType,
} from '../../state/FinanceStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useAuth } from '../../state/AuthContext';
import { formatRupiah } from '../../utils/currency';
import { usePagination } from '../../utils/usePagination';
import { api } from '../../services/api';
import type {
  ActiveTab,
  BudgetCategory,
  AuditLogEntry,
  TransactionFormData,
  BudgetFormData,
  EditingBudgetData,
} from './types';
import { MONTH_OPTIONS, getPeriodDetails } from './types';
import { FinanceJournalTab } from './components/FinanceJournalTab';
import { FinanceCsvUploadTab } from './components/FinanceCsvUploadTab';
import { FinanceBudgetTab } from './components/FinanceBudgetTab';
import { FinanceAuditLogTab } from './components/FinanceAuditLogTab';
import { FinanceModals } from './components/FinanceModals';

const FinanceOperationalPage: React.FC = () => {
  const { user } = useAuth();
  const { lookups } = useDynamicConfig();
  const {
    transactions,
    budgetCategories,
    refreshFromApi,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAddTransactions,
    addBudgetCategory,
    updateBudgetCategory,
    topUpBudgetCategory,
    toggleCloseBudgetCategory,
    deleteBudgetCategory,
    getOperationalBalance,
    getBankBalance,
    getBuildingBalance,
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('JURNAL');
  const [showAdd, setShowAdd] = useState(false);
  const [editingTrx, setEditingTrx] = useState<FinancialTransaction | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExportingFinancePDF, setIsExportingFinancePDF] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters for Buku Jurnal Kas
  const [search, setSearch] = useState('');
  const [filterFlow, setFilterFlow] = useState<string>(''); // '' | 'DEBIT' | 'CREDIT'
  const [filterCategory, setFilterCategory] = useState<string>('');
  // Integrated Cash Period State
  const [periodKey, setPeriodKey] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Form State for Add Transaction
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'DEBIT',
    account: 'KAS_OPERASIONAL',
    date: new Date().toISOString().split('T')[0],
    desc: '',
    category: lookups?.operationalCategories?.[0] || 'Operasional Kantor',
    party: '',
    amount: 0,
    notes: '',
    status: 'Approved',
  });

  // Audit Logs State (from PostgreSQL system backend)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Budget Category Filters & Pagination State
  const [budgetFilterPeriod, setBudgetFilterPeriod] = useState<string>('CURRENT');
  const [budgetFilterStatus, setBudgetFilterStatus] = useState<string>('ALL');
  const [budgetSearch, setBudgetSearch] = useState<string>('');

  // Budget Category Management Modal State
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState<BudgetFormData>({
    category: '',
    budget: 0,
    periodType: 'MONTHLY',
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    year: String(new Date().getFullYear()),
    notes: '',
  });

  const [editingBudget, setEditingBudget] = useState<EditingBudgetData | null>(null);

  // Top-Up Modal State
  const [topUpTarget, setTopUpTarget] = useState<BudgetCategory | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(0);
  const [topUpReason, setTopUpReason] = useState<string>('');

  // Fetch real audit logs directly from PostgreSQL
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.finance.getAuditLogs();
      if (res?.logs && Array.isArray(res.logs) && res.logs.length > 0) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.warn('Gagal memuat log audit dari API:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'LOG_MUTASI') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // CSV Import State
  const [csvPreviewData, setCsvPreviewData] = useState<Array<Omit<FinancialTransaction, 'id' | 'code'>>>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromApi();
      await fetchAuditLogs();
      showToast('Data kas operasional dan log sistem berhasil disinkronkan.');
    } catch {
      showToast('Sinkronisasi selesai.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Budget Category Handlers
  const handleSaveBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.category.trim()) {
      alert('Nama kategori anggaran wajib diisi.');
      return;
    }
    if (budgetForm.budget <= 0) {
      alert('Nominal pagu anggaran harus lebih besar dari Rp 0.');
      return;
    }

    const monthLabel = MONTH_OPTIONS.find((m) => m.value === budgetForm.month)?.label || budgetForm.month;
    const period = budgetForm.periodType === 'ANNUAL' ? budgetForm.year : `${budgetForm.year}-${budgetForm.month}`;
    const periodName = budgetForm.periodType === 'ANNUAL' ? `Tahun Anggaran ${budgetForm.year}` : `${monthLabel} ${budgetForm.year}`;

    addBudgetCategory(
      budgetForm.category.trim(),
      budgetForm.budget,
      budgetForm.notes.trim() || undefined,
      budgetForm.periodType,
      period,
      periodName
    );

    showToast(`Pos anggaran baru "${budgetForm.category.trim()}" (${periodName}) berhasil ditambahkan.`);
    setShowAddBudget(false);
    setBudgetForm({
      category: '',
      budget: 0,
      periodType: 'MONTHLY',
      month: '10',
      year: '2026',
      notes: '',
    });
  };

  const handleUpdateBudgetCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    if (editingBudget.budget <= 0) {
      alert('Nominal pagu anggaran harus lebih besar dari Rp 0.');
      return;
    }

    const monthLabel = MONTH_OPTIONS.find((m) => m.value === editingBudget.month)?.label || editingBudget.month;
    const period = editingBudget.periodType === 'ANNUAL' ? editingBudget.year : `${editingBudget.year}-${editingBudget.month}`;
    const periodName = editingBudget.periodType === 'ANNUAL' ? `Tahun Anggaran ${editingBudget.year}` : `${monthLabel} ${editingBudget.year}`;

    updateBudgetCategory(
      editingBudget.id,
      editingBudget.budget,
      editingBudget.category.trim(),
      editingBudget.notes.trim() || undefined,
      editingBudget.periodType,
      period,
      periodName,
      editingBudget.status
    );

    showToast(`Pagu anggaran "${editingBudget.category}" (${periodName}) berhasil diperbarui.`);
    setEditingBudget(null);
  };

  const handleToggleCloseBudget = (b: BudgetCategory) => {
    const isClosing = b.status === 'ACTIVE';
    const confirmMsg = isClosing
      ? `Tutup pagu anggaran "${b.category}" (${b.periodName})?\n\nStatus akan diubah menjadi DITUTUP (Beku). Pengeluaran baru untuk pos ini akan dihentikan sementara. Anda dapat membukanya kembali kapan saja.`
      : `Buka kembali pagu anggaran "${b.category}" (${b.periodName})?\n\nStatus akan diaktifkan kembali.`;

    if (window.confirm(confirmMsg)) {
      toggleCloseBudgetCategory(b.id);
      showToast(
        isClosing
          ? `Pagu anggaran "${b.category}" telah ditutup.`
          : `Pagu anggaran "${b.category}" telah dibuka kembali (Aktif).`
      );
    }
  };

  const handleSaveTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpTarget) return;
    if (topUpAmount <= 0) {
      alert('Nominal penambahan harus lebih besar dari Rp 0.');
      return;
    }

    topUpBudgetCategory(topUpTarget.id, topUpAmount, topUpReason.trim() || undefined);
    showToast(
      `Pagu "${topUpTarget.category}" berhasil ditambah sebesar ${formatRupiah(topUpAmount)}. Plafon baru: ${formatRupiah(topUpTarget.budget + topUpAmount)}.`
    );
    setTopUpTarget(null);
    setTopUpAmount(0);
    setTopUpReason('');
  };

  const handleDeleteBudgetCategory = (b: { id: string; category: string }) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pos anggaran "${b.category}"?`)) {
      deleteBudgetCategory(b.id);
      showToast(`Pos anggaran "${b.category}" telah dihapus.`);
    }
  };

  // Add Transaction Handler
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert('Mohon masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }
    if (!formData.desc.trim()) {
      alert('Mohon isi deskripsi mutasi transaksi.');
      return;
    }

    const partyClean = formData.party.trim() || 'Pihak Relasi';

    const created = addTransaction({
      date: formData.date,
      desc: formData.desc.trim(),
      category: formData.category,
      party: partyClean,
      amount: formData.amount,
      type: formData.type,
      account: formData.account,
      source: 'OPERASIONAL',
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      recordedBy: user?.name || 'Staff Yayasan',
    });

    // Record audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'PENCATATAN',
      refCode: created.code,
      category: created.category,
      party: partyClean,
      operator: user?.name || 'Staff Yayasan',
      details: `Mencatat transaksi kas baru: ${created.desc} (${formatRupiah(created.amount)})`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(
      `Entri ${created.code} berhasil disimpan ke Buku Jurnal! (${formData.type === 'CREDIT' ? '+' : '-'}${formatRupiah(formData.amount)})`
    );

    setShowAdd(false);
    setFormData({
      type: 'DEBIT',
      account: 'KAS_OPERASIONAL',
      date: new Date().toISOString().split('T')[0],
      desc: '',
      category: lookups?.operationalCategories?.[0] || 'Operasional Kantor',
      party: '',
      amount: 0,
      notes: '',
      status: 'Approved',
    });
  };

  // Edit Transaction Handler
  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;

    if (editingTrx.amount <= 0) {
      alert('Mohon masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }

    updateTransaction(editingTrx.id, {
      date: editingTrx.date,
      desc: editingTrx.desc.trim(),
      category: editingTrx.category,
      party: editingTrx.party?.trim() || 'Pihak Relasi',
      amount: editingTrx.amount,
      type: editingTrx.type,
      account: editingTrx.account,
      status: editingTrx.status || 'Approved',
      notes: editingTrx.notes?.trim() || undefined,
    });

    // Audit log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action: 'UPDATE',
      refCode: editingTrx.code,
      category: editingTrx.category,
      party: editingTrx.party || 'Pihak Relasi',
      operator: user?.name || 'Staff Yayasan',
      details: `Memperbarui mutasi kas: ${editingTrx.desc} (${formatRupiah(editingTrx.amount)})`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    showToast(`Transaksi ${editingTrx.code} berhasil diperbarui.`);
    setEditingTrx(null);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (t: FinancialTransaction) => {
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi ${t.code} (${t.desc})?`)) {
      deleteTransaction(t.id);

      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        action: 'HAPUS',
        refCode: t.code,
        category: t.category,
        party: t.party || 'Pihak Relasi',
        operator: user?.name || 'Staff Yayasan',
        details: `Menghapus entri mutasi: ${t.desc} (${formatRupiah(t.amount)})`,
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      showToast(`Transaksi ${t.code} telah dihapus dari Buku Jurnal.`);
    }
  };

  // Balances
  const opBalance = getOperationalBalance();
  const bankBalance = getBankBalance();
  const buildingBalance = getBuildingBalance();

  // Active Cash Period Details & Transactions
  const activePeriod = useMemo(() => {
    return getPeriodDetails(periodKey, customStartDate, customEndDate);
  }, [periodKey, customStartDate, customEndDate]);

  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const distinctTransactionPeriods = useMemo(() => {
    const set = new Set<string>();
    for (let m = 12; m >= 1; m--) {
      set.add(`2026-${String(m).padStart(2, '0')}`);
    }
    transactions.forEach((t) => {
      if (t && t.date && t.date.length >= 7) {
        const ym = t.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          set.add(ym);
        }
      }
    });
    if (periodKey && /^\d{4}-\d{2}$/.test(periodKey.replace('MONTH:', ''))) {
      set.add(periodKey.replace('MONTH:', ''));
    }
    return Array.from(set).sort().reverse();
  }, [transactions, periodKey]);

  // Period Navigation Handlers
  const handlePrevMonth = () => {
    if (periodKey.startsWith('CYCLE:')) {
      const ym = periodKey.replace('CYCLE:', '');
      const [y, m] = ym.split('-').map(Number);
      const prevM = m === 1 ? 12 : m - 1;
      const prevY = m === 1 ? y - 1 : y;
      setPeriodKey(`CYCLE:${prevY}-${String(prevM).padStart(2, '0')}`);
      return;
    }
    if (periodKey.startsWith('YEAR:')) {
      const y = Number(periodKey.replace('YEAR:', '')) || 2026;
      setPeriodKey(`YEAR:${y - 1}`);
      return;
    }
    const ym = periodKey.includes('-') && !periodKey.startsWith('CYCLE:') ? periodKey.replace('MONTH:', '') : currentMonthKey;
    const [y, m] = ym.split('-').map(Number);
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    setPeriodKey(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (periodKey.startsWith('CYCLE:')) {
      const ym = periodKey.replace('CYCLE:', '');
      const [y, m] = ym.split('-').map(Number);
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      setPeriodKey(`CYCLE:${nextY}-${String(nextM).padStart(2, '0')}`);
      return;
    }
    if (periodKey.startsWith('YEAR:')) {
      const y = Number(periodKey.replace('YEAR:', '')) || 2026;
      setPeriodKey(`YEAR:${y + 1}`);
      return;
    }
    const ym = periodKey.includes('-') && !periodKey.startsWith('CYCLE:') ? periodKey.replace('MONTH:', '') : currentMonthKey;
    const [y, m] = ym.split('-').map(Number);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    setPeriodKey(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  // Transactions strictly filtered by active period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => t && activePeriod.matchFn(t.date || ''));
  }, [transactions, activePeriod]);

  // Financial stats for the active period
  const periodStats = useMemo(() => {
    const totalIn = periodTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalOut = periodTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const net = totalIn - totalOut;

    const opTrx = periodTransactions.filter((t) => t.account === 'KAS_OPERASIONAL');
    const opIn = opTrx
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const opOut = opTrx
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const bldTrx = periodTransactions.filter((t) => t.account === 'KAS_PEMBANGUNAN');
    const bldIn = bldTrx
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalIn,
      totalOut,
      net,
      opIn,
      opOut,
      bldIn,
      count: periodTransactions.length,
      opCount: opTrx.length,
      bldCount: bldTrx.length,
    };
  }, [periodTransactions]);

  // Filtered transactions for Tab 1 (Buku Jurnal Kas)
  const displayed = useMemo(() => {
    return periodTransactions.filter((t) => {
      if (!t) return false;

      const tDesc = (t.desc || '').toLowerCase();
      const tCode = (t.code || '').toLowerCase();
      const tCategory = (t.category || '').toLowerCase();
      const tParty = (t.party || '').toLowerCase();
      const searchLower = (search || '').toLowerCase().trim();

      const matchSearch =
        !searchLower ||
        tDesc.includes(searchLower) ||
        tCode.includes(searchLower) ||
        tCategory.includes(searchLower) ||
        tParty.includes(searchLower);

      const matchFlow = filterFlow ? t.type === filterFlow : true;
      const matchCategory = filterCategory ? t.category === filterCategory : true;

      return matchSearch && matchFlow && matchCategory;
    });
  }, [periodTransactions, search, filterFlow, filterCategory]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'KODE REF',
      'TANGGAL',
      'KATEGORI AKUN',
      'DESKRIPSI MUTASI',
      'SUMBER / PIHAK RELASI',
      'ALIRAN KAS',
      'NOMINAL (RP)',
      'STATUS',
      'REKENING KAS',
      'DICATAT OLEH',
    ];

    const rows = displayed.map((t) => [
      `"${t.code}"`,
      `"${t.date}"`,
      `"${t.category}"`,
      `"${t.desc.replace(/"/g, '""')}"`,
      `"${(t.party || 'Pihak Relasi').replace(/"/g, '""')}"`,
      `"${t.type === 'CREDIT' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}"`,
      `"${t.amount}"`,
      `"${t.status || 'Approved'}"`,
      `"${t.account}"`,
      `"${t.recordedBy || 'Staff'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanPeriod = activePeriod.shortLabel.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Jurnal_Kas_Yayasan_GMH_${cleanPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Buku Jurnal Kas berhasil diekspor ke file CSV.');
  };

  // Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = ['tanggal', 'kategori', 'deskripsi', 'pihak_relasi', 'aliran_kas', 'nominal', 'rekening'];
    const sampleRows = [
      '2026-10-29,Operasional Kantor,"Pembelian kertas HVS A4 & tinta printer sekretariat","Toko ATK Mandiri",Pengeluaran,350000,KAS_OPERASIONAL',
      '2026-10-28,Operasional Kantor,"Konsumsi rapat evaluasi program pengurus yayasan","Catering Berkah",Pengeluaran,280000,KAS_OPERASIONAL',
      '2026-10-27,Donasi Kemitraan,"Donasi rutin kemitraan dari alumni USU angkatan 2012","Alumni Stambuk 2012",Pemasukan,1500000,KAS_BANK',
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_jurnal_kas_gmh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Template CSV berhasil diunduh.');
  };

  // Handle CSV File Upload Parsing
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('File CSV kosong atau format header tidak valid.');
          return;
        }

        const parsedRows: Array<Omit<FinancialTransaction, 'id' | 'code'>> = [];
        for (let i = 1; i < lines.length; i++) {
          const rowStr = lines[i];
          const cols = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowStr.split(',');
          if (cols && cols.length >= 6) {
            const clean = (val: string) => (val || '').replace(/^"|"$/g, '').trim();
            const date = clean(cols[0]) || new Date().toISOString().split('T')[0];
            const category = clean(cols[1]) || 'Operasional Kantor';
            const desc = clean(cols[2]) || 'Transaksi Kas CSV';
            const party = clean(cols[3]) || 'Pihak Relasi';
            const flowStr = clean(cols[4]).toLowerCase();
            const type = flowStr.includes('masuk') || flowStr.includes('credit') ? 'CREDIT' : 'DEBIT';
            const amount = parseFloat(clean(cols[5]).replace(/[^0-9.]/g, '')) || 0;
            const accountStr = clean(cols[6] || 'KAS_OPERASIONAL');
            const account = accountStr.includes('PEMBANGUNAN')
              ? 'KAS_PEMBANGUNAN'
              : accountStr.includes('BANK')
              ? 'KAS_BANK'
              : 'KAS_OPERASIONAL';

            if (amount > 0) {
              parsedRows.push({
                date,
                category,
                desc,
                party,
                type,
                amount,
                account,
                source: 'OPERASIONAL',
                status: 'Approved',
                notes: 'Import via file CSV',
                recordedBy: user?.name || 'Staff Import',
              });
            }
          }
        }

        if (parsedRows.length === 0) {
          alert('Tidak ada baris data valid yang berhasil diparsing dari CSV.');
          return;
        }

        setCsvPreviewData(parsedRows);
        showToast(`${parsedRows.length} baris transaksi berhasil dibaca dari ${file.name}.`);
      } catch {
        alert('Gagal membaca isi file CSV. Pastikan file berformat CSV standar.');
      }
    };
    reader.readAsText(file);
  };

  // Commit CSV Import to Store & Backend PostgreSQL
  const handleCommitCsvImport = async () => {
    if (csvPreviewData.length === 0) return;
    setIsImporting(true);

    try {
      const res = await api.finance.batchCreateTransactions(csvPreviewData);
      bulkAddTransactions(csvPreviewData);
      await refreshFromApi();
      await fetchAuditLogs();

      showToast(`Berhasil menyimpan ${res?.insertedCount || csvPreviewData.length} transaksi kas ke Buku Jurnal!`);
      setCsvPreviewData([]);
      setCsvFileName('');
      setActiveTab('JURNAL');
    } catch (err: any) {
      console.warn('Batch create error, fallback local:', err);
      bulkAddTransactions(csvPreviewData);
      setCsvPreviewData([]);
      setCsvFileName('');
      setActiveTab('JURNAL');
      showToast('Transaksi disimpan ke jurnal kas lokal.');
    } finally {
      setIsImporting(false);
    }
  };

  // Transactions Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedTransactions,
  } = usePagination(displayed, { initialPageSize: 10 });

  // Dynamic Budgeting Realization Calculation from Buku Jurnal Kas (Filtered by Period)
  const budgetList: BudgetCategory[] = useMemo(() => {
    return budgetCategories.map((item) => {
      const bCatLower = (item.category || '').toLowerCase().trim();
      const periodType: BudgetPeriodType =
        item.periodType || (item.category?.toLowerCase().includes('gedung') ? 'ANNUAL' : 'MONTHLY');
      const now = new Date();
      const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const curYr = String(now.getFullYear());
      const period = item.period || (periodType === 'ANNUAL' ? curYr : curYm);
      const periodName = item.periodName || (periodType === 'ANNUAL' ? `Tahun Anggaran ${period}` : 'Oktober 2026');
      const status = item.status || 'ACTIVE';

      const relevantTransactions = transactions.filter((t) => {
        if (t.type !== 'DEBIT') return false;
        const tCatLower = (t.category || '').toLowerCase().trim();
        const matchesCategory =
          tCatLower === bCatLower ||
          tCatLower.includes(bCatLower) ||
          bCatLower.includes(tCatLower);
        if (!matchesCategory) return false;

        if (period) {
          return (t.date || '').startsWith(period);
        }
        return true;
      });

      const spent = relevantTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      return {
        id: item.id,
        category: item.category,
        budget: item.budget,
        notes: item.notes,
        periodType,
        period,
        periodName,
        status,
        spent,
        trxCount: relevantTransactions.length,
      };
    });
  }, [budgetCategories, transactions]);

  // Distinct periods for the filter dropdown
  const availableBudgetPeriods = useMemo(() => {
    const set = new Map<string, string>();
    budgetList.forEach((b) => {
      if (b.period && b.periodName) {
        set.set(b.period, b.periodName);
      }
    });
    const now = new Date();
    const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curYear = String(now.getFullYear());
    const curMonthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);
    if (!set.has(curYm)) set.set(curYm, curMonthName);
    if (!set.has(curYear)) set.set(curYear, `Tahun Anggaran ${curYear}`);
    return Array.from(set.entries()).map(([value, label]) => ({ value, label }));
  }, [budgetList]);

  // Filtered Budget List according to selected Period & Status
  const filteredBudgetList = useMemo(() => {
    const now = new Date();
    const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curYear = String(now.getFullYear());

    return budgetList.filter((b) => {
      if (budgetFilterPeriod === 'CURRENT') {
        const isCurrentMonth = b.periodType === 'MONTHLY' && b.period === curYm;
        const isCurrentYear = b.periodType === 'ANNUAL' && b.period === curYear;
        if (!isCurrentMonth && !isCurrentYear) return false;
      } else if (budgetFilterPeriod !== 'ALL') {
        if (b.period !== budgetFilterPeriod) return false;
      }

      if (budgetFilterStatus !== 'ALL') {
        if (b.status !== budgetFilterStatus) return false;
      }

      if (budgetSearch.trim()) {
        const q = budgetSearch.toLowerCase().trim();
        const matchCat = b.category.toLowerCase().includes(q);
        const matchNotes = (b.notes || '').toLowerCase().includes(q);
        const matchPeriod = b.periodName.toLowerCase().includes(q);
        if (!matchCat && !matchNotes && !matchPeriod) return false;
      }

      return true;
    });
  }, [budgetList, budgetFilterPeriod, budgetFilterStatus, budgetSearch]);

  const totalBudget = filteredBudgetList.reduce((acc, b) => acc + b.budget, 0);
  const totalSpent = filteredBudgetList.reduce((acc, b) => acc + b.spent, 0);
  const overBudgetCount = filteredBudgetList.filter((b) => b.spent >= b.budget && b.status === 'ACTIVE').length;

  // Budget Table Pagination
  const {
    currentPage: budgetCurrentPage,
    setCurrentPage: setBudgetCurrentPage,
    pageSize: budgetPageSize,
    setPageSize: setBudgetPageSize,
    totalPages: totalBudgetPages,
    paginatedItems: paginatedBudgetList,
  } = usePagination(filteredBudgetList, { initialPageSize: 8 });

  useEffect(() => {
    setBudgetCurrentPage(1);
  }, [budgetFilterPeriod, budgetFilterStatus, budgetSearch, setBudgetCurrentPage]);

  // Distinct category list for dropdown
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    budgetCategories.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    (lookups?.operationalCategories || []).forEach((c) => set.add(c));
    return Array.from(set);
  }, [budgetCategories, transactions, lookups?.operationalCategories]);

  // Audit Logs Pagination
  const {
    currentPage: logCurrentPage,
    setCurrentPage: setLogCurrentPage,
    pageSize: logPageSize,
    setPageSize: setLogPageSize,
    totalPages: totalLogPages,
    paginatedItems: paginatedAuditLogs,
  } = usePagination(auditLogs, { initialPageSize: 10 });

  // Helper to resolve linked budget for transaction modal inputs
  const getLinkedBudget = (categoryName?: string, trxDate?: string) => {
    if (!categoryName) return null;
    const catLower = categoryName.toLowerCase().trim();
    const dateStr = trxDate || new Date().toISOString().split('T')[0];
    const trxMonth = dateStr.slice(0, 7);
    const trxYear = dateStr.slice(0, 4);

    let match = budgetList.find((b) => {
      const bCatLower = (b.category || '').toLowerCase().trim();
      const isMatch = bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
      return isMatch && b.periodType === 'MONTHLY' && b.period === trxMonth;
    });

    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        const isMatch = bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
        return isMatch && b.periodType === 'ANNUAL' && b.period === trxYear;
      });
    }

    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        return (bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower)) && b.status === 'ACTIVE';
      });
    }

    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        return bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
      });
    }

    return match || null;
  };

  const activeLinkedBudgetForAdd = useMemo(() => {
    return getLinkedBudget(formData.category, formData.date) || undefined;
  }, [formData.category, formData.date, budgetList]);

  const activeLinkedBudgetForEdit = useMemo(() => {
    if (!editingTrx) return undefined;
    return getLinkedBudget(editingTrx.category, editingTrx.date) || undefined;
  }, [editingTrx?.category, editingTrx?.date, budgetList]);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Kas &amp; Keuangan Yayasan GMH</h2>
          <p>Pencatatan mutasi kas operasional, belanja rutin kantor, dan konsolidasi kas yayasan</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost btn-sm"
            id="btn-refresh-finance"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Sinkronkan data dengan database backend"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Memperbarui…' : 'Segarkan'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            id="btn-export-csv"
            onClick={handleExportCSV}
            title="Download jurnal mutasi ke file CSV"
          >
            <FileSpreadsheet size={14} /> Ekspor CSV
          </button>
          <button
            className="btn btn-ghost btn-sm"
            id="btn-export-finance"
            onClick={() => setShowExportModal(true)}
            title="Cetak format laporan resmi"
          >
            <FileText size={14} /> Unduh PDF
          </button>
          <button
            className="btn btn-primary btn-sm"
            id="btn-add-transaction"
            onClick={() => setShowAdd(true)}
            style={{ fontWeight: 600 }}
          >
            <Plus size={14} /> + Entri Kas Baru
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 4 NAVIGATION TABS EXACTLY AS IMAGE 2 */}
      <div className="tabs" style={{ marginBottom: 18, borderBottom: '2px solid var(--gmh-border)' }}>
        <button
          className={`tab-btn ${activeTab === 'JURNAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('JURNAL')}
          style={{ fontSize: 13.5, fontWeight: activeTab === 'JURNAL' ? 700 : 500 }}
        >
          <BookOpen size={15} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Buku Jurnal Kas
        </button>

        <button
          className={`tab-btn ${activeTab === 'UPLOAD_CSV' ? 'active' : ''}`}
          onClick={() => setActiveTab('UPLOAD_CSV')}
          style={{ fontSize: 13.5, fontWeight: activeTab === 'UPLOAD_CSV' ? 700 : 500 }}
        >
          <Upload size={15} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Unggah Jurnal CSV
        </button>

        <button
          className={`tab-btn ${activeTab === 'ANGGARAN' ? 'active' : ''}`}
          onClick={() => setActiveTab('ANGGARAN')}
          style={{ fontSize: 13.5, fontWeight: activeTab === 'ANGGARAN' ? 700 : 500 }}
        >
          <PieChart size={15} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Kategori &amp; Anggaran
        </button>

        <button
          className={`tab-btn ${activeTab === 'LOG_MUTASI' ? 'active' : ''}`}
          onClick={() => setActiveTab('LOG_MUTASI')}
          style={{ fontSize: 13.5, fontWeight: activeTab === 'LOG_MUTASI' ? 700 : 500 }}
        >
          <History size={15} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          Log Mutasi Kas
        </button>
      </div>

      {/* TAB 1: BUKU JURNAL KAS */}
      {activeTab === 'JURNAL' && (
        <FinanceJournalTab
          periodKey={periodKey}
          setPeriodKey={setPeriodKey}
          activePeriod={activePeriod}
          currentMonthKey={currentMonthKey}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          distinctTransactionPeriods={distinctTransactionPeriods}
          periodTransactions={periodTransactions}
          displayed={displayed}
          paginatedTransactions={paginatedTransactions}
          opBalance={opBalance}
          buildingBalance={buildingBalance}
          bankBalance={bankBalance}
          periodStats={periodStats}
          search={search}
          setSearch={setSearch}
          filterFlow={filterFlow}
          setFilterFlow={setFilterFlow}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          allCategories={allCategories}
          setEditingTrx={setEditingTrx}
          handleDeleteTransaction={handleDeleteTransaction}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
        />
      )}

      {/* TAB 2: UNGGAH JURNAL CSV */}
      {activeTab === 'UPLOAD_CSV' && (
        <FinanceCsvUploadTab
          csvPreviewData={csvPreviewData}
          csvFileName={csvFileName}
          isImporting={isImporting}
          handleDownloadSampleTemplate={handleDownloadSampleTemplate}
          handleCsvFileUpload={handleCsvFileUpload}
          handleCommitCsvImport={handleCommitCsvImport}
        />
      )}

      {/* TAB 3: KATEGORI & ANGGARAN */}
      {activeTab === 'ANGGARAN' && (
        <FinanceBudgetTab
          filteredBudgetList={filteredBudgetList}
          paginatedBudgetList={paginatedBudgetList}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
          overBudgetCount={overBudgetCount}
          budgetFilterPeriod={budgetFilterPeriod}
          setBudgetFilterPeriod={setBudgetFilterPeriod}
          budgetFilterStatus={budgetFilterStatus}
          setBudgetFilterStatus={setBudgetFilterStatus}
          budgetSearch={budgetSearch}
          setBudgetSearch={setBudgetSearch}
          availableBudgetPeriods={availableBudgetPeriods}
          setShowAddBudget={setShowAddBudget}
          setTopUpTarget={setTopUpTarget}
          setTopUpAmount={setTopUpAmount}
          setTopUpReason={setTopUpReason}
          setEditingBudget={setEditingBudget}
          handleToggleCloseBudget={handleToggleCloseBudget}
          handleDeleteBudgetCategory={handleDeleteBudgetCategory}
          budgetCurrentPage={budgetCurrentPage}
          totalBudgetPages={totalBudgetPages}
          budgetPageSize={budgetPageSize}
          setBudgetCurrentPage={setBudgetCurrentPage}
          setBudgetPageSize={setBudgetPageSize}
        />
      )}

      {/* TAB 4: LOG MUTASI KAS */}
      {activeTab === 'LOG_MUTASI' && (
        <FinanceAuditLogTab
          auditLogs={auditLogs}
          isLoadingLogs={isLoadingLogs}
          fetchAuditLogs={fetchAuditLogs}
          paginatedAuditLogs={paginatedAuditLogs}
          logCurrentPage={logCurrentPage}
          totalLogPages={totalLogPages}
          logPageSize={logPageSize}
          setLogCurrentPage={setLogCurrentPage}
          setLogPageSize={setLogPageSize}
        />
      )}

      {/* MODALS */}
      <FinanceModals
        showAdd={showAdd}
        setShowAdd={setShowAdd}
        formData={formData}
        setFormData={setFormData}
        handleSaveTransaction={handleSaveTransaction}
        allCategories={allCategories}
        activeLinkedBudgetForAdd={activeLinkedBudgetForAdd}
        editingTrx={editingTrx}
        setEditingTrx={setEditingTrx}
        handleUpdateTransaction={handleUpdateTransaction}
        activeLinkedBudgetForEdit={activeLinkedBudgetForEdit}
        transactions={transactions}
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        activePeriod={activePeriod}
        opBalance={opBalance}
        periodStats={periodStats}
        displayed={displayed}
        isExportingFinancePDF={isExportingFinancePDF}
        setIsExportingFinancePDF={setIsExportingFinancePDF}
        showToast={showToast}
        showAddBudget={showAddBudget}
        setShowAddBudget={setShowAddBudget}
        budgetForm={budgetForm}
        setBudgetForm={setBudgetForm}
        handleSaveBudgetCategory={handleSaveBudgetCategory}
        editingBudget={editingBudget}
        setEditingBudget={setEditingBudget}
        handleUpdateBudgetCategory={handleUpdateBudgetCategory}
        topUpTarget={topUpTarget}
        setTopUpTarget={setTopUpTarget}
        topUpAmount={topUpAmount}
        setTopUpAmount={setTopUpAmount}
        topUpReason={topUpReason}
        setTopUpReason={setTopUpReason}
        handleSaveTopUp={handleSaveTopUp}
      />
    </div>
  );
};

export default FinanceOperationalPage;
