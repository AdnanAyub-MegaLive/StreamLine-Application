// In-memory only (not persisted to disk) — survives backgrounding a live
// room and returning to it via the "still live" notification, but clears
// when the app is fully killed. See PR discussion: seat occupancy/notes are
// pure local UI state (the backend's AudioRoom model is room-level only —
// title/status/participantCount — with no seat schema), so this is a
// client-side fix only and never touches the backend.
//
// Lives in src/utils (not src/screens/Room) because it's now read from both
// RoomScreen and useSessionGuard — the latter clears it when the backend
// terminates/blocks/deletes a room while it's only backgrounded (see
// src/hooks/useSessionGuard.js for why that path exists).
const cache = new Map();

export function getCachedSeatState(roomId) {
  return cache.get(roomId) ?? null;
}

export function setCachedSeatState(roomId, state) {
  cache.set(roomId, state);
}

export function clearCachedSeatState(roomId) {
  cache.delete(roomId);
}
