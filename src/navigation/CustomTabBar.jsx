import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { DiscoverIcon, FamilyIcon, HomeIcon, MessageIcon, PlusIcon, UserIcon } from '../assets';
import { fetchAudioRoom } from '../api';
import { RoomTitleModal, SEAT_LAYOUT_OPTIONS, SeatLayoutModal, StreamOptionModal } from '../components';
import { useUnreadBadgeCount } from '../hooks';
import { useAppStore } from '../store';
import { useTheme } from '../theme';
import { getCachedSeatState, scaleFont, scaleModerate } from '../utils';
import { routes } from './routes';
const ICONS = {
  HomeTab: HomeIcon,
  DiscoverTab: DiscoverIcon,
  FamilyTab: FamilyIcon,
  MessageTab: MessageIcon,
  MeTab: UserIcon
};
const CENTER_ROUTE = 'FamilyTab';
const BAR_HEIGHT = scaleModerate(64);
const CORNER_RADIUS = scaleModerate(28);
const CENTER_BUTTON_SIZE = scaleModerate(60);
const CENTER_BUTTON_HALO_SIZE = CENTER_BUTTON_SIZE * 1.3;
const DROPLET_SIZE = scaleModerate(38);

// No true fluid/blob-morph renderer in this project (that needs something
// like react-native-skia, which isn't a dependency here) — this is an
// Animated-only approximation of the same idea: one small pill travels
// between icons on a spring (so it overshoots and settles instead of
// snapping), stretching along the direction of travel and squashing
// perpendicular to it while moving, then relaxing back to a circle on
// arrival, with a brief glow pulse the instant it lands.
function LiquidDroplet({ theme, x, stretch, glow }) {
  // Squash inversely with stretch (volume-preserving-ish) but capped
  // gently — at stretch's peak (~1.9) this settles around 0.55, not a
  // near-flat line.
  const squash = Animated.subtract(1, Animated.multiply(Animated.subtract(stretch, 1), 0.5));
  return <Animated.View
      pointerEvents="none"
      style={[styles.dropletWrap, {
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
        transform: [
          { translateX: Animated.subtract(x, DROPLET_SIZE / 2) },
          { scaleX: stretch },
          { scaleY: squash }
        ]
      }]}
    >
      <View style={[styles.droplet, { backgroundColor: theme.colors.teal700, shadowColor: theme.colors.teal700 }]} />
      <Animated.View
        style={[styles.dropletGlowRing, {
          borderColor: theme.colors.teal700,
          opacity: glow,
          transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }]
        }]}
      />
    </Animated.View>;
}

// Two stacked icon layers crossfaded by activeProgress instead of trying
// to interpolate the color prop our SVG icon components take (Animated
// only drives style props automatically; these read color from a plain
// prop) — smoothly fades the muted-gray icon out while the white/pink
// active one fades in, rather than an instant color snap.
function TabItem({ Icon, isFocused, badgeCount, theme, onPress, onMeasured }) {
  const activeProgress = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const bump = React.useRef(new Animated.Value(1)).current;
  const rippleScale = React.useRef(new Animated.Value(0)).current;
  const rippleOpacity = React.useRef(new Animated.Value(0)).current;
  const wasFocused = React.useRef(isFocused);

  React.useEffect(() => {
    if (wasFocused.current === isFocused) {
      return;
    }
    wasFocused.current = isFocused;
    Animated.timing(activeProgress, {
      toValue: isFocused ? 1 : 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
    if (isFocused) {
      // 1.0 -> 1.08 -> 1.0, matching the droplet's own landing timing.
      Animated.sequence([
        Animated.timing(bump, { toValue: 1.08, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(bump, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true })
      ]).start();
    }
  }, [isFocused, activeProgress, bump]);

  const playRipple = () => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.45);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 480, useNativeDriver: true })
    ]).start();
  };

  const handlePress = () => {
    playRipple();
    onPress();
  };

  const lift = activeProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });

  return <Pressable onPress={handlePress} onLayout={onMeasured} style={styles.item}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ripple, {
          backgroundColor: theme.colors.teal700,
          opacity: rippleOpacity,
          transform: [{ scale: rippleScale.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2.6] }) }]
        }]}
      />
      <Animated.View style={{ transform: [{ translateY: lift }, { scale: bump }] }}>
        <Animated.View style={{ opacity: Animated.subtract(1, activeProgress) }}>
          <Icon size={24} color={theme.text.mutedIcon} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeProgress }]}>
          <Icon size={24} color={theme.cta.primary.text} />
        </Animated.View>
      </Animated.View>
      {badgeCount ? <View style={[styles.badge, { backgroundColor: theme.colors.liveBadge }]}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View> : null}
    </Pressable>;
}
export function CustomTabBar({
  state,
  navigation
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const session = useAppStore(store => store.session);
  const sessionToken = session?.token;
  const unreadBadgeCount = useUnreadBadgeCount();
  const [streamOptionsVisible, setStreamOptionsVisible] = React.useState(false);
  const [roomTitleVisible, setRoomTitleVisible] = React.useState(false);
  const [seatLayoutVisible, setSeatLayoutVisible] = React.useState(false);
  const [pendingRoomTitle, setPendingRoomTitle] = React.useState(null);
  const [isCheckingRoom, setIsCheckingRoom] = React.useState(false);
  const defaultRoomTitle = `${session?.user?.fullName || 'My'}'s Room`;

  // Liquid droplet indicator — travels along the row (the shortest,
  // straight-line path) from whichever tab was previously focused to
  // whichever one is focused now, in either direction.
  const itemCentersRef = React.useRef({});
  const hasPositionedDropletRef = React.useRef(false);
  const dropletX = React.useRef(new Animated.Value(0)).current;
  const dropletStretch = React.useRef(new Animated.Value(1)).current;
  const dropletGlow = React.useRef(new Animated.Value(0)).current;
  const centerGlow = React.useRef(new Animated.Value(0)).current;

  const registerItemCenter = index => event => {
    const { x, width } = event.nativeEvent.layout;
    itemCentersRef.current[index] = x + width / 2;
    if (!hasPositionedDropletRef.current && index === state.index) {
      hasPositionedDropletRef.current = true;
      dropletX.setValue(itemCentersRef.current[index]);
    }
  };

  React.useEffect(() => {
    const target = itemCentersRef.current[state.index];
    if (target === undefined || !hasPositionedDropletRef.current) {
      return;
    }
    Animated.parallel([
      Animated.spring(dropletX, { toValue: target, friction: 8, tension: 46, useNativeDriver: true }),
      Animated.sequence([
        // Elastic stretch along the direction of travel while moving...
        Animated.timing(dropletStretch, { toValue: 1.9, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        // ...surface tension pulling it back into a droplet as it lands,
        // with a slight overshoot before settling (spring, not timing).
        Animated.spring(dropletStretch, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true })
      ]),
      Animated.sequence([
        Animated.timing(centerGlow, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(centerGlow, { toValue: 0, duration: 260, useNativeDriver: true })
      ])
    ]).start(() => {
      dropletGlow.setValue(1);
      Animated.timing(dropletGlow, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  }, [state.index, dropletX, dropletStretch, dropletGlow, centerGlow]);

  const closeStreamOptions = () => setStreamOptionsVisible(false);
  const closeRoomTitle = () => setRoomTitleVisible(false);
  const closeSeatLayout = () => setSeatLayoutVisible(false);
  const handleCenterPress = async () => {
    if (isCheckingRoom) {
      return;
    }
    if (state.routes[state.index]?.name === 'DiscoverTab') {
      navigation.navigate(routes.createPost);
      return;
    }
    if (!sessionToken) {
      setStreamOptionsVisible(true);
      return;
    }
    setIsCheckingRoom(true);
    const existingRoom = await fetchAudioRoom(sessionToken);
    setIsCheckingRoom(false);
    const canResumeWithoutAsking =
      existingRoom?.status === 'LIVE' || (existingRoom?.status === 'IDLE' && Boolean(getCachedSeatState(existingRoom.roomId)));
    if (canResumeWithoutAsking) {
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
  return <View style={[styles.wrapper, { paddingBottom: insets.bottom + scaleModerate(15) }]} pointerEvents="box-none">
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
      <View style={[styles.barContainer, { backgroundColor: theme.colors.neutral900 }]}>
        <View style={styles.row}>
          <LiquidDroplet theme={theme} x={dropletX} stretch={dropletStretch} glow={dropletGlow} />
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
                  <View style={[styles.centerButtonHalo, { backgroundColor: theme.colors.neutral900 }]} />
                  {/* A very subtle response (not a real color change) when
                  another tab becomes active — a soft glow pulse borrowed
                  from the same centerGlow driving the droplet's own
                  landing flash, so the center button still feels aware
                  of the switch without competing with it. */}
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.centerButtonPulse, {
                      borderColor: theme.colors.secondary,
                      opacity: centerGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
                      transform: [{ scale: centerGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }]
                    }]}
                  />
                  <LinearGradient
                    colors={[theme.colors.teal700, theme.colors.teal700, theme.colors.vipGoldText]}
                    locations={[0, 0.7, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.centerButton, { borderColor: theme.cta.primary.text, shadowColor: theme.colors.teal700 }]}
                  >
                    <PlusIcon size={36} color={theme.cta.primary.text} />
                  </LinearGradient>
                </Pressable>;
          }
          const badgeCount = route.name === 'MessageTab' ? unreadBadgeCount : 0;
          return <TabItem
            key={route.key}
            Icon={Icon}
            isFocused={isFocused}
            badgeCount={badgeCount}
            theme={theme}
            onPress={onPress}
            onMeasured={registerItemCenter(index)}
          />;
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
    width: '92%',
    height: BAR_HEIGHT,
    borderRadius: CORNER_RADIUS
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(22)
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleModerate(44),
    minHeight: scaleModerate(44)
  },
  ripple: {
    position: 'absolute',
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17)
  },
  // Fills the row's full height and centers the fixed-size blob inside
  // it, so the blob sits vertically centered behind the icon (the icon
  // is a later sibling of LiquidDroplet in the row, so it always paints
  // on top of this, never the other way round) instead of floating in a
  // thin strip above it.
  dropletWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DROPLET_SIZE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  droplet: {
    width: DROPLET_SIZE,
    height: DROPLET_SIZE,
    borderRadius: DROPLET_SIZE / 2,
    opacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: scaleModerate(8),
    elevation: 6
  },
  dropletGlowRing: {
    position: 'absolute',
    width: DROPLET_SIZE,
    height: DROPLET_SIZE,
    borderRadius: DROPLET_SIZE / 2,
    borderWidth: 1.5
  },
  centerButtonPulse: {
    position: 'absolute',
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    borderWidth: 1.5
  },
  badge: {
    position: 'absolute',
    top: scaleModerate(-2),
    right: scaleModerate(4),
    minWidth: scaleModerate(16),
    height: scaleModerate(16),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(3)
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(9),
    fontWeight: '800'
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    borderWidth: scaleModerate(3),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scaleModerate(22),
    elevation: 16
  },
  // Same solid color as barContainer so it reads as part of the bar
  // itself, not a separate layer.
  centerButtonHalo: {
    position: 'absolute',
    width: CENTER_BUTTON_HALO_SIZE,
    height: CENTER_BUTTON_HALO_SIZE,
    borderRadius: CENTER_BUTTON_HALO_SIZE / 2
  }
});
export default CustomTabBar;
