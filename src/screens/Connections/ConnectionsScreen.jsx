import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { fetchFriends } from '../../api';
import { useUserAssets } from '../../hooks';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

const TITLES = {
  friends: 'Friends',
  fans: 'Fans',
  following: 'Following'
};

function ConnectionRow({ user, onPress }) {
  const theme = useTheme();
  const { frameUri } = useUserAssets({ userId: user.id, frameUrl: user.frameUrl });
  return <Pressable onPress={onPress} style={styles.row}>
      <Avatar value={user.profileImage} fullName={user.name} size={scaleModerate(46)} frameUri={frameUri} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{user.name}</Text>
        <Text style={[styles.rowId, { color: theme.text.secondary }]} numberOfLines={1}>ID: {user.id}</Text>
      </View>
    </Pressable>;
}

function EmptyState({ type }) {
  const theme = useTheme();
  const message = type === 'friends'
    ? 'No friends yet — send a request from a user\'s profile.'
    : `No ${TITLES[type].toLowerCase()} yet.`;
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: theme.text.secondary }]}>{message}</Text>
    </View>;
}

export function ConnectionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params ?? {};
  const sessionToken = useAppStore(state => state.session?.token);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (type !== 'friends' || !sessionToken) {
        setLoading(false);
        return undefined;
      }
      setLoading(true);
      fetchFriends(sessionToken).then(friends => {
        if (!cancelled) {
          setUsers(friends);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [type, sessionToken])
  );

  const openProfile = user => {
    navigation.navigate(routes.userProfile, { userId: user.id, userName: user.name, userAvatar: user.profileImage, userFrameUrl: user.frameUrl });
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{TITLES[type] ?? 'Connections'}</Text>
      </View>

      {loading ? null : <FlatList
        data={users}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ConnectionRow user={item} onPress={() => openProfile(item)} />}
        ListEmptyComponent={<EmptyState type={type} />}
      />}
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

export default ConnectionsScreen;
