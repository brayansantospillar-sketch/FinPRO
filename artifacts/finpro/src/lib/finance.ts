export const CATEGORIES = ['Alimentação', 'Mercado', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Compras', 'Lazer', 'Assinaturas', 'Contas', 'Investimentos', 'Salário', 'Outros'] as const;
export type Category = typeof CATEGORIES[number];
export type TransactionType = 'receita' | 'despesa';
export type Profile = { id: string; name: string; role: string; isDefault: boolean; createdAt: string; updatedAt: string };
export type Transaction = { id: string; profileId?: string | null; type: TransactionType; description: string; amountCents: number; category: Category; date: string; notes?: string | null; createdAt: string; updatedAt?: string };
export type TransactionInput = Pick<Transaction, 'type' | 'description' | 'amountCents' | 'category' | 'date'> & { profileId?: string | null; notes?: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const data = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(data?.message ?? 'Não foi possível concluir a operação.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const financeService = {
  list: () => request<Transaction[]>('/api/transactions'),
  create: (input: TransactionInput) => request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: TransactionInput) => request<Transaction>(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/api/transactions/${id}`, { method: 'DELETE' }),
};

export const profileService = {
  list: () => request<Profile[]>('/api/profiles'),
  create: (input: { name: string; role: string }) => request<Profile>('/api/profiles', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name: string; role: string }) => request<Profile>(`/api/profiles/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
};
