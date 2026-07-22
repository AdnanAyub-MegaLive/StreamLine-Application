import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { endAudioRoom } from '../api/audioRooms';
import { leaveAudioRoom } from '../services/socket';
import { useAppStore } from '../store/useAppStore';

const LIVE_ROOM_CHANNEL_ID = 'live-rooms';
const LIVE_ROOM_NOTIFICATION_ID = 'live-room';
const TOGGLE_MIC_ACTION_ID = 'toggle-mic';
const END_ROOM_ACTION_ID = 'end-room';
// iOS notification-category actions have fixed titles (no per-notification
// override), so the mic-toggle button's changing label ("Pause"/"Unmute")
// needs two categories registered up front, with the category id itself
// swapped based on the current mute state.
const IOS_CATEGORY_LIVE = 'live-room-live';
const IOS_CATEGORY_MUTED = 'live-room-muted';

let channelReadyPromise = null;

function ensureLiveRoomChannel() {
  if (!channelReadyPromise) {
    channelReadyPromise = Promise.all([
      notifee.createChannel({
        id: LIVE_ROOM_CHANNEL_ID,
        name: 'Live Rooms',
        importance: AndroidImportance.HIGH
      }),
      notifee.setNotificationCategories([
        {
          id: IOS_CATEGORY_LIVE,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Pause' },
            { id: END_ROOM_ACTION_ID, title: 'End', destructive: true }
          ]
        },
        {
          id: IOS_CATEGORY_MUTED,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Unmute' },
            { id: END_ROOM_ACTION_ID, title: 'End', destructive: true }
          ]
        }
      ])
    ]);
  }
  return channelReadyPromise;
}

// Shown when the user backgrounds a live audio room (back gesture, header
// close button, or just minimizing the app) instead of ending it — the room
// keeps running, and tapping the notification body brings them back to it.
// The "Pause"/"Unmute" action button's label reflects `room.micMuted` at the
// moment this is called — callers must re-call this (not just once) every
// time mute state changes for the button to stay accurate. `room` params
// are serialized as a JSON string since notifee notification data must be
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
      autoCancel: false,
      actions: [
        { title: room.micMuted ? 'Unmute' : 'Pause', pressAction: { id: TOGGLE_MIC_ACTION_ID } },
        { title: 'End', pressAction: { id: END_ROOM_ACTION_ID } }
      ]
    },
    ios: {
      categoryId: room.micMuted ? IOS_CATEGORY_MUTED : IOS_CATEGORY_LIVE
    }
  });
}

export async function dismissLiveRoomNotification() {
  await notifee.cancelNotification(LIVE_ROOM_NOTIFICATION_ID);
}

function parseRoomFromDetail(detail) {
  const raw = detail?.notification?.data?.room;
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Set by RoomScreen (via registerLiveRoomActionHandler) for as long as it's
// mounted — i.e. the app process is alive and the user is still "in" the
// room, just backgrounded. Lets the mic-toggle action drive the real
// mic/UI state instead of only the notification. If the app was fully
// killed these are unset, so only "End" still works (via the direct-API
// fallback below) — there's no local mic state left to toggle.
let liveRoomActionHandlers = null;

export function registerLiveRoomActionHandler(handlers) {
  liveRoomActionHandlers = handlers;
  return () => {
    if (liveRoomActionHandlers === handlers) {
      liveRoomActionHandlers = null;
    }
  };
}

// Best-effort direct end when there's no mounted RoomScreen to ask (app was
// fully killed) — otherwise the room would sit LIVE indefinitely. Uses
// whatever session is persisted in MMKV rather than React state.
async function endRoomWithoutScreen(room) {
  const token = useAppStore.getState().session?.token;
  if (token) {
    try {
      await endAudioRoom(token);
    } catch {
      // best-effort — still leave the socket room below regardless
    }
  }
  leaveAudioRoom(room.roomId);
}

async function handleNotificationEvent(event, onReturnToRoom) {
  const { type, detail } = event;
  const room = parseRoomFromDetail(detail);
  if (!room) {
    return;
  }

  if (type === EventType.ACTION_PRESS) {
    const actionId = detail.pressAction?.id;
    if (actionId === TOGGLE_MIC_ACTION_ID) {
      liveRoomActionHandlers?.onToggleMic?.(room);
      return;
    }
    if (actionId === END_ROOM_ACTION_ID) {
      if (liveRoomActionHandlers?.onEndRoom) {
        liveRoomActionHandlers.onEndRoom(room);
      } else {
        await endRoomWithoutScreen(room);
      }
      await dismissLiveRoomNotification();
    }
    return;
  }

  if (type === EventType.PRESS) {
    await dismissLiveRoomNotification();
    onReturnToRoom(room);
  }
}

// Registered once from App.jsx — routes a notification tap/action back into
// the Room screen (or performs the action directly) with the same params it
// had when backgrounded.
export function registerLiveRoomNotificationTapHandler(onReturnToRoom) {
  return notifee.onForegroundEvent(event => {
    handleNotificationEvent(event, onReturnToRoom).catch(() => {});
  });
}

// Must be called at module scope (e.g. index.js), not inside a component —
// this is how notifee delivers taps/actions when the app was
// backgrounded/killed.
export function registerBackgroundLiveRoomHandler(onReturnToRoom) {
  notifee.onBackgroundEvent(event => handleNotificationEvent(event, onReturnToRoom));
}
