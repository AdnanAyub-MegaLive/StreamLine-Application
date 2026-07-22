import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen, showAlert } from '../../components';
import { useAppStore } from '../../store';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';
function SectionLabel({
  label
}) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, {
    color: theme.text.secondary
  }]}>{label}</Text>;
}
function SettingsRow({
  label,
  value,
  onPress,
  rightElement,
  destructive
}) {
  const theme = useTheme();
  return <Pressable onPress={onPress} disabled={!onPress} style={[styles.row, {
    borderBottomColor: theme.colors.cardBorder
  }]}>
      <Text style={[styles.rowLabel, {
      color: destructive ? theme.colors.giftAccent : theme.text.primary
    }]}>{label}</Text>
      {rightElement ? rightElement : value ? <Text style={[styles.rowValue, {
      color: theme.text.secondary
    }]} numberOfLines={1}>
          {value}
        </Text> : onPress ? <Text style={[styles.rowChevron, {
      color: theme.text.mutedIcon
    }]}>›</Text> : null}
    </Pressable>;
}
export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const clearSession = useAppStore(state => state.clearSession);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [soundsEnabled, setSoundsEnabled] = React.useState(true);
  const user = session?.user;
  const handleLogout = () => {
    showAlert('Log out', 'Are you sure you want to log out?', [{
      text: 'Cancel',
      style: 'cancel'
    }, {
      text: 'Log out',
      style: 'destructive',
      onPress: () => {
        clearSession();
        navigation.reset({
          index: 0,
          routes: [{
            name: routes.auth
          }]
        });
      }
    }]);
  };
  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Settings</Text>

        <SectionLabel label="Account" />
        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
          <SettingsRow label="User ID" value={user?.displayId || user?.publicId || '—'} />
          <SettingsRow label="Full Name" value={user?.fullName || '—'} onPress={() => navigation.navigate(routes.editProfile)} />
          <SettingsRow label="Phone" value={user?.phone || '—'} onPress={() => navigation.navigate(routes.editProfile)} />
          <SettingsRow label="Email" value={user?.email || 'Not provided'} onPress={() => navigation.navigate(routes.editProfile)} />
          <SettingsRow label="Country" value={user?.country || 'Not set'} onPress={() => navigation.navigate(routes.editProfile)} />
          <SettingsRow label="Edit Profile" onPress={() => navigation.navigate(routes.editProfile)} />
        </View>

        <SectionLabel label="Preferences" />
        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
          <SettingsRow label="Push Notifications" rightElement={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{
          true: theme.colors.teal700,
          false: theme.colors.cardBorder
        }} thumbColor="#FFFFFF" />} />
          <SettingsRow label="In-app Sounds" rightElement={<Switch value={soundsEnabled} onValueChange={setSoundsEnabled} trackColor={{
          true: theme.colors.teal700,
          false: theme.colors.cardBorder
        }} thumbColor="#FFFFFF" />} />
        </View>

        <SectionLabel label="About" />
        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
          <SettingsRow label="Terms & Conditions" onPress={() => navigation.navigate(routes.terms)} />
          <SettingsRow label="App Version" value="0.0.1" />
        </View>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
          <SettingsRow label="Log Out" onPress={handleLogout} destructive />
        </View>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(20),
    paddingBottom: scaleModerate(40)
  },
  title: {
    fontSize: scaleFont(26),
    fontWeight: '800',
    marginBottom: scaleModerate(8)
  },
  sectionLabel: {
    marginTop: scaleModerate(20),
    marginBottom: scaleModerate(8),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(12),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  card: {
    borderRadius: scaleModerate(18),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(16)
  },
  row: {
    minHeight: scaleModerate(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: scaleModerate(12)
  },
  rowLabel: {
    fontSize: scaleFont(15),
    fontWeight: '600'
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: scaleFont(14)
  },
  rowChevron: {
    fontSize: scaleFont(20),
    fontWeight: '700'
  }
});
export default SettingsScreen;
