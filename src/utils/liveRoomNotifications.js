import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { endAudioRoom } from '../api/audioRooms';
import { leaveAudioRoom } from '../services/socket';
import { useAppStore } from '../store/useAppStore';

const LIVE_ROOM_CHANNEL_ID = 'live-rooms';
const LIVE_ROOM_NOTIFICATION_ID = 'live-room';
const TOGGLE_MIC_ACTION_ID = 'toggle-mic';
const END_ROOM_ACTION_ID = 'end-room';
// iOS notification-category actions have fixed titles (no per-notification
// override), so both the mic-toggle label ("Pause"/"Unmute") AND the
// secondary action's label ("End" for the owner, "Exit" for anyone else)
// need a category registered per combination up front, with the category
// id itself swapped based on current mute state + role.
const IOS_CATEGORY_OWNER_LIVE = 'live-room-owner-live';
const IOS_CATEGORY_OWNER_MUTED = 'live-room-owner-muted';
const IOS_CATEGORY_VIEWER_LIVE = 'live-room-viewer-live';
const IOS_CATEGORY_VIEWER_MUTED = 'live-room-viewer-muted';

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
          id: IOS_CATEGORY_OWNER_LIVE,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Pause' },
            { id: END_ROOM_ACTION_ID, title: 'End', destructive: true }
          ]
        },
        {
          id: IOS_CATEGORY_OWNER_MUTED,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Unmute' },
            { id: END_ROOM_ACTION_ID, title: 'End', destructive: true }
          ]
        },
        {
          id: IOS_CATEGORY_VIEWER_LIVE,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Pause' },
            { id: END_ROOM_ACTION_ID, title: 'Exit', destructive: true }
          ]
        },
        {
          id: IOS_CATEGORY_VIEWER_MUTED,
          actions: [
            { id: TOGGLE_MIC_ACTION_ID, title: 'Unmute' },
            { id: END_ROOM_ACTION_ID, title: 'Exit', destructive: true }
          ]
        }
      ])
    ]);
  }
  return channelReadyPromise;
}

function iosCategoryFor(room) {
  if (room.isOwner) {
    return room.micMuted ? IOS_CATEGORY_OWNER_MUTED : IOS_CATEGORY_OWNER_LIVE;
  }
  return room.micMuted ? IOS_CATEGORY_VIEWER_MUTED : IOS_CATEGORY_VIEWER_LIVE;
}

// Shown ONLY when the user explicitly chooses "Keep" from the leave dialog
// (RoomScreen) — the room/connection stays genuinely alive, and tapping the
// notification body brings them back to it. Deliberately shown for BOTH the
// owner and a plain listener/speaker who chose Keep, not just the owner —
// anyone who kept their connection alive needs an easy way back in. Must
// NEVER be shown for "Exit Room" (RoomScreen's exitRoom() never calls this).
// The secondary action means something different per role — see
// `room.isOwner`: ends the room for everyone (owner) vs. exits just this
// user's own session (anyone else). The mic-toggle label reflects
// `room.micMuted` at the moment this is called — callers must re-call this
// (not just once) every time mute state changes for the button to stay
// accurate. `room` params are serialized as a JSON string since notifee
// notification data must be string values.
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
        { title: room.isOwner ? 'End' : 'Exit', pressAction: { id: END_ROOM_ACTION_ID } }
      ]
    },
    ios: {
      categoryId: iosCategoryFor(room)
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
// mounted OR the connection is being kept alive via "Keep" (see the
// keepInBackgroundRef-gated unsubscribe in RoomScreen). Lets the mic-toggle
// action drive the real mic/UI state instead of only the notification. If
// the app was fully killed these are unset, so only End/Exit still works
// (via the direct-API fallback below) — there's no local mic state left to
// toggle.
let liveRoomActionHandlers = null;

export function registerLiveRoomActionHandler(handlers) {
  liveRoomActionHandlers = handlers;
  return () => {
    if (liveRoomActionHandlers === handlers) {
      liveRoomActionHandlers = null;
    }
  };
}

// Best-effort direct end/exit when there's no mounted RoomScreen to ask
// (app was fully killed) — otherwise the room (or this user's own
// presence) would sit around indefinitely. Uses whatever session is
// persisted in MMKV rather than React state. Only the OWNER path actually
// ends the room for everyone (endAudioRoom) — a non-owner must never be
// able to trigger that just by pressing their own local notification, so
// their fallback only ever leaves their own session.
async function endOrExitRoomWithoutScreen(room) {
  if (room.isOwner) {
    const token = useAppStore.getState().session?.token;
    if (token) {
      try {
        await endAudioRoom(token);
      } catch {
        // best-effort — still leave the socket room below regardless
      }
    }
  }
  leaveAudioRoom(room.roomId);
}

async function handleNotificationEvent(event, onReturnToRoom) {
  const { type, detail } = event;
  const room = parseRoomFromDetail(detail);
  // Temporary diagnostic — remove once the tap/action issue is confirmed
  // fixed. Logs unconditionally, before the room-parse bailout below, so a
  // failed parse (which would otherwise silently no-op every event type)
  // is visible instead of indistinguishable from "event never fired".
  console.log('[LiveRoomNotification] event', { type, actionId: detail?.pressAction?.id, roomParsed: Boolean(room) });
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
        await endOrExitRoomWithoutScreen(room);
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
