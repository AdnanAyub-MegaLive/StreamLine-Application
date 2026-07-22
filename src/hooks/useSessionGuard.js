import React from 'react';
import { AppState } from 'react-native';
import { checkUserStatus } from '../api';
import { connectSessionSocket, disconnectSessionSocket } from '../services/socket';
import { clearCachedSeatState, dismissLiveRoomNotification, getStableDeviceId } from '../utils';
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
  const updateSessionUser = useAppStore(state => state.updateSessionUser);
  React.useEffect(() => {
    const publicId = session?.user.publicId;
    const sessionToken = session?.token;
    if (!publicId || !sessionToken) {
      return undefined;
    }
    const knownSessionVersion = session.user.sessionVersion ?? 0;
    const deviceId = getStableDeviceId();
    const handleBanned = status => {
      setBanInfo({
        reason: status.banReason,
        expiresAt: status.banExpiresAt
      });
      clearSession();
      disconnectSessionSocket();
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{
            name: routes.banned
          }]
        });
      }
    };
    // Same flow as handleBanned, but for a device-level ban (the account
    // itself stays active — only this device is locked out). Logging back
    // in from this device is also rejected server-side (login route returns
    // DEVICE_BANNED), so this just needs to boot the current session.
    const handleDeviceBanned = data => {
      setBanInfo({
        reason: data.reason,
        expiresAt: data.banExpiresAt ?? data.deviceBanExpiresAt ?? null
      });
      clearSession();
      disconnectSessionSocket();
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{
            name: routes.banned
          }]
        });
      }
    };
    const handleForceLogout = () => {
      clearSession();
      disconnectSessionSocket();
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{
            name: routes.auth
          }]
        });
      }
    };
    const handleStatus = status => {
      if (status.isBanned) {
        handleBanned(status);
        return;
      }
      // Only from the poll path (checkUserStatus always sends our own
      // deviceId as macAddress), so this always refers to the current
      // device — no need to compare macAddress here like the socket
      // handler below has to.
      if (status.deviceBanned) {
        handleDeviceBanned({ reason: status.deviceBanReason, banExpiresAt: status.deviceBanExpiresAt });
        return;
      }
      if (status.sessionVersion > knownSessionVersion) {
        handleForceLogout();
        return;
      }
      // session/status now also reports the Special ID fields — keep the
      // fallback poll path in sync too, not just the socket push events.
      if (status.id !== undefined) {
        updateSessionUser({
          displayId: status.id,
          specialId: status.specialId ?? null,
          specialIdExpiresAt: status.specialIdExpiresAt ?? null
        });
      }
    };
    // See docs/mobile-special-id.md — the account key (publicId) never
    // changes here, only the cosmetic display fields.
    const handleSpecialIdAssigned = data => {
      updateSessionUser({
        displayId: data.effectiveId ?? data.specialId,
        specialId: data.specialId,
        specialIdExpiresAt: data.expiresAt ?? null
      });
    };
    const handleSpecialIdRevoked = data => {
      updateSessionUser({
        displayId: data.normalId ?? data.effectiveId,
        specialId: null,
        specialIdExpiresAt: null
      });
    };
    // Timed assignments expire on the backend's own schedule (not tied to
    // this app polling anything) — same reset as a manual revoke.
    const handleSpecialIdExpired = data => {
      updateSessionUser({
        displayId: data.normalId,
        specialId: null,
        specialIdExpiresAt: null
      });
    };
    // Fires even when the room screen isn't open (backgrounded room) — see
    // src/services/socket.js for why this still reaches us. Clears the
    // "still live" notification and the local seat cache so re-opening the
    // room never shows stale/ended state.
    const handleAudioRoomEnded = data => {
      dismissLiveRoomNotification();
      if (data?.roomId) {
        clearCachedSeatState(data.roomId);
      }
    };
    // device:banned/unbanned broadcast to ALL of the user's devices, so
    // only act when the payload's macAddress matches this specific device.
    const handleDeviceBannedSocket = data => {
      if (data?.macAddress === deviceId) {
        handleDeviceBanned(data);
      }
    };
    const handleDeviceUnbannedSocket = () => {};

    connectSessionSocket(sessionToken, {
      onStatus: handleStatus,
      onBanned: handleBanned,
      onUnbanned: () => {},
      onForceLogout: handleForceLogout,
      onSpecialIdAssigned: handleSpecialIdAssigned,
      onSpecialIdRevoked: handleSpecialIdRevoked,
      onSpecialIdExpired: handleSpecialIdExpired,
      onAudioRoomEnded: handleAudioRoomEnded,
      // Room went IDLE (auto-released when it emptied, or ended elsewhere)
      // — same cleanup as a moderation event; the room ID itself is
      // retained server-side so no navigation/ban handling is needed here.
      onAudioRoomIdle: handleAudioRoomEnded,
      onDeviceBanned: handleDeviceBannedSocket,
      onDeviceUnbanned: handleDeviceUnbannedSocket
    });
    const runFallbackCheck = async () => {
      const status = await checkUserStatus(sessionToken, deviceId);
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
  }, [session?.user.publicId, session?.token, session?.user.sessionVersion, clearSession, setBanInfo, updateSessionUser]);
}
