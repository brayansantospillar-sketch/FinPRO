import type { Transaction } from '@/lib/finance';

export const formatCurrency = (cents: number, compact = false) => {
  if (compact && Math.abs(cents) >= 100000) return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(cents / 100);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};
export const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '');
export const formatLongDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
export const currentMonth = () => new Date().toISOString().slice(0, 7);
export const monthLabel = (month = currentMonth()) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-15T12:00:00`));
export const sumByType = (items: Transaction[], type: Transaction['type']) => items.filter((item) => item.type === type).reduce((total, item) => total + item.amountCents, 0);
export const getMonthItems = (items: Transaction[], month = currentMonth()) => items.filter((item) => item.date.slice(0, 7) === month);
export const getCategoryTotals = (items: Transaction[]) => Object.entries(items.filter((item) => item.type === 'despesa').reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.category]: (acc[item.category] ?? 0) + item.amountCents }), {})).sort((a, b) => b[1] - a[1]);
export const shiftMonth = (month: string, offset: number) => {
  const [year, value] = month.split('-').map(Number);
  const date = new Date(year, value - 1 + offset, 15, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
export const percentageChange = (current: number, previous: number) => previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;
export const getMonthlyHistory = (items: Transaction[], months = 6, endMonth = currentMonth()) =>
  Array.from({ length: months }, (_, index) => shiftMonth(endMonth, index - months + 1)).map((month) => {
    const monthItems = getMonthItems(items, month);
    const income = sumByType(monthItems, 'receita');
    const expenses = sumByType(monthItems, 'despesa');
    return { month, label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${month}-15T12:00:00`)).replace('.', ''), income, expenses, result: income - expenses };
  });
export const getCashFlow = (items: Transaction[]) => {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date.toISOString().slice(0, 10); });
  return days.map((date) => ({ date, label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', ''), receita: sumByType(items.filter((item) => item.date === date), 'receita') / 100, despesa: sumByType(items.filter((item) => item.date === date), 'despesa') / 100 }));
};
export const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
