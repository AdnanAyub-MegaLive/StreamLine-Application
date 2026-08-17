import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { openLocationSettings } from '../utils/location';
import { scaleFont, scaleModerate } from '../utils';
import { BrandMark } from './BrandMark';
import { PrimaryButton } from './PrimaryButton';

// Full-screen block shown whenever device location SERVICES are off (not
// just the app's own permission — see checkLocationPermission vs
// getCurrentLocationOrError in utils/location.js, these are two different
// things). Used both by PermissionsGate (blocks the whole app on launch)
// and by the login/signup flows (a user can flip location off mid-session
// without backgrounding the app, so the backend's LOCATION_UNAVAILABLE
// error needs the same full-screen treatment, not just a small alert).
export function LocationRequiredScreen() {
  const theme = useTheme();
  return <View style={[styles.root, { backgroundColor: theme.surfaces.page }]}>
      <BrandMark size={104} />
      <Text style={[styles.title, { color: theme.text.primary }]}>Location Required</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        Streamline needs your device location turned on to continue. Please enable it in Settings.
      </Text>
      <PrimaryButton label="Open Location Settings" onPress={openLocationSettings} style={styles.button} />
    </View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(28)
  },
  title: {
    marginTop: scaleModerate(22),
    fontSize: scaleFont(24),
    fontWeight: '800',
    textAlign: 'center'
  },
  body: {
    marginTop: scaleModerate(12),
    fontSize: scaleFont(14),
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300
  },
  button: {
    marginTop: scaleModerate(28),
    alignSelf: 'stretch'
  }
});

export default LocationRequiredScreen;
