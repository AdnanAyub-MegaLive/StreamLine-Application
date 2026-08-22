import React from 'react';
import { Image, ImageBackground, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { profileBackgroundImage, walletImage, TransactionStatusIcon, WalletActionIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen, showAlert } from '../../components';
import { fetchCoinPackages, fetchWallet, fetchWalletTransactions } from '../../api';
import { useAppStore } from '../../store';
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
        colors={[hexToRgba(theme.colors.neutral900, 0.5), hexToRgba(theme.colors.neutral900, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>;
}

const ACTIONS = [
  { key: 'topup', emoji: '👛', label: 'Top Up', color: '#FF4DA3', primary: true },
  { key: 'withdraw', emoji: '⬆️', label: 'Withdraw', color: '#00F2FF' },
  { key: 'transfer', emoji: '🔁', label: 'Transfer', color: '#7000FF' },
  { key: 'transaction', emoji: '🧾', label: 'Transaction', color: '#F5A623' }
];

function formatTxTime(isoString) {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timePart = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}

function ActionButton({ action, onPress }) {
  const theme = useTheme();
  const backgroundColor = action.primary ? hexToRgba(action.color, 0.12) : 'transparent';
  return <Pressable onPress={onPress} style={[styles.actionButton, {
      borderColor: action.primary ? action.color : theme.colors.cardBorder,
      backgroundColor
    }]}>
      <View style={[styles.actionIcon, { borderColor: action.color }]}>
        <WalletActionIcon name={action.key} size={scaleModerate(22)} color={action.color} />
      </View>
      <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
    </Pressable>;
}

function CoinPackageCard({ item, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.packageCard, { borderColor: item.bestValue ? theme.colors.teal700 : theme.colors.cardBorder, backgroundColor: item.bestValue ? hexToRgba(theme.colors.teal700, 0.14) : hexToRgba(theme.colors.neutral900, 0.55) }]}>
      <View style={[styles.packageBadge, { backgroundColor: theme.colors.teal700 }]}>
        <Text style={styles.packageBadgeText}>+{item.bonusPercent}%</Text>
      </View>
      <Text style={styles.packageCoinsIcon}>🪙</Text>
      {item.bestValue ? <View style={[styles.bestValuePill, { backgroundColor: theme.colors.vipGoldText }]}>
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View> : null}
      <Text style={[styles.packageCoinsText, { color: theme.text.primary }]}>🪙 {Number(item.totalCoins).toLocaleString()}</Text>
      <View style={[styles.packagePricePill, { borderColor: theme.colors.cardBorder }]}>
        <Text style={[styles.packagePriceText, { color: theme.text.primary }]}>{item.currency} {Number(item.price).toLocaleString()}</Text>
      </View>
    </Pressable>;
}

function TransactionRow({ item }) {
  const theme = useTheme();
  const isIn = item.direction === 'CREDIT';
  const amountColor = isIn ? '#2ECC71' : theme.text.primary;
  const amountValue = item.coins ?? item.diamonds ?? item.amount;
  const unit = item.coins ? '🪙' : item.diamonds ? '💎' : null;
  const category = getTransactionCategory(item);
  const transactionIconType = category === 'withdraw' ? 'withdrawal' : category === 'purchase' ? 'purchase' : category === 'received' || category === 'admin_added' ? 'received' : 'sent';
  return <View style={[styles.txRow, { borderColor: theme.colors.cardBorder }]}>
      <TransactionStatusIcon type={transactionIconType} size={scaleModerate(38)} />
      <View style={styles.txTextWrap}>
        <Text style={[styles.txTitle, { color: theme.text.primary }]}>{item.title}</Text>
        <Text style={[styles.txSubtitle, { color: theme.text.secondary }]}>{item.description}</Text>
      </View>
      <View style={styles.txAmountWrap}>
        <Text style={[styles.txAmount, { color: amountColor }]}>{isIn ? '+' : '- '}{Number(amountValue).toLocaleString()}{unit ? ` ${unit}` : ''}</Text>
        <Text style={[styles.txTime, { color: theme.text.secondary }]}>{formatTxTime(item.createdAt)}</Text>
      </View>
    </View>;
}

function getTransactionCategory(item) {
  const transactionText = `${item.title ?? ''} ${item.description ?? ''}`.toLowerCase();
  if (transactionText.includes('admin') || transactionText.includes('administrator')) return 'admin_added';
  if (transactionText.includes('withdraw')) return 'withdraw';
  if (transactionText.includes('purchase') || transactionText.includes('top up')) return 'purchase';
  if (item.direction === 'CREDIT') return 'received';
  return 'send';
}

function GradientText({ children, style }) {
  const characters = String(children).split('');
  return <Text style={style}>{characters.map((character, index) => <Text key={`${character}-${index}`} style={index < characters.length / 3 ? styles.balanceGradientPink : index < characters.length * 2 / 3 ? styles.balanceGradientPurple : styles.balanceGradientBlue}>{character}</Text>)}</Text>;
}

function WithdrawTab({ onBack }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = React.useState('');
  const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const payout = numericAmount / 100;
  const quickAmounts = [1000, 5000, 10000, 50000];

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={styles.background} resizeMode="cover">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.withdrawContent, { paddingTop: insets.top + scaleModerate(14) }]}>
          <View style={styles.withdrawHeader}>
            <Pressable onPress={onBack} hitSlop={10}>
              <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
            </Pressable>
            <Text style={[styles.withdrawHeaderTitle, { color: theme.text.primary }]}>Withdraw</Text>
            <View style={styles.withdrawHeaderSpacer} />
          </View>

          <Text style={[styles.withdrawLabel, { color: theme.text.primary }]}>Withdraw Amount</Text>
          <View style={[styles.amountInputWrap, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.62) }]}>
            <Text style={styles.amountCoinIcon}>♦</Text>
            <TextInput
              value={amount}
              onChangeText={value => setAmount(value.replace(/[^0-9]/g, ''))}
              placeholder="Enter amount"
              placeholderTextColor={theme.text.secondary}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: theme.text.primary }]}
            />
            <Text style={[styles.amountUnit, { color: theme.text.secondary }]}>Diamonds</Text>
          </View>

          <View style={styles.quickAmountRow}>
            {quickAmounts.map(value => <Pressable key={value} onPress={() => setAmount(String(value))} style={[styles.quickAmount, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.48) }]}>
                <Text style={[styles.quickAmountText, { color: theme.text.primary }]}>{value.toLocaleString()}</Text>
              </Pressable>)}
          </View>

          <LinearGradient colors={[hexToRgba(theme.colors.secondary, 0.22), hexToRgba(theme.colors.teal700, 0.12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.withdrawSummary, { borderColor: hexToRgba(theme.colors.teal700, 0.36) }]}>
            <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>You will receive</Text>
            <Text style={[styles.summaryAmount, { color: theme.text.primary }]}>${payout.toFixed(2)} <Text style={styles.summaryCurrency}>USD</Text></Text>
            <Text style={[styles.summaryRate, { color: theme.text.secondary }]}>Rate: 100 Diamonds = $1.00 USD</Text>
          </LinearGradient>

          <Text style={[styles.withdrawLabel, styles.withdrawMethodLabel, { color: theme.text.primary }]}>Withdraw Method</Text>
          <Pressable onPress={() => showAlert('Bank Account', 'Bank account selection will be available soon.')} style={[styles.withdrawMethod, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.62) }]}>
            <Text style={[styles.bankIcon, { color: theme.colors.tertiary }]}>▥</Text>
            <Text style={[styles.bankLabel, { color: theme.text.primary }]}>Bank Account</Text>
            <Text style={[styles.bankChevron, { color: theme.text.secondary }]}>⌄</Text>
          </Pressable>

          <View style={[styles.withdrawNotes, { borderColor: hexToRgba(theme.colors.teal700, 0.68), backgroundColor: hexToRgba(theme.colors.teal700, 0.07) }]}>
            <View style={styles.notesTitleRow}>
              <Text style={[styles.notesInfoIcon, { color: theme.colors.tertiary }]}>i</Text>
              <Text style={[styles.notesTitle, { color: theme.colors.tertiary }]}>Important Notes</Text>
            </View>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Minimum withdrawal amount is 5,000 Diamonds.</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Withdrawals are reviewed within 1–3 business days.</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Standard user accounts cannot request withdrawals.</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Make sure your bank details are correct.</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </Screen>;
}

function TransferTab({ onBack, onOpenQr }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [recipientId, setRecipientId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const quickAmounts = [1000, 5000, 10000, 50000];

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={styles.background} resizeMode="cover">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.withdrawContent, { paddingTop: insets.top + scaleModerate(14) }]}>
          <View style={styles.withdrawHeader}>
            <Pressable onPress={onBack} hitSlop={10}><Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text></Pressable>
            <Text style={[styles.withdrawHeaderTitle, { color: theme.text.primary }]}>Transfer Diamonds</Text>
            <Pressable onPress={onOpenQr} style={[styles.transferQrButton, { borderColor: hexToRgba(theme.colors.tertiary, 0.6) }]}>
              <Text style={[styles.transferQrButtonText, { color: theme.colors.tertiary }]}>My QR</Text>
            </Pressable>
          </View>

          <Text style={[styles.withdrawLabel, { color: theme.text.primary }]}>Recipient&apos;s Public ID</Text>
          <View style={[styles.amountInputWrap, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.62) }]}>
            <Text style={[styles.recipientIcon, { color: theme.colors.tertiary }]}>▣</Text>
            <TextInput
              value={recipientId}
              onChangeText={setRecipientId}
              placeholder="Enter user's public ID"
              placeholderTextColor={theme.text.secondary}
              autoCapitalize="none"
              style={[styles.amountInput, { color: theme.text.primary }]}
            />
            <Pressable hitSlop={8} onPress={() => showAlert('Scan QR', 'QR scanning will be available soon.')}><Text style={[styles.scanIcon, { color: theme.colors.teal700 }]}>⌘</Text></Pressable>
          </View>
          <Text style={[styles.fieldHint, { color: theme.text.secondary }]}>Make sure the public ID is correct.</Text>

          <Text style={[styles.withdrawLabel, styles.transferAmountLabel, { color: theme.text.primary }]}>Amount</Text>
          <View style={[styles.amountInputWrap, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.62) }]}>
            <Text style={styles.amountCoinIcon}>●</Text>
            <TextInput value={amount} onChangeText={value => setAmount(value.replace(/[^0-9]/g, ''))} placeholder="Enter amount" placeholderTextColor={theme.text.secondary} keyboardType="number-pad" style={[styles.amountInput, { color: theme.text.primary }]} />
            <Text style={[styles.amountUnit, { color: theme.text.secondary }]}>Diamonds</Text>
          </View>
          <View style={styles.quickAmountRow}>
            {quickAmounts.map(value => <Pressable key={value} onPress={() => setAmount(String(value))} style={[styles.quickAmount, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.48) }]}><Text style={[styles.quickAmountText, { color: theme.text.primary }]}>{value.toLocaleString()}</Text></Pressable>)}
          </View>

          <LinearGradient colors={[hexToRgba(theme.colors.secondary, 0.22), hexToRgba(theme.colors.teal700, 0.12)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.transferSummary, { borderColor: hexToRgba(theme.colors.teal700, 0.36) }]}>
            <View style={styles.transferSummaryRow}><Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>You will send</Text><Text style={[styles.transferSummaryValue, { color: theme.text.primary }]}>{numericAmount.toLocaleString()} Diamonds</Text></View>
            <View style={styles.transferSummaryRow}><Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Transfer Fee</Text><Text style={[styles.transferSummaryValue, { color: theme.text.primary }]}>0 Diamonds</Text></View>
            <View style={styles.transferSummaryRow}><Text style={[styles.totalDeduction, { color: theme.text.primary }]}>Total Deduction</Text><Text style={[styles.totalDeduction, { color: theme.colors.teal700 }]}>{numericAmount.toLocaleString()} Diamonds</Text></View>
          </LinearGradient>

          <View style={[styles.withdrawNotes, { borderColor: hexToRgba(theme.colors.teal700, 0.68), backgroundColor: hexToRgba(theme.colors.teal700, 0.07) }]}>
            <View style={styles.notesTitleRow}><Text style={[styles.notesInfoIcon, { color: theme.colors.tertiary }]}>i</Text><Text style={[styles.notesTitle, { color: theme.colors.tertiary }]}>Important Notes</Text></View>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Transfers are instant and cannot be cancelled.</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Anyone can transfer Diamonds using a valid public ID.</Text>
            <Text style={[styles.notesText, { color: theme.text.secondary }]}>• Please verify the recipient&apos;s public ID before sending.</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </Screen>;
}

function TransactionHistoryTab({ transactions, onBack }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const history = (transactions.length > 0 ? transactions : []).filter(item => {
    if (categoryFilter !== 'all' && getTransactionCategory(item) !== categoryFilter) return false;
    if (dateFilter === 'all') return true;
    const date = new Date(item.createdAt);
    if (Number.isNaN(date.getTime())) return false;
    const now = Date.now();
    if (dateFilter === 'today') return date.toDateString() === new Date().toDateString();
    if (dateFilter === 'week') return date.getTime() >= now - 7 * 24 * 60 * 60 * 1000;
    return date.getTime() >= now - 30 * 24 * 60 * 60 * 1000;
  });
  const pageCount = Math.max(1, Math.ceil(history.length / 10));
  const currentPage = Math.min(page, pageCount);
  const firstVisiblePage = Math.min(Math.max(1, currentPage - 2), Math.max(1, pageCount - 4));
  const visiblePages = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstVisiblePage + index);
  const pageTransactions = history.slice((currentPage - 1) * 10, currentPage * 10);
  const groups = pageTransactions.reduce((result, item) => {
    const key = new Date(item.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {});
  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={styles.background} resizeMode="cover">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.withdrawContent, { paddingTop: insets.top + scaleModerate(14), paddingBottom: scaleModerate(84) }]}>
          <View style={styles.withdrawHeader}>
            <Pressable onPress={onBack} hitSlop={10}><Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text></Pressable>
            <Text style={[styles.withdrawHeaderTitle, { color: theme.text.primary }]}>Transactions</Text>
            <Pressable onPress={() => setFilterVisible(true)} style={[styles.filterButton, { borderColor: hexToRgba(theme.colors.tertiary, 0.65) }]}><Text style={[styles.filterButtonText, { color: theme.colors.tertiary }]}>Filter</Text></Pressable>
          </View>
          {Object.keys(groups).length > 0 ? Object.entries(groups).map(([date, entries]) => <View key={date} style={styles.historyGroup}>
              <Text style={[styles.historyDate, { color: theme.text.secondary }]}>{date}</Text>
              <View style={[styles.historyCard, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.5) }]}>
                {entries.map(item => <TransactionRow key={item.id} item={item} />)}
              </View>
            </View>) : <View style={[styles.historyCard, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.5) }]}><Text style={[styles.emptyTxText, { color: theme.text.secondary }]}>No transactions yet.</Text></View>}
        </ScrollView>
        {history.length > 0 ? <View style={[styles.pagination, styles.transactionPaginationFixed]}>
            <Pressable disabled={currentPage === 1} onPress={() => setPage(currentPage - 1)}><Text style={[styles.paginationPage, { color: currentPage === 1 ? theme.text.mutedIcon : theme.text.secondary }]}>‹</Text></Pressable>
            {visiblePages.map(pageNumber => <Pressable key={pageNumber} onPress={() => setPage(pageNumber)}><Text style={[pageNumber === currentPage ? styles.paginationActive : styles.paginationPage, pageNumber === currentPage ? { backgroundColor: theme.colors.secondary } : { color: theme.text.secondary }]}>{pageNumber}</Text></Pressable>)}
            {pageCount > 5 ? <Text style={[styles.paginationPage, { color: theme.text.secondary }]}>…</Text> : null}
            <Pressable disabled={currentPage === pageCount} onPress={() => setPage(currentPage + 1)}><Text style={[styles.paginationPage, { color: currentPage === pageCount ? theme.text.mutedIcon : theme.text.secondary }]}>›</Text></Pressable>
          </View> : null}
      </ImageBackground>
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={styles.filterModalBackdrop} onPress={() => setFilterVisible(false)}>
          <Pressable style={[styles.filterModalCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]} onPress={() => {}}>
            <View style={styles.filterModalHeader}><Text style={[styles.filterModalTitle, { color: theme.text.primary }]}>Filter Transactions</Text><Pressable onPress={() => { setCategoryFilter('all'); setDateFilter('all'); }}><Text style={[styles.filterReset, { color: theme.colors.tertiary }]}>Reset</Text></Pressable></View>
            <Text style={[styles.filterSectionTitle, { color: theme.text.secondary }]}>Category</Text>
            <View style={styles.filterOptions}>{[{ id: 'all', label: 'All' }, { id: 'purchase', label: 'Purchase' }, { id: 'withdraw', label: 'Withdraw' }, { id: 'send', label: 'Send' }, { id: 'admin_added', label: 'Add' }].map(option => { const active = categoryFilter === option.id; const chipBackground = active ? hexToRgba(theme.colors.tertiary, 0.18) : 'transparent'; return <Pressable key={option.id} onPress={() => setCategoryFilter(option.id)} style={[styles.filterChip, { borderColor: active ? theme.colors.tertiary : theme.colors.cardBorder, backgroundColor: chipBackground }]}><Text style={[styles.filterChipText, { color: active ? theme.colors.tertiary : theme.text.primary }]}>{option.label}</Text></Pressable>; })}</View>
            <Text style={[styles.filterSectionTitle, { color: theme.text.secondary }]}>Date</Text>
            <View style={styles.filterOptions}>{[{ id: 'all', label: 'Any date' }, { id: 'today', label: 'Today' }, { id: 'week', label: 'Last 7 days' }, { id: 'month', label: 'Last 30 days' }].map(option => { const active = dateFilter === option.id; const chipBackground = active ? hexToRgba(theme.colors.teal700, 0.18) : 'transparent'; return <Pressable key={option.id} onPress={() => setDateFilter(option.id)} style={[styles.filterChip, { borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder, backgroundColor: chipBackground }]}><Text style={[styles.filterChipText, { color: active ? theme.colors.teal700 : theme.text.primary }]}>{option.label}</Text></Pressable>; })}</View>
            <Pressable onPress={() => setFilterVisible(false)} style={[styles.filterApplyButton, { backgroundColor: theme.colors.tertiary }]}><Text style={styles.filterApplyText}>Apply Filters</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>;
}

function MyQrCodeTab({ user, onBack }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const publicId = user?.publicId ?? user?.displayId ?? '';
  const qrPayload = JSON.stringify({ type: 'streamline_user', publicId });
  const handleShare = async () => {
    try {
      await Share.share({ title: 'My Streamline ID', message: `My Streamline ID is ${publicId}. Scan my QR code in Streamline or use this ID to send Diamonds.` });
    } catch {
      showAlert('Unable to share', 'Please try again.');
    }
  };
  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={styles.background} resizeMode="cover">
        <ScrollView contentContainerStyle={[styles.qrContent, { paddingTop: insets.top + scaleModerate(14) }]} showsVerticalScrollIndicator={false}>
          <View style={styles.withdrawHeader}>
            <Pressable onPress={onBack} hitSlop={10}><Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text></Pressable>
            <Text style={[styles.withdrawHeaderTitle, { color: theme.text.primary }]}>My QR Code</Text>
            <View style={styles.withdrawHeaderSpacer} />
          </View>
          <GlassPanel style={[styles.qrCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.56) }]}>
            <Avatar value={user?.profileImage} fullName={user?.fullName ?? 'Streamline User'} size={scaleModerate(68)} />
            <Text style={[styles.qrName, { color: theme.text.primary }]}>{user?.fullName ?? 'Streamline User'}</Text>
            <Text style={[styles.qrIdLabel, { color: theme.text.secondary }]}>Public ID</Text>
            <Text style={[styles.qrPublicId, { color: theme.colors.teal700 }]}>{publicId || 'Not available'}</Text>
            {publicId ? <View style={styles.qrCodePanel}><QRCode value={qrPayload} size={scaleModerate(190)} color="#07101B" backgroundColor="#FFFFFF" /></View> : null}
            <Text style={[styles.qrHint, { color: theme.text.secondary }]}>Share this QR code or Public ID with an agent to receive Diamonds.</Text>
            <Pressable disabled={!publicId} onPress={handleShare} style={[styles.qrShareButton, { backgroundColor: publicId ? theme.colors.tertiary : theme.colors.mutedIcon }]}><Text style={styles.qrShareButtonText}>Share My ID</Text></Pressable>
          </GlassPanel>
        </ScrollView>
      </ImageBackground>
    </Screen>;
}

export function MyWalletScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sessionToken = useAppStore(state => state.session?.token);
  const sessionUser = useAppStore(state => state.session?.user);
  const [wallet, setWallet] = React.useState(null);
  const [packages, setPackages] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('wallet');

  const loadWallet = React.useCallback(() => {
    if (!sessionToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchWallet(sessionToken),
      fetchCoinPackages(sessionToken).catch(() => ({ packages: [] })),
      fetchWalletTransactions(sessionToken, { limit: 100 }).catch(() => ({ transactions: [] }))
    ])
      .then(([walletData, packagesData, transactionsData]) => {
        setWallet(walletData);
        setPackages(packagesData.packages ?? []);
        setTransactions(transactionsData.transactions ?? []);
      })
      .catch(() => {
        setWallet(null);
        setPackages([]);
        setTransactions([]);
      })
      .finally(() => setLoading(false));
  }, [sessionToken]);

  useFocusEffect(React.useCallback(() => {
    loadWallet();
  }, [loadWallet]));

  const balance = Number(wallet?.coins ?? 0);
  const diamonds = Number(wallet?.diamonds ?? 0);
  const coupons = Number(wallet?.coupons ?? 0);
  const userRoles = [sessionUser?.role, ...(sessionUser?.roles ?? [])].filter(Boolean).map(role => String(role).toLowerCase());
  const isCoinReseller = userRoles.includes('coin_reseller') || userRoles.includes('reseller');
  const canWithdraw = userRoles.some(role => role !== 'user');

  const handleComingSoon = label => {
    showAlert('Coming Soon', `${label} isn't available yet — check back soon.`);
  };

  const handleWalletAction = action => {
    if (action.key === 'withdraw' && !canWithdraw) {
      showAlert('Restricted feature', 'Withdraw is not available for standard user accounts.');
      return;
    }
    if (['withdraw', 'transfer', 'transaction'].includes(action.key)) {
      setActiveTab(action.key);
      return;
    }
    handleComingSoon(action.label);
  };

  if (activeTab === 'withdraw') {
    return <WithdrawTab onBack={() => setActiveTab('wallet')} />;
  }

  if (activeTab === 'transfer') {
    return <TransferTab onBack={() => setActiveTab('wallet')} onOpenQr={() => setActiveTab('qr')} />;
  }

  if (activeTab === 'transaction') {
    return <TransactionHistoryTab transactions={transactions} onBack={() => setActiveTab('wallet')} />;
  }

  if (activeTab === 'qr') {
    return <MyQrCodeTab user={sessionUser} onBack={() => setActiveTab('transfer')} />;
  }

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={styles.background} resizeMode="cover">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + scaleModerate(14) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>👛 My Wallet</Text>
          <Pressable style={[styles.historyButton, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]} onPress={() => handleComingSoon('History')}>
            <Text style={[styles.historyButtonText, { color: theme.colors.tertiary }]}>History</Text>
          </Pressable>
        </View>

        <GlassPanel style={[styles.heroCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}>
          <View style={styles.heroLeft}>
            <View style={styles.heroLabelRow}>
              <Text style={[styles.heroLabel, { color: theme.text.secondary }]}>Total Balance</Text>
              <Text style={styles.heroEyeIcon}>👁️</Text>
            </View>
            <GradientText style={styles.heroBalance}>{loading ? '...' : diamonds.toLocaleString()}</GradientText>
            <Text style={[styles.heroCoinsLabel, { color: theme.colors.vipGoldText }]}>Diamonds</Text>

            <View style={[styles.heroDivider, { backgroundColor: theme.colors.cardBorder }]} />

            <View style={styles.heroSubRow}>
              <View style={styles.heroSubItem}>
                <Text style={[styles.heroSubValue, { color: theme.text.primary }]}>{balance.toLocaleString()}</Text>
                <Text style={[styles.heroSubLabel, { color: theme.text.secondary }]}>Coins</Text>
              </View>
              <View style={styles.heroSubItem}>
                <Text style={[styles.heroSubValue, { color: theme.text.primary }]}>🎟️ {coupons}</Text>
                <Text style={[styles.heroSubLabel, { color: theme.text.secondary }]}>Coupons</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroIllustration}>
            <Image source={walletImage} style={styles.heroWalletImage} resizeMode="contain" />
          </View>
        </GlassPanel>

        <View style={[styles.actionsRow, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.55) }]}>
          {ACTIONS.filter(action => action.key !== 'topup' || isCoinReseller).map(action => <ActionButton key={action.key} action={action} onPress={() => handleWalletAction(action)} />)}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Coins Packages</Text>
          <Pressable onPress={() => handleComingSoon('Coins Packages')}>
            <Text style={[styles.sectionLink, { color: theme.colors.tertiary }]}>View all ›</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesRow}>
          {packages.map(item => <CoinPackageCard key={item.id} item={item} onPress={() => handleComingSoon('Coins purchase')} />)}
        </ScrollView>

        <Pressable onPress={() => handleComingSoon('Coin-to-diamond exchange')}>
          <LinearGradient colors={[hexToRgba(theme.colors.tertiary, 0.35), hexToRgba(theme.colors.teal700, 0.2)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.diamondBanner, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]}>
            <View style={styles.diamondBannerText}>
              <Text style={[styles.diamondBannerTitle, { color: theme.text.primary }]}>Exchange Coins for Diamonds</Text>
              <Text style={[styles.diamondBannerSubtitle, { color: theme.text.secondary }]}>Convert earned coins into diamonds for withdrawals.</Text>
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
          {transactions.length > 0 ? (
            transactions.slice(0, 10).map(item => <TransactionRow key={item.id} item={item} />)
          ) : (
            <Text style={[styles.emptyTxText, { color: theme.text.secondary }]}>{loading ? 'Loading...' : 'No transactions yet.'}</Text>
          )}
        </GlassPanel>
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
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(8)
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
  balanceGradientPink: {
    color: '#FF4DA3'
  },
  balanceGradientPurple: {
    color: '#A855F7'
  },
  balanceGradientBlue: {
    color: '#00CFFF'
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
    width: scaleModerate(150),
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroWalletImage: {
    width: '100%',
    height: scaleModerate(140)
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
  },
  emptyTxText: {
    paddingVertical: scaleModerate(16),
    textAlign: 'center',
    fontSize: scaleFont(11.5)
  },
  withdrawContent: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(32)
  },
  withdrawHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(24)
  },
  withdrawHeaderTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  withdrawHeaderSpacer: {
    width: scaleModerate(24)
  },
  transferQrButton: {
    borderWidth: 1,
    borderRadius: scaleModerate(8),
    paddingHorizontal: scaleModerate(9),
    paddingVertical: scaleModerate(6)
  },
  transferQrButtonText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  withdrawLabel: {
    fontSize: scaleFont(12),
    fontWeight: '800',
    marginBottom: scaleModerate(8)
  },
  amountInputWrap: {
    height: scaleModerate(48),
    borderWidth: 1,
    borderRadius: scaleModerate(9),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(10)
  },
  amountCoinIcon: {
    color: '#FFB21A',
    fontSize: scaleFont(21),
    marginRight: scaleModerate(9)
  },
  amountInput: {
    flex: 1,
    height: '100%',
    fontSize: scaleFont(12),
    paddingVertical: 0
  },
  amountUnit: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: scaleModerate(7),
    marginTop: scaleModerate(11)
  },
  quickAmount: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(8),
    paddingVertical: scaleModerate(7)
  },
  quickAmountText: {
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  withdrawSummary: {
    marginTop: scaleModerate(17),
    borderWidth: 1,
    borderRadius: scaleModerate(10),
    padding: scaleModerate(13)
  },
  summaryLabel: {
    fontSize: scaleFont(10.5)
  },
  summaryAmount: {
    marginTop: scaleModerate(5),
    fontSize: scaleFont(22),
    fontWeight: '900'
  },
  summaryCurrency: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  summaryRate: {
    marginTop: scaleModerate(7),
    fontSize: scaleFont(9.5)
  },
  withdrawMethodLabel: {
    marginTop: scaleModerate(21)
  },
  withdrawMethod: {
    height: scaleModerate(47),
    borderWidth: 1,
    borderRadius: scaleModerate(9),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleModerate(11)
  },
  bankIcon: {
    fontSize: scaleFont(18),
    marginRight: scaleModerate(11)
  },
  bankLabel: {
    flex: 1,
    fontSize: scaleFont(11.5),
    fontWeight: '700'
  },
  bankChevron: {
    fontSize: scaleFont(19),
    fontWeight: '700'
  },
  withdrawNotes: {
    marginTop: scaleModerate(16),
    borderWidth: 1,
    borderRadius: scaleModerate(10),
    padding: scaleModerate(13)
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    marginBottom: scaleModerate(10)
  },
  notesInfoIcon: {
    width: scaleModerate(15),
    height: scaleModerate(15),
    borderWidth: 1,
    borderColor: '#FF4DA3',
    borderRadius: scaleModerate(8),
    textAlign: 'center',
    fontSize: scaleFont(10),
    fontWeight: '900',
    lineHeight: scaleModerate(14)
  },
  notesTitle: {
    fontSize: scaleFont(11.5),
    fontWeight: '800'
  },
  notesText: {
    fontSize: scaleFont(9.5),
    lineHeight: scaleFont(18)
  },
  recipientIcon: {
    fontSize: scaleFont(17),
    marginRight: scaleModerate(9)
  },
  scanIcon: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  fieldHint: {
    marginTop: scaleModerate(5),
    fontSize: scaleFont(8.5)
  },
  transferAmountLabel: {
    marginTop: scaleModerate(17)
  },
  transferSummary: {
    marginTop: scaleModerate(17),
    borderWidth: 1,
    borderRadius: scaleModerate(10),
    padding: scaleModerate(13),
    gap: scaleModerate(10)
  },
  transferSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  transferSummaryValue: {
    fontSize: scaleFont(10.5),
    fontWeight: '800'
  },
  totalDeduction: {
    fontSize: scaleFont(11),
    fontWeight: '900'
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: scaleModerate(8),
    paddingHorizontal: scaleModerate(9),
    paddingVertical: scaleModerate(6)
  },
  filterButtonText: {
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  historyGroup: {
    marginBottom: scaleModerate(17)
  },
  historyDate: {
    fontSize: scaleFont(10.5),
    fontWeight: '700',
    marginBottom: scaleModerate(7)
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: scaleModerate(11),
    overflow: 'hidden',
    paddingHorizontal: scaleModerate(11)
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(17),
    marginTop: scaleModerate(2),
    marginBottom: scaleModerate(12)
  },
  paginationActive: {
    color: '#FFFFFF',
    width: scaleModerate(28),
    height: scaleModerate(28),
    borderRadius: scaleModerate(7),
    textAlign: 'center',
    fontSize: scaleFont(13),
    fontWeight: '800',
    lineHeight: scaleModerate(28)
  },
  paginationPage: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  transactionPaginationFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: scaleModerate(14),
    marginTop: 0,
    marginBottom: 0
  },
  filterModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.64)',
    padding: scaleModerate(16)
  },
  filterModalCard: {
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(18)
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleModerate(18)
  },
  filterModalTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  filterReset: {
    fontSize: scaleFont(11),
    fontWeight: '800'
  },
  filterSectionTitle: {
    fontSize: scaleFont(11),
    fontWeight: '800',
    marginBottom: scaleModerate(9)
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleModerate(8),
    marginBottom: scaleModerate(18)
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: scaleModerate(8),
    paddingHorizontal: scaleModerate(11),
    paddingVertical: scaleModerate(8)
  },
  filterChipText: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  filterApplyButton: {
    alignItems: 'center',
    borderRadius: scaleModerate(9),
    paddingVertical: scaleModerate(12)
  },
  filterApplyText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  qrContent: {
    flexGrow: 1,
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(32)
  },
  qrCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(22)
  },
  qrName: {
    marginTop: scaleModerate(11),
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  qrIdLabel: {
    marginTop: scaleModerate(12),
    fontSize: scaleFont(10)
  },
  qrPublicId: {
    marginTop: scaleModerate(3),
    fontSize: scaleFont(14),
    fontWeight: '900'
  },
  qrCodePanel: {
    marginTop: scaleModerate(18),
    padding: scaleModerate(12),
    borderRadius: scaleModerate(12),
    backgroundColor: '#FFFFFF'
  },
  qrHint: {
    marginTop: scaleModerate(17),
    fontSize: scaleFont(11),
    lineHeight: scaleFont(17),
    textAlign: 'center'
  },
  qrShareButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: scaleModerate(10),
    paddingVertical: scaleModerate(12),
    marginTop: scaleModerate(19)
  },
  qrShareButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '800'
  }
});

export default MyWalletScreen;
