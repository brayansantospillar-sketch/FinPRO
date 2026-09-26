import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { FinproShell } from '@/components/finpro-shell';
import { TransactionDialog } from '@/components/transaction-dialog';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FinanceProvider, useFinance } from '@/hooks/use-finance';
import { ProfileProvider, useProfile } from '@/hooks/use-profile';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { AuthGate } from '@/pages/auth-gate';
import { ProfileGate } from '@/pages/profile-gate';
import { Dashboard } from '@/pages/dashboard';
import { TransactionsPage } from '@/pages/transactions';
import { HistoryPage } from '@/pages/history';
import { PlanningPage } from '@/pages/planning';
import { AccountsPage } from '@/pages/accounts';
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
        <Route path="/historico" component={HistoryPage} />
        <Route path="/previsao" component={PlanningPage} />
        <Route path="/contas" component={AccountsPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function DashboardRoute() {
  const { createTransaction } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const submit = async (input: TransactionInput) => { try { await createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu saldo foi atualizado.' }); } catch (error) { toast({ title: 'Não foi possível salvar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); } };
  return <><Dashboard onAdd={() => setOpen(true)} /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></>;
}

function TransactionsRoute() {
  const { createTransaction } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const submit = async (input: TransactionInput) => { try { await createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu novo registro já está no cockpit.' }); } catch (error) { toast({ title: 'Não foi possível salvar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); } };
  return <><TransactionsPage onAdd={() => setOpen(true)} /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ProfiledApp() {
  const { activeProfile, loading } = useProfile();
  if (loading) return <ProfileGate />;
  if (!activeProfile) return <ProfileGate />;
  return <FinanceProvider><AppContent /></FinanceProvider>;
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  if (loading) return <AuthGate />;
  if (!user) return <AuthGate />;
  return <ProfileProvider><ProfiledApp /></ProfileProvider>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
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
  const submit = async (input: TransactionInput) => { await createTransaction(input); setOpen(false); toast({ title: 'Lançamento adicionado', description: 'Seu saldo foi atualizado.' }); };
  return <FinproShell onAdd={() => setOpen(true)}><Router /><TransactionDialog open={open} onOpenChange={setOpen} onSubmit={submit} /></FinproShell>;
}

export default App;
