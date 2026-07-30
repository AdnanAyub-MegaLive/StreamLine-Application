import { apiClient } from './client';

export async function searchUsers(sessionToken, query) {
  const q = query?.trim();
  if (!q) {
    return [];
  }
  try {
    const response = await apiClient.get('/api/users/search', {
      headers: { Authorization: `Bearer ${sessionToken}` },
      params: { q }
    });
    return response.data.data.users ?? [];
  } catch {
    return [];
  }
}
