import React from 'react';
import { Room } from 'livekit-client';
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

  // publish: true grants a real speaker (owner/seated) a mic-publish
  // attempt — actual enforcement of who may publish must happen
  // server-side, in what token grants the backend issues (see the token
  // spec's Phase 3 note); this flag only controls this client's own
  // initial local intent, not a security boundary.
  const connect = React.useCallback(async (sessionToken, roomId, { publish = false } = {}) => {
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
      return room;
    } catch (error) {
      console.warn('[LiveKit] connect failed (expected until the backend token endpoint exists):', error?.message ?? error);
      return null;
    }
  }, []);

  const setMicEnabled = React.useCallback(async enabled => {
    try {
      await roomRef.current?.localParticipant.setMicrophoneEnabled(enabled);
    } catch (error) {
      console.warn('[LiveKit] setMicrophoneEnabled failed:', error?.message ?? error);
    }
  }, []);

  const disconnect = React.useCallback(async () => {
    try {
      await roomRef.current?.disconnect();
    } catch {
      // Already disconnected/never connected — nothing to clean up.
    }
    roomRef.current = null;
    if (sessionStartedRef.current) {
      sessionStartedRef.current = false;
      await AudioSession.stopAudioSession().catch(() => {});
    }
  }, []);

  React.useEffect(() => () => {
    roomRef.current?.disconnect().catch(() => {});
  }, []);

  return { connect, disconnect, setMicEnabled };
}

export default useLiveKitAudio;
