import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { searchAudioRooms } from '../../api';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

const SEARCH_DEBOUNCE_MS = 350;

function RoomRow({ room, isOwnRoom, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={styles.row}>
      <Avatar value={room.owner?.profileImage} fullName={room.owner?.name} size={scaleModerate(46)} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.text.primary }]} numberOfLines={1}>{room.title}</Text>
        <Text style={[styles.rowMeta, { color: theme.text.secondary }]} numberOfLines={1}>
          RID: {room.roomId} · {room.participantCount ?? 0} live{isOwnRoom ? ' · Your Room' : ''}
        </Text>
      </View>
    </Pressable>;
}

function EmptyState({ hasQuery, loading }) {
  const theme = useTheme();
  if (loading) {
    return null;
  }
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>
        {hasQuery ? 'No rooms found for that name or Room ID.' : 'Search by room name or Room ID.'}
      </Text>
    </View>;
}

// Reached from the Party page's search icon — deliberately separate from
// UserSearchScreen (User ID search), which this used to be the only
// search available there. Finds rooms even when empty/idle (owner
// offline), since a room found by direct search should always be joinable
// — see docs/audio-room-persistent-lifecycle-spec.md. Includes the
// searching user's OWN room in results too, so they can find and rejoin
// it as owner after fully closing the app, not just other people's rooms.
export function RoomSearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const sessionToken = session?.token;
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const rooms = await searchAudioRooms(sessionToken, trimmed);
      if (!cancelled) {
        setResults(rooms);
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, sessionToken]);

  const openRoom = room => {
    const isOwnRoom = Boolean(session?.user?.publicId) && room.owner?.id === session.user.publicId;
    navigation.navigate(routes.room, {
      roomId: room.roomId,
      roomName: room.title,
      mode: 'audio',
      // Omitted (not false) for the owner's own room — RoomScreen assumes
      // owner UI by default and corrects itself from the real join ack
      // regardless, but this avoids a flash of viewer-only controls before
      // that ack arrives, same as the normal "resume my room" flow.
      ...(isOwnRoom ? {} : { asViewer: true })
    });
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by room name or Room ID"
          placeholderTextColor={theme.text.secondary}
          autoFocus
          style={[styles.input, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.teal700} /> : null}

      <FlatList
        data={results}
        keyExtractor={item => item.roomId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <RoomRow
          room={item}
          isOwnRoom={Boolean(session?.user?.publicId) && item.owner?.id === session.user.publicId}
          onPress={() => openRoom(item)}
        />}
        ListEmptyComponent={<EmptyState hasQuery={Boolean(query.trim())} loading={loading} />}
        keyboardShouldPersistTaps="handled"
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleModerate(12),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9),
    fontSize: scaleFont(14)
  },
  loader: {
    marginTop: scaleModerate(16)
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
    paddingVertical: scaleModerate(10)
  },
  rowBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  rowTitle: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowMeta: {
    fontSize: scaleFont(12)
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

export default RoomSearchScreen;
