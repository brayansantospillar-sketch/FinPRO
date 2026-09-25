import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, Minus, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFinance } from '@/hooks/use-finance';
import { currentMonth, formatCurrency, getMonthlyHistory, percentageChange } from '@/lib/finance-utils';

function Change({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <span className="text-xs text-muted-foreground"><Minus className="mr-1 inline h-3 w-3" />sem base anterior</span>;
  const good = inverse ? value <= 0 : value >= 0;
  return <span className={`text-xs ${good ? 'text-emerald-300' : 'text-rose-300'}`}>{value >= 0 ? <ArrowUpRight className="mr-1 inline h-3 w-3" /> : <ArrowDownRight className="mr-1 inline h-3 w-3" />}{Math.abs(value).toFixed(1)}% vs. mês anterior</span>;
}

export function HistoryPage() {
  const { transactions, loading } = useFinance();
  const history = useMemo(() => getMonthlyHistory(transactions, 12, currentMonth()), [transactions]);
  const current = history.at(-1)!;
  const previous = history.at(-2)!;
  const chart = history.map((item) => ({ ...item, receitas: item.income / 100, despesas: item.expenses / 100 }));

  if (loading) return <div className="surface-card h-72 animate-pulse" />;

  return <div className="space-y-7">
    <div><p className="muted-label mb-2">Evolução financeira</p><h1 className="font-display text-[29px] font-bold tracking-[-.045em] md:text-[34px]">Histórico<span className="text-primary">.</span></h1><p className="mt-1 text-sm text-muted-foreground">Compare seus meses sem apagar nenhum lançamento antigo.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="surface-card p-5"><p className="muted-label">Receitas do mês</p><p className="number-display mt-3 text-2xl font-bold text-emerald-300">{formatCurrency(current.income)}</p><div className="mt-3"><Change value={percentageChange(current.income, previous.income)} /></div></div>
      <div className="surface-card p-5"><p className="muted-label">Despesas do mês</p><p className="number-display mt-3 text-2xl font-bold text-rose-300">{formatCurrency(current.expenses)}</p><div className="mt-3"><Change value={percentageChange(current.expenses, previous.expenses)} inverse /></div></div>
      <div className="surface-card p-5"><p className="muted-label">Resultado do mês</p><p className={`number-display mt-3 text-2xl font-bold ${current.result >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>{formatCurrency(current.result)}</p><div className="mt-3"><Change value={percentageChange(current.result, previous.result)} /></div></div>
    </div>
    <section className="surface-card p-5 md:p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Últimos 12 meses</h2><p className="mt-1 text-xs text-muted-foreground">Receitas e despesas por mês</p></div><CalendarRange className="h-5 w-5 text-primary" /></div><div className="h-[330px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid vertical={false} stroke="hsl(229 24% 17%)" /><XAxis dataKey="label" tick={{ fill: '#7f879b', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#7f879b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} /><Tooltip contentStyle={{ background: '#171a2a', border: '1px solid #2a2e43', borderRadius: 10, color: '#eef0f8' }} formatter={(v: number) => formatCurrency(v * 100)} /><Legend /><Bar dataKey="receitas" fill="#26c6a0" radius={[4,4,0,0]} /><Bar dataKey="despesas" fill="#ef5d83" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></section>
    <section className="surface-card overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-display text-lg font-bold">Resumo mês a mês</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="border-b border-border text-[10px] uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-5 py-3">Mês</th><th className="px-4 py-3 text-right">Receitas</th><th className="px-4 py-3 text-right">Despesas</th><th className="px-5 py-3 text-right">Resultado</th></tr></thead><tbody className="divide-y divide-border/60">{[...history].reverse().map((item) => <tr key={item.month}><td className="px-5 py-4 font-semibold capitalize">{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${item.month}-15T12:00:00`))}</td><td className="px-4 py-4 text-right text-emerald-300">{formatCurrency(item.income)}</td><td className="px-4 py-4 text-right text-rose-300">{formatCurrency(item.expenses)}</td><td className={`px-5 py-4 text-right font-bold ${item.result >= 0 ? 'text-cyan-300' : 'text-rose-300'}`}>{formatCurrency(item.result)}</td></tr>)}</tbody></table></div></section>
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5 text-cyan-300" /> O mês novo começa visualmente zerado; o histórico permanece preservado.</div>
  </div>;
}
