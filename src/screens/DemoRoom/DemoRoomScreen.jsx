import React from 'react';
import { FlatList, ImageBackground, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { roomBackgroundImage } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, SEAT_LAYOUT_OPTIONS } from '../../components';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

// A full visual clone of RoomScreen's layout — header identity panel, seat
// grid, chat, bottom composer — shown when a stakeholder-demo card
// (DEMO_LIVE_ROOMS / DEMO_TRENDING_PARTIES, see LiveTabContent /
// PartyTabContent) is tapped. Deliberately a SEPARATE screen rather than
// reusing RoomScreen directly: those fake room ids don't exist on the
// backend, so routing them through the real RoomScreen's join/socket flow
// got stuck on "Loading room..." with no seats. This copies RoomScreen's
// JSX/styles/icons instead (some duplication, kept intentionally in sync)
// so the preview looks identical, while chat/mic/seats here are all local
// state only — nothing on this screen talks to the network, and the real
// RoomScreen is completely untouched.

function MicIcon({ size = 12, color, muted = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-7 0V12a3.5 3.5 0 0 0 3.5 3.5Z" stroke={color} strokeWidth="1.8" />
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
// Same pyramid row sizes real rooms are created with (SEAT_LAYOUT_OPTIONS,
// from the "start a room" seat-layout picker) — front row smallest,
// growing row by row. The largest preset gives the fullest-looking preview.
const SEAT_GROUPS = SEAT_LAYOUT_OPTIONS[SEAT_LAYOUT_OPTIONS.length - 1].groups;

// The owner has a fixed spot in the header identity panel, same as the
// real room — they never occupy a numbered seat, so every seat starts
// open for the viewer (this device) to take.
function buildDemoSeatRows() {
  let seatIndex = 0;
  return SEAT_GROUPS.map((count, rowIndex) =>
    Array.from({ length: count }, () => {
      seatIndex += 1;
      return { id: `row${rowIndex}-seat${seatIndex}`, name: null, occupied: false };
    })
  );
}

function Seat({ seat, theme, columnStyle, circleSize = scaleModerate(56), onEmptySeatPress, pressEnabled }) {
  const avatarInnerSize = circleSize - 4;
  const ringSize = circleSize + 4;
  const micBadgeSize = Math.max(scaleModerate(16), Math.round(circleSize * 0.36));

  if (!seat.occupied) {
    return (
      <Pressable style={[styles.seatColumn, columnStyle]} disabled={!pressEnabled} onPress={() => onEmptySeatPress?.(seat.id)}>
        <View style={[styles.seatCircle, styles.seatCircleEmpty, {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderColor: theme.colors.teal700,
          backgroundColor: theme.surfaces.card
        }]}>
          <PlusIcon size={Math.round(circleSize * 0.36)} color={theme.colors.teal700} />
        </View>
        <Text style={[styles.seatLabel, { color: theme.text.secondary }]} numberOfLines={1}>Take seat</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.seatColumn, columnStyle]}>
      <View style={[styles.seatAvatarWrap, { width: circleSize, height: circleSize }]}>
        {seat.isMe ? (
          <View style={[styles.speakingRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: theme.colors.teal700 }]} />
        ) : null}
        <View style={[styles.seatAvatarInner, { width: avatarInnerSize, height: avatarInnerSize, borderRadius: avatarInnerSize / 2, backgroundColor: theme.surfaces.card }]}>
          <Avatar value={seat.avatarUri || `${AVATAR_PLACEHOLDER}?seed=${seat.name}`} fullName={seat.name} size={avatarInnerSize} />
        </View>
        <View style={[styles.micBadge, {
          width: micBadgeSize,
          height: micBadgeSize,
          borderRadius: micBadgeSize / 2,
          borderColor: theme.surfaces.card
        }, seat.muted ? { backgroundColor: theme.colors.giftAccent } : { backgroundColor: theme.colors.teal700 }]}>
          <MicIcon size={Math.round(micBadgeSize * 0.55)} muted={seat.muted} color={theme.cta.primary.text} />
        </View>
      </View>
      <View style={styles.nameRow}>
        {seat.isMe ? <StarIcon color={theme.colors.teal700} /> : null}
        <Text style={[styles.seatNameText, { color: theme.text.primary }]} numberOfLines={1}>{seat.name}</Text>
      </View>
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
  return (
    <View style={styles.chatBubble}>
      <Text style={[styles.chatAuthor, { color: theme.colors.teal700 }]}>{message.author}: </Text>
      <Text style={[styles.chatBody, { color: theme.text.primary }]}>{message.text}</Text>
    </View>
  );
}

export function DemoRoomScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { title, hostName, hostAvatar, members } = route.params ?? {};
  const roomName = title || 'Room';
  const session = useAppStore(state => state.session);
  const myName = session?.user?.fullName || 'You';
  const myAvatar = session?.user?.profileImage;

  const [seatRows, setSeatRows] = React.useState(buildDemoSeatRows);
  // Same formula RoomScreen uses for a real 25-seat room — shrinks the
  // circle to whatever fits the widest row (5 seats) within the screen
  // width, instead of a fixed size that either overflows or wraps rows.
  const seatSizing = React.useMemo(() => {
    const maxRowSeats = Math.max(...seatRows.map(row => row.length));
    const gap = scaleModerate(10);
    const horizontalPadding = scaleModerate(20) * 2;
    const fitWidth = (windowWidth - horizontalPadding - gap * (maxRowSeats - 1)) / maxRowSeats;
    const columnWidth = Math.max(scaleModerate(44), Math.min(scaleModerate(68), fitWidth));
    return { columnWidth, circleSize: Math.round(columnWidth * 0.82) };
  }, [seatRows, windowWidth]);
  const [mySeatId, setMySeatId] = React.useState(null);
  const [isMicMuted, setIsMicMuted] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState(() => [
    { id: 'welcome', type: 'system', text: `Welcome to ${roomName}! Please be respectful to others.` }
  ]);
  const occupiedSeatCount = seatRows.flat().filter(seat => seat.occupied).length;
  const viewerCount = (members ?? 0) + occupiedSeatCount;

  // Mirrors RoomScreen's handleEmptySeatPress/handleTakeSeat, purely
  // locally — tapping any open seat sits the signed-in user there with
  // their own name/avatar, same as a real viewer taking a seat.
  const handleTakeSeat = seatId => {
    if (mySeatId) {
      return;
    }
    setMySeatId(seatId);
    setSeatRows(current => current.map(row => row.map(seat => (seat.id === seatId
      ? { ...seat, occupied: true, name: myName, avatarUri: myAvatar, muted: isMicMuted, isMe: true }
      : seat))));
  };

  const handleToggleMic = () => {
    setIsMicMuted(current => {
      const next = !current;
      if (mySeatId) {
        setSeatRows(rows => rows.map(row => row.map(seat => (seat.id === mySeatId ? { ...seat, muted: next } : seat))));
      }
      return next;
    });
  };

  const handleSend = () => {
    const text = draft.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
    if (!text) {
      return;
    }
    setMessages(current => [...current, { id: `local-${Date.now()}`, type: 'message', author: 'You', text }]);
    setDraft('');
  };

  return (
    <ImageBackground source={roomBackgroundImage} resizeMode="cover" style={[styles.root, { backgroundColor: theme.surfaces.card }]} imageStyle={styles.backgroundImage}>
      <View style={[styles.foreground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.identityCenterWrap} pointerEvents="box-none">
            <View style={styles.identityPanel}>
              <View style={styles.identityAvatarOuter}>
                <View style={[styles.identityAvatarWrap, { backgroundColor: theme.colors.teal50 }]}>
                  <Avatar value={hostAvatar || `${AVATAR_PLACEHOLDER}?seed=${hostName}`} fullName={hostName} size={34} />
                </View>
                <View style={[styles.identityMicBadge, { backgroundColor: theme.colors.teal700, borderColor: theme.surfaces.card }]}>
                  <MicIcon size={9} color={theme.cta.primary.text} />
                </View>
              </View>
              <View style={styles.identityText}>
                <Text style={[styles.roomName, { color: theme.text.primary }]} numberOfLines={1}>{roomName}</Text>
                <Text style={[styles.roomIdText, { color: theme.text.secondary }]} numberOfLines={1}>Preview — demo data</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.viewersPanel}>
              <View style={[styles.liveDot, { backgroundColor: theme.colors.liveBadge }]} />
              <Text style={[styles.viewersCount, { color: theme.colors.teal700 }]}>{viewerCount}</Text>
            </View>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
              <CloseIcon color={theme.text.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.seatRows}>
          {seatRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.seatRow}>
              {row.map(seat => <Seat key={seat.id} seat={seat} theme={theme} columnStyle={{ width: seatSizing.columnWidth }} circleSize={seatSizing.circleSize} onEmptySeatPress={handleTakeSeat} pressEnabled={!mySeatId} />)}
            </View>
          ))}
        </View>

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
            <Pressable style={styles.iconButton}>
              <MoodIcon color={theme.text.primary} />
            </Pressable>
            <Pressable onPress={handleToggleMic} style={[styles.iconButton, isMicMuted && { backgroundColor: theme.colors.giftAccent }]}>
              <MicIcon size={18} muted={isMicMuted} color={isMicMuted ? theme.cta.primary.text : theme.text.primary} />
            </Pressable>
            <Pressable style={[styles.iconButton, { backgroundColor: theme.colors.teal700 }]}>
              <GiftIcon color={theme.cta.primary.text} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MoreIcon color={theme.text.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: { resizeMode: 'cover', opacity: 0.35 },
  foreground: { flex: 1 },
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
  identityAvatarOuter: { width: scaleModerate(34), height: scaleModerate(34) },
  identityAvatarWrap: { width: scaleModerate(34), height: scaleModerate(34), borderRadius: scaleModerate(17), overflow: 'hidden' },
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
  identityText: { flexShrink: 1 },
  roomName: { fontSize: scaleFont(13), fontWeight: '700' },
  roomIdText: { fontSize: scaleFont(10), fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: scaleModerate(8) },
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
  liveDot: { width: scaleModerate(8), height: scaleModerate(8), borderRadius: scaleModerate(4) },
  viewersCount: { fontSize: scaleFont(11), fontWeight: '700' },
  seatRows: { paddingHorizontal: scaleModerate(20), marginTop: scaleModerate(18), gap: scaleModerate(5) },
  seatRow: { flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', gap: scaleModerate(8) },
  seatColumn: { alignItems: 'center' },
  seatCircle: {
    width: scaleModerate(56),
    height: scaleModerate(56),
    borderRadius: scaleModerate(28),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  seatCircleEmpty: { borderStyle: 'dashed', opacity: 0.9 },
  seatLabel: { fontSize: scaleFont(10), fontWeight: '600', marginTop: scaleModerate(4) },
  seatAvatarWrap: { width: scaleModerate(56), height: scaleModerate(56), alignItems: 'center', justifyContent: 'center' },
  speakingRing: { position: 'absolute', width: scaleModerate(60), height: scaleModerate(60), borderRadius: scaleModerate(30), borderWidth: 2 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: scaleModerate(2), marginTop: scaleModerate(5), maxWidth: '100%' },
  seatNameText: { fontSize: scaleFont(11), fontWeight: '600' },
  chatArea: { flex: 1, marginTop: scaleModerate(16), paddingHorizontal: scaleModerate(16), paddingBottom: scaleModerate(8) },
  chatMask: { flex: 1 },
  chatListContent: { gap: scaleModerate(8), flexGrow: 1, justifyContent: 'flex-end' },
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
  chatSystemLabel: { fontSize: scaleFont(12), fontWeight: '700' },
  chatAuthor: { fontSize: scaleFont(13), fontWeight: '700' },
  chatBody: { fontSize: scaleFont(13), flexShrink: 1 },
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
  textInput: { flex: 1, fontSize: scaleFont(13) },
  bottomActions: { flexDirection: 'row', alignItems: 'center', gap: scaleModerate(8) }
});

export default DemoRoomScreen;
