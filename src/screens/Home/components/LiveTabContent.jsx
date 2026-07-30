import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { routes } from '../../../navigation/routes';
import { scaleFont, scaleModerate } from '../../../utils';

// No public "browse all live rooms" API exists on the backend yet — only
// GET /api/audio-rooms (the current user's own rooms). This stays empty
// until that listing endpoint exists, instead of showing fake rooms.
const liveRooms = [];

// DEMO DATA — for a stakeholder walkthrough only, so the Live tab doesn't
// render empty while there's no real "browse all live rooms" endpoint yet.
// Remove this block (and the fallback below) once that endpoint ships and
// liveRooms above is wired up to it.
const DEMO_ACCENT_KEYS = ['teal700', 'giftAccent', 'vipPurple', 'facebookBlue'];
function demoAccentForIndex(index) {
  return theme => theme.colors[DEMO_ACCENT_KEYS[index % DEMO_ACCENT_KEYS.length]];
}
const DEMO_LIVE_ROOMS = [
  { id: 'demo-live-1', hostName: 'Ayesha Khan', hostTag: '@ayeshalive', viewers: '2.4k', accent: demoAccentForIndex(0) },
  { id: 'demo-live-2', hostName: 'Bilal Ahmed', hostTag: '@bilalvibes', viewers: '1.1k', accent: demoAccentForIndex(1) },
  { id: 'demo-live-3', hostName: 'Sara Malik', hostTag: '@sara_talks', viewers: '834', accent: demoAccentForIndex(2) },
  { id: 'demo-live-4', hostName: 'Usman Raza', hostTag: '@usmanmusic', viewers: '612', accent: demoAccentForIndex(3) },
  { id: 'demo-live-5', hostName: 'Hina Farooq', hostTag: '@hinaspeaks', viewers: '389', accent: demoAccentForIndex(0) },
  { id: 'demo-live-6', hostName: 'Danish Iqbal', hostTag: '@danishgaming', viewers: '201', accent: demoAccentForIndex(1) }
];

// Grouped by region instead of individual countries — each chip's flags
// are just the representative countries for that region, not an
// exhaustive list of every country actually included in it.
const regionFilters = [
  { id: 'all', label: 'All', flags: '' },
  { id: 'middle-east', label: 'Middle East', flags: '🇸🇦🇦🇪🇰🇼🇶🇦' },
  { id: 'south-asia', label: 'South Asia', flags: '🇵🇰🇮🇳🇧🇩' },
  { id: 'africa', label: 'Africa', flags: '🇪🇬🇳🇬🇰🇪' },
  { id: 'global', label: 'Global', flags: '🌍' }
];

function LiveBadge() {
  const theme = useTheme();
  return <View style={[styles.liveBadge, {
    backgroundColor: theme.colors.liveBadge
  }]}>
      <Text style={[styles.liveBadgeText, {
      color: theme.cta.primary.text
    }]}>LIVE</Text>
    </View>;
}

function LiveRoomCard({
  item
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const accent = item.accent(theme);
  // DEMO_LIVE_ROOMS ids (see above) route to a static preview screen
  // instead of the real Room screen — a fake roomId there just got stuck
  // "Loading room..." with no seats, since nothing on the backend actually
  // exists for it. Real rooms are completely unaffected.
  const isDemo = item.id.startsWith('demo-');
  const handlePress = () => {
    if (isDemo) {
      navigation.navigate(routes.demoRoom, {
        title: item.hostTag ?? item.hostName,
        hostName: item.hostName,
        hostId: item.id,
        members: item.viewers
      });
      return;
    }
    navigation.navigate(routes.room, { roomId: item.id });
  };
  return <Pressable style={[styles.liveCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={handlePress}>
      <View style={[styles.liveThumb, {
      backgroundColor: accent
    }]}>
        <View style={styles.liveThumbTopRow}>
          <LiveBadge />
          <View style={[styles.liveViewersPill, {
          backgroundColor: theme.colors.teal900
        }]}>
            <Text style={[styles.liveViewers, {
            color: theme.cta.primary.text
          }]}>{item.viewers}</Text>
          </View>
        </View>

        <View style={[styles.liveThumbScrim, {
        backgroundColor: theme.colors.teal900
      }]}>
          <Text style={[styles.liveHostName, {
          color: theme.cta.primary.text
        }]} numberOfLines={1}>
            {item.hostName}
          </Text>
          <Text style={[styles.liveHostTag, {
          color: theme.colors.teal100
        }]} numberOfLines={1}>
            {item.hostTag}
          </Text>
        </View>
      </View>
    </Pressable>;
}

// Same manual tap-detection as PartyBanner's carousel, and for the same
// reason: the row wrapper below has to disable HomeScreen's tab pager the
// instant a touch starts (see onFilterRowScrolling), otherwise the pager
// (also horizontal, one level up) wins the drag before this row's own
// ScrollView ever sees it and the region chips can't be scrolled at all.
// But flipping the pager's native scrollEnabled prop mid-touch makes
// Android cancel any Pressable's in-progress responder chain, so a normal
// <Pressable onPress> here would silently stop registering taps — exactly
// what broke the banner before it switched to tracking touches directly.
const CHIP_TAP_MAX_MOVEMENT = 10;
const CHIP_TAP_MAX_DURATION = 300;

function FilterChip({ region, active, theme, onSelect }) {
  const touchStartRef = React.useRef(null);
  const handleTouchStart = event => {
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      time: Date.now()
    };
  };
  const handleTouchEnd = event => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) {
      return;
    }
    const dx = Math.abs(event.nativeEvent.pageX - start.x);
    const dy = Math.abs(event.nativeEvent.pageY - start.y);
    const duration = Date.now() - start.time;
    if (dx < CHIP_TAP_MAX_MOVEMENT && dy < CHIP_TAP_MAX_MOVEMENT && duration < CHIP_TAP_MAX_DURATION) {
      onSelect(region.id);
    }
  };
  return <View
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
      }}
      style={[styles.filterChip, {
        backgroundColor: active ? theme.colors.teal700 : theme.surfaces.card,
        borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder
      }]}
    >
      <Text style={[styles.filterChipText, {
      color: active ? theme.cta.primary.text : theme.text.secondary
    }]}>{region.flags ? `${region.flags} ${region.label}` : region.label}</Text>
    </View>;
}

function CountryFilterRow({
  activeFilter,
  onSelect,
  onFilterRowScrolling
}) {
  const theme = useTheme();
  const pausedRef = React.useRef(false);
  const handleRowTouchStart = () => {
    if (!pausedRef.current) {
      pausedRef.current = true;
      onFilterRowScrolling?.(true);
    }
  };
  const handleRowTouchEnd = () => {
    if (pausedRef.current) {
      pausedRef.current = false;
      onFilterRowScrolling?.(false);
    }
  };
  return <View onTouchStart={handleRowTouchStart} onTouchEnd={handleRowTouchEnd} onTouchCancel={handleRowTouchEnd}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {regionFilters.map(region => <FilterChip key={region.id} region={region} active={region.id === activeFilter} theme={theme} onSelect={onSelect} />)}
      </ScrollView>
    </View>;
}

function LiveEmptyState() {
  const theme = useTheme();
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, {
      color: theme.text.secondary
    }]}>No live rooms right now. Be the first to go live!</Text>
    </View>;
}

export function LiveTabContent({ onFilterRowScrolling }) {
  const [activeFilter, setActiveFilter] = React.useState('all');
  // Falls back to DEMO_LIVE_ROOMS above whenever the real list is empty —
  // see the comment on that constant.
  const data = liveRooms.length ? liveRooms : DEMO_LIVE_ROOMS;
  return <FlatList data={data} keyExtractor={item => item.id} numColumns={2} columnWrapperStyle={data.length ? styles.liveRow : undefined} contentContainerStyle={styles.liveList} ListHeaderComponent={<CountryFilterRow activeFilter={activeFilter} onSelect={setActiveFilter} onFilterRowScrolling={onFilterRowScrolling} />} ListEmptyComponent={<LiveEmptyState />} renderItem={({
    item
  }) => <LiveRoomCard item={item} />} />;
}

const styles = StyleSheet.create({
  liveList: {
    padding: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  filterRow: {
    alignItems: 'center',
    gap: scaleModerate(8),
    paddingBottom: scaleModerate(16)
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(7)
  },
  filterChipText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  liveRow: {
    gap: scaleModerate(12)
  },
  liveCard: {
    flex: 1,
    borderRadius: scaleModerate(18),
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: scaleModerate(12)
  },
  liveThumb: {
    height: scaleModerate(180),
    padding: scaleModerate(8),
    justifyContent: 'space-between'
  },
  liveThumbTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  liveBadge: {
    alignSelf: 'flex-start',
    borderRadius: scaleModerate(6),
    paddingHorizontal: scaleModerate(6),
    paddingVertical: scaleModerate(2)
  },
  liveBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  liveViewersPill: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(2)
  },
  liveViewers: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  liveThumbScrim: {
    borderRadius: scaleModerate(10),
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(6),
    opacity: 0.82
  },
  liveHostName: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  liveHostTag: {
    fontSize: scaleFont(11),
    marginTop: scaleModerate(1)
  },
  emptyState: {
    paddingVertical: scaleModerate(48),
    paddingHorizontal: scaleModerate(24),
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default LiveTabContent;
