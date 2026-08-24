import { Linking } from 'react-native';
import { ensurePermission } from '../utils';
import { showAlert } from './ThemedAlert';

const PERMISSION_ALERT_MESSAGES = {
  gallery: 'Please allow gallery access in Settings to pick a photo.',
  camera: 'Please allow camera access in Settings to use this.',
  microphone: 'Please allow microphone access in Settings to use this.',
  location: 'Please allow location access in Settings to use this.',
  notification: 'Please allow notifications in Settings to use this.'
};

// Single call site for "check this specific permission right before the
// feature that needs it, not just at app launch" — PermissionsGate already
// blocks the whole app until every permission is granted and re-checks on
// every foreground resume, but a user can revoke one specific permission
// from OS Settings while a feature screen is already open, before the next
// resume ever fires. Returns whether the feature is safe to proceed with;
// shows an alert offering Settings only when it isn't.
export async function ensurePermissionOrPrompt(key) {
  if (await ensurePermission(key)) {
    return true;
  }
  showAlert('Permission Required', PERMISSION_ALERT_MESSAGES[key] ?? 'This needs a permission that hasn\'t been granted.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() }
  ]);
  return false;
}
