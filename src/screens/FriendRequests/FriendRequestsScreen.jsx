import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { fetchIncomingFriendRequests, respondToFriendRequest } from '../../api';
import { getSessionSocket } from '../../services/socket';
import { useUserAssets } from '../../hooks';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

function RequestRow({ request, onAccept, onDecline, busy }) {
  const theme = useTheme();
  const { frameUri } = useUserAssets({ userId: request.requesterId, frameUrl: request.requesterFrameUrl });
  return <View style={styles.row}>
      <Avatar value={request.requesterProfileImage} fullName={request.requesterName} size={scaleModerate(46)} frameUri={frameUri} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{request.requesterName}</Text>
        <Text style={[styles.rowId, { color: theme.text.secondary }]} numberOfLines={1}>ID: {request.requesterId}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable disabled={busy} onPress={onDecline} style={[styles.actionButton, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.declineText, { color: theme.text.secondary }]}>Decline</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={onAccept} style={[styles.actionButton, { backgroundColor: theme.colors.teal700, borderColor: theme.colors.teal700 }]}>
          <Text style={[styles.acceptText, { color: theme.cta.primary.text }]}>Accept</Text>
        </Pressable>
      </View>
    </View>;
}

function EmptyState() {
  const theme = useTheme();
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>No pending friend requests.</Text>
    </View>;
}

export function FriendRequestsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const [requests, setRequests] = React.useState([]);
  const [respondingId, setRespondingId] = React.useState(null);

  const reload = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    setRequests(await fetchIncomingFriendRequests(sessionToken));
  }, [sessionToken]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      reload().catch(() => {});
      const socket = getSessionSocket();
      const handleUpdate = () => {
        if (!cancelled) {
          reload().catch(() => {});
        }
      };
      socket?.on('friend:request', handleUpdate);
      return () => {
        cancelled = true;
        socket?.off('friend:request', handleUpdate);
      };
    }, [reload])
  );

  const handleRespond = async (requestId, accepted) => {
    setRespondingId(requestId);
    try {
      await respondToFriendRequest(sessionToken, requestId, accepted);
      setRequests(current => current.filter(request => request.id !== requestId));
    } catch {
      // Leaves the request in the list — the user can just try again.
    } finally {
      setRespondingId(null);
    }
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Friend Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <RequestRow
          request={item}
          busy={respondingId === item.id}
          onAccept={() => handleRespond(item.id, true)}
          onDecline={() => handleRespond(item.id, false)}
        />}
        ListEmptyComponent={<EmptyState />}
      />
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(10)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  list: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(4),
    paddingBottom: scaleModerate(28)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(12)
  },
  rowBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  rowName: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowId: {
    fontSize: scaleFont(12)
  },
  actions: {
    flexDirection: 'row',
    gap: scaleModerate(8)
  },
  actionButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  declineText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  acceptText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  emptyState: {
    paddingVertical: scaleModerate(48),
    paddingHorizontal: scaleModerate(24),
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: scaleFont(13),
    textAlign: 'center'
  }
});

export default FriendRequestsScreen;
