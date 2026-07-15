import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '@/types';

type AppState = {
  session: AuthSession | null;
  hasHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  completeOnboarding: () => void;
  setHydrated: (value: boolean) => void;
};

const authStorage = createMMKV({ id: 'streamline-auth-storage' });

const zustandStorage = createJSONStorage<AppState>(() => ({
  getItem: name => authStorage.getString(name) ?? null,
  setItem: (name, value) => {
    authStorage.set(name, value);
  },
  removeItem: name => {
    authStorage.remove(name);
  },
}));

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      session: null,
      hasHydrated: false,
      setSession: session => set({ session }),
      clearSession: () => set({ session: null }),
      completeOnboarding: () =>
        set(state => ({
          session: state.session ? { ...state.session, onboardingComplete: true } : state.session,
        })),
      setHydrated: value => set({ hasHydrated: value }),
    }),
    {
      name: 'streamline-auth-session',
      storage: zustandStorage,
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
    },
  ),
);
