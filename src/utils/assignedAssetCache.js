import { createMMKV } from 'react-native-mmkv';

// Shared by useAssignedBadge/useAssignedFrame/useAssignedRoomBackground/
// useBannerAssets — an admin-assigned perk (badge, frame, room background,
// banner) was being re-fetched (catalog call + full image byte download)
// on every single screen visit, with no persistence at all. That's a real,
// user-visible delay each time, for an asset that in practice almost never
// changes between visits. This persists the resolved data: URI per
// category (scoped to the signed-in account, so switching accounts on the
// same device never shows a leftover asset from a different user) so a
// hook can render it instantly from disk, then only re-download if the
// backend's assigned asset id has actually changed since last time.
const cacheStorage = createMMKV({ id: 'streamline-assigned-asset-cache' });

function cacheKey(userId, category) {
  return `${userId ?? 'anonymous'}:${category}`;
}

// Returns { assetId, dataUri } or null. Synchronous — safe to call from a
// useState initializer so the very first render already has the cached
// asset, instead of a blank frame while the network fetch runs.
export function getCachedAssignedAsset(userId, category) {
  const raw = cacheStorage.getString(cacheKey(userId, category));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedAssignedAsset(userId, category, assetId, dataUri) {
  cacheStorage.set(cacheKey(userId, category), JSON.stringify({ assetId, dataUri }));
}

export function clearCachedAssignedAsset(userId, category) {
  cacheStorage.remove(cacheKey(userId, category));
}

// Same idea, for a category that's a whole list rather than one assigned
// asset (banners) — cached alongside the ids that produced it, so the
// caller can tell at a glance whether the backend's set has changed at
// all before re-downloading every image in it.
export function getCachedAssetList(userId, category) {
  const raw = cacheStorage.getString(cacheKey(userId, `list:${category}`));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedAssetList(userId, category, ids, items) {
  cacheStorage.set(cacheKey(userId, `list:${category}`), JSON.stringify({ ids, items }));
}

function identityCacheKey(category, identity) {
  return `identity:${category}:${identity}`;
}

export function getCachedAssetByIdentity(category, identity) {
  if (!identity) {
    return null;
  }
  return cacheStorage.getString(identityCacheKey(category, identity)) ?? null;
}

export function setCachedAssetByIdentity(category, identity, dataUri) {
  if (!identity) {
    return;
  }
  cacheStorage.set(identityCacheKey(category, identity), dataUri);
}
