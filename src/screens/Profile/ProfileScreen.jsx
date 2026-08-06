import React from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileBackgroundImage } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, GenderAgeChip, Screen, VerifiedTick } from '../../components';
import { fetchFriends, fetchStoreCatalog } from '../../api';
import { useAssignedBadge, useAssignedFrame } from '../../hooks';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';
import { routes } from '../../navigation/routes';

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

function GlassPanel({ style, borderColor, children }) {
  const theme = useTheme();
  return <AnimatedLinearGradient
      colors={[hexToRgba(theme.surfaces.card, 0.65), hexToRgba(theme.surfaces.card, 0.4)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[style, borderColor ? { borderColor } : null]}
    >
      <LinearGradient
        colors={[hexToRgba(theme.colors.secondary, 0.12), hexToRgba(theme.colors.tertiary, 0.12)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </AnimatedLinearGradient>;
}

function VipFeature({ emoji, label, color }) {
  const theme = useTheme();
  return <View style={styles.vipFeature}>
      <View style={[styles.vipFeatureIcon, { backgroundColor: hexToRgba(color, 0.16), borderColor: hexToRgba(color, 0.4) }]}>
        <Text style={styles.vipFeatureEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.vipFeatureLabel, { color: theme.text.secondary }]} numberOfLines={2}>{label}</Text>
    </View>;
}

const VIP_FEATURES = [
  { emoji: '💎', label: 'Exclusive Badges', color: '#FF4DA3' },
  { emoji: '💬', label: 'Special Chat Colors', color: '#7000FF' },
  { emoji: '⚡', label: 'Priority Support', color: '#00F2FF' },
  { emoji: '🎁', label: 'Monthly Rewards', color: '#F0B93D' },
  { emoji: '🛡️', label: 'Verified Profile', color: '#3AA0FF' }
];

function StatItem({ label, value, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}</Text>
    </Pressable>;
}

function ToolItem({ emoji, label, color, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} disabled={!onPress} style={styles.toolItem}>
      <View style={[styles.toolIcon, { backgroundColor: hexToRgba(color, 0.16), borderColor: hexToRgba(color, 0.4) }]}>
        <Text style={styles.toolEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.toolLabel, { color: theme.text.secondary }]} numberOfLines={1}>{label}</Text>
    </Pressable>;
}

export function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const user = session?.user;
  const frameUri = useAssignedFrame();
  const badgeUri = useAssignedBadge();
  const [friendCount, setFriendCount] = React.useState(0);
  const [coinBalance, setCoinBalance] = React.useState(null);
  const borderAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(borderAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, [borderAnim]);

  const neonBorderColor = borderAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [theme.colors.teal700, theme.colors.secondary, theme.colors.tertiary, theme.colors.teal700]
  });

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      if (session?.token) {
        fetchFriends(session.token).then(friends => {
          if (!cancelled) {
            setFriendCount(friends.length);
          }
        });
        fetchStoreCatalog(session.token).then(data => {
          if (!cancelled) {
            setCoinBalance(data.balance);
          }
        }).catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }, [session?.token])
  );

  const stats = [
    { key: 'friends', label: 'Friends', value: String(friendCount) },
    { key: 'fans', label: 'Fans', value: '0' },
    { key: 'following', label: 'Following', value: '0' }
  ].map(stat => ({ ...stat, onPress: () => navigation.navigate(routes.connections, { type: stat.key }) }));

  const tools = [
    { emoji: '📈', label: 'My Level', color: '#FF4DA3', onPress: () => navigation.navigate(routes.myLevel) },
    { emoji: '🛍️', label: 'Shop', color: '#7000FF', onPress: () => navigation.navigate(routes.store) },
    { emoji: '🎖️', label: 'Badges', color: '#F0B93D' },
    { emoji: '✅', label: 'Officials', color: '#2ECC71' },
    { emoji: '🏢', label: 'Agency', color: '#F5A623', onPress: () => navigation.navigate(routes.agencyChoice) },
    { emoji: '🎒', label: 'Bag', color: '#E24B4A' },
    { emoji: '⚙️', label: 'Settings', color: '#8B8B94', onPress: () => navigation.navigate(routes.settings) },
    { emoji: '🎧', label: 'Help Center', color: '#3AA0FF' }
  ];

  const content = <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.headerCard} borderColor={neonBorderColor}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.navigate(routes.changeAvatar)}
            // An assigned frame is its own decoration around the photo —
            // stacking the glow ring on top of it as well looked
            // cramped/overlapping, so the ring is only shown when there's
            // no frame.
            style={frameUri ? undefined : [styles.avatarRing, { borderColor: theme.colors.teal700, shadowColor: theme.colors.teal700 }]}
          >
            <Avatar value={user?.profileImage} fullName={user?.fullName} size={scaleModerate(56)} frameUri={frameUri} />
          </Pressable>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text.primary }]} numberOfLines={2}>{user?.fullName || 'Guest'}</Text>
              {user?.isOfficial ? <VerifiedTick size={14} /> : null}
            </View>
            <View style={[styles.idPill, { backgroundColor: theme.surfaces.page, borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.idText, { color: theme.text.secondary }]}>ID: {user?.displayId || user?.publicId || '—'}</Text>
            </View>
            <GenderAgeChip gender={user?.gender} dob={user?.dob} style={styles.genderAgeChipSpacing} />
          </View>
          {badgeUri ? (
            // Replaces the old hardcoded "PRO" label — an actual
            // admin-assigned badge image (see useAssignedBadge) when one
            // exists. Nothing shown at all otherwise, rather than a
            // placeholder that isn't backed by anything real.
            <View style={[styles.profileBadgeRing, { borderColor: theme.colors.secondary, shadowColor: theme.colors.secondary }]}>
              <Image source={{ uri: badgeUri }} style={styles.profileBadge} resizeMode="contain" />
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          {stats.map(stat => <StatItem key={stat.key} label={stat.label} value={stat.value} onPress={stat.onPress} />)}
        </View>
      </GlassPanel>

      <GlassPanel style={styles.vipFeatureCard} borderColor={neonBorderColor}>
        <LinearGradient
          colors={[hexToRgba(theme.surfaces.card, 0.95), hexToRgba(theme.colors.tertiarySoft, 0.9)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.vipTopRow, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}
        >
          <LinearGradient colors={[theme.colors.vipGoldText, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.vipBadge}>
            <Text style={styles.vipBadgeCrown}>👑</Text>
            <Text style={styles.vipBadgeText}>VIP</Text>
          </LinearGradient>

          <View style={styles.vipTextWrap}>
            <Text style={[styles.vipTitle, { color: theme.text.primary }]}>👑 <Text style={{ color: theme.colors.tertiary }}>Premium</Text> VIP</Text>
            <Text style={[styles.vipSubtitle, { color: theme.text.secondary }]}>Unlock exclusive perks & badges</Text>
          </View>

          <Pressable onPress={() => navigation.navigate(routes.vipMembership)}>
            <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.vipUpgrade}>
              <Text style={styles.vipUpgradeText}>Upgrade</Text>
              <Text style={styles.vipUpgradeChevron}>›</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>

        <View style={styles.vipFeatureRow}>
          {VIP_FEATURES.map(feature => <VipFeature key={feature.label} emoji={feature.emoji} label={feature.label} color={feature.color} />)}
        </View>
      </GlassPanel>

      <View style={styles.walletRow}>
        <Pressable style={styles.walletCardPressable} onPress={() => navigation.navigate(routes.myWallet)}>
          <GlassPanel style={styles.walletCard} borderColor={neonBorderColor}>
            <Text style={[styles.walletLabel, { color: theme.text.secondary }]}>💰 My Wallet</Text>
            <Text style={[styles.walletValue, { color: theme.text.primary }]}>
              {coinBalance !== null ? Number(coinBalance).toLocaleString() : '0'}
            </Text>
            <Text style={[styles.walletUnit, { color: theme.colors.vipGoldText }]}>Coins</Text>
            <Text style={styles.walletIllustration}>🪙</Text>
          </GlassPanel>
        </Pressable>
        <Pressable style={styles.walletCardPressable} onPress={() => navigation.navigate(routes.comingSoon, { title: 'Tasks', message: "Tasks are still in development. We're working on it — check back soon!" })}>
          <GlassPanel style={styles.walletCard} borderColor={neonBorderColor}>
            <Text style={[styles.walletLabel, { color: theme.text.secondary }]}>🪙 Earn Coins</Text>
            <View style={styles.tasksRow}>
              <Text style={[styles.walletValue, { color: theme.text.primary }]}>Tasks</Text>
              <View style={[styles.tasksDot, { backgroundColor: theme.colors.liveBadge }]} />
            </View>
            <Text style={[styles.walletSubtitle, { color: theme.text.secondary }]} numberOfLines={2}>Complete tasks & earn more coins</Text>
            <Text style={styles.walletIllustration}>📋</Text>
          </GlassPanel>
        </Pressable>
      </View>

      <GlassPanel style={styles.toolsCard} borderColor={neonBorderColor}>
        <View style={styles.toolsHeader}>
          <Text style={[styles.toolsTitle, { color: theme.text.primary }]}>Services & Tools</Text>
          <Pressable>
            <Text style={[styles.toolsViewAll, { color: theme.colors.teal700 }]}>View All ›</Text>
          </Pressable>
        </View>
        <View style={styles.toolsGrid}>
          {tools.map(tool => <ToolItem key={tool.label} emoji={tool.emoji} label={tool.label} color={tool.color} onPress={tool.onPress} />)}
        </View>
      </GlassPanel>
    </ScrollView>;

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={[styles.background, { paddingTop: insets.top }]} resizeMode="cover">
        {content}
      </ImageBackground>
    </Screen>;
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: scaleModerate(14),
    paddingTop: scaleModerate(8),
    paddingBottom: scaleModerate(28)
  },
  headerCard: {
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    overflow: 'hidden',
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
    padding: scaleModerate(2),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6
  },
  profileBadgeRing: {
    borderWidth: 1.5,
    borderRadius: 999,
    padding: scaleModerate(3),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4
  },
  headerInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  name: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  idPill: {
    alignSelf: 'flex-start',
    marginTop: scaleModerate(4),
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(2)
  },
  idText: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  genderAgeChipSpacing: {
    marginTop: scaleModerate(6)
  },
  profileBadge: {
    width: scaleModerate(28),
    height: scaleModerate(28)
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
  vipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12),
    marginTop: scaleModerate(12),
    marginBottom: scaleModerate(14)
  },
  vipBadge: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: scaleModerate(12),
    alignItems: 'center',
    justifyContent: 'center'
  },
  vipBadgeCrown: {
    fontSize: scaleFont(13),
    marginBottom: scaleModerate(-2)
  },
  vipBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '900'
  },
  vipTextWrap: {
    flex: 1,
    paddingHorizontal: scaleModerate(10)
  },
  vipTitle: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  vipSubtitle: {
    fontSize: scaleFont(11),
    marginTop: scaleModerate(2)
  },
  vipUpgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9),
    gap: scaleModerate(2)
  },
  vipUpgradeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  vipUpgradeChevron: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  vipFeatureCard: {
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    overflow: 'hidden',
    padding: scaleModerate(12),
    marginTop: scaleModerate(12)
  },
  vipFeatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  vipFeature: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scaleModerate(2)
  },
  vipFeatureIcon: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  vipFeatureEmoji: {
    fontSize: scaleFont(16)
  },
  vipFeatureLabel: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(9),
    fontWeight: '600',
    textAlign: 'center'
  },
  walletRow: {
    flexDirection: 'row',
    gap: scaleModerate(10),
    marginTop: scaleModerate(12)
  },
  walletCardPressable: {
    flex: 1
  },
  walletCard: {
    flex: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12),
    overflow: 'hidden'
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
  walletSubtitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(9),
    maxWidth: '80%'
  },
  walletIllustration: {
    position: 'absolute',
    right: -scaleModerate(4),
    bottom: -scaleModerate(6),
    fontSize: scaleFont(46),
    opacity: 0.18
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
    overflow: 'hidden',
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
  toolsViewAll: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  toolItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: scaleModerate(16)
  },
  toolIcon: {
    width: scaleModerate(52),
    height: scaleModerate(52),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toolEmoji: {
    fontSize: scaleFont(22)
  },
  toolLabel: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(10.5),
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default ProfileScreen;
