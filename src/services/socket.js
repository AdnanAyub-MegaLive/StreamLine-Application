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
  socket.on('session:status', payload => handlers.onStatus(payload?.data));
  socket.on('account:banned', payload => handlers.onBanned(payload?.data));
  socket.on('account:unbanned', payload => handlers.onUnbanned(payload?.data));
  socket.on('session:force-logout', payload => handlers.onForceLogout(payload?.data));
  // See docs/mobile-special-id.md — optional handlers so existing callers
  // that don't care about Special IDs keep working unchanged.
  socket.on('special-id:assigned', payload => handlers.onSpecialIdAssigned?.(payload.data));
  socket.on('special-id:revoked', payload => handlers.onSpecialIdRevoked?.(payload.data));
  // Timed Special ID assignments expire on their own schedule (tracked
  // server-side, survives a server restart) — same shape as revoked
  // (data.normalId), plus data.expiredSpecialId naming which one lapsed.
  socket.on('special-id:expired', payload => handlers.onSpecialIdExpired?.(payload.data));
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
  // Timed room restrictions (owner-only mode, block, termination) now lift
  // automatically when their expiry passes — mirror image of
  // joining-disabled/blocked/terminated above. joining-enabled only matters
  // while a viewer is actively in the room (lets them take a seat again);
  // unblocked/restored matter for the "+"-start-room flow, which already
  // re-checks live server state on every attempt so no action is required
  // there — both are still surfaced for any screen that wants them.
  socket.on('audio-room:joining-enabled', payload => handlers.onAudioRoomJoiningEnabled?.(payload.data));
  socket.on('audio-room:unblocked', payload => handlers.onAudioRoomRestored?.(payload.data));
  socket.on('audio-room:restored', payload => handlers.onAudioRoomRestored?.(payload.data));
  // See StreamLine-Portal/docs/mobile-messaging-api.md — messages/reads/
  // notifications are unwrapped events (no {success, data} envelope),
  // unlike the events above.
  socket.on('message:new', payload => payload && handlers.onMessageNew?.(payload));
  socket.on('conversation:read', payload => payload && handlers.onConversationRead?.(payload));
  socket.on('notification:new', payload => payload && handlers.onNotificationNew?.(payload));
  // See docs/friends-api-spec.md — unwrapped, same as the messaging events.
  socket.on('friend:request', payload => payload && handlers.onFriendRequest?.(payload));
  socket.on('friend:accepted', payload => payload && handlers.onFriendAccepted?.(payload));
  socket.on('friend:declined', payload => payload && handlers.onFriendDeclined?.(payload));
  socket.on('props:granted', payload => payload && handlers.onPropsGranted?.(payload));
  socket.on('props:updated', payload => payload && handlers.onPropsUpdated?.(payload));
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

// Room chat is intentionally separate from private/world conversations. The
// server relays the authoritative message to everyone currently in the audio
// room (including the sender), which keeps every participant's chat in sync.
export function sendAudioRoomMessage(roomId, body, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.timeout(8000).emit('audio-room:message', { roomId, body }, (error, result) => {
    callback?.(
      error
        ? { success: false, error: { code: 'SEND_TIMEOUT' } }
        : result ?? { success: false, error: { code: 'MESSAGE_SEND_FAILED' } }
    );
  });
}

// See StreamLine-Portal/docs/mobile-audio-room-api.md's "Server-authoritative
// live seats" — seats are now database-backed; the server is the sole
// source of truth for occupancy/lock/note/mute/speaking, and broadcasts the
// complete audio-room:seat-update payload after every change. Any seatRows
// this client sends is ignored (kept only for the ack shape).
//
// Takes a free, unlocked seat (or moves there if already seated elsewhere —
// the server atomically vacates the old one first). Ack data:
// { seatId, seatState, liveKit: { token, url, canPublish: true } } — the
// caller must reconnect LiveKit with that token before enabling its mic.
export function takeSeat(roomId, seatId, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-take', { roomId, seatId }, callback);
}

// Explicit move between two seats you already/don't yet occupy — source
// must be your own seat, target must be free and unlocked, both in one
// transaction. Ack data: { fromSeatId, seatId, seatState } — no fresh
// LiveKit token needed since publish rights don't change on a same-room move.
export function moveSeat(roomId, fromSeatId, toSeatId, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-move', { roomId, fromSeatId, toSeatId }, callback);
}

// Owner-only: clears someone else's seat (they drop to listener, but stay
// in the room — their socket connection/membership is untouched). Used
// when shrinking the seat layout displaces a currently-occupied real seat
// (see RoomScreen's handleChangeSeatLayout). Ack data:
// { seatId, kickedUserId, seatState }. The kicked user's own device
// separately receives audio-room:seat-kicked with a fresh subscribe-only
// LiveKit token to reconnect with — this ack alone doesn't reach them.
export function kickFromSeat(roomId, seatId, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-kick', { roomId, seatId }, callback);
}

// Pushes this device's own real mic-mute/speaking state (as detected via
// LiveKit — see useLiveKitAudio) up to the server, which broadcasts it to
// everyone via seat-update. Only the caller's own seated row can be
// updated this way (SPEAKER_NOT_SEATED otherwise). speaking is forced false
// server-side while muted.
export function updateSeatStatus(roomId, { muted, speaking }, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-status', { roomId, muted, speaking }, callback);
}

// Owner-only: lock/unlock a seat and optionally set its note in one call.
export function lockSeat(roomId, seatId, locked, note, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-lock', { roomId, seatId, locked, note }, callback);
}

// Clears your own seat. Ack data now includes { seatState, liveKit } — the
// returned LiveKit token is subscribe-only (canPublish: false); reconnect
// with it the same as after takeSeat.
export function leaveSeat(roomId, seatId, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('audio-room:seat-leave', { roomId, seatId }, callback);
}

// See StreamLine-Portal/docs/mobile-messaging-api.md — sends over the
// already-authenticated session socket instead of the REST fallback
// (sendMessageRest in src/api/messaging.js), so the sender also gets the
// same real-time message:new the other participants receive.
export function sendMessage(conversationId, body, callback) {
  if (!socket) {
    callback?.({ success: false, error: { code: 'NOT_CONNECTED' } });
    return;
  }
  socket.emit('message:send', { conversationId, body }, callback);
}
