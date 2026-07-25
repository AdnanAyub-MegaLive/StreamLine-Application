import React from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { SearchIcon, TrophyIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
import { LiveTabContent, PartyTabContent, GamesTabContent } from './components';

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

const HOME_TABS = ['live', 'party', 'games'];

export function HomeScreen() {
  const theme = useTheme();
  const {
    width
  } = useWindowDimensions();
  const [activeTab, setActiveTab] = React.useState('live');
  const pagerRef = React.useRef(null);
  // Disabled while a finger is on the Party banner carousel — the banner is
  // itself a horizontal scroll, and Android can't arbitrate it against this
  // horizontal pager. Uses setNativeProps (synchronous, applied natively
  // right now) rather than React state on purpose: a state update lands a
  // frame later, and the pager would intercept the very start of the drag
  // before the re-render disabled it — which is why manual banner scroll
  // only "sort of" worked. See PartyBanner's onBannerScrolling.
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
          <PartyTabContent onBannerScrolling={handleBannerScrolling} />
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
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(10),
    borderBottomWidth: 1,
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
