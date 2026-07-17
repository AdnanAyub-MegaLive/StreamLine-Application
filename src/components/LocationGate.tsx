import React from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { checkLocationPermission, getCurrentLocation, openLocationSettings, requestLocationPermission } from '../utils';
import { PrimaryButton } from './PrimaryButton';

type GateStatus = 'checking' | 'granted' | 'denied';

// Blocks the whole app behind a location-permission wall on launch/resume —
// nothing else renders until the user grants location access. Once granted,
// the current position is cached (see src/utils/location.ts) so it can be
// attached to the signup request as device.location.
export function LocationGate({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [status, setStatus] = React.useState<GateStatus>('checking');

  const applyResult = React.useCallback((granted: boolean) => {
    if (!granted) {
      setStatus('denied');
      return;
    }

    setStatus('granted');
    getCurrentLocation();
  }, []);

  // Only the very first evaluation shows the OS permission dialog. Every
  // later re-check (AppState resume, the "Try Again" button after the user
  // manually enables it in Settings) is silent — Android would otherwise
  // re-show the dialog on every request() call until "don't ask again" is
  // hit, which felt like the popup kept reappearing.
  const requestOnce = React.useCallback(async () => {
    applyResult(await requestLocationPermission());
  }, [applyResult]);

  const checkSilently = React.useCallback(async () => {
    applyResult(await checkLocationPermission());
  }, [applyResult]);

  React.useEffect(() => {
    requestOnce();

    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkSilently();
      }
    });

    return () => subscription.remove();
  }, [requestOnce, checkSilently]);

  if (status === 'checking') {
    return <View style={[styles.center, { backgroundColor: theme.surfaces.page }]} />;
  }

  if (status === 'denied') {
    return (
      <View style={[styles.center, styles.padded, { backgroundColor: theme.surfaces.page }]}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Location Required</Text>
        <Text style={[styles.body, { color: theme.text.secondary }]}>
          Streamline needs access to your location to continue. Please enable location access for this app in your
          device settings, then try again.
        </Text>
        <PrimaryButton label="Open Settings" onPress={openLocationSettings} style={styles.button} />
        <PrimaryButton label="Try Again" onPress={checkSilently} style={styles.button} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padded: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
});
