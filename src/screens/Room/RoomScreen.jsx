import React from 'react';
import { FlatList, Image, ImageBackground, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import { LockIcon, UserIcon, roomBackgroundImage } from '../../assets';
import { scaleFont, scaleModerate } from '../../utils';

function MicIcon({ size = 12, color = '#FFFFFF', muted = false }) {
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

function CampaignIcon({ size = 16, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M14 8.5a4 4 0 0 1 0 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M17 6a7.5 7.5 0 0 1 0 12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
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

const SEATS = [
  { id: 'host', name: 'Host_Alex', host: true, muted: false, occupied: true, avatarSeed: 'Alex' },
  { id: 'seat2', name: 'Sarah_G', host: false, muted: true, occupied: true, avatarSeed: 'Sarah' },
  { id: 'seat3', name: 'ProGamer99', host: false, muted: false, occupied: true, avatarSeed: 'Pro', speaking: true },
  { id: 'seat4', name: null, occupied: false },
  { id: 'seat5', name: 'Luna_T', host: false, muted: true, occupied: true, avatarSeed: 'Luna' },
  { id: 'seat6', name: null, occupied: false },
  { id: 'seat7', name: null, occupied: false, locked: true },
  { id: 'seat8', name: null, occupied: false, locked: true }
];

const CHAT_MESSAGES = [
  { id: 'm1', type: 'system', text: 'Welcome to Nexus Lounge! Please be respectful to others.' },
  {
    id: 'm2',
    type: 'message',
    author: 'ProGamer99',
    badge: { label: 'Lv.12', icon: 'diamond', tone: 'primary' },
    text: 'Hey everyone! Anyone up for a match after this? 🎮'
  },
  {
    id: 'm3',
    type: 'message',
    author: 'Host_Alex',
    badge: { label: 'Mod', icon: 'shield', tone: 'secondary' },
    text: "Yeah, I'm down. Let's gather a squad of 4 first."
  },
  { id: 'm4', type: 'gift', author: 'Luna_T', text: 'sent a Treasure Chest!' }
];

function AvatarWithFallback({ uri, size, theme, style }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <View style={[style, { width: size, height: size, alignItems: 'center', justifyContent: 'center' }]}>
        <UserIcon size={Math.round(size * 0.5)} color={theme.text.mutedIcon} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[style, { width: size, height: size }]} onError={() => setFailed(true)} />;
}

function Seat({ seat, theme }) {
  if (!seat.occupied) {
    if (seat.locked) {
      return (
        <View style={styles.seatColumn}>
          <View style={[styles.seatCircle, styles.seatCircleLocked, { borderColor: theme.colors.cardBorder, backgroundColor: theme.surfaces.card, opacity: 0.9 }]}>
            <LockIcon size={18} color={theme.text.mutedIcon} />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.seatColumn}>
        <View style={[styles.seatCircle, styles.seatCircleEmpty, { borderColor: theme.colors.teal700, backgroundColor: theme.surfaces.card, opacity: 0.9 }]}>
          <PlusIcon color={theme.colors.teal700} />
        </View>
        <Text style={[styles.seatLabel, { color: theme.text.secondary }]}>Take seat</Text>
      </View>
    );
  }

  return (
    <View style={styles.seatColumn}>
      <View style={styles.seatAvatarWrap}>
        {seat.host ? <View style={[styles.speakingRing, { borderColor: theme.colors.teal700 }]} /> : null}
        {seat.speaking && !seat.host ? (
          <View style={[styles.speakingRingSoft, { borderColor: theme.colors.teal400 }]} />
        ) : null}
        <View style={[styles.seatAvatarInner, { backgroundColor: theme.surfaces.card }]}>
          <AvatarWithFallback uri={`${AVATAR_PLACEHOLDER}?seed=${seat.avatarSeed}`} size={52} theme={theme} />
        </View>
        <View
          style={[
            styles.micBadge,
            { borderColor: theme.surfaces.card },
            seat.muted ? { backgroundColor: theme.colors.giftAccent } : { backgroundColor: theme.colors.teal700 }
          ]}
        >
          <MicIcon size={11} muted={seat.muted} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.nameRow}>
        {seat.host ? <StarIcon color={theme.colors.teal700} /> : null}
        <Text style={[styles.seatNameText, { color: theme.text.primary }]} numberOfLines={1}>
          {seat.name}
        </Text>
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
          {message.badge.icon === 'diamond' ? <DiamondIcon color="#FFFFFF" /> : <ShieldIcon color="#FFFFFF" />}
          <Text style={styles.chatMessageBadgeText}>{message.badge.label}</Text>
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
  const roomId = route.params?.roomId;
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState(CHAT_MESSAGES);

  const handleSend = () => {
    const text = draft.trim();
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
      <View style={[styles.backgroundScrim, { backgroundColor: theme.surfaces.card, opacity: 0.88 }]} pointerEvents="none" />

      <View style={[styles.foreground, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.identityPanel}>
            <View style={[styles.identityAvatarWrap, { backgroundColor: theme.colors.teal50 }]}>
              <AvatarWithFallback uri={`${AVATAR_PLACEHOLDER}?seed=RoomOwner`} size={34} theme={theme} />
            </View>
            <View style={styles.identityText}>
              <Text style={[styles.roomName, { color: theme.text.primary }]} numberOfLines={1}>
                Nexus Lounge
              </Text>
              <View style={styles.roomIdRow}>
                <Text style={[styles.roomIdText, { color: theme.text.secondary }]}>ID: {roomId ?? '882910'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.headerIconRow}>
              <Pressable style={styles.iconButton}>
                <CampaignIcon color={theme.text.primary} />
              </Pressable>
              <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
                <CloseIcon color={theme.text.primary} />
              </Pressable>
            </View>
            <View style={styles.viewersPanel}>
              <View style={[styles.liveDot, { backgroundColor: theme.colors.liveBadge }]} />
              <Text style={[styles.viewersCount, { color: theme.colors.teal700 }]}>124</Text>
            </View>
          </View>
        </View>

        <View style={styles.seatGrid}>
          {SEATS.map(seat => (
            <Seat key={seat.id} seat={seat} theme={theme} />
          ))}
        </View>

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
            <Pressable style={styles.iconButton}>
              <MicIcon size={18} color={theme.text.primary} />
            </Pressable>
            <Pressable style={[styles.iconButton, { backgroundColor: theme.colors.teal700 }]}>
              <GiftIcon color="#FFFFFF" />
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
  root: {
    flex: 1
  },
  backgroundImage: {
    resizeMode: 'cover',
    opacity: 0.35
  },
  backgroundScrim: {
    ...StyleSheet.absoluteFillObject
  },
  foreground: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(24),
    gap: scaleModerate(8)
  },
  identityPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingLeft: scaleModerate(4),
    paddingRight: scaleModerate(14),
    paddingVertical: scaleModerate(4),
    gap: scaleModerate(8),
    maxWidth: '58%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)'
  },
  identityAvatarWrap: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17),
    overflow: 'hidden'
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
    alignItems: 'flex-end',
    gap: scaleModerate(8)
  },
  headerIconRow: {
    flexDirection: 'row',
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
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scaleModerate(20),
    marginTop: scaleModerate(28),
    rowGap: scaleModerate(24)
  },
  seatColumn: {
    width: '25%',
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
    borderStyle: 'dashed'
  },
  seatCircleLocked: {
    borderStyle: 'dashed'
  },
  seatLabel: {
    fontSize: scaleFont(10),
    fontWeight: '600',
    marginTop: scaleModerate(10)
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
    gap: scaleModerate(3),
    marginTop: scaleModerate(10),
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
    fontWeight: '700',
    color: '#FFFFFF'
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
  }
});

export default RoomScreen;
