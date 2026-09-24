import { BarChart3, ChevronDown, LayoutDashboard, ListFilter, Plus, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export function FinproShell({ children, onAdd }: { children: ReactNode; onAdd: () => void }) {
  const [location] = useLocation();
  const active = location === '/transacoes' ? 'transacoes' : 'dashboard';
  return <div className="app-shell">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 md:flex">
      <Link href="/" className="mb-12 flex items-center gap-3 px-2" data-testid="link-brand">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/.22)]"><WalletCards className="h-[18px] w-[18px]" /></span>
        <span className="font-display text-[21px] font-bold tracking-[-.04em] text-foreground">Fin<span className="text-primary">Pro</span></span>
      </Link>
      <p className="muted-label px-3 pb-3">Seu dinheiro, claro</p>
      <nav className="space-y-1" aria-label="Navegação principal">
        <Link href="/" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active === 'dashboard' ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`} data-testid="link-dashboard">
          <LayoutDashboard className="h-[18px] w-[18px]" /> Visão geral
        </Link>
        <Link href="/transacoes" className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active === 'transacoes' ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`} data-testid="link-transacoes">
          <ListFilter className="h-[18px] w-[18px]" /> Transações
        </Link>
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-4">
        <div className="mb-4 flex items-center justify-between"><span className="text-xs text-muted-foreground">Perfil pessoal</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></div>
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">MS</div><div><p className="text-sm font-semibold">Marina Silva</p><p className="text-[11px] text-muted-foreground">Conta principal</p></div></div>
      </div>
    </aside>
    <div className="md:pl-[250px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md md:px-9">
        <div className="md:hidden"><Link href="/" className="flex items-center gap-2" data-testid="link-mobile-brand"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><WalletCards className="h-4 w-4" /></span><span className="font-display text-lg font-bold">Fin<span className="text-primary">Pro</span></span></Link></div>
        <div className="hidden md:block"><span className="text-sm text-muted-foreground">Quarta-feira, </span><span className="text-sm font-semibold text-foreground">{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())}</span></div>
        <div className="flex items-center gap-3 md:ml-auto"><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Dados sincronizados na nuvem</div><Button onClick={onAdd} className="h-9 rounded-lg bg-primary px-3 text-xs font-bold uppercase tracking-[.08em] text-primary-foreground" data-testid="button-add-transaction"><Plus className="h-4 w-4" /> <span>Lançar</span></Button></div>
      </header>
      <main className="mobile-pad mx-auto max-w-[1440px] p-5 md:p-9">{children}</main>
    </div>
    <div className="fixed bottom-5 left-5 right-5 z-30 flex gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-md md:hidden">
      <Link href="/" className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold ${active === 'dashboard' ? 'bg-accent text-foreground' : 'text-muted-foreground'}`} data-testid="mobile-nav-dashboard"><BarChart3 className="h-4 w-4" /> Visão geral</Link>
      <Link href="/transacoes" className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold ${active === 'transacoes' ? 'bg-accent text-foreground' : 'text-muted-foreground'}`} data-testid="mobile-nav-transactions"><ListFilter className="h-4 w-4" /> Transações</Link>
    </div>
  </div>;
}