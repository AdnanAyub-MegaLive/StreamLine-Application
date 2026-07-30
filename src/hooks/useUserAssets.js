import React from 'react';
import { fetchAssetDataUri, fetchUploadCatalog } from '../api';
import { useAppStore } from '../store';
import { clearCachedAssignedAsset, getCachedAssignedAsset, setCachedAssignedAsset } from '../utils';

// Single place that resolves an admin-assigned perk (frame/badge/room
// background) to a ready-to-use data: URI, replacing what used to be near-
// identical fetch+cache logic duplicated across useAssignedFrame,
// useAssignedBadge and useAssignedRoomBackground. See
// docs/asset-centralization-spec.md.
//
// Two resolution paths:
// - explicitUrl: the caller already has a resolved asset URL for the
//   target user (e.g. once the backend starts including frameUrl/badgeUrl
//   directly on a search result or conversation participant). Just
//   downloads and caches those bytes — no catalog call needed at all.
// - No explicitUrl: falls back to the upload catalog, which only ever
//   returns the *signed-in caller's own* assigned assets (see
//   src/api/uploads.js) — so this path only resolves anything when the
//   target user is the current session's own user. For any other user
//   with no explicitUrl yet, this intentionally resolves to null (same as
//   today) until the backend ships those fields.
const CATALOG_CATEGORY = {
  frame: 'FRAMES',
  badge: 'BADGES',
  roomBackground: 'ROOM_BACKGROUNDS'
};

// The backend's frameUrl/badgeUrl/roomBackgroundUrl are signed display
// URLs (?displayExp=...&displaySig=...) that carry a fresh signature on
// every response even when the underlying asset hasn't changed at all —
// see StreamLine-Portal/docs/mobile-public-user-perks.md. Comparing the
// full URL against the cache would treat that as "a new asset" every
// single time and re-download unnecessarily. Extracting the stable
// /api/uploads/<assetId>/file segment gives a real identity to compare —
// only an actual asset change (a different assetId) invalidates the cache.
function assetIdentity(url) {
  if (!url) {
    return null;
  }
  const match = /\/uploads\/([^/?]+)\/file/.exec(url);
  return match ? match[1] : url;
}

function useResolvedAsset(kind, { userId, explicitUrl } = {}) {
  const sessionToken = useAppStore(state => state.session?.token);
  const ownUserId = useAppStore(state => state.session?.user?.publicId);
  const targetUserId = userId ?? ownUserId;
  const category = CATALOG_CATEGORY[kind];
  const cached = React.useMemo(() => getCachedAssignedAsset(targetUserId, category), [targetUserId, category]);
  const [dataUri, setDataUri] = React.useState(cached?.dataUri ?? null);

  React.useEffect(() => {
    if (!sessionToken || !targetUserId) {
      return undefined;
    }
    let cancelled = false;

    if (explicitUrl !== undefined) {
      if (!explicitUrl) {
        clearCachedAssignedAsset(targetUserId, category);
        setDataUri(null);
        return undefined;
      }
      const identity = assetIdentity(explicitUrl);
      if (identity === cached?.assetId) {
        return undefined;
      }
      // A network failure here (fetchAssetDataUri returns null) leaves
      // dataUri untouched — still showing whatever was last cached — rather
      // than clearing it, so a connectivity blip never blanks out an
      // already-loaded frame/badge/background.
      fetchAssetDataUri({ url: explicitUrl }, sessionToken).then(uri => {
        if (!cancelled && uri) {
          setCachedAssignedAsset(targetUserId, category, identity, uri);
          setDataUri(uri);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (targetUserId !== ownUserId) {
      return undefined;
    }

    fetchUploadCatalog(sessionToken, { category, roomBackground: kind === 'roomBackground' }).then(async assets => {
      if (cancelled) {
        return;
      }
      // null means the catalog request itself failed (network/server) —
      // distinct from a genuinely empty `[]` (checked, nothing assigned).
      // Only the latter should clear an already-cached result.
      if (assets === null) {
        return;
      }
      const asset = assets.find(item => item.assignedUser) ?? assets[0] ?? null;
      if (!asset) {
        clearCachedAssignedAsset(targetUserId, category);
        setDataUri(null);
        return;
      }
      if (asset.id === cached?.assetId) {
        return;
      }
      const uri = await fetchAssetDataUri(asset, sessionToken);
      if (!cancelled && uri) {
        setCachedAssignedAsset(targetUserId, category, asset.id, uri);
        setDataUri(uri);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionToken, targetUserId, ownUserId, category, kind, explicitUrl, cached?.assetId]);

  return dataUri;
}

// userId defaults to the signed-in user's own id. frameUrl/badgeUrl/
// roomBackgroundUrl are optional pre-resolved URLs for someone else's
// assigned assets (pass these once an API response includes them — see
// docs/asset-centralization-spec.md); omit them to only ever resolve the
// target user's own catalog assignment (works today only when userId is
// the caller's own id).
export function useUserAssets({ userId, frameUrl, badgeUrl, roomBackgroundUrl } = {}) {
  const frameUri = useResolvedAsset('frame', { userId, explicitUrl: frameUrl });
  const badgeUri = useResolvedAsset('badge', { userId, explicitUrl: badgeUrl });
  const roomBackgroundDataUri = useResolvedAsset('roomBackground', { userId, explicitUrl: roomBackgroundUrl });
  const roomBackgroundSource = React.useMemo(
    () => (roomBackgroundDataUri ? { uri: roomBackgroundDataUri } : null),
    [roomBackgroundDataUri]
  );
  return { frameUri, badgeUri, roomBackgroundSource };
}

export default useUserAssets;
