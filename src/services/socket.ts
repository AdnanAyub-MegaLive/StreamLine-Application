import { io, type Socket } from 'socket.io-client';
import { appEnv } from '@/config/env';
import type { UserStatus } from '@/api';

type ServerToClientEvents = {
  'session:status': (payload: { success: true; data: UserStatus }) => void;
  'account:banned': (payload: { success: true; data: UserStatus }) => void;
  'account:unbanned': (payload: { success: true; data: UserStatus }) => void;
  'session:force-logout': (payload: { success: true; data: UserStatus }) => void;
};

type SocketConnectErrorData = { banReason?: string | null; banExpiresAt?: string | null };

let socket: Socket<ServerToClientEvents> | null = null;

export type SessionSocketHandlers = {
  onStatus: (status: UserStatus) => void;
  onBanned: (status: UserStatus) => void;
  onUnbanned: (status: UserStatus) => void;
  onForceLogout: (status: UserStatus) => void;
};

// Real-time enforcement channel: the portal pushes ban/unban/force-logout
// events over this socket the instant an admin acts, instead of the app
// having to wait for the next status-poll interval. See
// StreamLine-Portal/docs/mobile-socket-api.md for the server-side contract.
export function connectSessionSocket(sessionToken: string, handlers: SessionSocketHandlers) {
  disconnectSessionSocket();

  socket = io(appEnv.apiBaseUrl, {
    auth: { token: sessionToken },
    transports: ['websocket'],
  });

  socket.on('session:status', payload => handlers.onStatus(payload.data));
  socket.on('account:banned', payload => handlers.onBanned(payload.data));
  socket.on('account:unbanned', payload => handlers.onUnbanned(payload.data));
  socket.on('session:force-logout', payload => handlers.onForceLogout(payload.data));

  socket.on('connect_error', error => {
    const data = (error as Error & { data?: SocketConnectErrorData }).data;

    if (error.message === 'ACCOUNT_BANNED') {
      handlers.onBanned({
        sessionVersion: 0,
        forcedLogoutAt: null,
        isBanned: true,
        banReason: data?.banReason ?? null,
        banExpiresAt: data?.banExpiresAt ?? null,
      });
    } else if (error.message === 'SESSION_REVOKED') {
      handlers.onForceLogout({
        sessionVersion: 0,
        forcedLogoutAt: new Date().toISOString(),
        isBanned: false,
        banReason: null,
        banExpiresAt: null,
      });
    }
  });

  return socket;
}

export function disconnectSessionSocket() {
  socket?.disconnect();
  socket = null;
}
