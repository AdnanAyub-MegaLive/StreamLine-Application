import { createNavigationContainerRef } from '@react-navigation/native';
import { routes } from './routes';

export const navigationRef = createNavigationContainerRef();

let pendingRoomNavigation = null;

// Used when a "return to live room" notification is tapped. If the nav
// container isn't ready yet (cold start from a killed state), the target is
// queued and consumed once NavigationContainer's onReady fires.
export function navigateToRoom(room) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(routes.room, room);
  } else {
    pendingRoomNavigation = room;
  }
}

export function consumePendingRoomNavigation() {
  if (pendingRoomNavigation && navigationRef.isReady()) {
    const room = pendingRoomNavigation;
    pendingRoomNavigation = null;
    navigationRef.navigate(routes.room, room);
  }
}
