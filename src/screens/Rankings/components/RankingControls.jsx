import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';

export function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function GlassPanel({ style, children, onLayout }) {
  const theme = useTheme();
  return <LinearGradient colors={[hexToRgba(theme.surfaces.card, 0.65), hexToRgba(theme.surfaces.card, 0.4)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style} onLayout={onLayout}>
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

export function FilterPill({ filter, active, onPress, styles }) {
  const theme = useTheme();
  if (active) {
    return <Pressable onPress={onPress}>
        <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.filterPillActive}>
          <Text style={styles.filterPillIcon}>{filter.emoji}</Text>
          <Text style={styles.filterPillTextActive}>{filter.label}</Text>
        </LinearGradient>
      </Pressable>;
  }
  return <Pressable onPress={onPress}>
      <GlassPanel style={[styles.filterPill, { borderColor: theme.colors.cardBorder }]}>
        <Text style={styles.filterPillIcon}>{filter.emoji}</Text>
        <Text style={[styles.filterPillText, { color: theme.text.secondary }]}>{filter.label}</Text>
      </GlassPanel>
    </Pressable>;
}

export function PeriodPill({ period, active, onPress, styles }) {
  const theme = useTheme();
  if (active) {
    return <Pressable onPress={onPress}>
        <LinearGradient colors={[theme.colors.teal700, theme.colors.tertiary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.periodPillActive}>
          <Text style={styles.periodPillTextActive}>{period.label}</Text>
        </LinearGradient>
      </Pressable>;
  }
  return <Pressable onPress={onPress} style={styles.periodPill}>
      <Text style={[styles.periodPillText, { color: theme.text.secondary }]}>{period.label}</Text>
    </Pressable>;
}
