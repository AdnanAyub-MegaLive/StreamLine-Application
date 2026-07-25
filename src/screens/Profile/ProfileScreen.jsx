import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SettingsIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';
import { routes } from '../../navigation/routes';

// Matches the approved profile mockup: header card (avatar / name / ID /
// PRO / share), Friends-Fans-Following stats, VIP upgrade banner, Wallet
// and Earn Coins cards, then the Services & Tools grid. Stats, wallet
// balance, and most tools have no backend yet — they render zeros or are
// visual-only until those endpoints exist.
const STATS = [
  { key: 'friends', label: 'Friends', value: '0' },
  { key: 'fans', label: 'Fans', value: '0' },
  { key: 'following', label: 'Following', value: '0' }
];

function StatItem({ label, value }) {
  const theme = useTheme();
  return <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}</Text>
    </View>;
}

function ToolItem({ emoji, label, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} disabled={!onPress} style={styles.toolItem}>
      <View style={[styles.toolIcon, { backgroundColor: theme.colors.teal50 }]}>
        <Text style={styles.toolEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.toolLabel, { color: theme.text.secondary }]}>{label}</Text>
    </Pressable>;
}

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const user = session?.user;

  const tools = [
    { emoji: '📈', label: 'My Level' },
    { emoji: '🛍️', label: 'Shop' },
    { emoji: '🎖️', label: 'Badges' },
    { emoji: '✅', label: 'Verified' },
    { emoji: '🏢', label: 'Agency', onPress: () => navigation.navigate(routes.createAgency) },
    { emoji: '🎒', label: 'Bag' },
    { emoji: '🖥️', label: 'Monitor' },
    { emoji: '⚙️', label: 'Settings', onPress: () => navigation.navigate(routes.settings) }
  ];

  const content = <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerCard, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.navigate(routes.changeAvatar)} style={[styles.avatarRing, { borderColor: theme.colors.followOrange }]}>
            <Avatar value={user?.profileImage} fullName={user?.fullName} size={scaleModerate(56)} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={2}>{user?.fullName || 'Guest'}</Text>
            <Text style={[styles.idText, { color: theme.text.secondary }]}>ID: {user?.displayId || user?.publicId || '—'}</Text>
          </View>
          <View style={[styles.proBadge, { backgroundColor: theme.colors.vipGoldBackground }]}>
            <Text style={[styles.proBadgeText, { color: theme.colors.vipGoldText }]}>⚡ PRO</Text>
          </View>
          <Pressable hitSlop={10}>
            <Text style={[styles.shareIcon, { color: theme.text.secondary }]}>⤴</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          {STATS.map(stat => <StatItem key={stat.key} label={stat.label} value={stat.value} />)}
        </View>

        <Pressable style={[styles.vipBanner, { backgroundColor: theme.colors.followOrange }]}>
          <View style={styles.vipTextWrap}>
            <Text style={styles.vipTitle}>👑 Premium VIP Access</Text>
            <Text style={styles.vipSubtitle}>Unlock exclusive perks & badges</Text>
          </View>
          <View style={styles.vipUpgrade}>
            <Text style={[styles.vipUpgradeText, { color: theme.colors.followOrange }]}>Upgrade</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.walletRow}>
        <View style={[styles.walletCard, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          <Text style={[styles.walletLabel, { color: theme.text.secondary }]}>💰 My Wallet</Text>
          <Text style={[styles.walletValue, { color: theme.text.primary }]}>
            0 <Text style={[styles.walletUnit, { color: theme.colors.followOrange }]}>Coins</Text>
          </Text>
        </View>
        <View style={[styles.walletCard, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          <Text style={[styles.walletLabel, { color: theme.text.secondary }]}>🪙 Earn Coins</Text>
          <View style={styles.tasksRow}>
            <Text style={[styles.walletValue, { color: theme.text.primary }]}>Tasks</Text>
            <View style={[styles.tasksDot, { backgroundColor: theme.colors.liveBadge }]} />
          </View>
        </View>
      </View>

      <View style={[styles.toolsCard, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
        <View style={styles.toolsHeader}>
          <Text style={[styles.toolsTitle, { color: theme.text.primary }]}>Services & Tools</Text>
          <SettingsIcon size={16} color={theme.text.mutedIcon} />
        </View>
        <View style={styles.toolsGrid}>
          {tools.map(tool => <ToolItem key={tool.label} emoji={tool.emoji} label={tool.label} onPress={tool.onPress} />)}
        </View>
      </View>
    </ScrollView>;

  // Solid theme color behind the cards instead of the uploaded background
  // image the room/profile perk used to show here — same teal as the tab
  // bar's + button (the app's primary CTA color).
  return <Screen style={{ backgroundColor: theme.cta.primary.background }}>{content}</Screen>;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: scaleModerate(14),
    paddingTop: scaleModerate(8),
    paddingBottom: scaleModerate(28)
  },
  headerCard: {
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(14)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10)
  },
  avatarRing: {
    borderWidth: 2,
    borderRadius: 999,
    padding: scaleModerate(2)
  },
  headerInfo: {
    flex: 1
  },
  name: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  idText: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  proBadge: {
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(4),
    borderRadius: 999
  },
  proBadgeText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  shareIcon: {
    fontSize: scaleFont(18),
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: scaleModerate(14)
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  statLabel: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: scaleModerate(14),
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(10),
    marginTop: scaleModerate(14)
  },
  vipTextWrap: {
    flex: 1,
    paddingRight: scaleModerate(8)
  },
  vipTitle: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  vipSubtitle: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: scaleFont(10),
    marginTop: scaleModerate(2)
  },
  vipUpgrade: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(6)
  },
  vipUpgradeText: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  walletRow: {
    flexDirection: 'row',
    gap: scaleModerate(10),
    marginTop: scaleModerate(12)
  },
  walletCard: {
    flex: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12)
  },
  walletLabel: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  walletValue: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  walletUnit: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  tasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  tasksDot: {
    width: scaleModerate(7),
    height: scaleModerate(7),
    borderRadius: 999,
    marginTop: scaleModerate(6)
  },
  toolsCard: {
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(14),
    marginTop: scaleModerate(12)
  },
  toolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(12)
  },
  toolsTitle: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  toolItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: scaleModerate(14)
  },
  toolIcon: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolEmoji: {
    fontSize: scaleFont(18)
  },
  toolLabel: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(10),
    fontWeight: '600'
  }
});

export default ProfileScreen;
