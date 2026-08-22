import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
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
  return <LinearGradient colors={[hexToRgba(theme.surfaces.card, 0.7), hexToRgba(theme.surfaces.card, 0.45)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      <LinearGradient
        colors={[hexToRgba(theme.colors.secondary, 0.12), hexToRgba(theme.colors.tertiary, 0.12)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>;
}

const CURRENT_LEVEL = 25;
const CURRENT_XP = 7450;
const NEXT_LEVEL_XP = 12000;

const LEVEL_BENEFITS = [
  { key: 'coins', emoji: '💎', label: 'More Coins', sub: '+25%', color: '#FF4DA3' },
  { key: 'exp', emoji: '⚡', label: 'Exp Boost', sub: '+20%', color: '#00F2FF' },
  { key: 'chat', emoji: '⭐', label: 'Special Chat Badge', sub: null, color: '#2ECC71' },
  { key: 'rewards', emoji: '🎁', label: 'Level Up Rewards', sub: null, color: '#F5A623' },
  { key: 'priv', emoji: '⬡', label: 'More Privileges', sub: null, color: '#7000FF' }
];

const LEVEL_STATS = [
  { key: 'gifts', label: 'From Gifts', value: 6250, color: '#FF4DA3' },
  { key: 'tasks', label: 'From Tasks', value: 4100, color: '#00F2FF' },
  { key: 'activities', label: 'From Activities', value: 2100, color: '#2ECC71' }
];

const XP_WAYS = [
  { key: 'gift', emoji: '🎁', label: 'Send Gifts', xp: '+50 – 500 XP', color: '#FF4DA3' },
  { key: 'tasks', emoji: '✅', label: 'Complete Tasks', xp: '+100 – 1000 XP', color: '#00F2FF' },
  { key: 'daily', emoji: '⚡', label: 'Daily Check-in', xp: '+200 XP', color: '#2ECC71' },
  { key: 'live', emoji: '🎥', label: 'Go Live', xp: '+300 XP / min', color: '#F5A623' }
];

const LEVEL_ROADMAP = [
  { level: 23, unlocked: true, coins: 2500 },
  { level: 24, unlocked: true, coins: 2800 },
  { level: 25, unlocked: true, current: true, coins: 3200, reward: '🎖️', rewardLabel: 'Level 25 Badge' },
  { level: 26, unlocked: false, coins: 3600, reward: '⚪', rewardLabel: 'Level 26 Frame' },
  { level: 27, unlocked: false, coins: 4000, reward: '💬', rewardLabel: 'Level 27 Message Bubble' }
];

function BenefitItem({ item }) {
  const theme = useTheme();
  return <View style={styles.benefitItem}>
      <View style={[styles.benefitIcon, { backgroundColor: hexToRgba(item.color, 0.16), borderColor: hexToRgba(item.color, 0.4), shadowColor: item.color }]}>
        <Text style={styles.benefitEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.benefitLabel, { color: theme.text.primary }]} numberOfLines={2}>{item.label}</Text>
      {item.sub ? <Text style={[styles.benefitSub, { color: item.color }]}>{item.sub}</Text> : null}
    </View>;
}

function RoadmapColumn({ item, isLast }) {
  const theme = useTheme();
  const active = item.current;
  const nodeColor = item.unlocked ? theme.colors.teal700 : theme.colors.cardBorder;
  const roadmapCardBackground = active ? hexToRgba(theme.colors.teal700, 0.1) : 'transparent';

  return <View style={styles.roadmapColumn}>
      <View style={styles.roadmapNodeRow}>
        <View style={[styles.roadmapHex, { borderColor: nodeColor, backgroundColor: hexToRgba(nodeColor, active ? 0.25 : 0.12), shadowColor: nodeColor }, active && styles.roadmapHexActive]}>
          <Text style={[styles.roadmapHexText, { color: item.unlocked ? theme.colors.teal700 : theme.text.secondary }]}>{item.level}</Text>
        </View>
        {!isLast ? <View style={[styles.roadmapLine, { backgroundColor: item.unlocked ? theme.colors.teal700 : theme.colors.cardBorder }]} /> : null}
      </View>
      <Text style={[styles.roadmapStatus, { color: item.unlocked ? theme.colors.secondary : theme.text.secondary }]}>{item.unlocked ? '✓' : '🔒'}</Text>

      <View style={[styles.roadmapCard, { borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder, backgroundColor: roadmapCardBackground }]}>
        <View style={styles.roadmapCoinRow}>
          <Text style={styles.roadmapCoinIcon}>🪙</Text>
          <Text style={[styles.roadmapCoinText, { color: theme.colors.vipGoldText }]}>{item.coins.toLocaleString()}</Text>
        </View>
        {item.reward ? <View style={styles.roadmapRewardRow}>
            <Text style={styles.roadmapRewardIcon}>{item.reward}</Text>
            <Text style={[styles.roadmapRewardLabel, { color: theme.text.secondary }]} numberOfLines={2}>{item.rewardLabel}</Text>
          </View> : null}
        <Text style={[styles.roadmapCheckbox, { color: item.unlocked ? theme.colors.secondary : theme.text.secondary }]}>{item.unlocked ? '✓' : '☐'}</Text>
      </View>
    </View>;
}

function StatsDonut({ stats }) {
  const theme = useTheme();
  const total = stats.reduce((sum, item) => sum + item.value, 0);
  const size = scaleModerate(96);
  const strokeWidth = scaleModerate(12);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetSoFar = 0;

  return <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.cardBorder} strokeWidth={strokeWidth} fill="none" />
        {stats.map(item => {
          const fraction = item.value / total;
          const dashLength = circumference * fraction;
          const segment = <Circle
              key={item.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offsetSoFar}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />;
          offsetSoFar += dashLength;
          return segment;
        })}
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={[styles.donutCenterLabel, { color: theme.text.secondary }]}>Total</Text>
        <Text style={[styles.donutCenterValue, { color: theme.text.primary }]}>{total.toLocaleString()}</Text>
        <Text style={[styles.donutCenterUnit, { color: theme.text.secondary }]}>XP</Text>
      </View>
    </View>;
}

export function MyLevelScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const progress = Math.min(1, CURRENT_XP / NEXT_LEVEL_XP);
  const xpToNext = NEXT_LEVEL_XP - CURRENT_XP;

  return <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scaleModerate(14) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>👑 <Text style={{ color: theme.colors.teal700 }}>My</Text> Level</Text>
          <Pressable style={[styles.historyButton, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]}>
            <Text style={[styles.historyButtonText, { color: theme.colors.tertiary }]}>🕐 Level History</Text>
          </Pressable>
        </View>

        <GlassPanel style={[styles.heroCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}>
          <View style={styles.levelRingWrap}>
            <LinearGradient colors={[theme.colors.tertiary, theme.colors.teal700, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelRing}>
              <View style={[styles.levelRingInner, { backgroundColor: theme.surfaces.page }]}>
                <Text style={styles.levelRingLeaf}>🍃</Text>
                <Text style={styles.levelRingDiamond}>💎</Text>
                <Text style={[styles.levelRingLeaf, styles.levelRingLeafFlip]}>🍃</Text>
              </View>
            </LinearGradient>
            <LinearGradient colors={[theme.colors.tertiary, theme.colors.teal700]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.levelHex, { shadowColor: theme.colors.teal700 }]}>
              <Text style={styles.levelHexText}>{CURRENT_LEVEL}</Text>
            </LinearGradient>
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.heroLabel, { color: theme.text.secondary }]}>Current Level</Text>
            <Text style={styles.heroLevelText}>
              <Text style={{ color: theme.colors.teal700 }}>Lv. </Text>
              <Text style={{ color: theme.colors.secondary }}>{CURRENT_LEVEL}</Text>
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
              <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${progress * 100}%` }]}>
                <Text style={styles.progressFillText}>{CURRENT_XP.toLocaleString()} / {NEXT_LEVEL_XP.toLocaleString()} XP</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.progressText, { color: theme.text.secondary }]}>{xpToNext.toLocaleString()} XP to reach <Text style={[styles.progressTextBold, { color: theme.colors.teal700 }]}>Level {CURRENT_LEVEL + 1}</Text></Text>
          </View>
        </GlassPanel>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>⭐ Level Benefits</Text>
            <Pressable>
              <Text style={[styles.sectionLink, { color: theme.colors.secondary }]}>View all benefits ›</Text>
            </Pressable>
          </View>
          <View style={styles.benefitsRow}>
            {LEVEL_BENEFITS.map(item => <BenefitItem key={item.key} item={item} />)}
          </View>
        </GlassPanel>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>🚩 Level Progress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.roadmapScroll}>
            {LEVEL_ROADMAP.map((item, index) => <RoadmapColumn key={item.level} item={item} isLast={index === LEVEL_ROADMAP.length - 1} />)}
          </ScrollView>
        </GlassPanel>

        <View style={styles.statsRow}>
          <GlassPanel style={[styles.statsCard, { borderColor: theme.colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, styles.sectionTitleLeft, { color: theme.text.primary }]}>Level Stats</Text>
            <View style={styles.statsBody}>
              <StatsDonut stats={LEVEL_STATS} />
              <View style={styles.statsLegend}>
                {LEVEL_STATS.map(item => <View key={item.key} style={styles.statsLegendRow}>
                    <View style={[styles.statsDot, { backgroundColor: item.color }]} />
                    <View>
                      <Text style={[styles.statsLegendLabel, { color: theme.text.secondary }]}>{item.label}</Text>
                      <Text style={[styles.statsLegendValue, { color: item.color }]}>{item.value.toLocaleString()} XP</Text>
                    </View>
                  </View>)}
              </View>
            </View>
          </GlassPanel>

          <GlassPanel style={[styles.rewardsCard, { borderColor: theme.colors.cardBorder }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, styles.sectionTitleLeft, { color: theme.text.primary }]}>Next Level Rewards</Text>
              <Text style={[styles.sectionLink, { color: theme.text.secondary }]}>›</Text>
            </View>
            <View style={styles.nextRewardsRow}>
              <View style={styles.nextRewardItem}>
                <View style={[styles.nextRewardCircle, { borderColor: theme.colors.vipGoldText }]}>
                  <Text style={styles.nextRewardEmoji}>🪙</Text>
                </View>
                <Text style={[styles.nextRewardLabel, { color: theme.colors.vipGoldText }]}>3,600</Text>
              </View>
              <View style={styles.nextRewardItem}>
                <View style={[styles.nextRewardCircle, styles.nextRewardCircleDashed, { borderColor: theme.colors.teal700 }]}>
                  <Text style={styles.nextRewardEmoji}>⚪</Text>
                </View>
                <Text style={[styles.nextRewardLabel, { color: theme.text.secondary }]} numberOfLines={2}>Level 26{'\n'}Frame</Text>
              </View>
            </View>
            <View style={styles.paginationRow}>
              <View style={[styles.paginationDot, styles.paginationDotActive, { backgroundColor: theme.colors.teal700 }]} />
              <View style={[styles.paginationDot, { backgroundColor: theme.colors.cardBorder }]} />
            </View>
          </GlassPanel>
        </View>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>🚩 How to earn XP?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.xpWaysRow}>
            {XP_WAYS.map(way => <View key={way.key} style={styles.xpWayItem}>
                <View style={[styles.xpWayIcon, { backgroundColor: hexToRgba(way.color, 0.16), borderColor: hexToRgba(way.color, 0.4) }]}>
                  <Text style={styles.xpWayEmoji}>{way.emoji}</Text>
                </View>
                <Text style={[styles.xpWayLabel, { color: theme.text.primary }]}>{way.label}</Text>
                <Text style={[styles.xpWayValue, { color: way.color }]}>{way.xp}</Text>
              </View>)}
          </ScrollView>
        </GlassPanel>

        <View style={[styles.infoBanner, { borderColor: hexToRgba(theme.colors.tertiary, 0.4), backgroundColor: hexToRgba(theme.colors.tertiary, 0.1) }]}>
          <Text style={[styles.infoBannerText, { color: theme.text.secondary }]}>ℹ️ The more active you are, the faster you level up!</Text>
        </View>
      </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(14)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  historyButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(6)
  },
  historyButtonText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16),
    gap: scaleModerate(16)
  },
  levelRingWrap: {
    alignItems: 'center'
  },
  levelRing: {
    width: scaleModerate(96),
    height: scaleModerate(96),
    borderRadius: scaleModerate(48),
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(4)
  },
  levelRingInner: {
    flex: 1,
    width: '100%',
    borderRadius: scaleModerate(44),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scaleModerate(2)
  },
  levelRingLeaf: {
    fontSize: scaleFont(16)
  },
  levelRingLeafFlip: {
    transform: [{ scaleX: -1 }]
  },
  levelRingDiamond: {
    fontSize: scaleFont(20)
  },
  levelHex: {
    marginTop: -scaleModerate(14),
    width: scaleModerate(30),
    height: scaleModerate(30),
    borderRadius: scaleModerate(9),
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6
  },
  levelHexText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '900',
    transform: [{ rotate: '-45deg' }]
  },
  heroInfo: {
    flex: 1
  },
  heroLabel: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  heroLevelText: {
    fontSize: scaleFont(30),
    fontWeight: '900',
    marginTop: scaleModerate(2),
    marginBottom: scaleModerate(8)
  },
  progressTrack: {
    height: scaleModerate(22),
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressFillText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  progressText: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(11)
  },
  progressTextBold: {
    fontWeight: '800'
  },
  card: {
    marginTop: scaleModerate(14),
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(14)
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: scaleFont(15),
    fontWeight: '800',
    marginBottom: scaleModerate(14)
  },
  sectionTitleLeft: {
    textAlign: 'left',
    marginBottom: 0
  },
  sectionLink: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  benefitItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scaleModerate(2)
  },
  benefitIcon: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3
  },
  benefitEmoji: {
    fontSize: scaleFont(18)
  },
  benefitLabel: {
    fontSize: scaleFont(9.5),
    fontWeight: '700',
    textAlign: 'center'
  },
  benefitSub: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  roadmapScroll: {
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(2)
  },
  roadmapColumn: {
    alignItems: 'center',
    width: scaleModerate(84)
  },
  roadmapNodeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roadmapHex: {
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: scaleModerate(10),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }]
  },
  roadmapHexActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6
  },
  roadmapHexText: {
    fontSize: scaleFont(12),
    fontWeight: '800',
    transform: [{ rotate: '-45deg' }]
  },
  roadmapLine: {
    width: scaleModerate(48),
    height: scaleModerate(2)
  },
  roadmapStatus: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  roadmapCard: {
    marginTop: scaleModerate(10),
    width: scaleModerate(80),
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: scaleModerate(12),
    paddingVertical: scaleModerate(10),
    paddingHorizontal: scaleModerate(6)
  },
  roadmapCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(3)
  },
  roadmapCoinIcon: {
    fontSize: scaleFont(11)
  },
  roadmapCoinText: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  roadmapRewardRow: {
    alignItems: 'center',
    marginTop: scaleModerate(6)
  },
  roadmapRewardIcon: {
    fontSize: scaleFont(16)
  },
  roadmapRewardLabel: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9),
    textAlign: 'center'
  },
  roadmapCheckbox: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  statsRow: {
    flexDirection: 'row',
    gap: scaleModerate(10),
    marginTop: scaleModerate(14)
  },
  statsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(14)
  },
  statsBody: {
    alignItems: 'center'
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(10)
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center'
  },
  donutCenterLabel: {
    fontSize: scaleFont(9),
    fontWeight: '600'
  },
  donutCenterValue: {
    fontSize: scaleFont(15),
    fontWeight: '900'
  },
  donutCenterUnit: {
    fontSize: scaleFont(9),
    fontWeight: '600'
  },
  statsLegend: {
    width: '100%',
    gap: scaleModerate(8)
  },
  statsLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  statsDot: {
    width: scaleModerate(8),
    height: scaleModerate(8),
    borderRadius: 999
  },
  statsLegendLabel: {
    fontSize: scaleFont(9.5),
    fontWeight: '600'
  },
  statsLegendValue: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  rewardsCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(14)
  },
  nextRewardsRow: {
    flexDirection: 'row',
    gap: scaleModerate(14),
    marginTop: scaleModerate(6)
  },
  nextRewardItem: {
    alignItems: 'center'
  },
  nextRewardCircle: {
    width: scaleModerate(48),
    height: scaleModerate(48),
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6)
  },
  nextRewardCircleDashed: {
    borderStyle: 'dashed'
  },
  nextRewardEmoji: {
    fontSize: scaleFont(18)
  },
  nextRewardLabel: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center'
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scaleModerate(6),
    marginTop: scaleModerate(14)
  },
  paginationDot: {
    width: scaleModerate(6),
    height: scaleModerate(6),
    borderRadius: 999
  },
  paginationDotActive: {
    width: scaleModerate(16)
  },
  xpWaysRow: {
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(2)
  },
  xpWayItem: {
    alignItems: 'center',
    width: scaleModerate(84)
  },
  xpWayIcon: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6)
  },
  xpWayEmoji: {
    fontSize: scaleFont(18)
  },
  xpWayLabel: {
    fontSize: scaleFont(10.5),
    fontWeight: '700',
    textAlign: 'center'
  },
  xpWayValue: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9.5),
    fontWeight: '700',
    textAlign: 'center'
  },
  infoBanner: {
    marginTop: scaleModerate(14),
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    paddingHorizontal: scaleModerate(14)
  },
  infoBannerText: {
    fontSize: scaleFont(11.5),
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default MyLevelScreen;
