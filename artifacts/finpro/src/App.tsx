import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { FinproShell } from '@/components/finpro-shell';
import { TransactionDialog } from '@/components/transaction-dialog';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceProvider, useFinance } from '@/hooks/use-finance';
import { Dashboard } from '@/pages/dashboard';
import { TransactionsPage } from '@/pages/transactions';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import type { TransactionInput } from '@/lib/finance';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={DashboardRoute} />
        <Route path="/transacoes" component={TransactionsRoute} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function DashboardRoute() {
  const { createTransaction } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const submit = (input: TransactionInput) => { createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu saldo foi atualizado.' }); };
  return <><Dashboard onAdd={() => setOpen(true)} /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></>;
}

function TransactionsRoute() {
  const { createTransaction } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const submit = (input: TransactionInput) => { createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu novo registro já está no cockpit.' }); };
  return <><TransactionsPage onAdd={() => setOpen(true)} /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <FinanceProvider>
            <AppContent />
          </FinanceProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const [open, setOpen] = useState(false);
  const { createTransaction } = useFinance();
  const { toast } = useToast();
  const submit = (input: TransactionInput) => { createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu saldo foi atualizado.' }); };
  return <FinproShell onAdd={() => setOpen(true)}><Router /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></FinproShell>;
}

export default App;
