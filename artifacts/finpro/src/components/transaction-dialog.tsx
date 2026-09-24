import { useEffect, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CATEGORIES, type Transaction, type TransactionInput } from '@/lib/finance';
import { formatLongDate } from '@/lib/finance-utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const parseAmount = (value: string) => { const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'); const number = Number(normalized); return Number.isFinite(number) ? Math.round(number * 100) : 0; };
const displayAmount = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
const blank = (): TransactionInput => ({ type: 'despesa', description: '', amountCents: 0, category: 'Outros', date: today(), notes: '' });

export function TransactionDialog({ open, onOpenChange, transaction, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; transaction?: Transaction | null; onSubmit: (input: TransactionInput) => void | Promise<void> }) {
  const [form, setForm] = useState<TransactionInput>(blank());
  const [amount, setAmount] = useState('');
  useEffect(() => { if (open) { const initial = transaction ? { type: transaction.type, description: transaction.description, amountCents: transaction.amountCents, category: transaction.category, date: transaction.date, notes: transaction.notes ?? '' } : blank(); setForm(initial); setAmount(transaction ? displayAmount(transaction.amountCents) : ''); } }, [open, transaction]);
  const update = <K extends keyof TransactionInput>(key: K, value: TransactionInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!form.description.trim() || parseAmount(amount) <= 0) return; await onSubmit({ ...form, description: form.description.trim(), amountCents: parseAmount(amount) }); };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="border-card-border bg-card p-0 sm:max-w-[560px]">
      <form onSubmit={submit}>
        <DialogHeader className="border-b border-border px-6 pb-5 pt-6 text-left"><DialogTitle className="font-display text-xl">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle><DialogDescription className="mt-1 text-muted-foreground">{transaction ? `Atualize os detalhes de ${formatLongDate(transaction.date)}.` : 'Registre uma entrada ou saída para manter seu cockpit em dia.'}</DialogDescription></DialogHeader>
        <div className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-background/55 p-1">
            <button type="button" onClick={() => update('type', 'despesa')} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${form.type === 'despesa' ? 'bg-rose-500/12 text-rose-300' : 'text-muted-foreground'}`} data-testid="button-type-expense"><ArrowDownLeft className="h-4 w-4" /> Despesa</button>
            <button type="button" onClick={() => update('type', 'receita')} className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${form.type === 'receita' ? 'bg-emerald-500/12 text-emerald-300' : 'text-muted-foreground'}`} data-testid="button-type-income"><ArrowUpRight className="h-4 w-4" /> Receita</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Descrição</span><input className="input-dark" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Ex.: Mercado do mês" autoFocus data-testid="input-description" /></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Valor</span><div className="relative"><span className="absolute left-3 top-[11px] text-sm text-muted-foreground">R$</span><input className="input-dark pl-10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" data-testid="input-amount" /></div></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Categoria</span><select className="input-dark select-dark" value={form.category} onChange={(e) => update('category', e.target.value as TransactionInput['category'])} data-testid="select-category">{CATEGORIES.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
            <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Data</span><input className="input-dark" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} data-testid="input-date" /></label>
          </div>
          <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Observação <span className="font-normal opacity-70">(opcional)</span></span><textarea className="input-dark min-h-[76px] resize-none" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Algum detalhe para lembrar depois?" data-testid="input-notes" /></label>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-transaction">Cancelar</Button><Button type="submit" className="bg-primary font-semibold text-primary-foreground" data-testid="button-save-transaction">{transaction ? 'Salvar alterações' : 'Adicionar lançamento'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export function DeleteDialog({ open, onOpenChange, transaction, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; transaction?: Transaction | null; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-card-border bg-card sm:max-w-[430px]"><DialogHeader className="text-left"><DialogTitle className="font-display text-xl">Excluir lançamento?</DialogTitle><DialogDescription className="pt-2 leading-relaxed">O lançamento <strong className="text-foreground">{transaction?.description}</strong> será removido permanentemente. Essa ação não pode ser desfeita.</DialogDescription></DialogHeader><DialogFooter className="mt-5"><Button variant="ghost" onClick={() => onOpenChange(false)} data-testid="button-cancel-delete">Manter</Button><Button variant="destructive" onClick={onConfirm} data-testid="button-confirm-delete">Excluir lançamento</Button></DialogFooter></DialogContent></Dialog>;
}