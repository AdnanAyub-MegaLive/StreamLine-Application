import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SettingsIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { useAssignedRoomBackground } from '../../hooks';
import { useAppStore } from '../../store';
import { isNewUser, scaleFont, scaleModerate } from '../../utils';
import { routes } from '../../navigation/routes';
export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const showNewBadge = isNewUser(session?.user.createdAt);
  // Same perk-based background used in the Room screen (see
  // useAssignedRoomBackground) — just showing it here for now, ahead of a
  // full profile redesign. Falls back to the screen's normal plain
  // background when nothing's assigned.
  const { source: assignedBackgroundSource } = useAssignedRoomBackground();
  const [backgroundFailed, setBackgroundFailed] = React.useState(false);
  // Reset whenever the source itself changes — otherwise a stale failure
  // from a previous asset would keep this screen falling back forever even
  // after a working background comes through.
  React.useEffect(() => {
    setBackgroundFailed(false);
  }, [assignedBackgroundSource]);
  const showCustomBackground = Boolean(assignedBackgroundSource) && !backgroundFailed;

  const content = <>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable onPress={() => navigation.navigate(routes.settings)} hitSlop={10}>
          <SettingsIcon size={22} color={theme.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.container}>
        <Avatar value={session?.user.profileImage} fullName={session?.user.fullName} size={scaleModerate(84)} style={styles.avatar} />

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
    </>;

  if (showCustomBackground) {
    return (
      <ImageBackground
        source={assignedBackgroundSource}
        resizeMode="cover"
        style={[styles.backgroundImage, { backgroundColor: theme.surfaces.page }]}
        onError={() => setBackgroundFailed(true)}
      >
        <Screen transparent>{content}</Screen>
      </ImageBackground>
    );
  }

  return <Screen>{content}</Screen>;
}
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1
  },
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
    marginBottom: scaleModerate(16)
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
