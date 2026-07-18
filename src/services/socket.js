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
