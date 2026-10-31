import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export type TransactionType = 'DEBIT' | 'CREDIT';
export type AccountType = 'KAS_OPERASIONAL' | 'KAS_BANK' | 'KAS_PEMBANGUNAN';
export type TransactionSource = 'OPERASIONAL' | 'DONASI' | 'JANJI_IMAN' | 'PAYROLL';

export interface FinancialTransaction {
  id: string;
  code: string;
  date: string;
  desc: string;
  category: string;
  amount: number;
  type: TransactionType;
  account: AccountType;
  source: TransactionSource;
  party?: string;
  status?: 'Approved' | 'Pending Review' | 'Draft';
  notes?: string;
  recordedBy?: string;
}

export type BudgetPeriodType = 'MONTHLY' | 'ANNUAL';
export type BudgetStatus = 'ACTIVE' | 'CLOSED';

export interface BudgetCategoryDef {
  id: string;
  category: string;
  budget: number;
  notes?: string;
  periodType?: BudgetPeriodType;
  period?: string;
  periodName?: string;
  status?: BudgetStatus;
}

interface FinanceStoreContextValue {
  transactions: FinancialTransaction[];
  budgetCategories: BudgetCategoryDef[];
  isLoading: boolean;
  refreshFromApi: () => Promise<void>;
  addTransaction: (
    trx: Omit<FinancialTransaction, 'id' | 'code'>
  ) => FinancialTransaction;
  updateTransaction: (id: string, updatedFields: Partial<FinancialTransaction>) => void;
  deleteTransaction: (id: string) => void;
  bulkAddTransactions: (trxs: Omit<FinancialTransaction, 'id' | 'code'>[]) => void;
  addBudgetCategory: (
    category: string,
    budget: number,
    notes?: string,
    periodType?: BudgetPeriodType,
    period?: string,
    periodName?: string
  ) => void;
  updateBudgetCategory: (
    id: string,
    budget: number,
    category?: string,
    notes?: string,
    periodType?: BudgetPeriodType,
    period?: string,
    periodName?: string,
    status?: BudgetStatus
  ) => void;
  topUpBudgetCategory: (id: string, addedAmount: number, reason?: string) => void;
  toggleCloseBudgetCategory: (id: string) => void;
  deleteBudgetCategory: (id: string) => void;
  getOperationalBalance: () => number;
  getBankBalance: () => number;
  getBuildingBalance: () => number;
  getMainFoundationBalance: () => number;
  getMonthlyStats: (monthYear?: string) => {
    totalIn: number;
    totalOut: number;
    net: number;
  };
}

const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'trx-op-0',
    code: 'TX-GMH-202610-000',
    date: '2026-10-01',
    desc: 'Saldo Awal & Pencairan Dana Kas Operasional Kantor Yayasan Bulan Oktober 2026',
    category: 'Drop Kas Operasional',
    party: 'Bendahara Umum Yayasan',
    amount: 15000000,
    type: 'CREDIT',
    account: 'KAS_OPERASIONAL',
    source: 'OPERASIONAL',
    status: 'Approved',
    notes: 'Alokasi dana kas operasional kantor yayasan',
    recordedBy: 'Bendahara Yayasan',
  },
  {
    id: 'trx-don-1',
    code: 'TX-DON-1793151474646',
    date: '2026-10-27',
    desc: '[Autoposting Fundraising CRM] Donasi masuk dari Mitra: Rina Purnamasari. Channel: BCA Angelina Meilia Manalu. Notes: Tanpa catatan tambahan',
    category: 'Donasi Kemitraan',
    party: 'Rina Purnamasari',
    amount: 200001,
    type: 'CREDIT',
    account: 'KAS_BANK',
    source: 'DONASI',
    status: 'Approved',
    notes: 'Donasi rutin bulanan mitra pelayanan',
    recordedBy: 'Sistem CRM',
  },
  {
    id: 'trx-don-2',
    code: 'TX-DON-1793151388106',
    date: '2026-10-25',
    desc: '[Autoposting Fundraising CRM] Donasi masuk dari Mitra: Cindy Elisabeth. Channel: BCA Angelina Meilia Manalu. Notes: Tanpa catatan tambahan',
    category: 'Donasi Kemitraan',
    party: 'Cindy Elisabeth',
    amount: 500000,
    type: 'CREDIT',
    account: 'KAS_BANK',
    source: 'DONASI',
    status: 'Approved',
    notes: 'Persembahan kasih alumni untuk program kemitraan',
    recordedBy: 'Sistem CRM',
  },
  {
    id: 'trx-op-1',
    code: 'TX-GMH-202610-003',
    date: '2026-10-24',
    desc: 'Langganan Internet Fiber Optic Kantor Sekretariat GMH (Indihome 100 Mbps)',
    category: 'Operasional Kantor',
    party: 'PT Telkom Indonesia',
    amount: 850000,
    type: 'DEBIT',
    account: 'KAS_OPERASIONAL',
    source: 'OPERASIONAL',
    status: 'Approved',
    notes: 'Tagihan internet rutin bulanan sekretariat yayasan',
    recordedBy: 'Admin Keuangan',
  },
  {
    id: 'trx-op-2',
    code: 'TX-GMH-202610-002',
    date: '2026-10-20',
    desc: 'Pembelian ATK, kertas kop surat yayasan F4, map arsip, dan toner printer kantor',
    category: 'Operasional Kantor',
    party: 'Toko ATK Gramedia USU',
    amount: 1250000,
    type: 'DEBIT',
    account: 'KAS_OPERASIONAL',
    source: 'OPERASIONAL',
    status: 'Approved',
    notes: 'Belanja perlengkapan administrasi kantor GMH',
    recordedBy: 'Staff Admin',
  },
  {
    id: 'trx-bld-1',
    code: 'TX-GMH-202610-001',
    date: '2026-10-14',
    desc: 'Tahap 3 dari 5 komitmen pembangunan Rumah Persekutuan (Kel. Sinurat)',
    category: 'Penerimaan Janji Iman',
    party: 'Kel. Sinurat',
    amount: 35000000,
    type: 'CREDIT',
    account: 'KAS_PEMBANGUNAN',
    source: 'JANJI_IMAN',
    status: 'Approved',
    notes: 'Pembayaran angsuran komitmen pembangunan Rumah Persekutuan',
    recordedBy: 'Bendahara Yayasan',
  },
  {
    id: 'trx-op-3',
    code: 'TX-GMH-202610-008',
    date: '2026-10-10',
    desc: 'Bantuan transportasi kurir & logistik pengiriman buku pembinaan mahasiswa daerah',
    category: 'Operasional Kantor',
    party: 'JNE Express Cabang Medan',
    amount: 450000,
    type: 'DEBIT',
    account: 'KAS_OPERASIONAL',
    source: 'OPERASIONAL',
    status: 'Approved',
    notes: 'Ongkos kirim paket bahan pemuridan',
    recordedBy: 'Staff Admin',
  },
];

export const INITIAL_BUDGETS: BudgetCategoryDef[] = [
  { id: 'bgt-1', category: 'Operasional Kantor', budget: 5000000, notes: 'Belanja perlengkapan ATK, kurir, materai kantor', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-3', category: 'Sewa Fasilitas & Kantor', budget: 4000000, notes: 'Sewa aula kegiatan & ruangan sekretariat', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-4', category: 'Utilitas (Listrik, Air & Internet)', budget: 2000000, notes: 'PLN & Indihome fiber optic', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-5', category: 'Konsumsi Persekutuan & Rapat', budget: 1500000, notes: 'Snack & makan rapat evaluasi pengurus', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-6', category: 'Transport & Operasional Misi', budget: 2500000, notes: 'BBM & biaya akomodasi pelayanan misi', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-7', category: 'Honorarium Pembicara Seminar', budget: 3000000, notes: 'Honorarium narasumber pembinaan alumni', periodType: 'MONTHLY', period: '2026-10', periodName: 'Oktober 2026', status: 'ACTIVE' },
  { id: 'bgt-8', category: 'Pemeliharaan Gedung & Alat', budget: 2000000, notes: 'Servis printer, pendingin AC, sound system', periodType: 'ANNUAL', period: '2026', periodName: 'Tahun Anggaran 2026', status: 'ACTIVE' },
];

const FinanceStoreContext = createContext<FinanceStoreContextValue>({
  transactions: INITIAL_TRANSACTIONS,
  budgetCategories: INITIAL_BUDGETS,
  isLoading: false,
  refreshFromApi: async () => {},
  addTransaction: () => INITIAL_TRANSACTIONS[0],
  updateTransaction: () => {},
  deleteTransaction: () => {},
  bulkAddTransactions: () => {},
  addBudgetCategory: () => {},
  updateBudgetCategory: () => {},
  topUpBudgetCategory: () => {},
  toggleCloseBudgetCategory: () => {},
  deleteBudgetCategory: () => {},
  getOperationalBalance: () => 0,
  getBankBalance: () => 0,
  getBuildingBalance: () => 0,
  getMainFoundationBalance: () => 0,
  getMonthlyStats: () => ({ totalIn: 0, totalOut: 0, net: 0 }),
});

const STORAGE_KEY = 'gmh_finance_store_v3';

export const FinanceStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((item: any) => {
              const cat = (item.category || item.account_name || '').toLowerCase();
              const desc = (item.desc || item.notes || '').toLowerCase();
              const src = (item.source || '').toUpperCase();
              return src !== 'PAYROLL' && !cat.includes('gaji') && !desc.includes('pencairan gaji');
            })
            .map((item: any, idx: number) => ({
              id: item.id || `trx-${Date.now()}-${idx}`,
              code: item.code || item.transaction_code || item.transaction_number || `TX-KAS-${String(idx + 1).padStart(3, '0')}`,
              date: item.date || (item.transaction_date ? item.transaction_date.split('T')[0] : '2026-10-28'),
              desc: item.desc || item.notes || item.description || item.account_name || 'Transaksi Kas Yayasan',
              category: item.category || item.account_name || item.category_name || 'Operasional Kantor',
              party: item.party || 'Pihak Relasi',
              amount: Number(item.amount) || 0,
              type: (item.type === 'EXPENSE' || item.type === 'DEBIT') ? 'DEBIT' : 'CREDIT',
              account: (item.account === 'KAS_PEMBANGUNAN' || item.account === 'KAS_BANK')
                ? item.account
                : (item.scope === 'OPERASIONAL' || item.coa_scope === 'OPERASIONAL_KANTOR')
                ? 'KAS_OPERASIONAL'
                : (item.account || 'KAS_OPERASIONAL'),
              source: item.source || 'OPERASIONAL',
              status: item.status || 'Approved',
              notes: item.notes || '',
              recordedBy: item.recordedBy || item.recorded_by_name || item.creator_name || 'Staff Yayasan',
            }));
        }
      }
      return INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryDef[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_budgets`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((b: any) => {
              const cat = (b.category || '').toLowerCase();
              return !cat.includes('gaji') && !cat.includes('payroll');
            })
            .map((b: any) => ({
              id: b.id || `bgt-${Date.now()}`,
              category: b.category,
              budget: Number(b.budget) || 0,
              notes: b.notes,
              periodType: (b.periodType as BudgetPeriodType) || (b.category?.toLowerCase().includes('gedung') ? 'ANNUAL' : 'MONTHLY'),
              period: b.period || (b.category?.toLowerCase().includes('gedung') ? '2026' : '2026-10'),
              periodName: b.periodName || (b.category?.toLowerCase().includes('gedung') ? 'Tahun Anggaran 2026' : 'Oktober 2026'),
              status: (b.status as BudgetStatus) || 'ACTIVE',
            }));
        }
      }
      return INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY}_transactions`,
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY}_budgets`,
      JSON.stringify(budgetCategories)
    );
  }, [budgetCategories]);

  const addBudgetCategory = (
    category: string,
    budget: number,
    notes?: string,
    periodType: BudgetPeriodType = 'MONTHLY',
    period?: string,
    periodName?: string
  ) => {
    const p = period || (periodType === 'ANNUAL' ? '2026' : '2026-10');
    const pName = periodName || (periodType === 'ANNUAL' ? `Tahun Anggaran ${p}` : 'Oktober 2026');
    const newBgt: BudgetCategoryDef = {
      id: `bgt-${Date.now()}`,
      category: category.trim(),
      budget: Number(budget) || 0,
      notes: notes?.trim() || undefined,
      periodType,
      period: p,
      periodName: pName,
      status: 'ACTIVE',
    };
    setBudgetCategories((prev) => [...prev, newBgt]);
  };

  const updateBudgetCategory = (
    id: string,
    budget: number,
    category?: string,
    notes?: string,
    periodType?: BudgetPeriodType,
    period?: string,
    periodName?: string,
    status?: BudgetStatus
  ) => {
    setBudgetCategories((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              budget: Number(budget) || 0,
              category: category !== undefined ? category.trim() : b.category,
              notes: notes !== undefined ? notes.trim() : b.notes,
              periodType: periodType !== undefined ? periodType : b.periodType,
              period: period !== undefined ? period : b.period,
              periodName: periodName !== undefined ? periodName : b.periodName,
              status: status !== undefined ? status : b.status,
            }
          : b
      )
    );
  };

  const topUpBudgetCategory = (id: string, addedAmount: number, reason?: string) => {
    setBudgetCategories((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const addNum = Number(addedAmount) || 0;
        const newBudget = (Number(b.budget) || 0) + addNum;
        const formattedAdd = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(addNum);
        const logText = reason ? `[Top-Up +${formattedAdd}: ${reason}]` : `[Top-Up +${formattedAdd}]`;
        const updatedNotes = b.notes ? `${b.notes} · ${logText}` : logText;
        return {
          ...b,
          budget: newBudget,
          notes: updatedNotes,
          status: 'ACTIVE',
        };
      })
    );
  };

  const toggleCloseBudgetCategory = (id: string) => {
    setBudgetCategories((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: b.status === 'CLOSED' ? 'ACTIVE' : 'CLOSED',
            }
          : b
      )
    );
  };

  const deleteBudgetCategory = (id: string) => {
    setBudgetCategories((prev) => prev.filter((b) => b.id !== id));
  };

  // Load from backend API
  const refreshFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.finance.getTransactions().catch(() => null);
      if (res?.transactions && Array.isArray(res.transactions) && res.transactions.length > 0) {
        const mappedTrx: FinancialTransaction[] = res.transactions
          .filter((row: any) => {
            const accName = (row.account_name || '').toLowerCase();
            const notes = (row.notes || '').toLowerCase();
            return row.source_module !== 'PAYROLL' && !accName.includes('gaji') && !notes.includes('pencairan gaji');
          })
          .map((row: any, idx: number) => {
            let partyGuess = 'Pihak Relasi';
            if (row.notes?.includes('Simamora')) partyGuess = 'Kel. H. Simamora';
            else if (row.notes?.includes('Sinurat')) partyGuess = 'Kel. Sinurat';
            else if (row.notes?.includes('Internet')) partyGuess = 'PT Telkom Indonesia';
            else if (row.notes?.includes('ATK')) partyGuess = 'Toko ATK Gramedia USU';

          return {
            id: row.id || `trx-${idx}`,
            code: row.transaction_code || row.transaction_number || `TX-KAS-${String(idx + 1).padStart(3, '0')}`,
            date: row.transaction_date ? row.transaction_date.split('T')[0] : '2026-10-28',
            desc: row.notes || row.description || row.account_name || 'Transaksi Kas Yayasan',
            category: row.account_name || row.category_name || 'Operasional Kantor',
            party: row.party || partyGuess,
            amount: Number(row.amount) || 0,
            type: (row.transaction_type === 'EXPENSE' || row.transaction_type === 'DEBIT') ? 'DEBIT' : 'CREDIT',
            account: (row.scope === 'OPERASIONAL' || row.coa_scope === 'OPERASIONAL_KANTOR')
              ? 'KAS_OPERASIONAL'
              : (row.account_name?.toLowerCase().includes('pembangunan') || row.notes?.toLowerCase().includes('pembangunan'))
              ? 'KAS_PEMBANGUNAN'
              : 'KAS_BANK',
            source: (row.account_name?.toLowerCase().includes('pembangunan') || row.notes?.toLowerCase().includes('pembangunan'))
              ? 'JANJI_IMAN'
              : row.source_module === 'PAYROLL'
              ? 'PAYROLL'
              : row.source_module === 'DONATION'
              ? 'DONASI'
              : 'OPERASIONAL',
            status: 'Approved',
            notes: row.notes || '',
            recordedBy: row.recorded_by_name || row.creator_name || 'Staff Yayasan',
          };
        });

        // Merge: keep rich mock items if not present in backend
        setTransactions((prev) => {
          const apiCodes = new Set(mappedTrx.map((m) => m.code));
          const nonApi = prev.filter((p) => !apiCodes.has(p.code));
          return [...mappedTrx, ...nonApi];
        });
      }
    } catch (err) {
      console.warn('API finance refresh fallback to cached store:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromApi();
  }, [refreshFromApi]);

  const generateTransactionCode = (dateStr: string): string => {
    const ym = dateStr.replace(/-/g, '').slice(0, 6); // YYYYMM
    const seq = String(transactions.length + 1).padStart(3, '0');
    return `TRX-KAS-${ym}-${seq}`;
  };

  const addTransaction = (
    trx: Omit<FinancialTransaction, 'id' | 'code'>
  ): FinancialTransaction => {
    const code = generateTransactionCode(trx.date);
    const newTrx: FinancialTransaction = {
      ...trx,
      id: `trx-${Date.now()}`,
      code,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // Backend sync with appropriate COA account
    const accountId = trx.account === 'KAS_PEMBANGUNAN'
      ? '4-2010'
      : trx.type === 'CREDIT'
      ? '4-1010'
      : '5-2010';

    api.finance.createTransaction({
      scope: trx.account === 'KAS_OPERASIONAL' ? 'OPERASIONAL' : 'YAYASAN_PUSAT',
      transactionDate: trx.date,
      transactionType: trx.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
      accountId: accountId,
      amount: trx.amount,
      paymentMethod: 'CASH',
      notes: `${trx.desc}${trx.notes ? ` - ${trx.notes}` : ''}`,
    }).catch((err) => console.error('Failed to create transaction via API:', err));

    return newTrx;
  };

  const updateTransaction = (id: string, updatedFields: Partial<FinancialTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t))
    );

    // If UUID id, sync to backend
    if (!id.startsWith('trx-')) {
      const type = updatedFields.type === 'DEBIT' ? 'EXPENSE' : updatedFields.type === 'CREDIT' ? 'INCOME' : undefined;
      api.finance.updateTransaction(id, {
        transactionDate: updatedFields.date,
        transactionType: type,
        amount: updatedFields.amount,
        notes: `${updatedFields.desc || ''}${updatedFields.party ? ` (Pihak: ${updatedFields.party})` : ''}`,
      }).catch((err) => console.warn('Update transaction API sync error:', err));
    }
  };

  const bulkAddTransactions = (newTrxs: Omit<FinancialTransaction, 'id' | 'code'>[]) => {
    const createdList: FinancialTransaction[] = newTrxs.map((trx, idx) => ({
      ...trx,
      id: `trx-import-${Date.now()}-${idx}`,
      code: `TX-IMP-${Date.now().toString().slice(-6)}-${String(idx + 1).padStart(3, '0')}`,
      status: trx.status || 'Approved',
    }));
    setTransactions((prev) => [...createdList, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    api.finance.deleteTransaction(id).catch((err) =>
      console.warn('Delete transaction API sync error (fallback local only):', err)
    );
  };

  // Calculate balances per account
  const getOperationalBalance = (): number => {
    return transactions
      .filter((t) => t && t.account === 'KAS_OPERASIONAL')
      .reduce((sum, t) => {
        const amt = Number(t.amount) || 0;
        return t.type === 'CREDIT' ? sum + amt : sum - amt;
      }, 0);
  };

  const getBankBalance = (): number => {
    return transactions
      .filter((t) => t && t.account === 'KAS_BANK')
      .reduce((sum, t) => {
        const amt = Number(t.amount) || 0;
        return t.type === 'CREDIT' ? sum + amt : sum - amt;
      }, 0);
  };

  const getBuildingBalance = (): number => {
    return transactions
      .filter((t) => t && t.account === 'KAS_PEMBANGUNAN')
      .reduce((sum, t) => {
        const amt = Number(t.amount) || 0;
        return t.type === 'CREDIT' ? sum + amt : sum - amt;
      }, 0);
  };

  const getMainFoundationBalance = (): number => {
    // Total central liquid funds (Operasional + Bank)
    return getOperationalBalance() + getBankBalance();
  };

  const getMonthlyStats = (monthYear = '2026-10') => {
    const monthly = transactions.filter(
      (t) =>
        t &&
        t.account === 'KAS_OPERASIONAL' &&
        (!monthYear || (t.date && t.date.startsWith(monthYear)))
    );

    const totalIn = monthly
      .filter((t) => t.type === 'CREDIT')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const totalOut = monthly
      .filter((t) => t.type === 'DEBIT')
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
    };
  };

  return (
    <FinanceStoreContext.Provider
      value={{
        transactions,
        budgetCategories,
        isLoading,
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
        getMainFoundationBalance,
        getMonthlyStats,
      }}
    >
      {children}
    </FinanceStoreContext.Provider>
  );
};

export const useFinanceStore = () => useContext(FinanceStoreContext);

