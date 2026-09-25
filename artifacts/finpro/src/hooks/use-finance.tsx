import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { financeService, type Transaction, type TransactionInput } from '@/lib/finance';
import { useProfile } from '@/hooks/use-profile';

type FinanceContextValue = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (input: TransactionInput) => Promise<Transaction>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useProfile();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const items = await financeService.list();
      setTransactions(activeProfile ? items.filter((item) => item.profileId === activeProfile.id) : items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<FinanceContextValue>(() => ({
    transactions,
    loading,
    error,
    createTransaction: async (input) => {
      const item = await financeService.create({ ...input, profileId: activeProfile?.id ?? null });
      await reload();
      return item;
    },
    updateTransaction: async (id, input) => {
      const item = await financeService.update(id, { ...input, profileId: activeProfile?.id ?? null });
      await reload();
      return item;
    },
    deleteTransaction: async (id) => {
      await financeService.remove(id);
      await reload();
    },
  }), [error, loading, reload, transactions]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance deve ser usado dentro de FinanceProvider');
  return context;
};
