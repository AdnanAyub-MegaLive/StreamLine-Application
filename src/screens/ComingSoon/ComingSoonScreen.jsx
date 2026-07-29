import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

// Generic placeholder for a feature that isn't built yet — currently used
// behind "Live Video" (StreamOptionModal's other option, next to Audio
// Room): unlike audio rooms, there's no video pipeline at all yet, so
// opening RoomScreen in mode:'video' was just an empty shell (no seats, no
// video, nothing). This says so plainly instead of showing that.
export function ComingSoonScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { title, message } = route.params ?? {};

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={[styles.title, { color: theme.text.primary }]}>{title || 'Coming Soon'}</Text>
        <Text style={[styles.message, { color: theme.text.secondary }]}>
          {message || "This feature is still in development. We're working on it — check back soon!"}
        </Text>
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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(32),
    paddingBottom: scaleModerate(60)
  },
  emoji: {
    fontSize: scaleFont(48),
    marginBottom: scaleModerate(16)
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  message: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center'
  }
});

export default ComingSoonScreen;
