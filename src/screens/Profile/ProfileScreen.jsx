import React from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  profileBackgroundImage,
  tasksImage,
  walletDiamondsImage,
  toolAgencyImage,
  toolBadgesImage,
  toolBagImage,
  toolHelpCenterImage,
  toolMyLevelImage,
  toolOfficialsImage,
  toolSettingsImage,
  toolShopImage,
  vipBadgesIconsImage,
  vipIllustrationImage
} from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, GenderAgeChip, Screen, VerifiedTick } from '../../components';
import { fetchFriends, fetchWallet } from '../../api';
import { useAssignedBadge, useAssignedFrame } from '../../hooks';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';
import { routes } from '../../navigation/routes';
import { ProfileIcon } from './ProfileIcon';

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
        colors={[hexToRgba(theme.colors.neutral900, 0.5), hexToRgba(theme.colors.neutral900, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </AnimatedLinearGradient>;
}

const VIP_BADGE_SPRITE_SIZE = { width: 1536, height: 1024 };
const VIP_BADGE_SPRITE_COUNT = 5;
const VIP_BADGE_SPRITE_CELL_WIDTH = VIP_BADGE_SPRITE_SIZE.width / VIP_BADGE_SPRITE_COUNT;
const VIP_BADGE_CIRCLE = { diameterRatio: 0.82, centerYRatio: 0.493 };

function VipBadgeIcon({ index, size }) {
  const diameter = VIP_BADGE_SPRITE_CELL_WIDTH * VIP_BADGE_CIRCLE.diameterRatio;
  const centerX = VIP_BADGE_SPRITE_CELL_WIDTH * (index + 0.5);
  const centerY = VIP_BADGE_SPRITE_SIZE.height * VIP_BADGE_CIRCLE.centerYRatio;
  const scale = size / diameter;
  return <View style={[styles.vipFeatureIcon, styles.vipFeatureIconClip, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={vipBadgesIconsImage}
        style={[styles.vipBadgeSpriteImage, {
          width: VIP_BADGE_SPRITE_SIZE.width * scale,
          height: VIP_BADGE_SPRITE_SIZE.height * scale,
          left: -(centerX - diameter / 2) * scale,
          top: -(centerY - diameter / 2) * scale
        }]}
      />
    </View>;
}

function VipFeature({ index, label }) {
  const theme = useTheme();
  return <View style={styles.vipFeature}>
      <VipBadgeIcon index={index} size={scaleModerate(44)} />
      <Text style={[styles.vipFeatureLabel, { color: theme.text.secondary }]} numberOfLines={2}>{label}</Text>
    </View>;
}

const VIP_FEATURES = [
  { label: 'Exclusive Badges' },
  { label: 'Special Chat Colors' },
  { label: 'Priority Support' },
  { label: 'Monthly Rewards' },
  { label: 'Verified Profile' }
];

const TOOL_ICON_IMAGES = {
  'My Level': toolMyLevelImage,
  Shop: toolShopImage,
  Badges: toolBadgesImage,
  Officials: toolOfficialsImage,
  Agency: toolAgencyImage,
  Bag: toolBagImage,
  Settings: toolSettingsImage,
  'Help Center': toolHelpCenterImage
};

function StatItem({ label, value, onPress, showDivider }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.statItem, showDivider ? { borderLeftColor: theme.colors.cardBorder } : null]}>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}</Text>
    </Pressable>;
}

function ToolItem({ icon, label, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} disabled={!onPress} style={styles.toolItem}>
      <Image source={icon} style={styles.toolIconImage} resizeMode="contain" />
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
  const [diamondBalance, setDiamondBalance] = React.useState(null);
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
        fetchWallet(session.token).then(data => {
          if (!cancelled) {
            setDiamondBalance(data.diamonds ?? 0);
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
    { label: 'My Level', onPress: () => navigation.navigate(routes.myLevel) },
    { label: 'Shop', onPress: () => navigation.navigate(routes.store) },
    { label: 'Badges', onPress: () => navigation.navigate(routes.badges) },
    { label: 'Officials', onPress: () => navigation.navigate(routes.officials) },
    { label: 'Agency', onPress: () => navigation.navigate(routes.agencyChoice) },
    { label: 'Bag' },
    { label: 'Settings', onPress: () => navigation.navigate(routes.settings) },
    { label: 'Help Center', onPress: () => navigation.navigate(routes.helpCentre) }
  ];

  const content = <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.headerCard} borderColor={neonBorderColor}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.navigate(routes.changeAvatar)}
          
            // no frame.
            style={frameUri ? undefined : [styles.avatarRing, { borderColor: theme.colors.teal700, shadowColor: theme.colors.teal700 }]}
          >
            <Avatar value={user?.profileImage} fullName={user?.fullName} size={scaleModerate(70)} frameUri={frameUri} />
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
          {stats.map((stat, index) => <StatItem key={stat.key} label={stat.label} value={stat.value} onPress={stat.onPress} showDivider={index > 0} />)}
        </View>
      </GlassPanel>

      <GlassPanel style={styles.vipFeatureCard} borderColor={neonBorderColor}>
        <View style={styles.vipTopRow}>
          <Image source={vipIllustrationImage} style={styles.vipBadge} resizeMode="contain" />

          <View style={styles.vipTextWrap}>
            <Text style={[styles.vipTitle, { color: theme.text.primary }]}>
              <Text style={[styles.vipCrownGlow, { color: theme.colors.secondary, textShadowColor: theme.colors.secondary }]}>👑 </Text>
              <Text style={{ color: theme.colors.tertiary }}>Premium</Text> VIP
            </Text>
            <Text style={[styles.vipSubtitle, { color: theme.text.secondary }]}>Unlock exclusive perks & badges</Text>
          </View>

          <Pressable onPress={() => navigation.navigate(routes.vipMembership)}>
            <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.vipUpgrade}>
              <Text style={styles.vipUpgradeText}>Upgrade</Text>
              <Text style={styles.vipUpgradeChevron}>›</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.vipFeatureRow}>
          {VIP_FEATURES.map((feature, index) => <VipFeature key={feature.label} index={index} label={feature.label} />)}
        </View>
      </GlassPanel>

      <View style={styles.walletRow}>
        <Pressable style={styles.walletCardPressable} onPress={() => navigation.navigate(routes.myWallet)}>
          <GlassPanel style={styles.walletCard} borderColor={neonBorderColor}>
            <View style={styles.walletLabelRow}><ProfileIcon name="wallet" size={scaleModerate(15)} color={theme.colors.secondary} /><Text style={[styles.walletLabel, { color: theme.text.secondary }]}>My Wallet</Text></View>
            <Text style={[styles.walletValue, { color: theme.text.primary }]}>
              {diamondBalance !== null ? Number(diamondBalance).toLocaleString() : '0'}
            </Text>
            <View style={styles.walletUnitRow}>
              <Text style={[styles.walletUnit, { color: theme.colors.vipGoldText }]}>Diamonds</Text>
              <ProfileIcon name="diamond" size={scaleModerate(16)} color={theme.colors.vipGoldText} />
            </View>
            <Image source={walletDiamondsImage} style={styles.walletIllustration} resizeMode="contain" />
          </GlassPanel>
        </Pressable>
        <Pressable style={styles.walletCardPressable} onPress={() => navigation.navigate(routes.tasks)}>
          <GlassPanel style={styles.walletCard} borderColor={neonBorderColor}>
            <View style={styles.walletLabelRow}><ProfileIcon name="priority" size={scaleModerate(15)} color={theme.colors.vipGoldText} /><Text style={[styles.walletLabel, { color: theme.text.secondary }]}>Earn Coins</Text></View>
            <View style={styles.tasksRow}>
              <Text style={[styles.walletValue, { color: theme.text.primary }]}>Tasks</Text>
              <View style={[styles.tasksDot, { backgroundColor: theme.colors.liveBadge }]} />
            </View>
            <Text style={[styles.walletSubtitle, { color: theme.text.secondary }]} numberOfLines={2}>Complete tasks & earn more coins</Text>
            <Image source={tasksImage} style={[styles.walletIllustration, { right: scaleModerate(3) }]} resizeMode="contain" />
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
          {tools.map(tool => <ToolItem key={tool.label} icon={TOOL_ICON_IMAGES[tool.label]} label={tool.label} onPress={tool.onPress} />)}
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
    flexGrow: 1,
    paddingHorizontal: scaleModerate(14),
    paddingTop: scaleModerate(4),
    paddingBottom: scaleModerate(28)
  },
  topBar: {
    height: scaleModerate(128),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(2)
  },
  topIconButton: {
    width: scaleModerate(38),
    height: scaleModerate(38),
    borderRadius: scaleModerate(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth
  },
  topIcon: {
    fontSize: scaleFont(42),
    fontWeight: '300',
    marginTop: scaleModerate(-6)
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12)
  },
  actionIcon: {
    fontSize: scaleFont(25),
    fontWeight: '700'
  },
  topBrand: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: '58%'
  },
  topTrophy: {
    fontSize: scaleFont(52),
    marginBottom: scaleModerate(-10),
    zIndex: 1
  },
  skyline: {
    height: scaleModerate(54),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    opacity: 0.7
  },
  skylineBar: {
    width: scaleModerate(5),
    borderTopLeftRadius: scaleModerate(2),
    borderTopRightRadius: scaleModerate(2)
  },
  headerCard: {
    borderRadius: scaleModerate(15),
    borderWidth: 1,
    overflow: 'hidden',
    padding: scaleModerate(13)
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
    marginTop: scaleModerate(13)
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth
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
    paddingHorizontal: scaleModerate(4),
    marginTop: scaleModerate(12),
    marginBottom: scaleModerate(14)
  },
  vipBadge: {
    width: scaleModerate(84),
    height: scaleModerate(84)
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
    fontSize: scaleFont(19),
    fontWeight: '800'
  },
  vipSubtitle: {
    fontSize: scaleFont(13.5),
    marginTop: scaleModerate(4)
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  vipFeatureIconClip: {
    overflow: 'hidden'
  },
  vipCrownGlow: {
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 }
  },
  vipBadgeSpriteImage: {
    position: 'absolute'
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
  walletUnitRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  walletUnitIcon: {
    width: scaleModerate(14),
    height: scaleModerate(14),
    marginLeft: scaleModerate(8)
  },
  walletSubtitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(9),
    maxWidth: '80%'
  },
  walletIllustration: {
    position: 'absolute',
    right: scaleModerate(8),
    top: '50%',
    width: scaleModerate(78),
    height: scaleModerate(78),
    marginTop: -scaleModerate(14)
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
    flexWrap: 'wrap',
    rowGap: scaleModerate(13)
  },
  toolItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: scaleModerate(10)
  },
  toolIconImage: {
    width: scaleModerate(50),
    height: scaleModerate(50)
  },
  toolEmoji: {
    fontSize: scaleFont(18)
  },
  toolLabel: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(10.5),
    fontWeight: '700',
    textAlign: 'center'
  }
});

export default ProfileScreen;
