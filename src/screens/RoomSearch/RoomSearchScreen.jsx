import React from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen, VerifiedTick } from '../../components';
import { searchAudioRooms, searchUsers } from '../../api';
import { useUserAssets } from '../../hooks';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

const SEARCH_DEBOUNCE_MS = 350;

function RoomRow({ room, isOwnRoom, onPress }) {
  const theme = useTheme();
  // BUGFIX: never resolved the owner's equipped frame at all — showed
  // correctly for the exact same user/frame in the Users section (via
  // UserRow's useUserAssets below) but not here, since Avatar was never
  // given a frameUri to render in the first place.
  const { frameUri } = useUserAssets({ userId: room.owner?.id, frameUrl: room.owner?.frameUrl });
  return <Pressable onPress={onPress} style={styles.row}>
      <Avatar value={room.owner?.profileImage} fullName={room.owner?.name} size={scaleModerate(46)} frameUri={frameUri} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: theme.text.primary }]} numberOfLines={1}>{room.title}</Text>
        <Text style={[styles.rowMeta, { color: theme.text.secondary }]} numberOfLines={1}>
          RID: {room.roomId} · {room.participantCount ?? 0} live{isOwnRoom ? ' · Your Room' : ''}
        </Text>
      </View>
    </Pressable>;
}

// Same row convention as UserSearchScreen's UserRow — kept as a separate
// component here (not shared) since the two screens' result shapes
// (room vs user) are different enough that a shared component would need
// its own branching anyway.
function UserRow({ user, onPress }) {
  const theme = useTheme();
  const { frameUri } = useUserAssets({ userId: user.publicId, frameUrl: user.frameUrl });
  return <Pressable onPress={onPress} style={styles.row}>
      <Avatar value={user.profileImage} fullName={user.name} size={scaleModerate(46)} frameUri={frameUri} />
      <View style={styles.rowBody}>
        <View style={styles.rowNameLine}>
          <Text style={[styles.rowTitle, { color: theme.text.primary }]} numberOfLines={1}>{user.name}</Text>
          {user.isOfficial ? <VerifiedTick size={13} /> : null}
        </View>
        <Text style={[styles.rowMeta, { color: theme.text.secondary }]} numberOfLines={1}>ID: {user.publicId}</Text>
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
        {hasQuery ? 'No rooms or users found for that search.' : 'Search by room name, Room ID, user name, or user ID.'}
      </Text>
    </View>;
}

// Reached from the Party page's search icon — deliberately separate from
// UserSearchScreen (still used by the Live/Games tabs), but searches BOTH
// rooms AND users from here, since a Party-page search shouldn't force a
// separate trip to find someone by name/ID. Room results find rooms even
// when empty/idle (owner offline), since a room found by direct search
// should always be joinable — see
// docs/audio-room-persistent-lifecycle-spec.md. Includes the searching
// user's OWN room in results too, so they can find and rejoin it as owner
// after fully closing the app, not just other people's rooms.
export function RoomSearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const sessionToken = session?.token;
  const [query, setQuery] = React.useState('');
  const [rooms, setRooms] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setRooms([]);
      setUsers([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    const timeout = setTimeout(async () => {
      const [roomResults, userResults] = await Promise.all([
        searchAudioRooms(sessionToken, trimmed),
        searchUsers(sessionToken, trimmed)
      ]);
      // Temporary diagnostic — remove once confirmed fixed on-device.
      console.log('[RoomSearch] query', trimmed, 'rooms', roomResults?.length, 'users', userResults?.length, userResults);
      if (!cancelled) {
        setRooms(roomResults);
        setUsers(userResults);
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

  const openProfile = user => {
    navigation.navigate(routes.userProfile, {
      userId: user.publicId,
      userName: user.name,
      userAvatar: user.profileImage,
      userFrameUrl: user.frameUrl ?? null,
      userBadgeUrl: user.badgeUrl ?? null,
      userGender: user.gender ?? null,
      userDob: user.dob ?? null,
      userIsOfficial: user.isOfficial ?? false
    });
  };

  const sections = [];
  if (rooms.length) {
    sections.push({ title: 'Rooms', key: 'rooms', data: rooms });
  }
  if (users.length) {
    sections.push({ title: 'Users', key: 'users', data: users });
  }

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search rooms or users"
          placeholderTextColor={theme.text.secondary}
          autoFocus
          style={[styles.input, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.teal700} /> : null}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.roomId ?? item.publicId ?? String(index)}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>{section.title}</Text>}
        renderItem={({ item, section }) => section.key === 'rooms'
          ? <RoomRow
              room={item}
              isOwnRoom={Boolean(session?.user?.publicId) && item.owner?.id === session.user.publicId}
              onPress={() => openRoom(item)}
            />
          : <UserRow user={item} onPress={() => openProfile(item)} />}
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
  sectionHeader: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: scaleModerate(12),
    marginBottom: scaleModerate(4)
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
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  rowTitle: {
    flexShrink: 1,
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
