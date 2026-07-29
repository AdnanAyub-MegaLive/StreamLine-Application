import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MessageIcon } from '../../assets';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { useAssignedFrame } from '../../hooks';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

// Someone else's public profile — opened by tapping a seated participant's
// avatar in a room. Distinct from ProfileScreen (the signed-in user's own
// "Services & Tools" profile): this is the read-only card + Badge Wall /
// Gift Wall / Chat-Follow-Gift layout from the approved viewer-profile
// mockup. Badge/gift/stat data has no backend yet — placeholders/zeros
// until those endpoints exist, same convention as the rest of the app.
const PLACEHOLDER_STATS = [
  { key: 'likes', label: 'Likes', value: '0' },
  { key: 'fans', label: 'Fans', value: '0' },
  { key: 'sent', label: 'Sent', value: '0' },
  { key: 'received', label: 'Received', value: '0' }
];

const BADGE_PLACEHOLDER_COUNT = 4;
const GIFT_PLACEHOLDER_COUNT = 4;

function StatItem({ label, value }) {
  const theme = useTheme();
  return <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}</Text>
    </View>;
}

function Chip({ label, background, color }) {
  return <View style={[styles.chip, { backgroundColor: background }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>;
}

function SectionCard({ title, children }) {
  const theme = useTheme();
  return <View style={[styles.sectionCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.sectionViewAll, { color: theme.text.secondary }]}>View All ›</Text>
      </View>
      {children}
    </View>;
}

export function UserProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, userAvatar } = route.params ?? {};
  const displayName = userName || 'User';
  // There's no backend endpoint to fetch another user's assigned frame —
  // only shown when this happens to be a look at your own profile (e.g.
  // tapping your own seat in the demo room).
  const session = useAppStore(state => state.session);
  const isOwnProfile = Boolean(userId) && userId === (session?.user?.displayId || session?.user?.publicId);
  const ownFrameUri = useAssignedFrame();
  const frameUri = isOwnProfile ? ownFrameUri : null;

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          <View style={frameUri ? undefined : [styles.avatarRing, { borderColor: theme.colors.teal200 }]}>
            <Avatar value={userAvatar} fullName={displayName} size={scaleModerate(84)} frameUri={frameUri} />
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text.primary }]}>{displayName}</Text>
            <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.teal700 }]}>
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          </View>
          {userId ? <Text style={[styles.idText, { color: theme.text.secondary }]}>ID: {userId}</Text> : null}

          <View style={styles.chipRow}>
            <Chip label="⚡ 1" background={theme.colors.teal50} color={theme.colors.teal700} />
            <Chip label="👑 VIP 0" background={theme.colors.vipGoldBackground} color={theme.colors.vipGoldText} />
            <Chip label="🎮 Pro Gamer" background={theme.colors.proGamerBackground} color={theme.colors.vipPurple} />
          </View>

          <View style={[styles.statsRow, { borderTopColor: theme.colors.cardBorder }]}>
            {PLACEHOLDER_STATS.map(stat => <StatItem key={stat.key} label={stat.label} value={stat.value} />)}
          </View>
        </View>

        <SectionCard title="Badge Wall">
          <View style={styles.tileRow}>
            {Array.from({ length: BADGE_PLACEHOLDER_COUNT }).map((item, index) => <View key={index} style={[styles.badgeTile, { backgroundColor: theme.colors.teal50 }]}>
                <Text style={styles.badgeEmoji}>🏆</Text>
              </View>)}
          </View>
        </SectionCard>

        <SectionCard title="Gift Wall">
          <View style={styles.tileRow}>
            {Array.from({ length: GIFT_PLACEHOLDER_COUNT }).map((item, index) => <View key={index} style={[styles.giftTile, {
              borderColor: theme.colors.cardBorder,
              backgroundColor: theme.surfaces.card
            }]}>
                <Text style={styles.giftEmoji}>🎁</Text>
                <Text style={[styles.giftCount, { color: theme.text.secondary }]}>x0</Text>
              </View>)}
          </View>
        </SectionCard>
      </ScrollView>

      <View style={[styles.actionBar, { borderTopColor: theme.colors.cardBorder }]}>
        <Pressable style={[styles.chatButton, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
          <MessageIcon size={18} color={theme.text.primary} />
          <Text style={[styles.chatButtonText, { color: theme.text.primary }]}>Chat</Text>
        </Pressable>
        <Pressable style={[styles.followButton, { backgroundColor: theme.colors.followOrange }]}>
          <Text style={styles.followButtonText}>+ Follow</Text>
        </Pressable>
        <Pressable style={[styles.giftButton, { backgroundColor: theme.colors.giftAccent }]}>
          <Text style={styles.giftButtonEmoji}>🎁</Text>
        </Pressable>
      </View>
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  scrollContent: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(24)
  },
  profileCard: {
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: scaleModerate(20),
    paddingBottom: scaleModerate(4),
    paddingHorizontal: scaleModerate(16),
    marginTop: scaleModerate(16)
  },
  avatarRing: {
    borderWidth: 3,
    borderRadius: 999,
    padding: scaleModerate(3)
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6),
    marginTop: scaleModerate(10)
  },
  name: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  verifiedBadge: {
    width: scaleModerate(16),
    height: scaleModerate(16),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifiedTick: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  idText: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  chipRow: {
    flexDirection: 'row',
    gap: scaleModerate(8),
    marginTop: scaleModerate(12)
  },
  chip: {
    paddingHorizontal: scaleModerate(10),
    paddingVertical: scaleModerate(4),
    borderRadius: 999
  },
  chipText: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: scaleModerate(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: scaleModerate(12)
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
  sectionCard: {
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    marginTop: scaleModerate(14),
    padding: scaleModerate(14)
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(12)
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  sectionViewAll: {
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  tileRow: {
    flexDirection: 'row',
    gap: scaleModerate(10)
  },
  badgeTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: scaleModerate(12),
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeEmoji: {
    fontSize: scaleFont(20)
  },
  giftTile: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(4)
  },
  giftEmoji: {
    fontSize: scaleFont(20)
  },
  giftCount: {
    fontSize: scaleFont(10),
    fontWeight: '700'
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(10),
    borderTopWidth: StyleSheet.hairlineWidth
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(6),
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: scaleModerate(12),
    flex: 1
  },
  chatButtonText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  followButton: {
    flex: 1.4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleModerate(12)
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  giftButton: {
    width: scaleModerate(46),
    height: scaleModerate(46),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  giftButtonEmoji: {
    fontSize: scaleFont(18)
  }
});

export default UserProfileScreen;
