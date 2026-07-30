import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAssetDataUri, fetchMyProps } from '../api';
import { getSessionSocket } from '../services/socket';
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
export function assetIdentity(url) {
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
  const [propsVersion, setPropsVersion] = React.useState(0);
  // Tracks the identity actually reflected in `dataUri` right now — kept in
  // sync imperatively every time we clear/set the on-disk cache, unlike
  // `cached` above (only read once per targetUserId/category, so it goes
  // stale the moment we clear/re-set mid-lifetime — e.g. unequip then
  // re-equip the same frame: `cached` would still show the old assetId,
  // making the re-equip look like a no-op and leaving dataUri stuck at the
  // null the unequip step set it to).
  const resolvedIdentityRef = React.useRef(cached?.assetId ?? null);

  React.useEffect(() => {
    if (targetUserId !== ownUserId) {
      return undefined;
    }
    const socket = getSessionSocket();
    const bump = () => setPropsVersion(version => version + 1);
    socket?.on('props:granted', bump);
    socket?.on('props:updated', bump);
    return () => {
      socket?.off('props:granted', bump);
      socket?.off('props:updated', bump);
    };
  }, [targetUserId, ownUserId]);

  useFocusEffect(
    React.useCallback(() => {
      if (targetUserId === ownUserId) {
        setPropsVersion(version => version + 1);
      }
    }, [targetUserId, ownUserId])
  );

  React.useEffect(() => {
    if (!sessionToken || !targetUserId) {
      return undefined;
    }
    let cancelled = false;

    if (explicitUrl !== undefined) {
      if (!explicitUrl) {
        clearCachedAssignedAsset(targetUserId, category);
        resolvedIdentityRef.current = null;
        setDataUri(null);
        return undefined;
      }
      const identity = assetIdentity(explicitUrl);
      if (identity === resolvedIdentityRef.current) {
        return undefined;
      }
      // A network failure here (fetchAssetDataUri returns null) leaves
      // dataUri untouched — still showing whatever was last cached — rather
      // than clearing it, so a connectivity blip never blanks out an
      // already-loaded frame/badge/background.
      fetchAssetDataUri({ url: explicitUrl }, sessionToken).then(uri => {
        if (!cancelled && uri) {
          setCachedAssignedAsset(targetUserId, category, identity, uri);
          resolvedIdentityRef.current = identity;
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

    fetchMyProps(sessionToken).then(async propsData => {
      if (cancelled || propsData === null) {
        return;
      }
      const equipped = propsData?.equipped?.[category];
      if (!equipped?.url) {
        clearCachedAssignedAsset(targetUserId, category);
        resolvedIdentityRef.current = null;
        setDataUri(null);
        return;
      }
      const identity = assetIdentity(equipped.url) ?? equipped.assetId;
      if (identity === resolvedIdentityRef.current) {
        return;
      }
      const uri = await fetchAssetDataUri({ url: equipped.url }, sessionToken);
      if (!cancelled && uri) {
        setCachedAssignedAsset(targetUserId, category, identity, uri);
        resolvedIdentityRef.current = identity;
        setDataUri(uri);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessionToken, targetUserId, ownUserId, category, kind, explicitUrl, propsVersion]);

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
