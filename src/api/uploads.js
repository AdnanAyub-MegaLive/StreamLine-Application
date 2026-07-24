import { appEnv } from '@/config/env';
import { apiClient } from './client';

// Workaround for a backend bug: the catalog endpoint sometimes builds asset
// file URLs from the request's resolved origin, which can come back as
// "http://localhost:<port>" instead of the backend's real LAN/public
// address — meaningless on a phone, since "localhost" there means the
// device itself, not the backend server. Rewrites the origin to the app's
// own configured API base URL (same host it just successfully fetched the
// catalog from) whenever this happens, keeping the path/query untouched.
// Safe to remove once the backend always returns its real address.
function fixLocalhostOrigin(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return url;
    }
    const base = new URL(appEnv.apiBaseUrl);
    parsed.protocol = base.protocol;
    parsed.hostname = base.hostname;
    parsed.port = base.port;
    return parsed.toString();
  } catch {
    return url;
  }
}

// GET /api/uploads/catalog — see StreamLine-Portal's mobile upload catalog
// docs. Returns global assets plus assets specifically assigned to the
// authenticated user; assets assigned to other users are never included.
// Fails silently (returns []) so a network blip or the endpoint not
// existing yet on an older backend build just shows whatever local
// fallback the caller already has, instead of an error.
export async function fetchUploadCatalog(sessionToken, { category, roomBackground } = {}) {
  try {
    const response = await apiClient.get('/api/uploads/catalog', {
      params: {
        category,
        roomBackground: roomBackground ? 'true' : undefined
      },
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
    const assets = response.data?.data?.assets ?? [];
    return assets.map(asset => (asset.url ? { ...asset, url: fixLocalhostOrigin(asset.url) } : asset));
  } catch {
    return [];
  }
}

// Asset file URLs require the same Bearer token as everything else — build
// an <Image>/<ImageBackground> source that carries it, instead of every
// caller re-deriving this shape by hand.
export function assetImageSource(asset, sessionToken) {
  return {
    uri: asset.url,
    headers: { Authorization: `Bearer ${sessionToken}` }
  };
}

// React Native's <Image>/<ImageBackground> don't reliably forward a custom
// Authorization header to the underlying native image loader on every
// platform/RN version — assetImageSource() above can silently fail to
// authenticate even though the URL and token are both correct. This fetches
// the file over plain JS instead and returns a `data:` URI, which needs no
// headers at all since the bytes are embedded directly.
//
// Deliberately fetch + blob + FileReader, NOT axios with
// responseType:'arraybuffer' — axios rides on RN's XMLHttpRequest, whose
// arraybuffer support is broken (the "bytes" come back as a UTF-8-mangled
// string), so the encoded data URI was corrupt and <Image> silently fired
// onError, which is why the background never appeared even though every
// request returned 200. FileReader.readAsDataURL produces the data URI
// natively from the blob, mime type included. Returns null on any failure —
// callers should fall back to a default background.
export async function fetchAssetDataUri(asset, sessionToken) {
  try {
    const fileUrl = fixLocalhostOrigin(asset.url);
    const response = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
