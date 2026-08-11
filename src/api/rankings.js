import { apiClient } from './client';
import { fixLocalhostOrigin } from './uploads';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

function fixAssetUrl(url) {
  return url ? fixLocalhostOrigin(url) : url;
}

function fixEntryUrls(entry) {
  return {
    ...entry,
    frameUrl: fixAssetUrl(entry.frameUrl),
    badgeUrl: fixAssetUrl(entry.badgeUrl)
  };
}

export async function fetchRankings(sessionToken, { type = 'overall', period = 'week', limit = 20, cursor } = {}) {
  const response = await apiClient.get('/api/rankings', {
    ...authHeaders(sessionToken),
    params: { type, period, limit, cursor }
  });
  const data = response.data.data;
  return {
    ...data,
    podium: (data.podium ?? []).map(fixEntryUrls),
    rankings: (data.rankings ?? []).map(fixEntryUrls)
  };
}
