import React from 'react';
import { Animated, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchDiscoverRooms } from '../../../api';
import { agencyApplyBannerImage } from '../../../assets';
import { Avatar } from '../../../components';
import { useBannerAssets, useUserAssets } from '../../../hooks';
import { useAppStore } from '../../../store';
import { useTheme } from '../../../theme';
import { routes } from '../../../navigation/routes';
import { scaleFont, scaleModerate } from '../../../utils';

function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/400?img=${(index % 70) + 1}`;
}

// See StreamLine-Portal/docs/mobile-audio-room-api.md's "Discover live
// rooms" section — maps the backend's room shape onto what PartyCard
// expects.
function toPartyItem(room, index) {
  return {
    id: room.roomId,
    title: room.title,
    members: room.participantCount,
    hostId: room.owner?.id ?? null,
    hostName: room.owner?.name ?? 'Unknown host',
    hostAvatar: room.owner?.profileImage,
    hostFrameUrl: room.owner?.frameUrl ?? null,
    photo: personPhotoForIndex(index)
  };
}

const DEMO_TRENDING_PARTIES = [
  { id: 'demo-party-1', title: 'Friday Night Karaoke', members: 128, hostName: 'Zara Sheikh', hostAvatar: undefined, photo: personPhotoForIndex(21) },
  { id: 'demo-party-2', title: 'Weekend Royale Tournament', members: 96, hostName: 'Omar Farooq', hostAvatar: undefined, photo: personPhotoForIndex(22) },
  { id: 'demo-party-3', title: 'Chill & Chat Lounge', members: 54, hostName: 'Mahnoor Ali', hostAvatar: undefined, photo: personPhotoForIndex(23) },
  { id: 'demo-party-4', title: 'Desi Beats Night', members: 82, hostName: 'Hassan Raza', hostAvatar: undefined, photo: personPhotoForIndex(24) },
  { id: 'demo-party-5', title: 'Late Night Vibes', members: 67, hostName: 'Areeba Noor', hostAvatar: undefined, photo: personPhotoForIndex(25) }
];


const AGENCY_BANNER_ID = 'agency-apply-fixed';
// Deliberately NOT Image.resolveAssetSource(...).uri — in dev builds that
// resolves to an http://localhost:8081/... URL pointing at the Metro
// packager, and "localhost" on a physical phone means the phone itself,
// not the dev machine, so the image silently never loaded there (worked
// fine on an emulator, whose localhost does map back to the dev machine).
// Passing the required module straight through as `source` sidesteps this
// — RN resolves a local bundled asset correctly in both dev and release
// regardless of packager host.
const FIXED_AGENCY_BANNER = {
  id: AGENCY_BANNER_ID,
  source: agencyApplyBannerImage,
  title: 'Apply for Agency'
};

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
  // Computed in JS (not CSS aspectRatio) on purpose — inside a horizontally
  // paginated FlatList, an aspectRatio-sized Image can resolve its height a
  // frame late on Android, so the item's real width/offset briefly doesn't
  // match bannerWidth. That was enough to throw off the scroll-position
  // math (indexRef/activeIndex, the paging snap points) during a manual
  // swipe, making banners land in the wrong spot. A precomputed number has
  // no such lag.
  const bannerImageHeight = bannerWidth / 2.4;
  // The fixed agency banner always leads the carousel; after it, admin-
  // uploaded image banners take priority, falling back to the bundled
  // text promos only when none exist yet — so the section is never just
  // the one fixed banner alone.
  const bannerAssets = useBannerAssets();
  const useImages = bannerAssets.length > 0;
  const slides = [FIXED_AGENCY_BANNER, ...(useImages ? bannerAssets : bannerSlides)];

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
  // Drives the per-slide scale/opacity animation below — tracked on the
  // native thread (useNativeDriver) so the effect stays smooth even while
  // JS is busy, purely cosmetic and separate from handleScroll's own
  // index-tracking logic.
  const scrollX = React.useRef(new Animated.Value(0)).current;
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
  // opens our in-app application form directly — kept as a special case
  // even now that actionUrl exists, since this flow is a native screen,
  // not a web page. Every other banner uses the admin-set actionUrl (see
  // StreamLine-Portal's docs/mobile-upload-catalog-api.md) when present,
  // opened in the in-app browser; with neither, it falls back to the
  // generic BannerDetail page — uploaded image banners pass their image,
  // the bundled text-promo fallbacks pass their text instead.
  const handleSlidePress = item => {
    if (item.id === AGENCY_BANNER_ID || /create\s*agency/i.test(item.title ?? '')) {
      navigation.navigate(routes.agencyChoice);
      return;
    }
    if (item.actionUrl) {
      // See StreamLine-Portal's docs/mobile-upload-catalog-api.md — opens
      // in-app instead of handing off to the system browser.
      navigation.navigate(routes.inAppBrowser, { url: item.actionUrl, title: item.title });
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
      <Animated.FlatList
        ref={bannerListRef}
        data={renderSlides}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        horizontal
        // Not pagingEnabled — that snaps to the FlatList's own measured
        // viewport width, which doesn't always exactly equal bannerWidth
        // (a sub-pixel rounding difference is enough), so the next/previous
        // slide would bleed in at the edge after a swipe. snapToInterval
        // uses our own computed width directly, so the snap point always
        // matches each item's actual width exactly.
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(data, index) => ({ length: bannerWidth, offset: bannerWidth * index, index })}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          // The slide currently centered scrolls up to full size/opacity;
          // its neighbors ease down slightly — a subtle "focus" effect
          // instead of every slide snapping to the same flat look while
          // scrolling past.
          const inputRange = [(index - 1) * bannerWidth, index * bannerWidth, (index + 1) * bannerWidth];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });
          return <Animated.View style={{ transform: [{ scale }], opacity }}>
              {item.source || item.uri
                ? <Image source={item.source ?? { uri: item.uri }} style={[styles.bannerImage, { width: bannerWidth, height: bannerImageHeight }]} resizeMode="cover" />
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
            </Animated.View>;
        }}
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
  item,
  variant = 'feature'
}) {
  const theme = useTheme();
  const navigation = useNavigation();
  // A fake, never-real userId for demo cards (no hostId at all) — passing
  // undefined here would make useUserAssets fall back to resolving the
  // *signed-in user's own* frame instead of showing nothing, and would
  // clear their real cached frame in the process.
  const { frameUri: hostFrameUri } = useUserAssets({ userId: item.hostId ?? 'demo-host', frameUrl: item.hostId ? item.hostFrameUrl : null });
  // DEMO_TRENDING_PARTIES ids (see above) route to a static preview screen
  // instead of the real Room screen — a fake roomId there just got stuck
  // "Loading room..." with no seats, since nothing on the backend actually
  // exists for it. Real rooms are completely unaffected.
  const isDemo = item.id.startsWith('demo-');
  const handlePress = () => {
    if (isDemo) {
      navigation.navigate(routes.demoRoom, {
        title: item.title,
        hostName: item.hostName,
        hostAvatar: item.hostAvatar,
        hostId: item.id,
        members: item.members
      });
      return;
    }
    navigation.navigate(routes.room, {
      roomId: item.id,
      roomName: item.title,
      mode: 'audio',
      asViewer: true
    });
  };
  return <Pressable style={[styles.partyCard, styles[`partyCard${variant.charAt(0).toUpperCase()}${variant.slice(1)}`], {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]} onPress={handlePress}>
      <ImageBackground source={{ uri: item.photo }} style={[styles.partyThumb, styles[`partyThumb${variant.charAt(0).toUpperCase()}${variant.slice(1)}`]]} imageStyle={styles.partyThumbImage}>
        <View style={styles.partyViewerBadge}>
          <Text style={styles.partyViewerBadgeIcon}>👥</Text>
          <Text style={styles.partyViewerBadgeText}>{item.members}</Text>
        </View>
      </ImageBackground>
      <View style={styles.partyDetails}>
        <Text style={[styles.partyTitle, variant === 'compact' && styles.partyTitleCompact, {
        color: theme.text.primary
        }]} numberOfLines={variant === 'compact' ? 2 : 1}>
          {item.title}
        </Text>
        {variant !== 'compact' ? <View style={styles.partyMetaRow}>
          <Avatar value={item.hostAvatar} fullName={item.hostName} size={scaleModerate(16)} frameUri={hostFrameUri} />
          <Text style={[styles.partyMeta, {
        color: theme.text.secondary
          }]} numberOfLines={1}>
            {item.hostName}
          </Text>
        </View> : null}
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

      {/* DEMO DATA fallback — see DEMO_TRENDING_PARTIES above. Falls back
      to it only when the real fetch came back empty; real data always
      wins once it exists. */}
      {(trendingParties.length > 0 ? trendingParties : DEMO_TRENDING_PARTIES).length > 0 ? <View style={styles.partyMosaic}>
          {(() => {
            const parties = trendingParties.length > 0 ? trendingParties : DEMO_TRENDING_PARTIES;
            return <>
              <View style={styles.partyMosaicTop}>
                {parties[0] ? <PartyCard item={parties[0]} variant="feature" /> : null}
                {parties.length > 1 ? <View style={styles.partyMosaicSide}>
                    {parties.slice(1, 3).map(item => <PartyCard key={item.id} item={item} variant="compact" />)}
                  </View> : null}
              </View>
            </>;
          })()}
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
    // Width/height both come from bannerWidth/bannerImageHeight at the
    // call site (matches the recommended 2.4:1 banner ratio — see the
    // fixed Agency-Apply.png, 1942x809) — computed in JS rather than via
    // this style's own aspectRatio, see the comment on bannerImageHeight
    // for why.
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
  partyMosaic: {
    gap: scaleModerate(12)
  },
  partyMosaicTop: {
    flexDirection: 'row',
    gap: scaleModerate(12),
    height: scaleModerate(212)
  },
  partyMosaicSide: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: scaleModerate(12)
  },
  partyCard: {
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(8)
  },
  partyCardFeature: {
    flexGrow: 1.65,
    flexBasis: 0,
    minWidth: 0,
    height: '100%'
  },
  partyCardCompact: {
    flex: 1,
    minHeight: 0,
    padding: scaleModerate(6)
  },
  partyCardWide: {
    minHeight: scaleModerate(100),
    flexDirection: 'row',
    alignItems: 'center'
  },
  partyThumb: {
    width: '100%',
    borderRadius: scaleModerate(16),
    overflow: 'hidden',
    marginBottom: scaleModerate(8),
    padding: scaleModerate(8),
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  partyThumbFeature: {
    flex: 1
  },
  partyThumbCompact: {
    flex: 1,
    marginBottom: scaleModerate(5),
    padding: scaleModerate(5)
  },
  partyThumbWide: {
    width: scaleModerate(110),
    height: scaleModerate(80),
    marginBottom: 0,
    marginRight: scaleModerate(10)
  },
  partyThumbImage: {
    borderRadius: scaleModerate(16)
  },
  partyViewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(3),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  partyViewerBadgeIcon: {
    fontSize: scaleFont(10)
  },
  partyViewerBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  partyTitle: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  partyTitleCompact: {
    fontSize: scaleFont(9),
    lineHeight: scaleFont(11)
  },
  partyDetails: {
    flex: 1
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
