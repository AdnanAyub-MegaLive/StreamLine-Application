import React from 'react';
import { fetchAssetDataUri, fetchUploadCatalog } from '../api';
import { useAppStore } from '../store';
import { clearCachedAssignedAsset, getCachedAssignedAsset, setCachedAssignedAsset } from '../utils';

const CATEGORY = 'ROOM_BACKGROUNDS';

// A room background is a perk an admin uploads/assigns from the portal
// (see StreamLine-Portal's mobile upload catalog docs) — there's no
// self-service picker for it yet. Shared by any screen that needs to show
// it (Room screen, Profile screen, ...) instead of each one duplicating
// the same fetch. Returns the raw asset (or null) plus a ready-to-use
// <Image>/<ImageBackground> source for it.
//
// Cached (see src/utils/assignedAssetCache.js) — renders instantly from
// the last-known result on mount, and only re-downloads the image bytes
// when the backend's assigned asset id has actually changed, instead of
// re-fetching the catalog and the full image every single time this
// screen is visited.
export function useAssignedRoomBackground() {
  const sessionToken = useAppStore(state => state.session?.token);
  const userId = useAppStore(state => state.session?.user?.publicId);
  const cached = React.useMemo(() => getCachedAssignedAsset(userId, CATEGORY), [userId]);
  const [asset, setAsset] = React.useState(null);
  // A data: URI, not { uri, headers } — <Image>/<ImageBackground> don't
  // reliably forward a custom Authorization header to the native image
  // loader on every platform/RN version, which silently failed even with a
  // correct URL and token. Fetching the bytes ourselves and embedding them
  // directly sidesteps that entirely — see fetchAssetDataUri.
  const [dataUri, setDataUri] = React.useState(cached?.dataUri ?? null);

  React.useEffect(() => {
    if (!sessionToken) {
      return undefined;
    }
    let cancelled = false;
    fetchUploadCatalog(sessionToken, { category: CATEGORY, roomBackground: true }).then(assets => {
      if (cancelled) {
        return;
      }
      // The catalog only ever returns global assets plus ones assigned to
      // THIS user (never other users'), so anything here is fair to use.
      // Prefer a specifically-assigned background; otherwise fall back to
      // the newest global one — the portal's upload form defaults its
      // "Assign to user" dropdown to "Available to all users", so most
      // uploads are global and would otherwise never show at all.
      setAsset(assets.find(item => item.assignedUser) ?? assets[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  React.useEffect(() => {
    if (!asset || !sessionToken) {
      if (!asset) {
        clearCachedAssignedAsset(userId, CATEGORY);
        setDataUri(null);
      }
      return undefined;
    }
    // Same assignment as last time — the cached bytes are already showing,
    // no need to re-download them.
    if (asset.id === cached?.assetId) {
      return undefined;
    }
    let cancelled = false;
    fetchAssetDataUri(asset, sessionToken).then(uri => {
      if (!cancelled && uri) {
        setCachedAssignedAsset(userId, CATEGORY, asset.id, uri);
        setDataUri(uri);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [asset, sessionToken, userId, cached?.assetId]);

  // Memoized — a fresh { uri } object every render would make any
  // consumer's <ImageBackground source={source}> see a "new" source on
  // every one of its own re-renders (Room screen re-renders constantly:
  // viewer count, chat, mic state, etc.), even though the actual image
  // hadn't changed. React Native's Image treats a changed source object as
  // a new image to load, which was making the background flicker/reload
  // continuously instead of just rendering once.
  const source = React.useMemo(() => (dataUri ? { uri: dataUri } : null), [dataUri]);
  return { asset, source };
}

export default useAssignedRoomBackground;
