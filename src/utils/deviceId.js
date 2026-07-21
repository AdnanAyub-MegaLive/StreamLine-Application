import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
const deviceStorage = createMMKV({
  id: 'streamline-device-storage'
});
const DEVICE_ID_KEY = 'device-id';
function generateFallbackId() {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${Platform.OS}-${timestamp}-${random}`;
}

// Prefers a real device-level identifier — Android's Settings.Secure.
// ANDROID_ID (survives app uninstall/reinstall, only changes on factory
// reset) or iOS's identifierForVendor — over a random ID scoped to just
// this app installation. Falls back to the old cached-random approach only
// if the native module can't return one for some reason.
export function getStableDeviceId() {
  try {
    const id = DeviceInfo.getUniqueIdSync();
    if (id) {
      return id;
    }
  } catch {
    // fall through to the cached-random fallback below
  }
  const existing = deviceStorage.getString(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = generateFallbackId();
  deviceStorage.set(DEVICE_ID_KEY, id);
  return id;
}
