import React from 'react';
import { FlatList, ImageBackground, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';
import { routes } from '../../../navigation/routes';
import { fetchDiscoverRooms } from '../../../api';
import { useAppStore } from '../../../store';
import { RegionFilterRow } from '../../../components';
import { matchesRegionFilter } from '../../../data/regions';
import { scaleFont, scaleModerate } from '../../../utils';

// GET /api/audio-rooms/discover is the same public listing endpoint the
// Party tab already uses (see PartyTabContent's toPartyItem) — reused here
// instead of the old hardcoded-empty liveRooms array, so this tab shows
// real live rooms too instead of always falling back to demo data.
function toLiveItem(room, index) {
  return {
    id: room.roomId,
    hostName: room.owner?.name ?? 'Unknown host',
    hostTag: room.title,
    viewers: room.participantCount,
    country: room.country ?? null,
    photo: room.roomBackgroundUrl ?? room.owner?.profileImage ?? personPhotoForIndex(index)
  };
}


function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/400?img=${(index % 70) + 1}`;
}

// DEMO DATA — for a stakeholder walkthrough only, so the Live tab doesn't
// render empty while there's no real "browse all live rooms" endpoint yet.
// Remove this block (and the fallback below) once that endpoint ships and
// liveRooms above is wired up to it.
const DEMO_LIVE_ROOMS = [
  { id: 'demo-live-1', hostName: 'Usaid Khan', hostTag: '@usaidlive', viewers: '2.4k', photo: personPhotoForIndex(11) },
  { id: 'demo-live-2', hostName: 'Bilal Ahmed', hostTag: '@bilalvibes', viewers: '1.1k', photo: personPhotoForIndex(12) },
  { id: 'demo-live-3', hostName: 'Usman Raza', hostTag: '@usmanraza', viewers: '834', photo: personPhotoForIndex(13) },
  { id: 'demo-live-4', hostName: 'Saad Malik', hostTag: '@saadmalik', viewers: '612', photo: personPhotoForIndex(14) },
  { id: 'demo-live-5', hostName: 'Hina Farooq', hostTag: '@hinafarooq', viewers: '389', photo: personPhotoForIndex(15) },
  { id: 'demo-live-6', hostName: 'Danish Iqbal', hostTag: '@danishiqbal', viewers: '201', photo: personPhotoForIndex(16) }
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
    // Matches PartyTabContent's real-room navigation — mode/asViewer are
    // required for RoomScreen to treat this as joining someone else's live
    // room instead of defaulting to starting the viewer's own.
    navigation.navigate(routes.room, { roomId: item.id, roomName: item.hostTag, mode: 'audio', asViewer: true });
  };
  return <Pressable style={[styles.liveCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={handlePress}>
      <ImageBackground source={{ uri: item.photo }} style={styles.liveThumb}>
        <View style={styles.liveThumbTopRow}>
          <LiveBadge />
          <View style={styles.liveViewersPill}>
            <Text style={styles.liveViewersEye}>👁</Text>
            <Text style={styles.liveViewers}>{item.viewers}</Text>
          </View>
        </View>

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.liveThumbScrim} pointerEvents="none" />
        <View style={styles.liveHostRow}>
          <View style={[styles.liveHostAvatarRing, { borderColor: theme.colors.teal700 }]}>
            <Text style={styles.liveHostAvatarGlyph}>👤</Text>
          </View>
          <View style={styles.liveHostTextWrap}>
            <Text style={styles.liveHostName} numberOfLines={1}>
              {item.hostName}
            </Text>
            <Text style={styles.liveHostTag} numberOfLines={1}>
              {item.hostTag}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>;
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
  const theme = useTheme();
  const sessionToken = useAppStore(store => store.session?.token);
  const regionFilter = useAppStore(store => store.regionFilter);
  const [liveRooms, setLiveRooms] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadLiveRooms = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    const rooms = await fetchDiscoverRooms(sessionToken);
    setLiveRooms(rooms.map(toLiveItem));
  }, [sessionToken]);

  // Refetch every time the Live tab is focused, same as the Party tab, so a
  // room started since the last visit shows up without a full app restart.
  useFocusEffect(
    React.useCallback(() => {
      loadLiveRooms();
    }, [loadLiveRooms])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLiveRooms().catch(() => {});
    setRefreshing(false);
  };

  // Falls back to DEMO_LIVE_ROOMS above whenever the real list is empty —
  // see the comment on that constant. Demo rooms have no country, so they
  // only show up while the "All" region filter is active.
  const filteredLiveRooms = liveRooms.filter(item => matchesRegionFilter(item.country, regionFilter));
  const data = filteredLiveRooms.length ? filteredLiveRooms : liveRooms.length ? [] : DEMO_LIVE_ROOMS;
  return <FlatList
      data={data}
      keyExtractor={item => item.id}
      numColumns={2}
      columnWrapperStyle={data.length ? styles.liveRow : undefined}
      contentContainerStyle={styles.liveList}
      ListHeaderComponent={<RegionFilterRow onFilterRowScrolling={onFilterRowScrolling} />}
      ListEmptyComponent={<LiveEmptyState />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.teal700}
          colors={[theme.colors.teal700]}
          progressBackgroundColor={theme.surfaces.card}
        />
      }
      renderItem={({ item }) => <LiveRoomCard item={item} />}
    />;
}

const styles = StyleSheet.create({
  liveList: {
    padding: scaleModerate(16),
    paddingBottom: scaleModerate(28)
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
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  liveBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  liveViewersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(3)
  },
  liveViewersEye: {
    fontSize: scaleFont(11)
  },
  liveViewers: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  liveThumbScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%'
  },
  liveHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  liveHostAvatarRing: {
    width: scaleModerate(24),
    height: scaleModerate(24),
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  liveHostAvatarGlyph: {
    fontSize: scaleFont(11)
  },
  liveHostTextWrap: {
    flex: 1
  },
  liveHostName: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  liveHostTag: {
    color: '#E4B8D0',
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
