import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Account, Bill, BudgetSummary, Transaction } from '../types';
import { api, ApiError } from './api';
import { useUser } from './auth';

interface BudgetData {
  summary: BudgetSummary;
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
}

interface BudgetContextValue {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  /** Only meaningful once status is 'ready'. */
  data: BudgetData;
  refresh: () => Promise<void>;
  addBill: (name: string, amount: number) => Promise<void>;
  deleteBill: (billId: number) => Promise<void>;
}

const EMPTY: BudgetData = {
  summary: {
    month: '',
    total_balance: 0,
    income: 0,
    expected_income: 0,
    spending: 0,
    net: 0,
    spending_by_category: [],
    bills_total: 0,
    savings_target: 0,
    savings_progress: 0,
    transaction_count: 0,
  },
  accounts: [],
  transactions: [],
  bills: [],
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

/** Loads the signed-in user's bank data and bills once and shares them with every page. */
export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user_id: userId } = useUser();
  const [data, setData] = useState<BudgetData>(EMPTY);
  const [status, setStatus] = useState<BudgetContextValue['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [summary, accounts, transactions, bills] = await Promise.all([
        api.summary(userId),
        api.accounts(userId),
        api.transactions(userId),
        api.bills(userId),
      ]);
      setData({ summary, accounts, transactions, bills });
      setError(null);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load your budget.');
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    setStatus('loading');
    void refresh();
  }, [refresh]);

  // Bills only affect the bill list and summary.bills_total, so refresh just those.
  const reloadBills = useCallback(async () => {
    const [bills, summary] = await Promise.all([api.bills(userId), api.summary(userId)]);
    setData((d) => ({ ...d, bills, summary }));
  }, [userId]);

  const addBill = useCallback(
    async (name: string, amount: number) => {
      await api.addBill(userId, name, amount);
      await reloadBills();
    },
    [userId, reloadBills],
  );

  const deleteBill = useCallback(
    async (billId: number) => {
      await api.deleteBill(userId, billId);
      await reloadBills();
    },
    [userId, reloadBills],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({ status, error, data, refresh, addBill, deleteBill }),
    [status, error, data, refresh, addBill, deleteBill],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used inside <BudgetProvider>');
  return ctx;
}
