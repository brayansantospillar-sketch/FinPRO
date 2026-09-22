export const CATEGORIES = ['Alimentação', 'Mercado', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Compras', 'Lazer', 'Assinaturas', 'Contas', 'Investimentos', 'Salário', 'Outros'] as const;
export type Category = typeof CATEGORIES[number];
export type TransactionType = 'receita' | 'despesa';
export type Transaction = { id: string; type: TransactionType; description: string; amountCents: number; category: Category; date: string; notes?: string; createdAt: string };
export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>;

const STORAGE_KEY = 'finpro:transactions:v1';
const isoDate = (offset: number) => { const date = new Date(); date.setDate(date.getDate() - offset); return date.toISOString().slice(0, 10); };
const created = (id: string, type: TransactionType, description: string, amountCents: number, category: Category, date: string, notes = ''): Transaction => ({ id, type, description, amountCents, category, date, notes, createdAt: new Date(`${date}T12:00:00`).toISOString() });

const seedTransactions = (): Transaction[] => [
  created('seed-1', 'receita', 'Salário mensal', 865000, 'Salário', isoDate(2), 'Pagamento referente ao mês'),
  created('seed-2', 'despesa', 'Aluguel do apartamento', 238000, 'Moradia', isoDate(4)),
  created('seed-3', 'despesa', 'Supermercado da semana', 38640, 'Mercado', isoDate(5)),
  created('seed-4', 'despesa', 'Restaurante Quintal', 8720, 'Alimentação', isoDate(7)),
  created('seed-5', 'receita', 'Projeto freelance', 145000, 'Outros', isoDate(9)),
  created('seed-6', 'despesa', 'Mensalidade academia', 11990, 'Saúde', isoDate(11)),
  created('seed-7', 'despesa', 'Uber e transporte', 6420, 'Transporte', isoDate(13)),
  created('seed-8', 'despesa', 'Streaming e música', 5490, 'Assinaturas', isoDate(15)),
  created('seed-9', 'despesa', 'Curso de fotografia', 7200, 'Educação', isoDate(19)),
  created('seed-10', 'despesa', 'Cinema com amigos', 4600, 'Lazer', isoDate(23)),
  created('seed-11', 'despesa', 'Conta de energia', 17840, 'Contas', isoDate(26)),
  created('seed-12', 'receita', 'Venda de equipamento', 82000, 'Outros', isoDate(31)),
];

const read = (): Transaction[] => {
  if (typeof window === 'undefined') return seedTransactions();
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (!value) { const initial = seedTransactions(); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); return initial; }
  try { return JSON.parse(value) as Transaction[]; } catch { const initial = seedTransactions(); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); return initial; }
};
const write = (transactions: Transaction[]) => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); return transactions; };
const uid = () => `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const financeService = {
  list: () => [...read()].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  create: (input: TransactionInput) => { const next = { ...input, id: uid(), createdAt: new Date().toISOString() }; write([...read(), next]); return next; },
  update: (id: string, input: TransactionInput) => { const next = read().map((item) => item.id === id ? { ...item, ...input } : item); write(next); return next.find((item) => item.id === id); },
  remove: (id: string) => { write(read().filter((item) => item.id !== id)); },
};