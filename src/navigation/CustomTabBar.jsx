import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { DiscoverIcon, FamilyIcon, HomeIcon, MessageIcon, PlusIcon, UserIcon } from '../assets';
import { fetchAudioRoom } from '../api';
import { RoomTitleModal, SEAT_LAYOUT_OPTIONS, SeatLayoutModal, StreamOptionModal } from '../components';
import { useAppStore } from '../store';
import { useTheme } from '../theme';
import { getCachedSeatState, scaleModerate } from '../utils';
import { routes } from './routes';
const ICONS = {
  HomeTab: HomeIcon,
  DiscoverTab: DiscoverIcon,
  FamilyTab: FamilyIcon,
  MessageTab: MessageIcon,
  MeTab: UserIcon
};
const CENTER_ROUTE = 'FamilyTab';
const BAR_HEIGHT = scaleModerate(78);
const NOTCH_RADIUS = scaleModerate(47);
const CORNER_RADIUS = scaleModerate(32);
function buildBarPath(width) {
  const cx = width / 2;
  const r = NOTCH_RADIUS;
  const margin = scaleModerate(10);
  const dip = r + scaleModerate(10);
  return `
    M${CORNER_RADIUS},0
    H${cx - r - margin}
    C${cx - r},0 ${cx - r},${dip} ${cx},${dip}
    C${cx + r},${dip} ${cx + r},0 ${cx + r + margin},0
    H${width - CORNER_RADIUS}
    Q${width},0 ${width},${CORNER_RADIUS}
    V${BAR_HEIGHT}
    H0
    V${CORNER_RADIUS}
    Q0,0 ${CORNER_RADIUS},0
    Z
  `;
}
export function CustomTabBar({
  state,
  navigation
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useAppStore(store => store.session);
  const sessionToken = session?.token;
  const [barWidth, setBarWidth] = React.useState(0);
  const [streamOptionsVisible, setStreamOptionsVisible] = React.useState(false);
  const [roomTitleVisible, setRoomTitleVisible] = React.useState(false);
  const [seatLayoutVisible, setSeatLayoutVisible] = React.useState(false);
  const [pendingRoomTitle, setPendingRoomTitle] = React.useState(null);
  const [isCheckingRoom, setIsCheckingRoom] = React.useState(false);
  const defaultRoomTitle = `${session?.user?.fullName || 'My'}'s Room`;
  const handleLayout = event => {
    setBarWidth(event.nativeEvent.layout.width);
  };
  const closeStreamOptions = () => setStreamOptionsVisible(false);
  const closeRoomTitle = () => setRoomTitleVisible(false);
  const closeSeatLayout = () => setSeatLayoutVisible(false);
  // Each user only ever owns one persistent, backend-assigned room — see
  // StreamLine-Portal/docs/mobile-audio-room-api.md and the AudioRoom
  // model's @@unique([ownerId]). If it's already LIVE (started from this
  // device or another one, then backgrounded), tapping "+" must resume that
  // exact room instead of walking through the create flow again, which
  // would otherwise restart the same room with a brand-new seat layout and
  // silently drop whoever's already in it.
  const handleCenterPress = async () => {
    if (isCheckingRoom) {
      return;
    }
    if (!sessionToken) {
      setStreamOptionsVisible(true);
      return;
    }
    setIsCheckingRoom(true);
    const existingRoom = await fetchAudioRoom(sessionToken);
    setIsCheckingRoom(false);
    // Backgrounding a room (back gesture/notification) makes the backend
    // auto-release it to IDLE the instant this device's socket leaves the
    // room channel — that's expected per
    // StreamLine-Portal/docs/mobile-audio-room-api.md, not the same thing
    // as the owner explicitly ending it. Both look identical from status
    // alone (IDLE either way), so the local seat cache is what actually
    // tells them apart: explicit "End Room" and any externally-ended path
    // both clear it (see endAudioRoom/handleRoomEndedExternally in
    // RoomScreen), while simply backgrounding never does. If it's still
    // there, this device backgrounded — not ended — that exact room, so
    // "+" should resume it, not walk through the create flow and ask for a
    // seat layout again.
    const canResumeWithoutAsking =
      existingRoom?.status === 'LIVE' || (existingRoom?.status === 'IDLE' && Boolean(getCachedSeatState(existingRoom.roomId)));
    if (canResumeWithoutAsking) {
      // Only audio rooms are ever persisted backend-side today (video mode
      // doesn't call the audio-room API yet). RoomScreen resumes the real
      // layout from its local seat cache when present (same app session,
      // room only backgrounded) — seatGroups here is only a fallback for
      // when that cache was cleared (e.g. the app was killed and
      // relaunched). Picking the smallest layout unconditionally used to
      // silently shrink a bigger room (e.g. 20 seats down to 2) with no
      // warning; instead, size it to fit the room's last-known
      // participantCount (which includes the owner's own non-seat spot,
      // hence the -1), falling back to the largest tier if even that isn't
      // enough.
      const occupiedSeats = Math.max(0, (existingRoom.participantCount ?? 1) - 1);
      const fallbackLayout =
        SEAT_LAYOUT_OPTIONS.find(option => option.groups.reduce((sum, count) => sum + count, 0) >= occupiedSeats) ??
        SEAT_LAYOUT_OPTIONS[SEAT_LAYOUT_OPTIONS.length - 1];
      navigation.navigate(routes.room, {
        roomId: existingRoom.roomId,
        mode: 'audio',
        seatGroups: fallbackLayout.groups
      });
      return;
    }
    setStreamOptionsVisible(true);
  };
  const handleSelectAudio = () => {
    closeStreamOptions();
    setRoomTitleVisible(true);
  };
  // No video pipeline exists yet — RoomScreen's mode:'video' path is just
  // background+chat with no actual video, seats, or controls. Shows an
  // explicit "in development" placeholder instead of that empty shell.
  const handleSelectVideo = () => {
    closeStreamOptions();
    navigation.navigate(routes.comingSoon, {
      title: 'Live Video',
      message: "Live video streaming is still in development. We're working on it — check back soon!"
    });
  };
  const handleConfirmRoomTitle = title => {
    setPendingRoomTitle(title);
    closeRoomTitle();
    setSeatLayoutVisible(true);
  };
  const handleConfirmSeatLayout = seatGroups => {
    closeSeatLayout();
    navigation.navigate(routes.room, { mode: 'audio', seatGroups, roomName: pendingRoomTitle });
  };
  return <View style={[styles.wrapper, { paddingBottom: insets.bottom }]} pointerEvents="box-none">
      <StreamOptionModal
        visible={streamOptionsVisible}
        onClose={closeStreamOptions}
        onSelectAudio={handleSelectAudio}
        onSelectVideo={handleSelectVideo}
      />
      <RoomTitleModal
        visible={roomTitleVisible}
        defaultTitle={defaultRoomTitle}
        onClose={closeRoomTitle}
        onConfirm={handleConfirmRoomTitle}
      />
      <SeatLayoutModal visible={seatLayoutVisible} onClose={closeSeatLayout} onConfirm={handleConfirmSeatLayout} />
      <View style={styles.barContainer} onLayout={handleLayout}>
        {barWidth > 0 ? <Svg width={barWidth} height={BAR_HEIGHT} style={styles.barSvg}>
            <Path d={buildBarPath(barWidth)} fill="#000000" />
          </Svg> : null}

        <View style={styles.row}>
          {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = ICONS[route.name] ?? HomeIcon;
          const isCenter = route.name === CENTER_ROUTE;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          if (isCenter) {
            return <Pressable key={route.key} onPress={handleCenterPress} style={styles.item}>
                  <View style={[styles.centerButton, {
                backgroundColor: theme.colors.teal700,
                borderColor: theme.cta.primary.text
              }]}>
                    <PlusIcon size={30} color={theme.cta.primary.text} />
                  </View>
                </Pressable>;
          }
          return <Pressable key={route.key} onPress={onPress} style={styles.item}>
                <Icon size={26} color={isFocused ? theme.colors.teal700 : theme.text.mutedIcon} />
                {isFocused ? <View style={[styles.dot, {
              backgroundColor: theme.colors.teal700
            }]} /> : null}
              </Pressable>;
        })}
        </View>
      </View>
    </View>;
}
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center'
  },
  barContainer: {
    width: '100%',
    height: BAR_HEIGHT
  },
  barSvg: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(26)
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleModerate(44),
    minHeight: scaleModerate(44)
  },
  dot: {
    position: 'absolute',
    bottom: scaleModerate(-8),
    width: scaleModerate(6),
    height: scaleModerate(6),
    borderRadius: scaleModerate(3)
  },
  centerButton: {
    width: scaleModerate(66),
    height: scaleModerate(66),
    borderRadius: scaleModerate(33),
    marginTop: scaleModerate(-57),
    borderWidth: scaleModerate(3),
    alignItems: 'center',
    justifyContent: 'center'
  }
});
export default CustomTabBar;
