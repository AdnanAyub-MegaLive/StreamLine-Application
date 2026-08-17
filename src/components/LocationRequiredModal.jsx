import React from 'react';
import { Modal } from 'react-native';
import { getCurrentLocationOrError } from '../utils/location';
import { LocationRequiredScreen } from './LocationRequiredScreen';

const POLL_MS = 3000;

// Module-level bridge, same pattern as ThemedAlert's showAlert — lets login/
// signup trigger the full-screen "Location Required" block (see
// LocationRequiredScreen) from a plain catch block, without every call site
// needing its own Modal/state. Set by the single
// <LocationRequiredModalHost /> mounted once in App.jsx.
let showHandler = null;

export function showLocationRequiredModal() {
  showHandler?.();
}

export function LocationRequiredModalHost() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    showHandler = () => setVisible(true);
    return () => {
      showHandler = null;
    };
  }, []);

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }
    // No close button by design — the only way out is actually turning
    // location on, which this auto-detects and dismisses.
    const interval = setInterval(async () => {
      const result = await getCurrentLocationOrError();
      if (result.errorCode !== 'POSITION_UNAVAILABLE') {
        setVisible(false);
      }
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      <LocationRequiredScreen />
    </Modal>
  );
}

export default LocationRequiredModalHost;
