import React from 'react';
import {
  Alert,
  Animated,
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
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import { LockIcon, UserIcon, roomBackgroundImage } from '../../assets';
import { upsertAudioRoom } from '../../api';
import { getSessionSocket, joinAudioRoom, leaveAudioRoom } from '../../services/socket';
import { useAppStore } from '../../store';
import { dismissLiveRoomNotification, scaleFont, scaleModerate, showLiveRoomNotification } from '../../utils';
import { clearCachedSeatState, getCachedSeatState, setCachedSeatState } from './roomSeatCache';

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

function AvatarWithFallback({ uri, size, theme, style }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <View style={[style, styles.avatarFallback, { width: size, height: size }]}>
        <UserIcon size={Math.round(size * 0.5)} color={theme.text.mutedIcon} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[style, { width: size, height: size }]} onError={() => setFailed(true)} />;
}

function Seat({ seat, theme, columnStyle, circleSize = scaleModerate(56), onEmptySeatPress, pressEnabled, draggable, note }) {
  const avatarInnerSize = circleSize - 4;
  const ringSize = circleSize + 4;
  const micBadgeSize = Math.max(scaleModerate(16), Math.round(circleSize * 0.36));

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

  return (
    <SeatWrapper {...wrapperProps}>
      <View style={[styles.seatAvatarWrap, { width: circleSize, height: circleSize }]}>
        {seat.host ? (
          <View
            style={[
              styles.speakingRing,
              { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: theme.colors.teal700 }
            ]}
          />
        ) : null}
        {seat.speaking && !seat.host ? (
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
            { width: avatarInnerSize, height: avatarInnerSize, borderRadius: avatarInnerSize / 2, backgroundColor: theme.surfaces.card }
          ]}
        >
          <AvatarWithFallback uri={`${AVATAR_PLACEHOLDER}?seed=${seat.avatarSeed}`} size={avatarInnerSize} theme={theme} />
        </View>
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
      </View>
      <View style={styles.nameRow}>
        {seat.host ? <StarIcon color={theme.colors.teal700} /> : null}
        <Text style={[styles.seatNameText, { color: theme.text.primary }]} numberOfLines={1}>
          {seat.name}
        </Text>
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
  // Backend enforces a globally-unique roomId (max 80 chars) across every
  // user's rooms — a plain 6-digit random number collides often enough in
  // practice to matter (~900k possible values), so derive it from the
  // owner's publicId plus the current time instead.
  const generatedRoomId = React.useMemo(() => {
    const ownerPart = (ownerAvatarSeed || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'guest';
    return `${ownerPart}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`.toUpperCase();
  }, [ownerAvatarSeed]);
  const roomId = route.params?.roomId ?? generatedRoomId;
  const roomName = route.params?.roomName ?? `${ownerName}'s Room`;
  const mode = route.params?.mode ?? 'video';
  const seatGroups = route.params?.seatGroups;
  // Rehydrate seat occupancy/notes if we're returning to a room that was
  // only backgrounded (not ended) — see src/screens/Room/roomSeatCache.js.
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
  // The room creator (the person who opened this screen) always keeps mic
  // access via their fixed header spot. Anyone else only gets the bottom-bar
  // mic control once they've actually taken a seat.
  const isOwner = true;
  const hasMicAccess = mode !== 'audio' || isOwner || mySeatId !== null;
  const [isMicMuted, setIsMicMuted] = React.useState(false);

  const handleToggleMic = () => {
    setIsMicMuted(current => {
      const next = !current;
      if (mySeatId) {
        setSeatRows(rows =>
          rows.map(row => row.map(seat => (seat.id === mySeatId ? { ...seat, muted: next } : seat)))
        );
      }
      return next;
    });
  };

  const handleTakeSeat = seatId => {
    if (mySeatId) {
      return;
    }
    setSeatRows(current =>
      current.map(row =>
        row.map(seat =>
          seat.id === seatId
            ? { ...seat, occupied: true, name: ownerName, avatarSeed: ownerAvatarSeed, muted: isMicMuted }
            : seat
        )
      )
    );
    setMySeatId(seatId);
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

  const closeNoteModal = () => setNoteModal({ visible: false, seatId: null, value: '' });

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
  const occupiedSeatCount = seatRows ? seatRows.flat().filter(seat => seat.occupied).length : 0;
  const viewerCount = occupiedSeatCount + 1;
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const hasWelcomedRef = React.useRef(false);

  // See StreamLine-Portal/docs/mobile-audio-room-api.md — a real room record
  // is created/updated on the backend for every audio room, and the room
  // channel is joined on the same authenticated socket used for session
  // enforcement (src/services/socket.js) to react instantly to admin
  // moderation (blocked/terminated/deleted rooms, joining disabled).
  const isAudioRoom = mode === 'audio' && Boolean(seatRows);
  const [joiningDisabled, setJoiningDisabled] = React.useState(false);
  const [isRoomBlocked, setIsRoomBlocked] = React.useState(false);
  const startedAtRef = React.useRef(null);
  const roomEndedRef = React.useRef(false);
  // Always read the latest count from this ref (not the `viewerCount`
  // closed over when the effect first ran) so a room ended via unmount/back
  // gesture reports the real count at that moment, not whatever it was when
  // the room was created.
  const viewerCountRef = React.useRef(viewerCount);
  const canTakeSeat = !isOwner && !mySeatId && !joiningDisabled;

  React.useEffect(() => {
    viewerCountRef.current = viewerCount;
  }, [viewerCount]);

  React.useEffect(() => {
    if (!isAudioRoom) {
      return;
    }
    setCachedSeatState(roomId, { seatRows, mySeatId, seatNotes });
  }, [isAudioRoom, roomId, seatRows, mySeatId, seatNotes]);

  const endAudioRoom = React.useCallback(() => {
    if (!isAudioRoom || roomEndedRef.current || !session?.token) {
      return;
    }
    roomEndedRef.current = true;
    leaveAudioRoom(roomId);
    clearCachedSeatState(roomId);
    upsertAudioRoom(session.token, {
      roomId,
      title: roomName,
      status: 'ENDED',
      participantCount: viewerCountRef.current,
      startedAt: startedAtRef.current ?? new Date().toISOString(),
      endedAt: new Date().toISOString()
    }).catch(() => {});
  }, [isAudioRoom, roomId, roomName, session?.token]);

  // Leaving the room screen (back gesture or the header close button) no
  // longer ends the room — it keeps running on the backend, and a
  // persistent notification lets the owner tap back in. Only the explicit
  // "End Room" long-press (below) actually ends it.
  const backgroundLiveRoom = React.useCallback(() => {
    if (!isAudioRoom || roomEndedRef.current) {
      return;
    }
    leaveAudioRoom(roomId);
    showLiveRoomNotification({ roomId, roomName, mode, seatGroups }).catch(() => {});
  }, [isAudioRoom, roomId, roomName, mode, seatGroups]);

  // Tapping the close button always asks first — "Yes" ends the room for
  // everyone, "No" just dismisses the popup and stays in the room. Video
  // mode has no room to end, so it closes immediately without asking.
  const handleClosePress = () => {
    if (!isAudioRoom) {
      navigation.goBack();
      return;
    }
    Alert.alert('End Room', 'Do you want to end this room?', [
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

    // Join attempts only count as "blocked" when the server itself answers
    // with success:false — a socket that hasn't connected yet is a timing
    // issue, not a moderation action, so it gets retried instead of
    // immediately showing the "removed by an administrator" alert.
    const attemptJoin = retriesLeft => {
      if (cancelled) {
        return;
      }
      const socket = getSessionSocket();
      if (!socket || !socket.connected) {
        if (retriesLeft > 0) {
          retryTimer = setTimeout(() => attemptJoin(retriesLeft - 1), 800);
        }
        return;
      }
      joinAudioRoom(roomId, result => {
        if (!cancelled && result && result.success === false) {
          setIsRoomBlocked(true);
        }
      });
    };

    const setup = async () => {
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;

      try {
        await upsertAudioRoom(session.token, {
          roomId,
          title: roomName,
          status: 'LIVE',
          participantCount: viewerCountRef.current,
          startedAt
        });
      } catch {
        // Best-effort — still attempt to join even if the create/update
        // call failed, in case the room record already exists server-side.
      }

      if (!cancelled) {
        attemptJoin(5);
      }
    };

    setup();

    const socket = getSessionSocket();
    const handleJoiningDisabled = () => setJoiningDisabled(true);
    const handleBlocked = () => setIsRoomBlocked(true);
    const handleTerminated = () => setIsRoomBlocked(true);
    const handleDeleted = () => setIsRoomBlocked(true);

    socket?.on('audio-room:joining-disabled', handleJoiningDisabled);
    socket?.on('audio-room:blocked', handleBlocked);
    socket?.on('audio-room:terminated', handleTerminated);
    socket?.on('audio-room:deleted', handleDeleted);

    return () => {
      cancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      socket?.off('audio-room:joining-disabled', handleJoiningDisabled);
      socket?.off('audio-room:blocked', handleBlocked);
      socket?.off('audio-room:terminated', handleTerminated);
      socket?.off('audio-room:deleted', handleDeleted);
      backgroundLiveRoom();
    };
    // Only run once per room visit — roomId/roomName/session are stable for
    // the screen's lifetime, and re-running this on every viewerCount change
    // would re-create/rejoin the room instead of just syncing the count
    // (handled by the separate effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioRoom]);

  const isFirstParticipantSyncRef = React.useRef(true);

  React.useEffect(() => {
    if (!isAudioRoom || !session?.token) {
      return;
    }
    if (isFirstParticipantSyncRef.current) {
      isFirstParticipantSyncRef.current = false;
      return;
    }
    upsertAudioRoom(session.token, {
      roomId,
      title: roomName,
      status: 'LIVE',
      participantCount: viewerCount,
      startedAt: startedAtRef.current ?? new Date().toISOString()
    }).catch(() => {});
  }, [viewerCount, isAudioRoom, roomId, roomName, session?.token]);

  React.useEffect(() => {
    if (isRoomBlocked) {
      Alert.alert('Room unavailable', 'This room was blocked, ended, or removed by an administrator.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [isRoomBlocked, navigation]);

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

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
      return () => {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor(theme.surfaces.page);
      };
    }, [theme])
  );

  return (
    <ImageBackground
      source={roomBackgroundImage}
      resizeMode="cover"
      style={[styles.root, { backgroundColor: theme.surfaces.card }]}
      imageStyle={styles.backgroundImage}
    >
      <View style={[styles.backgroundScrim, { backgroundColor: theme.surfaces.card }]} pointerEvents="none" />

      <View style={[styles.foreground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.identityCenterWrap} pointerEvents="box-none">
            <View style={styles.identityPanel}>
              <View style={styles.identityAvatarOuter}>
                <View style={[styles.identityAvatarWrap, { backgroundColor: theme.colors.teal50 }]}>
                  <AvatarWithFallback
                    uri={session?.user?.profileImage || `${AVATAR_PLACEHOLDER}?seed=${ownerAvatarSeed}`}
                    size={34}
                    theme={theme}
                  />
                </View>
                <View
                  style={[
                    styles.identityMicBadge,
                    { backgroundColor: isMicMuted ? theme.colors.giftAccent : theme.colors.teal700, borderColor: theme.surfaces.card }
                  ]}
                >
                  <MicIcon size={9} muted={isMicMuted} color={theme.cta.primary.text} />
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={[styles.roomName, { color: theme.text.primary }]} numberOfLines={1}>
                  {roomName}
                </Text>
                <View style={styles.roomIdRow}>
                  <Text style={[styles.roomIdText, { color: theme.text.secondary }]} numberOfLines={1}>
                    ID: {roomId}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
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
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.chatArea}>
          <MaskedView maskElement={<LinearGradient colors={['transparent', 'black']} locations={[0, 0.18]} style={StyleSheet.absoluteFill} />} style={styles.chatMask}>
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ChatMessage message={item} theme={theme} />}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
            />
          </MaskedView>
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
            <Pressable style={styles.iconButton}>
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
            <Pressable style={[styles.iconButton, { backgroundColor: theme.colors.teal700 }]}>
              <GiftIcon color={theme.cta.primary.text} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MoreIcon color={theme.text.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <SeatNoteModal
        visible={noteModal.visible}
        value={noteModal.value}
        onChangeText={text => setNoteModal(current => ({ ...current, value: text }))}
        onCancel={closeNoteModal}
        onSave={handleSaveNote}
        theme={theme}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.35
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.88
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  foreground: {
    flex: 1
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)'
  },
  identityAvatarOuter: {
    width: scaleModerate(34),
    height: scaleModerate(34)
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
  roomIdRow: {
    marginTop: scaleModerate(2)
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)'
  },
  viewersPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(6),
    gap: scaleModerate(6),
    backgroundColor: 'rgba(255, 255, 255, 0.65)'
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
    marginTop: scaleModerate(18),
    gap: scaleModerate(5)
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(2),
    marginTop: scaleModerate(5),
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)'
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
    backgroundColor: 'rgba(255, 255, 255, 0.65)'
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
