import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { SettingsIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { useAppStore } from '../../store';
import { isNewUser } from '../../utils';
import { routes, type RootStackParamList } from '../../navigation/routes';

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const session = useAppStore(state => state.session);
  const showNewBadge = isNewUser(session?.user.createdAt);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable onPress={() => navigation.navigate(routes.settings)} hitSlop={10}>
          <SettingsIcon size={22} color={theme.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={[styles.avatar, { backgroundColor: theme.state.soft, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.avatarText, { color: theme.colors.teal700 }]}>{(session?.user.fullName || 'S').slice(0, 1).toUpperCase()}</Text>
        </View>

        <View style={styles.nameRow}>
          <Text style={[styles.title, { color: theme.text.primary }]}>{session?.user.fullName || 'Guest'}</Text>
          {showNewBadge ? (
            <View style={[styles.newBadge, { backgroundColor: theme.cta.primary.background }]}>
              <Text style={[styles.newBadgeText, { color: theme.cta.primary.text }]}>NEW</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{session?.user.phone || session?.user.email || 'Account details belong here.'}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerSpacer: {
    width: 22,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfileScreen;
