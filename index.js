/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import { registerGlobals } from '@livekit/react-native';
import App from './App';
import { name as appName } from './app.json';
import { navigateToRoom } from './src/navigation/navigationRef';
import { registerBackgroundLiveRoomHandler } from './src/utils/liveRoomNotifications';

// Sets up the WebRTC globals LiveKit needs — must run once, before any
// LiveKit/WebRTC code touches a Room.
registerGlobals();

// livekit-client's signal-connection WebSocket keeps a background "closed"
// listener alive for as long as a room stays connected — since rooms can
// now legitimately stay connected in the background (see RoomScreen's
// "Keep" option and ActiveRoomSessionProvider), a transient network blip
// while backgrounded can make that internal listener reject with a raw
// WebSocket error Event instead of an Error. It's not something our own
// code awaits (useLiveKitAudio's connect/disconnect/reconnect already
// fully try/catch everything they await), so there's nothing to fix on
// our side — this only silences the dev-only red-screen for that one
// known, harmless pattern; anything else still surfaces normally.
// Matched on 'Symbol(composedPath)' specifically (not just "Uncaught (in
// promise") — that's the distinctive fingerprint of a raw WebSocket/DOM
// Event polyfill object being used as a rejection reason, not a real
// Error. A genuine unhandled rejection elsewhere (a real Error with a
// message/stack) never matches this and still shows normally.
LogBox.ignoreLogs(['Symbol(composedPath)']);

// Must be registered at module scope (not inside a component) so Android
// can deliver a "return to live room" notification tap even if the app was
// backgrounded or fully killed.
registerBackgroundLiveRoomHandler(navigateToRoom);

AppRegistry.registerComponent(appName, () => App);
