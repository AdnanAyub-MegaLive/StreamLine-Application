import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { createMMKV } from 'react-native-mmkv';

Geolocation.setRNConfiguration({ skipPermissionRequests: false, authorizationLevel: 'whenInUse' });

const locationStorage = createMMKV({ id: 'streamline-location' });
const LOCATION_KEY = 'last-known-location';

export type DeviceLocation = { latitude: number; longitude: number };

// iOS: requestAuthorization resolves with the current status without
// re-prompting once the user has already answered, so it doubles as a
// permission check.
export async function checkLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }

  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Location Permission',
      message: 'Streamline needs your location to personalize your experience and secure your account.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  return checkLocationPermission();
}

export function openLocationSettings() {
  Linking.openSettings();
}

export function getCurrentLocation(): Promise<DeviceLocation | null> {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        const location: DeviceLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        locationStorage.set(LOCATION_KEY, JSON.stringify(location));
        resolve(location);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export function getCachedLocation(): DeviceLocation | null {
  const raw = locationStorage.getString(LOCATION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DeviceLocation;
  } catch {
    return null;
  }
}

export function formatLocationString(location: DeviceLocation): string {
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
}
