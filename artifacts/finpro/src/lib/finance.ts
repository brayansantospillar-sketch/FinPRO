export const CATEGORIES = ['Alimentação', 'Mercado', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Compras', 'Lazer', 'Assinaturas', 'Contas', 'Investimentos', 'Salário', 'Outros'] as const;
export type Category = typeof CATEGORIES[number];
export type TransactionType = 'receita' | 'despesa';
export type FinancialAccountKind = 'checking' | 'savings' | 'credit_card' | 'cash';
export type FinancialAccount = { id: string; householdId: string; profileId?: string | null; name: string; institutionName?: string | null; kind: FinancialAccountKind; lastFour?: string | null; currency: string; source: 'manual' | 'open_finance'; provider?: string | null; externalAccountId?: string | null; connectionId?: string | null; balanceCents?: number | null; creditLimitCents?: number | null; closingDay?: number | null; dueDay?: number | null; syncStatus: string; lastSyncedAt?: string | null; createdAt: string; updatedAt: string };
export type AuthUser = { id: string; email: string; householdId: string };
export type Profile = { id: string; name: string; role: string; isDefault: boolean; createdAt: string; updatedAt: string };
export type Transaction = { id: string; profileId?: string | null; type: TransactionType; description: string; amountCents: number; category: Category; date: string; notes?: string | null; createdAt: string; updatedAt?: string };
export type RecurringEntry = { id: string; profileId: string; type: TransactionType; description: string; amountCents: number; category: Category; scheduleType: 'fixed_day'|'business_day'; dayOfMonth?: number | null; businessDayOrdinal?: number | null; saturdayPolicy: 'previous_business_day'|'next_business_day'; sundayPolicy: 'previous_business_day'|'next_business_day'; holidayPolicy: 'previous_business_day'|'next_business_day'; calendarCode: string; startsOn: string; endsOn?: string | null; active: boolean; notes?: string | null; createdAt: string; updatedAt: string };
export type RecurringEntryInput = Omit<RecurringEntry, 'id' | 'createdAt' | 'updatedAt' | 'scheduleType' | 'dayOfMonth' | 'businessDayOrdinal' | 'saturdayPolicy' | 'sundayPolicy' | 'holidayPolicy' | 'calendarCode'> & { scheduleType?: 'fixed_day'|'business_day'; dayOfMonth?: number | null; businessDayOrdinal?: number | null; saturdayPolicy?: 'previous_business_day'|'next_business_day'; sundayPolicy?: 'previous_business_day'|'next_business_day'; holidayPolicy?: 'previous_business_day'|'next_business_day'; calendarCode?: string };
export type TransactionInput = Pick<Transaction, 'type' | 'description' | 'amountCents' | 'category' | 'date'> & { profileId?: string | null; notes?: string };

const API_BASE_URL = '/api';

export const authService = {
  me: () => request<AuthUser>('/auth/me'),
  register: (input: { email: string; password: string; householdName?: string }) => request<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message ?? `Não foi possível concluir a operação (HTTP ${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const financialAccountService = {
  list: () => request<FinancialAccount[]>('/financial-accounts'),
  create: (input: { profileId?: string | null; name: string; institutionName?: string | null; kind: FinancialAccountKind; lastFour?: string | null }) => request<FinancialAccount>('/financial-accounts', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/financial-accounts/${id}`, { method: 'DELETE' }),
};

export const financeService = {
  list: () => request<Transaction[]>('/transactions'),
  create: (input: TransactionInput) => request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: TransactionInput) => request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};

export const profileService = {
  list: () => request<Profile[]>('/profiles'),
  create: (input: { name: string; role: string }) => request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name: string; role: string }) => request<Profile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
};


export const recurringService = {
  list: () => request<RecurringEntry[]>('/recurring-entries'),
  create: (input: RecurringEntryInput) => request<RecurringEntry>('/recurring-entries', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: RecurringEntryInput) => request<RecurringEntry>(`/recurring-entries/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/recurring-entries/${id}`, { method: 'DELETE' }),
};
