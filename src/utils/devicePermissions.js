import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, check, checkNotifications, request, requestNotifications } from 'react-native-permissions';
import { checkLocationPermission, requestLocationPermission } from './location';

// Camera, microphone, and gallery (photo library) go through the generic
// PERMISSIONS map. Notifications use their own dedicated API in this
// library instead (there's no PERMISSIONS.* entry for it) — it already
// handles the Android-13-vs-older difference internally. Location is
// handled separately in src/utils/location.js since it uses
// @react-native-community/geolocation instead of react-native-permissions.
const PERMISSION_MAP = {
  camera: Platform.select({ android: PERMISSIONS.ANDROID.CAMERA, ios: PERMISSIONS.IOS.CAMERA }),
  microphone: Platform.select({ android: PERMISSIONS.ANDROID.RECORD_AUDIO, ios: PERMISSIONS.IOS.MICROPHONE }),
  gallery: Platform.select({
    android: Platform.Version >= 33 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY
  })
};

const GRANTED_RESULTS = [RESULTS.GRANTED, RESULTS.LIMITED];

export async function checkDevicePermission(key) {
  if (key === 'notification') {
    const { status } = await checkNotifications();
    return GRANTED_RESULTS.includes(status);
  }

  const permission = PERMISSION_MAP[key];
  if (!permission) {
    return true;
  }

  const result = await check(permission);
  return GRANTED_RESULTS.includes(result);
}

export async function requestDevicePermission(key) {
  if (key === 'notification') {
    const { status } = await requestNotifications(['alert', 'sound', 'badge']);
    return GRANTED_RESULTS.includes(status);
  }

  const permission = PERMISSION_MAP[key];
  if (!permission) {
    return true;
  }

  const result = await request(permission);
  return GRANTED_RESULTS.includes(result);
}

// Single entry point for "am I actually allowed to do this right now" —
// call this immediately before any feature that needs a device permission
// (picking from the gallery, using the camera/mic, reading location),
// rather than assuming PermissionsGate's launch-time grant still holds.
// PermissionsGate already blocks the whole app until every permission is
// granted, and re-checks on every foreground resume — but a user can still
// revoke one specific permission from OS Settings while a feature-specific
// screen is already open and focused, before the next AppState 'active'
// event ever fires. Checks first (no OS prompt if already granted), then
// requests only if needed. Never shows any UI itself — callers decide how
// to react (e.g. an alert offering Linking.openSettings()) so this stays
// free of any component-layer imports.
export async function ensurePermission(key) {
  if (key === 'location') {
    return (await checkLocationPermission()) || requestLocationPermission();
  }
  if (await checkDevicePermission(key)) {
    return true;
  }
  return requestDevicePermission(key);
}
