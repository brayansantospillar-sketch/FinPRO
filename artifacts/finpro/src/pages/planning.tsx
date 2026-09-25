import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/hooks/use-finance';
import { useProfile } from '@/hooks/use-profile';
import { CATEGORIES, recurringService, type Category, type RecurringEntry, type TransactionType } from '@/lib/finance';
import { currentMonth, formatCurrency, getMonthItems, shiftMonth, sumByType } from '@/lib/finance-utils';
import { useToast } from '@/hooks/use-toast';

const parseAmount = (value: string) => Math.round((Number(value.replace(/\./g, '').replace(',', '.')) || 0) * 100);

export function PlanningPage() {
  const { activeProfile } = useProfile();
  const { transactions } = useFinance();
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringEntry[]>([]);
  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Contas');
  const [day, setDay] = useState(10);

  const load = async () => { const rows = await recurringService.list(); setItems(rows.filter((row) => row.profileId === activeProfile?.id)); };
  useEffect(() => { void load(); }, [activeProfile?.id]);
  const recurringIncome = items.filter((x) => x.active && x.type === 'receita').reduce((a,b) => a+b.amountCents,0);
  const recurringExpenses = items.filter((x) => x.active && x.type === 'despesa').reduce((a,b) => a+b.amountCents,0);
  const current = currentMonth();
  const past = useMemo(() => [1,2,3].map((n) => getMonthItems(transactions, shiftMonth(current,-n))), [transactions, current]);
  const avgVariableExpenses = Math.round(past.reduce((sum, month) => sum + Math.max(0, sumByType(month,'despesa') - recurringExpenses),0) / 3);
  const currentResult = sumByType(getMonthItems(transactions,current),'receita') - sumByType(getMonthItems(transactions,current),'despesa');
  let projected = currentResult;
  const forecast = [1,2,3].map((offset) => { projected += recurringIncome - recurringExpenses - avgVariableExpenses; return { month: shiftMonth(current,offset), balance: projected }; });

  const add = async () => {
    const cents=parseAmount(amount); if(!activeProfile || !description.trim() || cents<=0) return;
    await recurringService.create({ profileId: activeProfile.id, type, description: description.trim(), amountCents:cents, category, dayOfMonth:day, startsOn:`${current}-01`, endsOn:null, active:true, notes:null });
    setDescription(''); setAmount(''); await load(); toast({title:'Recorrência criada',description:'Ela já entrou na sua projeção financeira.'});
  };
  const remove = async(id:string)=>{await recurringService.remove(id); await load();};

  return <div className="space-y-7">
    <div><p className="muted-label mb-2">Planejamento financeiro</p><h1 className="font-display text-[29px] font-bold tracking-[-.045em] md:text-[34px]">Previsão<span className="text-primary">.</span></h1><p className="mt-1 text-sm text-muted-foreground">Cadastre rendas e compromissos recorrentes para enxergar os próximos meses.</p></div>
    <div className="grid gap-4 md:grid-cols-3"><div className="surface-card p-5"><p className="muted-label">Renda recorrente</p><p className="number-display mt-3 text-2xl font-bold text-emerald-300">{formatCurrency(recurringIncome)}</p></div><div className="surface-card p-5"><p className="muted-label">Dívidas fixas</p><p className="number-display mt-3 text-2xl font-bold text-rose-300">{formatCurrency(recurringExpenses)}</p></div><div className="surface-card p-5"><p className="muted-label">Média variável estimada</p><p className="number-display mt-3 text-2xl font-bold text-cyan-300">{formatCurrency(avgVariableExpenses)}</p><p className="mt-2 text-xs text-muted-foreground">Base: até 3 meses anteriores</p></div></div>
    <section className="surface-card p-5 md:p-6"><h2 className="font-display text-lg font-bold">Nova recorrência</h2><div className="mt-5 grid gap-3 md:grid-cols-6"><select className="input-dark" value={type} onChange={e=>setType(e.target.value as TransactionType)}><option value="despesa">Despesa</option><option value="receita">Receita</option></select><input className="input-dark md:col-span-2" placeholder="Ex.: Salário, aluguel..." value={description} onChange={e=>setDescription(e.target.value)} /><input className="input-dark" placeholder="R$ 0,00" value={amount} onChange={e=>setAmount(e.target.value)} /><select className="input-dark" value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORIES.map(x=><option key={x}>{x}</option>)}</select><div className="flex gap-2"><input className="input-dark w-20" type="number" min={1} max={31} value={day} onChange={e=>setDay(Number(e.target.value))}/><Button onClick={()=>void add()} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4"/></Button></div></div></section>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"><section className="surface-card overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-display text-lg font-bold">Recorrências</h2></div>{items.length ? <div className="divide-y divide-border">{items.map(item=><div className="flex items-center gap-3 p-4" key={item.id}><CalendarClock className="h-4 w-4 text-primary"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.description}</p><p className="text-xs text-muted-foreground">Todo dia {item.dayOfMonth} · {item.category}</p></div><span className={item.type==='receita'?'text-emerald-300':'text-rose-300'}>{item.type==='receita'?'+':'-'} {formatCurrency(item.amountCents)}</span><button onClick={()=>void remove(item.id)} className="p-2 text-muted-foreground hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>)}</div>:<p className="p-8 text-center text-sm text-muted-foreground">Nenhuma recorrência cadastrada.</p>}</section>
    <section className="surface-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Projeção de 3 meses</h2><p className="mt-1 text-xs text-muted-foreground">Recorrências + padrão variável recente</p></div><TrendingUp className="h-5 w-5 text-cyan-300"/></div><div className="mt-5 space-y-3">{forecast.map(row=><div className="flex items-center justify-between rounded-xl bg-background/40 p-4" key={row.month}><span className="capitalize text-sm">{new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${row.month}-15T12:00:00`))}</span><strong className={row.balance>=0?'text-cyan-300':'text-rose-300'}>{formatCurrency(row.balance)}</strong></div>)}</div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Estimativa, não garantia: usa as recorrências cadastradas e a média de despesas variáveis dos últimos meses.</p></section></div>
  </div>;
}
