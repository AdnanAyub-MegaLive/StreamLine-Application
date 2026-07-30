import { useUserAssets } from './useUserAssets';

// Thin wrapper over the centralized resolver (see useUserAssets) — kept so
// existing call sites (Avatar's frameUri prop for the signed-in user's own
// avatar) don't need to change.
export function useAssignedFrame() {
  return useUserAssets().frameUri;
}

export default useAssignedFrame;
