import React from 'react';
import { fetchAssetDataUri, fetchUploadCatalog } from '../api';
import { useAppStore } from '../store';
import { getCachedAssetList, setCachedAssetList } from '../utils';

const CATEGORY = 'BANNERS';

// Fetches the BANNERS the admin uploaded from the portal (see
// StreamLine-Portal's mobile upload catalog docs) for the Party tab's
// banner carousel. Each image is downloaded as a data: URI — same reason
// as useAssignedRoomBackground: <Image> doesn't reliably forward a custom
// Authorization header to the native loader, so we fetch the bytes over
// plain JS and embed them. Returns [] until loaded / when none exist, so
// the carousel falls back to its bundled text promos.
// Banner ordering convention: the admin controls each banner's position in
// the carousel by starting its name with a number on the portal's upload
// page — "1 Create Agency" shows first, "2 Weekend Event" second, etc.
// Banners without a leading number go after all numbered ones, in name
// order. No backend change needed; the catalog already returns `name`.
function bannerPosition(asset) {
  const match = /^\s*(\d+)/.exec(asset.name ?? '');
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function sortBanners(assets) {
  return [...assets].sort((a, b) => {
    const posDiff = bannerPosition(a) - bannerPosition(b);
    if (posDiff !== 0) {
      return posDiff;
    }
    return (a.name ?? '').localeCompare(b.name ?? '');
  });
}

// Cached (see src/utils/assignedAssetCache.js) — renders the last-known
// banner set instantly from disk on mount, and only re-downloads image
// bytes for banners whose id wasn't already in that cached set, instead of
// re-fetching the catalog and every single banner image on every visit to
// the Party tab.
export function useBannerAssets() {
  const sessionToken = useAppStore(state => state.session?.token);
  const userId = useAppStore(state => state.session?.user?.publicId);
  const cached = React.useMemo(() => getCachedAssetList(userId, CATEGORY), [userId]);
  const [banners, setBanners] = React.useState(cached?.items ?? []);

  React.useEffect(() => {
    if (!sessionToken) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const catalog = await fetchUploadCatalog(sessionToken, { category: CATEGORY });
      // null means the request itself failed (network/server) — keep
      // showing whatever's already cached/rendered instead of wiping the
      // carousel to empty on a connectivity blip.
      if (catalog === null || cancelled) {
        return;
      }
      const assets = sortBanners(catalog);
      const ids = assets.map(asset => asset.id);
      // Exact same set of banners (same ids, same order) as last time —
      // the cached images are already showing, nothing to re-download.
      if (cached && cached.ids.length === ids.length && cached.ids.every((id, index) => id === ids[index])) {
        return;
      }
      const cachedById = new Map((cached?.items ?? []).map(item => [item.id, item]));
      const withUris = await Promise.all(
        assets.map(async asset => {
          // Reuse the already-downloaded bytes for a banner that was in
          // the previous set too — only genuinely new/changed banners
          // need a fresh download.
          const previous = cachedById.get(asset.id);
          if (previous) {
            return previous;
          }
          const uri = await fetchAssetDataUri(asset, sessionToken);
          if (!uri) {
            return null;
          }
          // Strip the ordering prefix off the display title — "1 Create
          // Agency" is shown as just "Create Agency".
          const title = (asset.name ?? '').replace(/^\s*\d+\s*[-._]?\s*/, '').trim();
          // See StreamLine-Portal's docs/mobile-upload-catalog-api.md —
          // tapping a banner opens actionUrl (a marketing/campaign page)
          // when the admin set one; banners with none just show the
          // generic BannerDetail page instead.
          return { id: asset.id, uri, title, actionUrl: asset.actionUrl ?? null };
        })
      );
      if (!cancelled) {
        const resolved = withUris.filter(Boolean);
        setBanners(resolved);
        setCachedAssetList(userId, CATEGORY, ids, resolved);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken, userId, cached]);

  return banners;
}

export default useBannerAssets;
