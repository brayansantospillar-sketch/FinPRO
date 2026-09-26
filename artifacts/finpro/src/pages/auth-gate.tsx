import { useState } from 'react';
import { LockKeyhole, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function AuthGate() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.trim() || password.length < 8) return setError('Informe um e-mail válido e uma senha com pelo menos 8 caracteres.');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password); else await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-background px-5 py-10 text-foreground">
    <div className="mx-auto grid min-h-[80vh] max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:grid-cols-2">
      <section className="hidden bg-primary/10 p-10 md:flex md:flex-col md:justify-between">
        <div className="flex items-center gap-3"><WalletCards className="h-8 w-8 text-primary"/><span className="font-display text-2xl font-bold">FinPRO</span></div>
        <div><p className="muted-label">Seu dinheiro, sua família</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Planejamento financeiro com privacidade desde a entrada.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">A conta protege a família. Depois do login, você escolhe quem está usando: você, sua esposa ou outro perfil.</p></div>
      </section>
      <section className="flex items-center p-7 md:p-12">
        <div className="w-full">
          <LockKeyhole className="mb-5 h-8 w-8 text-primary"/>
          <p className="muted-label">{mode === 'login' ? 'Acesso seguro' : 'Criar conta'}</p>
          <h2 className="mt-2 font-display text-3xl font-bold">{mode === 'login' ? 'Entrar no FinPRO' : 'Começar no FinPRO'}</h2>
          <div className="mt-7 space-y-3">
            <input className="input-dark w-full" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="input-dark w-full" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Senha (mínimo 8 caracteres)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') void submit();}} />
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <Button disabled={busy || loading} onClick={()=>void submit()} className="w-full bg-primary text-primary-foreground">{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</Button>
          </div>
          <button className="mt-5 text-sm text-primary hover:underline" onClick={()=>{setMode(mode==='login'?'register':'login');setError('');}}>
            {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
          </button>
        </div>
      </section>
    </div>
  </main>;
}
