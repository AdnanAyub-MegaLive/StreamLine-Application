import { apiClient } from './client';
import { fixLocalhostOrigin } from './uploads';

function authHeaders(sessionToken) {
  return { headers: { Authorization: `Bearer ${sessionToken}` } };
}

export async function fetchStoreCatalog(sessionToken, category) {
  const response = await apiClient.get('/api/store', {
    ...authHeaders(sessionToken),
    params: category ? { category } : undefined
  });
  const data = response.data.data;
  return {
    ...data,
    assets: (data.assets ?? []).map(asset => (asset.url ? { ...asset, url: fixLocalhostOrigin(asset.url) } : asset))
  };
}

export class StorePurchaseError extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = 'StorePurchaseError';
    this.code = code;
  }
}

export async function purchaseStoreAsset(sessionToken, assetId) {
  try {
    const response = await apiClient.post(`/api/store/${assetId}/purchase`, {}, authHeaders(sessionToken));
    return response.data.data;
  } catch (error) {
    const backendError = error?.response?.data?.error;
    if (backendError) {
      throw new StorePurchaseError(backendError.message ?? 'Purchase failed.', backendError.code);
    }
    throw new StorePurchaseError('Unable to reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }
}

export async function fetchMyProps(sessionToken) {
  try {
    const response = await apiClient.get('/api/users/props', authHeaders(sessionToken));
    const data = response.data.data;
    const equipped = {};
    for (const [category, item] of Object.entries(data.equipped ?? {})) {
      equipped[category] = item?.url ? { ...item, url: fixLocalhostOrigin(item.url) } : item;
    }
    return {
      ...data,
      props: (data.props ?? []).map(prop => (prop.url ? { ...prop, url: fixLocalhostOrigin(prop.url) } : prop)),
      equipped
    };
  } catch {
    return { props: [], equipped: {} };
  }
}

export async function equipProp(sessionToken, assetId) {
  await apiClient.post('/api/users/props/equip', { assetId }, authHeaders(sessionToken));
}

export async function unequipProp(sessionToken, category) {
  await apiClient.post('/api/users/props/equip', { assetId: null, category }, authHeaders(sessionToken));
}
