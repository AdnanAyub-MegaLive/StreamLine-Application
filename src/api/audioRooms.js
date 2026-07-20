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

// POST /api/audio-rooms — upserts the caller's room record by roomId. Call
// this on create, whenever participantCount/recordingUrl changes, and again
// when the room ends (status: 'ENDED', endedAt set).
export async function upsertAudioRoom(sessionToken, room) {
  const body = {
    roomId: room.roomId,
    title: room.title,
    status: room.status,
    liveAudioUrl: room.liveAudioUrl ?? null,
    recordingUrl: room.recordingUrl ?? null,
    participantCount: room.participantCount,
    startedAt: room.startedAt,
    endedAt: room.endedAt ?? null
  };

  try {
    const response = await apiClient.post('/api/audio-rooms', body, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data.room;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new AudioRoomError(message, code);
    }
    throw new AudioRoomError('Unable to reach the server. Check your network and the backend address.', 'NETWORK_ERROR');
  }
}

// GET /api/audio-rooms — the authenticated user's latest 100 rooms.
export async function fetchAudioRooms(sessionToken) {
  try {
    const response = await apiClient.get('/api/audio-rooms', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data.rooms;
  } catch {
    return [];
  }
}
