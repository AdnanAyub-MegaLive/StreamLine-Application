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
