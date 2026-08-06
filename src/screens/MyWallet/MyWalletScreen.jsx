import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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

const TOTAL_BALANCE = 12450;
const DIAMONDS = 2850;
const COUPONS = 12;

const ACTIONS = [
  { key: 'topup', emoji: '👛', label: 'Top Up', color: '#FF4DA3', primary: true },
  { key: 'withdraw', emoji: '⬆️', label: 'Withdraw', color: '#00F2FF' },
  { key: 'transfer', emoji: '🔁', label: 'Transfer', color: '#7000FF' },
  { key: 'transaction', emoji: '🧾', label: 'Transaction', color: '#F5A623' }
];

const COIN_PACKAGES = [
  { key: 'p1', bonus: '+5%', coins: 5000, price: 'PKR 240' },
  { key: 'p2', bonus: '+10%', coins: 12000, price: 'PKR 550' },
  { key: 'p3', bonus: '+20%', coins: 25000, price: 'PKR 1,050', bestValue: true },
  { key: 'p4', bonus: '+30%', coins: 60000, price: 'PKR 2,200' },
  { key: 'p5', bonus: '+40%', coins: 125000, price: 'PKR 4,200' }
];

const TRANSACTIONS = [
  { key: 't1', type: 'in', title: 'Received from Gift', subtitle: 'From @VibeQueen', amount: '+2,000', unit: '🪙', time: 'Today, 10:25 PM' },
  { key: 't2', type: 'out', title: 'Coins Package', subtitle: '25,000 Coins', amount: '- PKR 1,050', time: 'Today, 09:40 PM' }
];

function ActionButton({ action, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.actionButton, {
      borderColor: action.primary ? action.color : theme.colors.cardBorder,
      backgroundColor: action.primary ? hexToRgba(action.color, 0.12) : 'transparent'
    }]}>
      <View style={[styles.actionIcon, { borderColor: action.color }]}>
        <Text style={styles.actionEmoji}>{action.emoji}</Text>
      </View>
      <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
    </Pressable>;
}

function CoinPackageCard({ item, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.packageCard, { borderColor: item.bestValue ? theme.colors.teal700 : theme.colors.cardBorder, backgroundColor: item.bestValue ? hexToRgba(theme.colors.teal700, 0.08) : 'transparent' }]}>
      <View style={[styles.packageBadge, { backgroundColor: theme.colors.teal700 }]}>
        <Text style={styles.packageBadgeText}>{item.bonus}</Text>
      </View>
      <Text style={styles.packageCoinsIcon}>🪙</Text>
      {item.bestValue ? <View style={[styles.bestValuePill, { backgroundColor: theme.colors.vipGoldText }]}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View> : null}
      <Text style={[styles.packageCoinsText, { color: theme.text.primary }]}>🪙 {item.coins.toLocaleString()}</Text>
      <View style={[styles.packagePricePill, { borderColor: theme.colors.cardBorder }]}>
        <Text style={[styles.packagePriceText, { color: theme.text.primary }]}>{item.price}</Text>
      </View>
    </Pressable>;
}

function TransactionRow({ item }) {
  const theme = useTheme();
  const isIn = item.type === 'in';
  return <View style={[styles.txRow, { borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.txIcon, { backgroundColor: isIn ? hexToRgba(theme.colors.tertiary, 0.22) : hexToRgba(theme.colors.secondary, 0.22) }]}>
        <Text style={styles.txIconGlyph}>{isIn ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txTextWrap}>
        <Text style={[styles.txTitle, { color: theme.text.primary }]}>{item.title}</Text>
        <Text style={[styles.txSubtitle, { color: theme.text.secondary }]}>{item.subtitle}</Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txAmount, { color: isIn ? '#2ECC71' : theme.text.primary }]}>{item.amount}{item.unit ? ` ${item.unit}` : ''}</Text>
        <Text style={[styles.txTime, { color: theme.text.secondary }]}>{item.time}</Text>
      </View>
    </View>;
}

export function MyWalletScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleComingSoon = label => {
    showAlert('Coming Soon', `${label} isn't available yet — check back soon.`);
  };

  return <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scaleModerate(14) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>👛 My Wallet</Text>
          <Pressable style={[styles.historyButton, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]} onPress={() => handleComingSoon('History')}>
            <Text style={[styles.historyButtonText, { color: theme.colors.tertiary }]}>🕐 History</Text>
          </Pressable>
        </View>

        <GlassPanel style={[styles.heroCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}>
          <View style={styles.heroLeft}>
            <View style={styles.heroLabelRow}>
              <Text style={[styles.heroLabel, { color: theme.text.secondary }]}>Total Balance</Text>
              <Text style={styles.heroEyeIcon}>👁️</Text>
            </View>
            <Text style={styles.heroBalance}>
              <Text style={{ color: theme.colors.teal700 }}>{TOTAL_BALANCE.toLocaleString().split(',')[0]},</Text>
              <Text style={{ color: theme.colors.secondary }}>{TOTAL_BALANCE.toLocaleString().split(',')[1]}</Text>
            </Text>
            <Text style={[styles.heroCoinsLabel, { color: theme.colors.vipGoldText }]}>🪙 Coins</Text>

            <View style={[styles.heroDivider, { backgroundColor: theme.colors.cardBorder }]} />

            <View style={styles.heroSubRow}>
              <View style={styles.heroSubItem}>
                <Text style={[styles.heroSubValue, { color: theme.text.primary }]}>💎 {DIAMONDS.toLocaleString()}</Text>
                <Text style={[styles.heroSubLabel, { color: theme.text.secondary }]}>Diamonds</Text>
              </View>
              <View style={styles.heroSubItem}>
                <Text style={[styles.heroSubValue, { color: theme.text.primary }]}>🎟️ {COUPONS}</Text>
                <Text style={[styles.heroSubLabel, { color: theme.text.secondary }]}>Coupons</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroIllustration}>
            <Text style={styles.heroWalletEmoji}>👛</Text>
            <Text style={styles.heroCoinEmoji}>🪙</Text>
          </View>
        </GlassPanel>

        <View style={[styles.actionsRow, { borderColor: theme.colors.cardBorder }]}>
          {ACTIONS.map(action => <ActionButton key={action.key} action={action} onPress={() => handleComingSoon(action.label)} />)}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Coins Packages</Text>
          <Pressable onPress={() => handleComingSoon('Coins Packages')}>
            <Text style={[styles.sectionLink, { color: theme.colors.tertiary }]}>View all ›</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesRow}>
          {COIN_PACKAGES.map(item => <CoinPackageCard key={item.key} item={item} onPress={() => handleComingSoon('Coins purchase')} />)}
        </ScrollView>

        <Pressable onPress={() => handleComingSoon('Diamond recharge')}>
          <LinearGradient colors={[hexToRgba(theme.colors.tertiary, 0.35), hexToRgba(theme.colors.teal700, 0.2)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.diamondBanner, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]}>
            <View style={styles.diamondBannerText}>
              <Text style={[styles.diamondBannerTitle, { color: theme.text.primary }]}>Recharge Diamonds</Text>
              <Text style={[styles.diamondBannerSubtitle, { color: theme.text.secondary }]}>Top up diamonds and enjoy exclusive gifts!</Text>
            </View>
            <Text style={styles.diamondBannerEmoji}>💎</Text>
            <Text style={[styles.diamondBannerChevron, { color: theme.text.primary }]}>›</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Recent Transactions</Text>
          <Pressable onPress={() => handleComingSoon('Transaction history')}>
            <Text style={[styles.sectionLink, { color: theme.colors.tertiary }]}>View all ›</Text>
          </Pressable>
        </View>
        <GlassPanel style={[styles.txCard, { borderColor: theme.colors.cardBorder }]}>
          {TRANSACTIONS.map(item => <TransactionRow key={item.key} item={item} />)}
        </GlassPanel>
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
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    overflow: 'hidden',
    padding: scaleModerate(16)
  },
  heroLeft: {
    flex: 1
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  heroLabel: {
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  heroEyeIcon: {
    fontSize: scaleFont(12)
  },
  heroBalance: {
    fontSize: scaleFont(34),
    fontWeight: '900',
    marginTop: scaleModerate(4)
  },
  heroCoinsLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    marginTop: scaleModerate(2)
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: scaleModerate(12),
    width: '90%'
  },
  heroSubRow: {
    flexDirection: 'row',
    gap: scaleModerate(20)
  },
  heroSubItem: {},
  heroSubValue: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  heroSubLabel: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10)
  },
  heroIllustration: {
    width: scaleModerate(96),
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroWalletEmoji: {
    fontSize: scaleFont(60)
  },
  heroCoinEmoji: {
    fontSize: scaleFont(22),
    marginTop: -scaleModerate(14)
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(10),
    marginTop: scaleModerate(14)
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: scaleModerate(14),
    paddingVertical: scaleModerate(10),
    marginHorizontal: scaleModerate(3)
  },
  actionIcon: {
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(10),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(6)
  },
  actionEmoji: {
    fontSize: scaleFont(15)
  },
  actionLabel: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleModerate(18),
    marginBottom: scaleModerate(10)
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  sectionLink: {
    fontSize: scaleFont(11.5),
    fontWeight: '700'
  },
  packagesRow: {
    gap: scaleModerate(10),
    paddingVertical: scaleModerate(4)
  },
  packageCard: {
    width: scaleModerate(110),
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: scaleModerate(16),
    paddingTop: scaleModerate(18),
    paddingBottom: scaleModerate(10),
    paddingHorizontal: scaleModerate(8)
  },
  packageBadge: {
    position: 'absolute',
    top: scaleModerate(8),
    right: scaleModerate(8),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(7),
    paddingVertical: scaleModerate(2)
  },
  packageBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(9),
    fontWeight: '800'
  },
  packageCoinsIcon: {
    fontSize: scaleFont(30)
  },
  bestValuePill: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(2),
    marginTop: scaleModerate(2)
  },
  bestValueText: {
    color: '#1A1308',
    fontSize: scaleFont(8),
    fontWeight: '900'
  },
  packageCoinsText: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  packagePricePill: {
    marginTop: scaleModerate(8),
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(4)
  },
  packagePriceText: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  diamondBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(16),
    padding: scaleModerate(14),
    marginTop: scaleModerate(6)
  },
  diamondBannerText: {
    flex: 1
  },
  diamondBannerTitle: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  diamondBannerSubtitle: {
    marginTop: scaleModerate(3),
    fontSize: scaleFont(10.5)
  },
  diamondBannerEmoji: {
    fontSize: scaleFont(26),
    marginRight: scaleModerate(6)
  },
  diamondBannerChevron: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  txCard: {
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    overflow: 'hidden',
    paddingHorizontal: scaleModerate(14)
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(12),
    borderTopWidth: StyleSheet.hairlineWidth
  },
  txIcon: {
    width: scaleModerate(38),
    height: scaleModerate(38),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  txIconGlyph: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    color: '#FFFFFF'
  },
  txTextWrap: {
    flex: 1
  },
  txTitle: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  txSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5)
  },
  txAmountWrap: {
    alignItems: 'flex-end'
  },
  txAmount: {
    fontSize: scaleFont(12.5),
    fontWeight: '800'
  },
  txTime: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(9.5)
  }
});

export default MyWalletScreen;
