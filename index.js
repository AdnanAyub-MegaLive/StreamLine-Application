/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { registerGlobals } from '@livekit/react-native';
import App from './App';
import { name as appName } from './app.json';
import { navigateToRoom } from './src/navigation/navigationRef';
import { registerBackgroundLiveRoomHandler } from './src/utils/liveRoomNotifications';

// Sets up the WebRTC globals LiveKit needs — must run once, before any
// LiveKit/WebRTC code touches a Room.
registerGlobals();

// Must be registered at module scope (not inside a component) so Android
// can deliver a "return to live room" notification tap even if the app was
// backgrounded or fully killed.
registerBackgroundLiveRoomHandler(navigateToRoom);

AppRegistry.registerComponent(appName, () => App);
