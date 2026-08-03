import React from 'react';
import { fetchConversations, fetchIncomingFriendRequests } from '../api';
import { getSessionSocket } from '../services/socket';
import { useAppStore } from '../store';

const WORLD_CONVERSATION_ID = 'CONV-WORLD';

// Total badge count for the Message tab icon — unread messages across every
// direct conversation, plus pending incoming friend requests. World Chat is
// deliberately excluded — it's a shared broadcast channel, not a direct
// message to this user, so it doesn't count toward this number.
// Unlike useMessaging, this doesn't depend on useFocusEffect: the tab bar is
// mounted for the whole app session, not just while the Messages screen is
// focused, so it reloads on mount and stays live via the session socket for
// as long as the app is open.
export function useUnreadBadgeCount() {
  const sessionToken = useAppStore(state => state.session?.token);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!sessionToken) {
      setCount(0);
      return undefined;
    }
    let cancelled = false;
    const reload = async () => {
      try {
        const [conversations, requests] = await Promise.all([
          fetchConversations(sessionToken),
          fetchIncomingFriendRequests(sessionToken)
        ]);
        if (cancelled) {
          return;
        }
        const unreadMessages = conversations.reduce(
          (sum, conversation) => (conversation.id === WORLD_CONVERSATION_ID ? sum : sum + (conversation.unreadCount ?? 0)),
          0
        );
        setCount(unreadMessages + requests.length);
      } catch {
        // Leaves the previous count as-is — the next socket event or app
        // focus will retry.
      }
    };
    reload();

    const socket = getSessionSocket();
    socket?.on('message:new', reload);
    socket?.on('conversation:read', reload);
    socket?.on('friend:request', reload);
    socket?.on('friend:accepted', reload);
    socket?.on('friend:declined', reload);

    return () => {
      cancelled = true;
      socket?.off('message:new', reload);
      socket?.off('conversation:read', reload);
      socket?.off('friend:request', reload);
      socket?.off('friend:accepted', reload);
      socket?.off('friend:declined', reload);
    };
  }, [sessionToken]);

  return count;
}

export default useUnreadBadgeCount;
