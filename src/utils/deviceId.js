import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
const deviceStorage = createMMKV({
  id: 'streamline-device-storage'
});
const DEVICE_ID_KEY = 'device-id';
function generateId() {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${Platform.OS}-${timestamp}-${random}`;
}
export function getStableDeviceId() {
  const existing = deviceStorage.getString(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = generateId();
  deviceStorage.set(DEVICE_ID_KEY, id);
  return id;
}
