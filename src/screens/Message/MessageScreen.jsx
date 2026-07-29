import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SearchIcon, TrophyIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

// System/world-wide rows sit above the per-person conversation list — both
// app-wide broadcasts, not tied to any one user. No backend for messaging
// exists yet, so everything below (these two rows and RECENT_CHATS) is
// placeholder content, styled to the approved design, until a real chat
// API is wired up.
const SYSTEM_NOTIFICATION = {
  time: '10:42 AM',
  preview: 'Welcome to Streamline! Check out the new banner carousel.',
  unread: true
};
const WORLD_CHAT = {
  time: 'Just now',
  senderName: 'Alex',
  preview: 'Anyone for a quick match?',
  unreadCount: 12
};
const RECENT_CHATS = [
  { id: 'chat-1', name: 'Sarah Jenkins', avatar: undefined, time: '2m', preview: "Yeah, I'll be online in about 10 min", unreadCount: 2, online: true },
  { id: 'chat-2', name: 'Team Alpha LFG', avatar: undefined, time: '1h', preview: 'ggs everyone, we played well today.', unreadCount: 0, online: false },
  { id: 'chat-3', name: 'Elena R.', avatar: undefined, time: 'Yesterday', preview: 'Did you see the new update notes?', unreadCount: 0, online: true }
];

function HeaderBar() {
  const theme = useTheme();
  return <View style={styles.headerBar}>
      <SearchIcon size={22} color={theme.text.secondary} />
      <Text style={[styles.headerTitle, { color: theme.colors.teal700 }]}>Messages</Text>
      <TrophyIcon size={22} color={theme.text.secondary} />
    </View>;
}

function BroadcastRow({ emoji, iconBackground, title, time, children, unreadDot, unreadCount }) {
  const theme = useTheme();
  return <Pressable style={[styles.broadcastRow, {
      backgroundColor: theme.surfaces.card,
      borderColor: theme.colors.cardBorder
    }]}>
      <View style={[styles.broadcastIcon, { backgroundColor: iconBackground }]}>
        <Text style={styles.broadcastEmoji}>{emoji}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.rowTime, { color: theme.text.mutedIcon }]}>{time}</Text>
        </View>
        <Text style={[styles.rowPreview, { color: theme.text.secondary }]} numberOfLines={1}>{children}</Text>
      </View>
      {unreadDot ? <View style={[styles.unreadDot, { backgroundColor: theme.colors.liveBadge }]} /> : null}
      {unreadCount ? <View style={[styles.unreadBadge, { backgroundColor: theme.colors.liveBadge }]}>
          <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View> : null}
    </Pressable>;
}

function ChatRow({ chat }) {
  const theme = useTheme();
  return <Pressable style={styles.chatRow}>
      <View style={styles.chatAvatarWrap}>
        <Avatar value={chat.avatar} fullName={chat.name} size={scaleModerate(46)} />
        {chat.online ? <View style={[styles.onlineDot, { backgroundColor: theme.colors.teal400, borderColor: theme.surfaces.page }]} /> : null}
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{chat.name}</Text>
          <Text style={[styles.rowTime, { color: theme.text.mutedIcon }]}>{chat.time}</Text>
        </View>
        <Text style={[styles.rowPreview, { color: theme.text.secondary }]} numberOfLines={1}>{chat.preview}</Text>
      </View>
      {chat.unreadCount ? <View style={[styles.unreadBadge, { backgroundColor: theme.colors.liveBadge }]}>
          <Text style={styles.unreadBadgeText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
        </View> : null}
    </Pressable>;
}

export function MessageScreen() {
  const theme = useTheme();
  return <Screen>
      <HeaderBar />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BroadcastRow emoji="📣" iconBackground={theme.colors.vipGoldBackground} title="System Notifications" time={SYSTEM_NOTIFICATION.time} unreadDot={SYSTEM_NOTIFICATION.unread}>
          {SYSTEM_NOTIFICATION.preview}
        </BroadcastRow>
        <BroadcastRow emoji="🌐" iconBackground={theme.colors.proGamerBackground} title="World Chat" time={WORLD_CHAT.time} unreadCount={WORLD_CHAT.unreadCount}>
          <Text style={[styles.senderName, { color: theme.colors.teal700 }]}>{WORLD_CHAT.senderName}: </Text>
          {WORLD_CHAT.preview}
        </BroadcastRow>

        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Recent</Text>
        <View style={[styles.recentCard, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          {RECENT_CHATS.map((chat, index) => <View key={chat.id}>
              <ChatRow chat={chat} />
              {index < RECENT_CHATS.length - 1 ? <View style={[styles.rowDivider, { backgroundColor: theme.colors.cardBorder }]} /> : null}
            </View>)}
        </View>
      </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  scrollContent: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(8),
    paddingBottom: scaleModerate(28),
    gap: scaleModerate(10)
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12)
  },
  broadcastIcon: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  broadcastEmoji: {
    fontSize: scaleFont(20)
  },
  sectionLabel: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(11),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingLeft: scaleModerate(4)
  },
  recentCard: {
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(12)
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(12)
  },
  chatAvatarWrap: {
    position: 'relative'
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleModerate(11),
    height: scaleModerate(11),
    borderRadius: scaleModerate(6),
    borderWidth: 2
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth
  },
  rowBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleModerate(8)
  },
  rowName: {
    flex: 1,
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowTime: {
    fontSize: scaleFont(11)
  },
  rowPreview: {
    fontSize: scaleFont(12.5)
  },
  senderName: {
    fontWeight: '700'
  },
  unreadDot: {
    width: scaleModerate(9),
    height: scaleModerate(9),
    borderRadius: scaleModerate(5)
  },
  unreadBadge: {
    minWidth: scaleModerate(20),
    height: scaleModerate(20),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(5)
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '800'
  }
});

export default MessageScreen;
