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

const FinanceStoreContext = createContext<FinanceStoreContextValue>({
  transactions: [],
  budgetCategories: [],
  isLoading: false,
  refreshFromApi: async () => {},
  addTransaction: () => ({} as FinancialTransaction),
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

const STORAGE_KEY = 'gmh_finance_store_v6';

export const FinanceStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryDef[]>([]);

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
      const res = await api.finance.getTransactions({ limit: 'all' }).catch(() => null);
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

            let dateStr = '2026-10-28';
            if (row.transaction_date) {
              const d = new Date(row.transaction_date);
              if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
              } else {
                dateStr = String(row.transaction_date).split('T')[0];
              }
            }

          return {
            id: row.id || `trx-${idx}`,
            code: row.transaction_code || row.transaction_number || `TX-KAS-${String(idx + 1).padStart(3, '0')}`,
            date: dateStr,
            desc: row.notes || row.description || row.account_name || 'Transaksi Kas Yayasan',
            category: row.account_name || row.category_name || 'Operasional Kantor',
            party: row.donor_name || row.party || partyGuess,
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

        // Use live database transactions from PostgreSQL backend
        if (mappedTrx.length > 0) {
          setTransactions(mappedTrx);
        }
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

