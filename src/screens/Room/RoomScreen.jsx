import React from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  PanResponder,
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
import Svg, { Path } from 'react-native-svg';
import Video from 'react-native-video';
import { useTheme } from '../../theme';
import { LockIcon, roomBackgroundImage } from '../../assets';
import { Avatar, EmojiPickerModal, GiftPickerModal, SeatLayoutModal, showAlert } from '../../components';
import { AudioRoomError, endAudioRoom as endAudioRoomRecord, fetchAssetDataUri, fixLocalhostOrigin, GiftSendError, sendGift, startAudioRoom, updateAudioRoom } from '../../api';
import { assetIdentity, useAssignedFrame, useAssignedRoomBackground } from '../../hooks';
import {
  emitSeatUpdate,
  getSessionSocket,
  joinAudioRoom,
  leaveAudioRoom,
  requestSeat,
  respondToSeatRequest
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

// Store/props assets aren't always static images — Rides in particular are
// short video clips (see src/components/AssetPreview.jsx). The backend
// doesn't send a mimeType alongside entranceUrl/rideUrl, so this sniffs the
// file extension instead — good enough for the CDN URLs these come from.
function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url ?? '');
}

// How long a queued entrance/ride item stays on screen (the slide-in-hold-
// slide-out animation's middle "hold" portion) — a plain text/image banner
// only ever needed a beat to be read, but a video needs real time to
// actually play, not just flash by mid-slide.
const BANNER_SLIDE_MS = 350;
const BANNER_TEXT_HOLD_MS = 1000;
const BANNER_VIDEO_HOLD_MS = 3000;
function bannerHoldMs(item) {
  const artUrl = item?.kind === 'ride' ? item?.rideUrl : item?.entranceUrl;
  return artUrl && isVideoUrl(artUrl) ? BANNER_VIDEO_HOLD_MS : BANNER_TEXT_HOLD_MS;
}

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

const AVATAR_PLACEHOLDER = 'https://api.dicebear.com/7.x/avataaars/svg';
const CHAT_MESSAGE_MAX_LENGTH = 200;

// Builds the seat rows for a freshly created audio room from the chosen
// seat-layout tiers (e.g. [2, 3, 5, 5]). The room owner has their own fixed
// spot in the header identity panel — they never occupy a numbered seat —
// so every seat starts open for other participants to take.
function buildSeatRowsFromGroups(seatGroups) {
  let seatIndex = 0;
  return seatGroups.map((count, rowIndex) =>
    Array.from({ length: count }, () => {
      seatIndex += 1;
      return { id: `row${rowIndex}-seat${seatIndex}`, name: null, occupied: false };
    })
  );
}

function Seat({ seat, theme, columnStyle, circleSize = scaleModerate(56), onEmptySeatPress, pressEnabled, draggable, note, onAvatarPress, myFrameUri }) {
  const avatarInnerSize = circleSize - 4;
  const ringSize = circleSize + 4;
  const micBadgeSize = Math.max(scaleModerate(16), Math.round(circleSize * 0.36));
  const avatarInnerBackground = draggable && myFrameUri ? 'transparent' : theme.surfaces.card;

  // Only the seat belonging to the current user (draggable) gets a pan
  // gesture, so people can move their own tile around the room — this
  // never applies to the owner, who has no seat at all.
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  if (!seat.occupied) {
    if (seat.locked) {
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
            styles.seatCircleEmpty,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              borderColor: theme.colors.teal700,
              backgroundColor: theme.surfaces.card
            }
          ]}
        >
          <PlusIcon size={Math.round(circleSize * 0.36)} color={theme.colors.teal700} />
        </View>
        <Text style={[styles.seatLabel, { color: theme.text.secondary }]} numberOfLines={1}>
          {note || 'Take seat'}
        </Text>
      </Pressable>
    );
  }

  const SeatWrapper = draggable ? Animated.View : View;
  const wrapperProps = draggable
    ? { style: [styles.seatColumn, columnStyle, { transform: pan.getTranslateTransform() }], ...panResponder.panHandlers }
    : { style: [styles.seatColumn, columnStyle] };

  // Tapping a seated participant's avatar opens their profile — but never
  // for the draggable seat (that's this device's own seat/pan gesture), so
  // dragging your own tile around never gets swallowed by a press.
  const AvatarWrapper = draggable ? View : Pressable;
  const avatarWrapperProps = draggable ? {} : { onPress: () => onAvatarPress?.(seat) };

  return (
    <SeatWrapper {...wrapperProps}>
      <AvatarWrapper {...avatarWrapperProps} style={[styles.seatAvatarWrap, { width: circleSize, height: circleSize }]}>
        {/* Both rings below are skipped once a frame is showing (draggable
        && myFrameUri) — the frame has its own decorative border, and a
        plain ring the same size was peeking through its artwork's
        transparent margins as a stray green line behind it. */}
        {seat.host && !(draggable && myFrameUri) ? (
          <View
            style={[
              styles.speakingRing,
              { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: theme.colors.teal700 }
            ]}
          />
        ) : null}
        {seat.speaking && !seat.host && !(draggable && myFrameUri) ? (
          <View
            style={[
              styles.speakingRingSoft,
              { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: theme.colors.teal400 }
            ]}
          />
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
        {draggable && myFrameUri ? (
          // Only this device's own seat can show its own assigned frame —
          // other seats' occupants' frames aren't fetchable from here (no
          // backend endpoint returns another user's assigned assets).
          // Sits as its own overlay (not inside seatAvatarInner, which
          // clips to a circle). Deliberately NOT reusing styles.speakingRing
          // — it carries a fixed borderRadius meant for that circular ring
          // indicator, which was forcing the frame's own (often
          // non-circular/decorative) artwork into a clipped circle.
          <Image
            source={{ uri: myFrameUri }}
            style={[styles.frameOverlay, { width: ringSize, height: ringSize }]}
            resizeMode="contain"
            pointerEvents="none"
          />
        ) : null}
        {draggable && myFrameUri ? null : (
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
        {draggable && myFrameUri ? (
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

const SEAT_NOTE_MAX_LENGTH = 40;

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
function MoreMenuModal({ visible, onClose, theme, isSpeakerMuted, onToggleSpeaker, showSeatLayoutOption, onOpenSeatLayout }) {
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
  return (
    <View style={styles.chatBubble}>
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
  const { source: assignedRoomBackgroundSource } = useAssignedRoomBackground();
  const myFrameUri = useAssignedFrame();
  const [customBackgroundFailed, setCustomBackgroundFailed] = React.useState(false);
  React.useEffect(() => {
    setCustomBackgroundFailed(false);
  }, [assignedRoomBackgroundSource]);
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
  // Trending Parties navigates here with asViewer:true for someone else's
  // room (no seatGroups — the layout is unknown until the owner's first
  // seat-state broadcast arrives). Every other entry point (starting fresh,
  // resuming your own room, the notification tap) is always the owner.
  const isViewerEntry = Boolean(route.params?.asViewer);
  const [isOwner, setIsOwner] = React.useState(!isViewerEntry);
  // Who a sent gift is credited to — set from the join ack (see setup()
  // below), which always includes `owner` regardless of whether this
  // device is the owner or a viewer.
  const [roomOwner, setRoomOwner] = React.useState(!isViewerEntry ? { id: ownerAvatarSeed, name: ownerName } : null);
  // The room creator always keeps mic access via their fixed header spot.
  // Anyone else only gets the bottom-bar mic control once they've actually
  // taken a seat.
  const hasMicAccess = mode !== 'audio' || isOwner || mySeatId !== null;
  const [isMicMuted, setIsMicMuted] = React.useState(false);
  // Mirrors isMicMuted for the setup effect's unmount cleanup below, which
  // intentionally only depends on [isAudioRoom] (see its own comment) and
  // so would otherwise always see the mute state from when the room first
  // opened, not whatever it actually is by the time the user leaves.
  const isMicMutedRef = React.useRef(isMicMuted);
  React.useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);
  // Tracks whether the app is currently backgrounded (set by the AppState
  // effect below) so handleToggleMic knows whether the "still live"
  // notification is actually on screen and needs its Pause/Unmute label
  // refreshed — calling showLiveRoomNotification while the app is in the
  // foreground would otherwise pop the notification up unnecessarily.
  const isBackgroundedRef = React.useRef(false);
  // Mirror refs so the socket-listener effect below (registered once per
  // room visit, deps=[isAudioRoom]) can always read the current value
  // instead of whatever was current when it first ran.
  const isOwnerRef = React.useRef(isOwner);
  React.useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);
  const roomOwnerRef = React.useRef(roomOwner);
  React.useEffect(() => {
    roomOwnerRef.current = roomOwner;
  }, [roomOwner]);
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
      if (mySeatId) {
        setSeatRows(rows =>
          rows.map(row => row.map(seat => (seat.id === mySeatId ? { ...seat, muted: next } : seat)))
        );
      }
      if (isAudioRoom && roomId && isBackgroundedRef.current) {
        showLiveRoomNotification({ roomId, roomName, mode, seatGroups, micMuted: next }).catch(() => {});
      }
      return next;
    });
  };

  // Applies a seat assignment to local state — used once the owner (this
  // device, on request-acceptance) or a viewer (on receiving an accepted
  // audio-room:seat-response) actually has permission to occupy the seat.
  const applySeatAssignment = (seatId, { name, avatarSeed, avatarUri, muted, frameUrl, badgeUrl, gender, dob, isOfficial }) => {
    setSeatRows(current =>
      (current ?? []).map(row =>
        row.map(seat => (seat.id === seatId ? { ...seat, occupied: true, name, avatarSeed, avatarUri, muted, frameUrl, badgeUrl, gender, dob, isOfficial } : seat))
      )
    );
  };

  // The room owner's device is the sole source of truth for seat state (see
  // StreamLine-Portal/docs/mobile-audio-room-api.md's seat-request/
  // seat-response relay) — a viewer can't just take a seat locally. This
  // only sends the request; the seat is actually applied once
  // audio-room:seat-response arrives with accepted:true (handled in the
  // setup effect below).
  const handleTakeSeat = seatId => {
    if (mySeatId || !roomId) {
      return;
    }
    requestSeat(roomId, seatId, seatNotes[seatId] ?? null, result => {
      if (result && result.success === false) {
        showAlert(
          'Unable to Take Seat',
          result.error?.code === 'ROOM_UNAVAILABLE' ? 'This room is no longer available.' : 'Please try again.'
        );
      }
    });
  };

  // The owner can never sit, so tapping an empty seat opens the note popup
  // instead of taking it. Everyone else still takes the seat as normal.
  const handleEmptySeatPress = seatId => {
    if (isOwner) {
      setNoteModal({ visible: true, seatId, value: seatNotes[seatId] ?? '' });
      return;
    }
    handleTakeSeat(seatId);
  };

  // Opens the seated participant's profile — the Seat component only wires
  // this up for occupied seats other than this device's own (draggable)
  // one, so this never fires for an empty seat or your own tile.
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

  // Reconfigures the current room's seat grid on the fly (e.g. 25 seats
  // down to 2) without ending/restarting the room. Owner-only: every seat
  // resets to empty in the new layout (occupants aren't remapped into a
  // smaller grid), and this rides the existing owner-only seat-broadcast
  // effect below (it already re-emits whenever seatRows changes), so
  // viewers pick up the new layout the same way they see any other seat
  // update — no extra socket wiring needed here.
  const handleChangeSeatLayout = groups => {
    setSeatRows(buildSeatRowsFromGroups(groups));
    setSeatNotes({});
    setSeatLayoutModalVisible(false);
  };

  const handleSaveNote = () => {
    const text = noteModal.value.trim();
    setSeatNotes(current => {
      const next = { ...current };
      if (text) {
        next[noteModal.seatId] = text;
      } else {
        delete next[noteModal.seatId];
      }
      return next;
    });
    closeNoteModal();
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
  // The owner's own "island" avatar (top identity panel) is based on
  // whatever size the seat circles actually are on this screen (instead of
  // a fixed 34px) — two successive 10% reductions then a 5% increase from
  // that — same proportions Seat itself uses for its frame overlay and mic
  // badge, just derived here since the owner never occupies an actual
  // numbered seat.
  const ownerCircleSize = Math.round((seatSizing?.circleSize ?? scaleModerate(56)) * 0.9 * 0.9 * 1.05);
  const ownerFrameSize = ownerCircleSize + 12;
  const ownerMicBadgeSize = Math.max(scaleModerate(16), Math.round(ownerCircleSize * 0.36));
  const occupiedSeatCount = seatRows ? seatRows.flat().filter(seat => seat.occupied).length : 0;
  const viewerCount = occupiedSeatCount + 1;
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const hasWelcomedRef = React.useRef(false);

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
    // Timing is entirely owned by EntranceBanner now (see its onFinished
    // prop below) — a plain banner holds for a fixed beat, a video (Ride)
    // holds for exactly as long as the clip runs — so nothing to schedule
    // here beyond just showing whatever's next.
  };
  const pushEntranceRef = React.useRef(null);
  pushEntranceRef.current = data => {
    console.log('[Entrance] pushed to queue', data);
    entranceQueueRef.current.push(data);
    if (!isShowingEntranceRef.current) {
      showNextEntranceRef.current?.();
    }
  };

  // See StreamLine-Portal/docs/mobile-audio-room-api.md — a real room record
  // is created/updated on the backend for every audio room, and the room
  // channel is joined on the same authenticated socket used for session
  // enforcement (src/services/socket.js) to react instantly to admin
  // moderation (blocked/terminated/deleted rooms, joining disabled).
  // A viewer entry counts as an audio room immediately even before seatRows
  // exists — its layout is unknown until the owner's first seat-state
  // broadcast arrives, not derived from local seatGroups like the owner's.
  const isAudioRoom = mode === 'audio' && (Boolean(seatRows) || isViewerEntry);
  const [joiningDisabled, setJoiningDisabled] = React.useState(false);
  const [isRoomBlocked, setIsRoomBlocked] = React.useState(false);
  // Populated from the admin-provided reason on the audio-room:blocked/
  // terminated/deleted event that set isRoomBlocked, so the alert below can
  // show it instead of a generic "removed by an administrator" message.
  const [roomBlockedReason, setRoomBlockedReason] = React.useState(null);
  const startedAtRef = React.useRef(null);
  const roomEndedRef = React.useRef(false);
  // Always read the latest count from this ref (not the `viewerCount`
  // closed over when the effect first ran) so a room ended via unmount/back
  // gesture reports the real count at that moment, not whatever it was when
  // the room was created.
  const viewerCountRef = React.useRef(viewerCount);
  // Debounced seat-count sync (below) needs to know whether this is the
  // very first seat-state it's seen this screen visit.
  const isFirstParticipantSyncRef = React.useRef(true);
  // handleToggleMic/endAudioRoom themselves are defined further down (they
  // close over a lot of this component's own state), so these two refs
  // can only be *declared* here with a null placeholder — same pattern as
  // isOwnerRef above; the actual `.current = ...` assignment has to stay
  // right after each function's own definition, where it's still kept in
  // sync on every render (not gated by an effect, so it's never stale).
  const handleToggleMicRef = React.useRef(null);
  const endAudioRoomRef = React.useRef(null);
  const canTakeSeat = !isOwner && !mySeatId && !joiningDisabled;

  React.useEffect(() => {
    viewerCountRef.current = viewerCount;
  }, [viewerCount]);

  React.useEffect(() => {
    if (!isAudioRoom || !roomId) {
      return;
    }
    setCachedSeatState(roomId, { seatRows, mySeatId, seatNotes });
  }, [isAudioRoom, roomId, seatRows, mySeatId, seatNotes]);

  // Explicit "End Room" — the room ID is retained server-side (IDLE, not
  // deleted), same as the auto-release below, but this also lets the owner
  // attach a recording URL and records a clean END action in the audit log.
  const endAudioRoom = React.useCallback(() => {
    if (!isAudioRoom || !isOwner || roomEndedRef.current || !session?.token || !roomId) {
      return;
    }
    roomEndedRef.current = true;
    leaveAudioRoom(roomId);
    clearCachedSeatState(roomId);
    endAudioRoomRecord(session.token).catch(() => {});
  }, [isAudioRoom, isOwner, roomId, session?.token]);

  // Tapping the close button always asks first — "Yes" ends the room for
  // everyone, "No" just dismisses the popup and stays in the room. Video
  // mode has no room to end, so it closes immediately without asking. A
  // viewer doesn't own the room and can't end it — leaving just stops
  // listening to it, same as leaveAudioRoom anywhere else.
  const handleClosePress = () => {
    if (!isAudioRoom) {
      navigation.goBack();
      return;
    }
    if (!isOwner) {
      if (roomId) {
        leaveAudioRoom(roomId);
      }
      navigation.goBack();
      return;
    }
    showAlert('End Room', 'Do you want to end this room?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () => {
          endAudioRoom();
          navigation.goBack();
        }
      }
    ]);
  };

  React.useEffect(() => {
    if (!isAudioRoom || !session?.token) {
      return undefined;
    }

    dismissLiveRoomNotification().catch(() => {});

    let cancelled = false;
    let retryTimer = null;
    // The room ID may not exist yet (brand-new room) when this effect
    // starts — startAudioRoom() below resolves it. Track it locally instead
    // of the `roomId` state, since these closures are only created once per
    // effect run and wouldn't see a state update from within the same run.
    let activeRoomId = roomId;

    // Shared by the unmount cleanup below AND by setup()'s post-await
    // continuation — leaves the socket room and, for the owner, shows the
    // "still live" notification. Needs activeRoomId to actually be known;
    // see the comment where setup() calls this after a delayed START
    // response for why that isn't always true the instant this effect
    // tears down.
    const backgroundNow = () => {
      if (roomEndedRef.current || !activeRoomId) {
        return;
      }
      leaveAudioRoom(activeRoomId);
      // The "still live, tap to return" framing only makes sense for the
      // room's owner — a viewer leaving someone else's room can always find
      // it again via Trending Parties, so no notification for them.
      if (isOwnerRef.current) {
        isBackgroundedRef.current = true;
        showLiveRoomNotification({
          roomId: activeRoomId,
          roomName,
          mode,
          seatGroups,
          micMuted: isMicMutedRef.current
        }).catch(() => {});
      }
    };

    // Blocked/terminated/deleted (or a failed join) all mean the room is
    // already gone on the backend — mark it ended right away so the unmount
    // cleanup treats it that way too, instead of falling through to
    // backgroundLiveRoom() and showing a "still live, tap to return"
    // notification for a room that no longer exists. It also stops the
    // participant-count-sync effect from upserting (and accidentally
    // re-creating) a deleted room.
    // socket.on here is the raw socket instance (not the connectSessionSocket
    // wrapper in useSessionGuard, which already unwraps payload.data before
    // calling its handlers) — every listener below has to unwrap
    // payload?.data itself. This was previously missed on every one of
    // these (blocked/terminated/deleted, seat-update, seat-request,
    // seat-response), so all of them were silently reading fields off the
    // wrong object (undefined roomId, undefined seatId, etc.) — seat sync
    // for real viewers, seat-take requests, and the room-blocked reason
    // text were all quietly broken.
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

    // Join attempts only count as "blocked" when the server itself answers
    // with success:false — a socket that hasn't connected yet is a timing
    // issue, not a moderation action, so it gets retried instead of
    // immediately showing the "removed by an administrator" alert.
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
          // ROOM_OWNER_ONLY means the room is still live, just temporarily
          // owner-only — not gone. Everything else (blocked/terminated/
          // deleted/not-found) means the room is no longer available.
          if (result.error?.code === 'ROOM_OWNER_ONLY') {
            setJoiningDisabled(true);
            return;
          }
          handleRoomEndedExternally();
          return;
        }
        // The join ack is the authoritative, server-verified source for
        // ownership (see docs/mobile-audio-room-api.md) — always trust it
        // over the isViewerEntry-based optimistic default.
        if (typeof result.data?.isOwner === 'boolean') {
          setIsOwner(result.data.isOwner);
        }
        if (result.data?.owner?.publicId) {
          setRoomOwner({ id: result.data.owner.publicId, name: result.data.owner.name });
        }
      });
    };

    const setup = async () => {
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;

      // Joining someone else's room never goes through START — that call
      // is scoped to the caller's OWN one-room-per-user record on the
      // backend, so calling it here would create/restart this viewer's own
      // room instead of joining the one they tapped into.
      if (isViewerEntry) {
        if (!cancelled) {
          attemptJoin(5);
        }
        return;
      }

      try {
        // Reusing an already-assigned room (returning from background)
        // still goes through START — the backend treats it as a restart of
        // the same persistent ID (reused: true) rather than issuing a new
        // one.
        const result = await startAudioRoom(session.token, {
          title: roomName,
          participantCount: viewerCountRef.current
        });
        if (result?.roomId) {
          activeRoomId = result.roomId;
          if (!cancelled) {
            setRoomId(result.roomId);
          } else {
            // The user backed out before this request even finished — the
            // unmount cleanup already ran and silently skipped
            // leaveAudioRoom/the "still live" notification because
            // activeRoomId was still null at that point (a brand-new room
            // has no ID until this response arrives). Do it now that one
            // finally exists, instead of the room quietly staying LIVE with
            // no notification ever shown — this is what made the
            // notification only "sometimes" appear, depending on how fast
            // the user backed out relative to this request.
            backgroundNow();
            return;
          }
        }
      } catch (startError) {
        // A blocked/terminated room means there's nothing to join at all —
        // surface it and back out instead of silently leaving the screen
        // stuck with no seats and no explanation.
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
        // Any other failure (network blip, validation error, expired
        // session, etc.) is only "best-effort, still try to join" when
        // we're resuming an ALREADY-known room (activeRoomId was set on a
        // previous visit) — attemptJoin can still succeed with that ID.
        // But for a brand-new room that never got assigned an ID at all,
        // silently falling through here left the screen stuck forever with
        // no seats, no join, and no explanation. Surface it instead.
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

    // Captured once per room visit — safe today because nothing calls
    // connectSessionSocket() again while a room is mounted (the only things
    // that do — ban/force-logout/login/logout in useSessionGuard — already
    // navigate away from this screen first). If a future feature ever
    // reconnects the session socket while a room is open (e.g. a manual
    // "reconnect" action or a token-refresh flow), these listeners would
    // silently keep pointing at the old, discarded socket object and stop
    // receiving room events — this effect would need to react to that
    // instead of grabbing the socket once.
    const socket = getSessionSocket();
    // Doesn't kick anyone already in the room — just blocks new seats from
    // being taken — so unlike the blocked/terminated case this only needs a
    // heads-up alert (with the admin's reason, when given), not a forced
    // exit.
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
    // Owner-only mode lifting (manually or its timer expiring) is the only
    // one of these that matters while still inside a live room — blocked/
    // terminated/deleted rooms are already handled by
    // handleRoomEndedExternally kicking the viewer out entirely.
    const handleJoiningEnabled = () => setJoiningDisabled(false);
    const handleBlocked = handleRoomEndedExternally;
    const handleTerminated = handleRoomEndedExternally;
    const handleDeleted = handleRoomEndedExternally;

    // See docs/mobile-audio-room-api.md's "Live seat-state relay" — none of
    // this is persisted server-side, the owner's device is the sole source
    // of truth and the server only validates ownership and relays.
    const handleSeatUpdate = payload => {
      const data = payload?.data;
      if (isOwnerRef.current || data?.roomId !== activeRoomId) {
        return;
      }
      setSeatRows(Array.isArray(data.seatRows) ? data.seatRows : []);
      setSeatNotes(data.notes ?? {});
    };
    // Fired to the owner whenever a new viewer joins — reply with the full
    // current snapshot so they don't start blank.
    const handleSeatSyncRequest = () => {
      if (!isOwnerRef.current) {
        return;
      }
      emitSeatUpdate(activeRoomId, seatRowsRef.current, seatNotesRef.current);
    };
    // Owner-only — a viewer asked to take a specific seat.
    const handleSeatRequestEvent = payload => {
      const data = payload?.data;
      if (!isOwnerRef.current) {
        return;
      }
      if (!data?.seatId) {
        respondToSeatRequest(activeRoomId, data?.requestId, data?.requesterId, null, false, 'No seat specified');
        return;
      }
      // requesterName/requesterProfileImage are server-trusted (see
      // docs/mobile-audio-room-api.md) — requesterId is kept only as a
      // fallback for older backend builds that didn't send a name yet.
      const requesterName = data.requesterName || data.requesterId;
      showAlert(
        'Seat Request',
        data.note ? `${requesterName} wants to take a seat: "${data.note}"` : `${requesterName} wants to take a seat.`,
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () =>
              respondToSeatRequest(activeRoomId, data.requestId, data.requesterId, data.seatId, false, 'Declined by host')
          },
          {
            text: 'Accept',
            onPress: () => {
              applySeatAssignment(data.seatId, {
                name: requesterName,
                avatarSeed: data.requesterId,
                avatarUri: data.requesterProfileImage || null,
                muted: false,
                frameUrl: data.requesterFrameUrl || null,
                badgeUrl: data.requesterBadgeUrl || null,
                gender: data.requesterGender || null,
                dob: data.requesterDob || null,
                isOfficial: Boolean(data.requesterIsOfficial)
              });
              respondToSeatRequest(activeRoomId, data.requestId, data.requesterId, data.seatId, true, null);
            }
          }
        ]
      );
    };
    // Viewer-only — the owner responded to this device's own seat request.
    const handleSeatResponseEvent = payload => {
      const data = payload?.data;
      if (isOwnerRef.current) {
        return;
      }
      if (!data?.accepted) {
        showAlert('Seat Request Declined', data?.reason || 'The host declined your request.');
        return;
      }
      // Applied optimistically — the owner's own next seat-update broadcast
      // carries the same change, but this avoids a visible delay for the
      // requester in the meantime.
      setMySeatId(data.seatId);
      applySeatAssignment(data.seatId, {
        name: ownerName,
        avatarSeed: ownerAvatarSeed,
        avatarUri: session?.user?.profileImage || null,
        muted: isMicMutedRef.current,
        frameUrl: null,
        badgeUrl: null,
        gender: null,
        dob: null,
        isOfficial: false
      });
    };

    const pushRideIfAny = data => {
      if (!data.rideUrl) {
        console.log('[Ride] no rideUrl on this entrance payload — nothing equipped/resolved for', data?.userId);
        return;
      }
      console.log('[Ride] pushing ride to queue', data.rideUrl);
      // Always streamed straight from the CDN URL, never run through the
      // base64-data-URI cache (fetchAssetDataUri) that entrance art below
      // uses — that cache is for small static images, and a Ride is always
      // treated as video (see EntranceBanner's isVideo); a multi-MB video
      // turned into a base64 string is both slow and often too large for
      // react-native-video to decode as a data: URI anyway.
      pushEntranceRef.current?.({ ...data, kind: 'ride', rideUrl: fixLocalhostOrigin(data.rideUrl) });
    };

    const handleEntrance = payload => {
      const data = payload?.data;
      console.log('[Entrance] received', JSON.stringify(payload), 'activeRoomId', activeRoomId);
      if (data?.roomId !== activeRoomId) {
        console.log('[Entrance] dropped — roomId mismatch', data?.roomId, 'vs', activeRoomId);
        return;
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

    // See StreamLine-Portal/docs/gift-profit-rules-api.md — the backend
    // settles the transaction and broadcasts this to everyone in the room
    // (including the sender), so nobody adds their own gift message
    // optimistically — this single broadcast is the only source of the
    // chat bubble for every device.
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

    socket?.on('audio-room:joining-disabled', handleJoiningDisabled);
    socket?.on('audio-room:joining-enabled', handleJoiningEnabled);
    socket?.on('audio-room:blocked', handleBlocked);
    socket?.on('audio-room:terminated', handleTerminated);
    socket?.on('audio-room:deleted', handleDeleted);
    socket?.on('audio-room:seat-update', handleSeatUpdate);
    socket?.on('audio-room:seat-sync-request', handleSeatSyncRequest);
    socket?.on('audio-room:seat-request', handleSeatRequestEvent);
    socket?.on('audio-room:seat-response', handleSeatResponseEvent);
    socket?.on('audio-room:entrance', handleEntrance);
    socket?.on('gift:received', handleGiftBroadcast);
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
      socket?.off('audio-room:seat-update', handleSeatUpdate);
      socket?.off('audio-room:seat-sync-request', handleSeatSyncRequest);
      socket?.off('audio-room:entrance', handleEntrance);
      socket?.off('gift:received', handleGiftBroadcast);
      socket?.off('audio-room:seat-request', handleSeatRequestEvent);
      socket?.off('audio-room:seat-response', handleSeatResponseEvent);
      // If activeRoomId isn't known yet at this point (brand-new room,
      // startAudioRoom() still in flight), there's nothing to background
      // yet — setup()'s continuation handles it once the response arrives
      // instead, via the same backgroundNow() helper.
      backgroundNow();
    };
    // Only run once per room visit — roomName/session are stable for the
    // screen's lifetime, and re-running this on every viewerCount change
    // would re-create/rejoin the room instead of just syncing the count
    // (handled by the separate effect below). roomId is intentionally
    // excluded too — this effect is what sets it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioRoom]);

  // Debounced — a burst of seats filling/emptying quickly (e.g. several
  // people joining at once) would otherwise fire one API call per change.
  // Owner-only: updateAudioRoom acts on the caller's OWN one-room-per-user
  // record, so a viewer calling it would silently create/update their own
  // separate room instead of this one.
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

  // Owner-only — broadcasts the full seat snapshot to every viewer whenever
  // seats or notes change, debounced the same way. See
  // docs/mobile-audio-room-api.md's "Live seat-state relay": this is never
  // written to the database, the owner's device is the only source of
  // truth and the server just validates ownership and relays it.
  React.useEffect(() => {
    if (!isAudioRoom || !isOwner || !roomId || roomEndedRef.current) {
      return undefined;
    }
    const timer = setTimeout(() => {
      emitSeatUpdate(roomId, seatRows, seatNotes);
    }, 300);
    return () => clearTimeout(timer);
  }, [isAudioRoom, isOwner, roomId, seatRows, seatNotes]);

  // Backgrounding the whole app (home button) does NOT unmount this screen
  // — React Navigation only unmounts on an actual back/navigate-away, which
  // is the only place the "still live" notification used to fire. So
  // putting the app in the background while still on this screen showed no
  // notification at all, and once the OS eventually suspended the socket
  // connection the backend's own auto-release (server.js) would quietly
  // end the room with no warning shown here. This mirrors that same
  // notification for the background/inactive transition too, without
  // touching the socket — leaveAudioRoom() is intentionally NOT called
  // here, since simply backgrounding the app should keep the room (and this
  // device's participation in it) alive for as long as the OS allows.
  React.useEffect(() => {
    // Same reasoning as everywhere else — the "still live" notification is
    // an owner-only concept. A viewer backgrounding the app just keeps
    // silently listening for as long as the OS allows, same as before, just
    // without a notification implying they own the room.
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
    if (!text) {
      return;
    }
    setMessages(current => [
      ...current,
      { id: `local-${Date.now()}`, type: 'message', author: 'You', text }
    ]);
    setDraft('');
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
  const identityAvatarBackground = myFrameUri ? 'transparent' : theme.colors.teal50;
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
                    value={session?.user?.profileImage || `${AVATAR_PLACEHOLDER}?seed=${ownerAvatarSeed}`}
                    fullName={ownerName}
                    size={ownerCircleSize}
                  />
                </View>
                {myFrameUri ? (
                  <Image
                    source={{ uri: myFrameUri }}
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
                      backgroundColor: isMicMuted ? theme.colors.giftAccent : theme.colors.teal700,
                      borderColor: theme.surfaces.card
                    }
                  ]}
                >
                  <MicIcon size={Math.round(ownerMicBadgeSize * 0.6)} muted={isMicMuted} color={theme.cta.primary.text} />
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={[styles.roomName, { color: theme.text.primary }]} numberOfLines={1}>
                  {roomName}
                </Text>
                {ownerDisplayId ? (
                  <Text style={[styles.roomIdText, { color: theme.text.secondary }]} numberOfLines={1}>
                    Your ID: {ownerDisplayId}
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
                    draggable={seat.id === mySeatId}
                    note={seatNotes[seat.id]}
                    onAvatarPress={handleSeatAvatarPress}
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
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChatMessage message={item} theme={theme} />}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            style={styles.chatMask}
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
          setIsSpeakerMuted(current => !current);
          setMoreMenuVisible(false);
        }}
        showSeatLayoutOption={isAudioRoom && isOwner}
        onOpenSeatLayout={() => {
          setMoreMenuVisible(false);
          setSeatLayoutModalVisible(true);
        }}
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
