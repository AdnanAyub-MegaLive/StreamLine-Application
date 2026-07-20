import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { scaleFont, scaleModerate } from '../../../utils';

export function GamesTabContent() {
  const theme = useTheme();
  return <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, {
      color: theme.text.primary
    }]}>Games coming soon</Text>
      <Text style={[styles.emptySubtitle, {
      color: theme.text.secondary
    }]}>Casual mini-games will show up here.</Text>
    </View>;
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(24)
  },
  emptyTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  emptySubtitle: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(13),
    textAlign: 'center'
  }
});

export default GamesTabContent;
