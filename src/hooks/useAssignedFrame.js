import React from 'react';
import { fetchAssetDataUri, fetchUploadCatalog } from '../api';
import { useAppStore } from '../store';
import { clearCachedAssignedAsset, getCachedAssignedAsset, setCachedAssignedAsset } from '../utils';

const CATEGORY = 'FRAMES';

// An avatar frame is a perk an admin uploads/assigns from the portal (see
// StreamLine-Portal's mobile upload catalog docs, category FRAMES) — same
// convention as useAssignedRoomBackground: prefer a specifically-assigned
// frame, otherwise fall back to the newest global one (the portal's upload
// form defaults to "Available to all users"). This existed on the backend
// with nothing on the app side ever reading it — no hook fetched FRAMES
// and nothing rendered one, so an assigned frame silently never showed up
// anywhere. Returns a ready-to-use data: URI (or null) for the Avatar
// component's frameUri prop.
//
// Cached (see src/utils/assignedAssetCache.js) — renders instantly from
// the last-known result on mount, and only re-downloads the image bytes
// when the backend's assigned asset id has actually changed, instead of
// re-fetching the catalog and the full image every single time this
// screen is visited.
export function useAssignedFrame() {
  const sessionToken = useAppStore(state => state.session?.token);
  const userId = useAppStore(state => state.session?.user?.publicId);
  const cached = React.useMemo(() => getCachedAssignedAsset(userId, CATEGORY), [userId]);
  const [dataUri, setDataUri] = React.useState(cached?.dataUri ?? null);

  React.useEffect(() => {
    if (!sessionToken) {
      return undefined;
    }
    let cancelled = false;
    fetchUploadCatalog(sessionToken, { category: CATEGORY }).then(async assets => {
      if (cancelled) {
        return;
      }
      const asset = assets.find(item => item.assignedUser) ?? assets[0] ?? null;
      if (!asset) {
        clearCachedAssignedAsset(userId, CATEGORY);
        if (!cancelled) {
          setDataUri(null);
        }
        return;
      }
      if (asset.id === cached?.assetId) {
        return;
      }
      const uri = await fetchAssetDataUri(asset, sessionToken);
      if (cancelled) {
        return;
      }
      if (uri) {
        setCachedAssignedAsset(userId, CATEGORY, asset.id, uri);
        setDataUri(uri);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionToken, userId, cached?.assetId]);

  return dataUri;
}

export default useAssignedFrame;
