import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { profileBackgroundImage } from '../../assets';
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
        colors={[hexToRgba(theme.colors.neutral900, 0.5), hexToRgba(theme.colors.neutral900, 0.2)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>;
}

const QUICK_HELP = [
  { key: 'faqs', emoji: '💬', label: 'FAQs', color: '#FF4DA3' },
  { key: 'guides', emoji: '📄', label: 'Guides', color: '#7000FF' },
  { key: 'safety', emoji: '🛡️', label: 'Safety Tips', color: '#00F2FF' },
  { key: 'report', emoji: '❗', label: 'Report Issue', color: '#FF4DA3' }
];

const IMPORTANT_LINKS = [
  { key: 'terms', emoji: '📜', title: 'Terms & Conditions', subtitle: 'Read our terms and conditions', color: '#FF4DA3' },
  { key: 'privacy', emoji: '🔒', title: 'Privacy Policy', subtitle: 'Learn how we protect your data', color: '#00F2FF' },
  { key: 'community', emoji: '📋', title: 'Community Guidelines', subtitle: 'Rules for a safe and fun community', color: '#7000FF' },
  { key: 'refund', emoji: '🔐', title: 'Refund & Cancellation Policy', subtitle: 'Learn about refunds and cancellations', color: '#FF4DA3' }
];

const CUSTOMER_ID = 'STRM123456';
const ROOM_ID = '987654321';
const SUPPORT_EMAIL = 'support@streamline.live';
const SUPPORT_PHONE = '+1 (800) 123-4567';

function QuickHelpTile({ item, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.quickTile, { borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.quickIcon, { backgroundColor: hexToRgba(item.color, 0.14), borderColor: hexToRgba(item.color, 0.4) }]}>
        <Text style={styles.quickEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.quickLabel, { color: theme.text.primary }]} numberOfLines={1}>{item.label}</Text>
    </Pressable>;
}

function LinkRow({ item, onPress, showDivider }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.linkRow, showDivider ? { borderTopColor: theme.colors.cardBorder, borderTopWidth: StyleSheet.hairlineWidth } : null]}>
      <View style={[styles.linkIcon, { backgroundColor: hexToRgba(item.color, 0.14), borderColor: hexToRgba(item.color, 0.4) }]}>
        <Text style={styles.linkEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.linkTextWrap}>
        <Text style={[styles.linkTitle, { color: theme.text.primary }]}>{item.title}</Text>
        <Text style={[styles.linkSubtitle, { color: theme.text.secondary }]} numberOfLines={1}>{item.subtitle}</Text>
      </View>
      <Text style={[styles.linkChevron, { color: theme.text.secondary }]}>›</Text>
    </Pressable>;
}

function ContactRow({ emoji, color, title, value, actionLabel, onPress, showDivider }) {
  const theme = useTheme();
  return <View style={[styles.contactRow, showDivider ? { borderTopColor: theme.colors.cardBorder, borderTopWidth: StyleSheet.hairlineWidth } : null]}>
      <View style={[styles.linkIcon, { backgroundColor: hexToRgba(color, 0.14), borderColor: hexToRgba(color, 0.4) }]}>
        <Text style={styles.linkEmoji}>{emoji}</Text>
      </View>
      <View style={styles.linkTextWrap}>
        <Text style={[styles.linkTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.contactValue, { color }]} numberOfLines={1}>{value}</Text>
      </View>
      <Pressable onPress={onPress} style={[styles.contactButton, { borderColor: color }]}>
        <Text style={[styles.contactButtonText, { color }]}>{actionLabel}</Text>
      </Pressable>
    </View>;
}

function CopyableRow({ label, value, showDivider }) {
  const theme = useTheme();
  return <View style={[styles.copyRow, showDivider ? { borderTopColor: hexToRgba(theme.colors.cardBorder, 0.5), borderTopWidth: StyleSheet.hairlineWidth } : null]}>
      <View>
        <Text style={[styles.copyLabel, { color: theme.text.primary }]}>{label}</Text>
        <Text style={[styles.copyValue, { color: theme.text.secondary }]}>{value}</Text>
      </View>
      <Pressable onPress={() => showAlert('Copied', `${label} copied to clipboard.`)} style={[styles.copyButton, { borderColor: theme.colors.cardBorder }]}>
        <Text style={styles.copyButtonGlyph}>⧉</Text>
      </Pressable>
    </View>;
}

export function HelpCentreScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleComingSoon = label => {
    showAlert('Coming Soon', `${label} isn't available yet — check back soon.`);
  };

  return <Screen transparent>
      <ImageBackground source={profileBackgroundImage} style={[styles.background, { paddingTop: insets.top }]} resizeMode="cover">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: theme.colors.cardBorder }]} hitSlop={10}>
              <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerEmoji}>🎧</Text>
              <Text style={[styles.headerTitle, { color: theme.colors.teal700 }]}>Help <Text style={{ color: theme.colors.secondary }}>Centre</Text></Text>
              <Text style={[styles.headerSubtitle, { color: theme.text.secondary }]}>We're here to help you!</Text>
            </View>
            <Pressable style={[styles.helpButton, { borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.helpButtonText, { color: theme.text.primary }]}>?</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => handleComingSoon('Search')} style={[styles.searchBar, { borderColor: theme.colors.cardBorder, backgroundColor: hexToRgba(theme.colors.neutral900, 0.5) }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={[styles.searchPlaceholder, { color: theme.text.secondary }]}>Search for help articles...</Text>
          </Pressable>

          <GlassPanel style={[styles.card, { borderColor: hexToRgba(theme.colors.tertiary, 0.4) }]}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>How can we help you?</Text>
            <View style={styles.quickGrid}>
              {QUICK_HELP.map(item => <QuickHelpTile key={item.key} item={item} onPress={() => handleComingSoon(item.label)} />)}
            </View>
          </GlassPanel>

          <Text style={[styles.groupTitle, { color: theme.text.primary }]}>Important Links</Text>
          <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
            {IMPORTANT_LINKS.map((item, index) => <LinkRow key={item.key} item={item} showDivider={index > 0} onPress={() => handleComingSoon(item.title)} />)}
          </GlassPanel>

          <Text style={[styles.groupTitle, { color: theme.text.primary }]}>Contact Us</Text>
          <GlassPanel style={[styles.card, { borderColor: theme.colors.cardBorder }]}>
            <ContactRow emoji="✉️" color={theme.colors.teal200} title="Email Support" value={SUPPORT_EMAIL} actionLabel="✈️ Send Email" onPress={() => handleComingSoon('Email Support')} />
            <ContactRow emoji="📞" color={theme.colors.secondary} title="Customer Support Number" value={SUPPORT_PHONE} actionLabel="📞 Call Now" onPress={() => handleComingSoon('Customer Support Number')} showDivider />
            <ContactRow emoji="💬" color={theme.colors.tertiary} title="Live Chat" value="Chat with our support team" actionLabel="💬 Start Chat" onPress={() => handleComingSoon('Live Chat')} showDivider />
          </GlassPanel>

          <Text style={[styles.groupTitle, { color: theme.text.primary }]}>Your Support Info</Text>
          <GlassPanel style={[styles.card, { borderColor: hexToRgba(theme.colors.teal700, 0.4) }]}>
            <CopyableRow label="Customer ID" value={CUSTOMER_ID} />
            <CopyableRow label="Room ID" value={ROOM_ID} showDivider />
            <View style={styles.supportHintRow}>
              <Text style={styles.supportHintIcon}>⬥</Text>
              <Text style={[styles.supportHintText, { color: theme.text.secondary }]}>Share your Customer ID and Room ID with our support team to help us assist you faster.</Text>
            </View>
          </GlassPanel>

          <LinearGradient colors={[hexToRgba(theme.colors.tertiary, 0.22), hexToRgba(theme.colors.teal700, 0.16)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.ctaCard, { borderColor: hexToRgba(theme.colors.tertiary, 0.5) }]}>
            <Text style={styles.ctaEmoji}>🎧</Text>
            <View style={styles.ctaTextWrap}>
              <Text style={[styles.ctaTitle, { color: theme.text.primary }]}>Still need help?</Text>
              <Text style={[styles.ctaSubtitle, { color: theme.text.secondary }]}>Our support team is available <Text style={[styles.ctaSubtitleBold, { color: theme.colors.secondary }]}>24/7</Text></Text>
            </View>
            <Pressable onPress={() => handleComingSoon('Support request')}>
              <LinearGradient colors={[theme.colors.teal700, theme.colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Submit a Request ›</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
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
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(28)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleModerate(16)
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
  headerEmoji: {
    fontSize: scaleFont(22)
  },
  headerTitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(20),
    fontWeight: '900'
  },
  headerSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
  },
  helpButton: {
    width: scaleModerate(36),
    height: scaleModerate(36),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8),
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    marginBottom: scaleModerate(14)
  },
  searchIcon: {
    fontSize: scaleFont(14)
  },
  searchPlaceholder: {
    fontSize: scaleFont(12.5)
  },
  card: {
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    overflow: 'hidden',
    padding: scaleModerate(14),
    marginBottom: scaleModerate(6)
  },
  sectionTitle: {
    fontSize: scaleFont(13.5),
    fontWeight: '800',
    marginBottom: scaleModerate(12)
  },
  groupTitle: {
    fontSize: scaleFont(13),
    fontWeight: '800',
    marginTop: scaleModerate(16),
    marginBottom: scaleModerate(8)
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickTile: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    marginHorizontal: scaleModerate(3)
  },
  quickIcon: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(8)
  },
  quickEmoji: {
    fontSize: scaleFont(17)
  },
  quickLabel: {
    fontSize: scaleFont(10),
    fontWeight: '700',
    textAlign: 'center'
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(12)
  },
  linkIcon: {
    width: scaleModerate(38),
    height: scaleModerate(38),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  linkEmoji: {
    fontSize: scaleFont(16)
  },
  linkTextWrap: {
    flex: 1
  },
  linkTitle: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  linkSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10)
  },
  linkChevron: {
    fontSize: scaleFont(18),
    fontWeight: '700'
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(12)
  },
  contactValue: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  },
  contactButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(7)
  },
  contactButtonText: {
    fontSize: scaleFont(10.5),
    fontWeight: '800'
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scaleModerate(10)
  },
  copyLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  copyValue: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
  },
  copyButton: {
    width: scaleModerate(32),
    height: scaleModerate(32),
    borderRadius: scaleModerate(10),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyButtonGlyph: {
    fontSize: scaleFont(14),
    color: '#FFFFFF'
  },
  supportHintRow: {
    flexDirection: 'row',
    gap: scaleModerate(8),
    marginTop: scaleModerate(10),
    paddingTop: scaleModerate(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  supportHintIcon: {
    fontSize: scaleFont(12)
  },
  supportHintText: {
    flex: 1,
    fontSize: scaleFont(10.5),
    lineHeight: scaleFont(15)
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    borderWidth: 1,
    borderRadius: scaleModerate(18),
    padding: scaleModerate(14),
    marginTop: scaleModerate(16)
  },
  ctaEmoji: {
    fontSize: scaleFont(24)
  },
  ctaTextWrap: {
    flex: 1
  },
  ctaTitle: {
    fontSize: scaleFont(13.5),
    fontWeight: '800'
  },
  ctaSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5)
  },
  ctaSubtitleBold: {
    fontWeight: '800'
  },
  ctaButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(9)
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(11),
    fontWeight: '800'
  }
});

export default HelpCentreScreen;
