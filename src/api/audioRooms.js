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
// seatLayout is the owner's chosen SEAT_LAYOUT_OPTIONS groups (e.g.
// [2, 3, 5, 5]) — sent so viewers can eventually see the same seat shape
// the owner picked instead of a generic default (see
// docs/room-seat-layout-spec.md — not yet persisted/returned by the
// backend as of this writing; harmless no-op field until it is).
export async function startAudioRoom(sessionToken, { title, liveAudioUrl, participantCount, country, seatLayout } = {}) {
  return audioRoomAction(sessionToken, { action: 'START', title, liveAudioUrl, participantCount, country, seatLayout });
}

export async function updateAudioRoom(sessionToken, { title, liveAudioUrl, participantCount, country, seatLayout } = {}) {
  return audioRoomAction(sessionToken, { action: 'UPDATE', title, liveAudioUrl, participantCount, country, seatLayout });
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

// POST /api/audio-rooms/cover — the room must already have an assigned ID
// (i.e. START must have succeeded at least once) before this can be called.
// Returns the coverImageUrl now reflected on the owner's own room and every
// Discover room entry (see toPartyItem/toLiveItem).
export async function uploadAudioRoomCover(sessionToken, { imageUri, imageType, imageFileName }) {
  const form = new FormData();
  form.append('image', {
    uri: imageUri,
    type: imageType ?? 'image/jpeg',
    name: imageFileName ?? 'cover.jpg'
  });
  try {
    const response = await apiClient.post('/api/audio-rooms/cover', form, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data?.data ?? {};
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message, details } = error.response.data.error;
      throw new AudioRoomError(message, code, details);
    }
    throw new AudioRoomError('Unable to reach the server. Check your network and the backend address.', 'NETWORK_ERROR');
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

// See docs/audio-room-persistent-lifecycle-spec.md — unlike
// fetchDiscoverRooms, this also finds empty/idle rooms (owner offline, 0
// participants) by Room ID or Room Name, so a room can be found and joined
// even when it wouldn't show up in the passive trending feed.
export async function searchAudioRooms(sessionToken, query) {
  const q = query?.trim();
  if (!q) {
    return [];
  }
  try {
    const response = await apiClient.get('/api/audio-rooms/search', {
      params: { q },
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    return response.data.data.rooms ?? [];
  } catch {
    return [];
  }
}
