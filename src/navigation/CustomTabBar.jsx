import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DiscoverIcon, FamilyIcon, HomeIcon, LiveCameraIcon, MessageIcon, UserIcon } from '../assets';
import { useTheme } from '../theme';
import { scaleModerate } from '../utils';
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
  const [barWidth, setBarWidth] = React.useState(0);
  const handleLayout = event => {
    setBarWidth(event.nativeEvent.layout.width);
  };
  return <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.barContainer} onLayout={handleLayout}>
        {barWidth > 0 ? <Svg width={barWidth} height={BAR_HEIGHT} style={styles.barSvg}>
            <Path d={buildBarPath(barWidth)} fill={theme.surfaces.card} />
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
            return <Pressable key={route.key} onPress={onPress} style={styles.item}>
                  <View style={[styles.centerButton, {
                backgroundColor: theme.colors.teal700
              }]}>
                    <LiveCameraIcon size={34} color="#FFFFFF" />
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
    alignItems: 'center',
    paddingBottom: scaleModerate(22),
    paddingHorizontal: scaleModerate(16)
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
    alignItems: 'center',
    justifyContent: 'center'
  }
});
export default CustomTabBar;
