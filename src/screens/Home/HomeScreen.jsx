import React from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchIcon, TrophyIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { routes } from '../../navigation/routes';
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
const liveRooms = [{
  id: 'l1',
  hostName: 'AhmedGa...',
  hostTag: 'PUBG Mobile',
  viewers: '1.2k',
  accent: theme => theme.colors.teal700
}, {
  id: 'l2',
  hostName: 'SaraPlayz',
  hostTag: 'Valorant',
  viewers: '854',
  accent: theme => theme.colors.teal200
}, {
  id: 'l3',
  hostName: 'NightOwl',
  hostTag: 'Just Chatting',
  viewers: '612',
  accent: theme => theme.colors.vipPurple
}, {
  id: 'l4',
  hostName: 'KingTariq',
  hostTag: 'Free Fire',
  viewers: '441',
  accent: theme => theme.colors.giftAccent
}];
const countryFilters = ['All', 'SA KSA', 'AE UAE', 'EG Egypt', 'KW Kuwait'];
const trendingParties = [{
  id: 'p1',
  title: 'Late Night Ludo & Vibes',
  hostName: 'KingTariq',
  members: '116',
  accent: theme => theme.colors.teal700
}, {
  id: 'p2',
  title: 'Music Chill Zone',
  hostName: 'DJ_Sara',
  members: '84',
  accent: theme => theme.colors.vipPurple
}];
function HeaderBar() {
  const theme = useTheme();
  return <View style={styles.headerBar}>
      <SearchIcon size={22} color={theme.text.secondary} />
      <Text style={[styles.headerTitle, {
      color: theme.colors.teal700
    }]}>Streamline</Text>
      <TrophyIcon size={22} color={theme.text.secondary} />
    </View>;
}
function TabPill({
  label,
  active,
  onPress
}) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={styles.tabPill}>
      <Text style={[styles.tabPillText, {
      color: active ? theme.colors.teal700 : theme.text.secondary
    }, active && styles.tabPillTextActive]}>{label}</Text>
      {active ? <View style={[styles.tabPillIndicator, {
      backgroundColor: theme.colors.teal700
    }]} /> : null}
    </Pressable>;
}
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
  return <Pressable style={[styles.liveCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={() => navigation.navigate(routes.room, {
    roomId: item.id
  })}>
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
  const accent = item.accent(theme);
  return <Pressable style={[styles.partyCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]}>
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
function CountryFilterRow({
  activeFilter,
  onSelect
}) {
  const theme = useTheme();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      <Pressable style={[styles.filterSearchButton, {
      backgroundColor: theme.colors.teal700
    }]}>
        <SearchIcon size={16} color={theme.cta.primary.text} />
      </Pressable>

      {countryFilters.map(filter => {
      const active = filter === activeFilter;
      return <Pressable key={filter} onPress={() => onSelect(filter)} style={[styles.filterChip, {
        backgroundColor: active ? theme.colors.teal700 : theme.surfaces.card,
        borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder
      }]}>
            <Text style={[styles.filterChipText, {
          color: active ? theme.cta.primary.text : theme.text.secondary
        }]}>{filter}</Text>
          </Pressable>;
    })}
    </ScrollView>;
}
function LiveTabContent() {
  const [activeFilter, setActiveFilter] = React.useState('All');
  return <FlatList data={liveRooms} keyExtractor={item => item.id} numColumns={2} columnWrapperStyle={styles.liveRow} contentContainerStyle={styles.liveList} ListHeaderComponent={<CountryFilterRow activeFilter={activeFilter} onSelect={setActiveFilter} />} renderItem={({
    item
  }) => <LiveRoomCard item={item} />} />;
}
function PartyTabContent() {
  const theme = useTheme();
  return <ScrollView contentContainerStyle={styles.partyList} showsVerticalScrollIndicator={false}>
      <PartyBanner />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, {
        color: theme.text.primary
      }]}>Trending Parties</Text>
        <Pressable>
          <Text style={[styles.sectionSeeAll, {
          color: theme.colors.teal700
        }]}>See All ›</Text>
        </Pressable>
      </View>

      <View style={styles.partyRow}>
        {trendingParties.map(item => <PartyCard key={item.id} item={item} />)}
      </View>
    </ScrollView>;
}
function GamesTabContent() {
  const theme = useTheme();
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, {
      color: theme.text.primary
    }]}>Games coming soon</Text>
      <Text style={[styles.emptySubtitle, {
      color: theme.text.secondary
    }]}>Casual mini-games will show up here.</Text>
    </View>;
}
const HOME_TABS = ['live', 'party', 'games'];
export function HomeScreen() {
  const theme = useTheme();
  const {
    width
  } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState('party');
  const pagerRef = React.useRef(null);
  const scrollToTab = tab => {
    const index = HOME_TABS.indexOf(tab);
    pagerRef.current?.scrollTo({
      x: index * width,
      animated: true
    });
    setActiveTab(tab);
  };
  const handleMomentumScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveTab(HOME_TABS[index] ?? 'live');
  };
  return <Screen>
      <HeaderBar />

      <View style={[styles.header, {
      borderBottomColor: theme.colors.cardBorder
    }]}>
        <TabPill label="Live" active={activeTab === 'live'} onPress={() => scrollToTab('live')} />
        <TabPill label="Party" active={activeTab === 'party'} onPress={() => scrollToTab('party')} />
        <TabPill label="Games" active={activeTab === 'games'} onPress={() => scrollToTab('games')} />
      </View>

      <ScrollView ref={pagerRef} style={styles.pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleMomentumScrollEnd} contentOffset={{
      x: HOME_TABS.indexOf(activeTab) * width,
      y: 0
    }}>
        <View style={[styles.pagerPage, {
        width
      }]}>
          <LiveTabContent />
        </View>
        <View style={[styles.pagerPage, {
        width
      }]}>
          <PartyTabContent />
        </View>
        <View style={[styles.pagerPage, {
        width
      }]}>
          <GamesTabContent />
        </View>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  pager: {
    flex: 1
  },
  pagerPage: {
    flex: 1
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    gap: 22
  },
  tabPill: {
    alignItems: 'center',
    paddingBottom: 12
  },
  tabPillText: {
    fontSize: 15,
    fontWeight: '700'
  },
  tabPillTextActive: {
    fontWeight: '800'
  },
  tabPillIndicator: {
    marginTop: 8,
    height: 3,
    width: 22,
    borderRadius: 999
  },
  liveList: {
    padding: 16,
    paddingBottom: 28
  },
  filterRow: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16
  },
  filterSearchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700'
  },
  liveRow: {
    gap: 12
  },
  liveCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12
  },
  liveThumb: {
    height: 180,
    padding: 8,
    justifyContent: 'space-between'
  },
  liveThumbTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  liveBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  liveViewersPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  liveViewers: {
    fontSize: 11,
    fontWeight: '700'
  },
  liveThumbScrim: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    opacity: 0.82
  },
  liveHostName: {
    fontSize: 13,
    fontWeight: '700'
  },
  liveHostTag: {
    fontSize: 11,
    marginTop: 1
  },
  partyList: {
    padding: 16,
    paddingBottom: 28
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 4
  },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  bannerSubtitle: {
    fontSize: 12
  },
  bannerDots: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4
  },
  dotActive: {
    width: 4,
    height: 4,
    borderRadius: 999
  },
  dotMuted: {
    width: 4,
    height: 4,
    borderRadius: 999
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800'
  },
  sectionSeeAll: {
    fontSize: 13,
    fontWeight: '700'
  },
  partyRow: {
    flexDirection: 'row',
    gap: 12
  },
  partyCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8
  },
  partyThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  partyViewerBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  partyViewerBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  partyTitle: {
    fontSize: 13,
    fontWeight: '700'
  },
  partyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6
  },
  partyAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8
  },
  partyMeta: {
    fontSize: 11,
    flex: 1
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center'
  }
});
export default HomeScreen;
