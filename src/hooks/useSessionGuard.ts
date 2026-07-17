import React from 'react';
import { AppState } from 'react-native';
import type { UserStatus } from '../api';
import { checkUserStatus } from '../api';
import { connectSessionSocket, disconnectSessionSocket } from '../services/socket';
import { useAppStore } from '../store';
import { navigationRef } from '../navigation/navigationRef';
import { routes } from '../navigation/routes';

// Fallback interval only — the socket connection in src/services/socket.ts
// delivers ban/unban/force-logout events instantly. This just covers the
// window before the socket connects and any missed events after a dropped
// connection.
const FALLBACK_CHECK_INTERVAL = 60000;

export function useSessionGuard() {
  const session = useAppStore(state => state.session);
  const clearSession = useAppStore(state => state.clearSession);
  const setBanInfo = useAppStore(state => state.setBanInfo);

  React.useEffect(() => {
    const publicId = session?.user.publicId;
    const sessionToken = session?.token;

    if (!publicId || !sessionToken) {
      return undefined;
    }

    const knownSessionVersion = session.user.sessionVersion ?? 0;

    const handleBanned = (status: UserStatus) => {
      setBanInfo({ reason: status.banReason, expiresAt: status.banExpiresAt });
      clearSession();
      disconnectSessionSocket();

      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: routes.banned }] });
      }
    };

    const handleForceLogout = () => {
      clearSession();
      disconnectSessionSocket();

      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: routes.auth }] });
      }
    };

    const handleStatus = (status: UserStatus) => {
      if (status.isBanned) {
        handleBanned(status);
        return;
      }

      if (status.sessionVersion > knownSessionVersion) {
        handleForceLogout();
      }
    };

    connectSessionSocket(sessionToken, {
      onStatus: handleStatus,
      onBanned: handleBanned,
      onUnbanned: () => {},
      onForceLogout: handleForceLogout,
    });

    const runFallbackCheck = async () => {
      const status = await checkUserStatus(sessionToken);

      if (status) {
        handleStatus(status);
      }
    };

    runFallbackCheck();

    const interval = setInterval(runFallbackCheck, FALLBACK_CHECK_INTERVAL);
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        runFallbackCheck();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      disconnectSessionSocket();
    };
  }, [session?.user.publicId, session?.token, session?.user.sessionVersion, clearSession, setBanInfo]);
}
