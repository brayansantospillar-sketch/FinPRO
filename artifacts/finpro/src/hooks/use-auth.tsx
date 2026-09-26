import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService, type AuthUser } from '@/lib/finance';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { authService.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading,
    register: async (email, password) => { setUser(await authService.register({ email, password, householdName: 'Minha família' })); },
    login: async (email, password) => { setUser(await authService.login({ email, password })); },
    logout: async () => { await authService.logout(); localStorage.removeItem('finpro.activeProfileId'); setUser(null); },
  }), [loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return value;
}
