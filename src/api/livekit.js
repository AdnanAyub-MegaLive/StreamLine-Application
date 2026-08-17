import { apiClient } from './client';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export class LiveKitTokenError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'LiveKitTokenError';
    this.code = code;
  }
}

// POST /api/audio-rooms/livekit-token on StreamLine-Portal — issues a
// short-lived (10m) join token. canPublish is decided server-side from the
// room's ownerId, not from anything this client sends, so a compromised or
// modified client can't grant itself mic-publish rights.
export async function fetchLiveKitToken(sessionToken, roomId) {
  try {
    const response = await apiClient.post('/api/audio-rooms/livekit-token', { roomId }, authHeaders(sessionToken));
    const data = response.data?.data ?? {};
    if (!data.token || !data.url) {
      throw new LiveKitTokenError('The server did not return a valid LiveKit token.', 'INVALID_RESPONSE');
    }
    return { token: data.token, url: data.url };
  } catch (error) {
    if (error instanceof LiveKitTokenError) {
      throw error;
    }
    const backendError = error?.response?.data?.error;
    if (backendError) {
      throw new LiveKitTokenError(backendError.message ?? 'Unable to fetch a LiveKit token.', backendError.code);
    }
    throw new LiveKitTokenError('Unable to reach the server for a LiveKit token.', 'NETWORK_ERROR');
  }
}

export default fetchLiveKitToken;
