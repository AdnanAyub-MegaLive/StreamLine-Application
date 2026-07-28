import { showAlert } from './ThemedAlert';
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
  showAlert('Turn On Location', error.message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => openLocationSettings() }
  ]);
}

export default showLocationErrorAlert;
