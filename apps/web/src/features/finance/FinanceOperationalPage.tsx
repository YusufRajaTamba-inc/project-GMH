import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ArrowDownRight,
  FileText,
  Search,
  CheckCircle,
  Landmark,
  Wallet,
  RefreshCw,
  Download,
  Upload,
  History,
  PieChart,
  BookOpen,
  Edit,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  PlusCircle,
  Filter,
  Target,
  Info,
  FileDown,
  Loader2,
} from 'lucide-react';
import { exportHtmlToPdf } from '../../utils/pdfExport';
import { useFinanceStore } from '../../state/FinanceStoreContext';
import type {
  FinancialTransaction,
  TransactionType,
  AccountType,
  BudgetPeriodType,
  BudgetStatus,
} from '../../state/FinanceStoreContext';
import { useDynamicConfig } from '../../state/DynamicConfigContext';
import { useAuth } from '../../state/AuthContext';
import NominalInput from '../../components/NominalInput';
import { formatRupiah } from '../../utils/currency';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../utils/usePagination';
import { api } from '../../services/api';

type ActiveTab = 'JURNAL' | 'UPLOAD_CSV' | 'ANGGARAN' | 'LOG_MUTASI';

const MONTH_OPTIONS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const YEAR_OPTIONS = ['2025', '2026', '2027', '2028'];

const MONTH_NAMES_MAP: Record<string, string> = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember',
};

export const getPeriodDetails = (key: string, customStart = '', customEnd = '') => {
  if (key === 'ALL') {
    return {
      label: 'Semua Periode',
      shortLabel: 'Semua Waktu',
      dateRangeText: 'Akumulasi Seluruh Mutasi',
      matchFn: (_d: string) => true,
    };
  }

  if (key === 'CUSTOM') {
    const rangeText =
      customStart && customEnd
        ? `${customStart} s/d ${customEnd}`
        : customStart
        ? `Mulai ${customStart}`
        : customEnd
        ? `Hingga ${customEnd}`
        : 'Semua Tanggal';
    return {
      label: 'Rentang Tanggal Khusus',
      shortLabel: 'Kustom',
      dateRangeText: rangeText,
      matchFn: (d: string) => (!customStart || d >= customStart) && (!customEnd || d <= customEnd),
    };
  }

  if (key.startsWith('YEAR:')) {
    const yr = key.replace('YEAR:', '');
    return {
      label: `Tahun Anggaran ${yr}`,
      shortLabel: `Tahun ${yr}`,
      dateRangeText: `01 Jan – 31 Des ${yr}`,
      matchFn: (d: string) => (d || '').startsWith(yr),
    };
  }

  if (key.startsWith('CYCLE:')) {
    const ym = key.replace('CYCLE:', '');
    const [yrStr, moStr] = ym.split('-');
    const yr = parseInt(yrStr, 10) || 2026;
    const mo = parseInt(moStr, 10) || 10;

    const nextMo = mo === 12 ? 1 : mo + 1;
    const nextYr = mo === 12 ? yr + 1 : yr;

    const start = `${yr}-${String(mo).padStart(2, '0')}-16`;
    const end = `${nextYr}-${String(nextMo).padStart(2, '0')}-15`;

    const startMoName = MONTH_NAMES_MAP[String(mo).padStart(2, '0')]?.slice(0, 3) || moStr;
    const endMoName = MONTH_NAMES_MAP[String(nextMo).padStart(2, '0')]?.slice(0, 3) || String(nextMo);

    return {
      label: `Siklus Kas (16 ${startMoName} – 15 ${endMoName} ${nextYr})`,
      shortLabel: `Siklus 16 ${startMoName} – 15 ${endMoName}`,
      dateRangeText: `16 ${startMoName} ${yr} – 15 ${endMoName} ${nextYr}`,
      matchFn: (d: string) => (d || '') >= start && (d || '') <= end,
    };
  }

  // Monthly ('YYYY-MM' or 'MONTH:YYYY-MM')
  const ym = key.replace('MONTH:', '');
  const [yr, mo] = ym.split('-');
  const moName = MONTH_NAMES_MAP[mo] || mo;
  const lastDay = new Date(parseInt(yr, 10) || 2026, parseInt(mo, 10) || 10, 0).getDate();

  return {
    label: `${moName} ${yr}`,
    shortLabel: `${moName} ${yr}`,
    dateRangeText: `01 – ${lastDay} ${moName} ${yr}`,
    matchFn: (d: string) => (d || '').startsWith(ym),
  };
};

interface BudgetCategory {
  id: string;
  category: string;
  budget: number;
  notes?: string;
  periodType: BudgetPeriodType;
  period: string;
  periodName: string;
  status: BudgetStatus;
  spent: number;
  trxCount: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  refCode: string;
  category?: string;
  party: string;
  operator: string;
  details: string;
}

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
  const [periodKey, setPeriodKey] = useState<string>('2026-10');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Form State for Add Transaction
  const [formData, setFormData] = useState<{
    type: TransactionType;
    account: AccountType;
    date: string;
    desc: string;
    category: string;
    party: string;
    amount: number;
    notes: string;
    status: 'Approved' | 'Pending Review';
  }>({
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
  const [budgetFilterPeriod, setBudgetFilterPeriod] = useState<string>('CURRENT'); // 'CURRENT' | '2026-10' | '2026-11' | '2026' | 'ALL'
  const [budgetFilterStatus, setBudgetFilterStatus] = useState<string>('ALL'); // 'ALL' | 'ACTIVE' | 'CLOSED'
  const [budgetSearch, setBudgetSearch] = useState<string>('');

  // Budget Category Management Modal State
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState<{
    category: string;
    budget: number;
    periodType: BudgetPeriodType;
    month: string;
    year: string;
    notes: string;
  }>({
    category: '',
    budget: 0,
    periodType: 'MONTHLY',
    month: '10',
    year: '2026',
    notes: '',
  });

  const [editingBudget, setEditingBudget] = useState<{
    id: string;
    category: string;
    budget: number;
    periodType: BudgetPeriodType;
    month: string;
    year: string;
    status: BudgetStatus;
    notes: string;
  } | null>(null);

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
          // Simple CSV split matching comma outside quotes
          const cols = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rowStr.split(',');
          if (cols && cols.length >= 6) {
            const clean = (val: string) => (val || '').replace(/^"|"$/g, '').trim();
            const date = clean(cols[0]) || new Date().toISOString().split('T')[0];
            const category = clean(cols[1]) || 'Operasional Kantor';
            const desc = clean(cols[2]) || 'Transaksi Kas CSV';
            const party = clean(cols[3]) || 'Pihak Relasi';
            const flowStr = clean(cols[4]).toLowerCase();
            const type: TransactionType = flowStr.includes('masuk') || flowStr.includes('credit') ? 'CREDIT' : 'DEBIT';
            const amount = parseFloat(clean(cols[5]).replace(/[^0-9.]/g, '')) || 0;
            const accountStr = clean(cols[6] || 'KAS_OPERASIONAL');
            const account: AccountType = accountStr.includes('PEMBANGUNAN')
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
      } catch (err) {
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
      // 1. Direct integration with backend PostgreSQL
      const res = await api.finance.batchCreateTransactions(csvPreviewData);
      // 2. Also update local store
      bulkAddTransactions(csvPreviewData);
      await refreshFromApi();
      // 3. Refresh real system audit logs
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

  // Balances and Statistics
  const opBalance = getOperationalBalance();
  const bankBalance = getBankBalance();
  const buildingBalance = getBuildingBalance();

  // Active Cash Period Details & Transactions
  const activePeriod = useMemo(() => {
    return getPeriodDetails(periodKey, customStartDate, customEndDate);
  }, [periodKey, customStartDate, customEndDate]);

  // Current active year-month in YYYY-MM
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Extract all distinct year-months from transactions + full current year
  const distinctTransactionPeriods = useMemo(() => {
    const set = new Set<string>();
    // Always include full 12 months for 2026 so every month is selectable in dropdown
    for (let m = 12; m >= 1; m--) {
      set.add(`2026-${String(m).padStart(2, '0')}`);
    }
    // Also include months from transactions (e.g. past or future years)
    transactions.forEach((t) => {
      if (t && t.date && t.date.length >= 7) {
        const ym = t.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          set.add(ym);
        }
      }
    });
    // Ensure active periodKey is in the list if it's a calendar month
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

  // Financial stats for the active period (consolidated across yayasan + operational breakdown)
  const periodStats = useMemo(() => {
    // Consolidated all cash inflow and outflow in this period (matches Dashboard & Reports)
    const totalIn = periodTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalOut = periodTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const net = totalIn - totalOut;

    // Specific to Kas Operasional
    const opTrx = periodTransactions.filter((t) => t.account === 'KAS_OPERASIONAL');
    const opIn = opTrx
      .filter((t) => t.type === 'CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const opOut = opTrx
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Specific to Kas Pembangunan
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
      const period = item.period || (periodType === 'ANNUAL' ? '2026' : '2026-10');
      const periodName = item.periodName || (periodType === 'ANNUAL' ? `Tahun Anggaran ${period}` : 'Oktober 2026');
      const status: BudgetStatus = item.status || 'ACTIVE';

      // Find relevant transactions for THIS pos and THIS period
      const relevantTransactions = transactions.filter((t) => {
        if (t.type !== 'DEBIT') return false;
        const tCatLower = (t.category || '').toLowerCase().trim();
        const matchesCategory =
          tCatLower === bCatLower ||
          tCatLower.includes(bCatLower) ||
          bCatLower.includes(tCatLower);
        if (!matchesCategory) return false;

        // Strict period matching
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
    // Ensure default periods exist
    if (!set.has('2026-10')) set.set('2026-10', 'Oktober 2026');
    if (!set.has('2026')) set.set('2026', 'Tahun Anggaran 2026');
    return Array.from(set.entries()).map(([value, label]) => ({ value, label }));
  }, [budgetList]);

  // Filtered Budget List according to selected Period & Status
  const filteredBudgetList = useMemo(() => {
    return budgetList.filter((b) => {
      // 1. Period filter (default is CURRENT: periode berjalan)
      if (budgetFilterPeriod === 'CURRENT') {
        const isCurrentMonth = b.periodType === 'MONTHLY' && b.period === '2026-10';
        const isCurrentYear = b.periodType === 'ANNUAL' && b.period === '2026';
        if (!isCurrentMonth && !isCurrentYear) return false;
      } else if (budgetFilterPeriod !== 'ALL') {
        if (b.period !== budgetFilterPeriod) return false;
      }

      // 2. Status filter
      if (budgetFilterStatus !== 'ALL') {
        if (b.status !== budgetFilterStatus) return false;
      }

      // 3. Search query
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

  // Reset pagination when filter changes
  useEffect(() => {
    setBudgetCurrentPage(1);
  }, [budgetFilterPeriod, budgetFilterStatus, budgetSearch, setBudgetCurrentPage]);

  // Distinct category list for dropdown (includes all dynamic budget categories)
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
    const trxMonth = dateStr.slice(0, 7); // 'YYYY-MM'
    const trxYear = dateStr.slice(0, 4); // 'YYYY'

    // 1. Prioritize matching category with current monthly period
    let match = budgetList.find((b) => {
      const bCatLower = (b.category || '').toLowerCase().trim();
      const isMatch = bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
      return isMatch && b.periodType === 'MONTHLY' && b.period === trxMonth;
    });

    // 2. Try annual budget matching
    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        const isMatch = bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
        return isMatch && b.periodType === 'ANNUAL' && b.period === trxYear;
      });
    }

    // 3. Fallback to active budget with matching category
    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        return (bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower)) && b.status === 'ACTIVE';
      });
    }

    // 4. Fallback to any budget with matching category
    if (!match) {
      match = budgetList.find((b) => {
        const bCatLower = (b.category || '').toLowerCase().trim();
        return bCatLower === catLower || bCatLower.includes(catLower) || catLower.includes(bCatLower);
      });
    }

    return match || null;
  };

  const activeLinkedBudgetForAdd = useMemo(() => {
    return getLinkedBudget(formData.category, formData.date);
  }, [formData.category, formData.date, budgetList]);

  const activeLinkedBudgetForEdit = useMemo(() => {
    if (!editingTrx) return null;
    return getLinkedBudget(editingTrx.category, editingTrx.date);
  }, [editingTrx?.category, editingTrx?.date, budgetList]);

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h2>Kas & Keuangan Yayasan GMH</h2>
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

      {/* ========================================================================= */}
      {/* INTEGRATED CASH PERIOD CONTROLLER BAR                                     */}
      {/* ========================================================================= */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          marginBottom: 16,
          background: '#ffffff',
          border: '1px solid var(--gmh-border)',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Left: Label & Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={18} color="var(--gmh-text-muted)" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gmh-text)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                PERIODE KAS:
              </span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ width: 30, height: 32, padding: 0, borderRadius: 6 }}
                onClick={handlePrevMonth}
                title="Mundur 1 Periode"
              >
                <ChevronLeft size={15} />
              </button>

              <select
                className="form-select"
                style={{
                  width: 'auto',
                  minWidth: 260,
                  height: 32,
                  padding: '4px 28px 4px 10px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  color: 'var(--gmh-text)',
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                }}
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
              >
                <optgroup label="Bulan Kalender">
                  {distinctTransactionPeriods.map((ym) => {
                    const [yr, mo] = ym.split('-');
                    const moName = MONTH_NAMES_MAP[mo] || mo;
                    const isCurrent = ym === currentMonthKey;
                    return (
                      <option key={ym} value={ym}>
                        {moName} {yr} {isCurrent ? '(Bulan Berjalan)' : ''}
                      </option>
                    );
                  })}
                </optgroup>

                <optgroup label="Siklus Cut-Off Kas (Tgl 16 - 15)">
                  {periodKey.startsWith('CYCLE:') &&
                    !['CYCLE:2026-10', 'CYCLE:2026-09', 'CYCLE:2026-08', 'CYCLE:2026-07', 'CYCLE:2026-06'].includes(periodKey) && (
                      <option value={periodKey}>🔄 {activePeriod.label}</option>
                    )}
                  <option value="CYCLE:2026-10">🔄 Siklus 16 Okt – 15 Nov 2026</option>
                  <option value="CYCLE:2026-09">🔄 Siklus 16 Sep – 15 Okt 2026</option>
                  <option value="CYCLE:2026-08">🔄 Siklus 16 Agu – 15 Sep 2026</option>
                  <option value="CYCLE:2026-07">🔄 Siklus 16 Jul – 15 Agu 2026</option>
                  <option value="CYCLE:2026-06">🔄 Siklus 16 Jun – 15 Jul 2026</option>
                </optgroup>

                <optgroup label="Tahun Anggaran">
                  <option value="YEAR:2026">📆 Tahun Anggaran 2026 (Tahunan)</option>
                  <option value="YEAR:2025">📆 Tahun Anggaran 2025</option>
                </optgroup>

                <optgroup label="Lainnya">
                  <option value="ALL">🌐 Semua Periode (Akumulasi Seluruh Mutasi)</option>
                  <option value="CUSTOM">🎯 Rentang Tanggal Manual...</option>
                </optgroup>
              </select>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ width: 30, height: 32, padding: 0, borderRadius: 6 }}
                onClick={handleNextMonth}
                title="Maju 1 Periode"
              >
                <ChevronRight size={15} />
              </button>

              {periodKey !== currentMonthKey && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', fontWeight: 600, padding: '4px 8px' }}
                  onClick={() => setPeriodKey(currentMonthKey)}
                  title={`Kembali ke bulan berjalan (${MONTH_NAMES_MAP[currentMonthKey.split('-')[1]] || 'Oktober'} ${currentMonthKey.split('-')[0]})`}
                >
                  ↺ Bulan Berjalan
                </button>
              )}
            </div>
          </div>

          {/* Right: Active Date Range Pill & Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid var(--gmh-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Calendar size={13} />
              Rentang: {activePeriod.dateRangeText}
            </span>

            <span style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
              {periodTransactions.length} Mutasi Tercatat
            </span>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM selected */}
        {periodKey === 'CUSTOM' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px dashed var(--gmh-border)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Filter Rentang Tanggal Manual:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Dari:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '4px 8px', fontSize: 12, height: 30 }}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Sampai:</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', padding: '4px 8px', fontSize: 12, height: 30 }}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: '#dc2626', padding: '2px 6px' }}
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Reset Tanggal
              </button>
            )}
          </div>
        )}
      </div>

      {/* TOP BALANCES GRID */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {/* Kas Operasional */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-green)',
              '--stat-color-pale': 'var(--gmh-green-pale)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">SALDO KAS OPERASIONAL (KANTOR)</div>
            <Wallet size={18} color="var(--gmh-text-muted)" />
          </div>
          <div
            className="stat-card-value"
            style={{
              fontSize: 22,
              color: 'var(--gmh-text)',
            }}
          >
            {formatRupiah(opBalance)}
          </div>
          <div className="stat-card-meta">
            Pemasukan Kas Periode Ini:{' '}
            <strong>
              {formatRupiah(periodStats.totalIn)}
            </strong>
            {periodStats.bldIn > 0 && (
              <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginLeft: 4 }}>
                ({formatRupiah(periodStats.bldIn)} Pembangunan)
              </span>
            )}
          </div>
        </div>

        {/* Belanja Kantor */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-text-muted)',
              '--stat-color-pale': 'var(--gmh-surface-2)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">TOTAL BELANJA ({activePeriod.shortLabel.toUpperCase()})</div>
            <div className="stat-card-icon">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {formatRupiah(periodStats.totalOut)}
          </div>
          <div className="stat-card-meta">
            Arus Kas Bersih:{' '}
            <strong>
              {periodStats.net >= 0 ? '+' : ''}{formatRupiah(periodStats.net)}
            </strong>
          </div>
        </div>

        {/* Kas Pembangunan & Bank */}
        <div
          className="stat-card"
          style={
            {
              '--stat-color': 'var(--gmh-text-muted)',
              '--stat-color-pale': 'var(--gmh-surface-2)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="stat-card-label">KAS PEMBANGUNAN & BANK</div>
            <Landmark size={18} color="var(--gmh-text-muted)" />
          </div>
          <div className="stat-card-value" style={{ fontSize: 22, color: 'var(--gmh-text)' }}>
            {formatRupiah(buildingBalance + bankBalance)}
          </div>
          <div className="stat-card-meta">
            Khusus Pembangunan: <strong>{formatRupiah(buildingBalance)}</strong>
            {periodStats.bldIn > 0 && (
              <span style={{ marginLeft: 6, fontWeight: 600 }}>
                (+{formatRupiah(periodStats.bldIn)} periode ini)
              </span>
            )}
          </div>
        </div>
      </div>

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
          Kategori & Anggaran
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

      {/* ========================================================================= */}
      {/* TAB 1: BUKU JURNAL KAS (TARGET IMAGE 2) */}
      {/* ========================================================================= */}
      {activeTab === 'JURNAL' && (
        <>
          {/* SEARCH & FILTER BAR */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 280 }}>
                <Search className="search-box-icon" />
                <input
                  className="form-input"
                  id="search-transactions"
                  placeholder="Cari deskripsi transaksi, nomor referensi, atau pihak relasi…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 160 }}
                id="filter-flow"
                value={filterFlow}
                onChange={(e) => setFilterFlow(e.target.value)}
              >
                <option value="">Semua Aliran Kas</option>
                <option value="CREDIT">Pemasukan Kas (+)</option>
                <option value="DEBIT">Pengeluaran Kas (-)</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 180 }}
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVE PERIOD INFO & FILTER BADGES */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gmh-border)',
              marginBottom: 14,
              fontSize: 12.5,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Calendar size={15} color="var(--gmh-green-mid)" />
              <span>
                Jurnal Mutasi Kas Periode: <strong>{activePeriod.label}</strong>{' '}
                <span style={{ color: '#64748b' }}>({activePeriod.dateRangeText})</span>
              </span>
              {filterFlow && (
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                  Aliran: {filterFlow === 'CREDIT' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
                </span>
              )}
              {filterCategory && (
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                  Kategori: {filterCategory}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--gmh-text-muted)', fontSize: 12 }}>
              Menampilkan {displayed.length} dari {periodTransactions.length} Mutasi Periode Ini
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 140 }}>KODE REF / TANGGAL</th>
                    <th style={{ minWidth: 140 }}>KATEGORI AKUN</th>
                    <th style={{ minWidth: 260 }}>DESKRIPSI MUTASI</th>
                    <th style={{ minWidth: 140 }}>SUMBER / PIHAK RELASI</th>
                    <th style={{ minWidth: 130, textAlign: 'right' }}>NOMINAL</th>
                    <th style={{ minWidth: 90, textAlign: 'center' }}>STATUS</th>
                    <th style={{ minWidth: 110, textAlign: 'center' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gmh-text-muted)' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div>Tidak ada transaksi mutasi kas yang sesuai dengan kriteria pencarian.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t) => {
                      const isCredit = t.type === 'CREDIT';
                      return (
                        <tr key={t.id}>
                          {/* 1. KODE REF / TANGGAL */}
                          <td>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                color: 'var(--gmh-text)',
                              }}
                            >
                              {t.code}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                              {t.date}
                            </div>
                          </td>

                          {/* 2. KATEGORI AKUN */}
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--gmh-text)' }}>
                              {t.category}
                            </div>
                            <div style={{ marginTop: 3 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                {t.account === 'KAS_PEMBANGUNAN'
                                  ? 'Kas Pembangunan'
                                  : t.account === 'KAS_BANK'
                                  ? 'Kas Bank'
                                  : 'Kas Operasional'}
                              </span>
                            </div>
                          </td>

                          {/* 3. DESKRIPSI MUTASI */}
                          <td>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: '#1f2937',
                                lineHeight: 1.45,
                                maxWidth: 420,
                              }}
                            >
                              {t.desc}
                            </div>
                            {t.notes && t.notes !== t.desc && (
                              <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
                                Catatan: {t.notes}
                              </div>
                            )}
                          </td>

                          {/* 4. SUMBER / PIHAK RELASI */}
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--gmh-text)' }}>
                              {t.party || 'Pihak Relasi'}
                            </div>
                          </td>

                          {/* 5. NOMINAL */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: 'var(--gmh-text)',
                              }}
                            >
                              {isCredit ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                            </span>
                          </td>

                          {/* 6. STATUS */}
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className="badge"
                              style={{
                                background: t.status === 'Approved' ? '#ecfdf5' : '#fffbeb',
                                color: t.status === 'Approved' ? '#166534' : '#92400e',
                                border: `1px solid ${t.status === 'Approved' ? '#bbf7d0' : '#fde68a'}`,
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontWeight: 600,
                              }}
                            >
                              {t.status || 'Approved'}
                            </span>
                          </td>

                          {/* 7. AKSI */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: '3px 8px', fontSize: 11.5, height: 'auto' }}
                                onClick={() => setEditingTrx({ ...t })}
                                title="Edit transaksi"
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: 11.5,
                                  height: 'auto',
                                }}
                                onClick={() => handleDeleteTransaction(t)}
                                title="Hapus transaksi"
                              >
                                Hapus
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

            {/* Pagination Component */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={displayed.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemName="transaksi"
            />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UNGGAH JURNAL CSV */}
      {/* ========================================================================= */}
      {activeTab === 'UPLOAD_CSV' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Unggah Jurnal Kas Secara Massal (CSV Import)
              </h3>
              <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13 }}>
                Impor banyak mutasi kas sekaligus menggunakan spreadsheet CSV. Sangat cocok untuk migrasi pembukuan kas bank & belanja kantor.
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleDownloadSampleTemplate}>
              <Download size={14} /> Unduh Format Template CSV
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            style={{
              border: '2px dashed var(--gmh-border-dark)',
              borderRadius: 'var(--radius-md)',
              padding: '32px 20px',
              textAlign: 'center',
              background: '#f9fafb',
              marginBottom: 20,
            }}
          >
            <Upload size={36} color="var(--gmh-green)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Pilih file CSV jurnal mutasi kas yayasan
            </div>
            <div style={{ color: 'var(--gmh-text-muted)', fontSize: 12, marginBottom: 14 }}>
              Kolom wajib: tanggal, kategori, deskripsi, pihak_relasi, aliran_kas (Pemasukan/Pengeluaran), nominal
            </div>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
              <input type="file" accept=".csv" onChange={handleCsvFileUpload} style={{ display: 'none' }} />
              Pilih Berkas CSV
            </label>
            {csvFileName && (
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--gmh-green-dark)' }}>
                Berkas Terpilih: {csvFileName}
              </div>
            )}
          </div>

          {/* Preview Parsed Data */}
          {csvPreviewData.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>
                  Pratinjau Data Impor ({csvPreviewData.length} Baris Mutasi Siap Disimpan)
                </h4>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCommitCsvImport}
                  disabled={isImporting}
                  style={{ fontWeight: 600 }}
                >
                  <Check size={14} /> {isImporting ? 'Menyimpan ke Jurnal…' : 'Simpan Semua ke Buku Jurnal Kas'}
                </button>
              </div>

              <div className="table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="table table-compact" style={{ fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Kategori</th>
                      <th>Deskripsi</th>
                      <th>Pihak Relasi</th>
                      <th>Aliran Kas</th>
                      <th style={{ textAlign: 'right' }}>Nominal</th>
                      <th>Rekening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.date}</td>
                        <td>{row.category}</td>
                        <td>{row.desc}</td>
                        <td>{row.party}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: row.type === 'CREDIT' ? '#ecfdf5' : '#fef2f2',
                              color: row.type === 'CREDIT' ? '#065f46' : '#991b1b',
                            }}
                          >
                            {row.type === 'CREDIT' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(row.amount)}</td>
                        <td>{row.account}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 3: KATEGORI & ANGGARAN (DYNAMIC CRUD, PERIOD FILTERING, TOP-UP, CLOSE & PAGINATION) */}
      {/* ========================================================================= */}
      {activeTab === 'ANGGARAN' && (
        <div>
          {/* Header & Add Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
                Kategori Beban & Plafon Anggaran Operasional
              </h3>
              <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, margin: 0 }}>
                Setiap pos anggaran berelasi dengan periode (bulanan/tahunan). Realisasi belanja otomatis terakumulasi dari mutasi Buku Jurnal Kas pada periode terkait.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              id="btn-add-budget"
              onClick={() => setShowAddBudget(true)}
              style={{ fontWeight: 600 }}
            >
              <Plus size={14} /> + Tambah Pos Anggaran
            </button>
          </div>

          {/* Over-Budget / Full Alert Banner */}
          {overBudgetCount > 0 && (
            <div
              className="alert"
              style={{
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                color: '#92400e',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
              }}
            >
              <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, lineHeight: 1.5 }}>
                <strong>Pagu Anggaran Penuh / Habis:</strong> Terdapat <strong>{overBudgetCount} pos anggaran</strong> yang telah mencapai atau melampaui 100% pagu pada periode yang sedang ditampilkan.
                Jika masa periode belum selesai, klik tombol <strong>+ Top-Up</strong> untuk menambahkan nominal pagu. Jika periode/kegiatan telah selesai, silakan pilih <strong>Tutup Pagu</strong> untuk membekukan alokasi.
              </div>
            </div>
          )}

          {/* Filter Toolbar: Periode Berjalan (Default), Status & Pencarian */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              marginBottom: 18,
              background: '#fafafa',
              border: '1px solid var(--gmh-border)',
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter Periode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={15} color="var(--gmh-green)" />
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text-muted)', textTransform: 'uppercase' }}>
                    Periode:
                  </label>
                  <select
                    className="form-input"
                    style={{ width: 'auto', minWidth: 240, fontSize: 12.5, padding: '5px 10px', height: 34 }}
                    value={budgetFilterPeriod}
                    onChange={(e) => setBudgetFilterPeriod(e.target.value)}
                  >
                    <option value="CURRENT">⭐ Periode Berjalan (Okt & Thn 2026)</option>
                    <option value="2026-10">📅 Bulan Berjalan (Oktober 2026)</option>
                    <option value="2026-11">📅 Bulan Depan (November 2026)</option>
                    <option value="2026-09">📅 Bulan Lalu (September 2026)</option>
                    <option value="2026">📆 Tahun Anggaran 2026 (Tahunan)</option>
                    <option value="ALL">🌐 Semua Periode</option>
                    {availableBudgetPeriods
                      .filter((p) => !['2026-10', '2026-11', '2026-09', '2026'].includes(p.value))
                      .map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Filter size={15} color="var(--gmh-text-muted)" />
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--gmh-text-muted)', textTransform: 'uppercase' }}>
                    Status:
                  </label>
                  <select
                    className="form-input"
                    style={{ width: 'auto', minWidth: 150, fontSize: 12.5, padding: '5px 10px', height: 34 }}
                    value={budgetFilterStatus}
                    onChange={(e) => setBudgetFilterStatus(e.target.value)}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">🟢 Aktif (Berjalan)</option>
                    <option value="CLOSED">🔒 Ditutup / Selesai</option>
                  </select>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', minWidth: 220 }}>
                  <Search
                    size={14}
                    color="var(--gmh-text-muted)"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cari pos anggaran…"
                    value={budgetSearch}
                    onChange={(e) => setBudgetSearch(e.target.value)}
                    style={{ paddingLeft: 30, fontSize: 12.5, height: 34 }}
                  />
                </div>
              </div>

              {/* Reset Filter Button if not default */}
              {(budgetFilterPeriod !== 'CURRENT' || budgetFilterStatus !== 'ALL' || budgetSearch) && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setBudgetFilterPeriod('CURRENT');
                    setBudgetFilterStatus('ALL');
                    setBudgetSearch('');
                  }}
                  style={{ fontSize: 11.5, padding: '4px 10px', height: 32 }}
                  title="Kembalikan ke tampilan default periode berjalan"
                >
                  Tampilkan Periode Berjalan
                </button>
              )}
            </div>
          </div>

          {/* Budget Summary Cards (Recalculated according to active filter) */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-card-label">TOTAL PAGU ANGGARAN OPERASIONAL</div>
              <div className="stat-card-value" style={{ fontSize: 20, color: 'var(--gmh-text)' }}>
                {formatRupiah(totalBudget)}
              </div>
              <div className="stat-card-meta">
                {filteredBudgetList.length} Pos Anggaran (
                {budgetFilterPeriod === 'CURRENT'
                  ? 'Periode Berjalan'
                  : budgetFilterPeriod === 'ALL'
                  ? 'Semua Periode'
                  : availableBudgetPeriods.find((p) => p.value === budgetFilterPeriod)?.label || budgetFilterPeriod}
                )
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">TOTAL REALISASI BELANJA</div>
              <div className="stat-card-value" style={{ fontSize: 20, color: '#b91c1c' }}>
                {formatRupiah(totalSpent)}
              </div>
              <div className="stat-card-meta">
                Terpakai:{' '}
                <strong>{totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">SISA SALDO PAGU ANGGARAN</div>
              <div
                className="stat-card-value"
                style={{
                  fontSize: 20,
                  color: totalBudget - totalSpent >= 0 ? 'var(--gmh-green)' : '#b91c1c',
                }}
              >
                {formatRupiah(totalBudget - totalSpent)}
              </div>
              <div className="stat-card-meta">Dapat Dialokasikan ke Program</div>
            </div>
          </div>

          {/* Budget Table with Pagination */}
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>KATEGORI BEBAN OPERASIONAL</th>
                    <th style={{ minWidth: 160 }}>PERIODE ANGGARAN</th>
                    <th style={{ textAlign: 'right' }}>PAGU ANGGARAN</th>
                    <th style={{ textAlign: 'right' }}>REALISASI BELANJA</th>
                    <th style={{ textAlign: 'right' }}>SISA ANGGARAN</th>
                    <th style={{ minWidth: 150 }}>PENYERAPAN</th>
                    <th style={{ textAlign: 'center' }}>STATUS</th>
                    <th style={{ textAlign: 'center', width: 260, minWidth: 260 }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBudgetList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--gmh-text-muted)' }}>
                        <AlertCircle size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div>Tidak ada pos pagu anggaran yang sesuai kriteria filter.</div>
                        <div style={{ fontSize: 11.5, marginTop: 4 }}>
                          Silakan klik <strong>+ Tambah Pos Anggaran</strong> atau ganti pilihan filter periode.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBudgetList.map((b) => {
                      const percent = b.budget > 0 ? Math.min(100, (b.spent / b.budget) * 100) : 0;
                      const rawPercent = b.budget > 0 ? ((b.spent / b.budget) * 100).toFixed(0) : '0';
                      const remaining = b.budget - b.spent;
                      const isOver = b.spent >= b.budget;
                      const isClosed = b.status === 'CLOSED';
                      const isCurrentPeriod =
                        (b.periodType === 'MONTHLY' && b.period === '2026-10') ||
                        (b.periodType === 'ANNUAL' && b.period === '2026');

                      return (
                        <tr
                          key={b.id || b.category}
                          style={{
                            background: isClosed ? '#f9fafb' : isOver ? '#fff5f5' : undefined,
                            opacity: isClosed ? 0.75 : 1,
                          }}
                        >
                          {/* 1. Kategori & Notes */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{b.category}</span>
                              {isClosed && (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    background: '#f3f4f6',
                                    color: '#6b7280',
                                    border: '1px solid #d1d5db',
                                  }}
                                >
                                  <Lock size={10} style={{ display: 'inline', marginRight: 2 }} /> Ditutup
                                </span>
                              )}
                            </div>
                            {b.notes && (
                              <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 2, maxWidth: 300 }}>
                                {b.notes}
                              </div>
                            )}
                          </td>

                          {/* 2. Periode Anggaran */}
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: b.periodType === 'ANNUAL' ? '#f5f3ff' : '#eff6ff',
                                color: b.periodType === 'ANNUAL' ? '#6d28d9' : '#1d4ed8',
                                border: `1px solid ${b.periodType === 'ANNUAL' ? '#ddd6fe' : '#bfdbfe'}`,
                                fontSize: 11,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontWeight: 600,
                              }}
                            >
                              <Calendar size={12} />
                              {b.periodName} ({b.periodType === 'ANNUAL' ? 'Tahunan' : 'Bulanan'})
                            </span>
                            {isCurrentPeriod && (
                              <div style={{ fontSize: 10.5, color: 'var(--gmh-green-dark)', marginTop: 3, fontWeight: 600 }}>
                                ● Periode Berjalan
                              </div>
                            )}
                          </td>

                          {/* 3. Pagu Anggaran */}
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(b.budget)}</td>

                          {/* 4. Realisasi Belanja */}
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                            <div>{formatRupiah(b.spent)}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', marginTop: 1 }}>
                              {b.trxCount} mutasi tercatat
                            </div>
                          </td>

                          {/* 5. Sisa Anggaran */}
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              color: remaining >= 0 ? '#059669' : '#b91c1c',
                            }}
                          >
                            {formatRupiah(remaining)}
                          </td>

                          {/* 6. Penyerapan */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  flex: 1,
                                  height: 8,
                                  background: '#e5e7eb',
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${percent}%`,
                                    height: '100%',
                                    background: isClosed
                                      ? '#9ca3af'
                                      : isOver
                                      ? '#ef4444'
                                      : percent > 80
                                      ? '#f59e0b'
                                      : 'var(--gmh-green)',
                                    borderRadius: 4,
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 600, minWidth: 40 }}>
                                {rawPercent}%
                              </span>
                            </div>
                          </td>

                          {/* 7. Status */}
                          <td style={{ textAlign: 'center' }}>
                            {isClosed ? (
                              <span
                                className="badge"
                                style={{
                                  background: '#f3f4f6',
                                  color: '#4b5563',
                                  border: '1px solid #d1d5db',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                Ditutup
                              </span>
                            ) : isOver ? (
                              <span
                                className="badge"
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  border: '1px solid #fecaca',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                Penuh (100%+)
                              </span>
                            ) : percent > 80 ? (
                              <span
                                className="badge"
                                style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fde68a',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                Waspada
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  background: '#ecfdf5',
                                  color: '#065f46',
                                  border: '1px solid #a7f3d0',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                Aman
                              </span>
                            )}
                          </td>

                          {/* 8. Aksi */}
                          <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                flexWrap: 'nowrap',
                              }}
                            >
                              {/* Tombol Top-Up (Tambahkan Nominal) */}
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: 11.5,
                                  height: 28,
                                  color: '#065f46',
                                  borderColor: '#a7f3d0',
                                  background: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setTopUpTarget(b);
                                  setTopUpAmount(0);
                                  setTopUpReason('');
                                }}
                                title="Top-Up: Tambahkan nominal pagu anggaran jika alokasi kurang"
                              >
                                <PlusCircle size={13} />
                                <span>Top-Up</span>
                              </button>

                              {/* Tombol Ubah Pagu */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: 11.5,
                                  height: 28,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6,
                                  color: '#334155',
                                  borderColor: '#cbd5e1',
                                  background: '#ffffff',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  let m = '10';
                                  let y = '2026';
                                  if (b.periodType === 'MONTHLY' && b.period.includes('-')) {
                                    const parts = b.period.split('-');
                                    y = parts[0];
                                    m = parts[1];
                                  } else if (b.periodType === 'ANNUAL') {
                                    y = b.period;
                                  }
                                  setEditingBudget({
                                    id: b.id,
                                    category: b.category,
                                    budget: b.budget,
                                    periodType: b.periodType,
                                    month: m,
                                    year: y,
                                    status: b.status,
                                    notes: b.notes || '',
                                  });
                                }}
                                title="Ubah detail pos anggaran"
                              >
                                <Edit size={12} />
                                <span>Ubah</span>
                              </button>

                              {/* Tombol Tutup / Buka Pagu */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                style={{
                                  padding: '4px 9px',
                                  fontSize: 11.5,
                                  height: 28,
                                  color: isClosed ? '#059669' : '#b45309',
                                  borderColor: isClosed ? '#a7f3d0' : '#fde68a',
                                  background: isClosed ? '#f0fdf4' : '#fffbeb',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleToggleCloseBudget(b)}
                                title={isClosed ? 'Buka kembali pos anggaran ini' : 'Tutup pagu anggaran ini (bekukan pengeluaran)'}
                              >
                                {isClosed ? (
                                  <>
                                    <Unlock size={12} />
                                    <span>Buka</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock size={12} />
                                    <span>Tutup</span>
                                  </>
                                )}
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 11.5,
                                  height: 28,
                                  color: '#dc2626',
                                  borderColor: '#fca5a5',
                                  background: '#ffffff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleDeleteBudgetCategory(b)}
                                title="Hapus kategori anggaran"
                              >
                                <Trash2 size={13} />
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

            {/* Pagination Component for Budget Table */}
            <Pagination
              currentPage={budgetCurrentPage}
              totalPages={totalBudgetPages}
              totalItems={filteredBudgetList.length}
              pageSize={budgetPageSize}
              pageSizeOptions={[5, 8, 15, 25]}
              onPageChange={setBudgetCurrentPage}
              onPageSizeChange={setBudgetPageSize}
              itemName="pos anggaran"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOG MUTASI KAS (REAL SYSTEM AUDIT TRAIL FROM POSTGRESQL) */}
      {/* ========================================================================= */}
      {activeTab === 'LOG_MUTASI' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
                Log Mutasi Kas & Audit Trail Sistem
              </h3>
              <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, margin: 0 }}>
                Audit trail resmi sistem mencatat setiap aktivitas pencatatan transaksi, pembaruan data, penghapusan, dan import massal oleh petugas secara transparan dan akuntabel.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              id="btn-refresh-audit"
              onClick={fetchAuditLogs}
              disabled={isLoadingLogs}
              title="Muat ulang log mutasi sistem"
            >
              <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} />
              {isLoadingLogs ? 'Memuat Log…' : 'Segarkan Log Sistem'}
            </button>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 150 }}>WAKTU & TANGGAL</th>
                    <th style={{ minWidth: 120 }}>JENIS AKTIVITAS</th>
                    <th style={{ minWidth: 140 }}>NOMOR REF</th>
                    <th style={{ minWidth: 150 }}>PIHAK RELASI</th>
                    <th style={{ minWidth: 140 }}>PETUGAS / OPERATOR</th>
                    <th>KETERANGAN AKTIVITAS</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--gmh-text-muted)' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                        <div>Belum ada log mutasi kas yang tercatat di database sistem.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditLogs.map((log) => {
                      const actUpper = (log.action || '').toUpperCase();
                      const isCreate = actUpper.includes('PENCATATAN') || actUpper === 'CREATE' || actUpper.includes('INSERT');
                      const isUpdate = actUpper === 'UPDATE';
                      const isDelete = actUpper.includes('HAPUS') || actUpper === 'DELETE';
                      const isImport = actUpper.includes('IMPORT') || actUpper.includes('BATCH');

                      const badgeBg = isCreate ? '#ecfdf5' : isUpdate ? '#eff6ff' : isDelete ? '#fef2f2' : isImport ? '#f5f3ff' : '#f3f4f6';
                      const badgeColor = isCreate ? '#065f46' : isUpdate ? '#1e40af' : isDelete ? '#991b1b' : isImport ? '#5b21b6' : '#374151';

                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--gmh-text-muted)' }}>
                            {log.timestamp}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: badgeBg,
                                color: badgeColor,
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <code style={{ fontSize: 11.5, background: 'var(--gmh-surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                              {log.refCode}
                            </code>
                          </td>
                          <td style={{ fontWeight: 500, fontSize: 12.5 }}>{log.party}</td>
                          <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{log.operator}</td>
                          <td style={{ fontSize: 12.5 }}>{log.details}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Audit Logs */}
            {auditLogs.length > 0 && (
              <Pagination
                currentPage={logCurrentPage}
                totalPages={totalLogPages}
                totalItems={auditLogs.length}
                pageSize={logPageSize}
                pageSizeOptions={[10, 25, 50]}
                onPageChange={setLogCurrentPage}
                onPageSizeChange={setLogPageSize}
                itemName="log mutasi"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH ENTRI KAS BARU (+ Entri Kas Baru) */}
      {/* ========================================================================= */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Entri Mutasi Kas Yayasan Baru</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Jenis Aliran Kas</label>
                      <select
                        className="form-select"
                        id="trx-type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                      >
                        <option value="DEBIT">Pengeluaran Kas (-)</option>
                        <option value="CREDIT">Pemasukan Kas (+)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Rekening Kas / Sumber Dana</label>
                      <select
                        className="form-select"
                        id="trx-account"
                        value={formData.account}
                        onChange={(e) => setFormData({ ...formData, account: e.target.value as AccountType })}
                      >
                        <option value="KAS_OPERASIONAL">Kas Tunai Kantor Yayasan (Petty Cash)</option>
                        <option value="KAS_BANK">Kas Rekening Bank Operasional</option>
                        <option value="KAS_PEMBANGUNAN">Kas Khusus Pembangunan Rumah Persekutuan</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Tanggal Transaksi</label>
                      <input
                        className="form-input"
                        id="trx-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Kategori Akun</label>
                      <select
                        className="form-select"
                        id="trx-category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* RELASI PAGU ANGGARAN VISUAL CARD */}
                  <div
                    style={{
                      background: formData.type === 'CREDIT' ? '#f0fdf4' : activeLinkedBudgetForAdd ? '#f8fafc' : '#f8fafc',
                      border:
                        formData.type === 'CREDIT'
                          ? '1px solid #bbf7d0'
                          : activeLinkedBudgetForAdd
                          ? '1px solid #cbd5e1'
                          : '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 13,
                    }}
                  >
                    {formData.type === 'CREDIT' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
                        <Info size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Pemasukan Kas (+):</strong> Transaksi ini menambah likuiditas kas yayasan dan tidak memotong alokasi pagu anggaran belanja operasional.
                        </div>
                      </div>
                    ) : activeLinkedBudgetForAdd ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#0f172a' }}>
                            <Target size={16} color="var(--gmh-green)" />
                            <span>Relasi Pagu: {activeLinkedBudgetForAdd.category}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {activeLinkedBudgetForAdd.periodName}
                            </span>
                            {activeLinkedBudgetForAdd.status === 'CLOSED' ? (
                              <span
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Lock size={10} /> Pagu Ditutup
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Check size={10} /> Pagu Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3 Metric Pills */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Alokasi Pagu</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                              {formatRupiah(activeLinkedBudgetForAdd.budget)}
                            </div>
                          </div>
                          <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sudah Terpakai</div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                              {formatRupiah(activeLinkedBudgetForAdd.spent)} (
                              {activeLinkedBudgetForAdd.budget > 0
                                ? Math.round((activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget) * 100)
                                : 0}
                              %)
                            </div>
                          </div>
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border:
                                activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent >= 0
                                  ? '1px solid #bbf7d0'
                                  : '1px solid #fecaca',
                            }}
                          >
                            <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sisa Pagu Tersedia</div>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color:
                                  activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent >= 0
                                    ? '#166534'
                                    : '#dc2626',
                              }}
                            >
                              {formatRupiah(activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent)}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div
                          style={{
                            height: 6,
                            background: '#e2e8f0',
                            borderRadius: 3,
                            overflow: 'hidden',
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(
                                100,
                                activeLinkedBudgetForAdd.budget > 0
                                  ? (activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget) * 100
                                  : 0
                              )}%`,
                              background:
                                activeLinkedBudgetForAdd.spent >= activeLinkedBudgetForAdd.budget
                                  ? '#ef4444'
                                  : activeLinkedBudgetForAdd.spent / activeLinkedBudgetForAdd.budget >= 0.8
                                  ? '#f59e0b'
                                  : 'var(--gmh-green)',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        {/* Dynamic Simulation / Warning Box */}
                        {(() => {
                          const remaining = activeLinkedBudgetForAdd.budget - activeLinkedBudgetForAdd.spent;
                          const trxAmount = Number(formData.amount) || 0;
                          const projectedRemaining = remaining - trxAmount;

                          if (activeLinkedBudgetForAdd.status === 'CLOSED') {
                            return (
                              <div
                                style={{
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  padding: '7px 10px',
                                  borderRadius: 6,
                                  color: '#92400e',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Lock size={13} style={{ flexShrink: 0 }} />
                                <span>
                                  <strong>Pagu Telah Ditutup:</strong> Pengeluaran pada pos ini telah dibekukan. Tetap dapat disimpan bila telah mendapat otorisasi bendahara.
                                </span>
                              </div>
                            );
                          }

                          if (trxAmount > 0 && projectedRemaining < 0) {
                            return (
                              <div
                                style={{
                                  background: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  padding: '7px 10px',
                                  borderRadius: 6,
                                  color: '#991b1b',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 6,
                                }}
                              >
                                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div>
                                  <strong>Peringatan Defisit Pagu:</strong> Transaksi senilai{' '}
                                  <strong>{formatRupiah(trxAmount)}</strong> ini melampaui sisa pagu sebesar{' '}
                                  <strong>{formatRupiah(Math.abs(projectedRemaining))}</strong>. Anda dapat melakukan Top-Up pagu di Tab Anggaran jika diperlukan.
                                </div>
                              </div>
                            );
                          }

                          if (trxAmount > 0) {
                            return (
                              <div
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  color: '#166534',
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <Check size={13} style={{ flexShrink: 0 }} />
                                <span>
                                  Estimasi sisa pagu setelah mutasi ini:{' '}
                                  <strong>{formatRupiah(projectedRemaining)}</strong> (Aman / dalam batas pagu).
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)' }}>
                              Pengeluaran ini akan otomatis tercatat mengurangi alokasi pagu{' '}
                              <strong>{activeLinkedBudgetForAdd.periodName}</strong>.
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>
                          Kategori <strong>"{formData.category}"</strong> belum didaftarkan memiliki plafon pagu pada periode ini. Transaksi tetap akan dicatat langsung ke Buku Jurnal Kas.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Sumber / Pihak Relasi</label>
                    <input
                      className="form-input"
                      id="trx-party"
                      placeholder="Contoh: Toko ATK Gramedia, PT Telkom Indonesia, 5 Orang Staff, dsb."
                      value={formData.party}
                      onChange={(e) => setFormData({ ...formData, party: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Deskripsi Mutasi Lengkap</label>
                    <textarea
                      className="form-input"
                      id="trx-desc"
                      rows={2}
                      placeholder="Uraian detail transaksi, keperluan belanja, atau sumber donasi"
                      value={formData.desc}
                      onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                      required
                    />
                  </div>

                  {/* NOMINAL INPUT WITH AUTO SEPARATOR */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Transaksi (Rp) — Format Otomatis</label>
                    <NominalInput
                      id="trx-amount"
                      value={formData.amount}
                      onChange={(val) => setFormData({ ...formData, amount: val })}
                      placeholder="Contoh: 1.250.000"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Status Verifikasi</label>
                      <select
                        className="form-select"
                        id="trx-status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="Approved">Approved (Terverifikasi)</option>
                        <option value="Pending Review">Pending Review</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nomor Nota / SPJ / Bukti Fisik</label>
                      <input
                        className="form-input"
                        id="trx-notes"
                        placeholder="Contoh: Nota No. 049/ATK/X/2026"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" id="btn-save-transaction" style={{ fontWeight: 600 }}>
                  Simpan ke Jurnal Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT TRANSAKSI */}
      {/* ========================================================================= */}
      {editingTrx && (
        <div className="modal-overlay" onClick={() => setEditingTrx(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Edit Transaksi Jurnal ({editingTrx.code})</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingTrx(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Jenis Aliran Kas</label>
                      <select
                        className="form-select"
                        value={editingTrx.type}
                        onChange={(e) => setEditingTrx({ ...editingTrx, type: e.target.value as TransactionType })}
                      >
                        <option value="DEBIT">Pengeluaran Kas (-)</option>
                        <option value="CREDIT">Pemasukan Kas (+)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Tanggal</label>
                      <input
                        className="form-input"
                        type="date"
                        value={editingTrx.date}
                        onChange={(e) => setEditingTrx({ ...editingTrx, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Kategori Akun</label>
                      <select
                        className="form-select"
                        value={editingTrx.category}
                        onChange={(e) => setEditingTrx({ ...editingTrx, category: e.target.value })}
                      >
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label form-required">Sumber / Pihak Relasi</label>
                      <input
                        className="form-input"
                        value={editingTrx.party || ''}
                        onChange={(e) => setEditingTrx({ ...editingTrx, party: e.target.value })}
                        placeholder="Contoh: Toko ATK, 5 Orang Staff"
                        required
                      />
                    </div>
                  </div>

                  {/* RELASI PAGU ANGGARAN VISUAL CARD (EDIT MODE) */}
                  <div
                    style={{
                      background: editingTrx.type === 'CREDIT' ? '#f0fdf4' : activeLinkedBudgetForEdit ? '#f8fafc' : '#f8fafc',
                      border:
                        editingTrx.type === 'CREDIT'
                          ? '1px solid #bbf7d0'
                          : activeLinkedBudgetForEdit
                          ? '1px solid #cbd5e1'
                          : '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      fontSize: 13,
                    }}
                  >
                    {editingTrx.type === 'CREDIT' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#166534' }}>
                        <Info size={18} style={{ flexShrink: 0 }} />
                        <div>
                          <strong>Pemasukan Kas (+):</strong> Transaksi ini menambah saldo kas yayasan dan tidak memotong pagu anggaran belanja.
                        </div>
                      </div>
                    ) : activeLinkedBudgetForEdit ? (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, color: '#0f172a' }}>
                            <Target size={16} color="var(--gmh-green)" />
                            <span>Relasi Pagu: {activeLinkedBudgetForEdit.category}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 10,
                              }}
                            >
                              {activeLinkedBudgetForEdit.periodName}
                            </span>
                            {activeLinkedBudgetForEdit.status === 'CLOSED' ? (
                              <span
                                style={{
                                  background: '#fee2e2',
                                  color: '#991b1b',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Lock size={10} /> Pagu Ditutup
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Check size={10} /> Pagu Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3 Metric Pills */}
                        {(() => {
                          const origTrx = transactions.find((t) => t.id === editingTrx.id);
                          const origDebit = origTrx && origTrx.type === 'DEBIT' ? Number(origTrx.amount) || 0 : 0;
                          const baseSpent = Math.max(0, activeLinkedBudgetForEdit.spent - origDebit);
                          const currentEditAmount = Number(editingTrx.amount) || 0;
                          const projectedSpent = baseSpent + currentEditAmount;
                          const projectedRemaining = activeLinkedBudgetForEdit.budget - projectedSpent;

                          return (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Alokasi Pagu</div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                    {formatRupiah(activeLinkedBudgetForEdit.budget)}
                                  </div>
                                </div>
                                <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Total Realisasi</div>
                                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                                    {formatRupiah(projectedSpent)} (
                                    {activeLinkedBudgetForEdit.budget > 0
                                      ? Math.round((projectedSpent / activeLinkedBudgetForEdit.budget) * 100)
                                      : 0}
                                    %)
                                  </div>
                                </div>
                                <div
                                  style={{
                                    background: '#ffffff',
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    border: projectedRemaining >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
                                  }}
                                >
                                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>Sisa Pagu</div>
                                  <div
                                    style={{
                                      fontSize: 12.5,
                                      fontWeight: 700,
                                      color: projectedRemaining >= 0 ? '#166534' : '#dc2626',
                                    }}
                                  >
                                    {formatRupiah(projectedRemaining)}
                                  </div>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div
                                style={{
                                  height: 6,
                                  background: '#e2e8f0',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${Math.min(
                                      100,
                                      activeLinkedBudgetForEdit.budget > 0
                                        ? (projectedSpent / activeLinkedBudgetForEdit.budget) * 100
                                        : 0
                                    )}%`,
                                    background:
                                      projectedSpent >= activeLinkedBudgetForEdit.budget
                                        ? '#ef4444'
                                        : projectedSpent / activeLinkedBudgetForEdit.budget >= 0.8
                                        ? '#f59e0b'
                                        : 'var(--gmh-green)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </div>

                              {projectedRemaining < 0 ? (
                                <div
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    padding: '7px 10px',
                                    borderRadius: 6,
                                    color: '#991b1b',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 6,
                                  }}
                                >
                                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                  <div>
                                    <strong>Peringatan Defisit:</strong> Perubahan nominal ini menyebabkan total belanja melampaui pagu sebesar{' '}
                                    <strong>{formatRupiah(Math.abs(projectedRemaining))}</strong>.
                                  </div>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    color: '#166534',
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <Check size={13} style={{ flexShrink: 0 }} />
                                  <span>
                                    Sisa alokasi pagu tersedia: <strong>{formatRupiah(projectedRemaining)}</strong>.
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                        <Info size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12 }}>
                          Kategori <strong>"{editingTrx.category}"</strong> belum didaftarkan memiliki plafon pagu pada periode ini.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Deskripsi Mutasi</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={editingTrx.desc}
                      onChange={(e) => setEditingTrx({ ...editingTrx, desc: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-required">Nominal Transaksi (Rp)</label>
                    <NominalInput
                      value={editingTrx.amount}
                      onChange={(val) => setEditingTrx({ ...editingTrx, amount: val })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editingTrx.status || 'Approved'}
                        onChange={(e) => setEditingTrx({ ...editingTrx, status: e.target.value as any })}
                      >
                        <option value="Approved">Approved</option>
                        <option value="Pending Review">Pending Review</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Catatan Tambahan</label>
                      <input
                        className="form-input"
                        value={editingTrx.notes || ''}
                        onChange={(e) => setEditingTrx({ ...editingTrx, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingTrx(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPORT / CETAK LAPORAN RESMI GMH PA KMK */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Laporan Mutasi Kas & Keuangan Yayasan GMH</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowExportModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                id="finance-operational-report-preview"
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--gmh-border-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    borderBottom: '2px solid var(--gmh-green)',
                    paddingBottom: 12,
                    marginBottom: 16,
                  }}
                >
                  <img
                    src="/logo-yayasan.png"
                    alt="Logo Yayasan GMH"
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--gmh-green-dark)' }}>
                      YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                    </div>
                    <div style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>
                      Laporan Pertanggungjawaban Mutasi Kas Operasional · Periode: {activePeriod.label} ({activePeriod.dateRangeText})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Saldo Kas Kantor</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gmh-green)' }}>
                      {formatRupiah(opBalance)}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Total Pemasukan Periode</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#059669' }}>
                      {formatRupiah(periodStats.totalIn)}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Total Belanja Periode</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#b91c1c' }}>
                      {formatRupiah(periodStats.totalOut)}
                    </div>
                  </div>
                </div>

                <div className="table-wrapper" style={{ border: '1px solid var(--gmh-border)', borderRadius: 4, overflowX: 'auto' }}>
                  <table className="table table-compact" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Tgl</th>
                        <th>Kode</th>
                        <th>Kategori</th>
                        <th>Pihak Relasi</th>
                        <th>Keterangan</th>
                        <th style={{ textAlign: 'right' }}>Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.slice(0, 7).map((t) => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td><code>{t.code}</code></td>
                          <td>{t.category}</td>
                          <td>{t.party || '-'}</td>
                          <td>{t.desc.slice(0, 38)}…</td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              color: t.type === 'CREDIT' ? '#059669' : '#b91c1c',
                            }}
                          >
                            {t.type === 'CREDIT' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px dashed #d1d5db', fontSize: 11.5 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div>Mengetahui,</div>
                    <div style={{ marginTop: 40, fontWeight: 700 }}>Pengurus Harian Yayasan</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div>Medan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ marginTop: 40, fontWeight: 700 }}>Bendahara Kas Operasional</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowExportModal(false)} disabled={isExportingFinancePDF}>
                Tutup
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={isExportingFinancePDF}
                onClick={async () => {
                  try {
                    setIsExportingFinancePDF(true);
                    const cleanPeriod = activePeriod.shortLabel.replace(/[^a-zA-Z0-9]/g, '_');
                    await exportHtmlToPdf('finance-operational-report-preview', {
                      filename: `LPJ_Kas_Operasional_${cleanPeriod}_2026.pdf`,
                    });
                    setShowExportModal(false);
                    showToast('Laporan PDF Kas Operasional berhasil diunduh.');
                  } catch (err: any) {
                    alert('Gagal mengunduh PDF: ' + (err.message || 'Terjadi kesalahan sistem'));
                  } finally {
                    setIsExportingFinancePDF(false);
                  }
                }}
              >
                {isExportingFinancePDF ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Menyiapkan PDF…
                  </>
                ) : (
                  <>
                    <FileDown size={14} /> Unduh File PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TAMBAH POS KATEGORI ANGGARAN BARU */}
      {/* ========================================================================= */}
      {showAddBudget && (
        <div className="modal-overlay" onClick={() => setShowAddBudget(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Tambah Pos Kategori Anggaran</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddBudget(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudgetCategory}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Nama Kategori */}
                  <div className="form-group">
                    <label className="form-label form-required">Nama Kategori Beban / Anggaran</label>
                    <input
                      className="form-input"
                      id="budget-category-name"
                      placeholder="Contoh: Operasional Kantor, Transport Misi, Logistik Acara, dsb."
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                      required
                    />
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Pos ini akan otomatis tersedia sebagai kategori beban pengeluaran di Buku Jurnal Kas.
                    </div>
                  </div>

                  {/* Tipe Periode Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Tipe Periode Pagu Anggaran</label>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          border: `1.5px solid ${budgetForm.periodType === 'MONTHLY' ? 'var(--gmh-green)' : 'var(--gmh-border)'}`,
                          borderRadius: 8,
                          background: budgetForm.periodType === 'MONTHLY' ? 'var(--gmh-green-pale)' : '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="periodType"
                          value="MONTHLY"
                          checked={budgetForm.periodType === 'MONTHLY'}
                          onChange={() => setBudgetForm({ ...budgetForm, periodType: 'MONTHLY' })}
                        />
                        📅 Periode Bulanan
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          border: `1.5px solid ${budgetForm.periodType === 'ANNUAL' ? 'var(--gmh-green)' : 'var(--gmh-border)'}`,
                          borderRadius: 8,
                          background: budgetForm.periodType === 'ANNUAL' ? 'var(--gmh-green-pale)' : '#fff',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="radio"
                          name="periodType"
                          value="ANNUAL"
                          checked={budgetForm.periodType === 'ANNUAL'}
                          onChange={() => setBudgetForm({ ...budgetForm, periodType: 'ANNUAL' })}
                        />
                        📆 Periode Tahunan
                      </label>
                    </div>
                  </div>

                  {/* Pilihan Periode Detail */}
                  {budgetForm.periodType === 'MONTHLY' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                      <div className="form-group">
                        <label className="form-label form-required">Bulan Anggaran</label>
                        <select
                          className="form-select"
                          value={budgetForm.month}
                          onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label form-required">Tahun</label>
                        <select
                          className="form-select"
                          value={budgetForm.year}
                          onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label form-required">Tahun Anggaran</label>
                      <select
                        className="form-select"
                        value={budgetForm.year}
                        onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            Tahun Anggaran {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Nominal Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Plafon Pagu Anggaran (Rp)</label>
                    <NominalInput
                      id="budget-amount"
                      value={budgetForm.budget}
                      onChange={(val) => setBudgetForm({ ...budgetForm, budget: val })}
                      placeholder="Contoh: 3.500.000"
                      required
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="form-group">
                    <label className="form-label">Deskripsi / Peruntukan Alokasi</label>
                    <textarea
                      className="form-input"
                      id="budget-notes"
                      rows={2}
                      placeholder="Uraian peruntukan alokasi anggaran pos ini (opsional)"
                      value={budgetForm.notes}
                      onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddBudget(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" id="btn-save-budget" style={{ fontWeight: 600 }}>
                  Simpan Pos Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: UBAH PAGU ANGGARAN */}
      {/* ========================================================================= */}
      {editingBudget && (
        <div className="modal-overlay" onClick={() => setEditingBudget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit size={18} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Ubah Pagu: {editingBudget.category}</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingBudget(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBudgetCategory}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Nama Kategori */}
                  <div className="form-group">
                    <label className="form-label form-required">Nama Kategori</label>
                    <input
                      className="form-input"
                      value={editingBudget.category}
                      onChange={(e) => setEditingBudget({ ...editingBudget, category: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tipe Periode & Waktu */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label form-required">Tipe Periode</label>
                      <select
                        className="form-select"
                        value={editingBudget.periodType}
                        onChange={(e) =>
                          setEditingBudget({
                            ...editingBudget,
                            periodType: e.target.value as BudgetPeriodType,
                          })
                        }
                      >
                        <option value="MONTHLY">📅 Bulanan</option>
                        <option value="ANNUAL">📆 Tahunan</option>
                      </select>
                    </div>

                    {editingBudget.periodType === 'MONTHLY' ? (
                      <div className="form-group">
                        <label className="form-label form-required">Bulan</label>
                        <select
                          className="form-select"
                          value={editingBudget.month}
                          onChange={(e) => setEditingBudget({ ...editingBudget, month: e.target.value })}
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label form-required">Tahun Anggaran</label>
                        <select
                          className="form-select"
                          value={editingBudget.year}
                          onChange={(e) => setEditingBudget({ ...editingBudget, year: e.target.value })}
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {editingBudget.periodType === 'MONTHLY' && (
                    <div className="form-group">
                      <label className="form-label form-required">Tahun</label>
                      <select
                        className="form-select"
                        value={editingBudget.year}
                        onChange={(e) => setEditingBudget({ ...editingBudget, year: e.target.value })}
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Nominal Plafon */}
                  <div className="form-group">
                    <label className="form-label form-required">Pagu Batas Belanja (Rp)</label>
                    <NominalInput
                      value={editingBudget.budget}
                      onChange={(val) => setEditingBudget({ ...editingBudget, budget: val })}
                      required
                    />
                  </div>

                  {/* Status Pagu */}
                  <div className="form-group">
                    <label className="form-label form-required">Status Pagu Anggaran</label>
                    <select
                      className="form-select"
                      value={editingBudget.status}
                      onChange={(e) =>
                        setEditingBudget({
                          ...editingBudget,
                          status: e.target.value as BudgetStatus,
                        })
                      }
                    >
                      <option value="ACTIVE">🟢 Aktif (Berjalan / Belanja Diizinkan)</option>
                      <option value="CLOSED">🔒 Ditutup (Beku / Selesai)</option>
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Jika berstatus Ditutup, alokasi pos ini dianggap selesai dan tidak direkomendasikan untuk belanja baru.
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="form-group">
                    <label className="form-label">Deskripsi / Peruntukan Alokasi</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={editingBudget.notes}
                      onChange={(e) => setEditingBudget({ ...editingBudget, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingBudget(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: TAMBAHKAN NOMINAL PAGU ANGGARAN (TOP-UP) */}
      {/* ========================================================================= */}
      {topUpTarget && (
        <div className="modal-overlay" onClick={() => setTopUpTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={20} color="var(--gmh-green)" />
                <h3 style={{ margin: 0 }}>Top-Up Nominal Pagu Anggaran</h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setTopUpTarget(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopUp}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Summary Card Info Pos */}
                  <div
                    style={{
                      background: '#f9fafb',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 8,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gmh-text)', marginBottom: 2 }}>
                      {topUpTarget.category}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginBottom: 10 }}>
                      Periode: <strong>{topUpTarget.periodName}</strong> ({topUpTarget.periodType === 'ANNUAL' ? 'Tahunan' : 'Bulanan'})
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Pagu Saat Ini</div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gmh-text)' }}>
                          {formatRupiah(topUpTarget.budget)}
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Realisasi Belanja</div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#b91c1c' }}>
                          {formatRupiah(topUpTarget.spent)}
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: 10.5, color: '#6b7280' }}>Sisa Saldo</div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: topUpTarget.budget - topUpTarget.spent >= 0 ? '#059669' : '#b91c1c',
                          }}
                        >
                          {formatRupiah(topUpTarget.budget - topUpTarget.spent)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Nominal Tambahan */}
                  <div className="form-group">
                    <label className="form-label form-required">Nominal Penambahan / Top-Up (Rp)</label>
                    <NominalInput
                      id="topup-amount"
                      value={topUpAmount}
                      onChange={(val) => setTopUpAmount(val)}
                      placeholder="Contoh: 1.500.000"
                      required
                    />
                    <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', marginTop: 4 }}>
                      Nominal ini akan ditambahkan ke pagu yang sudah ada.
                    </div>
                  </div>

                  {/* Kalkulasi Pratinjau Plafon Baru */}
                  {topUpAmount > 0 && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 8,
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontSize: 12.5,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#065f46' }}>
                        <span>Plafon Pagu Baru Setelah Top-Up:</span>
                        <strong>{formatRupiah(topUpTarget.budget + topUpAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                        <span>Estimasi Sisa Saldo Tersedia Baru:</span>
                        <strong>{formatRupiah(topUpTarget.budget + topUpAmount - topUpTarget.spent)}</strong>
                      </div>
                    </div>
                  )}

                  {/* Alasan / Catatan Penambahan */}
                  <div className="form-group">
                    <label className="form-label">Alasan / Catatan Penambahan Pagu</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Contoh: Penambahan kebutuhan operasional karena lonjakan pengiriman logistik misi"
                      value={topUpReason}
                      onChange={(e) => setTopUpReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setTopUpTarget(null)}>
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={topUpAmount <= 0}
                  style={{ fontWeight: 600 }}
                >
                  <PlusCircle size={14} /> Simpan & Top-Up Pagu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceOperationalPage;
