import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function BrandMark() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder,
          shadowColor: theme.colors.teal900,
        },
      ]}
    >
      <View style={[styles.core, { backgroundColor: theme.state.soft }]}>
        <View style={[styles.orbLarge, { backgroundColor: theme.colors.teal100 }]} />
        <View style={[styles.orbSmall, { backgroundColor: theme.colors.teal700 }]} />
        <View style={[styles.badge, { backgroundColor: theme.colors.teal50, borderColor: theme.colors.teal200 }]}>
          <Text style={[styles.badgeText, { color: theme.text.primary }]}>S</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 118,
    height: 118,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  core: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbLarge: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    top: -10,
    left: -6,
    opacity: 0.65,
  },
  orbSmall: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    right: 2,
    bottom: 4,
    opacity: 0.32,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 24,
    fontWeight: '800',
  },
});

export default BrandMark;
