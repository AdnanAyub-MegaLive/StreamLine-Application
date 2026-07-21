import { io } from 'socket.io-client';
import { appEnv } from '@/config/env';
let socket = null;
// Real-time enforcement channel: the portal pushes ban/unban/force-logout
// events over this socket the instant an admin acts, instead of the app
// having to wait for the next status-poll interval. See
// StreamLine-Portal/docs/mobile-socket-api.md for the server-side contract.
export function connectSessionSocket(sessionToken, handlers) {
  disconnectSessionSocket();
  socket = io(appEnv.apiBaseUrl, {
    auth: {
      token: sessionToken
    },
    transports: ['websocket']
  });
  socket.on('session:status', payload => handlers.onStatus(payload.data));
  socket.on('account:banned', payload => handlers.onBanned(payload.data));
  socket.on('account:unbanned', payload => handlers.onUnbanned(payload.data));
  socket.on('session:force-logout', payload => handlers.onForceLogout(payload.data));
  // See docs/mobile-special-id.md — optional handlers so existing callers
  // that don't care about Special IDs keep working unchanged.
  socket.on('special-id:assigned', payload => handlers.onSpecialIdAssigned?.(payload.data));
  socket.on('special-id:revoked', payload => handlers.onSpecialIdRevoked?.(payload.data));
  // See docs/mobile-login-api.md — these fire for ANY of the user's devices
  // getting banned/unbanned, so the caller must compare payload.data.macAddress
  // against this device's own id and only act if it matches.
  socket.on('device:banned', payload => handlers.onDeviceBanned?.(payload.data));
  socket.on('device:unbanned', payload => handlers.onDeviceUnbanned?.(payload.data));
  // The backend emits these to BOTH the room channel (audio-room:${roomId})
  // AND the owner's personal user channel (database-actions.js's
  // controlAudioRoom always calls emitToUser too) — so they still arrive
  // here even after we've left the room channel via leaveAudioRoom() while
  // a room is only backgrounded. Without this, a room terminated/blocked/
  // deleted by an admin while backgrounded would leave the "still live"
  // notification showing forever, since RoomScreen's own listeners for
  // these events are torn down as soon as it unmounts.
  socket.on('audio-room:blocked', payload => handlers.onAudioRoomEnded?.(payload.data));
  socket.on('audio-room:terminated', payload => handlers.onAudioRoomEnded?.(payload.data));
  socket.on('audio-room:deleted', payload => handlers.onAudioRoomEnded?.(payload.data));
  // Server auto-releases the room (frees live resources, keeps the
  // persistent ID) once the last participant's socket leaves/disconnects —
  // fires even if the owner isn't the one who triggered it, so the "still
  // live" notification must be dismissed the same as a moderation event.
  socket.on('audio-room:idle', payload => handlers.onAudioRoomIdle?.(payload.data));
  socket.on('connect_error', error => {
    const data = error.data;
    if (error.message === 'ACCOUNT_BANNED') {
      handlers.onBanned({
        sessionVersion: 0,
        forcedLogoutAt: null,
        isBanned: true,
        banReason: data?.banReason ?? null,
        banExpiresAt: data?.banExpiresAt ?? null
      });
    } else if (error.message === 'SESSION_REVOKED') {
      handlers.onForceLogout({
        sessionVersion: 0,
        forcedLogoutAt: new Date().toISOString(),
        isBanned: false,
        banReason: null,
        banExpiresAt: null
      });
    }
  });
  return socket;
}
export function disconnectSessionSocket() {
  socket?.disconnect();
  socket = null;
}

// The audio-room channel (join/blocked/terminated/deleted) rides the same
// authenticated socket connected above — rooms are joined on the existing
// per-user connection rather than opening a second socket. Returns null if
// there's no active session socket (e.g. still connecting).
export function getSessionSocket() {
  return socket;
}

// See StreamLine-Portal/docs/mobile-audio-room-api.md — ack callback
// receives { success, error: { code } } from the server on failure, so the
// synthetic "not connected yet" case below is shaped the same way.
export function joinAudioRoom(roomId, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:join', { roomId }, callback);
}

// Tells the server to stop broadcasting this room's events to us — call
// when backgrounding a live room (it keeps running, we just stop listening
// until the user taps back in and re-joins).
export function leaveAudioRoom(roomId) {
  socket?.emit('audio-room:leave', { roomId });
}
