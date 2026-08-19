import React from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import { fetchLiveKitToken } from '../api/livekit';

// Real-time voice transport for audio rooms — everything up to this point
// in the app (seats, mute button, chat) is pure Socket.IO signaling with no
// actual audio path; this is what makes people in a room able to hear each
// other. See docs/audio-live-rooms-implementation-plan.md, Phase 1.
//
// connect() still fails gracefully (caught, logged, no crash, no UI change)
// on any token/network error — e.g. LIVEKIT_URL/API_KEY/API_SECRET not
// configured on the server yet (503 LIVEKIT_NOT_CONFIGURED).
//
// Deliberately uses livekit-client's imperative Room API instead of
// @livekit/react-native's <LiveKitRoom>/hooks — RoomScreen is a large,
// already-built custom UI (seats, chat, gifts), not a fresh component tree
// that could be restructured around LiveKit's declarative wrapper.
export function useLiveKitAudio() {
  const roomRef = React.useRef(null);
  const sessionStartedRef = React.useRef(false);
  const listenersRef = React.useRef([]); // [{ event, handler }] — caller-registered only, see `on`/`off`
  // "Turn Speaker Off" (see RoomScreen's MoreMenuModal) used to only flip a
  // cosmetic icon — this makes it real. 1 = normal, 0 = silent. Applied to
  // every currently-subscribed remote audio track immediately on toggle
  // (see setRemoteAudioMuted below), and to every track subscribed
  // afterward (someone unmuting/taking a seat later, or across a
  // reconnect) via this internal listener — kept separate from
  // listenersRef so disconnect() clearing caller listeners never drops it.
  // Local mic publishing is completely unaffected — this only ever
  // touches what THIS device hears.
  const remoteVolumeRef = React.useRef(1);
  const handleTrackSubscribedForVolumeRef = React.useRef(track => {
    if (track?.kind === Track.Kind.Audio) {
      track.setVolume?.(remoteVolumeRef.current);
    }
  });
  // BUGFIX: connect()/reconnect() are async (network round trip); a caller
  // that fires setMicEnabled right after taking a seat (very likely — it's
  // the first thing anyone wants to do) could run it before the room
  // swapped in by reconnect() actually finished connecting, silently
  // publishing nothing. Every operation below is queued through this so
  // setMicEnabled always waits for any connect/reconnect already in
  // flight — no separate "is it ready yet" state needed in RoomScreen.
  const queueRef = React.useRef(Promise.resolve());
  const enqueue = task => {
    const result = queueRef.current.then(task, task);
    queueRef.current = result.then(
      () => {},
      () => {}
    );
    return result;
  };

  // Re-attaches every listener registered via `on` below, plus the
  // internal volume listener (see reconnect's comment) — called once
  // right after any room becomes the current one.
  const attachListeners = room => {
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribedForVolumeRef.current);
    for (const { event, handler } of listenersRef.current) {
      room.on(event, handler);
    }
  };

  const setRemoteAudioMuted = React.useCallback(muted => {
    remoteVolumeRef.current = muted ? 0 : 1;
    const room = roomRef.current;
    if (!room) {
      return;
    }
    for (const participant of room.remoteParticipants.values()) {
      for (const publication of participant.audioTrackPublications.values()) {
        publication.track?.setVolume?.(remoteVolumeRef.current);
      }
    }
  }, []);

  const connect = React.useCallback(
    (sessionToken, roomId, { publish = false } = {}) =>
      enqueue(async () => {
        try {
          if (!sessionStartedRef.current) {
            await AudioSession.startAudioSession();
            sessionStartedRef.current = true;
          }
          const { token, url } = await fetchLiveKitToken(sessionToken, roomId);
          const room = new Room();
          await room.connect(url, token);
          if (publish) {
            // Starts muted regardless — matches "initially keep the newly
            // seated speaker muted" from the seating spec; the existing mic
            // toggle (see setMicEnabled) is what actually lets them speak.
            await room.localParticipant.setMicrophoneEnabled(false);
          }
          roomRef.current = room;
          attachListeners(room);
          return room;
        } catch (error) {
          console.warn('[LiveKit] connect failed (expected until the backend token endpoint exists):', error?.message ?? error);
          return null;
        }
      }),
    []
  );

  // Swaps in a fresh token/url without a full re-connect() round trip —
  // used after audio-room:seat-take/seat-move/seat-leave, each of which
  // already returns a ready-to-use LiveKit token in its ack (see
  // docs/mobile-audio-room-api.md's "Server-authoritative live seats"), so
  // there's no need to hit the token endpoint again. AudioSession is left
  // running (already started by the original connect()). Every listener
  // registered via `on` is re-attached to the new Room instance — without
  // this, speaking/mute detection silently stopped working the moment a
  // seat action swapped the room out from under the original listeners.
  const reconnect = React.useCallback(
    (url, token, { publish = false } = {}) =>
      enqueue(async () => {
        try {
          await roomRef.current?.disconnect().catch(() => {});
          const room = new Room();
          await room.connect(url, token);
          if (publish) {
            await room.localParticipant.setMicrophoneEnabled(false);
          }
          roomRef.current = room;
          attachListeners(room);
          return room;
        } catch (error) {
          console.warn('[LiveKit] reconnect failed:', error?.message ?? error);
          return null;
        }
      }),
    []
  );

  const setMicEnabled = React.useCallback(
    enabled =>
      enqueue(async () => {
        try {
          await roomRef.current?.localParticipant.setMicrophoneEnabled(enabled);
          console.log('[LiveKit] setMicrophoneEnabled', enabled, '— isMicrophoneEnabled now', roomRef.current?.localParticipant.isMicrophoneEnabled);
        } catch (error) {
          // Publishing while unauthorized (e.g. a non-owner today — see the
          // token route's canPublish grant) throws here rather than silently
          // no-op'ing, so this is the exact place a rejected publish surfaces.
          console.warn('[LiveKit] setMicrophoneEnabled failed:', error?.message ?? error);
        }
      }),
    []
  );

  // Registers a RoomEvent listener that survives every future
  // reconnect() — call once (e.g. inside an effect) instead of
  // room.on(...) directly on whatever room a connect()/reconnect() call
  // happened to resolve with.
  const on = React.useCallback((event, handler) => {
    listenersRef.current = [...listenersRef.current, { event, handler }];
    roomRef.current?.on(event, handler);
  }, []);

  const off = React.useCallback((event, handler) => {
    listenersRef.current = listenersRef.current.filter(entry => entry.event !== event || entry.handler !== handler);
    roomRef.current?.off(event, handler);
  }, []);

  const disconnect = React.useCallback(
    () =>
      enqueue(async () => {
        try {
          await roomRef.current?.disconnect();
        } catch {
          // Already disconnected/never connected — nothing to clean up.
        }
        roomRef.current = null;
        listenersRef.current = [];
        if (sessionStartedRef.current) {
          sessionStartedRef.current = false;
          await AudioSession.stopAudioSession().catch(() => {});
        }
      }),
    []
  );

  React.useEffect(() => () => {
    roomRef.current?.disconnect().catch(() => {});
  }, []);

  // Memoized so callers can safely put this in a useEffect dependency array
  // — every returned function is already stable (empty-dep useCallback),
  // but the wrapping object literal wasn't, which made any effect
  // depending on it re-run on every render of the caller.
  return React.useMemo(
    () => ({ connect, disconnect, setMicEnabled, reconnect, on, off, setRemoteAudioMuted }),
    [connect, disconnect, setMicEnabled, reconnect, on, off, setRemoteAudioMuted]
  );
}

export default useLiveKitAudio;
