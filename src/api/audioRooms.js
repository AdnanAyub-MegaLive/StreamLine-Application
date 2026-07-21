import axios from 'axios';
import { apiClient } from './client';

export class AudioRoomError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'AudioRoomError';
    this.code = code;
  }
}

// POST /api/audio-rooms — see StreamLine-Portal/docs/mobile-audio-room-api.md.
// Each user owns exactly one persistent, backend-assigned room ID. The
// server ignores any roomId sent by the app; it always returns the
// authoritative id/reused flag/room in the response.
async function audioRoomAction(sessionToken, body) {
  try {
    const response = await apiClient.post('/api/audio-rooms', body, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AudioRoomError(message, code);
    }
    throw new AudioRoomError('Unable to reach the server. Check your network and the backend address.', 'NETWORK_ERROR');
  }
}

// First call for this user returns HTTP 201 and assigns a new room ID;
// later calls reuse the assigned ID (reused: true).
export async function startAudioRoom(sessionToken, { title, liveAudioUrl, participantCount } = {}) {
  return audioRoomAction(sessionToken, { action: 'START', title, liveAudioUrl, participantCount });
}

// Syncs title/participantCount/liveAudioUrl on the already-assigned room
// (e.g. when the seat count changes) without restarting it.
export async function updateAudioRoom(sessionToken, { title, liveAudioUrl, participantCount } = {}) {
  return audioRoomAction(sessionToken, { action: 'UPDATE', title, liveAudioUrl, participantCount });
}

// Marks the assigned room IDLE (participants cleared, live URL cleared) but
// keeps the room ID for next time. The Socket.IO server also does this
// automatically once the last participant's socket leaves/disconnects, so
// this is only needed for the owner's explicit "End Room" action.
export async function endAudioRoom(sessionToken, { recordingUrl } = {}) {
  return audioRoomAction(sessionToken, { action: 'END', recordingUrl });
}

// GET /api/audio-rooms — the caller's single assigned room, or null before
// they've ever started one.
export async function fetchAudioRoom(sessionToken) {
  try {
    const response = await apiClient.get('/api/audio-rooms', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data.room;
  } catch {
    return null;
  }
}
