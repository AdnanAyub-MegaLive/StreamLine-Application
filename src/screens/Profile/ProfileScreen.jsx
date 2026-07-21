import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SettingsIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { useAppStore } from '../../store';
import { isNewUser, scaleFont, scaleModerate } from '../../utils';
import { routes } from '../../navigation/routes';
export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const showNewBadge = isNewUser(session?.user.createdAt);
  return <Screen>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable onPress={() => navigation.navigate(routes.settings)} hitSlop={10}>
          <SettingsIcon size={22} color={theme.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.container}>
        <View style={[styles.avatar, {
        backgroundColor: theme.state.soft,
        borderColor: theme.colors.cardBorder
      }]}>
          <Text style={[styles.avatarText, {
          color: theme.colors.teal700
        }]}>{(session?.user.fullName || 'S').slice(0, 1).toUpperCase()}</Text>
        </View>

        <View style={styles.nameRow}>
          <Text style={[styles.title, {
          color: theme.text.primary
        }]}>{session?.user.fullName || 'Guest'}</Text>
          {showNewBadge ? <View style={[styles.newBadge, {
          backgroundColor: theme.cta.primary.background
        }]}>
              <Text style={[styles.newBadgeText, {
            color: theme.cta.primary.text
          }]}>NEW</Text>
            </View> : null}
        </View>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>{session?.user.phone || session?.user.email || 'Account details belong here.'}</Text>
        {session?.user.displayId || session?.user.publicId ? <Text style={[styles.idText, {
        color: theme.text.mutedIcon
      }]}>ID: {session?.user.displayId || session?.user.publicId}</Text> : null}
      </View>
    </Screen>;
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14)
  },
  headerSpacer: {
    width: scaleModerate(22)
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(24)
  },
  avatar: {
    width: scaleModerate(84),
    height: scaleModerate(84),
    borderRadius: scaleModerate(42),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(16)
  },
  avatarText: {
    fontSize: scaleFont(32),
    fontWeight: '800'
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: '800'
  },
  newBadge: {
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3),
    borderRadius: 999
  },
  newBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800',
    letterSpacing: 0.4
  },
  subtitle: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(14),
    textAlign: 'center'
  },
  idText: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(11),
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default ProfileScreen;
