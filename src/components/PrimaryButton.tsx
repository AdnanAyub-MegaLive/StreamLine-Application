import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? theme.state.hovered : theme.cta.primary.background,
          borderColor: theme.cta.primary.border,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: theme.cta.primary.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PrimaryButton;
