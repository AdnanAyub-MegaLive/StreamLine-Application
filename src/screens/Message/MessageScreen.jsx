import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SearchIcon, UserIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { fetchIncomingFriendRequests } from '../../api';
import { useMessaging, useUserAssets } from '../../hooks';
import { getSessionSocket } from '../../services/socket';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

function HeaderBar({ searchOpen, query, onToggleSearch, onChangeQuery, requestCount, onOpenFriendRequests }) {
  const theme = useTheme();
  if (searchOpen) {
    return <View style={styles.headerBar}>
        <Pressable onPress={() => onToggleSearch(false)} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search messages"
          placeholderTextColor={theme.text.secondary}
          autoFocus
          style={[styles.searchInput, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />
      </View>;
  }
  return <View style={styles.headerBar}>
      <Pressable onPress={() => onToggleSearch(true)} hitSlop={10}>
        <SearchIcon size={22} color={theme.text.secondary} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: theme.colors.teal700 }]}>Messages</Text>
      <Pressable onPress={onOpenFriendRequests} hitSlop={10} style={styles.friendRequestsButton}>
        <UserIcon size={22} color={theme.text.secondary} />
        {requestCount ? <View style={[styles.headerBadge, { backgroundColor: theme.colors.liveBadge }]}>
            <Text style={styles.headerBadgeText}>{requestCount > 9 ? '9+' : requestCount}</Text>
          </View> : null}
      </Pressable>
    </View>;
}

function BroadcastRow({ emoji, iconBackground, title, time, children, unreadDot, unreadCount, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.broadcastRow, {
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

function ChatRow({ chat, onPress }) {
  const theme = useTheme();
  const { frameUri } = useUserAssets({ userId: chat.participantId, frameUrl: chat.frameUrl });
  return <Pressable onPress={onPress} style={styles.chatRow}>
      <View style={styles.chatAvatarWrap}>
        <Avatar value={chat.avatar} fullName={chat.name} size={scaleModerate(46)} frameUri={frameUri} />
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

function EmptyRecent({ hasQuery }) {
  const theme = useTheme();
  return <View style={styles.emptyRecent}>
      <Text style={[styles.emptyRecentText, { color: theme.text.secondary }]}>
        {hasQuery ? 'No matching friends or messages.' : 'No conversations yet.'}
      </Text>
    </View>;
}

export function MessageScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const { systemNotification, worldChat, recentChats } = useMessaging();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [requestCount, setRequestCount] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      if (!sessionToken) {
        return undefined;
      }
      let cancelled = false;
      const reloadRequestCount = () => {
        fetchIncomingFriendRequests(sessionToken).then(requests => {
          if (!cancelled) {
            setRequestCount(requests.length);
          }
        });
      };
      reloadRequestCount();
      const socket = getSessionSocket();
      socket?.on('friend:request', reloadRequestCount);
      return () => {
        cancelled = true;
        socket?.off('friend:request', reloadRequestCount);
      };
    }, [sessionToken])
  );
  const handleToggleSearch = open => {
    setSearchOpen(open);
    if (!open) {
      setQuery('');
    }
  };
  const trimmedQuery = query.trim().toLowerCase();
  const filteredChats = trimmedQuery
    ? recentChats.filter(chat => chat.name.toLowerCase().includes(trimmedQuery) || chat.preview.toLowerCase().includes(trimmedQuery))
    : recentChats;
  const worldChatMatches = !trimmedQuery || worldChat?.name.toLowerCase().includes(trimmedQuery) || worldChat?.preview.toLowerCase().includes(trimmedQuery);
  const openConversation = ({ id, name, avatar, participantId, frameUrl }) => {
    navigation.navigate(routes.conversation, { conversationId: id, name, avatar, participantId, frameUrl });
  };
  return <Screen>
      <HeaderBar
        searchOpen={searchOpen}
        query={query}
        onToggleSearch={handleToggleSearch}
        onChangeQuery={setQuery}
        requestCount={requestCount}
        onOpenFriendRequests={() => navigation.navigate(routes.friendRequests)}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!trimmedQuery && systemNotification ? <BroadcastRow emoji="📣" iconBackground={theme.colors.vipGoldBackground} title="System Notifications" time={systemNotification.time} unreadDot={systemNotification.unread}>
            {systemNotification.preview}
          </BroadcastRow> : null}
        {worldChat && worldChatMatches ? <BroadcastRow emoji="🌐" iconBackground={theme.colors.proGamerBackground} title="World Chat" time={worldChat.time} unreadCount={worldChat.unreadCount} onPress={() => openConversation({ id: worldChat.id, name: worldChat.name, avatar: null })}>
            {worldChat.preview}
          </BroadcastRow> : null}

        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>{trimmedQuery ? 'Results' : 'Recent'}</Text>
        <View style={[styles.recentCard, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          {filteredChats.length ? filteredChats.map((chat, index) => <View key={chat.id}>
              <ChatRow chat={chat} onPress={() => openConversation({ id: chat.id, name: chat.name, avatar: chat.avatar, participantId: chat.participantId, frameUrl: chat.frameUrl })} />
              {index < filteredChats.length - 1 ? <View style={[styles.rowDivider, { backgroundColor: theme.colors.cardBorder }]} /> : null}
            </View>) : <EmptyRecent hasQuery={Boolean(trimmedQuery)} />}
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
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  friendRequestsButton: {
    position: 'relative'
  },
  headerBadge: {
    position: 'absolute',
    top: scaleModerate(-4),
    right: scaleModerate(-6),
    minWidth: scaleModerate(16),
    height: scaleModerate(16),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(3)
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(9),
    fontWeight: '800'
  },
  searchInput: {
    flex: 1,
    marginLeft: scaleModerate(10),
    borderWidth: 1,
    borderRadius: scaleModerate(12),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9),
    fontSize: scaleFont(14)
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
  emptyRecent: {
    paddingVertical: scaleModerate(24),
    alignItems: 'center'
  },
  emptyRecentText: {
    fontSize: scaleFont(12.5)
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
