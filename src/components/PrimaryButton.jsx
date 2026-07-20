import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';
export function PrimaryButton({
  label,
  onPress,
  style,
  disabled
}) {
  const theme = useTheme();
  return <Pressable disabled={disabled} onPress={onPress} style={({
    pressed
  }) => [styles.button, {
    backgroundColor: disabled ? theme.colors.teal100 : pressed ? theme.state.hovered : theme.cta.primary.background,
    borderColor: theme.cta.primary.border
  }, style]}>
      <Text style={[styles.label, {
      color: theme.cta.primary.text
    }]}>{label}</Text>
    </Pressable>;
}
const styles = StyleSheet.create({
  button: {
    minHeight: scaleModerate(52),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(18)
  },
  label: {
    fontSize: scaleFont(16),
    fontWeight: '700'
  }
});
export default PrimaryButton;
