import { showAlert } from './ThemedAlert';
import { showLocationRequiredModal } from './LocationRequiredModal';
import { openLocationSettings } from '../utils/location';

export function showLocationErrorAlert(error) {
  if (error.code === 'LOCATION_TIMEOUT') {
    showAlert('Location Not Found', error.message);
    return;
  }
  if (error.code === 'LOCATION_PERMISSION_DENIED') {
    showAlert('Location Permission Needed', error.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => openLocationSettings() }
    ]);
    return;
  }
  // Location services being off (not just a permission or a weak/slow fix)
  // gets the same full-screen "Location Required" block used on app
  // launch (see PermissionsGate) instead of a small dismissible alert —
  // same requirement, same treatment.
  showLocationRequiredModal();
}

export default showLocationErrorAlert;
