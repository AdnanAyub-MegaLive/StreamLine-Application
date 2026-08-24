import React from 'react';
// Imported directly (not via '../hooks') to avoid a circular import:
// hooks/index.js re-exports useSessionGuard, which imports
// useActiveRoomSession from this file — going through the barrel here
// would close that loop and risk useLiveKitAudio resolving as undefined
// depending on module evaluation order.
import { useLiveKitAudio } from '../hooks/useLiveKitAudio';

// Mounted once at the app root (see App.jsx) — outside RoomScreen's own
// mount/unmount lifecycle — so the actual LiveKit connection survives
// navigating away from RoomScreen. useLiveKitAudio()'s internal state
// (roomRef, listenersRef, etc.) is 100% component-local: if it were called
// inside RoomScreen itself (as it used to be), every ref would be destroyed
// the instant RoomScreen unmounted, killing the real-time audio connection
// even when the user chose "Keep" specifically to keep it alive. Calling
// the hook here instead means the same Room instance persists across
// RoomScreen mounting/unmounting for the same room.
const ActiveRoomSessionContext = React.createContext(null);

export function ActiveRoomSessionProvider({ children }) {
  const liveKitAudio = useLiveKitAudio();
  // The roomId this session is currently attached to (or was attached to
  // before backgrounding) — lets a remounted RoomScreen tell "this is the
  // same room I backgrounded, don't reconnect" apart from "this is a
  // different room, connect fresh". Deliberately a ref, not useState — the
  // connect effect below both reads and writes this from inside itself;
  // if it were reactive state, writing it would re-run that same effect
  // (a dependency changing), whose cleanup would then immediately disconnect
  // the connection it had just finished establishing (keepInBackgroundRef
  // wouldn't be set yet in the normal, non-Keep case). Nothing here needs
  // to trigger a re-render — it only needs to be read/written.
  const activeRoomIdRef = React.useRef(null);

  const value = React.useMemo(
    () => ({
      liveKitAudio,
      getActiveRoomId: () => activeRoomIdRef.current,
      setActiveRoomId: roomId => {
        activeRoomIdRef.current = roomId;
      }
    }),
    [liveKitAudio]
  );

  return <ActiveRoomSessionContext.Provider value={value}>{children}</ActiveRoomSessionContext.Provider>;
}

export function useActiveRoomSession() {
  const context = React.useContext(ActiveRoomSessionContext);
  if (!context) {
    throw new Error('useActiveRoomSession must be used within an ActiveRoomSessionProvider');
  }
  return context;
}

export default ActiveRoomSessionProvider;
