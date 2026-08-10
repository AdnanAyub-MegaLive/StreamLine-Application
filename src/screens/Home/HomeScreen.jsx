import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { homeBackgroundImage, SearchIcon, TrophyIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';
import { LiveTabContent, PartyTabContent, GamesTabContent } from './components';

const LOGO_BAR_COLORS = ['#00F2FF', '#7000FF', '#FF007F', '#7000FF', '#00F2FF'];
const LOGO_BAR_HEIGHTS = [8, 14, 20, 14, 8];

function LogoMark() {
  return <View style={styles.logoBars}>
      {LOGO_BAR_COLORS.map((color, index) => <View key={index} style={[styles.logoBar, { backgroundColor: color, height: scaleModerate(LOGO_BAR_HEIGHTS[index]) }]} />)}
    </View>;
}

function HeaderBar() {
  const theme = useTheme();
  const navigation = useNavigation();
  return <View style={styles.headerBar}>
      <View style={styles.logoRow}>
        <LogoMark />
        <Text style={[styles.headerTitle, { color: theme.colors.teal700 }]}>STREAMLINE</Text>
      </View>
      <View style={styles.headerActions}>
        <Pressable onPress={() => navigation.navigate(routes.userSearch)} hitSlop={10}>
          <SearchIcon size={22} color={theme.text.secondary} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate(routes.rankings)} hitSlop={10}>
          <TrophyIcon size={22} color={theme.text.secondary} />
        </Pressable>
      </View>
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

const HOME_TABS = ['party', 'live', 'games'];

export function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    width
  } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState('party');
  const pagerRef = React.useRef(null);
  // Disabled while a finger is on any nested horizontal scroller inside a
  // tab page (the Party banner, the Live tab's region filter row) — those
  // are horizontal scrolls too, and Android can't arbitrate them against
  // this horizontal pager. Uses setNativeProps (synchronous, applied
  // natively right now) rather than React state on purpose: a state
  // update lands a frame later, and the pager would intercept the very
  // start of the drag before the re-render disabled it — which is why
  // this only "sort of" worked when it used to be React state. Shared by
  // PartyBanner's onBannerScrolling and CountryFilterRow's
  // onFilterRowScrolling below.
  const handleBannerScrolling = React.useCallback(active => {
    pagerRef.current?.setNativeProps({ scrollEnabled: !active });
  }, []);
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
    setActiveTab(HOME_TABS[index] ?? 'party');
  };
  return <ImageBackground source={homeBackgroundImage} resizeMode="cover" style={[styles.background, { backgroundColor: theme.surfaces.page }]}>
      <Screen transparent>
        {/* Screen skips its own safe-area top padding in transparent mode
        (see Screen.jsx) — normally fine since most transparent screens
        want their background to run fully edge-to-edge under the status
        bar, but here it meant HeaderBar (search/title/trophy) rendered
        underneath the status bar itself, invisible behind its icons. */}
        <View style={{ height: insets.top }} />
        <HeaderBar />

        <View style={styles.header}>
          <TabPill label="Party" active={activeTab === 'party'} onPress={() => scrollToTab('party')} />
          <TabPill label="Live" active={activeTab === 'live'} onPress={() => scrollToTab('live')} />
          <TabPill label="Games" active={activeTab === 'games'} onPress={() => scrollToTab('games')} />
        </View>

        <ScrollView ref={pagerRef} style={styles.pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleMomentumScrollEnd} contentOffset={{
        x: HOME_TABS.indexOf(activeTab) * width,
        y: 0
      }}>
          <View style={[styles.pagerPage, {
          width
        }]}>
            <PartyTabContent onBannerScrolling={handleBannerScrolling} />
          </View>
          <View style={[styles.pagerPage, {
          width
        }]}>
            <LiveTabContent onFilterRowScrolling={handleBannerScrolling} />
          </View>
          <View style={[styles.pagerPage, {
          width
        }]}>
            <GamesTabContent />
          </View>
        </ScrollView>
      </Screen>
    </ImageBackground>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
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
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  logoBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(2.5)
  },
  logoBar: {
    width: scaleModerate(3.5),
    borderRadius: 999
  },
  headerTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    letterSpacing: 1.5
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(18)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(10),
    gap: scaleModerate(22)
  },
  tabPill: {
    alignItems: 'center',
    paddingBottom: scaleModerate(12)
  },
  tabPillText: {
    fontSize: scaleFont(15),
    fontWeight: '700'
  },
  tabPillTextActive: {
    fontWeight: '800'
  },
  tabPillIndicator: {
    marginTop: scaleModerate(8),
    height: scaleModerate(3),
    width: scaleModerate(22),
    borderRadius: 999
  }
});

export default HomeScreen;
