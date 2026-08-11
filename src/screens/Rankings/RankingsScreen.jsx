import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { rankingBackgroundImage } from '../../assets';
import { RANK1_CROP, RANK1_GOLDEN_CARD_SVG } from '../../assets/rank1GoldenCardSvg';
import { RANK2_CARD_SVG, RANK2_CROP } from '../../assets/rank2CardSvg';
import { RANK3_CARD_SVG, RANK3_CROP } from '../../assets/rank3CardSvg';
import { useTheme } from '../../theme';
import { Avatar, Screen, VerifiedTick } from '../../components';
import { fetchRankings } from '../../api';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';
import { FilterPill, GlassPanel, hexToRgba, PeriodPill } from './components/RankingControls';

const FILTERS = [
  { key: 'overall', label: 'Overall', emoji: '🏆' },
  { key: 'streamers', label: 'Streamers', emoji: '🎤' },
  { key: 'listeners', label: 'Listeners', emoji: '🎧' },
  { key: 'liveRooms', label: 'Live Rooms', emoji: '📡' },
  { key: 'earners', label: 'Earners', emoji: '💰' }
];

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'allTime', label: 'All Time' }
];

function formatCoins(value) {
  return Number(value).toLocaleString();
}

// The API returns a generic `score` (its meaning depends on the selected
// filter/type — gift coins, live-room activity, etc.), while the podium
///row components below were built around a `coins` field. Map it over so
// those components don't need to change.
function toDisplayEntry(entry) {
  return { ...entry, coins: Number(entry.score ?? 0) };
}


const RANK_ACCENT_COLOR = { 2: '#B77CFF', 3: '#FFB05A' };
const RANK_CARD_ASSET = {
  2: { svg: RANK2_CARD_SVG, crop: RANK2_CROP },
  3: { svg: RANK3_CARD_SVG, crop: RANK3_CROP }
};

// Converts a coordinate from a card asset's original 600x700 artboard
// into a position inside its cropped, rendered element — subtract the
// crop's own offset, then scale by how many real pixels one artboard
// unit is worth along that axis.
function assetCardPx(value, crop, unitForAxis, axis) {
  return (value - crop[axis]) * unitForAxis;
}

// The frame renders taller than the card artwork's own natural aspect
// ratio — the art stays centered and undistorted inside it (default
// preserveAspectRatio, uniform scale-by-width), so topGap (the resulting
// empty space split evenly above and below the art) gets added to every
// y position to land back on the actual artwork instead of that padding.
const METAL_HEIGHT_STRETCH = 1.25;

function MetalPodiumCard({ entry, onPress }) {
  const theme = useTheme();
  const { svg, crop } = RANK_CARD_ASSET[entry.rank];
  const accent = RANK_ACCENT_COLOR[entry.rank];
  const [cardWidth, setCardWidth] = React.useState(0);
  const unit = cardWidth / crop.width;
  const topGap = (unit * crop.height * (METAL_HEIGHT_STRETCH - 1)) / 2;

  return <View style={[styles.podiumWrap, styles.podiumWrapMetal]}>
      <Pressable onPress={onPress} style={[styles.goldenCardWrap, styles.metalCardWrapWide, { aspectRatio: crop.width / (crop.height * METAL_HEIGHT_STRETCH) }]} onLayout={event => setCardWidth(event.nativeEvent.layout.width)}>
        <SvgXml xml={svg} width="100%" height="100%" style={StyleSheet.absoluteFill} />
        {cardWidth > 0 ? <>
            <View style={[styles.goldenAvatarSlot, { left: assetCardPx(214, crop, unit, 'x'), top: assetCardPx(206, crop, unit, 'y') + topGap, width: unit * 172, height: unit * 172, borderRadius: unit * 86 }]}>
              <Avatar value={entry.profileImage} fullName={entry.fullName} size={unit * 172} />
            </View>
            <View style={[styles.goldenInfoSlot, { left: assetCardPx(92, crop, unit, 'x'), top: assetCardPx(418, crop, unit, 'y') + topGap, width: unit * 416 }]}>
              <View style={styles.podiumNameRow}>
                <Text style={[styles.podiumName, { color: theme.text.primary, fontSize: Math.max(scaleFont(11), unit * 26) }]} numberOfLines={1}>{entry.fullName}</Text>
                {entry.isOfficial ? <VerifiedTick size={Math.max(11, unit * 18)} /> : null}
              </View>
              <View style={[styles.podiumCoinsPill, { borderColor: hexToRgba(accent, 0.5), backgroundColor: hexToRgba(accent, 0.14), marginTop: -unit * 10, marginBottom: scaleModerate(10) }]}>
                <Text style={[styles.podiumCoinsIcon, { fontSize: Math.max(scaleFont(9), unit * 16) }]}>💎</Text>
                <Text style={[styles.podiumCoinsText, { color: accent, fontSize: Math.max(scaleFont(9), unit * 16) }]}>{formatCoins(entry.coins)}</Text>
              </View>
            </View>
          </> : null}
      </Pressable>
    </View>;
}

// The frame is 10% taller than the card artwork's own natural aspect
// ratio (see goldenCardWrapNarrow), but the artwork itself stays
// undistorted inside it (no preserveAspectRatio="none" — that stretched
// the gold ring into an oval) — react-native-svg's default "meet"
// behavior scales it uniformly by width and centers it, leaving an equal
// gap above and below. topGap is that gap, added to every y position so
// the avatar/name/coins still land on the actual (centered, unstretched)
// artwork instead of the empty padding around it.
const GOLDEN_HEIGHT_STRETCH = 1.1;

function GoldenRank1Card({ entry, onPress }) {
  const theme = useTheme();
  const [cardWidth, setCardWidth] = React.useState(0);
  const unit = cardWidth / RANK1_CROP.width;
  const topGap = (unit * RANK1_CROP.height * (GOLDEN_HEIGHT_STRETCH - 1)) / 2;

  return <View style={[styles.podiumWrap, styles.podiumWrapFirst]}>
      <Pressable onPress={onPress} style={[styles.goldenCardWrap, styles.goldenCardWrapNarrow]} onLayout={event => setCardWidth(event.nativeEvent.layout.width)}>
        <SvgXml xml={RANK1_GOLDEN_CARD_SVG} width="100%" height="100%" style={StyleSheet.absoluteFill} />
        {cardWidth > 0 ? <>
            <View style={[styles.goldenAvatarSlot, { left: assetCardPx(214, RANK1_CROP, unit, 'x'), top: assetCardPx(206, RANK1_CROP, unit, 'y') + topGap, width: unit * 172, height: unit * 172, borderRadius: unit * 86 }]}>
              <Avatar value={entry.profileImage} fullName={entry.fullName} size={unit * 172} />
            </View>
            <View style={[styles.goldenInfoSlot, { left: assetCardPx(92, RANK1_CROP, unit, 'x'), top: assetCardPx(418, RANK1_CROP, unit, 'y') + topGap, width: unit * 416 }]}>
              <View style={styles.podiumNameRow}>
                <Text style={[styles.podiumName, { color: theme.text.primary, fontSize: Math.max(scaleFont(12), unit * 30) }]} numberOfLines={1}>{entry.fullName}</Text>
                {entry.isOfficial ? <VerifiedTick size={Math.max(12, unit * 20)} /> : null}
              </View>
              <View style={[styles.podiumCoinsPill, { borderColor: hexToRgba(theme.colors.vipGoldText, 0.5), backgroundColor: hexToRgba(theme.colors.vipGoldText, 0.14), marginTop: -unit * 14 }]}>
                <Text style={[styles.podiumCoinsIcon, { fontSize: Math.max(scaleFont(9), unit * 18) }]}>💎</Text>
                <Text style={[styles.podiumCoinsText, { color: theme.colors.vipGoldText, fontSize: Math.max(scaleFont(9), unit * 18) }]}>{formatCoins(entry.coins)}</Text>
              </View>
            </View>
          </> : null}
      </Pressable>
    </View>;
}

function PodiumCard({ entry, onPress }) {
  if (entry.rank === 1) {
    return <GoldenRank1Card entry={entry} onPress={onPress} />;
  }

  return <MetalPodiumCard entry={entry} onPress={onPress} />;
}

function RankingRow({ entry, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.row, { borderColor: theme.colors.cardBorder }]}>
      <Text style={[styles.rowRank, { color: theme.text.secondary }]}>{entry.rank}</Text>
      <Avatar value={entry.profileImage} fullName={entry.fullName} size={scaleModerate(36)} style={styles.rowAvatar} />
      <View style={styles.rowNameWrap}>
        <View style={styles.rowNameRow}>
          <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{entry.fullName}</Text>
          {entry.isOfficial ? <VerifiedTick size={12} /> : null}
        </View>
      </View>
      <Text style={[styles.rowFollowers, { color: theme.text.secondary }]}>{entry.followers != null ? entry.followers.toLocaleString() : '—'}</Text>
      <View style={styles.rowLiveWrap}>
        {entry.isLive ? <View style={styles.rowLiveDotRow}>
            <View style={[styles.rowLiveDot, { backgroundColor: theme.colors.liveBadge }]} />
            <Text style={[styles.rowLiveText, { color: theme.colors.liveBadge }]}>LIVE</Text>
          </View> : <Text style={[styles.rowOfflineText, { color: theme.text.secondary }]}>Offline</Text>}
      </View>
      <View style={styles.rowCoinsWrap}>
        <Text style={[styles.rowCoinsText, { color: theme.colors.vipGoldText }]}>{formatCoins(entry.coins)}</Text>
        <Text style={styles.rowCoinsIcon}>🪙</Text>
      </View>
      <Text style={[styles.rowChevron, { color: theme.text.secondary }]}>›</Text>
    </Pressable>;
}

export function RankingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sessionToken = useAppStore(state => state.session?.token);
  const [filter, setFilter] = React.useState('overall');
  const [period, setPeriod] = React.useState('today');
  const [tableWidth, setTableWidth] = React.useState(0);
  const periodPagerRef = React.useRef(null);
  // Keyed by period — the server scopes both podium and rankings to the
  // current filter+period in one response, so switching filters clears
  // this cache (see the effect below) rather than trying to merge results
  // that no longer mean the same thing.
  const [periodData, setPeriodData] = React.useState({});
  const [loadingPeriods, setLoadingPeriods] = React.useState({});

  React.useEffect(() => {
    setPeriodData({});
  }, [filter]);

  React.useEffect(() => {
    if (!sessionToken || periodData[period] || loadingPeriods[period]) {
      return;
    }
    setLoadingPeriods(current => ({ ...current, [period]: true }));
    fetchRankings(sessionToken, { type: filter, period, limit: 20 })
      .then(data => {
        setPeriodData(current => ({ ...current, [period]: data }));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingPeriods(current => ({ ...current, [period]: false }));
      });
  }, [sessionToken, filter, period, periodData, loadingPeriods]);

  const activeData = periodData[period];
  const podium = (activeData?.podium ?? []).map(toDisplayEntry);
  const isLoadingActive = Boolean(loadingPeriods[period]) && !activeData;

  const openProfile = publicId => navigation.navigate('UserProfile', { publicId });

  const handleSelectPeriod = key => {
    setPeriod(key);
    const index = PERIODS.findIndex(item => item.key === key);
    periodPagerRef.current?.scrollTo({ x: index * tableWidth, animated: true });
  };

  const handlePeriodPagerScrollEnd = event => {
    if (!tableWidth) {
      return;
    }
    const index = Math.round(event.nativeEvent.contentOffset.x / tableWidth);
    setPeriod(PERIODS[index]?.key ?? PERIODS[0].key);
  };

  return <ImageBackground source={rankingBackgroundImage} resizeMode="cover" style={[styles.background, { backgroundColor: theme.surfaces.page }]}>
      <Screen transparent>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.hero, { paddingTop: insets.top + scaleModerate(10) }]}>
          <View style={styles.heroHeaderRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
              <Text style={styles.heroBack}>‹</Text>
            </Pressable>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.heroTitle}>Rankings</Text>
          <Text style={styles.heroSubtitle}>
            Compete. <Text style={{ color: theme.colors.teal400 }}>Rise.</Text> <Text style={{ color: theme.colors.secondary }}>Get Noticed.</Text>
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(item => <FilterPill key={item.key} filter={item} active={item.key === filter} onPress={() => setFilter(item.key)} styles={styles} />)}
        </ScrollView>

        <View style={styles.podiumRow}>
          {podium.length > 0 ? (
            // Visual podium order is 2nd-place, 1st-place, 3rd-place
            // (left to right) — the server always returns rank-ascending.
            [...podium].sort((a, b) => [2, 1, 3].indexOf(a.rank) - [2, 1, 3].indexOf(b.rank)).map(entry => <PodiumCard key={entry.publicId} entry={entry} onPress={() => openProfile(entry.publicId)} />)
          ) : isLoadingActive ? (
            <Text style={[styles.emptyRankingsText, styles.emptyRankingsTextLight]}>Loading leaderboard...</Text>
          ) : (
            <Text style={[styles.emptyRankingsText, styles.emptyRankingsTextLight]}>No rankings yet.</Text>
          )}
        </View>

        <View style={styles.periodScrollContent}>
          <GlassPanel style={[styles.periodRow, { borderColor: theme.colors.cardBorder }]}>
            {PERIODS.map(item => <PeriodPill key={item.key} period={item} active={item.key === period} onPress={() => handleSelectPeriod(item.key)} styles={styles} />)}
          </GlassPanel>
        </View>

        <GlassPanel style={[styles.tableCard, { borderColor: theme.colors.cardBorder }]} onLayout={event => setTableWidth(event.nativeEvent.layout.width)}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderRank, { color: theme.colors.tertiary }]}>Rank</Text>
            <Text style={[styles.tableHeaderName, { color: theme.colors.tertiary }]}>Streamer</Text>
            <Text style={[styles.tableHeaderFollowers, { color: theme.colors.tertiary }]}>Followers</Text>
            <Text style={[styles.tableHeaderLive, { color: theme.colors.tertiary }]}>Live Stream</Text>
            <Text style={[styles.tableHeaderCoins, { color: theme.colors.tertiary }]}>Total Coins</Text>
          </View>
          {tableWidth > 0 ? <ScrollView
              ref={periodPagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handlePeriodPagerScrollEnd}
            >
              {PERIODS.map(item => {
                const pageData = periodData[item.key];
                const pageRows = (pageData?.rankings ?? []).map(toDisplayEntry);
                return <View key={item.key} style={{ width: tableWidth }}>
                    {pageRows.length > 0 ? (
                      pageRows.map(entry => <RankingRow key={entry.publicId} entry={entry} onPress={() => openProfile(entry.publicId)} />)
                    ) : (
                      <Text style={[styles.emptyRankingsText, { color: theme.text.secondary }]}>
                        {loadingPeriods[item.key] && !pageData ? 'Loading...' : 'No rankings yet for this period.'}
                      </Text>
                    )}
                  </View>;
              })}
            </ScrollView> : null}
        </GlassPanel>

        <Pressable>
          <GlassPanel style={[styles.viewFullButton, { borderColor: theme.colors.cardBorder }]}>
            <Text style={[styles.viewFullText, { color: theme.text.primary }]}>View Full Rankings</Text>
            <Text style={[styles.viewFullChevron, { color: theme.text.primary }]}>›</Text>
          </GlassPanel>
        </Pressable>

        <GlassPanel style={[styles.climbCard, { borderColor: theme.colors.cardBorder }]}>
          <Text style={styles.climbTrophy}>🏆</Text>
          <View style={styles.climbTextWrap}>
            <Text style={[styles.climbTitle, { color: theme.text.primary }]}>Climb the Leaderboard</Text>
            <Text style={[styles.climbSubtitle, { color: theme.text.secondary }]}>Earn more. Get recognized. Win rewards.</Text>
          </View>
          <View style={styles.climbTierWrap}>
            <Text style={styles.climbTier}>💎 100</Text>
            <Text style={[styles.climbTierLabel, { color: theme.text.secondary }]}>Rank 10</Text>
          </View>
          <View style={styles.climbTierWrap}>
            <Text style={styles.climbTier}>💎 500</Text>
            <Text style={[styles.climbTierLabel, { color: theme.text.secondary }]}>Top 5</Text>
          </View>
          <View style={styles.climbTierWrap}>
            <Text style={styles.climbTier}>💎 1,000</Text>
            <Text style={[styles.climbTierLabel, { color: theme.text.secondary }]}>Top 1</Text>
          </View>
          <Text style={[styles.climbChevron, { color: theme.text.secondary }]}>›</Text>
        </GlassPanel>
      </ScrollView>
      </Screen>
    </ImageBackground>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: scaleModerate(28)
  },
  hero: {
    paddingHorizontal: scaleModerate(20),
    paddingBottom: scaleModerate(18)
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  heroBack: {
    color: '#FFFFFF',
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: scaleFont(30),
    fontWeight: '900',
    marginTop: scaleModerate(8)
  },
  heroSubtitle: {
    color: '#E4E4EA',
    fontSize: scaleFont(13),
    fontWeight: '600',
    marginTop: scaleModerate(4)
  },
  filterRow: {
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(14),
    gap: scaleModerate(8)
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9),
    gap: scaleModerate(6)
  },
  filterPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9),
    gap: scaleModerate(6)
  },
  filterPillIcon: {
    fontSize: scaleFont(14)
  },
  filterPillText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(12),
    gap: scaleModerate(10),
    marginBottom: scaleModerate(18)
  },
  podiumWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: scaleModerate(22)
  },
  podiumWrapFirst: {
    flex: 1.62,
    paddingTop: 0
  },
  podiumWrapMetal: {
    paddingTop: scaleModerate(6)
  },
  metalCardWrapWide: {
    width: '112%'
  },
  goldenCardWrap: {
    width: '100%',
    aspectRatio: RANK1_CROP.width / RANK1_CROP.height
  },
  goldenCardWrapNarrow: {
    width: '90%',
    alignSelf: 'center',
    aspectRatio: RANK1_CROP.width / (RANK1_CROP.height * 1.1)
  },
  goldenAvatarSlot: {
    position: 'absolute',
    overflow: 'hidden'
  },
  goldenInfoSlot: {
    position: 'absolute',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  podiumNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4),
    maxWidth: '100%'
  },
  podiumName: {
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  podiumCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(3),
    marginTop: scaleModerate(8),
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  podiumCoinsIcon: {
    fontSize: scaleFont(11)
  },
  podiumCoinsText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  periodScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(16),
    marginBottom: scaleModerate(16)
  },
  periodRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    padding: scaleModerate(4),
    gap: scaleModerate(2)
  },
  periodPill: {
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  periodPillActive: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  periodPillText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  tableCard: {
    marginHorizontal: scaleModerate(16),
    borderWidth: 1,
    borderRadius: scaleModerate(16),
    overflow: 'hidden',
    paddingVertical: scaleModerate(8)
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(12),
    paddingBottom: scaleModerate(8)
  },
  tableHeaderRank: {
    width: scaleModerate(24),
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  tableHeaderName: {
    flex: 1,
    marginLeft: scaleModerate(8),
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  tableHeaderFollowers: {
    width: scaleModerate(56),
    textAlign: 'center',
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  tableHeaderLive: {
    width: scaleModerate(56),
    textAlign: 'center',
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  tableHeaderCoins: {
    width: scaleModerate(72),
    textAlign: 'right',
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(10),
    borderTopWidth: StyleSheet.hairlineWidth
  },
  rowRank: {
    width: scaleModerate(24),
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  rowAvatar: {
    marginLeft: scaleModerate(8)
  },
  rowNameWrap: {
    flex: 1,
    marginLeft: scaleModerate(8)
  },
  rowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  rowName: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  rowFollowers: {
    width: scaleModerate(56),
    textAlign: 'center',
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  rowLiveWrap: {
    width: scaleModerate(56),
    alignItems: 'center'
  },
  rowLiveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  rowLiveDot: {
    width: scaleModerate(6),
    height: scaleModerate(6),
    borderRadius: 999
  },
  rowLiveText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  rowOfflineText: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  rowCoinsWrap: {
    width: scaleModerate(72),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scaleModerate(3)
  },
  rowCoinsText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  rowCoinsIcon: {
    fontSize: scaleFont(11)
  },
  rowChevron: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginLeft: scaleModerate(4)
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: scaleModerate(18),
    paddingVertical: scaleModerate(9),
    marginTop: scaleModerate(14),
    gap: scaleModerate(4)
  },
  viewFullText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  viewFullChevron: {
    fontSize: scaleFont(15),
    fontWeight: '700'
  },
  climbCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scaleModerate(16),
    marginTop: scaleModerate(16),
    borderWidth: 1,
    borderRadius: scaleModerate(16),
    overflow: 'hidden',
    padding: scaleModerate(14),
    gap: scaleModerate(10)
  },
  climbTrophy: {
    fontSize: scaleFont(22)
  },
  climbTextWrap: {
    flex: 1,
    marginRight: scaleModerate(4)
  },
  climbTitle: {
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  climbSubtitle: {
    fontSize: scaleFont(10),
    marginTop: scaleModerate(2)
  },
  climbTierWrap: {
    alignItems: 'center'
  },
  climbTier: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    color: '#F0B93D'
  },
  climbTierLabel: {
    fontSize: scaleFont(9),
    marginTop: scaleModerate(2)
  },
  climbChevron: {
    fontSize: scaleFont(16),
    fontWeight: '700'
  },
  emptyRankingsText: {
    paddingVertical: scaleModerate(20),
    paddingHorizontal: scaleModerate(16),
    textAlign: 'center',
    fontSize: scaleFont(11.5)
  },
  emptyRankingsTextLight: {
    color: '#E4E4EA'
  }
});

export default RankingsScreen;
