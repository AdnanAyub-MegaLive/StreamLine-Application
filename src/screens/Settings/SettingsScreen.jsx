import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { useAppStore } from '../../store';
import { routes } from '../../navigation/routes';
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
    Alert.alert('Log out', 'Are you sure you want to log out?', [{
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 8,
    paddingLeft: 4,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600'
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14
  },
  rowChevron: {
    fontSize: 20,
    fontWeight: '700'
  }
});
export default SettingsScreen;
