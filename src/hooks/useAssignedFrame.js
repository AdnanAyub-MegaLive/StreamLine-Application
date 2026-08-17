import { useUserAssets } from './useUserAssets';

// Thin wrapper over the centralized resolver (see useUserAssets) — kept so
// existing call sites (Avatar's frameUri prop for the signed-in user's own
// avatar) don't need to change.
//
// Pass { userId, frameUrl } to resolve someone ELSE's equipped frame (e.g.
// a room's identity panel always represents the OWNER, not necessarily
// whoever's device is currently viewing it) — omitting them only ever
// resolves the current session user's own frame.
export function useAssignedFrame({ userId, frameUrl } = {}) {
  return useUserAssets({ userId, frameUrl }).frameUri;
}

export default useAssignedFrame;
