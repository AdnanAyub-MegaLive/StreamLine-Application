import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchDiscoverRooms } from '../../../api';
import { useAppStore } from '../../../store';
import { useTheme } from '../../../theme';
import { routes } from '../../../navigation/routes';
import { scaleFont, scaleModerate } from '../../../utils';

// Cycled by card index — the backend doesn't return a color, this is purely
// a local visual accent so cards aren't all one flat color.
const ACCENT_KEYS = ['teal700', 'giftAccent', 'vipPurple', 'facebookBlue'];
function accentForIndex(index) {
  return theme => theme.colors[ACCENT_KEYS[index % ACCENT_KEYS.length]];
}

// See StreamLine-Portal/docs/mobile-audio-room-api.md's "Discover live
// rooms" section — maps the backend's room shape onto what PartyCard
// expects.
function toPartyItem(room, index) {
  return {
    id: room.roomId,
    title: room.title,
    members: room.participantCount,
    hostName: room.owner?.name ?? 'Unknown host',
    accent: accentForIndex(index)
  };
}

const bannerSlides = [{
  id: 'b1',
  eyebrow: 'LEVEL UP YOUR NIGHT!',
  title: 'Weekend Royale Tournament',
  subtitle: 'Join the biggest party event this week!'
}, {
  id: 'b2',
  eyebrow: 'NEW THIS WEEK',
  title: 'Karaoke Night Live',
  subtitle: 'Grab the mic and vibe with the community.'
}, {
  id: 'b3',
  eyebrow: 'LIMITED TIME',
  title: 'Double Gift Points',
  subtitle: 'Send gifts today to earn double reward points.'
}];

function PartyBanner() {
  const theme = useTheme();
  const {
    width
  } = useWindowDimensions();
  const bannerWidth = width - 32;
  const loopSlides = React.useMemo(() => [...bannerSlides, bannerSlides[0]], []);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const bannerListRef = React.useRef(null);
  const pageIndexRef = React.useRef(0);
  const isAnimating = React.useRef(false);
  const handleScroll = event => {
    if (isAnimating.current) {
      return;
    }
    const index = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    pageIndexRef.current = index;
    setActiveIndex(index % bannerSlides.length);
  };
  const handleMomentumScrollEnd = () => {
    if (pageIndexRef.current >= bannerSlides.length) {
      bannerListRef.current?.scrollToOffset({
        offset: 0,
        animated: false
      });
      pageIndexRef.current = 0;
      setActiveIndex(0);
    }
    isAnimating.current = false;
  };
  React.useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = pageIndexRef.current + 1;
      isAnimating.current = true;
      pageIndexRef.current = nextIndex;
      setActiveIndex(nextIndex % bannerSlides.length);
      bannerListRef.current?.scrollToOffset({
        offset: nextIndex * bannerWidth,
        animated: true
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [bannerWidth]);
  return <View>
      <FlatList ref={bannerListRef} data={loopSlides} keyExtractor={(item, index) => `${item.id}-${index}`} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={handleScroll} onMomentumScrollEnd={handleMomentumScrollEnd} scrollEventThrottle={16} renderItem={({
      item
    }) => <View style={[styles.banner, {
      width: bannerWidth,
      backgroundColor: theme.colors.teal900,
      borderColor: theme.colors.teal700
    }]}>
            <Text style={[styles.bannerEyebrow, {
        color: theme.colors.teal200
      }]}>{item.eyebrow}</Text>
            <Text style={[styles.bannerTitle, {
        color: theme.cta.primary.text
      }]}>{item.title}</Text>
            <Text style={[styles.bannerSubtitle, {
        color: theme.colors.teal100
      }]}>{item.subtitle}</Text>

            <View style={styles.bannerDots}>
              {bannerSlides.map((slide, index) => <View key={slide.id} style={[index === activeIndex ? styles.dotActive : styles.dotMuted, {
          backgroundColor: index === activeIndex ? theme.colors.teal200 : theme.colors.teal800
        }]} />)}
            </View>
          </View>} />
    </View>;
}

function PartyCard({
  item
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const accent = item.accent(theme);
  return <Pressable style={[styles.partyCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={() => navigation.navigate(routes.room, {
    roomId: item.id,
    roomName: item.title,
    mode: 'audio'
  })}>
      <View style={[styles.partyThumb, {
      backgroundColor: accent
    }]}>
        <View style={[styles.partyViewerBadge, {
        backgroundColor: theme.colors.teal900
      }]}>
          <Text style={[styles.partyViewerBadgeText, {
          color: theme.cta.primary.text
        }]}>{item.members}</Text>
        </View>
      </View>
      <Text style={[styles.partyTitle, {
      color: theme.text.primary
    }]} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={styles.partyMetaRow}>
        <View style={[styles.partyAvatar, {
        backgroundColor: accent
      }]} />
        <Text style={[styles.partyMeta, {
        color: theme.text.secondary
      }]} numberOfLines={1}>
          {item.hostName}
        </Text>
      </View>
    </Pressable>;
}

export function PartyTabContent() {
  const theme = useTheme();
  const sessionToken = useAppStore(store => store.session?.token);
  const [trendingParties, setTrendingParties] = React.useState([]);

  const loadTrending = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    const rooms = await fetchDiscoverRooms(sessionToken);
    setTrendingParties(rooms.map(toPartyItem));
  }, [sessionToken]);

  // Refetch every time the Party tab is focused (not just on first mount),
  // so a room started by someone else since the last visit shows up without
  // needing a full app restart.
  useFocusEffect(
    React.useCallback(() => {
      loadTrending();
    }, [loadTrending])
  );

  return <ScrollView contentContainerStyle={styles.partyList} showsVerticalScrollIndicator={false}>
      <PartyBanner />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, {
        color: theme.text.primary
      }]}>Trending Parties</Text>
        <Pressable onPress={loadTrending}>
          <Text style={[styles.sectionSeeAll, {
          color: theme.colors.teal700
        }]}>See All ›</Text>
        </Pressable>
      </View>

      {trendingParties.length > 0 ? <View style={styles.partyRow}>
          {trendingParties.map(item => <PartyCard key={item.id} item={item} />)}
        </View> : <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, {
        color: theme.text.secondary
      }]}>No trending parties right now. Start one from the + button!</Text>
        </View>}
    </ScrollView>;
}

const styles = StyleSheet.create({
  partyList: {
    padding: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  banner: {
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(20),
    gap: scaleModerate(4)
  },
  bannerEyebrow: {
    fontSize: scaleFont(11),
    fontWeight: '800',
    letterSpacing: 0.6
  },
  bannerTitle: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  bannerSubtitle: {
    fontSize: scaleFont(12)
  },
  bannerDots: {
    position: 'absolute',
    bottom: scaleModerate(3),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleModerate(4)
  },
  dotActive: {
    width: scaleModerate(4),
    height: scaleModerate(4),
    borderRadius: 999
  },
  dotMuted: {
    width: scaleModerate(4),
    height: scaleModerate(4),
    borderRadius: 999
  },
  sectionHeader: {
    marginTop: scaleModerate(20),
    marginBottom: scaleModerate(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionLabel: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  sectionSeeAll: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  partyRow: {
    flexDirection: 'row',
    gap: scaleModerate(12)
  },
  partyCard: {
    flex: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(8)
  },
  partyThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: scaleModerate(16),
    marginBottom: scaleModerate(8),
    padding: scaleModerate(6),
    alignItems: 'center',
    justifyContent: 'center'
  },
  partyViewerBadge: {
    borderRadius: scaleModerate(8),
    paddingHorizontal: scaleModerate(6),
    paddingVertical: scaleModerate(2)
  },
  partyViewerBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  partyTitle: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  partyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleModerate(6),
    gap: scaleModerate(6)
  },
  partyAvatar: {
    width: scaleModerate(16),
    height: scaleModerate(16),
    borderRadius: scaleModerate(8)
  },
  partyMeta: {
    fontSize: scaleFont(11),
    flex: 1
  },
  emptyState: {
    paddingVertical: scaleModerate(40),
    paddingHorizontal: scaleModerate(12),
    alignItems: 'center'
  },
  emptyStateText: {
    fontSize: scaleFont(13),
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default PartyTabContent;
