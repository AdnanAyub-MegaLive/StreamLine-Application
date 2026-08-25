import React from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, ImageBackground, Modal, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BookmarkIcon, discoverBackgroundImage, DotsIcon, HeartIcon, MessageIcon, PlayIcon, RepostIcon } from '../../assets';
import { CreatePostError, deletePost, fetchAudioRoom, fetchPosts, searchAudioRooms } from '../../api';
import { Avatar, RoomCoverModal, RoomTitleModal, SEAT_LAYOUT_OPTIONS, SeatLayoutModal, Screen, showAlert, StreamOptionModal, VerifiedName } from '../../components';
import { useUserAssets } from '../../hooks';
import { scaleFont, scaleModerate } from '../../utils';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { routes } from '../../navigation/routes';
import { DiscoverHeader } from './components/DiscoverHeader';

const PAGE_WIDTH = Dimensions.get('window').width;
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const DISCOVER_TABS = [
  { id: 'forYou', label: 'For You' },
  { id: 'reels', label: 'Reels' }
];

function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/300?img=${(index % 70) + 1}`;
}

const DUMMY_STORIES = [
  { id: 'story-1', name: 'Obaid Zafar', photo: personPhotoForIndex(11), live: true },
  { id: 'story-2', name: 'Midnight Grind', photo: personPhotoForIndex(31), live: true },
  { id: 'story-3', name: 'Vaporwave Vibes', photo: personPhotoForIndex(42), live: false }
];

const DUMMY_REELS = [
  { id: 'reel-1', authorName: 'Obaid Zafar', authorAvatar: personPhotoForIndex(11), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel1/400/700', views: '12.4K' },
  { id: 'reel-2', authorName: 'Midnight Grind', authorAvatar: personPhotoForIndex(31), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel2/400/700', views: '3.1K' },
  { id: 'reel-3', authorName: 'Vaporwave Vibes', authorAvatar: personPhotoForIndex(42), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel3/400/700', views: '842' },
  { id: 'reel-4', authorName: 'Obaid Zafar', authorAvatar: personPhotoForIndex(11), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel4/400/700', views: '9.7K' },
  { id: 'reel-5', authorName: 'Midnight Grind', authorAvatar: personPhotoForIndex(31), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel5/400/700', views: '221' },
  { id: 'reel-6', authorName: 'Vaporwave Vibes', authorAvatar: personPhotoForIndex(42), thumbnailUrl: 'https://picsum.photos/seed/streamlinereel6/400/700', views: '5.6K' }
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

function GradientRing({ size, children }) {
  const theme = useTheme();
  return <LinearGradient colors={[theme.colors.teal200, theme.colors.tertiary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientRing, { width: size, height: size, borderRadius: size / 2 }]}>
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

// Matches rooms by Room ID or Room Name even when empty/idle (owner
// offline) — deliberately separate from the Party tab's trending list,
// which only ever shows currently-occupied rooms. See
// docs/audio-room-persistent-lifecycle-spec.md.
// BUGFIX: this used to render Avatar with no frameUri at all — the owner's
// equipped frame was simply never resolved, even though it's already
// available as room.owner.frameUrl from the search endpoint. Split out
// into its own component (was inline in a .map()) specifically so
// useUserAssets can be called correctly — hooks can't be called inside a
// loop/callback.
function RoomSearchResultRow({ room, theme, onOpenRoom }) {
  const { frameUri } = useUserAssets({ userId: room.owner?.id, frameUrl: room.owner?.frameUrl });
  return <Pressable
      onPress={() => onOpenRoom(room)}
      style={[styles.roomResultRow, { borderColor: theme.colors.cardBorder, backgroundColor: theme.surfaces.card }]}
    >
      <Avatar value={room.owner?.profileImage} fullName={room.owner?.name} size={scaleModerate(40)} frameUri={frameUri} />
      <View style={styles.roomResultText}>
        <Text style={[styles.roomResultTitle, { color: theme.text.primary }]} numberOfLines={1}>{room.title}</Text>
        <Text style={[styles.roomResultMeta, { color: theme.text.secondary }]} numberOfLines={1}>
          RID: {room.roomId} · {room.participantCount ?? 0} live
        </Text>
      </View>
    </Pressable>;
}

function RoomSearchResults({ rooms, theme, onOpenRoom }) {
  return <View style={styles.roomResultsWrap}>
      <Text style={[styles.roomResultsHeading, { color: theme.text.secondary }]}>Rooms</Text>
      {rooms.map(room => <RoomSearchResultRow key={room.roomId} room={room} theme={theme} onOpenRoom={onOpenRoom} />)}
    </View>;
}

const DOUBLE_TAP_MS = 280;
function PostCard({ post, theme, onOpenComments, isOwnPost, onEdit, onDelete }) {
  const navigation = useNavigation();
  // GET /api/posts doesn't return the author's frameUrl/badgeUrl yet (see
  // docs/discover-posts-api-spec.md), so post.author.frameUrl is always
  // undefined today — for your OWN posts, resolve the frame from your own
  // equipped props instead (same convention as ProfileScreen/RoomScreen),
  // so it isn't blocked on that backend gap. Other authors' frames still
  // wait on that field.
  const { frameUri: authorFrameUri, badgeUri: authorBadgeUri } = useUserAssets(
    isOwnPost
      ? undefined
      : {
          userId: post.author?.publicId ?? 'unknown-user',
          frameUrl: post.author?.publicId ? post.author?.frameUrl : null,
          badgeUrl: post.author?.publicId ? post.author?.badgeUrl : null
        }
  );
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount ?? 0);
  const heartScale = React.useRef(new Animated.Value(1)).current;
  const bigHeartScale = React.useRef(new Animated.Value(0)).current;
  const bigHeartOpacity = React.useRef(new Animated.Value(0)).current;
  const lastTapRef = React.useRef(0);

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
  const handleOpenAuthorProfile = () => {
    if (!post.author?.publicId) {
      return;
    }
    navigation.navigate(routes.userProfile, {
      userId: post.author.publicId,
      userName: post.author.fullName,
      userAvatar: post.author.profileImage,
      userFrameUrl: post.author.frameUrl,
      userBadgeUrl: post.author.badgeUrl,
      userGender: post.author.gender,
      userDob: post.author.dob,
      userIsOfficial: post.author.isOfficial
    });
  };
  return <AnimatedLinearGradient
      colors={[hexToRgba(theme.surfaces.card, 0.6), hexToRgba(theme.surfaces.card, 0.4)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { shadowColor: theme.colors.tertiary }]}
    >
      <LinearGradient
        colors={[hexToRgba(theme.colors.neutral900, 0.5), hexToRgba(theme.colors.neutral900, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardTint}
        pointerEvents="none"
      />
      <View style={styles.cardHeader}>
        <Pressable onPress={handleOpenAuthorProfile} hitSlop={4}>
          <Avatar value={post.author?.profileImage} fullName={post.author?.fullName} size={scaleModerate(42)} frameUri={authorFrameUri} />
        </Pressable>
        <Pressable onPress={handleOpenAuthorProfile} style={styles.cardHeaderText}>
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
        </Pressable>
        <View style={styles.cardHeaderRight}>
          <View style={styles.cardHeaderRightTopRow}>
            {authorBadgeUri ? <Image source={{ uri: authorBadgeUri }} style={styles.cardAuthorBadge} resizeMode="contain" /> : null}
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
          </View>
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

function ReelCard({ reel, theme, onPress }) {
  return <LinearGradient
      colors={[theme.colors.teal700, theme.colors.teal700, theme.colors.vipGoldText]}
      locations={[0, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.reelCardBorder, { shadowColor: theme.colors.teal700 }]}
    >
      <Pressable onPress={onPress} style={styles.reelCard}>
        <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelThumbnail} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', hexToRgba('#000000', 0.6)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.reelShade}
          pointerEvents="none"
        />
        <View style={styles.reelPlayGlyph}>
          <PlayIcon size={16} color="#FFFFFF" />
        </View>
        <LinearGradient
          colors={[theme.colors.teal700, theme.colors.vipGoldText]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.reelViewsBadge}
        >
          <Text style={styles.reelViewsText}>▶ {reel.views}</Text>
        </LinearGradient>
      </Pressable>
    </LinearGradient>;
}

function ReelActionButton({ Icon, color, filled, onPress }) {
  return <Pressable onPress={onPress} style={[styles.reelPageActionButton, { borderColor: color, shadowColor: color }]}>
      <Icon size={20} color={color} filled={filled} />
    </Pressable>;
}

function ReelPage({ reel, insets, pageHeight }) {
  const [liked, setLiked] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const theme = useTheme();

  const actions = [
    { key: 'like', Icon: HeartIcon, color: theme.colors.teal200, filled: liked, onPress: () => setLiked(value => !value) },
    { key: 'comment', Icon: MessageIcon, color: theme.colors.secondary },
    { key: 'share', Icon: RepostIcon, color: theme.colors.tertiary },
    { key: 'save', Icon: BookmarkIcon, color: theme.colors.teal200, filled: saved, onPress: () => setSaved(value => !value) }
  ];

  return <View style={[styles.reelPage, { height: pageHeight }]}>
      <Image source={{ uri: reel.thumbnailUrl }} style={styles.reelPreviewPlayer} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={[styles.reelPageTopShade, { height: insets.top + scaleModerate(60) }]} pointerEvents="none" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.reelPageBottomShade} pointerEvents="none" />

      <View style={[styles.reelPageInfo, { paddingBottom: insets.bottom + scaleModerate(20) }]}>
        <View style={styles.reelPageAuthorRow}>
          <Avatar value={reel.authorAvatar} fullName={reel.authorName} size={scaleModerate(34)} style={[styles.reelPageAuthorAvatar, { borderColor: theme.colors.teal700 }]} />
          <Text style={styles.reelPageAuthorName} numberOfLines={1}>{reel.authorName}</Text>
        </View>
        <Text style={styles.reelPageViews}>▶ {reel.views} views</Text>
      </View>

      <View style={[styles.reelPageActions, { bottom: insets.bottom + scaleModerate(24) }]}>
        {actions.map(action => <ReelActionButton key={action.key} Icon={action.Icon} color={action.color} filled={action.filled} onPress={action.onPress} />)}
      </View>
    </View>;
}

function ReelPreviewModal({ reels, initialIndex, onClose }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [pageHeight, setPageHeight] = React.useState(0);
  const listRef = React.useRef(null);

  return <Modal visible={initialIndex !== null} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.reelPreviewBackdrop} onLayout={event => setPageHeight(event.nativeEvent.layout.height)}>
        <Pressable onPress={onClose} style={[styles.reelPreviewClose, { top: insets.top + scaleModerate(10), borderColor: theme.colors.teal200, shadowColor: theme.colors.teal200 }]} hitSlop={12}>
          <Text style={styles.reelPreviewCloseText}>✕</Text>
        </Pressable>

        {initialIndex !== null && pageHeight > 0 ? <FlatList
            ref={listRef}
            data={reels}
            keyExtractor={item => item.id}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ReelPage reel={item} insets={insets} pageHeight={pageHeight} />}
          /> : null}
      </View>
    </Modal>;
}

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
  const [previewIndex, setPreviewIndex] = React.useState(null);
  const [searchActive, setSearchActive] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roomResults, setRoomResults] = React.useState([]);
  const [streamOptionsVisible, setStreamOptionsVisible] = React.useState(false);
  const [roomTitleVisible, setRoomTitleVisible] = React.useState(false);
  const [roomCoverVisible, setRoomCoverVisible] = React.useState(false);
  const [seatLayoutVisible, setSeatLayoutVisible] = React.useState(false);
  const [pendingRoomTitle, setPendingRoomTitle] = React.useState(null);
  const [pendingCoverImage, setPendingCoverImage] = React.useState(null);
  // Set from the same fetchAudioRoom call handleGoLive already makes, so
  // the cover step only appears for a room that doesn't have one yet — a
  // returning owner whose persistent room already has a cover shouldn't be
  // asked to pick one again every time they go live.
  const [hasExistingRoomCover, setHasExistingRoomCover] = React.useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = React.useState(false);
  const defaultRoomTitle = `${session?.user?.fullName || 'My'}'s Room`;

  const loadPosts = React.useCallback(() => {
    if (!sessionToken) {
      setPostsLoadError(true);
      setLoadingPosts(false);
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
    setSearchActive(true);
  };

  const handleCloseSearch = () => {
    setSearchActive(false);
    setSearchQuery('');
    setRoomResults([]);
  };

  // Separate from the local post/reel filtering below — rooms aren't
  // pre-loaded client-side (an empty/idle room with the owner offline
  // wouldn't be in any already-fetched list), so this hits the dedicated
  // search endpoint instead. Debounced so every keystroke doesn't fire a
  // request. See docs/audio-room-persistent-lifecycle-spec.md.
  React.useEffect(() => {
    const query = searchQuery.trim();
    if (!query || !sessionToken) {
      setRoomResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchAudioRooms(sessionToken, query).then(rooms => {
        if (!cancelled) {
          setRoomResults(rooms);
        }
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, sessionToken]);

  const handleOpenRoomResult = room => {
    navigation.navigate(routes.room, {
      roomId: room.roomId,
      roomName: room.title,
      mode: 'audio',
      asViewer: true
    });
  };

  const searchQueryLower = searchQuery.trim().toLowerCase();
  const visiblePosts = searchQueryLower
    ? (posts.length ? posts : DUMMY_POSTS).filter(post => post.author?.fullName?.toLowerCase().includes(searchQueryLower))
    : (posts.length ? posts : DUMMY_POSTS);
  const visibleReels = searchQueryLower
    ? DUMMY_REELS.filter(reel => reel.authorName?.toLowerCase().includes(searchQueryLower))
    : DUMMY_REELS;

  const handleOpenNotifications = () => {
    navigation.navigate(routes.notifications);
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
    setHasExistingRoomCover(Boolean(existingRoom?.coverImageUrl));
    // BUGFIX: this used to only resume straight in if the room was
    // currently LIVE, or IDLE with a local device cache of the seat
    // layout — meaning a persistent room (created once, per
    // docs/audio-room-persistent-lifecycle-spec.md) still re-ran the full
    // Title → Cover → Seat Layout wizard every single time on a fresh
    // install, a cleared cache, or a different device, even though the
    // room itself already exists with a title/cover already set. A
    // persistent room existing at all (any non-terminated, non-blocked
    // status) is now enough to resume directly — changing the room's name
    // or seat layout afterward belongs in RoomScreen's own More menu
    // (already built — SeatLayoutModal/showSeatLayoutOption), not this
    // one-time setup flow repeating itself.
    const canResumeWithoutAsking = Boolean(existingRoom?.roomId) && existingRoom.status !== 'TERMINATED' && !existingRoom.isBlocked;
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
    if (hasExistingRoomCover) {
      setSeatLayoutVisible(true);
    } else {
      setRoomCoverVisible(true);
    }
  };

  const handleConfirmRoomCover = image => {
    setPendingCoverImage(image);
    setRoomCoverVisible(false);
    setSeatLayoutVisible(true);
  };

  const handleConfirmSeatLayout = seatGroups => {
    setSeatLayoutVisible(false);
    navigation.navigate(routes.room, { mode: 'audio', seatGroups, roomName: pendingRoomTitle, pendingCoverImage });
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
      <RoomCoverModal visible={roomCoverVisible} onClose={() => setRoomCoverVisible(false)} onConfirm={handleConfirmRoomCover} />
      <SeatLayoutModal visible={seatLayoutVisible} onClose={() => setSeatLayoutVisible(false)} onConfirm={handleConfirmSeatLayout} />

      <ImageBackground source={discoverBackgroundImage} style={[styles.background, { paddingTop: insets.top }]} resizeMode="cover">
        <DiscoverHeader
          theme={theme}
          onOpenSearch={handleOpenSearch}
          onCloseSearch={handleCloseSearch}
          searchActive={searchActive}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onOpenNotifications={handleOpenNotifications}
          hasUnreadNotifications
          styles={styles}
        />
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
              </View> : <FlatList
                data={visiblePosts}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshingPosts}
                    onRefresh={handleRefreshPosts}
                    tintColor={theme.colors.teal700}
                    colors={[theme.colors.teal700]}
                    progressBackgroundColor={theme.surfaces.card}
                  />
                }
                renderItem={({ item }) => <PostCard
                  post={item}
                  theme={theme}
                  onOpenComments={handleOpenComments}
                  isOwnPost={Boolean(session?.user?.publicId) && item.author?.publicId === session.user.publicId}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />}
                ListHeaderComponent={<>
                  <StoriesRow theme={theme} onGoLive={handleGoLive} />
                  {postsLoadError ? <Text style={[styles.connectionNotice, { color: theme.text.secondary }]}>Couldn't connect to the server — showing sample posts.</Text> : null}
                  {searchQueryLower && roomResults.length ? <RoomSearchResults rooms={roomResults} theme={theme} onOpenRoom={handleOpenRoomResult} /> : null}
                </>}
              />}
          </View>
          <View style={styles.page}>
            <FlatList
              data={visibleReels}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.reelsList}
              columnWrapperStyle={styles.reelsRow}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => <ReelCard reel={item} theme={theme} onPress={() => setPreviewIndex(index)} />}
            />
          </View>
        </ScrollView>
      </ImageBackground>

      <ReelPreviewModal reels={visibleReels} initialIndex={previewIndex} onClose={() => setPreviewIndex(null)} />
    </Screen>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  roomResultsWrap: {
    paddingHorizontal: scaleModerate(16),
    marginBottom: scaleModerate(12),
    gap: scaleModerate(8)
  },
  roomResultsHeading: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    letterSpacing: 0.4
  },
  roomResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    padding: scaleModerate(10)
  },
  roomResultText: {
    flex: 1
  },
  roomResultTitle: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  roomResultMeta: {
    fontSize: scaleFont(10.5),
    marginTop: scaleModerate(2)
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
    height: scaleModerate(54),
    justifyContent: 'center',
    paddingTop: scaleModerate(10)
  },
  headerBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16)
  },
  headerBarRowAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  screenTitle: {
    fontSize: scaleFont(26),
    fontWeight: '800'
  },
  headerActions: {
    flexDirection: 'row',
    gap: scaleModerate(10)
  },
  searchBarWrap: {
    flex: 1,
    marginRight: scaleModerate(10)
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    height: scaleModerate(40)
  },
  searchInput: {
    flex: 1,
    fontSize: scaleFont(14),
    padding: 0
  },
  searchCancel: {
    fontSize: scaleFont(13),
    fontWeight: '700'
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
    borderColor: 'transparent',
    overflow: 'hidden',
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
  cardHeaderText: {
    flex: 1
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: scaleModerate(6)
  },
  cardHeaderRightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  cardAuthorBadge: {
    width: scaleModerate(32),
    height: scaleModerate(32)
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
  reelCardBorder: {
    flex: 1,
    aspectRatio: 0.62,
    borderRadius: scaleModerate(16),
    padding: scaleModerate(1.5),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6
  },
  reelCard: {
    flex: 1,
    borderRadius: scaleModerate(15),
    overflow: 'hidden',
    position: 'relative'
  },
  reelThumbnail: {
    width: '100%',
    height: '100%'
  },
  reelShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%'
  },
  reelPlayGlyph: {
    position: 'absolute',
    top: '42%',
    left: '42%',
    width: scaleModerate(30),
    height: scaleModerate(30),
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  reelViewsBadge: {
    position: 'absolute',
    left: scaleModerate(8),
    bottom: scaleModerate(8),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  reelViewsText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  reelPreviewBackdrop: {
    flex: 1,
    backgroundColor: '#000000'
  },
  reelPreviewClose: {
    position: 'absolute',
    right: scaleModerate(20),
    zIndex: 2,
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6
  },
  reelPreviewCloseText: {
    color: '#FFFFFF',
    fontSize: scaleFont(16),
    fontWeight: '700'
  },
  reelPreviewPlayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  reelPage: {
    width: '100%',
    backgroundColor: '#000000'
  },
  reelPageTopShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  },
  reelPageBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%'
  },
  reelPageInfo: {
    position: 'absolute',
    left: scaleModerate(16),
    right: scaleModerate(80),
    bottom: 0
  },
  reelPageAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    marginBottom: scaleModerate(8)
  },
  reelPageAuthorAvatar: {
    borderWidth: 1.5
  },
  reelPageAuthorName: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  reelPageViews: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  reelPageActions: {
    position: 'absolute',
    right: scaleModerate(14),
    alignItems: 'center',
    gap: scaleModerate(18)
  },
  reelPageActionButton: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6
  },
  connectionNotice: {
    marginBottom: scaleModerate(12),
    fontSize: scaleFont(12),
    fontWeight: '600',
    textAlign: 'center'
  },
  emptyText: {
    marginTop: scaleModerate(40),
    paddingHorizontal: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  }
});

export default DiscoverScreen;
