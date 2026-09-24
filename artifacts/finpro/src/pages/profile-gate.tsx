import { useState } from 'react';
import { Plus, UserRound, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';

export function ProfileGate() {
  const { profiles, loading, selectProfile, createProfile } = useProfile();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Membro');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    try {
      const profile = await createProfile(name.trim(), role.trim() || 'Membro');
      selectProfile(profile);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar o perfil.');
    }
  };

  return <div className="flex min-h-dvh items-center justify-center bg-background p-5">
    <div className="w-full max-w-3xl">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><WalletCards className="h-6 w-6" /></div>
        <h1 className="font-display text-3xl font-bold">Quem está usando o Fin<span className="text-primary">Pro</span>?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Escolha seu perfil para entrar no painel financeiro da família.</p>
      </div>
      {loading ? <div className="text-center text-sm text-muted-foreground">Carregando perfis...</div> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => <button key={profile.id} onClick={() => selectProfile(profile)} className="surface-card group p-6 text-left transition hover:border-primary/60 hover:bg-accent/30">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/15 font-bold text-cyan-300">{profile.name.split(' ').map((p) => p[0]).join('').slice(0,2).toUpperCase()}</div>
          <p className="font-display text-lg font-bold">{profile.name}</p><p className="mt-1 text-xs text-muted-foreground">{profile.role}</p>
        </button>)}
        <button onClick={() => setCreating(true)} className="surface-card flex min-h-40 flex-col items-center justify-center gap-3 border-dashed p-6 text-muted-foreground transition hover:border-primary/60 hover:text-primary"><Plus className="h-6 w-6" /><span className="text-sm font-semibold">Criar perfil</span></button>
      </div>}
      {creating && <div className="surface-card mx-auto mt-6 max-w-md p-5"><h2 className="font-display font-bold">Novo perfil</h2><div className="mt-4 space-y-3"><input className="input-dark" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} autoFocus /><input className="input-dark" placeholder="Ex.: Brayan, Esposa, Filho..." value={role} onChange={(e) => setRole(e.target.value)} />{error && <p className="text-xs text-rose-300">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button><Button onClick={() => void submit()} className="bg-primary text-primary-foreground"><UserRound className="h-4 w-4" /> Criar e entrar</Button></div></div></div>}
    </div>
  </div>;
}
