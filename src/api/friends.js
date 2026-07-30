import { apiClient } from './client';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export async function sendFriendRequest(sessionToken, targetUserId) {
  const response = await apiClient.post('/api/friends/requests', { targetUserId }, authHeaders(sessionToken));
  return response.data.data;
}

export async function fetchFriendStatus(sessionToken, userId) {
  try {
    const response = await apiClient.get('/api/friends/status', {
      ...authHeaders(sessionToken),
      params: { userId }
    });
    return response.data.data ?? { status: 'none', requestId: null };
  } catch {
    return { status: 'none', requestId: null };
  }
}

export async function fetchIncomingFriendRequests(sessionToken) {
  try {
    const response = await apiClient.get('/api/friends/requests', authHeaders(sessionToken));
    return response.data.data.requests ?? [];
  } catch {
    return [];
  }
}

export async function respondToFriendRequest(sessionToken, requestId, accepted) {
  const path = `/api/friends/requests/${requestId}/${accepted ? 'accept' : 'decline'}`;
  await apiClient.post(path, {}, authHeaders(sessionToken));
}

export async function fetchFriends(sessionToken) {
  try {
    const response = await apiClient.get('/api/friends', authHeaders(sessionToken));
    return response.data.data.friends ?? [];
  } catch {
    return [];
  }
}
