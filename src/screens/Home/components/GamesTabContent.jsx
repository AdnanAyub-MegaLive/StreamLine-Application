import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TrophyIcon } from '../../../assets';
import { useTheme } from '../../../theme';
import { routes } from '../../../navigation/routes';
import { scaleFont, scaleModerate } from '../../../utils';

const FEATURED_GAMES = [
  { id: 'ludo', emoji: '🎲', tag: 'FEATURED', title: 'Mega Ludo', accent: 'teal700' },
  { id: 'domino', emoji: '🁫', tag: 'TRENDING', title: 'Gold Dominoes', accent: 'vipPurple' }
];

const CASUAL_GAMES = [
  { id: 'pool', emoji: '🎱', name: '8 Ball Pool', players: '2.4M Playing' },
  { id: 'uno', emoji: '🃏', name: 'UNO Party', players: '1.1M Playing' },
  { id: 'carrom', emoji: '⚪', name: 'Carrom Gold', players: '860K Playing' },
  { id: 'chess', emoji: '♟️', name: 'Chess Rush', players: '512K Playing' }
];

const CASUAL_GAMES_PREVIEW_COUNT = 3;

const TOURNAMENTS = [
  { id: 'weekend-ludo', title: 'Weekend Ludo Clash', endsInMs: 2 * 60 * 60 * 1000 + 45 * 60 * 1000 + 10 * 1000 },
  { id: 'pool-showdown', title: 'Pool Showdown', endsInMs: 5 * 60 * 60 * 1000 }
];

function formatCountdown(ms) {
  if (ms <= 0) {
    return '00:00:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(part => String(part).padStart(2, '0')).join(':');
}

function SectionHeader({ title, onSeeAll }) {
  const theme = useTheme();
  return <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{title}</Text>
      {onSeeAll ? <Pressable onPress={onSeeAll}>
          <Text style={[styles.sectionSeeAll, { color: theme.colors.teal700 }]}>See All ›</Text>
        </Pressable> : null}
    </View>;
}

function FeaturedCard({ item, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.featuredCard, { backgroundColor: theme.colors[item.accent] }]}>
      <View style={[styles.featuredTag, { backgroundColor: theme.surfaces.dark }]}>
        <Text style={[styles.featuredTagText, { color: theme.cta.primary.text }]}>{item.tag}</Text>
      </View>
      <Text style={styles.featuredEmoji}>{item.emoji}</Text>
      <Text style={[styles.featuredTitle, { color: theme.cta.primary.text }]} numberOfLines={1}>{item.title}</Text>
    </Pressable>;
}

function CasualGameCard({ item, onPress }) {
  const theme = useTheme();
  return <View style={[styles.gameCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.gameIcon, { backgroundColor: theme.colors.tealDarkBg }]}>
        <Text style={styles.gameEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.gameName, { color: theme.colors.facebookBlue }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.gamePlayers, { color: theme.text.secondary }]} numberOfLines={1}>{item.players}</Text>
      <Pressable onPress={onPress} style={[styles.playButton, { backgroundColor: theme.colors.teal700 }]}>
        <Text style={[styles.playButtonText, { color: theme.cta.primary.text }]}>Play</Text>
      </Pressable>
    </View>;
}

function TournamentCard({ item, onPress }) {
  const theme = useTheme();
  const [remainingMs, setRemainingMs] = React.useState(item.endsInMs);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs(current => Math.max(0, current - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <View style={[styles.tournamentCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.tournamentIcon, { backgroundColor: theme.colors.vipGoldBackground }]}>
        <TrophyIcon size={20} color={theme.colors.vipGoldText} />
      </View>
      <View style={styles.tournamentInfo}>
        <Text style={[styles.tournamentTitle, { color: theme.text.primary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.tournamentCountdown, { color: theme.text.secondary }]}>Starts in {formatCountdown(remainingMs)}</Text>
      </View>
      <Pressable onPress={onPress} style={[styles.joinButton, { backgroundColor: theme.colors.giftAccent }]}>
        <Text style={[styles.joinButtonText, { color: theme.cta.primary.text }]}>Join</Text>
      </Pressable>
    </View>;
}

export function GamesTabContent() {
  const navigation = useNavigation();

  const openComingSoon = title => {
    navigation.navigate(routes.comingSoon, {
      title,
      message: "We're still building this out — check back soon!"
    });
  };

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.featuredRow}>
        {FEATURED_GAMES.map(item => <FeaturedCard key={item.id} item={item} onPress={() => openComingSoon(item.title)} />)}
      </View>

      <SectionHeader title="Casual Games" onSeeAll={() => openComingSoon('Casual Games')} />
      <View style={styles.gamesList}>
        {CASUAL_GAMES.slice(0, CASUAL_GAMES_PREVIEW_COUNT).map(item => <CasualGameCard key={item.id} item={item} onPress={() => openComingSoon(item.name)} />)}
      </View>

      <SectionHeader title="Active Tournaments" />
      <View style={styles.tournamentsList}>
        {TOURNAMENTS.map(item => <TournamentCard key={item.id} item={item} onPress={() => openComingSoon(item.title)} />)}
      </View>
    </ScrollView>;
}

const styles = StyleSheet.create({
  content: {
    padding: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  featuredRow: {
    flexDirection: 'row',
    gap: scaleModerate(12)
  },
  featuredCard: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: scaleModerate(16),
    padding: scaleModerate(12),
    justifyContent: 'flex-end'
  },
  featuredTag: {
    position: 'absolute',
    top: scaleModerate(10),
    left: scaleModerate(10),
    borderRadius: scaleModerate(6),
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(3)
  },
  featuredTagText: {
    fontSize: scaleFont(9),
    fontWeight: '800',
    letterSpacing: 0.4
  },
  featuredEmoji: {
    fontSize: scaleFont(30)
  },
  featuredTitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  sectionHeader: {
    marginTop: scaleModerate(20),
    marginBottom: scaleModerate(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  sectionSeeAll: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  gamesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleModerate(10)
  },
  gameCard: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    paddingVertical: scaleModerate(14),
    paddingHorizontal: scaleModerate(8),
    gap: scaleModerate(4)
  },
  gameIcon: {
    width: scaleModerate(44),
    height: scaleModerate(44),
    borderRadius: scaleModerate(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(4)
  },
  gameEmoji: {
    fontSize: scaleFont(22)
  },
  gameName: {
    fontSize: scaleFont(12.5),
    fontWeight: '800',
    textAlign: 'center'
  },
  gamePlayers: {
    fontSize: scaleFont(10),
    textAlign: 'center'
  },
  playButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: scaleModerate(8),
    marginTop: scaleModerate(6)
  },
  playButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  tournamentsList: {
    gap: scaleModerate(12)
  },
  tournamentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12)
  },
  tournamentIcon: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: scaleModerate(12),
    alignItems: 'center',
    justifyContent: 'center'
  },
  tournamentInfo: {
    flex: 1,
    gap: scaleModerate(2)
  },
  tournamentTitle: {
    fontSize: scaleFont(13.5),
    fontWeight: '700'
  },
  tournamentCountdown: {
    fontSize: scaleFont(11)
  },
  joinButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(8)
  },
  joinButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '800'
  }
});

export default GamesTabContent;
