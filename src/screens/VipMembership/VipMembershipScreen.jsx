import React from 'react';
import { Animated, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { vipBackgroundImage } from '../../assets';
import { useTheme } from '../../theme';
import { Screen, showAlert } from '../../components';
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
  return <LinearGradient colors={[hexToRgba(theme.surfaces.card, 0.65), hexToRgba(theme.surfaces.card, 0.4)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
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

const ALL_PRIVILEGES = [
  { key: 'level', emoji: '👑', label: 'VIP Level', color: '#F0B93D', description: 'Exclusive {level} badge' },
  { key: 'avatar', emoji: '🖼️', label: 'Vip Avatar', color: '#00F2FF', description: 'Exclusive {level} avatar' },
  { key: 'entry', emoji: '🎗️', label: 'Entry Strip', color: '#00F2FF', description: 'Exclusive {level} strip' },
  { key: 'car', emoji: '🐺', label: 'Vip Car', color: '#7000FF', description: 'Exclusive {level} car' },
  { key: 'card', emoji: '💳', label: 'BusinessCard', color: '#00F2FF', description: 'Exclusive {level} card' },
  { key: 'chat', emoji: '💬', label: 'Chat Bubble', color: '#00F2FF', description: 'Exclusive {level} bubble' },
  { key: 'gift', emoji: '🎁', label: 'Exclusive Gift', color: '#FF4DA3', description: 'Special monthly gift' },
  { key: 'medal', emoji: '🏅', label: 'VIP Medal', color: '#7000FF', description: 'Exclusive {level} medal' }
];

const EXTRA_PERKS = [
  { key: 'exposure', emoji: '💎', label: 'More Exposure', description: 'Get noticed in live rooms', color: '#7000FF' },
  { key: 'identity', emoji: '❤️', label: 'Special Identity', description: 'Show off your unique status', color: '#FF4DA3' },
  { key: 'support', emoji: '⚡', label: 'Priority Support', description: 'Get faster help 24/7', color: '#00F2FF' },
  { key: 'rewards', emoji: '⭐', label: 'Extra Rewards', description: 'Earn more coins & bonuses', color: '#2ECC71' }
];

const VIP_LEVELS = [
  { key: 'vip1', label: 'Vip1', price: 1000000, emoji: '🦌' },
  { key: 'vip2', label: 'Vip2', price: 2000000, emoji: '🐺' },
  { key: 'vip3', label: 'Vip3', price: 4000000, emoji: '🦁' },
  { key: 'vip4', label: 'Vip4', price: 8000000, emoji: '🐉' },
  { key: 'vip5', label: 'Vip5', price: 16000000, emoji: '🦅' },
  { key: 'svip', label: 'SVIP', price: 32000000, emoji: '👑' }
];

function GlowUnderline({ color }) {
  const shimmerAnim = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 900, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return <Animated.View style={[styles.glowUnderlineWrap, { opacity: shimmerAnim, shadowColor: color }]}>
      <LinearGradient
        colors={['transparent', color, '#FFFFFF', color, 'transparent']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.glowUnderlineFill}
      />
    </Animated.View>;
}

function LevelTab({ level, active, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={styles.levelTab}>
      <Text style={[styles.levelTabText, { color: active ? theme.colors.teal700 : theme.text.secondary }, active && styles.levelTabTextActive]}>{level.label}</Text>
    </Pressable>;
}

function PrivilegeItem({ privilege, level }) {
  const theme = useTheme();
  return <View style={styles.privilegeItem}>
      <View style={[styles.privilegeIcon, { borderColor: hexToRgba(privilege.color, 0.6), backgroundColor: hexToRgba(privilege.color, 0.1) }]}>
        <Text style={styles.privilegeEmoji}>{privilege.emoji}</Text>
      </View>
      <Text style={[styles.privilegeLabel, { color: theme.colors.vipGoldText }]} numberOfLines={1}>{privilege.label}</Text>
      <Text style={[styles.privilegeDescription, { color: theme.text.secondary }]} numberOfLines={2}>{privilege.description.replace('{level}', level.label)}</Text>
    </View>;
}

function ExtraPerkItem({ perk }) {
  const theme = useTheme();
  return <View style={styles.perkItem}>
      <View style={[styles.perkIcon, { borderColor: hexToRgba(perk.color, 0.6) }]}>
        <Text style={styles.perkEmoji}>{perk.emoji}</Text>
      </View>
      <Text style={[styles.perkLabel, { color: theme.text.primary }]} numberOfLines={1}>{perk.label}</Text>
      <Text style={[styles.perkDescription, { color: theme.text.secondary }]} numberOfLines={2}>{perk.description}</Text>
    </View>;
}

export function VipMembershipScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [levelIndex, setLevelIndex] = React.useState(0);
  const underlineAnim = React.useRef(new Animated.Value(1)).current;

  const pagerRef = React.useRef(null);
  const level = VIP_LEVELS[levelIndex];
  const tabWidth = width / VIP_LEVELS.length;

  React.useEffect(() => {
    Animated.spring(underlineAnim, { toValue: levelIndex, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, [levelIndex, underlineAnim]);

  const underlineTranslateX = underlineAnim.interpolate({
    inputRange: VIP_LEVELS.map((_, index) => index),
    outputRange: VIP_LEVELS.map((_, index) => index * tabWidth + tabWidth / 2 - scaleModerate(12))
  });

  const handlePurchase = () => {
    showAlert('Coming Soon', `${level.label} purchases aren't available yet — check back soon.`);
  };

  const handleGive = () => {
    showAlert('Coming Soon', `Gifting ${level.label} isn't available yet — check back soon.`);
  };

  const handleSelectLevel = index => {
    setLevelIndex(index);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handlePagerScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setLevelIndex(index);
  };

  const goToPreviousLevel = () => handleSelectLevel(Math.max(0, levelIndex - 1));
  const goToNextLevel = () => handleSelectLevel(Math.min(VIP_LEVELS.length - 1, levelIndex + 1));

  return <ImageBackground source={vipBackgroundImage} resizeMode="cover" style={[styles.background, { backgroundColor: theme.surfaces.page }]}>
      <Screen transparent>
      <View style={[styles.header, { paddingTop: insets.top + scaleModerate(14) }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>👑 <Text style={{ color: theme.colors.tertiary }}>VIP</Text> Membership</Text>
        <View style={[styles.helpButton, { borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.helpButtonText, { color: theme.text.secondary }]}>?</Text>
        </View>
      </View>

      <View style={styles.levelTabRow}>
        {VIP_LEVELS.map((item, index) => <LevelTab key={item.key} level={item} active={index === levelIndex} onPress={() => handleSelectLevel(index)} />)}
        <Animated.View style={[styles.levelTabUnderline, { transform: [{ translateX: underlineTranslateX }] }]}>
          <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.levelTabUnderlineFill} />
        </Animated.View>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerScrollEnd}
      >
        {VIP_LEVELS.map((item, index) => <ScrollView key={item.key} style={{ width }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.heroWrap}>
              <Pressable onPress={goToPreviousLevel} disabled={index === 0} style={[styles.heroArrow, { borderColor: theme.colors.cardBorder }, index === 0 && styles.heroArrowDisabled]}>
                <Text style={[styles.heroArrowText, { color: theme.text.primary }]}>‹</Text>
              </Pressable>

              <View style={styles.heroCenter}>
                <LinearGradient colors={[theme.colors.vipGoldText, theme.colors.tertiary, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBadge}>
                  <Text style={styles.heroBadgeEmoji}>{item.emoji}</Text>
                </LinearGradient>
                <Text style={[styles.heroTitle, { color: theme.colors.teal200, textShadowColor: theme.colors.teal700 }]}>{item.label.toUpperCase().replace('VIP', 'VIP ')}</Text>
                <GlowUnderline color={theme.colors.teal700} />
                <View style={[styles.validPill, { backgroundColor: hexToRgba(theme.colors.secondary, 0.14), borderColor: hexToRgba(theme.colors.secondary, 0.4) }]}>
                  <Text style={[styles.validPillText, { color: theme.colors.secondary }]}>🕐 Valid for 30 Days</Text>
                </View>
              </View>

              <Pressable onPress={goToNextLevel} disabled={index === VIP_LEVELS.length - 1} style={[styles.heroArrow, { borderColor: theme.colors.cardBorder }, index === VIP_LEVELS.length - 1 && styles.heroArrowDisabled]}>
                <Text style={[styles.heroArrowText, { color: theme.text.primary }]}>›</Text>
              </Pressable>
            </View>

            <GlassPanel style={[styles.privilegesCard, { borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.privilegesTitle, { color: theme.text.primary }]}>✦ Level Privileges ✦</Text>
              <View style={styles.privilegesGrid}>
                {ALL_PRIVILEGES.map(privilege => <PrivilegeItem key={privilege.key} privilege={privilege} level={item} />)}
              </View>
            </GlassPanel>

            <GlassPanel style={[styles.perksCard, { borderColor: theme.colors.cardBorder }]}>
              <View style={styles.perksRow}>
                {EXTRA_PERKS.map(perk => <ExtraPerkItem key={perk.key} perk={perk} />)}
              </View>
            </GlassPanel>
          </ScrollView>)}
      </ScrollView>

      <GlassPanel style={[styles.footer, { borderColor: hexToRgba(theme.colors.tertiary, 0.4), paddingBottom: insets.bottom + scaleModerate(12) }]}>
        <View style={styles.footerTop}>
          <Text style={[styles.footerPrice, { color: theme.colors.vipGoldText }]}>🪙 {level.price.toLocaleString()} <Text style={[styles.footerPriceUnit, { color: theme.text.secondary }]}>/30 Days</Text></Text>
          <View style={styles.footerButtons}>
            <Pressable onPress={handleGive} style={[styles.giveButton, { borderColor: theme.colors.teal700 }]}>
              <Text style={styles.giveButtonEmoji}>🎁</Text>
              <Text style={[styles.giveButtonText, { color: theme.colors.teal700 }]}>Give</Text>
            </Pressable>
            <Pressable onPress={handlePurchase}>
              <LinearGradient colors={[theme.colors.teal700, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.purchaseButton}>
                <Text style={styles.purchaseButtonText}>Purchase</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.footerNotice, { color: theme.text.secondary }]}>You are not yet {level.label}</Text>
      </GlassPanel>
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
    paddingBottom: scaleModerate(8)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  helpButton: {
    width: scaleModerate(26),
    height: scaleModerate(26),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  levelTabRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: scaleModerate(10)
  },
  levelTab: {
    flex: 1,
    alignItems: 'center'
  },
  levelTabText: {
    fontSize: scaleFont(17),
    fontWeight: '600'
  },
  levelTabTextActive: {
    fontWeight: '800'
  },
  levelTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: scaleModerate(24),
    height: scaleModerate(3)
  },
  levelTabUnderlineFill: {
    flex: 1,
    borderRadius: 999
  },
  scrollContent: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(24)
  },
  heroWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleModerate(12)
  },
  heroArrow: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroArrowText: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  heroArrowDisabled: {
    opacity: 0.35
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center'
  },
  heroBadge: {
    width: scaleModerate(110),
    height: scaleModerate(110),
    borderRadius: scaleModerate(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(10)
  },
  heroBadgeEmoji: {
    fontSize: scaleFont(50)
  },
  heroTitle: {
    fontSize: scaleFont(34),
    fontWeight: '900',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16
  },
  glowUnderlineWrap: {
    width: scaleModerate(140),
    height: scaleModerate(4),
    marginTop: scaleModerate(8),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6
  },
  glowUnderlineFill: {
    flex: 1,
    borderRadius: 999
  },
  validPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    marginTop: scaleModerate(12),
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(5)
  },
  validPillText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  privilegesCard: {
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  privilegesTitle: {
    textAlign: 'center',
    fontSize: scaleFont(16),
    fontWeight: '800',
    marginBottom: scaleModerate(16)
  },
  privilegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  privilegeItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: scaleModerate(16),
    paddingHorizontal: scaleModerate(2)
  },
  privilegeIcon: {
    width: scaleModerate(54),
    height: scaleModerate(54),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6)
  },
  privilegeEmoji: {
    fontSize: scaleFont(22)
  },
  privilegeLabel: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    textAlign: 'center'
  },
  privilegeDescription: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9),
    textAlign: 'center'
  },
  perksCard: {
    marginTop: scaleModerate(14),
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  perksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  perkItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: scaleModerate(2)
  },
  perkIcon: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6)
  },
  perkEmoji: {
    fontSize: scaleFont(18)
  },
  perkLabel: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center'
  },
  perkDescription: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9),
    textAlign: 'center'
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(12)
  },
  footerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  footerPrice: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  footerPriceUnit: {
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  footerButtons: {
    flexDirection: 'row',
    gap: scaleModerate(8)
  },
  giveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4),
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9)
  },
  giveButtonEmoji: {
    fontSize: scaleFont(12)
  },
  giveButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  purchaseButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(18),
    paddingVertical: scaleModerate(9)
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  footerNotice: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(11)
  }
});

export default VipMembershipScreen;
