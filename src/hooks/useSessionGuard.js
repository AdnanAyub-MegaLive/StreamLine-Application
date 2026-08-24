import React from 'react';
import { AppState } from 'react-native';
import { checkUserStatus } from '../api';
import { connectSessionSocket, disconnectSessionSocket } from '../services/socket';
import { showAlert } from '../components';
import { clearCachedSeatState, dismissLiveRoomNotification, getStableDeviceId } from '../utils';
import { useAppStore } from '../store';
import { navigationRef } from '../navigation/navigationRef';
import { routes } from '../navigation/routes';
import { useActiveRoomSession } from '../providers/ActiveRoomSessionProvider';

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
  const { liveKitAudio, getActiveRoomId, setActiveRoomId } = useActiveRoomSession();
  React.useEffect(() => {
    const publicId = session?.user.publicId;
    const sessionToken = session?.token;
    if (!publicId || !sessionToken) {
      return undefined;
    }
    const knownSessionVersion = session.user.sessionVersion ?? 0;
    const deviceId = getStableDeviceId();
    const handleBanned = status => {
      if (!status) {
        return;
      }
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
   
    const FORCE_LOGOUT_MESSAGES = {
      PASSWORD_RESET: 'Your password was reset by an administrator. Please log in again with your new password.',
      ACCOUNT_DELETED: 'Your account has been deleted.'
    };
    const handleForceLogout = data => {
      const reason = data?.reason;
      const adminReason = data?.adminReason;
      const knownMessage = FORCE_LOGOUT_MESSAGES[reason];
      let message = knownMessage ?? (reason
        ? `An administrator logged you out.\nReason: ${reason}`
        : 'An administrator logged you out of your account.');
      if (adminReason && message !== `An administrator logged you out.\nReason: ${adminReason}`) {
        message += `\nReason: ${adminReason}`;
      }
      showAlert('Logged Out by Administrator', message);
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
      if (!status) {
        return;
      }
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
      // Same idea for isVerified/isOfficial/role(s) — an admin marking this
      // account official (or changing its role) from the portal should show
      // up here on the next poll, not just after the user logs out and back
      // in.
      if (status.isOfficial !== undefined || status.isVerified !== undefined || status.role !== undefined) {
        updateSessionUser({
          isVerified: Boolean(status.isVerified),
          isOfficial: Boolean(status.isOfficial),
          role: status.role,
          roles: status.roles ?? []
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
    //
    // BUGFIX: a room kept in the background (see RoomScreen's "Keep" choice
    // and ActiveRoomSessionProvider) stays genuinely connected to LiveKit
    // with no RoomScreen mounted to react to socket events itself — without
    // this, a backgrounded room that gets terminated/blocked/deleted (or
    // ended by its owner) left the LiveKit connection dangling forever,
    // since nothing else was listening once its own room-screen listeners
    // were torn down.
    const handleAudioRoomEnded = data => {
      dismissLiveRoomNotification();
      if (data?.roomId) {
        clearCachedSeatState(data.roomId);
        if (getActiveRoomId() === data.roomId) {
          liveKitAudio.disconnect();
          setActiveRoomId(null);
        }
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
    // Without this flag, a check already in flight when this effect tears
    // down (e.g. another update — like Onboarding's avatar/gender save —
    // triggers a re-run because sessionVersion changed) would still resolve
    // and run handleStatus() using this closure's now-stale
    // knownSessionVersion. If the fresh sessionVersion looks "newer" than
    // that stale snapshot, it incorrectly looks like another device forced
    // a logout, and force-logs-out a session that was actually still valid.
    let cancelled = false;
    const runFallbackCheck = async () => {
      const status = await checkUserStatus(sessionToken, deviceId);
      if (!cancelled && status) {
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
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
      disconnectSessionSocket();
    };
  }, [session?.user.publicId, session?.token, session?.user.sessionVersion, clearSession, setBanInfo, updateSessionUser, liveKitAudio, getActiveRoomId, setActiveRoomId]);
}
