import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConversations, fetchFriends, fetchNotifications } from '../api';
import { getSessionSocket } from '../services/socket';
import { useAppStore } from '../store';

const WORLD_CONVERSATION_ID = 'CONV-WORLD';

// Matches the "2m" / "1h" / "Yesterday" style already used by the approved
// Messages design (see MessageScreen.jsx's old RECENT_CHATS placeholder).
function formatRelativeTime(isoString) {
  if (!isoString) {
    return '';
  }
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days}d`;
  }
  return new Date(isoString).toLocaleDateString();
}

function toRecentChat(conversation) {
  return {
    id: conversation.id,
    participantId: conversation.participant?.id ?? null,
    name: conversation.participant?.name ?? conversation.name ?? 'Deleted user',
    avatar: conversation.participant?.profileImage ?? null,
    frameUrl: conversation.participant?.frameUrl ?? null,
    badgeUrl: conversation.participant?.badgeUrl ?? null,
    time: formatRelativeTime(conversation.lastMessageAt),
    preview: conversation.lastMessage?.body ?? '',
    unreadCount: conversation.unreadCount ?? 0
  };
}

// See StreamLine-Portal/docs/mobile-messaging-api.md. Fetches the caller's
// conversations (World Chat + direct chats) and notifications over REST on
// focus, then keeps them live via the already-connected session socket
// (see useSessionGuard/connectSessionSocket) for as long as this screen is
// focused — no separate socket connection is opened here.
export function useMessaging() {
  const sessionToken = useAppStore(state => state.session?.token);
  const [conversations, setConversations] = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [friends, setFriends] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    const [conversationList, notificationList, friendList] = await Promise.all([
      fetchConversations(sessionToken),
      fetchNotifications(sessionToken, { limit: 20 }),
      fetchFriends(sessionToken)
    ]);
    setConversations(conversationList);
    setNotifications(notificationList);
    setFriends(friendList);
    setLoading(false);
  }, [sessionToken]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await reload();
        } catch {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      const socket = getSessionSocket();
      // message:new/conversation:read/notification:new are unwrapped events
      // registered by connectSessionSocket in src/services/socket.js —
      // re-fetching here (rather than patching state in place) keeps
      // unreadCount/lastMessage authoritative and server-computed.
      const handleUpdate = () => {
        if (!cancelled) {
          reload().catch(() => {});
        }
      };
      socket?.on('message:new', handleUpdate);
      socket?.on('conversation:read', handleUpdate);
      socket?.on('notification:new', handleUpdate);
      // A newly-accepted friend should be searchable/messageable right
      // away — see docs/friends-api-spec.md.
      socket?.on('friend:accepted', handleUpdate);

      return () => {
        cancelled = true;
        socket?.off('message:new', handleUpdate);
        socket?.off('conversation:read', handleUpdate);
        socket?.off('notification:new', handleUpdate);
        socket?.off('friend:accepted', handleUpdate);
      };
    }, [reload])
  );

  const worldChat = React.useMemo(() => {
    const conversation = conversations.find(item => item.id === WORLD_CONVERSATION_ID);
    if (!conversation) {
      return null;
    }
    return {
      id: conversation.id,
      name: conversation.name ?? 'World Chat',
      // The conversation-list endpoint's lastMessage only includes
      // senderId (a publicId), not a display name — showing "Someone:" for
      // every message would be misleading, so this just shows the preview
      // text on its own instead of a "<name>: <preview>" line.
      time: formatRelativeTime(conversation.lastMessageAt),
      preview: conversation.lastMessage?.body ?? 'No messages yet — say hello!',
      unreadCount: conversation.unreadCount ?? 0
    };
  }, [conversations]);

  const recentChats = React.useMemo(
    () => conversations.filter(item => item.id !== WORLD_CONVERSATION_ID).map(toRecentChat),
    [conversations]
  );

  // Friends who don't have an existing conversation yet — so a newly
  // accepted friend is still findable/messageable from the Messages
  // search, not just people you've already chatted with (see
  // MessageScreen.jsx's search, which merges this in alongside recentChats).
  const messagableFriends = React.useMemo(() => {
    const existingParticipantIds = new Set(recentChats.map(chat => chat.participantId).filter(Boolean));
    return friends
      .filter(friend => !existingParticipantIds.has(friend.id))
      .map(friend => ({
        id: friend.id,
        name: friend.name,
        avatar: friend.profileImage ?? null,
        frameUrl: friend.frameUrl ?? null
      }));
  }, [friends, recentChats]);

  const systemNotification = React.useMemo(() => {
    const latest = notifications[0];
    if (!latest) {
      return null;
    }
    return {
      time: formatRelativeTime(latest.createdAt),
      preview: latest.body,
      unread: !latest.readAt
    };
  }, [notifications]);

  return { loading, systemNotification, worldChat, recentChats, messagableFriends, reload };
}

export default useMessaging;
