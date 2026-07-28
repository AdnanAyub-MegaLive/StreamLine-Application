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
  // Keyed by the user's publicId (not global) so multiple accounts signing
  // in on the same device each get their own submitted/not-submitted state.
  // There's no backend endpoint yet to check application status server-side
  // (see docs/agency-application-spec.md), so this locally remembers a
  // successful submission and blocks the Create Agency form from being
  // shown again for that account on this device.
  agencyApplications: {},
  markAgencyApplicationSubmitted: userId => set(state => ({
    agencyApplications: userId ? { ...state.agencyApplications, [userId]: new Date().toISOString() } : state.agencyApplications
  })),
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
  // Merges a partial user update (e.g. a Special ID assignment/revocation
  // pushed over the socket) without touching anything else on the session.
  updateSessionUser: userPatch => set(state => ({
    session: state.session ? {
      ...state.session,
      user: { ...state.session.user, ...userPatch }
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
