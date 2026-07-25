import React from 'react';
import { fetchAssetDataUri, fetchUploadCatalog } from '../api';
import { useAppStore } from '../store';

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

export function useBannerAssets() {
  const sessionToken = useAppStore(state => state.session?.token);
  const [banners, setBanners] = React.useState([]);

  React.useEffect(() => {
    if (!sessionToken) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const assets = await fetchUploadCatalog(sessionToken, { category: 'BANNERS' });
      if (cancelled) {
        return;
      }
      const withUris = await Promise.all(
        sortBanners(assets).map(async asset => {
          const uri = await fetchAssetDataUri(asset, sessionToken);
          if (!uri) {
            return null;
          }
          // Strip the ordering prefix off the display title — "1 Create
          // Agency" is shown as just "Create Agency".
          const title = (asset.name ?? '').replace(/^\s*\d+\s*[-._]?\s*/, '').trim();
          return { id: asset.id, uri, title };
        })
      );
      if (!cancelled) {
        setBanners(withUris.filter(Boolean));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  return banners;
}

export default useBannerAssets;
