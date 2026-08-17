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
  // This is only a fast local cache of "I successfully submitted just now"
  // — CreateAgencyScreen always re-verifies against the real backend status
  // (GET /api/agencies/my-application) and clears this flag via
  // clearAgencyApplicationSubmitted when the backend says there's no
  // PENDING/APPROVED application after all (e.g. it was REJECTED, or this
  // got set incorrectly), so a stale local flag can't permanently hide the
  // form.
  agencyApplications: {},
  markAgencyApplicationSubmitted: userId => set(state => ({
    agencyApplications: userId ? { ...state.agencyApplications, [userId]: new Date().toISOString() } : state.agencyApplications
  })),
  clearAgencyApplicationSubmitted: userId => set(state => {
    if (!userId || !(userId in state.agencyApplications)) {
      return state;
    }
    const { [userId]: _removed, ...rest } = state.agencyApplications;
    return { agencyApplications: rest };
  }),
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
  }),
  // Shared between the Live and Party tabs (see RegionFilterRow) so
  // picking a region/country in one is still selected when switching to
  // the other, instead of each tab keeping its own separate selection.
  regionFilter: { region: 'all', country: 'all' },
  setRegionFilter: (region, country) => set({
    regionFilter: { region, country }
  })
}), {
  name: 'streamline-auth-session',
  storage: zustandStorage,
  onRehydrateStorage: () => state => {
    state?.setHydrated(true);
  }
}));
