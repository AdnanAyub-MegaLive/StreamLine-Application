import { useUserAssets } from './useUserAssets';

// Thin wrapper over the centralized resolver (see useUserAssets) — kept so
// the existing call site (Room screen's background) doesn't need to
// change. Only `source` is used by any caller today.
export function useAssignedRoomBackground() {
  const { roomBackgroundSource } = useUserAssets();
  return { asset: null, source: roomBackgroundSource };
}

export default useAssignedRoomBackground;
