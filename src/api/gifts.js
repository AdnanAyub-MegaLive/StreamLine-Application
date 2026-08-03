import axios from 'axios';
import { apiClient } from './client';
import { fixLocalhostOrigin } from './uploads';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export class GiftSendError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'GiftSendError';
    this.code = code;
  }
}

// GET /api/gifts/catalog — see StreamLine-Portal/docs/gift-profit-rules-api.md.
// Real, backend-managed gift catalog (Classic/Premium/VIP categories) —
// replaces the old client-side hardcoded gift list.
export async function fetchGiftCatalog(sessionToken) {
  const response = await apiClient.get('/api/gifts/catalog', authHeaders(sessionToken));
  const data = response.data.data;
  const fixGift = gift => (gift.mediaUrl ? { ...gift, mediaUrl: fixLocalhostOrigin(gift.mediaUrl) } : gift);
  return {
    gifts: (data.gifts ?? []).map(fixGift),
    categories: (data.categories ?? []).map(category => ({ ...category, gifts: (category.gifts ?? []).map(fixGift) }))
  };
}

// POST /api/gifts/send — the backend loads the gift by giftId and
// authoritatively computes coinPrice × quantity itself; it does not accept
// a client-supplied name or price (prevents price manipulation), so this
// only ever sends the gift's id, how many, who to, and which room.
export async function sendGift(sessionToken, { recipientId, giftId, quantity, roomId }) {
  try {
    const response = await apiClient.post('/api/gifts/send', {
      recipientId,
      giftId,
      quantity,
      roomId
    }, authHeaders(sessionToken));
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new GiftSendError(message, code);
    }
    throw new GiftSendError('Unable to reach the server. Check your network and try again.', 'NETWORK_ERROR');
  }
}

// GET /api/platform/rules — display-only; the backend always recalculates
// and settles the authoritative amount server-side regardless of this.
export async function fetchPlatformRules(sessionToken) {
  try {
    const response = await apiClient.get('/api/platform/rules', authHeaders(sessionToken));
    return response.data.data.profitSplit;
  } catch {
    return null;
  }
}
