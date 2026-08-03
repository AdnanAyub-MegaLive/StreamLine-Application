import React from 'react';
import { Dimensions, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Screen, VerifiedName } from '../../components';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

const PAGE_WIDTH = Dimensions.get('window').width;

const DISCOVER_TABS = [
  { id: 'forYou', label: 'For You' },
  { id: 'reels', label: 'Reels' }
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

// No Post model/endpoint exists on StreamLine-Portal yet — see
// docs/discover-posts-api-spec.md. Static placeholder feed until that
// ships, same convention used elsewhere in the app (e.g. the Store
// catalog before its backend existed).
const DUMMY_POSTS = [
  {
    id: 'dummy-1',
    description: 'Had an amazing stream tonight, thank you all for joining! 🎤',
    imageUrl: 'https://picsum.photos/seed/streamline1/800/800',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: { fullName: 'Ayesha K.', profileImage: null, isOfficial: true }
  },
  {
    id: 'dummy-2',
    description: 'New agency hosts onboarding this week — excited for what\'s next!',
    imageUrl: 'https://picsum.photos/seed/streamline2/800/800',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    author: { fullName: 'Bilal R.', profileImage: null, isOfficial: false }
  },
  {
    id: 'dummy-3',
    description: 'Weekend gaming room was packed 🔥',
    imageUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    author: { fullName: 'Hamza M.', profileImage: null, isOfficial: false }
  }
];

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

function PostCard({ post, theme }) {
  return <View style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={styles.cardHeader}>
        <Avatar value={post.author?.profileImage} fullName={post.author?.fullName} size={scaleModerate(42)} />
        <View style={styles.cardHeaderText}>
          <VerifiedName name={post.author?.fullName || 'Unknown'} isOfficial={post.author?.isOfficial} textStyle={[styles.authorName, { color: theme.text.primary }]} />
          <Text style={[styles.timestamp, { color: theme.text.secondary }]}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {post.description ? <Text style={[styles.description, { color: theme.text.primary }]}>{post.description}</Text> : null}

      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" /> : null}
    </View>;
}

function TabBar({ activeTab, onSelectTab, theme }) {
  return <View style={[styles.tabBar, { borderBottomColor: theme.colors.cardBorder }]}>
      {DISCOVER_TABS.map(tab => {
        const active = tab.id === activeTab;
        return <Pressable key={tab.id} onPress={() => onSelectTab(tab.id)} style={styles.tabItem}>
            <Text style={[styles.tabLabel, { color: active ? theme.colors.teal700 : theme.text.secondary, fontWeight: active ? '800' : '600' }]}>
              {tab.label}
            </Text>
            {active ? <View style={[styles.tabIndicator, { backgroundColor: theme.colors.teal700 }]} /> : null}
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

// Real fetchPosts-backed version — switch back to this once
// docs/discover-posts-api-spec.md is implemented on StreamLine-Portal.
//
// import { useFocusEffect } from '@react-navigation/native';
// import { fetchPosts } from '../../api';
// import { useAppStore } from '../../store';
//
// export function DiscoverScreen() {
//   const theme = useTheme();
//   const sessionToken = useAppStore(state => state.session?.token);
//   const [posts, setPosts] = React.useState([]);
//   const [loading, setLoading] = React.useState(true);
//   const [loadError, setLoadError] = React.useState(false);
//   const [refreshing, setRefreshing] = React.useState(false);
//
//   const load = React.useCallback(() => {
//     if (!sessionToken) {
//       return;
//     }
//     setLoadError(false);
//     fetchPosts(sessionToken)
//       .then(({ posts: fetched }) => setPosts(fetched))
//       .catch(() => setLoadError(true))
//       .finally(() => {
//         setLoading(false);
//         setRefreshing(false);
//       });
//   }, [sessionToken]);
//
//   useFocusEffect(
//     React.useCallback(() => {
//       load();
//     }, [load])
//   );
//
//   const handleRefresh = () => {
//     setRefreshing(true);
//     load();
//   };
//
//   if (loading) {
//     return <Screen>
//         <View style={styles.centerWrap}>
//           <ActivityIndicator color={theme.colors.teal700} />
//         </View>
//       </Screen>;
//   }
//
//   if (loadError) {
//     return <Screen>
//         <View style={styles.centerWrap}>
//           <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Couldn't load Discover right now. Pull down to try again.</Text>
//         </View>
//       </Screen>;
//   }
//
//   return <Screen>
//       <FlatList
//         data={posts}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.list}
//         showsVerticalScrollIndicator={false}
//         onRefresh={handleRefresh}
//         refreshing={refreshing}
//         renderItem={({ item }) => <PostCard post={item} theme={theme} />}
//         ListHeaderComponent={<Text style={[styles.screenTitle, { color: theme.text.primary }]}>Discover</Text>}
//         ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text.secondary }]}>No posts yet. Tap + to share the first one.</Text>}
//       />
//     </Screen>;
// }

// Swipeable like the "Live / Party / Games" tabs elsewhere in the app —
// a paging ScrollView holding one full-width pane per tab, kept in sync
// both ways with the tab bar (tapping a tab scrolls to its pane, swiping
// updates which tab reads as active).
export function DiscoverScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState(DISCOVER_TABS[0].id);
  const scrollRef = React.useRef(null);

  const handleSelectTab = tabId => {
    const index = DISCOVER_TABS.findIndex(tab => tab.id === tabId);
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ x: index * PAGE_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveTab(DISCOVER_TABS[index]?.id ?? DISCOVER_TABS[0].id);
  };

  return <Screen>
      <Text style={[styles.screenTitle, styles.screenTitlePadded, { color: theme.text.primary }]}>Discover</Text>
      <TabBar activeTab={activeTab} onSelectTab={handleSelectTab} theme={theme} />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <View style={styles.page}>
          <FlatList
            data={DUMMY_POSTS}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <PostCard post={item} theme={theme} />}
          />
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
    </Screen>;
}

const styles = StyleSheet.create({
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
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(100),
    gap: scaleModerate(14)
  },
  screenTitle: {
    fontSize: scaleFont(24),
    fontWeight: '800'
  },
  screenTitlePadded: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10),
    marginBottom: scaleModerate(6)
  },
  tabBar: {
    flexDirection: 'row',
    gap: scaleModerate(24),
    paddingHorizontal: scaleModerate(16),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: scaleModerate(10)
  },
  tabLabel: {
    fontSize: scaleFont(14)
  },
  tabIndicator: {
    marginTop: scaleModerate(6),
    height: scaleModerate(2.5),
    width: '100%',
    borderRadius: 999
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
  card: {
    borderRadius: scaleModerate(18),
    borderWidth: 1,
    padding: scaleModerate(14),
    gap: scaleModerate(10)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10)
  },
  cardHeaderText: {
    flex: 1
  },
  authorName: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  timestamp: {
    fontSize: scaleFont(11),
    marginTop: scaleModerate(2)
  },
  description: {
    fontSize: scaleFont(14),
    lineHeight: 20
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: scaleModerate(14)
  },
  emptyText: {
    marginTop: scaleModerate(40),
    paddingHorizontal: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  }
});

export default DiscoverScreen;
