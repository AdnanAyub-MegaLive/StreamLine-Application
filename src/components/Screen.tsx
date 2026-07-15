import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, style }: ScreenProps) {
  const theme = useTheme();

  return <View style={[styles.container, { backgroundColor: theme.surfaces.page }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
