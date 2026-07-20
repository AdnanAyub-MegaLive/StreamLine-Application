import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';
export function TermsCheckbox({
  accepted,
  onToggle,
  onOpenTerms,
  style
}) {
  const theme = useTheme();
  return <View style={[styles.wrap, style]}>
      <Pressable onPress={onToggle} style={[styles.checkbox, {
      backgroundColor: accepted ? theme.cta.primary.background : theme.surfaces.card,
      borderColor: accepted ? theme.cta.primary.background : theme.colors.cardBorder
    }]}>
        <Text style={[styles.checkboxText, {
        color: accepted ? theme.cta.primary.text : theme.text.secondary
      }]}>{accepted ? '✓' : ''}</Text>
      </Pressable>

      <Text style={[styles.text, {
      color: theme.text.secondary
    }]}>
        I am checking these{' '}
        <Text style={[styles.link, {
        color: theme.colors.teal700
      }]} onPress={onOpenTerms}>
          terms and conditions
        </Text>
      </Text>
    </View>;
}
const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10)
  },
  checkbox: {
    width: scaleModerate(22),
    height: scaleModerate(22),
    borderRadius: scaleModerate(6),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxText: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  text: {
    flex: 1,
    fontSize: scaleFont(12),
    lineHeight: 18,
    fontWeight: '600'
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: '700'
  }
});
export default TermsCheckbox;
