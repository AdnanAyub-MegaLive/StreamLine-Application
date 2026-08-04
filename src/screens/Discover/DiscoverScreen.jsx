import React from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, FlatList, Image, ImageBackground, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BellIcon, BookmarkIcon, discoverBackgroundImage, DotsIcon, HeartIcon, MessageIcon, PlayIcon, RepostIcon, SearchIcon } from '../../assets';
import { CreatePostError, deletePost, fetchAudioRoom, fetchPosts } from '../../api';
import { Avatar, RoomTitleModal, SEAT_LAYOUT_OPTIONS, SeatLayoutModal, Screen, showAlert, StreamOptionModal, VerifiedName } from '../../components';
import { getCachedSeatState, scaleFont, scaleModerate } from '../../utils';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { routes } from '../../navigation/routes';

const PAGE_WIDTH = Dimensions.get('window').width;

// Needed to animate LinearGradient's borderColor (only Animated-wrapped
// components pick up Animated.Value style props).
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const DISCOVER_TABS = [
  { id: 'forYou', label: 'For You' },
  { id: 'reels', label: 'Reels' }
];

const GRADIENT_RING = ['#FF4DA3', '#7000FF', '#00F2FF'];

function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/300?img=${(index % 70) + 1}`;
}

const DUMMY_STORIES = [
  { id: 'story-1', name: 'Obaid Zafar', photo: personPhotoForIndex(11), live: true },
  { id: 'story-2', name: 'Midnight Grind', photo: personPhotoForIndex(31), live: true },
  { id: 'story-3', name: 'Vaporwave Vibes', photo: personPhotoForIndex(42), live: false }
];

// Same reels-thumbnail-grid placeholder idea used for the posts feed —
// no Reels model/endpoint exists yet either.
const DUMMY_REELS = [
  { id: 'reel-1', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel1/400/700', views: '12.4K' },
  { id: 'reel-2', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel2/400/700', views: '3.1K' },
  { id: 'reel-3', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel3/400/700', views: '842' },
  { id: 'reel-4', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel4/400/700', views: '9.7K' },
  { id: 'reel-5', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel5/400/700', views: '221' },
  { id: 'reel-6', thumbnailUrl: 'https://picsum.photos/seed/streamlinereel6/400/700', views: '5.6K' }
];

// Shown whenever the real feed comes back empty — just for demo purposes
// until there's enough real activity on Discover to fill it naturally.
const DUMMY_POSTS = [
  {
    id: 'dummy-1',
    description: 'Had an amazing stream tonight, thank you all for joining! 🚀',
    imageUrl: 'https://picsum.photos/seed/streamline1/800/900',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: { fullName: 'Obaid Zafar', profileImage: personPhotoForIndex(11), isOfficial: true },
    live: true,
    category: { icon: '🎮', label: 'Gaming' },
    duration: '02:45:12',
    views: '1.2K',
    likeCount: 482,
    commentCount: 36,
    shareCount: 72
  },
  {
    id: 'dummy-2',
    description: "New agency hosts onboarding this week — excited for what's next! 🎉",
    imageUrl: 'https://picsum.photos/seed/streamline2/800/900',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    author: { fullName: 'Bilal R.', profileImage: personPhotoForIndex(12), isOfficial: false },
    live: false,
    category: { icon: '🎙️', label: 'Talk Show' },
    duration: '01:15:33',
    views: '864',
    likeCount: 312,
    commentCount: 18,
    shareCount: 35
  },
  {
    id: 'dummy-3',
    description: 'Weekend gaming room was packed 🔥',
    imageUrl: 'https://picsum.photos/seed/streamline3/800/900',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    author: { fullName: 'Hamza M.', profileImage: personPhotoForIndex(13), isOfficial: false },
    live: false,
    category: { icon: '🕹️', label: 'Gaming' },
    duration: null,
    views: '221',
    likeCount: 57,
    commentCount: 3,
    shareCount: 9
  }
];

function formatCount(count) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 >= 100 ? 1 : 0)}K`;
  }
  return String(count);
}

function timeAgo(isoDate) {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Same two-layer glass treatment as PostCard's own background (a dark
// base gradient plus a subtle cyan/purple tint on top) so the header
// buttons read as the same material as the post cards below them.
function HeaderGlassButton({ theme, onPress, children, style }) {
  return <Pressable onPress={onPress} style={[styles.headerButton, style]}>
      <LinearGradient
        colors={[hexToRgba(theme.surfaces.card, 0.6), hexToRgba(theme.surfaces.card, 0.4)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerButtonGradient}
      >
        <LinearGradient
          colors={[hexToRgba(theme.colors.secondary, 0.14), hexToRgba(theme.colors.tertiary, 0.14)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerButtonTint}
          pointerEvents="none"
        />
        {children}
      </LinearGradient>
    </Pressable>;
}

function HeaderBar({ theme, onSearch, onOpenNotifications, hasUnreadNotifications }) {
  return <View style={styles.headerBar}>
      <Text style={[styles.screenTitle, { color: theme.text.primary }]}>Discover</Text>
      <View style={styles.headerActions}>
        <HeaderGlassButton theme={theme} onPress={onSearch}>
          <SearchIcon size={19} color={theme.text.primary} />
        </HeaderGlassButton>
        <HeaderGlassButton theme={theme} onPress={onOpenNotifications}>
          <BellIcon size={19} color={theme.text.primary} />
          {hasUnreadNotifications ? <View style={[styles.headerDot, { backgroundColor: theme.colors.liveBadge, borderColor: theme.surfaces.card }]} /> : null}
        </HeaderGlassButton>
      </View>
    </View>;
}

function GradientRing({ size, children }) {
  return <LinearGradient colors={GRADIENT_RING} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientRing, { width: size, height: size, borderRadius: size / 2 }]}>
      {children}
    </LinearGradient>;
}

function GoLiveStoryCard({ theme, onPress }) {
  return <Pressable onPress={onPress} style={styles.storyItem}>
      <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goLiveCard}>
        <View style={styles.goLiveIconRing}>
          <Text style={styles.goLiveSparkle}>✨</Text>
        </View>
        <Text style={styles.goLiveLabel}>Go Live</Text>
      </LinearGradient>
    </Pressable>;
}

function StoryCard({ story, theme }) {
  return <View style={styles.storyItem}>
      <GradientRing size={scaleModerate(66)}>
        <View style={[styles.storyAvatarWrap, { backgroundColor: theme.surfaces.page }]}>
          <Avatar value={story.photo} fullName={story.name} size={scaleModerate(58)} />
        </View>
      </GradientRing>
      {story.live ? <View style={[styles.storyLiveBadge, { backgroundColor: theme.colors.liveBadge }]}>
          <Text style={styles.storyLiveText}>LIVE</Text>
        </View> : null}
      <Text style={[styles.storyName, { color: theme.text.primary }]} numberOfLines={1}>{story.name}</Text>
    </View>;
}

function StoriesRow({ theme, onGoLive }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
      <GoLiveStoryCard theme={theme} onPress={onGoLive} />
      {DUMMY_STORIES.map(story => <StoryCard key={story.id} story={story} theme={theme} />)}
    </ScrollView>;
}

const DOUBLE_TAP_MS = 280;

// Client-only for now (no Post model on the backend yet — see
// docs/discover-posts-api-spec.md) — liked/saved state and the bumped
// like count just live in this component and reset on reload, same as
// every other placeholder in Discover.
function PostCard({ post, theme, onOpenComments, isOwnPost, onEdit, onDelete }) {
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount ?? 0);
  const heartScale = React.useRef(new Animated.Value(1)).current;
  const bigHeartScale = React.useRef(new Animated.Value(0)).current;
  const bigHeartOpacity = React.useRef(new Animated.Value(0)).current;
  const borderAnim = React.useRef(new Animated.Value(0)).current;
  const lastTapRef = React.useRef(0);

  // Slow color-cycling glow — the "Neon Pulse" theme's magenta/cyan/purple
  // trio. Color interpolation isn't supported by the native driver, so
  // this stays JS-driven.
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(borderAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [theme.colors.teal700, theme.colors.secondary, theme.colors.tertiary, theme.colors.teal700]
  });

  const playHeartBump = () => {
    heartScale.setValue(0.7);
    Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  const like = () => {
    if (liked) {
      return;
    }
    setLiked(true);
    setLikeCount(count => count + 1);
  };

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount(count => count + (liked ? -1 : 1));
    playHeartBump();
  };

  const playBigHeart = () => {
    bigHeartScale.setValue(0.4);
    bigHeartOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(bigHeartScale, { toValue: 1.1, friction: 4, useNativeDriver: true }),
      Animated.timing(bigHeartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(bigHeartOpacity, { toValue: 0, duration: 250, delay: 350, useNativeDriver: true })
    ]).start();
  };

  const handleImagePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      like();
      playHeartBump();
      playBigHeart();
    }
    lastTapRef.current = now;
  };

  const handleShare = () => {
    Share.share({ message: post.description || 'Check out this post on Streamline' }).catch(() => {});
  };

  // Dark glass base (theme.surfaces.card, not the near-black "Soft" tokens
  // — secondarySoft/tertiarySoft are almost black themselves, so blending
  // them just read as plain black instead of a bluish tint) plus a
  // separate, subtle cyan/purple tint layer on top for the neon hint,
  // and an animated color-cycling border to match.
  return <AnimatedLinearGradient
      colors={[hexToRgba(theme.surfaces.card, 0.6), hexToRgba(theme.surfaces.card, 0.4)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor, shadowColor: theme.colors.tertiary }]}
    >
      <LinearGradient
        colors={[hexToRgba(theme.colors.secondary, 0.14), hexToRgba(theme.colors.tertiary, 0.14)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardTint}
        pointerEvents="none"
      />
      <View style={styles.cardHeader}>
        <GradientRing size={scaleModerate(42)}>
          <View style={[styles.cardAvatarWrap, { backgroundColor: theme.surfaces.card }]}>
            <Avatar value={post.author?.profileImage} fullName={post.author?.fullName} size={scaleModerate(36)} />
          </View>
        </GradientRing>
        <View style={styles.cardHeaderText}>
          <VerifiedName name={post.author?.fullName || 'Unknown'} isOfficial={post.author?.isOfficial} textStyle={[styles.authorName, { color: theme.text.primary }]} />
          <View style={styles.metaRow}>
            <Text style={[styles.timestamp, { color: theme.text.secondary }]}>{timeAgo(post.createdAt)}</Text>
            {post.live ? <>
                <Text style={[styles.timestamp, { color: theme.text.secondary }]}> • </Text>
                <View style={[styles.liveTag, { backgroundColor: theme.colors.liveBadge }]}>
                  <Text style={styles.liveTagText}>LIVE</Text>
                </View>
              </> : null}
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          {isOwnPost ? <Pressable
              hitSlop={8}
              onPress={() => showAlert('Post Options', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Edit', onPress: () => onEdit(post) },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(post) }
              ])}
            >
              <DotsIcon size={17} color={theme.text.secondary} />
            </Pressable> : null}
          {post.views ? <View style={styles.viewsPill}>
              <Text style={styles.viewsEye}>👁</Text>
              <Text style={styles.viewsText}>{post.views}</Text>
            </View> : null}
        </View>
      </View>

      {post.description ? <Text style={[styles.description, { color: theme.text.primary }]}>{post.description}</Text> : null}

      {post.category ? <View style={[styles.categoryChip, { backgroundColor: theme.state.soft }]}>
          <Text style={styles.categoryIcon}>{post.category.icon}</Text>
          <Text style={[styles.categoryLabel, { color: theme.colors.teal700 }]}>{post.category.label}</Text>
        </View> : null}

      {post.imageUrl ? <Pressable onPress={handleImagePress} style={styles.postImageWrap}>
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
          <Animated.View style={[styles.bigHeart, { opacity: bigHeartOpacity, transform: [{ scale: bigHeartScale }] }]} pointerEvents="none">
            <HeartIcon size={scaleModerate(90)} color="#FFFFFF" filled />
          </Animated.View>
          {post.duration ? <View style={styles.durationPill}>
              <PlayIcon size={13} color="#FFFFFF" />
              <Text style={styles.durationText}>{post.duration}</Text>
            </View> : null}
        </Pressable> : null}

      <View style={styles.actionRow}>
        <View style={styles.actionRowLeft}>
          <Pressable onPress={toggleLike} hitSlop={8} style={styles.actionButton}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <HeartIcon size={scaleModerate(22)} color={liked ? theme.colors.liveBadge : theme.text.primary} filled={liked} />
            </Animated.View>
            <Text style={[styles.actionCount, { color: theme.text.primary }]}>{formatCount(likeCount)}</Text>
          </Pressable>
          <Pressable onPress={() => onOpenComments(post)} hitSlop={8} style={styles.actionButton}>
            <MessageIcon size={21} color={theme.text.primary} />
            <Text style={[styles.actionCount, { color: theme.text.primary }]}>{formatCount(post.commentCount ?? 0)}</Text>
          </Pressable>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.actionButton}>
            <RepostIcon size={20} color={theme.text.primary} />
            <Text style={[styles.actionCount, { color: theme.text.primary }]}>{formatCount(post.shareCount ?? 0)}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => setSaved(current => !current)} hitSlop={8}>
          <BookmarkIcon size={scaleModerate(22)} color={saved ? theme.colors.teal700 : theme.text.primary} filled={saved} />
        </Pressable>
      </View>

      {post.commentCount ? <Pressable onPress={() => onOpenComments(post)}>
          <Text style={[styles.viewComments, { color: theme.text.secondary }]}>View all {formatCount(post.commentCount)} comments</Text>
        </Pressable> : null}
    </AnimatedLinearGradient>;
}

// theme.colors.teal700 (#RRGGBB) at a fixed alpha, for the active tab's
// text-shadow glow — textShadowColor needs an rgba, and the theme only
// exposes solid hex tokens.
function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function TabBar({ activeTab, onSelectTab, theme }) {
  return <View style={[styles.tabBar, { borderBottomColor: theme.colors.cardBorder }]}>
      {DISCOVER_TABS.map(tab => {
        const active = tab.id === activeTab;
        return <Pressable key={tab.id} onPress={() => onSelectTab(tab.id)} style={styles.tabItem}>
            <Text style={[
              styles.tabLabel,
              { color: active ? theme.colors.teal700 : theme.text.secondary },
              active && [styles.tabLabelActive, { textShadowColor: hexToRgba(theme.colors.teal700, 0.65) }]
            ]}>
              {tab.label}
            </Text>
            {active ? <View style={[styles.tabIndicator, { backgroundColor: theme.colors.teal700, shadowColor: theme.colors.teal700 }]} /> : null}
          </Pressable>;
      })}
    </View>;
}

function ReelCard({ reel, theme }) {
  return <View style={styles.reelCard}>
      <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumbnail} resizeMode="cover" />
      <View style={styles.reelViewsBadge}>
        <Text style={styles.reelViewsText}>▶ {reel.views}</Text>
      </View>
    </View>;
}

// Swipeable like the "Live / Party / Games" tabs elsewhere in the app —
// a paging ScrollView holding one full-width pane per tab, kept in sync
// both ways with the tab bar (tapping a tab scrolls to its pane, swiping
// updates which tab reads as active). "For You" is backed by the real
// GET /api/posts feed — see docs/discover-posts-api-spec.md, now
// implemented on StreamLine-Portal, falling back to DUMMY_POSTS when
// empty. Reels stays on DUMMY_REELS since no Reels model/endpoint exists
// yet.
export function DiscoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const sessionToken = session?.token;
  const [activeTab, setActiveTab] = React.useState(DISCOVER_TABS[0].id);
  const scrollRef = React.useRef(null);
  const [posts, setPosts] = React.useState([]);
  const [loadingPosts, setLoadingPosts] = React.useState(true);
  const [postsLoadError, setPostsLoadError] = React.useState(false);
  const [refreshingPosts, setRefreshingPosts] = React.useState(false);

  // "Go Live" on the stories row — same create-room flow the tab bar's "+"
  // uses on every tab except Discover (see CustomTabBar's handleCenterPress).
  const [streamOptionsVisible, setStreamOptionsVisible] = React.useState(false);
  const [roomTitleVisible, setRoomTitleVisible] = React.useState(false);
  const [seatLayoutVisible, setSeatLayoutVisible] = React.useState(false);
  const [pendingRoomTitle, setPendingRoomTitle] = React.useState(null);
  const [isCheckingRoom, setIsCheckingRoom] = React.useState(false);
  const defaultRoomTitle = `${session?.user?.fullName || 'My'}'s Room`;

  const loadPosts = React.useCallback(() => {
    if (!sessionToken) {
      return;
    }
    setPostsLoadError(false);
    fetchPosts(sessionToken)
      .then(({ posts: fetched }) => setPosts(fetched))
      .catch(() => setPostsLoadError(true))
      .finally(() => {
        setLoadingPosts(false);
        setRefreshingPosts(false);
      });
  }, [sessionToken]);

  useFocusEffect(
    React.useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleRefreshPosts = () => {
    setRefreshingPosts(true);
    loadPosts();
  };

  // No comments backend/UI exists yet — same "in development" placeholder
  // pattern used for Live Video (see CustomTabBar's handleSelectVideo).
  const handleOpenComments = () => {
    navigation.navigate(routes.comingSoon, {
      title: 'Comments',
      message: "Commenting on posts is still in development. We're working on it — check back soon!"
    });
  };

  const handleEditPost = post => {
    navigation.navigate(routes.createPost, {
      postId: post.id,
      initialDescription: post.description ?? '',
      initialImageUrl: post.imageUrl ?? null
    });
  };

  const handleDeletePost = post => {
    showAlert('Delete Post', 'This can\'t be undone. Delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost(sessionToken, post.id)
            .then(() => setPosts(current => current.filter(item => item.id !== post.id)))
            .catch(error => {
              showAlert('Unable to Delete', error instanceof CreatePostError ? error.message : 'Something went wrong. Please try again.');
            });
        }
      }
    ]);
  };

  const handleOpenSearch = () => {
    navigation.navigate(routes.userSearch);
  };

  const handleOpenNotifications = () => {
    navigation.navigate(routes.comingSoon, {
      title: 'Notifications',
      message: "Discover notifications are still in development. We're working on it — check back soon!"
    });
  };

  const handleGoLive = async () => {
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
    const canResumeWithoutAsking =
      existingRoom?.status === 'LIVE' || (existingRoom?.status === 'IDLE' && Boolean(getCachedSeatState(existingRoom.roomId)));
    if (canResumeWithoutAsking) {
      const occupiedSeats = Math.max(0, (existingRoom.participantCount ?? 1) - 1);
      const fallbackLayout =
        SEAT_LAYOUT_OPTIONS.find(option => option.groups.reduce((sum, count) => sum + count, 0) >= occupiedSeats) ??
        SEAT_LAYOUT_OPTIONS[SEAT_LAYOUT_OPTIONS.length - 1];
      navigation.navigate(routes.room, { roomId: existingRoom.roomId, mode: 'audio', seatGroups: fallbackLayout.groups });
      return;
    }
    setStreamOptionsVisible(true);
  };

  const handleSelectAudio = () => {
    setStreamOptionsVisible(false);
    setRoomTitleVisible(true);
  };

  const handleSelectVideo = () => {
    setStreamOptionsVisible(false);
    navigation.navigate(routes.comingSoon, {
      title: 'Live Video',
      message: "Live video streaming is still in development. We're working on it — check back soon!"
    });
  };

  const handleConfirmRoomTitle = title => {
    setPendingRoomTitle(title);
    setRoomTitleVisible(false);
    setSeatLayoutVisible(true);
  };

  const handleConfirmSeatLayout = seatGroups => {
    setSeatLayoutVisible(false);
    navigation.navigate(routes.room, { mode: 'audio', seatGroups, roomName: pendingRoomTitle });
  };

  const handleSelectTab = tabId => {
    const index = DISCOVER_TABS.findIndex(tab => tab.id === tabId);
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ x: index * PAGE_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveTab(DISCOVER_TABS[index]?.id ?? DISCOVER_TABS[0].id);
  };

  return <Screen transparent>
      <StreamOptionModal visible={streamOptionsVisible} onClose={() => setStreamOptionsVisible(false)} onSelectAudio={handleSelectAudio} onSelectVideo={handleSelectVideo} />
      <RoomTitleModal visible={roomTitleVisible} defaultTitle={defaultRoomTitle} onClose={() => setRoomTitleVisible(false)} onConfirm={handleConfirmRoomTitle} />
      <SeatLayoutModal visible={seatLayoutVisible} onClose={() => setSeatLayoutVisible(false)} onConfirm={handleConfirmSeatLayout} />

      <ImageBackground source={discoverBackgroundImage} style={[styles.background, { paddingTop: insets.top }]} resizeMode="cover">
        <HeaderBar theme={theme} onSearch={handleOpenSearch} onOpenNotifications={handleOpenNotifications} hasUnreadNotifications />
        <TabBar activeTab={activeTab} onSelectTab={handleSelectTab} theme={theme} />
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          <View style={styles.page}>
            {loadingPosts ? <View style={styles.centerWrap}>
                <ActivityIndicator color={theme.colors.teal700} />
              </View> : postsLoadError ? <View style={styles.centerWrap}>
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Couldn't load Discover right now. Pull down to try again.</Text>
              </View> : <FlatList
                data={posts.length ? posts : DUMMY_POSTS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefreshPosts}
                refreshing={refreshingPosts}
                renderItem={({ item }) => <PostCard
                  post={item}
                  theme={theme}
                  onOpenComments={handleOpenComments}
                  isOwnPost={Boolean(session?.user?.publicId) && item.author?.publicId === session.user.publicId}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />}
                ListHeaderComponent={<StoriesRow theme={theme} onGoLive={handleGoLive} />}
              />}
          </View>
          <View style={styles.page}>
            <FlatList
              data={DUMMY_REELS}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.reelsList}
              columnWrapperStyle={styles.reelsRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <ReelCard reel={item} theme={theme} />}
            />
          </View>
        </ScrollView>
      </ImageBackground>
    </Screen>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(24)
  },
  page: {
    width: PAGE_WIDTH
  },
  list: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(100),
    gap: scaleModerate(14)
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10),
    paddingBottom: scaleModerate(4)
  },
  screenTitle: {
    fontSize: scaleFont(26),
    fontWeight: '800'
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleModerate(10)
  },
  headerButton: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: scaleModerate(20),
    overflow: 'hidden'
  },
  headerButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerButtonTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  headerDot: {
    position: 'absolute',
    top: scaleModerate(7),
    right: scaleModerate(8),
    width: scaleModerate(8),
    height: scaleModerate(8),
    borderRadius: scaleModerate(4),
    borderWidth: 1.5
  },
  tabBar: {
    flexDirection: 'row',
    gap: scaleModerate(24),
    paddingHorizontal: scaleModerate(16),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: scaleModerate(8)
  },
  tabLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600'
  },
  tabLabelActive: {
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  tabIndicator: {
    marginTop: scaleModerate(6),
    height: scaleModerate(2.5),
    width: '100%',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4
  },
  storiesRow: {
    gap: scaleModerate(14),
    paddingTop: scaleModerate(12),
    paddingBottom: scaleModerate(10)
  },
  storyItem: {
    alignItems: 'center',
    width: scaleModerate(70)
  },
  gradientRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(2.5)
  },
  storyAvatarWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(2)
  },
  // Matches the other story items' full column height (ring + LIVE badge
  // + name text below it) so it sits level with them, even though its own
  // label lives inside the card instead of underneath it.
  goLiveCard: {
    width: scaleModerate(70),
    height: scaleModerate(92),
    borderRadius: scaleModerate(20),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(8)
  },
  goLiveIconRing: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17),
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  goLiveSparkle: {
    fontSize: scaleFont(16)
  },
  goLiveLabel: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  storyLiveBadge: {
    marginTop: scaleModerate(-9),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(7),
    paddingVertical: scaleModerate(1.5),
    borderWidth: 2,
    borderColor: 'transparent'
  },
  storyLiveText: {
    color: '#FFFFFF',
    fontSize: scaleFont(8.5),
    fontWeight: '800'
  },
  storyName: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(11),
    fontWeight: '600',
    textAlign: 'center'
  },
  card: {
    borderRadius: scaleModerate(18),
    borderWidth: scaleModerate(1.5),
    padding: scaleModerate(12),
    gap: scaleModerate(8),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8
  },
  cardTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: scaleModerate(18)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10)
  },
  cardAvatarWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeaderText: {
    flex: 1
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: scaleModerate(6)
  },
  authorName: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleModerate(2)
  },
  timestamp: {
    fontSize: scaleFont(11)
  },
  liveTag: {
    borderRadius: scaleModerate(5),
    paddingHorizontal: scaleModerate(6),
    paddingVertical: scaleModerate(1.5)
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: scaleFont(9),
    fontWeight: '800'
  },
  viewsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3),
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  viewsEye: {
    fontSize: scaleFont(10)
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  description: {
    fontSize: scaleFont(14),
    lineHeight: 20
  },
  categoryChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: scaleModerate(5),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(4)
  },
  categoryIcon: {
    fontSize: scaleFont(12)
  },
  categoryLabel: {
    fontSize: scaleFont(11.5),
    fontWeight: '700'
  },
  postImageWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  postImage: {
    width: '100%',
    aspectRatio: 0.95,
    borderRadius: scaleModerate(14)
  },
  bigHeart: {
    position: 'absolute'
  },
  durationPill: {
    position: 'absolute',
    left: scaleModerate(10),
    bottom: scaleModerate(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(4),
    backgroundColor: 'rgba(0,0,0,0.55)'
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleModerate(8.4)
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(14),
    marginLeft: scaleModerate(12)
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  actionCount: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  viewComments: {
    fontSize: scaleFont(12.5),
    marginTop: scaleModerate(-4)
  },
  reelsList: {
    paddingHorizontal: scaleModerate(12),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(100),
    gap: scaleModerate(10)
  },
  reelsRow: {
    gap: scaleModerate(10)
  },
  reelCard: {
    flex: 1,
    aspectRatio: 0.62,
    borderRadius: scaleModerate(14),
    overflow: 'hidden',
    position: 'relative'
  },
  reelThumbnail: {
    width: '100%',
    height: '100%'
  },
  reelViewsBadge: {
    position: 'absolute',
    left: scaleModerate(8),
    bottom: scaleModerate(8),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  reelViewsText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  emptyText: {
    marginTop: scaleModerate(40),
    paddingHorizontal: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  }
});

export default DiscoverScreen;
