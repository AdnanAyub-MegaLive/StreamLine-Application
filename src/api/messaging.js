import { apiClient } from './client';

// See StreamLine-Portal/docs/mobile-messaging-api.md.
function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

// GET /api/conversations — direct chats plus the well-known World Chat
// conversation (CONV-WORLD), each with lastMessage/lastMessageAt/unreadCount
// already computed server-side.
export async function fetchConversations(sessionToken) {
  const response = await apiClient.get('/api/conversations', authHeaders(sessionToken));
  return response.data.data.conversations ?? [];
}

// POST /api/conversations — creates or returns the existing direct
// conversation with participantId (a user's publicId).
export async function startConversation(sessionToken, participantId) {
  const response = await apiClient.post('/api/conversations', { participantId }, authHeaders(sessionToken));
  return response.data.data.conversation;
}

// GET /api/conversations/:id/messages — chronological page, oldest first.
export async function fetchMessages(sessionToken, conversationId, { limit, cursor } = {}) {
  const response = await apiClient.get(`/api/conversations/${conversationId}/messages`, {
    ...authHeaders(sessionToken),
    params: { limit, cursor }
  });
  return response.data.data;
}

// POST /api/conversations/:id/messages — REST fallback; sending normally
// goes over the socket's message:send instead (see src/services/socket.js).
export async function sendMessageRest(sessionToken, conversationId, body) {
  const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, { body }, authHeaders(sessionToken));
  return response.data.data.message;
}

// POST /api/conversations/:id/read — marks the caller's lastReadAt, clearing
// that conversation's unreadCount.
export async function markConversationRead(sessionToken, conversationId) {
  await apiClient.post(`/api/conversations/${conversationId}/read`, {}, authHeaders(sessionToken));
}

// GET /api/notifications — the caller's personal notifications plus global
// broadcasts (admin-sent, userId: null).
export async function fetchNotifications(sessionToken, { limit } = {}) {
  const response = await apiClient.get('/api/notifications', {
    ...authHeaders(sessionToken),
    params: { limit }
  });
  return response.data.data.notifications ?? [];
}

// POST /api/notifications/:id/read
export async function markNotificationRead(sessionToken, notificationId) {
  await apiClient.post(`/api/notifications/${notificationId}/read`, {}, authHeaders(sessionToken));
}
