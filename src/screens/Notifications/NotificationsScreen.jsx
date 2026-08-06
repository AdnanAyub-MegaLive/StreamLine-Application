import React from 'react';
import { Dimensions, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { notificationBackgroundImage } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/300?img=${(index % 70) + 1}`;
}

const NOTIFICATION_ICON = { like: '❤️', comment: '💬', follow: '➕', mention: '📣', reel: '🎬' };
const NOTIFICATION_COLOR = { like: '#FF4DA3', comment: '#00F2FF', follow: '#7000FF', mention: '#F0B93D', reel: '#FF007F' };

const NOTIFICATIONS = {
  'For You': [
    { id: 'n1', type: 'like', name: 'Ayesha Khan', avatar: personPhotoForIndex(15), text: 'liked your post', time: '2m', thumbnail: 'https://picsum.photos/seed/streamline1/200/200' },
    { id: 'n2', type: 'comment', name: 'Bilal R.', avatar: personPhotoForIndex(12), text: 'commented: "This is amazing 🔥"', time: '18m', thumbnail: 'https://picsum.photos/seed/streamline2/200/200' },
    { id: 'n3', type: 'follow', name: 'GameOn', avatar: personPhotoForIndex(23), text: 'started following you', time: '1h' },
    { id: 'n4', type: 'mention', name: 'SynthWave', avatar: personPhotoForIndex(34), text: 'mentioned you in a comment', time: '3h', thumbnail: 'https://picsum.photos/seed/streamline3/200/200' },
    { id: 'n5', type: 'like', name: 'ChillZone', avatar: personPhotoForIndex(45), text: 'and 24 others liked your post', time: '6h', thumbnail: 'https://picsum.photos/seed/streamline4/200/200' }
  ],
  Reels: [
    { id: 'r1', type: 'like', name: 'Obaid Zafar', avatar: personPhotoForIndex(11), text: 'liked your reel', time: '5m', thumbnail: 'https://picsum.photos/seed/streamlinereel1/200/200' },
    { id: 'r2', type: 'comment', name: 'VibeQueen', avatar: personPhotoForIndex(19), text: 'commented: "Loved this 😍"', time: '40m', thumbnail: 'https://picsum.photos/seed/streamlinereel2/200/200' },
    { id: 'r3', type: 'reel', name: 'NightRider', avatar: personPhotoForIndex(27), text: 'shared your reel', time: '2h', thumbnail: 'https://picsum.photos/seed/streamlinereel3/200/200' },
    { id: 'r4', type: 'follow', name: 'ShadowX', avatar: personPhotoForIndex(38), text: 'started following you', time: '5h' },
    { id: 'r5', type: 'like', name: 'Midnight Grind', avatar: personPhotoForIndex(31), text: 'and 12 others liked your reel', time: '1d', thumbnail: 'https://picsum.photos/seed/streamlinereel4/200/200' }
  ]
};

const TABS = ['For You', 'Reels'];
const PAGE_WIDTH = Dimensions.get('window').width;

function NotificationRow({ item, theme }) {
  const dotColor = NOTIFICATION_COLOR[item.type];
  return <Pressable style={[styles.row, { borderColor: theme.colors.cardBorder }]}>
      <View style={styles.rowAvatarWrap}>
        <Avatar value={item.avatar} fullName={item.name} size={scaleModerate(44)} />
        <View style={[styles.rowTypeBadge, { backgroundColor: dotColor, borderColor: theme.surfaces.page }]}>
          <Text style={styles.rowTypeBadgeText}>{NOTIFICATION_ICON[item.type]}</Text>
        </View>
      </View>

      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowText, { color: theme.text.primary }]} numberOfLines={2}>
          <Text style={styles.rowName}>{item.name}</Text> {item.text}
        </Text>
        <Text style={[styles.rowTime, { color: theme.text.secondary }]}>{item.time} ago</Text>
      </View>

      {item.type === 'follow' ? <Pressable>
          <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </LinearGradient>
        </Pressable> : item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.rowThumbnail} /> : null}
    </Pressable>;
}

export function NotificationsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState(TABS[0]);
  const pagerRef = React.useRef(null);

  const handleSelectTab = tab => {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: TABS.indexOf(tab) * PAGE_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveTab(TABS[index] ?? TABS[0]);
  };

  return <ImageBackground source={notificationBackgroundImage} resizeMode="cover" style={[styles.background, { backgroundColor: theme.surfaces.page }]}>
      <Screen transparent>
      <View style={[styles.header, { paddingTop: insets.top + scaleModerate(14) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => <Pressable key={tab} onPress={() => handleSelectTab(tab)} style={styles.tab}>
            <Text style={[styles.tabText, { color: tab === activeTab ? theme.colors.teal700 : theme.text.secondary }]}>{tab}</Text>
            {tab === activeTab ? <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabIndicator} /> : null}
          </Pressable>)}
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {TABS.map(tab => <ScrollView
            key={tab}
            style={{ width: PAGE_WIDTH }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + scaleModerate(24) }]}
          >
            {NOTIFICATIONS[tab].length ? NOTIFICATIONS[tab].map(item => <NotificationRow key={item.id} item={item} theme={theme} />) : <Text style={[styles.emptyText, { color: theme.text.secondary }]}>No notifications yet.</Text>}
          </ScrollView>)}
      </ScrollView>
      </Screen>
    </ImageBackground>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: scaleModerate(16),
    gap: scaleModerate(24),
    marginTop: scaleModerate(8)
  },
  tab: {
    alignItems: 'center',
    paddingBottom: scaleModerate(10)
  },
  tabText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  tabIndicator: {
    marginTop: scaleModerate(6),
    height: scaleModerate(3),
    width: scaleModerate(28),
    borderRadius: 999
  },
  list: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(10),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  rowAvatarWrap: {
    position: 'relative'
  },
  rowTypeBadge: {
    position: 'absolute',
    right: -scaleModerate(2),
    bottom: -scaleModerate(2),
    width: scaleModerate(18),
    height: scaleModerate(18),
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowTypeBadgeText: {
    fontSize: scaleFont(9)
  },
  rowTextWrap: {
    flex: 1
  },
  rowText: {
    fontSize: scaleFont(13),
    lineHeight: scaleModerate(18)
  },
  rowName: {
    fontWeight: '800'
  },
  rowTime: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
  },
  rowThumbnail: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: scaleModerate(8)
  },
  followButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(7)
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: scaleModerate(40),
    fontSize: scaleFont(13)
  }
});

export default NotificationsScreen;
