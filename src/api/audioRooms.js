import axios from 'axios';
import { apiClient } from './client';

export class AudioRoomError extends Error {
  code;
  details;
  constructor(message, code, details) {
    super(message);
    this.name = 'AudioRoomError';
    this.code = code;
    this.details = details;
  }
}

async function audioRoomAction(sessionToken, body) {
  try {
    const response = await apiClient.post('/api/audio-rooms', body, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      throw new AudioRoomError(message, code, details);
    }
    throw new AudioRoomError('Unable to reach the server. Check your network and the backend address.', 'NETWORK_ERROR');
  }
}
export async function startAudioRoom(sessionToken, { title, liveAudioUrl, participantCount, country } = {}) {
  return audioRoomAction(sessionToken, { action: 'START', title, liveAudioUrl, participantCount, country });
}

export async function updateAudioRoom(sessionToken, { title, liveAudioUrl, participantCount, country } = {}) {
  return audioRoomAction(sessionToken, { action: 'UPDATE', title, liveAudioUrl, participantCount, country });
}

export async function endAudioRoom(sessionToken, { recordingUrl } = {}) {
  return audioRoomAction(sessionToken, { action: 'END', recordingUrl });
}

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

export async function fetchDiscoverRooms(sessionToken) {
  try {
    const response = await apiClient.get('/api/audio-rooms/discover', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data.rooms ?? [];
  } catch {
    return [];
  }
}
