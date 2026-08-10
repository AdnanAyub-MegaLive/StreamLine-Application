import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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

const BADGE_SCORE = 4250;
const NEXT_MILESTONE = 5000;
const TOTAL_BADGES = 24;

const TABS = ['All Badges', 'Earned', 'Progress', 'Locked'];

const EARNED_BADGES = [
  { key: 'party', emoji: '🎧', label: 'Party Starter', date: '12 May 2024', colors: ['#FF4DA3', '#7000FF'] },
  { key: 'voice', emoji: '🎤', label: 'Voice Master', date: '20 May 2024', colors: ['#7000FF', '#00F2FF'] },
  { key: 'gifter', emoji: '🎁', label: 'Top Gifter', date: '02 Jun 2024', colors: ['#00F2FF', '#7000FF'] },
  { key: 'streamer', emoji: '💎', label: 'Streamer', date: '15 Jun 2024', colors: ['#FF4DA3', '#7000FF'] },
  { key: 'popular', emoji: '❤️', label: 'Popular', date: '23 Jun 2024', colors: ['#FF4DA3', '#7000FF'] },
  { key: 'loyal', emoji: '🛡️', label: 'Loyal', date: '05 Jul 2024', colors: ['#00F2FF', '#7000FF'] },
  { key: 'rising', emoji: '⭐', label: 'Rising Star', date: '18 Jul 2024', colors: ['#FF4DA3', '#7000FF'] },
  { key: 'elite', emoji: '👑', label: 'Elite', date: '28 Jul 2024', colors: ['#FF4DA3', '#F0B93D'] }
];

const IN_PROGRESS_BADGES = [
  { key: 'chat', emoji: '💬', label: 'Chat Master', progress: 0.6, percent: '60%' },
  { key: 'room', emoji: '👥', label: 'Room Hero', progress: 0.4, percent: '40%' },
  { key: 'supporter', emoji: '🤝', label: 'Supporter', progress: 0.7, percent: '70%' },
  { key: 'night', emoji: '🌙', label: 'Night Owl', progress: 0.3, percent: '30%' }
];

const LOCKED_BADGES = [
  { key: 'legend', label: 'Legend', unlockAt: '10,000' },
  { key: 'influencer', label: 'Influencer', unlockAt: '25,000' },
  { key: 'superstar', label: 'Super Star', unlockAt: '50,000' },
  { key: 'icon', label: 'Icon', unlockAt: '100,000' }
];

function BadgeShield({ colors, emoji, size, locked }) {
  const theme = useTheme();
  if (locked) {
    return <View style={[styles.badgeShield, { width: size, height: size, borderRadius: size * 0.28, borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral700, 0.5) }]}>
        <Text style={[styles.badgeLockIcon, { fontSize: size * 0.32 }]}>🔒</Text>
      </View>;
  }
  return <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badgeShield, { width: size, height: size, borderRadius: size * 0.28, shadowColor: colors[0] }]}
    >
      <Text style={{ fontSize: size * 0.4 }}>{emoji}</Text>
    </LinearGradient>;
}

function EarnedBadgeCard({ item }) {
  const theme = useTheme();
  return <View style={styles.badgeCard}>
      <BadgeShield colors={item.colors} emoji={item.emoji} size={scaleModerate(64)} />
      <Text style={[styles.badgeLabel, { color: theme.text.primary }]} numberOfLines={1}>{item.label}</Text>
      <Text style={[styles.badgeDate, { color: theme.text.secondary }]}>{item.date}</Text>
    </View>;
}

function ProgressBadgeCard({ item }) {
  const theme = useTheme();
  return <View style={styles.badgeCard}>
      <View style={[styles.badgeShield, styles.badgeShieldOutline, { width: scaleModerate(64), height: scaleModerate(64), borderRadius: scaleModerate(64) * 0.28, borderColor: theme.colors.secondary }]}>
        <Text style={{ fontSize: scaleModerate(64) * 0.4 }}>{item.emoji}</Text>
      </View>
      <Text style={[styles.badgeLabel, { color: theme.text.primary }]} numberOfLines={1}>{item.label}</Text>
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
          <View style={[styles.progressFill, { width: `${item.progress * 100}%`, backgroundColor: theme.colors.secondary }]} />
        </View>
        <Text style={[styles.progressPercent, { color: theme.text.secondary }]}>{item.percent}</Text>
      </View>
    </View>;
}

function LockedBadgeCard({ item }) {
  const theme = useTheme();
  return <View style={styles.badgeCard}>
      <BadgeShield size={scaleModerate(64)} locked />
      <Text style={[styles.badgeLabel, { color: theme.text.secondary }]} numberOfLines={1}>{item.label}</Text>
      <Text style={[styles.badgeDate, { color: theme.text.secondary }]} numberOfLines={2}>Unlock at{'\n'}{item.unlockAt} Score</Text>
    </View>;
}

function SectionHeader({ dotColor, icon, title, count, theme }) {
  return <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        {icon ? <Text style={styles.sectionHeaderIcon}>{icon}</Text> : <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />}
        <Text style={[styles.sectionHeaderTitle, { color: theme.text.primary }]}>{title}</Text>
      </View>
      <Pressable style={styles.sectionHeaderRight}>
        <Text style={[styles.sectionHeaderCount, { color: dotColor }]}>{count}</Text>
        <Text style={[styles.sectionHeaderChevron, { color: dotColor }]}>›</Text>
      </Pressable>
    </View>;
}

export function BadgesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState('All Badges');
  const progress = Math.min(1, BADGE_SCORE / NEXT_MILESTONE);

  return <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scaleModerate(14) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: theme.colors.cardBorder }]} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>🛡️ Badges</Text>
            <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>Showcase your achievements</Text>
          </View>
          <Pressable style={[styles.helpButton, { borderColor: theme.colors.cardBorder }]}>
            <Text style={[styles.helpButtonText, { color: theme.text.primary }]}>?</Text>
          </Pressable>
        </View>

        <GlassPanel style={[styles.heroCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroBadgeWrap}>
              <LinearGradient colors={[theme.colors.tertiary, theme.colors.teal700, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroBadge, { shadowColor: theme.colors.tertiary }]}>
                <Text style={styles.heroBadgeEmoji}>⭐</Text>
              </LinearGradient>
              <View style={[styles.heroBadgeCount, { backgroundColor: theme.colors.tertiary, borderColor: theme.surfaces.card }]}>
                <Text style={styles.heroBadgeCountText}>{TOTAL_BADGES}</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <Text style={[styles.heroLabel, { color: theme.text.secondary }]}>Badge Score</Text>
              <View style={styles.heroScoreRow}>
                <Text style={[styles.heroScoreValue, { color: theme.text.primary }]}>{BADGE_SCORE.toLocaleString()}</Text>
                <Text style={styles.heroScoreIcon}>🔮</Text>
              </View>
              <View style={styles.heroProgressRow}>
                <View style={[styles.heroProgressTrack, { backgroundColor: hexToRgba(theme.colors.cardBorder, 0.6) }]}>
                  <LinearGradient colors={[theme.colors.teal700, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.heroProgressFill, { width: `${progress * 100}%` }]} />
                </View>
              </View>
              <View style={styles.heroMilestoneRow}>
                <Text style={[styles.heroMilestoneLabel, { color: theme.text.secondary }]}>Next Milestone</Text>
                <Text style={[styles.heroMilestoneValue, { color: theme.text.primary }]}>{NEXT_MILESTONE.toLocaleString()} 🔮</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.heroHint, { color: theme.text.secondary }]}>Collect more badges to upgrade your rank!</Text>
        </GlassPanel>

        <View style={styles.tabsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {TABS.map(tab => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
                <Text style={[styles.tabText, { color: activeTab === tab ? theme.colors.teal700 : theme.text.secondary }]}>{tab}</Text>
                {activeTab === tab ? <View style={[styles.tabUnderline, { backgroundColor: theme.colors.teal700 }]} /> : null}
              </Pressable>)}
          </ScrollView>
          <Pressable style={[styles.filterPill, { borderColor: theme.colors.tertiary }]}>
            <Text style={[styles.filterPillText, { color: theme.colors.tertiary }]}>All ▾</Text>
          </Pressable>
        </View>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <SectionHeader theme={theme} dotColor={theme.colors.teal700} title="EARNED BADGES" count={`8 / ${TOTAL_BADGES}`} />
          <View style={styles.badgeGrid}>
            {EARNED_BADGES.map(item => <EarnedBadgeCard key={item.key} item={item} />)}
          </View>
        </GlassPanel>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <SectionHeader theme={theme} dotColor={theme.colors.secondary} title="IN PROGRESS" count={`4 / ${TOTAL_BADGES}`} />
          <View style={styles.badgeGrid}>
            {IN_PROGRESS_BADGES.map(item => <ProgressBadgeCard key={item.key} item={item} />)}
          </View>
        </GlassPanel>

        <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
          <SectionHeader theme={theme} dotColor={theme.text.secondary} icon="🔒" title="LOCKED BADGES" count={`12 / ${TOTAL_BADGES}`} />
          <View style={styles.badgeGrid}>
            {LOCKED_BADGES.map(item => <LockedBadgeCard key={item.key} item={item} />)}
          </View>
        </GlassPanel>

        <View style={styles.footerRow}>
          <Text style={styles.footerIcon}>⭐</Text>
          <Text style={[styles.footerText, { color: theme.text.secondary }]}>New badges are added regularly. Keep exploring!</Text>
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
    fontSize: scaleFont(19),
    fontWeight: '800'
  },
  headerSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
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
  heroCard: {
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(16)
  },
  heroBadgeWrap: {
    alignItems: 'center'
  },
  heroBadge: {
    width: scaleModerate(88),
    height: scaleModerate(88),
    borderRadius: scaleModerate(24),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8
  },
  heroBadgeEmoji: {
    fontSize: scaleFont(34)
  },
  heroBadgeCount: {
    marginTop: -scaleModerate(12),
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(3),
    borderRadius: 999,
    borderWidth: 2
  },
  heroBadgeCountText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '900'
  },
  heroInfo: {
    flex: 1
  },
  heroLabel: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6),
    marginTop: scaleModerate(2),
    marginBottom: scaleModerate(10)
  },
  heroScoreValue: {
    fontSize: scaleFont(26),
    fontWeight: '900'
  },
  heroScoreIcon: {
    fontSize: scaleFont(16)
  },
  heroProgressRow: {
    marginBottom: scaleModerate(8)
  },
  heroProgressTrack: {
    height: scaleModerate(8),
    borderRadius: 999,
    overflow: 'hidden'
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 999
  },
  heroMilestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heroMilestoneLabel: {
    fontSize: scaleFont(10)
  },
  heroMilestoneValue: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  heroHint: {
    marginTop: scaleModerate(12),
    fontSize: scaleFont(10.5)
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleModerate(16),
    marginBottom: scaleModerate(4)
  },
  tabsScroll: {
    flexGrow: 1,
    gap: scaleModerate(18),
    paddingRight: scaleModerate(10)
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: scaleModerate(8)
  },
  tabText: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  tabUnderline: {
    marginTop: scaleModerate(6),
    height: scaleModerate(2),
    width: '100%',
    borderRadius: 999
  },
  filterPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(6)
  },
  filterPillText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
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
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  sectionDot: {
    width: scaleModerate(7),
    height: scaleModerate(7),
    borderRadius: 999
  },
  sectionHeaderIcon: {
    fontSize: scaleFont(12)
  },
  sectionHeaderTitle: {
    fontSize: scaleFont(12),
    fontWeight: '800',
    letterSpacing: 0.4
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  sectionHeaderCount: {
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  sectionHeaderChevron: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: scaleModerate(18)
  },
  badgeCard: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(4)
  },
  badgeShield: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5
  },
  badgeShieldOutline: {
    borderWidth: 2,
    backgroundColor: 'transparent'
  },
  badgeLockIcon: {
    opacity: 0.5
  },
  badgeLabel: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center'
  },
  badgeDate: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(8.5),
    textAlign: 'center'
  },
  progressRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4),
    marginTop: scaleModerate(6)
  },
  progressTrack: {
    flex: 1,
    height: scaleModerate(4),
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 999
  },
  progressPercent: {
    fontSize: scaleFont(8.5),
    fontWeight: '700'
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

export default BadgesScreen;
