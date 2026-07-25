import React from 'react';
import { Animated, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchDiscoverRooms } from '../../../api';
import { Avatar } from '../../../components';
import { useBannerAssets } from '../../../hooks';
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
    hostAvatar: room.owner?.profileImage,
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

// The banner is a horizontal FlatList nested inside HomeScreen's horizontal
// tab pager (also horizontal). Android's native ScrollViews can't arbitrate
// two same-direction scrolls — the parent pager intercepts the drag before
// the banner ever sees it, so the banner wouldn't scroll manually. Fix: the
// onTouchStart/End listeners on the wrapper tell HomeScreen (via
// onBannerScrolling) to disable the pager's scroll while a finger is on the
// banner, so the banner scrolls freely and tab-switching is suppressed only
// while on the banner (exactly the requested "separate it from page slide"
// behavior). Vertical scroll is unaffected — that's a different, vertical
// ScrollView.
// One pagination dot — smoothly grows into a pill and tints when its slide
// becomes active, instead of the jarring instant width/color snap.
function BannerDot({ active, activeColor, mutedColor }) {
  const anim = React.useRef(new Animated.Value(active ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 300,
      // Width and backgroundColor can't run on the native driver.
      useNativeDriver: false
    }).start();
  }, [active, anim]);
  return <Animated.View style={[styles.dot, {
    width: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [scaleModerate(5), scaleModerate(14)]
    }),
    backgroundColor: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [mutedColor, activeColor]
    })
  }]} />;
}

function PartyBanner({ onBannerScrolling }) {
  const theme = useTheme();
  const navigation = useNavigation();
  const {
    width
  } = useWindowDimensions();
  const bannerWidth = width - 32;
  // Admin-uploaded image banners take priority; if none exist, fall back to
  // the bundled text promos so the section is never empty.
  const bannerAssets = useBannerAssets();
  const useImages = bannerAssets.length > 0;
  const slides = useImages ? bannerAssets : bannerSlides;

  // Infinite forward loop: a clone of the first slide is appended after the
  // last one, so advancing past the end scrolls forward into the clone, and
  // once it lands there we silently (no animation) jump back to the real
  // first slide. Without this, wrapping from the last banner to the first
  // visibly scrolled backwards through every slide.
  const loop = slides.length > 1;
  const renderSlides = loop ? [...slides, slides[0]] : slides;

  const [activeIndex, setActiveIndex] = React.useState(0);
  const bannerListRef = React.useRef(null);
  const indexRef = React.useRef(0);
  // Timestamp until which auto-advance stays paused — set on touch so the
  // timer doesn't fight the user's manual swipe.
  const pausedUntilRef = React.useRef(0);

  const handleScroll = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    // Landed on the appended clone of slide 1 — snap to the real slide 1.
    // Only once fully there (within a few px), otherwise the mid-animation
    // rounding would cut the forward animation short with a visible jump.
    if (loop && index >= slides.length) {
      const offset = event.nativeEvent.contentOffset.x;
      if (Math.abs(offset - slides.length * bannerWidth) < 4) {
        indexRef.current = 0;
        setActiveIndex(0);
        bannerListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
      return;
    }
    if (index !== indexRef.current) {
      indexRef.current = index;
      setActiveIndex(index);
    }
  };

  // A banner named "Create Agency" on the portal (e.g. "1 Create Agency")
  // opens the agency application form; every other slide opens the generic
  // BannerDetail page — uploaded image banners pass their image, the
  // bundled text-promo fallbacks pass their text instead.
  const handleSlidePress = item => {
    if (/create\s*agency/i.test(item.title ?? '')) {
      navigation.navigate(routes.createAgency);
      return;
    }
    navigation.navigate(routes.bannerDetail, {
      uri: item.uri,
      title: item.title,
      subtitle: item.subtitle
    });
  };

  // Tap detection is done by hand here instead of relying on a
  // <Pressable>'s onPress. The pager needs to be disabled the instant a
  // finger touches the banner (below) so the parent doesn't steal the
  // drag — but flipping an ancestor ScrollView's native scrollEnabled prop
  // mid-gesture makes Android terminate/cancel whatever responder chain is
  // in progress, which was silently eating Pressable's onPress on a plain
  // tap. Tracking start/end position and timing ourselves sidesteps that
  // responder system entirely.
  const touchStartRef = React.useRef(null);
  const TAP_MAX_MOVEMENT = 10;
  const TAP_MAX_DURATION = 300;

  const handleTouchStart = event => {
    pausedUntilRef.current = Date.now() + 6000;
    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
      time: Date.now()
    };
    onBannerScrolling?.(true);
  };
  const handleTouchEnd = event => {
    pausedUntilRef.current = Date.now() + 6000;
    onBannerScrolling?.(false);

    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) {
      return;
    }
    const dx = Math.abs(event.nativeEvent.pageX - start.x);
    const dy = Math.abs(event.nativeEvent.pageY - start.y);
    const duration = Date.now() - start.time;
    if (dx < TAP_MAX_MOVEMENT && dy < TAP_MAX_MOVEMENT && duration < TAP_MAX_DURATION) {
      const item = slides[indexRef.current % slides.length];
      if (item) {
        handleSlidePress(item);
      }
    }
  };

  React.useEffect(() => {
    // Reset to the first slide if the slide set changes (e.g. banners load
    // in after the text fallback was showing).
    indexRef.current = 0;
    setActiveIndex(0);
    bannerListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [useImages, slides.length]);

  React.useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) {
        return;
      }
      // Advancing off the last slide targets the appended clone of slide 1
      // (index === slides.length) — always a forward animation. handleScroll
      // snaps back to the real slide 1 once it lands.
      const next = indexRef.current + 1;
      indexRef.current = next;
      setActiveIndex(next % slides.length);
      bannerListRef.current?.scrollToOffset({
        offset: next * bannerWidth,
        animated: true
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length, bannerWidth]);

  return <View style={styles.bannerWrap} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
      <FlatList
        ref={bannerListRef}
        data={renderSlides}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => useImages
          ? <Image source={{ uri: item.uri }} style={[styles.bannerImage, { width: bannerWidth }]} resizeMode="cover" />
          : <View style={[styles.banner, {
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
            </View>}
      />

      {slides.length > 1 ? <View style={styles.bannerDots}>
          {slides.map((slide, index) => <BannerDot key={slide.id} active={index === activeIndex} activeColor={theme.colors.teal200} mutedColor={theme.colors.teal800} />)}
        </View> : null}
    </View>;
}

// See StreamLine-Portal/docs/mobile-audio-room-api.md's "Live seat-state
// relay" — RoomScreen now has a real viewer mode (asViewer:true), backed by
// the owner-authoritative seat-broadcast relay, so this can navigate in for
// real instead of showing a placeholder.
function PartyCard({
  item
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  const accent = item.accent(theme);
  const handlePress = () => {
    navigation.navigate(routes.room, {
      roomId: item.id,
      roomName: item.title,
      mode: 'audio',
      asViewer: true
    });
  };
  return <Pressable style={[styles.partyCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={handlePress}>
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
        <Avatar value={item.hostAvatar} fullName={item.hostName} size={scaleModerate(16)} />
        <Text style={[styles.partyMeta, {
        color: theme.text.secondary
      }]} numberOfLines={1}>
          {item.hostName}
        </Text>
      </View>
    </Pressable>;
}

export function PartyTabContent({ onBannerScrolling }) {
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
      <PartyBanner onBannerScrolling={onBannerScrolling} />

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
  bannerWrap: {
    position: 'relative'
  },
  banner: {
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(20),
    paddingBottom: scaleModerate(24),
    gap: scaleModerate(4)
  },
  bannerImage: {
    height: scaleModerate(140),
    borderRadius: scaleModerate(16)
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
    bottom: scaleModerate(8),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleModerate(5)
  },
  dot: {
    height: scaleModerate(5),
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
