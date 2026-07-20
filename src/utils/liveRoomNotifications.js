import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

const LIVE_ROOM_CHANNEL_ID = 'live-rooms';
const LIVE_ROOM_NOTIFICATION_ID = 'live-room';

let channelReadyPromise = null;

function ensureLiveRoomChannel() {
  if (!channelReadyPromise) {
    channelReadyPromise = notifee.createChannel({
      id: LIVE_ROOM_CHANNEL_ID,
      name: 'Live Rooms',
      importance: AndroidImportance.HIGH
    });
  }
  return channelReadyPromise;
}

// Shown when the user backgrounds a live audio room (back gesture or the
// header close button) instead of ending it — the room keeps running, and
// tapping this notification brings them back to it. `room` params are
// serialized as a JSON string since notifee notification data must be
// string values.
export async function showLiveRoomNotification(room) {
  await ensureLiveRoomChannel();
  await notifee.displayNotification({
    id: LIVE_ROOM_NOTIFICATION_ID,
    title: '🔴 Live',
    body: `${room.roomName} is still live — tap to return.`,
    data: { room: JSON.stringify(room) },
    android: {
      channelId: LIVE_ROOM_CHANNEL_ID,
      pressAction: { id: 'return-to-room' },
      ongoing: true,
      autoCancel: false
    },
    ios: {
      categoryId: LIVE_ROOM_CHANNEL_ID
    }
  });
}

export async function dismissLiveRoomNotification() {
  await notifee.cancelNotification(LIVE_ROOM_NOTIFICATION_ID);
}

function parseRoomFromEvent({ type, detail }) {
  if (type !== EventType.PRESS) {
    return null;
  }
  const raw = detail.notification?.data?.room;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Registered once from App.jsx — routes a notification tap back into the
// Room screen with the same params it had when backgrounded.
export function registerLiveRoomNotificationTapHandler(onReturnToRoom) {
  const unsubscribeForeground = notifee.onForegroundEvent(event => {
    const room = parseRoomFromEvent(event);
    if (room) {
      dismissLiveRoomNotification();
      onReturnToRoom(room);
    }
  });

  return unsubscribeForeground;
}

// Must be called at module scope (e.g. index.js), not inside a component —
// this is how notifee delivers taps when the app was backgrounded/killed.
export function registerBackgroundLiveRoomHandler(onReturnToRoom) {
  notifee.onBackgroundEvent(async event => {
    const room = parseRoomFromEvent(event);
    if (room) {
      await dismissLiveRoomNotification();
      onReturnToRoom(room);
    }
  });
}
