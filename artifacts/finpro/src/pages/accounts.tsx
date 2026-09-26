import { useEffect, useState } from 'react';
import { CreditCard, Landmark, Plus, Trash2, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { financialAccountService, type FinancialAccount, type FinancialAccountKind } from '@/lib/finance';
import { useProfile } from '@/hooks/use-profile';
import { useToast } from '@/hooks/use-toast';

export function AccountsPage() {
  const { activeProfile } = useProfile();
  const { toast } = useToast();
  const [items, setItems] = useState<FinancialAccount[]>([]);
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [kind, setKind] = useState<FinancialAccountKind>('credit_card');

  const load = async () => setItems(await financialAccountService.list());
  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    try {
      await financialAccountService.create({ profileId: activeProfile?.id ?? null, name: name.trim(), institutionName: institutionName.trim() || null, kind, lastFour: lastFour || null });
      setName(''); setInstitutionName(''); setLastFour(''); await load();
      toast({ title: 'Conta adicionada', description: 'A base para sincronização financeira já está pronta.' });
    } catch (error) { toast({ title: 'Não foi possível adicionar', description: error instanceof Error ? error.message : 'Tente novamente.', variant: 'destructive' }); }
  };

  const remove = async (id: string) => { await financialAccountService.remove(id); await load(); };

  return <div className="space-y-7">
    <div><p className="muted-label mb-2">Estrutura financeira</p><h1 className="font-display text-[29px] font-bold tracking-[-.045em] md:text-[34px]">Contas e cartões<span className="text-primary">.</span></h1><p className="mt-1 text-sm text-muted-foreground">Organize onde seu dinheiro está. Esta estrutura será usada pela futura conexão Open Finance.</p></div>
    <section className="surface-card p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Adicionar conta ou cartão</h2><p className="mt-1 text-xs text-muted-foreground">Por enquanto o cadastro é manual. Nenhuma senha bancária é solicitada.</p></div><Wifi className="h-5 w-5 text-cyan-300"/></div><div className="mt-5 grid gap-3 md:grid-cols-5"><select className="input-dark" value={kind} onChange={(e)=>setKind(e.target.value as FinancialAccountKind)}><option value="credit_card">Cartão de crédito</option><option value="checking">Conta corrente</option><option value="savings">Poupança</option><option value="cash">Dinheiro</option></select><input className="input-dark" placeholder="Nome: Nubank, Visa..." value={name} onChange={(e)=>setName(e.target.value)}/><input className="input-dark" placeholder="Instituição" value={institutionName} onChange={(e)=>setInstitutionName(e.target.value)}/><input className="input-dark" placeholder="Últimos 4 dígitos" maxLength={4} value={lastFour} onChange={(e)=>setLastFour(e.target.value.replace(/\D/g,''))}/><Button onClick={()=>void add()} className="bg-primary text-primary-foreground"><Plus className="h-4 w-4"/> Adicionar</Button></div></section>
    <section className="surface-card overflow-hidden"><div className="border-b border-border p-5"><h2 className="font-display text-lg font-bold">Suas contas</h2></div>{items.length ? <div className="divide-y divide-border">{items.map((item)=><div key={item.id} className="flex items-center gap-4 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{item.kind==='credit_card'?<CreditCard className="h-5 w-5"/>:<Landmark className="h-5 w-5"/>}</span><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.institutionName || 'Sem instituição'}{item.lastFour ? ' · •••• ' + item.lastFour : ''} · {item.source === 'open_finance' ? 'Sincronizado' : 'Manual'}</p></div><button onClick={()=>void remove(item.id)} className="p-2 text-muted-foreground hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>)}</div>:<p className="p-8 text-center text-sm text-muted-foreground">Nenhuma conta ou cartão cadastrado.</p>}</section>
    <section className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5"><p className="text-sm font-semibold">Próxima etapa: conectar instituição financeira</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">A estrutura já separa dados manuais de dados vindos de Open Finance, incluindo identificadores externos, status de sincronização, saldo, limite e datas de fatura. O consentimento bancário será feito pelo provedor, sem armazenar sua senha do banco no FinPRO.</p></section>
  </div>;
}
