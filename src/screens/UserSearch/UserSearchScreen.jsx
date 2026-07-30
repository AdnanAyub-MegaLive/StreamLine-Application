import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { searchUsers } from '../../api';
import { useUserAssets } from '../../hooks';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

const SEARCH_DEBOUNCE_MS = 350;

function UserRow({ user, onPress }) {
  const theme = useTheme();
  const { frameUri } = useUserAssets({ userId: user.publicId, frameUrl: user.frameUrl });
  return <Pressable onPress={onPress} style={styles.row}>
      <Avatar value={user.profileImage} fullName={user.name} size={scaleModerate(46)} frameUri={frameUri} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{user.name}</Text>
        <Text style={[styles.rowId, { color: theme.text.secondary }]} numberOfLines={1}>ID: {user.publicId}</Text>
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
        {hasQuery ? 'No users found for that name or ID.' : 'Search by name or user ID.'}
      </Text>
    </View>;
}

export function UserSearchScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
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
      const users = await searchUsers(sessionToken, trimmed);
      if (!cancelled) {
        setResults(users);
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, sessionToken]);

  const openProfile = user => {
    navigation.navigate(routes.userProfile, {
      userId: user.publicId,
      userName: user.name,
      userAvatar: user.profileImage,
      userFrameUrl: user.frameUrl ?? null
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
          placeholder="Search by name or user ID"
          placeholderTextColor={theme.text.secondary}
          autoFocus
          style={[styles.input, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.teal700} /> : null}

      <FlatList
        data={results}
        keyExtractor={item => item.publicId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <UserRow user={item} onPress={() => openProfile(item)} />}
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
  rowName: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowId: {
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

export default UserSearchScreen;
