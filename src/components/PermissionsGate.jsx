import React from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import {
  checkDevicePermission,
  checkLocationPermission,
  getCurrentLocationOrError,
  requestDevicePermission,
  requestLocationPermission,
  scaleFont,
  scaleModerate
} from '../utils';
import { PrimaryButton } from './PrimaryButton';
import { LocationRequiredScreen } from './LocationRequiredScreen';

// How often to re-check while blocked on "location services off" — flipping
// the quick-settings location tile doesn't reliably background the app on
// every Android OEM, so the AppState 'active' listener alone can miss it;
// a light poll while this screen is showing catches it either way.
const LOCATION_SERVICES_POLL_MS = 3000;

const PERMISSION_KEYS = ['location', 'camera', 'microphone', 'gallery', 'notification'];
const PERMISSION_LABELS = {
  location: 'Location',
  camera: 'Camera',
  microphone: 'Microphone',
  gallery: 'Gallery',
  notification: 'Notifications'
};

async function evaluatePermission(key, useRequest) {
  if (key === 'location') {
    return useRequest ? requestLocationPermission() : checkLocationPermission();
  }
  return useRequest ? requestDevicePermission(key) : checkDevicePermission(key);
}

function PermissionRow({ label, granted, theme }) {
  return (
    <View style={[styles.row, { borderColor: theme.colors.cardBorder }]}>
      <Text style={[styles.rowLabel, { color: theme.text.primary }]}>{label}</Text>
      <View
        style={[
          styles.rowBadge,
          { backgroundColor: granted ? theme.colors.teal700 : theme.surfaces.page, borderColor: theme.colors.cardBorder }
        ]}
      >
        <Text style={[styles.rowBadgeText, { color: granted ? theme.cta.primary.text : theme.text.secondary }]}>
          {granted ? 'Granted' : 'Not granted'}
        </Text>
      </View>
    </View>
  );
}

// Blocks the whole app behind a permissions wall on launch/resume — nothing
// else renders until location, camera, microphone, gallery, and
// notifications are all granted. Once granted, the current position is
// cached (see src/utils/location.js) so it can be attached to the signup
// request as device.location.
export function PermissionsGate({ children }) {
  const theme = useTheme();
  const [status, setStatus] = React.useState('checking');
  const [permissionState, setPermissionState] = React.useState({});
  const [isRequesting, setIsRequesting] = React.useState(false);

  // Requests are done ONE AT A TIME, in sequence — Android can only show a
  // single runtime-permission dialog at once. Firing request() for all 5
  // permissions together (e.g. via Promise.all) makes every dialog after
  // the first one get silently skipped/auto-denied, which looked like only
  // one permission was ever being asked for.
  const runSequentially = React.useCallback(async useRequest => {
    const nextState = {};

    for (const key of PERMISSION_KEYS) {
      nextState[key] = await evaluatePermission(key, useRequest);
      setPermissionState(current => ({ ...current, [key]: nextState[key] }));
    }

    const allGranted = PERMISSION_KEYS.every(key => nextState[key]);

    if (allGranted) {
      // Permission being granted just means the app is *allowed* to ask for
      // a fix — it says nothing about whether location services (GPS) are
      // actually switched on. getCurrentLocationOrError distinguishes the
      // two (POSITION_UNAVAILABLE = services off), which a plain
      // getCurrentLocation() call can't.
      const result = await getCurrentLocationOrError();
      setStatus(result.errorCode === 'POSITION_UNAVAILABLE' ? 'locationOff' : 'granted');
    } else {
      setStatus('denied');
    }

    return nextState;
  }, []);

  const requestAll = React.useCallback(async () => {
    setIsRequesting(true);
    await runSequentially(true);
    setIsRequesting(false);
  }, [runSequentially]);

  const checkSilently = React.useCallback(() => runSequentially(false), [runSequentially]);

  React.useEffect(() => {
    requestAll();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkSilently();
      }
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run the initial request once on mount
  }, []);

  React.useEffect(() => {
    if (status !== 'locationOff') {
      return undefined;
    }
    const interval = setInterval(async () => {
      const result = await getCurrentLocationOrError();
      if (result.errorCode !== 'POSITION_UNAVAILABLE') {
        setStatus('granted');
      }
    }, LOCATION_SERVICES_POLL_MS);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'checking') {
    return <View style={[styles.center, { backgroundColor: theme.surfaces.page }]} />;
  }

  if (status === 'locationOff') {
    return <LocationRequiredScreen />;
  }

  if (status === 'denied') {
    return (
      <View style={[styles.center, styles.padded, { backgroundColor: theme.surfaces.page }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Permissions Required</Text>
        <Text style={[styles.body, { color: theme.text.secondary }]}>
          Streamline needs all of these to continue. Grant whatever is missing below.
        </Text>

        <View style={[styles.list, { borderColor: theme.colors.cardBorder }]}>
          {PERMISSION_KEYS.map(key => (
            <PermissionRow key={key} label={PERMISSION_LABELS[key]} granted={Boolean(permissionState[key])} theme={theme} />
          ))}
        </View>

        <PrimaryButton
          label={isRequesting ? 'Requesting...' : 'Grant Permissions'}
          onPress={requestAll}
          disabled={isRequesting}
          style={styles.button}
        />
        <PrimaryButton label="Open Settings" onPress={() => Linking.openSettings()} style={styles.button} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  padded: {
    paddingHorizontal: scaleModerate(24)
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: '800',
    marginBottom: scaleModerate(12),
    textAlign: 'center'
  },
  body: {
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: scaleModerate(20)
  },
  list: {
    width: '100%',
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    marginBottom: scaleModerate(8)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  rowLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600'
  },
  rowBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(4)
  },
  rowBadgeText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  button: {
    marginTop: scaleModerate(12),
    alignSelf: 'stretch'
  }
});
