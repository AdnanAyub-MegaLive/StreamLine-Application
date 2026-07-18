import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
const authStorage = createMMKV({
  id: 'streamline-auth-storage'
});
const zustandStorage = createJSONStorage(() => ({
  getItem: name => authStorage.getString(name) ?? null,
  setItem: (name, value) => {
    authStorage.set(name, value);
  },
  removeItem: name => {
    authStorage.remove(name);
  }
}));
export const useAppStore = create()(persist(set => ({
  session: null,
  hasHydrated: false,
  banInfo: null,
  setSession: session => set({
    session
  }),
  clearSession: () => set({
    session: null
  }),
  completeOnboarding: () => set(state => ({
    session: state.session ? {
      ...state.session,
      onboardingComplete: true
    } : state.session
  })),
  setHydrated: value => set({
    hasHydrated: value
  }),
  setBanInfo: banInfo => set({
    banInfo
  }),
  clearBanInfo: () => set({
    banInfo: null
  })
}), {
  name: 'streamline-auth-session',
  storage: zustandStorage,
  onRehydrateStorage: () => state => {
    state?.setHydrated(true);
  }
}));
