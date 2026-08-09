import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen, VerifiedTick } from '../../components';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';

function personPhotoForIndex(index) {
  return `https://i.pravatar.cc/300?img=${(index % 70) + 1}`;
}

const DUMMY_OFFICIALS = [
  { publicId: 'obaidzafar', name: 'Obaid Zafar', title: 'Founder', photo: personPhotoForIndex(11) },
  { publicId: 'streamline.support', name: 'Streamline Support', title: 'Official Support', photo: personPhotoForIndex(5) },
  { publicId: 'streamline.news', name: 'Streamline News', title: 'Official Updates', photo: personPhotoForIndex(8) },
  { publicId: 'ayeshakhan', name: 'Ayesha Khan', title: 'Community Manager', photo: personPhotoForIndex(15) },
  { publicId: 'bilalr', name: 'Bilal R.', title: 'Events Team', photo: personPhotoForIndex(12) },
  { publicId: 'vibequeen', name: 'VibeQueen', title: 'Top Host', photo: personPhotoForIndex(19) }
];

function OfficialRow({ user, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.row, { borderColor: theme.colors.cardBorder }]}>
      <Avatar value={user.photo} fullName={user.name} size={scaleModerate(46)} />
      <View style={styles.rowBody}>
        <View style={styles.rowNameLine}>
          <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{user.name}</Text>
          <VerifiedTick size={13} />
        </View>
        <Text style={[styles.rowTitle, { color: theme.text.secondary }]} numberOfLines={1}>{user.title}</Text>
      </View>
      <View style={[styles.officialTag, { borderColor: theme.colors.secondary, backgroundColor: `${theme.colors.secondary}22` }]}>
        <Text style={[styles.officialTagText, { color: theme.colors.secondary }]}>🛡️ Official</Text>
      </View>
    </Pressable>;
}

export function OfficialsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const openProfile = user => {
    navigation.navigate(routes.userProfile, {
      userId: user.publicId,
      userName: user.name,
      userAvatar: user.photo,
      userIsOfficial: true
    });
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Officials</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={[styles.headerNote, { color: theme.text.secondary }]}>Verified accounts run by Streamline or trusted partners. You can view their profile, but friend requests aren't available for Official accounts.</Text>

      <FlatList
        data={DUMMY_OFFICIALS}
        keyExtractor={item => item.publicId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <OfficialRow user={item} onPress={() => openProfile(item)} />}
      />
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(17),
    fontWeight: '800'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  headerNote: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(10),
    fontSize: scaleFont(11.5),
    lineHeight: scaleModerate(16)
  },
  list: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    paddingVertical: scaleModerate(10),
    borderTopWidth: StyleSheet.hairlineWidth
  },
  rowBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  rowName: {
    flexShrink: 1,
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowTitle: {
    fontSize: scaleFont(11.5)
  },
  officialTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(4)
  },
  officialTagText: {
    fontSize: scaleFont(9.5),
    fontWeight: '700'
  }
});

export default OfficialsScreen;
