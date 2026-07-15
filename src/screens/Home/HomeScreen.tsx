import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { PrimaryButton, Screen } from '../../components';

export function HomeScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.heading, { color: theme.text.primary }]}>Welcome to Streamline</Text>
        <Text style={[styles.copy, { color: theme.text.secondary }]}>Your themed scaffold is ready. Replace this screen with your real home experience.</Text>

        <View style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Quick start</Text>
          <Text style={[styles.cardCopy, { color: theme.text.secondary }]}>Connect navigation, data, and room flows from here.</Text>
          <PrimaryButton label="Open room" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
  },
  copy: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
  card: {
    marginTop: 28,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;
