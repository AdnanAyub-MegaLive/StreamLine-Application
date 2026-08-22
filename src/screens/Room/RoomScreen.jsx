import React from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { RoomEvent, Track } from 'livekit-client';
import Svg, { Path } from 'react-native-svg';
import Video from 'react-native-video';
import { useTheme } from '../../theme';
import { LockIcon, roomBackgroundImage } from '../../assets';
import { Avatar, EmojiPickerModal, GiftPickerModal, SeatLayoutModal, showAlert } from '../../components';
import { AudioRoomError, endAudioRoom as endAudioRoomRecord, fetchAssetDataUri, fixLocalhostOrigin, GiftSendError, sendGift, startAudioRoom, updateAudioRoom, uploadAudioRoomCover } from '../../api';
import { assetIdentity, useAssignedFrame, useAssignedRoomBackground, useLiveKitAudio } from '../../hooks';
import {
  getSessionSocket,
  joinAudioRoom,
  kickFromSeat,
  leaveAudioRoom,
  leaveSeat,
  lockSeat,
  moveSeat,
  sendAudioRoomMessage,
  takeSeat,
  updateSeatStatus
} from '../../services/socket';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import {
  clearCachedSeatState,
  dismissLiveRoomNotification,
  getCachedAssetByIdentity,
  getCachedSeatState,
  registerLiveRoomActionHandler,
  scaleFont,
  scaleModerate,
  setCachedAssetByIdentity,
  setCachedSeatState,
  showLiveRoomNotification
} from '../../utils';
import { bannerHoldMs, buildSeatRowsFromGroups, CHAT_MESSAGE_MAX_LENGTH, isVideoUrl, SEAT_NOTE_MAX_LENGTH } from './roomUtils';

// Store/props assets aren't always static images — Rides in particular are
// short video clips (see src/components/AssetPreview.jsx). The backend
// doesn't send a mimeType alongside entranceUrl/rideUrl, so this sniffs the
// file extension instead — good enough for the CDN URLs these come from.
// How long a queued entrance/ride item stays on screen (the slide-in-hold-
// slide-out animation's middle "hold" portion) — a plain text/image banner
// only ever needed a beat to be read, but a video needs real time to
// actually play, not just flash by mid-slide.
const BANNER_SLIDE_MS = 350;

function MicIcon({ size = 12, color, muted = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-7 0V12a3.5 3.5 0 0 0 3.5 3.5Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M7 11v1a5 5 0 0 0 10 0v-1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 18.5V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {muted ? <Path d="M5 5l14 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" /> : null}
    </Svg>
  );
}

function StarIcon({ size = 10, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7-5.4-4.7 7.1-.6L12 2Z" />
    </Svg>
  );
}

function DiamondIcon({ size = 9, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
    </Svg>
  );
}

function ShieldIcon({ size = 9, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
    </Svg>
  );
}

function PlusIcon({ size = 22, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 16, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChatBubbleIcon({ size = 16, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16v12H8l-4 4V4Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

function SendIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12 20 4l-6 16-3-6-7-2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

function MoodIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke={color} strokeWidth="1.6" />
      <Path d="M8.5 10h.01M15.5 10h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8.5 14.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function GiftIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9h16v11H4V9Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M2 6h20v4H2V6Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M12 6v14M12 6c-1.5-3-6-3-6 0s4.5 0 6 0Zm0 0c1.5-3 6-3 6 0s-4.5 0-6 0Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </Svg>
  );
}

function SpeakerIcon({ size = 18, color, muted = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9v6h4l5 4V5L8 9H4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      {muted ? (
        <Path d="M16 8l5 8M21 8l-5 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <Path d="M16.5 9a3.5 3.5 0 0 1 0 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      )}
    </Svg>
  );
}

function SeatsIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm12 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM12 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" stroke={color} strokeWidth="1.6" />
      <Path d="M3 20v-2a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2M15 20v-2a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2M9 20v-1a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function PhotoIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="1.6" />
      <Path d="M3 16l5-5 4 4 3-3 6 6" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill={color} />
    </Svg>
  );
}

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/avataaars/svg';
const SEAT_HOLD_MS = 500;

// Seats are now server-authoritative (see docs/mobile-audio-room-api.md's
// "Server-authoritative live seats") — but the backend only ever persists a
// FIXED 12 seats per room (row0-seat1..4, row1-seat1..4, row2-seat1..4),
// while this app's own room-creation flow still lets the owner pick a
// larger visual layout (SEAT_LAYOUT_OPTIONS — up to 22 seats). Per product
// decision: the owner's own identity panel + the first 11 visual seats
// (row-major order) are the real, functional slots — mapped 1:1 onto the
// server's first 11 seat ids below (the server's 12th seat, row2-seat4,
// is simply never targeted by this client). Any visual seat beyond the
// 11th (only possible in the larger layouts) is purely decorative — it
// never becomes takeable, since there's no persisted seat behind it.
const SERVER_SEAT_IDS = [
  'row0-seat1', 'row0-seat2', 'row0-seat3', 'row0-seat4',
  'row1-seat1', 'row1-seat2', 'row1-seat3', 'row1-seat4',
  'row2-seat1', 'row2-seat2', 'row2-seat3'
];

// Position of a visual seat id within the flattened (row-major) seatRows
// grid this screen renders — -1 if not found.
function visualSeatIndex(seatRows, seatId) {
  let index = -1;
  let cursor = 0;
  for (const row of seatRows ?? []) {
    for (const seat of row) {
      if (seat.id === seatId) {
        index = cursor;
      }
      cursor += 1;
    }
  }
  return index;
}

// The real, persisted server seat id backing a given visual seat — null
// for a decorative seat beyond the first 11 (see SERVER_SEAT_IDS above).
function serverSeatIdForVisualSeat(seatRows, seatId) {
  const index = visualSeatIndex(seatRows, seatId);
  return index >= 0 && index < SERVER_SEAT_IDS.length ? SERVER_SEAT_IDS[index] : null;
}

function occupancyFromServerSeat(seat) {
  const occupant = seat?.occupant;
  return {
    locked: Boolean(seat?.locked),
    occupied: Boolean(seat?.occupied),
    name: occupant?.name ?? null,
    avatarSeed: occupant?.publicId ?? null,
    avatarUri: occupant?.profileImage ?? null,
    frameUrl: occupant?.frameUrl ?? null,
    badgeUrl: occupant?.badgeUrl ?? null,
    isOfficial: Boolean(occupant?.isOfficial),
    muted: seat?.occupied ? Boolean(seat.muted) : true,
    speaking: seat?.occupied ? Boolean(seat.speaking) : false,
    note: seat?.note ?? undefined
  };
}

// BUGFIX: a plain viewer never has a local visual grid at all — only the
// owner builds one, from their own chosen SEAT_LAYOUT_OPTIONS at room
// start/resume (see seatRows' useState initializer). Overlaying server
// data onto an empty/missing grid produced an empty (but still truthy)
// array, so the whole seats section rendered with nothing inside — no
// seats, no occupant avatars, for every viewer.
//
// ownerSeatGroups (when known — see docs/room-seat-layout-spec.md, not yet
// returned by the backend as of this writing) lets a viewer see the SAME
// shape the owner actually picked instead of a generic default, exactly
// like buildSeatRowsFromGroups builds for the owner's own device. Falls
// back to a fixed 3+4+4 (all 11 real seats, no decorative ones) whenever
// the owner's choice isn't known yet.
function defaultRealSeatGrid(ownerSeatGroups) {
  if (Array.isArray(ownerSeatGroups) && ownerSeatGroups.length) {
    return buildSeatRowsFromGroups(ownerSeatGroups);
  }
  return [
    SERVER_SEAT_IDS.slice(0, 3).map(id => ({ id, name: null, occupied: false, locked: false })),
    SERVER_SEAT_IDS.slice(3, 7).map(id => ({ id, name: null, occupied: false, locked: false })),
    SERVER_SEAT_IDS.slice(7, 11).map(id => ({ id, name: null, occupied: false, locked: false }))
  ];
}

// Overlays the server's 12-seat occupancy state onto the CURRENT visual
// grid by position (see SERVER_SEAT_IDS) — visual seats beyond the 11th
// keep their existing (always-empty, decorative) local state untouched,
// since the server has nothing to say about them.
function applyServerSeatRowsToVisual(visualSeatRows, serverSeatRows, ownerSeatGroups) {
  const baseRows = visualSeatRows?.length ? visualSeatRows : defaultRealSeatGrid(ownerSeatGroups);
  const serverFlat = (serverSeatRows ?? []).flat();
  let cursor = 0;
  return baseRows.map(row =>
    row.map(seat => {
      const index = cursor;
      cursor += 1;
      if (index >= SERVER_SEAT_IDS.length) {
        return seat;
      }
      return { ...seat, ...occupancyFromServerSeat(serverFlat[index]) };
    })
  );
}

function findMySeatId(seatRows, ownPublicId) {
  if (!ownPublicId) {
    return null;
  }
  for (const row of seatRows ?? []) {
    for (const seat of row) {
      if (seat.occupied && seat.avatarSeed === ownPublicId) {
        return seat.id;
      }
    }
  }
  return null;
}

// Drives the existing speaking-ring indicators below from real LiveKit
// ActiveSpeakersChanged events (see the connect effect's
// handleActiveSpeakersChanged) — LiveKit's own SDK already applies a
// volume threshold and smoothing/release delay before adding a
// participant to that event's list, so no raw audio-level sampling or
// custom threshold logic is needed here; this only turns that boolean
// into a starts/stops animation loop.
function useSpeakingPulse(active) {
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);
  return pulse;
}

// The host's ring (styles.speakingRing) is always visible as a static
// identity marker — this only adds a subtle pulse on top of it while
// seat.speaking is true, without introducing a second/new ring for hosts.
function HostSpeakingRing({ size, borderColor, speaking }) {
  const pulse = useSpeakingPulse(speaking);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <Animated.View
      style={[
        styles.speakingRing,
        { width: size, height: size, borderRadius: size / 2, borderColor, transform: [{ scale }] }
      ]}
    />
  );
}

// Non-host seats only ever mount this (see the seat.speaking && !seat.host
// conditional below) while actually speaking, so it's always "active" —
// mounting/unmounting IS the static-vs-speaking toggle for this one.
function SeatSpeakingRing({ size, borderColor }) {
  const pulse = useSpeakingPulse(true);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <Animated.View
      style={[
        styles.speakingRingSoft,
        { width: size, height: size, borderRadius: size / 2, borderColor, opacity, transform: [{ scale }] }
      ]}
    />
  );
}

// Builds the seat rows for a freshly created audio room from the chosen
// seat-layout tiers (e.g. [2, 3, 5, 5]). The room owner has their own fixed
// spot in the header identity panel — they never occupy a numbered seat —
// so every seat starts open for other participants to take.

function Seat({ seat, theme, columnStyle, circleSize = scaleModerate(56), onEmptySeatPress, pressEnabled, isOwner, isMySeat, note, onAvatarPress, onLongPressSeat, myFrameUri }) {
  const avatarInnerSize = circleSize - 4;
  const ringSize = circleSize + 4;
  // Sized well past ringSize (which sits right at the seat's own outer
  // border, same as the speaking rings) so the frame's decorative artwork
  // wraps fully outside that border instead of overlapping/clipping into
  // it — matches the identity panel's own frame margin (ownerFrameSize).
  const frameSize = circleSize + 16;
  const micBadgeSize = Math.max(scaleModerate(16), Math.round(circleSize * 0.36));
  // The server resolves and includes each occupant's frameUrl directly in
  // every seat-update broadcast (see occupancyFromServerSeat) — resolved
  // here into a displayable URI the same way myFrameUri already is. Must
  // be an unconditional hook call (before the early-return below for empty
  // seats) — 'empty-seat' is a sentinel userId, never a real one, so an
  // empty/frameless seat harmlessly
  // resolves to null instead of accidentally reading this DEVICE's own
  // cached frame under its own user id.
  const remoteFrameUri = useAssignedFrame({
    userId: seat.avatarSeed ?? 'empty-seat',
    frameUrl: seat.avatarSeed ? seat.frameUrl ?? null : null
  });
  const hasOwnFrame = isMySeat && Boolean(myFrameUri);
  const hasRemoteFrame = !isMySeat && Boolean(remoteFrameUri);
  const showFrame = hasOwnFrame || hasRemoteFrame;
  const displayFrameUri = hasOwnFrame ? myFrameUri : remoteFrameUri;
  const avatarInnerBackground = showFrame ? 'transparent' : theme.surfaces.card;
  React.useEffect(() => {
    if (seat.occupied && !isMySeat) {
      console.log('[SeatFrame] Seat resolved', {
        seatId: seat.id,
        avatarSeed: seat.avatarSeed,
        incomingFrameUrl: seat.frameUrl ?? null,
        resolvedRemoteFrameUri: remoteFrameUri ? 'present' : null
      });
    }
  }, [seat.id, seat.occupied, seat.avatarSeed, seat.frameUrl, isMySeat, remoteFrameUri]);

  if (!seat.occupied) {
    // Locked seats stay non-interactive for everyone except the owner —
    // who can still tap to manage (unlock/relock/set note) it, same as any
    // other empty seat. Previously this was a plain View with no press
    // handler at all, so the owner had no way to ever unlock a seat again
    // once locked.
    if (seat.locked && !isOwner) {
      return (
        <View style={[styles.seatColumn, columnStyle]}>
          <View
            style={[
              styles.seatCircle,
              styles.seatCircleLocked,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                borderColor: theme.colors.cardBorder,
                backgroundColor: theme.surfaces.card
              }
            ]}
          >
            <LockIcon size={Math.round(circleSize * 0.32)} color={theme.text.mutedIcon} />
          </View>
          <Text style={[styles.seatLabel, { color: theme.text.secondary }]} numberOfLines={1}>
            Locked
          </Text>
        </View>
      );
    }
    return (
      <Pressable
        style={[styles.seatColumn, columnStyle]}
        disabled={!pressEnabled}
        onPress={() => onEmptySeatPress?.(seat.id)}
      >
        <View
          style={[
            styles.seatCircle,
            seat.locked ? styles.seatCircleLocked : styles.seatCircleEmpty,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderColor: seat.locked ? theme.colors.cardBorder : theme.colors.teal700,
              backgroundColor: theme.surfaces.card
            }
          ]}
        >
          {seat.locked ? (
            <LockIcon size={Math.round(circleSize * 0.32)} color={theme.text.mutedIcon} />
          ) : (
            <PlusIcon size={Math.round(circleSize * 0.36)} color={theme.colors.teal700} />
          )}
        </View>
        <Text style={[styles.seatLabel, { color: theme.text.secondary }]} numberOfLines={1}>
          {seat.locked ? 'Locked' : note || 'Take seat'}
        </Text>
      </Pressable>
    );
  }

  // Seats no longer drag/slide around the layout — only your own seat
  // still responds to a hold, which opens the "Leave Seat" prompt (see
  // handleLeaveSeatPress), now a plain Pressable long-press instead of a
  // PanResponder-driven gesture.
  const SeatWrapper = isMySeat ? Pressable : View;
  const wrapperProps = isMySeat
    ? { style: [styles.seatColumn, columnStyle], onLongPress: () => onLongPressSeat?.(seat.id), delayLongPress: SEAT_HOLD_MS }
    : { style: [styles.seatColumn, columnStyle] };

  // Tapping a seated participant's avatar opens their profile — but never
  // for your own seat.
  const AvatarWrapper = isMySeat ? View : Pressable;
  const avatarWrapperProps = isMySeat ? {} : { onPress: () => onAvatarPress?.(seat) };

  return (
    <SeatWrapper {...wrapperProps}>
      <AvatarWrapper {...avatarWrapperProps} style={[styles.seatAvatarWrap, { width: circleSize, height: circleSize }]}>
        {/* Both rings below are skipped once a frame is showing (showFrame)
        — the frame has its own decorative border, and a plain ring the
        same size was peeking through its artwork's transparent margins as
        a stray green line behind it. */}
        {seat.host && !showFrame ? (
          <HostSpeakingRing size={ringSize} borderColor={theme.colors.teal700} speaking={seat.speaking} />
        ) : null}
        {seat.speaking && !seat.host && !showFrame ? (
          <SeatSpeakingRing size={ringSize} borderColor={theme.colors.teal400} />
        ) : null}
        <View
          style={[
            styles.seatAvatarInner,
            {
              width: avatarInnerSize,
              height: avatarInnerSize,
              borderRadius: avatarInnerSize / 2,
              backgroundColor: avatarInnerBackground
            }
          ]}
        >
          <Avatar
            value={seat.avatarUri || `${AVATAR_PLACEHOLDER}?seed=${seat.avatarSeed}`}
            fullName={seat.name}
            size={avatarInnerSize}
          />
        </View>
        {showFrame ? (
          // Sits as its own overlay (not inside seatAvatarInner, which
          // clips to a circle). Deliberately NOT reusing styles.speakingRing
          // — it carries a fixed borderRadius meant for that circular ring
          // indicator, which was forcing the frame's own (often
          // non-circular/decorative) artwork into a clipped circle.
          <Image
            source={{ uri: displayFrameUri }}
            style={[styles.frameOverlay, { width: frameSize, height: frameSize }]}
            resizeMode="contain"
            pointerEvents="none"
          />
        ) : null}
        {showFrame ? null : (
          <View
            style={[
              styles.micBadge,
              {
                width: micBadgeSize,
                height: micBadgeSize,
                borderRadius: micBadgeSize / 2,
                borderColor: theme.surfaces.card
              },
              seat.muted ? { backgroundColor: theme.colors.giftAccent } : { backgroundColor: theme.colors.teal700 }
            ]}
          >
            <MicIcon size={Math.round(micBadgeSize * 0.55)} muted={seat.muted} color={theme.cta.primary.text} />
          </View>
        )}
      </AvatarWrapper>
      <View style={styles.nameRow}>
        {seat.host ? <StarIcon color={theme.colors.teal700} /> : null}
        <Text style={[styles.seatNameText, { color: theme.text.primary }]} numberOfLines={1}>
          {seat.name}
        </Text>
        {showFrame ? (
          // Moved off the photo (see seatAvatarInner/frame above) so the
          // frame is fully visible instead of partly covered by the badge.
          <View
            style={[
              styles.micBadgeInline,
              seat.muted ? { backgroundColor: theme.colors.giftAccent } : { backgroundColor: theme.colors.teal700 }
            ]}
          >
            <MicIcon size={10} muted={seat.muted} color={theme.cta.primary.text} />
          </View>
        ) : null}
      </View>
    </SeatWrapper>
  );
}


// Shown when the owner taps an empty seat — instead of taking the seat
// (which the owner can never do), they can pin any short custom text to
// that seat (e.g. "Reserved", "VIP", a name, anything they want).
function SeatNoteModal({ visible, value, onChangeText, onCancel, onSave, theme }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.noteBackdrop} onPress={onCancel}>
        <Pressable
          style={[styles.noteSheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <Text style={[styles.noteTitle, { color: theme.text.primary }]}>Seat Note</Text>
          <Text style={[styles.noteSubtitle, { color: theme.text.secondary }]}>
            You can't sit here — you're the room owner. Write anything you'd like for this seat instead.
          </Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Type here..."
            placeholderTextColor={theme.text.mutedIcon}
            maxLength={SEAT_NOTE_MAX_LENGTH}
            autoFocus
            style={[styles.noteInput, { color: theme.text.primary, borderColor: theme.colors.cardBorder }]}
          />
          <View style={styles.noteActions}>
            <Pressable onPress={onCancel} style={styles.noteCancelButton}>
              <Text style={[styles.noteCancelText, { color: theme.text.secondary }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onSave} style={[styles.noteSaveButton, { backgroundColor: theme.cta.primary.background }]}>
              <Text style={[styles.noteSaveText, { color: theme.cta.primary.text }]}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Bottom-bar "More" menu — a plain action sheet, not the full seat-layout
// picker itself (that's SeatLayoutModal, opened from here for the owner).
function MoreMenuModal({ visible, onClose, theme, isSpeakerMuted, onToggleSpeaker, showSeatLayoutOption, onOpenSeatLayout, showEditCoverOption, onEditCover }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.noteBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.moreSheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <Pressable onPress={onToggleSpeaker} style={styles.moreRow}>
            <SpeakerIcon color={theme.text.primary} muted={isSpeakerMuted} />
            <Text style={[styles.moreRowText, { color: theme.text.primary }]}>
              {isSpeakerMuted ? 'Turn Speaker On' : 'Turn Speaker Off'}
            </Text>
          </Pressable>
          {showSeatLayoutOption ? (
            <Pressable onPress={onOpenSeatLayout} style={styles.moreRow}>
              <SeatsIcon color={theme.text.primary} />
              <Text style={[styles.moreRowText, { color: theme.text.primary }]}>Change Seat Count</Text>
            </Pressable>
          ) : null}
          {showEditCoverOption ? (
            <Pressable onPress={onEditCover} style={styles.moreRow}>
              <PhotoIcon color={theme.text.primary} />
              <Text style={[styles.moreRowText, { color: theme.text.primary }]}>Edit Cover Photo</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose} style={styles.moreCancelButton}>
            <Text style={[styles.moreCancelText, { color: theme.text.secondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EntranceBanner({ entrance, onFinished }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const translateX = React.useRef(new Animated.Value(width)).current;
  const artUrl = entrance?.entranceUrl;
  const [videoFailed, setVideoFailed] = React.useState(false);
  const isVideo = Boolean(artUrl && !videoFailed && isVideoUrl(artUrl));
  const finishedRef = React.useRef(false);

  const slideOutAndFinish = React.useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    Animated.timing(translateX, { toValue: -width, duration: BANNER_SLIDE_MS, useNativeDriver: true }).start(() => {
      onFinished?.();
    });
  }, [translateX, width, onFinished]);

  React.useEffect(() => {
    finishedRef.current = false;
    setVideoFailed(false);
  }, [entrance]);

  React.useEffect(() => {
    if (!entrance) {
      return undefined;
    }
    translateX.setValue(width);
    Animated.timing(translateX, { toValue: 0, duration: BANNER_SLIDE_MS, useNativeDriver: true }).start();
    if (isVideo) {
      return undefined;
    }
    const timer = setTimeout(slideOutAndFinish, bannerHoldMs(entrance));
    return () => clearTimeout(timer);
  }, [entrance, translateX, width, isVideo, slideOutAndFinish]);

  if (!entrance) {
    return null;
  }

  const label = `${entrance.name} has entered the room`;

  if (isVideo) {
    return (
      <Animated.View pointerEvents="none" style={[styles.entranceArtBg, { transform: [{ translateX }] }]}>
        <Video
          source={{ uri: artUrl }}
          style={[StyleSheet.absoluteFill, styles.entranceArtBgImage]}
          resizeMode="cover"
          repeat={false}
          volume={1.0}
          ignoreSilentSwitch="ignore"
          useTextureView
          onEnd={slideOutAndFinish}
          onError={event => {
            console.log('[Entrance] art video FAILED', artUrl, JSON.stringify(event));
            setVideoFailed(true);
          }}
        />
        <Text style={[styles.entranceArtText, { color: theme.cta.primary.text }]} numberOfLines={1}>{label}</Text>
      </Animated.View>
    );
  }

  if (artUrl) {
    return (
      <Animated.View pointerEvents="none" style={{ transform: [{ translateX }] }}>
        <ImageBackground
          source={{ uri: artUrl }}
          resizeMode="stretch"
          style={styles.entranceArtBg}
          imageStyle={styles.entranceArtBgImage}
          onError={event => console.log('[Entrance] art image FAILED', artUrl, event.nativeEvent.error)}
        >
          <Text style={[styles.entranceArtText, { color: theme.cta.primary.text }]} numberOfLines={1}>{label}</Text>
        </ImageBackground>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.entranceBanner,
        { backgroundColor: theme.surfaces.card, borderColor: theme.colors.teal700, transform: [{ translateX }] }
      ]}
    >
      <Avatar value={entrance.profileImage} fullName={entrance.name} size={scaleModerate(26)} />
      <Text style={[styles.entranceText, { color: theme.text.primary }]} numberOfLines={1}>{label}</Text>
    </Animated.View>
  );
}

// A ride never slides or shows text — it takes over the whole screen the
// instant it's up, plays (with sound) for exactly as long as the clip
// actually runs (its own onEnd, not a guessed duration), then disappears
// and the room is visible again. onError clears it immediately too, so a
// broken clip can't freeze the room on this screen.
function RideFullscreen({ entrance, onFinished }) {
  const theme = useTheme();
  // useWindowDimensions() returns the "window" size, which on Android can
  // exclude the status bar area — leaving a black gap at the top instead
  // of truly covering the whole physical display. Dimensions.get('screen')
  // is the full display size regardless of system bars.
  const [screenSize, setScreenSize] = React.useState(() => Dimensions.get('screen'));
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ screen }) => setScreenSize(screen));
    return () => subscription.remove();
  }, []);
  const artUrl = entrance?.rideUrl;
  const finishedRef = React.useRef(false);
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    finishedRef.current = false;
    setVideoFailed(false);
  }, [entrance]);

  const finishOnce = React.useCallback(() => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    onFinished?.();
  }, [onFinished]);

  React.useEffect(() => {
    if (entrance && (!artUrl || videoFailed)) {
      finishOnce();
    }
  }, [entrance, artUrl, videoFailed, finishOnce]);

  if (!entrance || !artUrl || videoFailed) {
    return null;
  }

  const statusBarHeight = StatusBar.currentHeight ?? 0;
  const fullBleedHeight = screenSize.height + statusBarHeight;

  return (
    <View
      collapsable={false}
      style={[
        styles.rideFullscreen,
        {
          backgroundColor: theme.surfaces.dark,
          top: -statusBarHeight,
          width: screenSize.width,
          height: fullBleedHeight
        }
      ]}
    >
      <Video
        source={{ uri: artUrl }}
        style={{ width: screenSize.width, height: fullBleedHeight }}
        resizeMode="cover"
        repeat={false}
        volume={1.0}
        ignoreSilentSwitch="ignore"
        useTextureView
        onEnd={finishOnce}
        onError={event => {
          console.log('[Ride] video FAILED to load/play', artUrl, JSON.stringify(event));
          setVideoFailed(true);
        }}
      />
    </View>
  );
}

function ChatMessage({ message, theme }) {
  if (message.type === 'system') {
    return (
      <View style={styles.chatBubble}>
        <Text style={[styles.chatSystemLabel, { color: theme.colors.teal700 }]}>System </Text>
        <Text style={[styles.chatBody, { color: theme.text.primary }]}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === 'gift') {
    return (
      <View style={[styles.giftBubble, { borderColor: theme.colors.teal400 }]}>
        <GiftIcon size={20} color={theme.colors.teal700} />
        <Text style={[styles.chatBody, { color: theme.text.primary }]}>
          <Text style={[styles.chatAuthor, { color: theme.colors.teal700 }]}>{message.author}</Text> {message.text}
        </Text>
      </View>
    );
  }

  const badgeTone = message.badge?.tone === 'secondary' ? theme.text.primary : theme.colors.teal700;
  const bubble = (
    <View style={styles.chatBubbleContent}>
      {message.badge ? (
        <View style={[styles.chatMessageBadge, { backgroundColor: theme.colors.teal700 }]}>
          {message.badge.icon === 'diamond' ? (
            <DiamondIcon color={theme.cta.primary.text} />
          ) : (
            <ShieldIcon color={theme.cta.primary.text} />
          )}
          <Text style={[styles.chatMessageBadgeText, { color: theme.cta.primary.text }]}>{message.badge.label}</Text>
        </View>
      ) : null}
      <Text style={[styles.chatAuthor, { color: badgeTone }]}>{message.author}: </Text>
      <Text style={[styles.chatBody, { color: theme.text.primary }]}>{message.text}</Text>
    </View>
  );

  if (message.chatBoxUrl) {
    return (
      <ImageBackground
        source={{ uri: fixLocalhostOrigin(message.chatBoxUrl) }}
        imageStyle={styles.chatBoxArtwork}
        resizeMode="stretch"
        style={styles.chatBubble}
      >
        {bubble}
      </ImageBackground>
    );
  }

  return <View style={styles.chatBubble}>{bubble}</View>;
}

export function RoomScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const session = useAppStore(state => state.session);
  const ownerName = session?.user?.fullName || 'You';
  const ownerAvatarSeed = session?.user?.publicId || ownerName;
    const ownerDisplayId = session?.user?.displayId || session?.user?.publicId;
  
  const [roomId, setRoomId] = React.useState(route.params?.roomId ?? null);
  const pendingCoverUploadedRef = React.useRef(false);
  const myFrameUri = useAssignedFrame();
  const [customBackgroundFailed, setCustomBackgroundFailed] = React.useState(false);
  const roomName = route.params?.roomName ?? `${ownerName}'s Room`;
  const mode = route.params?.mode ?? 'video';
  const seatGroups = route.params?.seatGroups;
  // Rehydrate seat occupancy/notes if we're returning to a room that was
  // only backgrounded (not ended) — see src/utils/roomSeatCache.js.
  const cachedSeatStateRef = React.useRef(getCachedSeatState(roomId));
  const [seatRows, setSeatRows] = React.useState(() => {
    if (cachedSeatStateRef.current) {
      return cachedSeatStateRef.current.seatRows;
    }
    return mode === 'audio' && seatGroups?.length ? buildSeatRowsFromGroups(seatGroups) : null;
  });
  const [mySeatId, setMySeatId] = React.useState(() => cachedSeatStateRef.current?.mySeatId ?? null);
  const [seatNotes, setSeatNotes] = React.useState(() => cachedSeatStateRef.current?.seatNotes ?? {});
  const [noteModal, setNoteModal] = React.useState({ visible: false, seatId: null, value: '' });
  // "More" bottom-bar menu — speaker toggle (everyone) and, for the owner,
  // reconfiguring how many seats the room has without ending it.
  const [moreMenuVisible, setMoreMenuVisible] = React.useState(false);
  const [seatLayoutModalVisible, setSeatLayoutModalVisible] = React.useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = React.useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = React.useState(false);
  const [giftPickerVisible, setGiftPickerVisible] = React.useState(false);
  const [sendingGift, setSendingGift] = React.useState(false);
  const isViewerEntry = Boolean(route.params?.asViewer);
  const [isOwner, setIsOwner] = React.useState(!isViewerEntry);
  const [roomOwner, setRoomOwner] = React.useState(
    !isViewerEntry
      ? { id: ownerAvatarSeed, name: ownerName, profileImage: session?.user?.profileImage, displayId: ownerDisplayId }
      : null
  );
  const [ownerRoomBackgroundUrl, setOwnerRoomBackgroundUrl] = React.useState(undefined);
  const { source: assignedRoomBackgroundSource } = useAssignedRoomBackground({
    userId: roomOwner?.id,
    roomBackgroundUrl: ownerRoomBackgroundUrl
  });
  const ownerFrameUri = useAssignedFrame({ userId: roomOwner?.id, frameUrl: roomOwner?.frameUrl });
  React.useEffect(() => {
    setCustomBackgroundFailed(false);
  }, [assignedRoomBackgroundSource]);
  const hasMicAccess = mode !== 'audio' || isOwner || mySeatId !== null;
  // BUGFIX: this used to always start false ("unmuted"-looking), so the mic
  // button showed as live the instant it appeared (room start or taking a
  // seat) while the seat/owner badge correctly showed muted (see
  // occupancyFromServerSeat/ownerMicMuted) — every real LiveKit publish
  // starts muted regardless of role (see useLiveKitAudio.connect), so the button
  // now starts in the same state for audio rooms instead of contradicting
  // it. Video mode is unaffected — it has no LiveKit publish concept, so
  // its mic button keeps its original default.
  const [isMicMuted, setIsMicMuted] = React.useState(mode === 'audio');
  const isMicMutedRef = React.useRef(isMicMuted);
  React.useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);
  const isBackgroundedRef = React.useRef(false);
  const isOwnerRef = React.useRef(isOwner);
  React.useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);
  const roomOwnerRef = React.useRef(roomOwner);
  React.useEffect(() => {
    roomOwnerRef.current = roomOwner;
  }, [roomOwner]);
  const ownPublicIdRef = React.useRef(session?.user?.publicId);
  React.useEffect(() => {
    ownPublicIdRef.current = session?.user?.publicId;
  }, [session?.user?.publicId]);
  // The owner's own chosen seat layout, once the backend returns it (see
  // docs/room-seat-layout-spec.md) — lets a viewer's default grid match
  // the owner's actual shape instead of a generic fallback. Set from the
  // join ack below; undefined/absent today until that backend field ships.
  const ownerSeatGroupsRef = React.useRef(null);
  const seatRowsRef = React.useRef(seatRows);
  React.useEffect(() => {
    seatRowsRef.current = seatRows;
  }, [seatRows]);
  const seatNotesRef = React.useRef(seatNotes);
  React.useEffect(() => {
    seatNotesRef.current = seatNotes;
  }, [seatNotes]);

  const handleToggleMic = () => {
    setIsMicMuted(current => {
      const next = !current;
      console.log('[LiveKit] mic toggle', { willBeMuted: next, mySeatId, isOwner });
      liveKitAudio.setMicEnabled(!next);
      // Seat/owner-badge mute visuals are no longer set optimistically here
      // — they're driven entirely by the real LiveKit TrackMuted/Unmuted/
      // Published events (see the connect effect above), which is the only
      // way every OTHER participant also ever finds out about this change.
      // isMicMuted here only controls this device's own mic button look.
      if (isAudioRoom && roomId && isBackgroundedRef.current) {
        showLiveRoomNotification({ roomId, roomName, mode, seatGroups, micMuted: next }).catch(() => {});
      }
      return next;
    });
  };
  // Applies a take/move/leave/lock ack's fresh seatState — overlays the
  // server's 12-seat occupancy onto the CURRENT visual grid by position
  // (see applyServerSeatRowsToVisual/SERVER_SEAT_IDS), preserving whatever
  // larger decorative layout the owner picked, then recomputes mySeatId
  // from the result.
  const applyServerSeatState = seatState => {
    if (!seatState?.seatRows) {
      return;
    }
    const mapped = applyServerSeatRowsToVisual(seatRowsRef.current, seatState.seatRows, ownerSeatGroupsRef.current);
    setSeatRows(mapped);
    setMySeatId(findMySeatId(mapped, ownPublicIdRef.current));
    const nextNotes = {};
    for (const seat of mapped.flat()) {
      if (seat.note) {
        nextNotes[seat.id] = seat.note;
      }
    }
    setSeatNotes(nextNotes);
  };
  const handleTakeSeat = seatId => {
    if (seatId === mySeatId || !roomId) {
      return;
    }
    const serverSeatId = serverSeatIdForVisualSeat(seatRowsRef.current, seatId);
    if (!serverSeatId) {
      showAlert('Seat Unavailable', 'This seat is not open yet.');
      return;
    }
    const onResult = result => {
      if (!result || result.success === false) {
        showAlert(
          'Unable to Take Seat',
          result?.error?.code === 'ROOM_UNAVAILABLE' ? 'This room is no longer available.' : 'Please try again.'
        );
        return;
      }
      applyServerSeatState(result.data?.seatState);
      // Moving between seats doesn't change publish rights (see
      // socket.js's moveSeat), so only seat-take's ack carries a fresh
      // LiveKit token to reconnect with — see docs/mobile-audio-room-api.md.
      if (result.data?.liveKit?.token) {
        liveKitAudio.reconnect(result.data.liveKit.url, result.data.liveKit.token, { publish: true });
      }
    };
    if (mySeatId) {
      const fromServerSeatId = serverSeatIdForVisualSeat(seatRowsRef.current, mySeatId);
      moveSeat(roomId, fromServerSeatId, serverSeatId, onResult);
    } else {
      takeSeat(roomId, serverSeatId, onResult);
    }
  };
  const handleLeaveSeat = seatId => {
    if (!roomId) {
      return;
    }
    const serverSeatId = serverSeatIdForVisualSeat(seatRowsRef.current, seatId);
    leaveSeat(roomId, serverSeatId, result => {
      if (!result || result.success === false) {
        showAlert('Unable to Leave Seat', 'Please try again.');
        return;
      }
      applyServerSeatState(result.data?.seatState);
      if (result.data?.liveKit?.token) {
        liveKitAudio.reconnect(result.data.liveKit.url, result.data.liveKit.token, { publish: false });
      }
    });
  };

  const handleLeaveSeatPress = seatId => {
    showAlert('Leave Seat', 'Are you sure you want to stand up from this seat?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave Seat', style: 'destructive', onPress: () => handleLeaveSeat(seatId) }
    ]);
  };
  const handleToggleSeatLock = seatId => {
    if (!roomId) {
      return;
    }
    const serverSeatId = serverSeatIdForVisualSeat(seatRowsRef.current, seatId);
    if (!serverSeatId) {
      // Decorative seat — nothing persisted server-side for it, so the
      // lock is purely a local cosmetic toggle (same as its note above).
      setSeatRows(rows => rows.map(row => row.map(seat => (seat.id === seatId ? { ...seat, locked: !seat.locked } : seat))));
      return;
    }
    const seat = seatRowsRef.current?.flat().find(row => row.id === seatId);
    lockSeat(roomId, serverSeatId, !seat?.locked, seatNotes[seatId] ?? seat?.note ?? null, result => {
      if (!result || result.success === false) {
        showAlert('Unable to Update Seat', 'Please try again.');
        return;
      }
      applyServerSeatState(result.data?.seatState);
    });
  };
  const handleEmptySeatPress = seatId => {
    if (isOwner) {
      const seat = seatRowsRef.current?.flat().find(row => row.id === seatId);
      showAlert('Manage Seat', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: seat?.locked ? 'Unlock Seat' : 'Lock Seat',
          onPress: () => handleToggleSeatLock(seatId)
        },
        { text: 'Set Note', onPress: () => setNoteModal({ visible: true, seatId, value: seatNotes[seatId] ?? '' }) }
      ]);
      return;
    }
    handleTakeSeat(seatId);
  };
  const handleSeatAvatarPress = seat => {
    navigation.navigate(routes.userProfile, {
      userId: seat.avatarSeed,
      userName: seat.name,
      userAvatar: seat.avatarUri,
      userFrameUrl: seat.frameUrl ?? null,
      userBadgeUrl: seat.badgeUrl ?? null,
      userGender: seat.gender ?? null,
      userDob: seat.dob ?? null,
      userIsOfficial: seat.isOfficial ?? false
    });
  };

  const closeNoteModal = () => setNoteModal({ visible: false, seatId: null, value: '' });
  const handleChangeSeatLayout = groups => {
    const newTotal = groups.reduce((sum, count) => sum + count, 0);
    // Shrinking the layout can push a currently-occupied REAL seat (see
    // SERVER_SEAT_IDS — only the first 11 positions are ever backed by
    // the server) outside the new, smaller grid entirely. Those occupants
    // need to actually be vacated server-side (audio-room:seat-kick), not
    // just visually dropped — otherwise the backend still shows them
    // seated even though their tile no longer exists locally. Growing the
    // layout never displaces anyone, so this is a no-op in that direction.
    if (roomId) {
      let cursor = 0;
      for (const row of seatRowsRef.current ?? []) {
        for (const seat of row) {
          if (seat.occupied && cursor >= newTotal && cursor < SERVER_SEAT_IDS.length) {
            kickFromSeat(roomId, SERVER_SEAT_IDS[cursor], () => {});
          }
          cursor += 1;
        }
      }
    }
    setSeatRows(buildSeatRowsFromGroups(groups));
    setSeatNotes({});
    setSeatLayoutModalVisible(false);
    // Keeps the persisted seatLayout (see startAudioRoom's seatLayout
    // param) in sync so a viewer who joins/re-syncs after this change
    // still sees the owner's current shape, not the one picked at room
    // start.
    if (roomId && session?.token) {
      updateAudioRoom(session.token, { title: roomName, participantCount: viewerCountRef.current, seatLayout: groups }).catch(() => {});
    }
  };

  // Lets the owner change the Party/Discover card cover after the room
  // already exists — unlike the one-time RoomCoverModal picking step (see
  // DiscoverScreen), roomId is always assigned by the time this menu item
  // is reachable, so this uploads immediately instead of deferring it.
  const handleEditCover = async () => {
    setMoreMenuVisible(false);
    if (!roomId || !session?.token) {
      return;
    }
    const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    if (response.didCancel) {
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      showAlert('Photo not selected', 'Please choose a photo from your device.');
      return;
    }
    try {
      await uploadAudioRoomCover(session.token, { imageUri: asset.uri, imageType: asset.type, imageFileName: asset.fileName });
    } catch (error) {
      showAlert('Could Not Update Cover', error?.message ?? 'Something went wrong uploading the cover photo. Please try again.');
    }
  };

  const handleSaveNote = () => {
    const text = noteModal.value.trim();
    const seatId = noteModal.seatId;
    closeNoteModal();
    if (!roomId || !seatId) {
      return;
    }
    const serverSeatId = serverSeatIdForVisualSeat(seatRowsRef.current, seatId);
    if (!serverSeatId) {
      // Decorative seat — nothing persisted server-side for it, so the
      // note is purely a local cosmetic label.
      setSeatNotes(current => {
        const next = { ...current };
        if (text) {
          next[seatId] = text;
        } else {
          delete next[seatId];
        }
        return next;
      });
      return;
    }
    const seat = seatRowsRef.current?.flat().find(row => row.id === seatId);
    lockSeat(roomId, serverSeatId, Boolean(seat?.locked), text || null, result => {
      if (!result || result.success === false) {
        showAlert('Unable to Save Note', 'Please try again.');
        return;
      }
      applyServerSeatState(result.data?.seatState);
    });
  };

  const seatSizing = React.useMemo(() => {
    if (!seatRows) {
      return null;
    }
    const maxRowSeats = Math.max(...seatRows.map(row => row.length));
    const gap = scaleModerate(10);
    const horizontalPadding = scaleModerate(20) * 2;
    const fitWidth = (windowWidth - horizontalPadding - gap * (maxRowSeats - 1)) / maxRowSeats;
    const columnWidth = Math.max(scaleModerate(44), Math.min(scaleModerate(68), fitWidth));
    return { columnWidth, circleSize: Math.round(columnWidth * 0.82) };
  }, [seatRows, windowWidth]);
  const ownerCircleSize = Math.round((seatSizing?.circleSize ?? scaleModerate(56)) * 0.9 * 0.9 * 1.05);
  const ownerFrameSize = ownerCircleSize + 12;
  const ownerMicBadgeSize = Math.max(scaleModerate(16), Math.round(ownerCircleSize * 0.36));
  const occupiedSeatCount = seatRows ? seatRows.flat().filter(seat => seat.occupied).length : 0;
  // liveParticipantCount is the server's real socket-room size (from the
  // audio-room:join ack, see below), bumped further as other joins are
  // observed live via audio-room:entrance — this already counts everyone
  // in the room, spectators AND seated speakers alike, since taking a seat
  // doesn't create a new room member, just changes an existing one's role.
  // occupiedSeatCount + 1 is only ever the fallback shown before that real
  // number is known — it must NOT be combined with it afterward (that used
  // to be Math.max(liveParticipantCount, occupiedSeatCount + 1), which
  // meant every listener who took a seat visibly inflated the Live count
  // by re-adding someone already counted the moment they joined).
  const [liveParticipantCount, setLiveParticipantCount] = React.useState(null);
  const viewerCount = liveParticipantCount != null ? liveParticipantCount : occupiedSeatCount + 1;
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const hasWelcomedRef = React.useRef(false);
  const chatListRef = React.useRef(null);

  const [currentEntrance, setCurrentEntrance] = React.useState(null);
  const entranceQueueRef = React.useRef([]);
  const isShowingEntranceRef = React.useRef(false);
  const showNextEntranceRef = React.useRef(null);
  showNextEntranceRef.current = () => {
    const next = entranceQueueRef.current.shift();
    if (!next) {
      isShowingEntranceRef.current = false;
      setCurrentEntrance(null);
      return;
    }
    isShowingEntranceRef.current = true;
    setCurrentEntrance(next);
    console.log('[Entrance] now showing', next.kind, next.kind === 'ride' ? next.rideUrl : next.entranceUrl);
  };
  const pushEntranceRef = React.useRef(null);
  pushEntranceRef.current = data => {
    console.log('[Entrance] pushed to queue', data);
    entranceQueueRef.current.push(data);
    if (!isShowingEntranceRef.current) {
      showNextEntranceRef.current?.();
    }
  };
  const isAudioRoom = mode === 'audio' && (Boolean(seatRows) || isViewerEntry);
  const liveKitAudio = useLiveKitAudio();
  // BUGFIX: this used to also require hasMicAccess before connecting at
  // all, so plain listeners (the majority of any room) never joined the
  // LiveKit session and could never hear anyone — connecting is required
  // just to SUBSCRIBE to remote audio, independent of publish rights (see
  // docs/mobile-audio-room-api.md's token grant: listeners get
  // subscribe-only tokens, not "don't connect"). hasMicAccess still decides
  // the initial publish intent, but is intentionally NOT a dependency here
  // — reconnecting the whole session (and dropping everyone's audio for a
  // beat) every time a seat/owner flag flips would be its own bug; actual
  // publish rights are controlled afterwards by handleToggleMic and
  // enforced server-side by the token grant regardless of this flag.
  // Real mute state for the owner (shown in the identity panel's
  // identityMicBadge, not a numbered seat). Starts assuming muted, matching
  // "starts muted regardless" — corrected the moment real LiveKit events
  // arrive. (No speaking-ring here anymore — removed per request.)
  const [ownerMicMuted, setOwnerMicMuted] = React.useState(true);
  React.useEffect(() => {
    if (!isAudioRoom || !roomId || !session?.token) {
      return undefined;
    }
    let cancelled = false;
    // Seated occupants' mute/speaking is now server-authoritative (see
    // handleSeatUpdate/mapServerSeat) — this only detects THIS device's own
    // real state via LiveKit and pushes it up via audio-room:seat-status,
    // which the server then broadcasts to everyone (including back to us).
    // The server rejects this harmlessly (SPEAKER_NOT_SEATED) when not
    // actually seated, so no local seated-check is needed before pushing.
    const pushOwnSeatStatus = speaking => {
      updateSeatStatus(roomId, { muted: isMicMutedRef.current, speaking }, () => {});
    };
    const handleActiveSpeakersChanged = speakers => {
      const amSpeaking = speakers.some(participant => participant.identity === ownPublicIdRef.current);
      pushOwnSeatStatus(amSpeaking);
    };
    // The room owner never occupies a persisted seat (see
    // docs/mobile-audio-room-api.md), so their mic badge (identityMicBadge)
    // has no server-broadcast equivalent to seat-status — this remains the
    // only way every other participant learns the owner's real mute state,
    // straight from the RTC layer.
    const applyOwnerMuteChange = (identity, muted) => {
      if (identity && identity === roomOwnerRef.current?.id) {
        setOwnerMicMuted(muted);
      }
    };
    // setMicrophoneEnabled(true) on a participant with no track yet CREATES
    // and publishes a brand-new track rather than "unmuting" one — that
    // fires TrackPublished/LocalTrackPublished, not TrackUnmuted, so both
    // are handled here (registering both is harmless — applyOwnerMuteChange
    // is already a no-op when the value hasn't changed).
    const handleTrackPublished = (publication, participant) => {
      if (publication?.kind === Track.Kind.Audio) {
        applyOwnerMuteChange(participant?.identity, Boolean(publication.isMuted));
        if (participant?.identity === ownPublicIdRef.current) {
          pushOwnSeatStatus(false);
        }
      }
    };
    const handleTrackMuted = (publication, participant) => {
      if (publication?.kind === Track.Kind.Audio) {
        applyOwnerMuteChange(participant?.identity, true);
        if (participant?.identity === ownPublicIdRef.current) {
          pushOwnSeatStatus(false);
        }
      }
    };
    const handleTrackUnmuted = (publication, participant) => {
      if (publication?.kind === Track.Kind.Audio) {
        applyOwnerMuteChange(participant?.identity, false);
        if (participant?.identity === ownPublicIdRef.current) {
          pushOwnSeatStatus(false);
        }
      }
    };
    // Registered via liveKitAudio.on (not room.on directly) — that survives
    // seat-take/move/leave's reconnect() swapping in a new Room instance,
    // which room.on would not (the old listeners would silently stop
    // firing on the dead, disconnected room).
    liveKitAudio.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
    liveKitAudio.on(RoomEvent.TrackPublished, handleTrackPublished);
    liveKitAudio.on(RoomEvent.LocalTrackPublished, handleTrackPublished);
    liveKitAudio.on(RoomEvent.TrackMuted, handleTrackMuted);
    liveKitAudio.on(RoomEvent.TrackUnmuted, handleTrackUnmuted);
    console.log('[LiveKit] connecting', { roomId, hasMicAccess });
    liveKitAudio.connect(session.token, roomId, { publish: hasMicAccess }).then(room => {
      if (cancelled) {
        liveKitAudio.disconnect();
        return;
      }
      if (!room) {
        console.log('[LiveKit] connect returned no room (see useLiveKitAudio warning above)');
        return;
      }
      console.log('[LiveKit] connected', { identity: room.localParticipant?.identity });
    });
    return () => {
      cancelled = true;
      liveKitAudio.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
      liveKitAudio.off(RoomEvent.TrackPublished, handleTrackPublished);
      liveKitAudio.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
      liveKitAudio.off(RoomEvent.TrackMuted, handleTrackMuted);
      liveKitAudio.off(RoomEvent.TrackUnmuted, handleTrackUnmuted);
      liveKitAudio.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasMicAccess deliberately excluded, see comment above
  }, [isAudioRoom, roomId, session?.token, liveKitAudio]);
  const [joiningDisabled, setJoiningDisabled] = React.useState(false);
  const [isRoomBlocked, setIsRoomBlocked] = React.useState(false);
  const [hostEndedRoom, setHostEndedRoom] = React.useState(false);
  const [roomBlockedReason, setRoomBlockedReason] = React.useState(null);
  const startedAtRef = React.useRef(null);
  const roomEndedRef = React.useRef(false);
  const viewerCountRef = React.useRef(viewerCount);
  const isFirstParticipantSyncRef = React.useRef(true);
  const handleToggleMicRef = React.useRef(null);
  const endAudioRoomRef = React.useRef(null);
  // Allows tapping an empty seat even while already seated — see
  // handleTakeSeat/applySeatAssignment, which move the person rather than
  // requiring them to explicitly leave their old seat first.
  const canTakeSeat = !isOwner && !joiningDisabled;

  React.useEffect(() => {
    viewerCountRef.current = viewerCount;
  }, [viewerCount]);

  React.useEffect(() => {
    if (!isAudioRoom || !roomId) {
      return;
    }
    setCachedSeatState(roomId, { seatRows, mySeatId, seatNotes });
  }, [isAudioRoom, roomId, seatRows, mySeatId, seatNotes]);
  const endAudioRoom = React.useCallback(() => {
    if (!isAudioRoom || !isOwner || roomEndedRef.current || !session?.token || !roomId) {
      return;
    }
    roomEndedRef.current = true;
    leaveAudioRoom(roomId);
    clearCachedSeatState(roomId);
    endAudioRoomRecord(session.token).catch(() => {});
  }, [isAudioRoom, isOwner, roomId, session?.token]);
  const handleClosePress = () => {
    if (!isAudioRoom) {
      navigation.goBack();
      return;
    }
    if (!isOwner) {
      if (roomId) {
        leaveAudioRoom(roomId);
        // BUGFIX: this only ever backgrounds cleanly, not a full close —
        // getCachedSeatState is meant to survive backgrounding a room you
        // actually still occupy, not a room you've fully left. Without
        // this, a later fresh visit to the same roomId (as a plain
        // listener this time) silently restored the OLD mySeatId here,
        // making the mic button appear despite never taking a seat this
        // visit.
        clearCachedSeatState(roomId);
      }
      navigation.goBack();
      return;
    }
    // The owner's Keep/End Room choice is handled uniformly by the
    // beforeRemove listener below — covers this X button, the hardware
    // back button, and the iOS swipe-back gesture with one prompt instead
    // of three separate implementations.
    navigation.goBack();
  };

  // "Keep" (room stays live, running in the background — the existing
  // backgroundNow()/"still live" notification flow already does exactly
  // this on unmount, no extra call needed) vs "End Room" (endAudioRoom),
  // asked once, uniformly, for the owner leaving the screen by ANY route —
  // the X button above, Android's hardware back button, or iOS's
  // swipe-back gesture. preventDefault() blocks the navigation until the
  // owner picks one; the exact original action is then replayed via
  // navigation.dispatch so back/swipe/X all behave identically.
  React.useEffect(() => {
    if (!isAudioRoom || !isOwner) {
      return undefined;
    }
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (roomEndedRef.current) {
        // Already ending/ended via some other path (admin action, End Room
        // confirmed once already, etc.) — let it proceed normally.
        return;
      }
      event.preventDefault();
      showAlert('Leave Room', 'Keep this room running in the background, or end it for everyone?', [
        {
          text: 'Keep Running',
          onPress: () => navigation.dispatch(event.data.action)
        },
        {
          text: 'End Room',
          style: 'destructive',
          onPress: () => {
            endAudioRoom();
            navigation.dispatch(event.data.action);
          }
        }
      ]);
    });
    return unsubscribe;
  }, [navigation, isAudioRoom, isOwner, endAudioRoom]);

  React.useEffect(() => {
    if (!isAudioRoom || !session?.token) {
      return undefined;
    }

    dismissLiveRoomNotification().catch(() => {});

    let cancelled = false;
    let retryTimer = null;
    let activeRoomId = roomId;
    const backgroundNow = () => {
      if (roomEndedRef.current || !activeRoomId) {
        return;
      }
      leaveAudioRoom(activeRoomId);
      if (isOwnerRef.current) {
        isBackgroundedRef.current = true;
        showLiveRoomNotification({
          roomId: activeRoomId,
          roomName,
          mode,
          seatGroups,
          micMuted: isMicMutedRef.current
        }).catch(() => {});
      } else {
        // Only the owner gets a "still live" notification to resume from
        // (see above) — a viewer has no equivalent resume path, so there's
        // no reason to keep their cached seat around through hardware
        // back/swipe-back (which never goes through handleClosePress's own
        // clearCachedSeatState call). Otherwise a later fresh visit to the
        // same roomId — as a plain listener this time — would silently
        // restore this stale seat.
        clearCachedSeatState(activeRoomId);
      }
    };
    const handleRoomEndedExternally = payload => {
      const data = payload?.data;
      if (roomEndedRef.current) {
        return;
      }
      roomEndedRef.current = true;
      if (activeRoomId) {
        leaveAudioRoom(activeRoomId);
        clearCachedSeatState(activeRoomId);
      }
      dismissLiveRoomNotification().catch(() => {});
      setRoomBlockedReason(data?.reason || null);
      setIsRoomBlocked(true);
    };
    const handleOwnerLeftRoom = () => {
      if (isOwnerRef.current || roomEndedRef.current) {
        return;
      }
      roomEndedRef.current = true;
      if (activeRoomId) {
        leaveAudioRoom(activeRoomId);
        clearCachedSeatState(activeRoomId);
      }
      dismissLiveRoomNotification().catch(() => {});
      setHostEndedRoom(true);
    };
    // Fires only on the device of whoever the owner just kicked from their
    // seat (see socket.js's kickFromSeat / handleChangeSeatLayout) — they
    // stay in the room, just drop back to listener. The regular
    // audio-room:seat-update broadcast the kick also triggers will correct
    // seatRows for everyone shortly after; this just reconnects THIS
    // device's own LiveKit session immediately (only it can call
    // setMicrophoneEnabled locally) and gives an explanatory heads-up.
    const handleSeatKicked = payload => {
      const data = payload?.data;
      if (data?.roomId !== activeRoomId) {
        return;
      }
      setMySeatId(null);
      if (data?.liveKit?.token) {
        liveKitAudio.reconnect(data.liveKit.url, data.liveKit.token, { publish: false });
      }
      showAlert('Moved to Spectate', 'The host resized the seats and moved you to spectating. You can take another seat anytime.');
    };
    const attemptJoin = retriesLeft => {
      if (cancelled || !activeRoomId) {
        return;
      }
      const socket = getSessionSocket();
      if (!socket || !socket.connected) {
        if (retriesLeft > 0) {
          retryTimer = setTimeout(() => attemptJoin(retriesLeft - 1), 800);
        }
        return;
      }
      joinAudioRoom(activeRoomId, result => {
        if (cancelled || !result) {
          return;
        }
        if (result.success === false) {
          if (result.error?.code === 'ROOM_OWNER_ONLY') {
            setJoiningDisabled(true);
            return;
          }
          handleRoomEndedExternally();
          return;
        }
        if (typeof result.data?.participantCount === 'number') {
          setLiveParticipantCount(result.data.participantCount);
        }
        if (typeof result.data?.isOwner === 'boolean') {
          setIsOwner(result.data.isOwner);
        }
        if (result.data?.owner?.publicId) {
          const owner = result.data.owner;
          // BUGFIX: this used to always be owner.publicId — the server's
          // join ack never sends the owner's Special ID (see
          // docs/room-owner-special-id-spec.md), only their raw publicId.
          // For OUR OWN room, session.user.displayId already resolves the
          // real Special ID (same source ProfileScreen uses) — use that
          // instead of the wrong hardcoded publicId, which was silently
          // overriding it even for the owner's own "Your ID" display (see
          // the identity panel render below). For someone else's room,
          // there's genuinely no Special ID data yet — leave this null so
          // "Host ID" simply doesn't render, rather than showing their raw
          // ID mislabeled as if it were the real one. Read result.data —
          // not the isOwner state — since setIsOwner above hasn't
          // committed yet within this same callback.
          setRoomOwner({
            id: owner.publicId,
            name: owner.name,
            profileImage: owner.profileImage,
            displayId: result.data?.isOwner ? session?.user?.displayId || owner.publicId : null,
            frameUrl: owner.frameUrl,
            badgeUrl: owner.badgeUrl,
            isOfficial: owner.isOfficial,
            isVerified: owner.isVerified
          });
        }
        if (result.data?.roomBackgroundUrl !== undefined) {
          setOwnerRoomBackgroundUrl(result.data.roomBackgroundUrl);
        }
        // Must be set BEFORE applyServerSeatState — it reads
        // ownerSeatGroupsRef.current synchronously to build a viewer's
        // default grid (see defaultRealSeatGrid).
        if (Array.isArray(result.data?.seatLayout) && result.data.seatLayout.length) {
          ownerSeatGroupsRef.current = result.data.seatLayout;
        }
        if (result.data?.seatState) {
          applyServerSeatState(result.data.seatState);
        }
      });
    };

    const setup = async () => {
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;
      if (isViewerEntry) {
        if (!cancelled) {
          attemptJoin(5);
        }
        return;
      }

      try {
        const result = await startAudioRoom(session.token, {
          title: roomName,
          participantCount: viewerCountRef.current,
          country: session?.user?.country ?? undefined,
          seatLayout: Array.isArray(seatGroups) && seatGroups.length ? seatGroups : undefined
        });
        if (result?.roomId) {
          activeRoomId = result.roomId;
          if (!cancelled) {
            setRoomId(result.roomId);
            // The cover upload needs a real assigned roomId (see
            // docs/mobile-audio-room-api.md's "Room cover image"), which
            // doesn't exist yet at RoomCoverModal's picking step — so the
            // picked file only travels this far, then uploads once here.
            const pendingCover = route.params?.pendingCoverImage;
            if (pendingCover?.uri && !pendingCoverUploadedRef.current) {
              pendingCoverUploadedRef.current = true;
              uploadAudioRoomCover(session.token, {
                imageUri: pendingCover.uri,
                imageType: pendingCover.type,
                imageFileName: pendingCover.fileName
              }).catch(() => {});
            }
          } else {
            backgroundNow();
            return;
          }
        }
      } catch (startError) {
        if (
          startError instanceof AudioRoomError &&
          (startError.code === 'ROOM_BLOCKED' || startError.code === 'ROOM_TERMINATED')
        ) {
          if (!cancelled) {
            roomEndedRef.current = true;
            showAlert(
              startError.code === 'ROOM_BLOCKED' ? 'Room Blocked' : 'Room Terminated',
              startError.details?.reason
                ? `${startError.message}\nReason: ${startError.details.reason}`
                : startError.message,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
          return;
        }
        if (
          startError instanceof AudioRoomError &&
          (startError.code === 'HOST_AGENCY_REQUIRED' || startError.code === 'AGENCY_INACTIVE')
        ) {
          if (!cancelled) {
            roomEndedRef.current = true;
            showAlert(
              'Agency Required',
              startError.code === 'HOST_AGENCY_REQUIRED'
                ? 'You need to be a host linked to an active agency to start a room. Apply for an agency to unlock streaming.'
                : "This host's agency is not currently active — streaming is unavailable until it's reactivated.",
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
          return;
        }
        if (!activeRoomId) {
          if (!cancelled) {
            roomEndedRef.current = true;
            showAlert('Unable to Start Room', 'Something went wrong starting this room. Please try again.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
          return;
        }
      }

      if (!cancelled) {
        attemptJoin(5);
      }
    };
    const socket = getSessionSocket();
    const handleJoiningDisabled = payload => {
      setJoiningDisabled(true);
      if (!isOwnerRef.current) {
        const reason = payload?.data?.reason;
        showAlert(
          'Seating Paused',
          reason ? `The host has temporarily paused new seats.\nReason: ${reason}` : 'The host has temporarily paused new seats from being taken.'
        );
      }
    };
    const handleJoiningEnabled = () => setJoiningDisabled(false);
    const handleBlocked = handleRoomEndedExternally;
    const handleTerminated = handleRoomEndedExternally;
    const handleDeleted = handleRoomEndedExternally;
    // The server is now the sole writer of seat state (see
    // mapServerSeatRows/applyServerSeatState) — this applies for EVERYONE,
    // owner included, unlike the old owner-authored relay this replaced.
    // Broadcast automatically after every seat-take/move/leave/status/lock,
    // so there's no separate "sync request"/approval-flow listener needed
    // anymore — a fresh join's own ack already carries the current
    // seatState directly (see attemptJoin above).
    const handleSeatUpdate = payload => {
      const data = payload?.data;
      if (data?.roomId !== activeRoomId) {
        return;
      }
      applyServerSeatState(data);
    };

    const pushRideIfAny = data => {
      if (!data.rideUrl) {
        console.log('[Ride] no rideUrl on this entrance payload — nothing equipped/resolved for', data?.userId);
        return;
      }
      console.log('[Ride] pushing ride to queue', data.rideUrl);
      pushEntranceRef.current?.({ ...data, kind: 'ride', rideUrl: fixLocalhostOrigin(data.rideUrl) });
    };

    const handleEntrance = payload => {
      const data = payload?.data;
      console.log('[Entrance] received', JSON.stringify(payload), 'activeRoomId', activeRoomId);
      if (data?.roomId !== activeRoomId) {
        console.log('[Entrance] dropped — roomId mismatch', data?.roomId, 'vs', activeRoomId);
        return;
      }
      // Someone else joining, observed live — see liveParticipantCount above.
      // Excludes this device's own entrance (already accounted for by the
      // join ack that seeded liveParticipantCount) so it isn't double-counted.
      if (data.userId && data.userId !== session?.user?.publicId) {
        setLiveParticipantCount(current => (current == null ? current : current + 1));
      }
      if (!data.entranceUrl) {
        pushEntranceRef.current?.({ ...data, kind: 'entrance' });
        pushRideIfAny(data);
        return;
      }
      const fixedUrl = fixLocalhostOrigin(data.entranceUrl);
      // Same reasoning as pushRideIfAny above — never base64-cache a video.
      if (isVideoUrl(fixedUrl)) {
        pushEntranceRef.current?.({ ...data, kind: 'entrance', entranceUrl: fixedUrl });
        pushRideIfAny(data);
        return;
      }
      const identity = assetIdentity(fixedUrl);
      const cachedUri = getCachedAssetByIdentity('ENTRANCE_ART', identity);
      if (cachedUri) {
        pushEntranceRef.current?.({ ...data, kind: 'entrance', entranceUrl: cachedUri });
        pushRideIfAny(data);
        return;
      }
      pushEntranceRef.current?.({ ...data, kind: 'entrance', entranceUrl: fixedUrl });
      pushRideIfAny(data);
      fetchAssetDataUri({ url: fixedUrl }, session?.token).then(uri => {
        if (uri) {
          setCachedAssetByIdentity('ENTRANCE_ART', identity, uri);
        }
      });
    };

    const handleGiftBroadcast = payload => {
      const data = payload?.data;
      if (!data || data.roomId !== activeRoomId) {
        return;
      }
      const recipientName = data.recipientId === roomOwnerRef.current?.id ? roomOwnerRef.current?.name : data.recipientId;
      setMessages(current => [
        ...current,
        {
          id: data.transactionId ?? `gift-${Date.now()}`,
          type: 'gift',
          author: data.sender?.name ?? 'Someone',
          text: `sent ${data.gift?.name}${data.gift?.quantity > 1 ? ` x${data.gift.quantity}` : ''} to ${recipientName}`
        }
      ]);
    };

    const handleRoomMessage = payload => {
      const data = payload?.data;
      if (!data || data.roomId !== activeRoomId) {
        return;
      }
      setMessages(current => {
        if (current.some(message => message.id === data.id)) {
          return current;
        }
        const pendingIndex = current.findIndex(
          message => message.pending && message.author === (data.sender?.name ?? 'Someone') && message.text === data.body
        );
        const resolved = {
          id: data.id,
          type: 'message',
          author: data.sender?.name ?? 'Someone',
          chatBoxUrl: data.sender?.chatBoxUrl ?? null,
          text: data.body
        };
        if (pendingIndex !== -1) {
          const next = [...current];
          next[pendingIndex] = resolved;
          return next;
        }
        return [...current, resolved];
      });
    };

    socket?.on('audio-room:joining-disabled', handleJoiningDisabled);
    socket?.on('audio-room:joining-enabled', handleJoiningEnabled);
    socket?.on('audio-room:blocked', handleBlocked);
    socket?.on('audio-room:terminated', handleTerminated);
    socket?.on('audio-room:deleted', handleDeleted);
    socket?.on('audio-room:owner-left', handleOwnerLeftRoom);
    socket?.on('audio-room:seat-kicked', handleSeatKicked);
    socket?.on('audio-room:seat-update', handleSeatUpdate);
    socket?.on('audio-room:entrance', handleEntrance);
    socket?.on('gift:received', handleGiftBroadcast);
    socket?.on('audio-room:message', handleRoomMessage);
    console.log('[Entrance] listener registered, socket connected:', socket?.connected);

    setup();

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      socket?.off('audio-room:joining-disabled', handleJoiningDisabled);
      socket?.off('audio-room:joining-enabled', handleJoiningEnabled);
      socket?.off('audio-room:blocked', handleBlocked);
      socket?.off('audio-room:terminated', handleTerminated);
      socket?.off('audio-room:deleted', handleDeleted);
      socket?.off('audio-room:owner-left', handleOwnerLeftRoom);
      socket?.off('audio-room:seat-kicked', handleSeatKicked);
      socket?.off('audio-room:seat-update', handleSeatUpdate);
      socket?.off('audio-room:entrance', handleEntrance);
      socket?.off('gift:received', handleGiftBroadcast);
      socket?.off('audio-room:message', handleRoomMessage);
      backgroundNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioRoom]);

  React.useEffect(() => {
    if (!isAudioRoom || !isOwner || !session?.token || !roomId || roomEndedRef.current) {
      return undefined;
    }
    if (isFirstParticipantSyncRef.current) {
      isFirstParticipantSyncRef.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      updateAudioRoom(session.token, {
        title: roomName,
        participantCount: viewerCount
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [viewerCount, isAudioRoom, isOwner, roomId, roomName, session?.token]);
  React.useEffect(() => {
    if (!isAudioRoom || !roomId || !isOwner) {
      return undefined;
    }
    const subscription = AppState.addEventListener('change', nextState => {
      if (roomEndedRef.current) {
        return;
      }
      if (nextState === 'active') {
        isBackgroundedRef.current = false;
        dismissLiveRoomNotification().catch(() => {});
      } else {
        isBackgroundedRef.current = true;
        showLiveRoomNotification({ roomId, roomName, mode, seatGroups, micMuted: isMicMutedRef.current }).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [isAudioRoom, roomId, roomName, mode, seatGroups, isOwner]);

  handleToggleMicRef.current = handleToggleMic;
  endAudioRoomRef.current = endAudioRoom;


  React.useEffect(() => {
    if (!isAudioRoom || !roomId || !isOwner) {
      return undefined;
    }
    return registerLiveRoomActionHandler({
      onToggleMic: () => handleToggleMicRef.current(),
      onEndRoom: () => {
        endAudioRoomRef.current();
        navigation.goBack();
      }
    });
  }, [isAudioRoom, roomId, isOwner, navigation]);

  React.useEffect(() => {
    if (isRoomBlocked) {
      showAlert(
        'Room Unavailable',
        roomBlockedReason
          ? `This room was removed by an administrator.\nReason: ${roomBlockedReason}`
          : 'This room was blocked, ended, or removed by an administrator.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isRoomBlocked, roomBlockedReason, navigation]);

  React.useEffect(() => {
    if (hostEndedRoom) {
      showAlert('Room Ended', 'The host has ended this room.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [hostEndedRoom, navigation]);

  React.useEffect(() => {
    if (hasWelcomedRef.current) {
      return;
    }
    hasWelcomedRef.current = true;
    setMessages(current => [
      { id: 'welcome', type: 'system', text: `Welcome to ${roomName}! Please be respectful to others.` },
      ...current
    ]);
  }, [roomName]);

  const handleSend = () => {
    const text = draft.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
    if (!text || !roomId) {
      return;
    }
    setDraft('');
    // Show the message in the chat box immediately instead of waiting on
    // the server's broadcast — handleRoomMessage reconciles this pending
    // bubble with the authoritative copy once it arrives, or it's removed
    // below if the send actually fails.
    const pendingId = `pending-${Date.now()}`;
    setMessages(current => [
      ...current,
      { id: pendingId, type: 'message', author: ownerName, chatBoxUrl: null, text, pending: true }
    ]);
    sendAudioRoomMessage(roomId, text, result => {
      if (!result?.success) {
        setMessages(current => current.filter(message => message.id !== pendingId));
        setDraft(current => (current ? current : text));
        showAlert('Message Not Sent', 'Please reconnect to the room and try again.');
      }
    });
  };


  const handleSendGift = async (gift, quantity) => {
    if (!session?.token || !roomOwner?.id || sendingGift) {
      return;
    }
    if (roomOwner.id === (session.user?.publicId || ownerAvatarSeed)) {
      showAlert('Cannot Send Gift', "You can't send a gift to yourself.");
      return;
    }
    setSendingGift(true);
    try {
      await sendGift(session.token, {
        recipientId: roomOwner.id,
        giftId: gift.id,
        quantity,
        roomId
      });
      setGiftPickerVisible(false);
    } catch (error) {
      if (error instanceof GiftSendError && error.code === 'INSUFFICIENT_COINS') {
        showAlert('Insufficient Coins', "You don't have enough coins to send this gift.");
      } else if (error instanceof GiftSendError && error.code === 'HOST_AGENCY_REQUIRED') {
        showAlert('Unable to Send Gift', 'This host is not currently eligible to receive gifts.');
      } else if (error instanceof GiftSendError && error.code === 'GIFT_NOT_FOUND') {
        showAlert('Unable to Send Gift', 'This gift is no longer available.');
      } else if (error instanceof GiftSendError && error.code === 'ROOM_NOT_LIVE') {
        showAlert('Unable to Send Gift', 'This room is no longer live.');
      } else if (error instanceof GiftSendError) {
        showAlert('Unable to Send Gift', error.message);
      } else {
        showAlert('Unable to Send Gift', 'Something went wrong. Please try again.');
      }
    } finally {
      setSendingGift(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
      return () => {
        // Matches App.jsx's app-wide default now that the page background
        // is dark — this used to restore 'dark-content' for the old light
        // theme, which would leave status bar icons invisible against the
        // new dark surfaces.page everywhere else in the app.
        StatusBar.setBarStyle('light-content');
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(theme.surfaces.page);
      };
    }, [theme])
  );

  const hasCustomBackground = Boolean(assignedRoomBackgroundSource) && !customBackgroundFailed;
  const backgroundSource = hasCustomBackground ? assignedRoomBackgroundSource : roomBackgroundImage;
  const identityAvatarBackground = ownerFrameUri ? 'transparent' : theme.colors.teal50;
  // No white scrim overlay at all — both backgrounds dim through image
  // opacity alone against the card-colored surface behind them (custom
  // uploads at 0.5, the bundled default at its original 0.35).
  const backgroundImageStyle = hasCustomBackground ? styles.customBackgroundImage : styles.backgroundImage;

  return (
    <ImageBackground
      source={backgroundSource}
      resizeMode="cover"
      style={[styles.root, { backgroundColor: theme.surfaces.card }]}
      imageStyle={backgroundImageStyle}
      onError={() => {
        if (hasCustomBackground) {
          setCustomBackgroundFailed(true);
        }
      }}
    >

      <View style={[styles.foreground, { paddingTop: insets.top }]}>
        <View style={styles.entranceBannerWrap} pointerEvents="none">
          <EntranceBanner entrance={currentEntrance?.kind === 'ride' ? null : currentEntrance} onFinished={() => showNextEntranceRef.current?.()} />
        </View>
        <View style={styles.header}>
          <View style={styles.identityCenterWrap} pointerEvents="box-none">
            <View style={styles.identityPanel}>
              <View style={[styles.identityAvatarOuter, { width: ownerCircleSize, height: ownerCircleSize }]}>
                <View style={[styles.identityAvatarWrap, { width: ownerCircleSize, height: ownerCircleSize, borderRadius: ownerCircleSize / 2, backgroundColor: identityAvatarBackground }]}>
                  <Avatar
                    value={roomOwner?.profileImage || `${AVATAR_PLACEHOLDER}?seed=${roomOwner?.id ?? ownerAvatarSeed}`}
                    fullName={roomOwner?.name ?? ownerName}
                    size={ownerCircleSize}
                  />
                </View>
                {ownerFrameUri ? (
                  <Image
                    source={{ uri: ownerFrameUri }}
                    style={[styles.identityFrameOverlay, {
                      top: -(ownerFrameSize - ownerCircleSize) / 2,
                      left: -(ownerFrameSize - ownerCircleSize) / 2,
                      width: ownerFrameSize,
                      height: ownerFrameSize
                    }]}
                    resizeMode="contain"
                    pointerEvents="none"
                  />
                ) : null}
                <View
                  style={[
                    styles.identityMicBadge,
                    {
                      width: ownerMicBadgeSize,
                      height: ownerMicBadgeSize,
                      borderRadius: ownerMicBadgeSize / 2,
                      backgroundColor: ownerMicMuted ? theme.colors.giftAccent : theme.colors.teal700,
                      borderColor: theme.surfaces.card
                    }
                  ]}
                >
                  <MicIcon size={Math.round(ownerMicBadgeSize * 0.6)} muted={ownerMicMuted} color={theme.cta.primary.text} />
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={[styles.roomName, { color: theme.text.primary }]} numberOfLines={1}>
                  {roomName}
                </Text>
                {/* ownerDisplayId (this DEVICE's own session ID) is only a
                valid fallback while viewing your OWN room — before
                roomOwner populates. For a viewer, showing it at all
                briefly displays their own ID/Special ID in place of the
                actual host's, which then gets replaced once the real join
                ack arrives — looked like the ID randomly changing. A
                viewer should see nothing until the real host data loads,
                never their own ID standing in for it. */}
                {(isOwner ? (roomOwner?.displayId ?? ownerDisplayId) : roomOwner?.displayId) ? (
                  <Text style={[styles.roomIdText, { color: theme.text.secondary }]} numberOfLines={1}>
                    {isOwner ? 'Your ID' : 'Host ID'}: {isOwner ? (roomOwner?.displayId ?? ownerDisplayId) : roomOwner?.displayId}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            {isSpeakerMuted ? (
              <View style={[styles.iconButton, { backgroundColor: theme.colors.giftAccent }]}>
                <SpeakerIcon size={16} muted color={theme.cta.primary.text} />
              </View>
            ) : null}
            <View style={styles.viewersPanel}>
              <View style={[styles.liveDot, { backgroundColor: theme.colors.liveBadge }]} />
              <Text style={[styles.viewersCount, { color: theme.colors.teal700 }]}>{viewerCount}</Text>
            </View>
            <Pressable onPress={handleClosePress} style={styles.iconButton}>
              <CloseIcon color={theme.text.primary} />
            </Pressable>
          </View>
        </View>

        {seatRows ? (
          <View style={styles.seatRows}>
            {seatRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.seatRow}>
                {row.map(seat => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    theme={theme}
                    columnStyle={{ width: seatSizing.columnWidth }}
                    circleSize={seatSizing.circleSize}
                    onEmptySeatPress={handleEmptySeatPress}
                    pressEnabled={isOwner || canTakeSeat}
                    isOwner={isOwner}
                    isMySeat={seat.id === mySeatId}
                    note={seatNotes[seat.id]}
                    onAvatarPress={handleSeatAvatarPress}
                    onLongPressSeat={handleLeaveSeatPress}
                    myFrameUri={myFrameUri}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : isViewerEntry ? (
          // Waiting on the owner's first audio-room:seat-update broadcast —
          // a viewer never knows the seat layout up front.
          <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading room...</Text>
        ) : null}

        <View style={styles.chatArea}>
          <FlatList
            ref={chatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChatMessage message={item} theme={theme} />}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            style={styles.chatMask}
            onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.chatInputButton}>
            <ChatBubbleIcon color={theme.text.mutedIcon} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
              placeholder="Say something..."
              placeholderTextColor={theme.text.mutedIcon}
              style={[styles.textInput, { color: theme.text.primary }]}
            />
            {draft.trim().length > 0 ? (
              <Pressable onPress={handleSend} hitSlop={8}>
                <SendIcon color={theme.colors.teal700} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.bottomActions}>
            <Pressable onPress={() => setEmojiPickerVisible(true)} style={styles.iconButton}>
              <MoodIcon color={theme.text.primary} />
            </Pressable>
            {hasMicAccess ? (
              <Pressable
                onPress={handleToggleMic}
                style={[styles.iconButton, isMicMuted && { backgroundColor: theme.colors.giftAccent }]}
              >
                <MicIcon size={18} muted={isMicMuted} color={isMicMuted ? theme.cta.primary.text : theme.text.primary} />
              </Pressable>
            ) : null}
            <Pressable onPress={() => setGiftPickerVisible(true)} style={[styles.iconButton, { backgroundColor: theme.colors.teal700 }]}>
              <GiftIcon color={theme.cta.primary.text} />
            </Pressable>
            <Pressable onPress={() => setMoreMenuVisible(true)} style={styles.iconButton}>
              <MoreIcon color={theme.text.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <MoreMenuModal
        visible={moreMenuVisible}
        onClose={() => setMoreMenuVisible(false)}
        theme={theme}
        isSpeakerMuted={isSpeakerMuted}
        onToggleSpeaker={() => {
          setIsSpeakerMuted(current => {
            const next = !current;
            liveKitAudio.setRemoteAudioMuted(next);
            return next;
          });
          setMoreMenuVisible(false);
        }}
        showSeatLayoutOption={isAudioRoom && isOwner}
        onOpenSeatLayout={() => {
          setMoreMenuVisible(false);
          setSeatLayoutModalVisible(true);
        }}
        showEditCoverOption={isAudioRoom && isOwner}
        onEditCover={handleEditCover}
      />

      <SeatLayoutModal
        visible={seatLayoutModalVisible}
        onClose={() => setSeatLayoutModalVisible(false)}
        onConfirm={handleChangeSeatLayout}
        title="Change Seat Count"
        confirmLabel="Apply"
      />

      <EmojiPickerModal
        visible={emojiPickerVisible}
        onClose={() => setEmojiPickerVisible(false)}
        onSelectEmoji={emoji => {
          setDraft(current => current + emoji);
          setEmojiPickerVisible(false);
        }}
      />

      <GiftPickerModal
        visible={giftPickerVisible}
        onClose={() => setGiftPickerVisible(false)}
        onConfirmSend={handleSendGift}
        recipientName={roomOwner?.name}
        sending={sendingGift}
        sessionToken={session?.token}
      />

      <SeatNoteModal
        visible={noteModal.visible}
        value={noteModal.value}
        onChangeText={text => setNoteModal(current => ({ ...current, value: text }))}
        onCancel={closeNoteModal}
        onSave={handleSaveNote}
        theme={theme}
      />

      {currentEntrance?.kind === 'ride' ? (
        <RideFullscreen entrance={currentEntrance} onFinished={() => showNextEntranceRef.current?.()} />
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  rideFullscreen: {
    position: 'absolute',
    left: 0,
    zIndex: 50,
    elevation: 50
  },
  backgroundImage: {
    // Pinned to the container's exact current size (not just resizeMode
    // alone) — without this, toggling Android's on-screen navigation bar
    // (which resizes the window) could leave the image falling back to its
    // own intrinsic pixel size for a frame, showing as stretched/zoomed
    // instead of re-covering the new layout size.
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.35
  },
  customBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // Near-full opacity — just enough softening for seat/text legibility;
    // much lower than this blends the photo into the white surface behind
    // it and reads as a milky/whitish wash over the whole room.
    opacity: 0.9
  },
  foreground: {
    flex: 1
  },
  entranceBannerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: scaleModerate(16),
    right: scaleModerate(16),
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  entranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(14),
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: scaleModerate(22),
    paddingVertical: scaleModerate(16),
    maxWidth: '100%'
  },
  entranceText: {
    fontSize: scaleFont(12.5),
    fontWeight: '700',
    textAlignVertical: 'center',
    includeFontPadding: false
  },
  entranceArtBg: {
    alignSelf: 'center',
    minWidth: scaleModerate(320),
    maxWidth: scaleModerate(576),
    paddingHorizontal: scaleModerate(50),
    paddingVertical: scaleModerate(33),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  entranceArtBgImage: {
    borderRadius: scaleModerate(10)
  },
  entranceArtText: {
    fontSize: scaleFont(13),
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(8),
    gap: scaleModerate(8)
  },
  identityCenterWrap: {
    position: 'absolute',
    left: scaleModerate(70),
    right: scaleModerate(70),
    top: scaleModerate(8),
    alignItems: 'center'
  },
  identityPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingLeft: scaleModerate(4),
    paddingRight: scaleModerate(14),
    paddingVertical: scaleModerate(4),
    gap: scaleModerate(8),
    maxWidth: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  identityAvatarOuter: {
    width: scaleModerate(34),
    height: scaleModerate(34)
  },
  identityFrameOverlay: {
    position: 'absolute',
    top: scaleModerate(-6),
    left: scaleModerate(-6),
    width: scaleModerate(46),
    height: scaleModerate(46)
  },
  identityAvatarWrap: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17),
    overflow: 'hidden'
  },
  identityMicBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: scaleModerate(15),
    height: scaleModerate(15),
    borderRadius: scaleModerate(8),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  identityAvatar: {
    width: scaleModerate(34),
    height: scaleModerate(34)
  },
  identityText: {
    flexShrink: 1
  },
  roomName: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  roomIdText: {
    fontSize: scaleFont(10),
    fontWeight: '500'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  iconButton: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  viewersPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(6),
    gap: scaleModerate(6),
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  liveDot: {
    width: scaleModerate(8),
    height: scaleModerate(8),
    borderRadius: scaleModerate(4)
  },
  viewersCount: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  seatRows: {
    paddingHorizontal: scaleModerate(20),
    // Extra breathing room below the owner's identity island — its avatar
    // is now sized to match the seat circles (see ownerCircleSize), so it
    // can be noticeably taller than the old fixed 34px, and needs more
    // clearance before the seat grid starts.
    marginTop: scaleModerate(34),
    gap: scaleModerate(5)
  },
  loadingText: {
    marginTop: scaleModerate(24),
    textAlign: 'center',
    fontSize: scaleFont(13),
    fontWeight: '600'
  },
  seatRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: scaleModerate(8)
  },
  seatColumn: {
    alignItems: 'center'
  },
  seatCircle: {
    width: scaleModerate(56),
    height: scaleModerate(56),
    borderRadius: scaleModerate(28),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  seatCircleEmpty: {
    borderStyle: 'dashed',
    opacity: 0.9
  },
  seatCircleLocked: {
    borderStyle: 'dashed',
    opacity: 0.9
  },
  seatLabel: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    marginTop: scaleModerate(4)
  },
  seatAvatarWrap: {
    width: scaleModerate(56),
    height: scaleModerate(56),
    alignItems: 'center',
    justifyContent: 'center'
  },
  speakingRing: {
    position: 'absolute',
    width: scaleModerate(60),
    height: scaleModerate(60),
    borderRadius: scaleModerate(30),
    borderWidth: 2
  },
  frameOverlay: {
    position: 'absolute'
  },
  speakingRingSoft: {
    position: 'absolute',
    width: scaleModerate(60),
    height: scaleModerate(60),
    borderRadius: scaleModerate(30),
    borderWidth: 2,
    opacity: 0.5
  },
  seatAvatarInner: {
    width: scaleModerate(52),
    height: scaleModerate(52),
    borderRadius: scaleModerate(26),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  micBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: scaleModerate(20),
    height: scaleModerate(20),
    borderRadius: scaleModerate(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2
  },
  micBadgeInline: {
    width: scaleModerate(16),
    height: scaleModerate(16),
    borderRadius: scaleModerate(8),
    alignItems: 'center',
    justifyContent: 'center'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(2),
    marginTop: scaleModerate(2),
    maxWidth: '100%'
  },
  seatNameText: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  chatArea: {
    flex: 1,
    marginTop: scaleModerate(16),
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(8)
  },
  chatMask: {
    flex: 1
  },
  chatListContent: {
    gap: scaleModerate(8),
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  chatBubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    borderRadius: scaleModerate(14),
    borderBottomLeftRadius: 4,
    paddingVertical: scaleModerate(7),
    paddingHorizontal: scaleModerate(12),
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  chatBubbleContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  chatBoxArtwork: {
    borderRadius: scaleModerate(14),
    borderBottomLeftRadius: 4,
    opacity: 0.9
  },
  chatSystemLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  chatMessageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(3),
    borderRadius: scaleModerate(4),
    paddingHorizontal: scaleModerate(6),
    paddingVertical: scaleModerate(2),
    marginRight: scaleModerate(6)
  },
  chatMessageBadgeText: {
    fontSize: scaleFont(9),
    fontWeight: '700'
  },
  chatAuthor: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  chatBody: {
    fontSize: scaleFont(13),
    flexShrink: 1
  },
  giftBubble: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    paddingVertical: scaleModerate(8),
    paddingHorizontal: scaleModerate(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10)
  },
  chatInputButton: {
    flex: 1,
    height: scaleModerate(40),
    borderRadius: scaleModerate(20),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(16),
    gap: scaleModerate(8),
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  textInput: {
    flex: 1,
    fontSize: scaleFont(13)
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  noteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(24)
  },
  moreSheet: {
    width: '100%',
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(8)
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(14)
  },
  moreRowText: {
    fontSize: scaleFont(14),
    fontWeight: '600'
  },
  moreCancelButton: {
    marginTop: scaleModerate(4),
    paddingVertical: scaleModerate(14),
    alignItems: 'center'
  },
  moreCancelText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  noteSheet: {
    width: '100%',
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(20)
  },
  noteTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    textAlign: 'center'
  },
  noteSubtitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(12),
    textAlign: 'center'
  },
  noteInput: {
    marginTop: scaleModerate(16),
    height: scaleModerate(44),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    fontSize: scaleFont(14)
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scaleModerate(12),
    marginTop: scaleModerate(16)
  },
  noteCancelButton: {
    paddingVertical: scaleModerate(10),
    paddingHorizontal: scaleModerate(14)
  },
  noteCancelText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  noteSaveButton: {
    borderRadius: scaleModerate(20),
    paddingVertical: scaleModerate(10),
    paddingHorizontal: scaleModerate(20)
  },
  noteSaveText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  }
});

export default RoomScreen;
