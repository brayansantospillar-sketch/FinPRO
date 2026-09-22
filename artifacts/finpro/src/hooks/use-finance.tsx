import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { financeService, type Transaction, type TransactionInput } from '@/lib/finance';

type FinanceContextValue = { transactions: Transaction[]; loading: boolean; createTransaction: (input: TransactionInput) => Transaction; updateTransaction: (id: string, input: TransactionInput) => Transaction | undefined; deleteTransaction: (id: string) => void; };
const FinanceContext = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => { setTransactions(financeService.list()); setLoading(false); }, 180); return () => window.clearTimeout(timer); }, []);
  const value = useMemo(() => ({
    transactions, loading,
    createTransaction: (input: TransactionInput) => { const item = financeService.create(input); setTransactions(financeService.list()); return item; },
    updateTransaction: (id: string, input: TransactionInput) => { const item = financeService.update(id, input); setTransactions(financeService.list()); return item; },
    deleteTransaction: (id: string) => { financeService.remove(id); setTransactions(financeService.list()); },
  }), [transactions, loading]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
export const useFinance = () => { const context = useContext(FinanceContext); if (!context) throw new Error('useFinance deve ser usado dentro de FinanceProvider'); return context; };