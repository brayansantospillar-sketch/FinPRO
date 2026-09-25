import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/use-finance';
import { useProfile } from '@/hooks/use-profile';
import { CATEGORIES, recurringService, type Category, type RecurringEntry, type TransactionType } from '@/lib/finance';
import { currentMonth, formatCurrency, getMonthItems, shiftMonth, sumByType } from '@/lib/finance-utils';
import { formatPaymentDate, resolvePaymentDate } from '@/lib/payment-calendar';
import { useToast } from '@/hooks/use-toast';

const parseAmount = (value: string) => {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round((Number(normalized) || 0) * 100);
};

const monthParts = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  return { year, monthIndex: number - 1 };
};

function paymentDate(item: RecurringEntry, month: string) {
  return resolvePaymentDate({
    ...monthParts(month),
    scheduleType: item.scheduleType ?? 'fixed_day',
    dayOfMonth: item.dayOfMonth,
    businessDayOrdinal: item.businessDayOrdinal,
    saturdayPolicy: item.saturdayPolicy ?? 'previous_business_day',
    sundayPolicy: item.sundayPolicy ?? 'next_business_day',
    holidayPolicy: item.holidayPolicy ?? 'previous_business_day',
  });
}

export function PlanningPage() {
  const { activeProfile } = useProfile();
  const { transactions } = useFinance();
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringEntry[]>([]);
  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Contas');
  const [scheduleType, setScheduleType] = useState<'fixed_day' | 'business_day'>('fixed_day');
  const [day, setDay] = useState(10);
  const [businessDayOrdinal, setBusinessDayOrdinal] = useState(5);

  const load = async () => {
    try {
      const rows = await recurringService.list();
      setItems(rows.filter((row) => row.profileId === activeProfile?.id));
    } catch (error) {
      toast({ title: 'Não foi possível carregar as recorrências', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  useEffect(() => { void load(); }, [activeProfile?.id]);

  const recurringIncome = items.filter((x) => x.active && x.type === 'receita').reduce((a, b) => a + b.amountCents, 0);
  const recurringExpenses = items.filter((x) => x.active && x.type === 'despesa').reduce((a, b) => a + b.amountCents, 0);
  const current = currentMonth();
  const past = useMemo(() => [1, 2, 3].map((n) => getMonthItems(transactions, shiftMonth(current, -n))), [transactions, current]);
  const avgVariableExpenses = Math.round(past.reduce((sum, month) => sum + Math.max(0, sumByType(month, 'despesa') - recurringExpenses), 0) / 3);
  const currentResult = sumByType(getMonthItems(transactions, current), 'receita') - sumByType(getMonthItems(transactions, current), 'despesa');

  let projected = currentResult;
  const forecast = [1, 2, 3].map((offset) => {
    projected += recurringIncome - recurringExpenses - avgVariableExpenses;
    const month = shiftMonth(current, offset);
    return {
      month,
      balance: projected,
      events: items.filter((item) => item.active).map((item) => ({ name: item.description, date: paymentDate(item, month) })).sort((a, b) => a.date.getTime() - b.date.getTime()),
    };
  });

  const add = async () => {
    const cents = parseAmount(amount);
    if (!activeProfile || !description.trim() || cents <= 0) {
      toast({ title: 'Confira os dados', description: 'Informe descrição e valor válidos.', variant: 'destructive' });
      return;
    }
    try {
      await recurringService.create({
        profileId: activeProfile.id,
        type,
        description: description.trim(),
        amountCents: cents,
        category,
        scheduleType,
        dayOfMonth: scheduleType === 'fixed_day' ? day : null,
        businessDayOrdinal: scheduleType === 'business_day' ? businessDayOrdinal : null,
        saturdayPolicy: 'previous_business_day',
        sundayPolicy: 'next_business_day',
        holidayPolicy: 'previous_business_day',
        calendarCode: 'BR-RS-PASSO_FUNDO',
        startsOn: current + '-01',
        endsOn: null,
        active: true,
        notes: null,
      });
      setDescription('');
      setAmount('');
      await load();
      toast({ title: 'Recorrência criada', description: 'A data prevista já entrou na projeção financeira.' });
    } catch (error) {
      toast({ title: 'Não foi possível criar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try { await recurringService.remove(id); await load(); }
    catch (error) { toast({ title: 'Não foi possível excluir', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); }
  };

  return <div className="space-y-7">
    <div><p className="muted-label mb-2">Planejamento financeiro</p><h1 className="font-display text-[29px] font-bold tracking-[-.045em] md:text-[34px]">Previsão<span className="text-primary">.</span></h1><p className="mt-1 text-sm text-muted-foreground">Cadastre rendas e compromissos recorrentes para enxergar os próximos meses.</p></div>
    <div className="grid gap-4 md:grid-cols-3"><div className="surface-card p-5"><p className="muted-label">Renda recorrente</p><p className="number-display mt-3 text-2xl font-bold text-emerald-300">{formatCurrency(recurringIncome)}</p></div><div className="surface-card p-5"><p className="muted-label">Dívidas fixas</p><p className="number-display mt-3 text-2xl font-bold text-rose-300">{formatCurrency(recurringExpenses)}</p></div><div className="surface-card p-5"><p className="muted-label">Média variável estimada</p><p className="number-display mt-3 text-2xl font-bold text-cyan-300">{formatCurrency(avgVariableExpenses)}</p><p className="mt-2 text-xs text-muted-foreground">Base: até 3 meses anteriores</p></div></div>

    <section className="surface-card p-5 md:p-6">
      <h2 className="font-display text-lg font-bold">Nova recorrência</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-6">
        <select className="input-dark" value={type} onChange={(e) => setType(e.target.value as TransactionType)}><option value="despesa">Despesa</option><option value="receita">Receita</option></select>
        <input className="input-dark md:col-span-2" placeholder="Ex.: Salário, aluguel..." value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input-dark" placeholder="R$ 0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="input-dark" value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
        <Button onClick={() => void add()} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <select className="input-dark" value={scheduleType} onChange={(e) => setScheduleType(e.target.value as 'fixed_day' | 'business_day')}><option value="fixed_day">Dia fixo do mês</option><option value="business_day">Nº dia útil do mês</option></select>
        {scheduleType === 'fixed_day'
          ? <input className="input-dark" type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value))} />
          : <select className="input-dark" value={businessDayOrdinal} onChange={(e) => setBusinessDayOrdinal(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}º dia útil</option>)}</select>}
        <div className="rounded-xl border border-border bg-background/30 px-4 py-3 text-xs text-muted-foreground">Passo Fundo/RS · sábado e feriado antecipam · domingo adia</div>
      </div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <section className="surface-card overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-display text-lg font-bold">Recorrências</h2></div>{items.length ? <div className="divide-y divide-border">{items.map((item) => {
        const next = paymentDate(item, shiftMonth(current, 1));
        return <div className="flex items-center gap-3 p-4" key={item.id}><CalendarClock className="h-4 w-4 text-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.description}</p><p className="text-xs text-muted-foreground">{item.scheduleType === 'business_day' ? String(item.businessDayOrdinal) + 'º dia útil' : 'Todo dia ' + String(item.dayOfMonth)} · próxima previsão {formatPaymentDate(next)} · {item.category}</p></div><span className={item.type === 'receita' ? 'text-emerald-300' : 'text-rose-300'}>{item.type === 'receita' ? '+' : '-'} {formatCurrency(item.amountCents)}</span><button onClick={() => void remove(item.id)} className="p-2 text-muted-foreground hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>;
      })}</div> : <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma recorrência cadastrada.</p>}</section>

      <section className="surface-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Projeção de 3 meses</h2><p className="mt-1 text-xs text-muted-foreground">Recorrências + datas previstas + padrão variável</p></div><TrendingUp className="h-5 w-5 text-cyan-300"/></div><div className="mt-5 space-y-3">{forecast.map((row) => <div className="rounded-xl bg-background/40 p-4" key={row.month}><div className="flex items-center justify-between"><span className="capitalize text-sm">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(row.month + '-15T12:00:00'))}</span><strong className={row.balance >= 0 ? 'text-cyan-300' : 'text-rose-300'}>{formatCurrency(row.balance)}</strong></div>{row.events.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">{row.events.slice(0, 4).map((event) => formatPaymentDate(event.date).slice(0, 5) + ' ' + event.name).join(' · ')}</p>}</div>)}</div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Estimativa, não garantia. O calendário usa as regras cadastradas para cada recorrência.</p></section>
    </div>
  </div>;
}
