import { useUserAssets } from './useUserAssets';

// Thin wrapper over the centralized resolver (see useUserAssets) — kept so
// existing call sites don't need to change.
export function useAssignedBadge() {
  return useUserAssets().badgeUri;
}

export default useAssignedBadge;
