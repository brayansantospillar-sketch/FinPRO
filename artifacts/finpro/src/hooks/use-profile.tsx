import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { profileService, type Profile } from '@/lib/finance';

type ProfileContextValue = {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  selectProfile: (profile: Profile) => void;
  createProfile: (name: string, role: string) => Promise<Profile>;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);
const ACTIVE_KEY = 'finpro.activeProfileId';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const items = await profileService.list();
      setProfiles(items);
      const savedId = localStorage.getItem(ACTIVE_KEY);
      setActiveProfile(items.find((item) => item.id === savedId) ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<ProfileContextValue>(() => ({
    profiles,
    activeProfile,
    loading,
    selectProfile: (profile) => { localStorage.setItem(ACTIVE_KEY, profile.id); setActiveProfile(profile); },
    createProfile: async (name, role) => { const profile = await profileService.create({ name, role }); setProfiles((items) => [...items, profile]); return profile; },
    clearProfile: () => { localStorage.removeItem(ACTIVE_KEY); setActiveProfile(null); },
  }), [activeProfile, loading, profiles]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  return context;
};
