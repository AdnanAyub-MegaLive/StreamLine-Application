import { useUserAssets } from './useUserAssets';

// Thin wrapper over the centralized resolver (see useUserAssets) — kept so
// the existing call site (Room screen's background) doesn't need to
// change much. Only `source` is used by any caller today.
//
// Pass { userId, roomBackgroundUrl } when resolving someone ELSE's room
// background (e.g. a viewer looking at the room owner's chosen
// background) — omitting them only ever resolves the current session
// user's own assignment, which silently renders nothing for every other
// room member. See useUserAssets' explicitUrl doc for why.
export function useAssignedRoomBackground({ userId, roomBackgroundUrl } = {}) {
  const { roomBackgroundSource } = useUserAssets({ userId, roomBackgroundUrl });
  return { asset: null, source: roomBackgroundSource };
}

export default useAssignedRoomBackground;
