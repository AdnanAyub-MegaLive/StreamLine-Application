import React from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import {
  coinsImage,
  missionCheckinImage,
  missionGiftsImage,
  missionRoomImage,
  missionWatchImage,
  profileBackgroundImage,
  tasksImage,
  weeklyChampionImage
} from '../../assets';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function GlassPanel({ style, children }) {
  const theme = useTheme();
  return <LinearGradient colors={[hexToRgba(theme.colors.neutral900, 0.92), hexToRgba(theme.colors.neutral800, 0.88)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      <LinearGradient
        colors={[hexToRgba(theme.colors.neutral900, 0.42), hexToRgba(theme.colors.neutral900, 0.18)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>;
}

const TODAY_DONE = 3;
const TODAY_TOTAL = 4;

const STREAK_DAYS = [
  { day: 1, done: true },
  { day: 2, done: true },
  { day: 3, done: true },
  { day: 4, done: true, current: true },
  { day: 5, done: false },
  { day: 6, done: false },
  { day: 7, done: false }
];

const FEATURED_TASK = {
  title: 'Go Live for 30 Minutes',
  description: 'Start a live session and keep it running for 30 minutes today.',
  progress: 0.56,
  progressLabel: '17 / 30 min',
  reward: 5000
};

const CATEGORIES = [
  { key: 'Daily', icon: 'calendar' },
  { key: 'Social', icon: 'people' },
  { key: 'Live', icon: 'live' },
  { key: 'Explore', icon: 'compass' },
  { key: 'Special', icon: 'star' }
];

const DAILY_MISSIONS = [
  { key: 'checkin', emoji: '✅', title: 'Check in today', description: 'Open the app and check in once a day.', reward: 500, state: 'claim' },
  { key: 'watch', emoji: '📺', title: 'Watch 10 minutes of live', description: 'Watch any live room for 10 minutes.', reward: 1000, state: 'progress', progress: 0.6, progressLabel: '6 / 10 min' },
  { key: 'gifts', emoji: '🎁', title: 'Send 3 gifts', description: 'Send gifts to your favorite hosts.', reward: 2000, state: 'progress', progress: 0.33, progressLabel: '1 / 3' },
  { key: 'room', emoji: '🎙️', title: 'Join a voice room', description: 'Hop into any audio room today.', reward: 750, state: 'completed' }
];

const DAILY_MISSION_ICONS = {
  checkin: missionCheckinImage,
  watch: missionWatchImage,
  gifts: missionGiftsImage,
  room: missionRoomImage
};

const SPECIAL_MISSIONS = [
  { key: 'weekly', emoji: '👑', title: 'Weekly Champion', description: 'Earn 20,000 coins from gifts this week.', reward: 15000, progress: 0.42, progressLabel: '8,400 / 20,000', colors: ['#F0B93D', '#FF4DA3'] },
  { key: 'invite', emoji: '🚀', title: 'Invite 5 Friends', description: 'Invite friends to join Streamline.', reward: 10000, progress: 0.2, progressLabel: '1 / 5', colors: ['#7000FF', '#00F2FF'] }
];

const SPECIAL_MISSION_ICONS = {
  weekly: weeklyChampionImage
};

const CATEGORY_MISSIONS = {
  Daily: DAILY_MISSIONS,
  Social: [DAILY_MISSIONS[2], DAILY_MISSIONS[0]],
  Live: [DAILY_MISSIONS[1], DAILY_MISSIONS[3]],
  Explore: [DAILY_MISSIONS[0], DAILY_MISSIONS[1]]
};

function RewardRing({ progress, size, style }) {
  const theme = useTheme();
  const strokeWidth = scaleModerate(9);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = circumference * progress;

  return <View style={[styles.ringWrap, style]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={hexToRgba(theme.colors.cardBorder, 0.6)} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.vipGoldText}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringCenterValue, { color: theme.text.primary }]}>{Math.round(progress * 100)}%</Text>
        <Text style={[styles.ringCenterLabel, { color: theme.text.secondary }]}>1,500 / 2,000</Text>
      </View>
    </View>;
}

function CategoryIcon({ name, color }) {
  const props = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  return <Svg width={scaleModerate(18)} height={scaleModerate(18)} viewBox="0 0 24 24">
      {name === 'calendar' ? <>
        <Path {...props} d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <Path {...props} d="M3 9h18M8 2v4m8-4v4m-8 7h.01m4 0h.01m4 0h.01m-8 4h.01m4 0h.01" />
      </> : null}
      {name === 'people' ? <>
        <Circle {...props} cx="9" cy="8" r="3" />
        <Path {...props} d="M3 21v-1a5 5 0 0 1 10 0v1M16 4a3 3 0 0 1 0 6m2 11v-1a5 5 0 0 0-3-4.58" />
      </> : null}
      {name === 'live' ? <>
        <Circle {...props} cx="12" cy="12" r="2.2" />
        <Path {...props} d="M7 7a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M4 4a11.3 11.3 0 0 0 0 16m16-16a11.3 11.3 0 0 1 0 16" />
      </> : null}
      {name === 'compass' ? <>
        <Circle {...props} cx="12" cy="12" r="9" />
        <Path {...props} d="m15.5 8.5-2.1 4.8-4.8 2.1 2.1-4.8 4.8-2.1Z" />
      </> : null}
      {name === 'star' ? <Path {...props} d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91L12 3Z" /> : null}
    </Svg>;
}

function StreakDay({ item }) {
  const theme = useTheme();
  if (item.current) {
    return <View style={styles.streakItem}>
        <LinearGradient colors={[theme.colors.secondary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.streakCircle, { shadowColor: theme.colors.secondary }]}>
          <Text style={styles.streakCheck}>✓</Text>
        </LinearGradient>
        <Text style={[styles.streakDayLabel, { color: theme.colors.secondary }]}>Day {item.day}</Text>
      </View>;
  }
  const streakCircleBackground = item.done ? hexToRgba(theme.colors.vipGoldText, 0.14) : 'transparent';
  return <View style={styles.streakItem}>
      <View style={[styles.streakCircle, styles.streakCircleOutline, { borderColor: item.done ? theme.colors.vipGoldText : theme.colors.cardBorder, backgroundColor: streakCircleBackground }]}>
        <Text style={[styles.streakGlyph, { color: item.done ? theme.colors.vipGoldText : theme.text.secondary }]}>{item.done ? '✓' : item.day}</Text>
      </View>
      <Text style={[styles.streakDayLabel, { color: theme.text.secondary }]}>Day {item.day}</Text>
    </View>;
}

function TaskCard({ item }) {
  const theme = useTheme();
  const completed = item.state === 'completed';
  const taskCardOpacity = completed ? 0.55 : 1;
  return <View style={[styles.taskCard, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.88), opacity: taskCardOpacity }]}>
      <View style={[styles.taskIcon, { backgroundColor: hexToRgba(theme.colors.teal700, 0.14), borderColor: hexToRgba(theme.colors.teal700, 0.4) }]}>
        <Image source={DAILY_MISSION_ICONS[item.key]} resizeMode="contain" style={styles.taskIconImage} />
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, { color: theme.text.primary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.taskDescription, { color: theme.text.secondary }]} numberOfLines={2}>{item.description}</Text>
        {item.state === 'progress' ? <View style={styles.taskProgressRow}>
            <View style={[styles.taskProgressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
              <View style={[styles.taskProgressFill, { width: `${item.progress * 100}%`, backgroundColor: theme.colors.secondary }]} />
            </View>
            <Text style={[styles.taskProgressLabel, { color: theme.text.secondary }]}>{item.progressLabel}</Text>
          </View> : null}
        <Text style={[styles.taskReward, { color: theme.colors.vipGoldText }]}>🪙 +{item.reward.toLocaleString()} Coins</Text>
      </View>
      {item.state === 'claim' ? <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.claimButton}>
          <Text style={styles.claimButtonText}>Claim</Text>
        </LinearGradient> : null}
      {completed ? <View style={styles.completedGlyphWrap}>
          <Text style={[styles.completedGlyph, { color: theme.colors.secondary, textShadowColor: theme.colors.secondary }]}>✓</Text>
        </View> : null}
    </View>;
}

function SpecialMissionCard({ item }) {
  const theme = useTheme();
  const icon = SPECIAL_MISSION_ICONS[item.key];
  return <LinearGradient colors={[hexToRgba(theme.colors.neutral900, 0.92), hexToRgba(theme.colors.neutral800, 0.88)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.specialCard, { borderColor: hexToRgba(item.colors[0], 0.5) }]}>
      <View style={styles.specialHeaderRow}>
        <View style={[styles.specialIcon, icon ? styles.specialIconBare : { backgroundColor: hexToRgba(item.colors[0], 0.2), borderColor: item.colors[0] }]}>
          {icon ? <Image source={icon} resizeMode="contain" style={styles.specialIconImage} /> : <Text style={styles.specialEmoji}>{item.emoji}</Text>}
        </View>
        <View style={styles.specialTextWrap}>
          <Text style={[styles.specialTitle, { color: theme.text.primary }]}>{item.title}</Text>
          <Text style={[styles.specialDescription, { color: theme.text.secondary }]} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.taskProgressRow}>
        <View style={[styles.taskProgressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
          <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.taskProgressFill, { width: `${item.progress * 100}%` }]} />
        </View>
        <Text style={[styles.taskProgressLabel, { color: theme.text.secondary }]}>{item.progressLabel}</Text>
      </View>
      <View style={styles.specialFooterRow}>
        <Text style={[styles.specialReward, { color: theme.colors.vipGoldText }]}>🪙 +{item.reward.toLocaleString()} Coins</Text>
        <View style={[styles.specialBadge, { borderColor: item.colors[0] }]}>
          <Text style={[styles.specialBadgeText, { color: item.colors[0] }]}>PREMIUM</Text>
        </View>
      </View>
    </LinearGradient>;
}

function TopSupporterMission() {
  const theme = useTheme();
  return <View style={[styles.topSupporterSection, { borderColor: hexToRgba(theme.colors.teal700, 0.6) }]}>
      <View style={styles.topSupporterHeader}>
        <View>
          <Text style={[styles.topSupporterHeading, { color: theme.colors.secondary }]}>SPECIAL MISSIONS</Text>
          <Text style={[styles.topSupporterSubheading, { color: theme.text.secondary }]}>New missions every week!</Text>
        </View>
        <Text style={[styles.topSupporterEnds, { color: theme.text.secondary }]}>Ends in <Text style={{ color: theme.colors.teal700 }}>5d 12h</Text> ›</Text>
      </View>
      <LinearGradient colors={[hexToRgba(theme.colors.secondary, 0.2), hexToRgba(theme.colors.teal700, 0.18)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.topSupporterCard, { borderColor: theme.colors.teal700 }]}>
        <Image source={weeklyChampionImage} resizeMode="contain" style={styles.topSupporterArtwork} />
        <View style={styles.topSupporterContent}>
          <Text style={[styles.topSupporterTitle, { color: theme.text.primary }]}>Become a Top Supporter</Text>
          <Text style={[styles.topSupporterDescription, { color: theme.text.secondary }]}>Send 50 gifts in total</Text>
          <View style={[styles.topSupporterTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.65) }]}>
            <LinearGradient colors={[theme.colors.secondary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.topSupporterFill, styles.topSupporterFillHalf]} />
          </View>
          <Text style={[styles.topSupporterProgress, { color: theme.text.secondary }]}>25 / 50</Text>
        </View>
        <View style={styles.topSupporterAction}>
          <Text style={[styles.topSupporterReward, { color: theme.colors.vipGoldText }]}>+10,000</Text>
          <LinearGradient colors={[theme.colors.secondary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topSupporterButton}>
            <Text style={styles.topSupporterButtonText}>Go</Text>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>;
}

export function TasksScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = React.useState('Daily');
  const missionPagerRef = React.useRef(null);
  const todayProgress = TODAY_DONE / TODAY_TOTAL;
  const missionPageWidth = windowWidth - scaleModerate(32);

  const selectCategory = (category, index) => {
    setActiveCategory(category.key);
    missionPagerRef.current?.scrollTo({ x: missionPageWidth * index, animated: true });
  };

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} resizeMode="cover" style={styles.background}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scaleModerate(14) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: theme.colors.cardBorder }]} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>⚡ Tasks & Rewards</Text>
            <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>Complete tasks, earn coins daily</Text>
          </View>
          <View style={[styles.helpButton, { borderColor: theme.colors.cardBorder }]}>
            <Text style={[styles.helpButtonText, { color: theme.text.primary }]}>?</Text>
          </View>
        </View>

        <GlassPanel style={[styles.rewardCard, { borderColor: hexToRgba(theme.colors.vipGoldText, 0.4) }]}>
          <View style={styles.rewardLeft}>
            <Text style={[styles.rewardLabel, { color: theme.text.primary }]}>My Coins</Text>
            <Text style={[styles.rewardValue, { color: theme.text.primary }]}>2,000,000</Text>
            <Text style={[styles.rewardHint, { color: theme.text.secondary }]}>= $200.00 USD</Text>
            <LinearGradient colors={[theme.colors.secondary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.coinStoreButton}>
              <Text style={styles.coinStoreButtonText}>Coin Store</Text>
              <Text style={styles.coinStoreArrow}>›</Text>
            </LinearGradient>
          </View>
          <Image source={coinsImage} resizeMode="contain" style={styles.rewardCoinsArtwork} />
          <View style={[styles.rewardDivider, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]} />
          <View style={styles.rewardProgressSection}>
            <Text style={[styles.todayRewardsLabel, { color: theme.text.primary }]}>Today's Rewards</Text>
            <RewardRing progress={todayProgress} size={scaleModerate(96)} />
            <View style={[styles.rewardResetPill, { borderColor: hexToRgba(theme.colors.secondary, 0.5) }]}>
              <Text style={[styles.rewardResetText, { color: theme.text.secondary }]}>Resets in </Text>
              <Text style={[styles.rewardResetTime, { color: theme.colors.secondary }]}>12:35:45</Text>
            </View>
          </View>
        </GlassPanel>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <View style={styles.streakHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>🔥 Streak</Text>
            <Text style={[styles.streakHint, { color: theme.colors.secondary }]}>Day 4 streak — keep it up!</Text>
          </View>
          <View style={styles.streakRow}>
            {STREAK_DAYS.map(item => <StreakDay key={item.day} item={item} />)}
          </View>
        </GlassPanel>

        <LinearGradient colors={[hexToRgba(theme.colors.neutral900, 0.92), hexToRgba(theme.colors.neutral800, 0.88)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.featuredCard, { borderColor: hexToRgba(theme.colors.vipGoldText, 0.5) }]}>
          <View style={styles.featuredHeaderRow}>
            <Text style={[styles.featuredBadge, { color: theme.colors.vipGoldText, borderColor: theme.colors.vipGoldText }]}>🎯 FEATURED MISSION</Text>
          </View>
          <Text style={[styles.featuredTitle, { color: theme.text.primary }]}>{FEATURED_TASK.title}</Text>
          <Text style={[styles.featuredDescription, { color: theme.text.secondary }]}>{FEATURED_TASK.description}</Text>
          <View style={styles.taskProgressRow}>
            <View style={[styles.taskProgressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
              <LinearGradient colors={[theme.colors.vipGoldText, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.taskProgressFill, { width: `${FEATURED_TASK.progress * 100}%` }]} />
            </View>
            <Text style={[styles.taskProgressLabel, { color: theme.text.secondary }]}>{FEATURED_TASK.progressLabel}</Text>
          </View>
          <View style={styles.featuredFooterRow}>
            <Text style={[styles.featuredReward, { color: theme.colors.vipGoldText }]}>🪙 +{FEATURED_TASK.reward.toLocaleString()} Coins</Text>
            <LinearGradient colors={[theme.colors.vipGoldText, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.claimButton}>
              <Text style={styles.claimButtonText}>In Progress</Text>
            </LinearGradient>
          </View>
          <Image source={tasksImage} resizeMode="contain" style={styles.featuredArtwork} />
        </LinearGradient>

        <View style={[styles.categoryTabs, { borderColor: theme.colors.cardBorder }]}>
          {CATEGORIES.map((category, index) => {
            const active = activeCategory === category.key;
            return <Pressable
              key={category.key}
              onPress={() => selectCategory(category, index)}
              style={[
                styles.categoryTab,
                index < CATEGORIES.length - 1 && { borderRightColor: hexToRgba(theme.colors.cardBorder, 0.6) }
              ]}
            >
              <View style={styles.categoryTabContent}>
                <CategoryIcon name={category.icon} color={active ? theme.colors.secondary : theme.text.secondary} />
                <Text style={[styles.categoryPillText, { color: active ? theme.colors.secondary : theme.text.secondary }]}>{category.key}</Text>
              </View>
              {active ? <LinearGradient colors={[theme.colors.secondary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.categoryActiveLine} /> : null}
            </Pressable>;
          })}
        </View>

        <ScrollView
          ref={missionPagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / missionPageWidth);
            setActiveCategory(CATEGORIES[index]?.key ?? 'Daily');
          }}
        >
          {CATEGORIES.map(category => <View key={category.key} style={[styles.missionPage, { width: missionPageWidth }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{category.key} Missions</Text>
              </View>
              <View style={styles.taskList}>
                {category.key === 'Special'
                  ? SPECIAL_MISSIONS.map(item => <SpecialMissionCard key={item.key} item={item} />)
                  : CATEGORY_MISSIONS[category.key].map((item, index) => <TaskCard key={`${category.key}-${item.key}-${index}`} item={item} />)}
              </View>
            </View>)}
        </ScrollView>

        <View style={styles.footerRow}>
          <Text style={styles.footerIcon}>✨</Text>
          <Text style={[styles.footerText, { color: theme.text.secondary }]}>New tasks refresh daily at midnight!</Text>
        </View>

        <TopSupporterMission />
      </ScrollView>
      </ImageBackground>
    </Screen>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleModerate(14)
  },
  backButton: {
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backChevron: {
    fontSize: scaleFont(24),
    fontWeight: '700',
    marginTop: -2
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  headerSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5)
  },
  helpButton: {
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  rewardCard: {
    minHeight: scaleModerate(178),
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(14)
  },
  rewardCoinsArtwork: {
    position: 'absolute',
    width: scaleModerate(73),
    height: scaleModerate(73),
    left: '50%',
    top: '50%',
    marginLeft: scaleModerate(-36.5),
    marginTop: scaleModerate(-36.5),
    opacity: 0.9
  },
  rewardDivider: {
    position: 'absolute',
    left: '60%',
    top: scaleModerate(18),
    bottom: scaleModerate(18),
    width: 1
  },
  rewardLeft: {
    width: '39%'
  },
  rewardLabel: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  rewardValue: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(23),
    fontWeight: '900'
  },
  rewardHint: {
    marginTop: scaleModerate(3),
    fontSize: scaleFont(10.5)
  },
  coinStoreButton: {
    marginTop: scaleModerate(12),
    width: scaleModerate(112),
    height: scaleModerate(34),
    borderRadius: scaleModerate(10),
    paddingHorizontal: scaleModerate(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  coinStoreButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10.5),
    fontWeight: '800'
  },
  coinStoreArrow: {
    color: '#FFFFFF',
    fontSize: scaleFont(22),
    fontWeight: '500',
    lineHeight: scaleFont(22)
  },
  rewardProgressSection: {
    position: 'absolute',
    right: scaleModerate(8),
    top: scaleModerate(12),
    width: '35%',
    alignItems: 'center'
  },
  todayRewardsLabel: {
    fontSize: scaleFont(11),
    fontWeight: '800',
    marginBottom: scaleModerate(4)
  },
  rewardResetPill: {
    borderWidth: 1,
    borderRadius: scaleModerate(12),
    paddingHorizontal: scaleModerate(7),
    paddingVertical: scaleModerate(3),
    flexDirection: 'row',
    alignItems: 'center'
  },
  rewardResetText: {
    fontSize: scaleFont(8.5),
    fontWeight: '600'
  },
  rewardResetTime: {
    fontSize: scaleFont(8.5),
    fontWeight: '800'
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center'
  },
  ringCenterValue: {
    fontSize: scaleFont(21),
    fontWeight: '900'
  },
  ringCenterLabel: {
    fontSize: scaleFont(7.5),
    fontWeight: '600'
  },
  card: {
    marginTop: scaleModerate(14),
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(14)
  },
  streakHint: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  streakItem: {
    alignItems: 'center'
  },
  streakCircle: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6
  },
  streakCircleOutline: {
    borderWidth: 1.5
  },
  streakCheck: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '900'
  },
  streakGlyph: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  streakDayLabel: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(8.5),
    fontWeight: '700'
  },
  featuredCard: {
    marginTop: scaleModerate(14),
    borderWidth: 1.5,
    borderRadius: scaleModerate(20),
    padding: scaleModerate(16),
    overflow: 'hidden'
  },
  featuredArtwork: {
    position: 'absolute',
    width: scaleModerate(82),
    height: scaleModerate(82),
    right: scaleModerate(100),
    bottom: scaleModerate(2),
    opacity: 0.8
  },
  featuredHeaderRow: {
    marginBottom: scaleModerate(8)
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(4),
    fontSize: scaleFont(9.5),
    fontWeight: '800'
  },
  featuredTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  featuredDescription: {
    marginTop: scaleModerate(4),
    marginBottom: scaleModerate(12),
    fontSize: scaleFont(11.5)
  },
  featuredFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleModerate(12)
  },
  featuredReward: {
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  categoryTabs: {
    flexDirection: 'row',
    height: scaleModerate(48),
    marginTop: scaleModerate(14),
    marginBottom: scaleModerate(14),
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    overflow: 'hidden'
  },
  categoryTab: {
    flex: 1,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryPillText: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  categoryTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  categoryActiveLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: scaleModerate(3)
  },
  missionPage: {
    paddingRight: scaleModerate(1)
  },
  sectionHeaderRow: {
    marginTop: scaleModerate(6),
    marginBottom: scaleModerate(10)
  },
  taskList: {
    gap: scaleModerate(10)
  },
  topSupporterSection: {
    marginTop: scaleModerate(16),
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(12)
  },
  topSupporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(10)
  },
  topSupporterHeading: {
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  topSupporterSubheading: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9.5),
    fontWeight: '600'
  },
  topSupporterEnds: {
    fontSize: scaleFont(9),
    fontWeight: '700'
  },
  topSupporterCard: {
    minHeight: scaleModerate(112),
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    padding: scaleModerate(10),
    flexDirection: 'row',
    alignItems: 'center'
  },
  topSupporterArtwork: {
    width: scaleModerate(70),
    height: scaleModerate(70),
    marginRight: scaleModerate(6)
  },
  topSupporterContent: {
    flex: 1,
    minWidth: 0
  },
  topSupporterTitle: {
    fontSize: scaleFont(12.5),
    fontWeight: '800'
  },
  topSupporterDescription: {
    marginTop: scaleModerate(3),
    fontSize: scaleFont(9.5)
  },
  topSupporterTrack: {
    height: scaleModerate(7),
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: scaleModerate(11)
  },
  topSupporterFill: {
    height: '100%',
    borderRadius: 999
  },
  topSupporterFillHalf: {
    width: '50%'
  },
  topSupporterProgress: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(8.5),
    fontWeight: '700'
  },
  topSupporterAction: {
    alignItems: 'flex-end',
    marginLeft: scaleModerate(8)
  },
  topSupporterReward: {
    fontSize: scaleFont(12),
    fontWeight: '900'
  },
  topSupporterButton: {
    width: scaleModerate(62),
    height: scaleModerate(32),
    borderRadius: scaleModerate(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleModerate(11)
  },
  topSupporterButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(16),
    padding: scaleModerate(12),
    gap: scaleModerate(12)
  },
  taskIcon: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: scaleModerate(13),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskIconImage: {
    width: scaleModerate(42),
    height: scaleModerate(42)
  },
  taskBody: {
    flex: 1
  },
  taskTitle: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  taskDescription: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10)
  },
  taskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    marginTop: scaleModerate(8)
  },
  taskProgressTrack: {
    flex: 1,
    height: scaleModerate(6),
    borderRadius: 999,
    overflow: 'hidden'
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 999
  },
  taskProgressLabel: {
    fontSize: scaleFont(9),
    fontWeight: '700'
  },
  taskReward: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  claimButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  completedGlyphWrap: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  completedGlyph: {
    fontSize: scaleFont(22),
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  },
  specialCard: {
    borderWidth: 1.5,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(14)
  },
  specialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12)
  },
  specialIcon: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: scaleModerate(14),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  specialIconBare: {
    width: scaleModerate(58),
    height: scaleModerate(58),
    borderWidth: 0,
    backgroundColor: 'transparent'
  },
  specialIconImage: {
    width: scaleModerate(58),
    height: scaleModerate(58)
  },
  specialEmoji: {
    fontSize: scaleFont(20)
  },
  specialTextWrap: {
    flex: 1
  },
  specialTitle: {
    fontSize: scaleFont(13.5),
    fontWeight: '800'
  },
  specialDescription: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5)
  },
  specialFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleModerate(10)
  },
  specialReward: {
    fontSize: scaleFont(12.5),
    fontWeight: '800'
  },
  specialBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  specialBadgeText: {
    fontSize: scaleFont(8.5),
    fontWeight: '900'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleModerate(6),
    marginTop: scaleModerate(18)
  },
  footerIcon: {
    fontSize: scaleFont(12)
  },
  footerText: {
    fontSize: scaleFont(11)
  }
});

export default TasksScreen;
