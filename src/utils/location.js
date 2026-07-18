import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { createMMKV } from 'react-native-mmkv';
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse'
});
const locationStorage = createMMKV({
  id: 'streamline-location'
});
const LOCATION_KEY = 'last-known-location';
// iOS: requestAuthorization resolves with the current status without
// re-prompting once the user has already answered, so it doubles as a
// permission check.
export async function checkLocationPermission() {
  if (Platform.OS === 'android') {
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }
  return new Promise(resolve => {
    Geolocation.requestAuthorization(() => resolve(true), () => resolve(false));
  });
}
export async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Location Permission',
      message: 'Streamline needs your location to personalize your experience and secure your account.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny'
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return checkLocationPermission();
}
export function openLocationSettings() {
  Linking.openSettings();
}
export function getCurrentLocation() {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(position => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      locationStorage.set(LOCATION_KEY, JSON.stringify(location));
      resolve(location);
    }, () => resolve(null), {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000
    });
  });
}
export function getCachedLocation() {
  const raw = locationStorage.getString(LOCATION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function formatLocationString(location) {
  return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
}
