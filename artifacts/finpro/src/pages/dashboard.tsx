import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  MoreHorizontal,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/use-finance';
import {
  CATEGORIES,
  type Category,
  type Transaction,
} from '@/lib/finance';
import {
  currentMonth,
  formatCurrency,
  formatDate,
  getCategoryTotals,
  getCashFlow,
  monthLabel,
  sumByType,
} from '@/lib/finance-utils';

const chartColors = ['#8e6df5', '#ef5d83', '#26c6a0', '#35c5e5', '#f0bb57', '#a27cf5'];
const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1).padStart(2, '0');
  return {
    value,
    label: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
      new Date(`2026-${value}-15T12:00:00`),
    ),
  };
});

function LoadingDashboard() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="h-10 w-60 rounded-lg bg-muted" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-36 rounded-2xl bg-card" key={index} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-80 rounded-2xl bg-card" />
        <div className="h-80 rounded-2xl bg-card" />
      </div>
    </div>
  );
}

function TransactionLine({ item }: { item: Transaction }) {
  const income = item.type === 'receita';
  return (
    <div className="flex items-center gap-3 py-3.5" data-testid={`dashboard-transaction-${item.id}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          income ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'
        }`}
      >
        {income ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{item.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.category} · {formatDate(item.date)}
        </p>
      </div>
      <span className={`text-sm font-bold ${income ? 'text-emerald-300' : 'text-rose-300'}`}>
        {income ? '+' : '-'} {formatCurrency(item.amountCents)}
      </span>
    </div>
  );
}

export function Dashboard({ onAdd }: { onAdd: () => void }) {
  const { transactions, loading } = useFinance();
  const today = currentMonth();
  const [selectedMonth, setSelectedMonth] = useState(today.slice(5));
  const [selectedYear, setSelectedYear] = useState(today.slice(0, 4));
  const [selectedCategory, setSelectedCategory] = useState<'todas' | Category>('todas');

  const years = useMemo(() => {
    const values = new Set(transactions.map((item) => item.date.slice(0, 4)));
    values.add(today.slice(0, 4));
    return [...values].sort((a, b) => b.localeCompare(a));
  }, [today, transactions]);

  const selectedItems = useMemo(
    () =>
      transactions.filter((item) => {
        const matchesMonth = selectedMonth === 'todos' || item.date.slice(5, 7) === selectedMonth;
        const matchesYear = selectedYear === 'todos' || item.date.slice(0, 4) === selectedYear;
        const matchesCategory =
          selectedCategory === 'todas' || item.category === selectedCategory;
        return matchesMonth && matchesYear && matchesCategory;
      }),
    [selectedCategory, selectedMonth, selectedYear, transactions],
  );

  const periodIncome = sumByType(selectedItems, 'receita');
  const periodExpenses = sumByType(selectedItems, 'despesa');
  const currentBalance =
    sumByType(transactions, 'receita') - sumByType(transactions, 'despesa');
  const periodResult = periodIncome - periodExpenses;
  const categories = useMemo(
    () =>
      getCategoryTotals(selectedItems)
        .slice(0, 6)
        .map(([name, value]) => ({ name, value: value / 100 })),
    [selectedItems],
  );
  const flow = useMemo(() => getCashFlow(selectedItems), [selectedItems]);
  const recent = selectedItems.slice(0, 5);
  const periodLabel =
    selectedMonth === 'todos'
      ? `ano de ${selectedYear === 'todos' ? 'todos os anos' : selectedYear}`
      : monthLabel(`${selectedYear}-${selectedMonth}`);

  if (loading) return <LoadingDashboard />;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="muted-label mb-2">Visão geral · {periodLabel}</p>
          <h1 className="font-display text-[29px] font-bold tracking-[-.045em] text-foreground md:text-[34px]">
            Bom dia, Marina <span className="text-primary">.</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o ritmo do seu dinheiro neste período.
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="hidden h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground sm:flex"
          data-testid="button-dashboard-add"
        >
          <CircleDollarSign className="h-4 w-4" /> Novo lançamento
        </Button>
      </div>

      <div className="surface-card grid gap-3 p-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="muted-label px-1">Mês</span>
          <select
            className="input-dark select-dark"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            data-testid="select-dashboard-month"
          >
            <option value="todos">Todos os meses</option>
            {monthOptions.map((month) => (
              <option value={month.value} key={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="muted-label px-1">Ano</span>
          <select
            className="input-dark select-dark"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            data-testid="select-dashboard-year"
          >
            <option value="todos">Todos os anos</option>
            {years.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="muted-label px-1">Categoria</span>
          <select
            className="input-dark select-dark"
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value as 'todas' | Category)
            }
            data-testid="select-dashboard-category"
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIES.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="surface-card relative overflow-hidden border-primary/35 p-5 md:p-6">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative">
            <div className="mb-5 flex items-center justify-between">
              <span className="muted-label">Saldo atual</span>
              <span className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-primary">
                Total
              </span>
            </div>
            <p className="number-display text-3xl font-bold text-foreground" data-testid="text-balance">
              {formatCurrency(currentBalance)}
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" /> Fluxo acumulado
              </span>
            </div>
          </div>
        </div>
        <div className="surface-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <span className="muted-label">Entradas do período</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="number-display text-2xl font-bold text-emerald-300" data-testid="text-income-total">
            {formatCurrency(periodIncome)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedItems.filter((item) => item.type === 'receita').length} entradas no filtro
          </p>
        </div>
        <div className="surface-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <span className="muted-label">Saídas do período</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
          </div>
          <p className="number-display text-2xl font-bold text-rose-300" data-testid="text-expense-total">
            {formatCurrency(periodExpenses)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {selectedItems.filter((item) => item.type === 'despesa').length} saídas no filtro
          </p>
        </div>
        <div className="surface-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <span className="muted-label">Resultado do mês</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <p
            className={`number-display text-2xl font-bold ${
              periodResult >= 0 ? 'text-cyan-300' : 'text-rose-300'
            }`}
            data-testid="text-result-total"
          >
            {formatCurrency(periodResult)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Entradas menos saídas</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="surface-card p-5 md:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Fluxo de caixa</h2>
              <p className="mt-1 text-xs text-muted-foreground">Entradas e saídas recentes</p>
            </div>
            <button
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Mais opções de fluxo"
              data-testid="button-cashflow-options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flow} margin={{ top: 8, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#26c6a0" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#26c6a0" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ef5d83" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#ef5d83" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(229 24% 17%)" />
                <XAxis dataKey="label" tick={{ fill: '#7f879b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7f879b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip
                  contentStyle={{ background: '#171a2a', border: '1px solid #2a2e43', borderRadius: 10, color: '#eef0f8', fontSize: 12 }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value * 100),
                    name === 'receita' ? 'Receita' : 'Despesa',
                  ]}
                />
                <Area type="monotone" dataKey="receita" stroke="#26c6a0" strokeWidth={2.5} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="despesa" stroke="#ef5d83" strokeWidth={2.5} fill="url(#expenseFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-400" /> Receitas</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-400" /> Despesas</span>
          </div>
        </section>

        <section className="surface-card p-5 md:p-6">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Onde você gasta</h2>
              <p className="mt-1 text-xs text-muted-foreground">Distribuição por categoria</p>
            </div>
            <PiggyBank className="h-5 w-5 text-cyan-300" />
          </div>
          {categories.length ? (
            <div className="relative h-[175px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={3} stroke="none">
                    {categories.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#171a2a', border: '1px solid #2a2e43', borderRadius: 10, color: '#eef0f8', fontSize: 12 }}
                    formatter={(value: number) => formatCurrency(value * 100)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="number-display text-lg font-bold">{formatCurrency(periodExpenses, true)}</span>
                <span className="text-[10px] text-muted-foreground">despesas</span>
              </div>
            </div>
          ) : (
            <div className="flex h-[175px] items-center justify-center text-sm text-muted-foreground">Sem despesas neste período</div>
          )}
          <div className="space-y-2.5">
            {categories.slice(0, 4).map((category, index) => (
              <div className="flex items-center justify-between text-xs" key={category.name} data-testid={`category-total-${category.name}`}>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i className="h-2 w-2 rounded-full" style={{ background: chartColors[index] }} />
                  {category.name}
                </span>
                <span className="font-semibold text-foreground">{formatCurrency(category.value * 100)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card p-5 md:p-6">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Lançamentos recentes</h2>
            <p className="mt-1 text-xs text-muted-foreground">O que aconteceu por último no filtro atual</p>
          </div>
          <Link href="/transacoes" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80" data-testid="link-all-transactions">
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length ? (
          <div className="divide-y divide-border/70">{recent.map((item) => <TransactionLine item={item} key={item.id} />)}</div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Activity className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum lançamento neste filtro.</p>
            <Button onClick={onAdd} variant="outline" size="sm" data-testid="button-empty-add">Adicionar primeiro</Button>
          </div>
        )}
      </section>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 text-cyan-300" /> Valores calculados a partir dos lançamentos.
      </div>
    </div>
  );
}