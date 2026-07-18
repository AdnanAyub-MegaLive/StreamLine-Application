import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
export function Screen({
  children,
  style,
  transparent
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={[styles.container, {
    backgroundColor: transparent ? 'transparent' : theme.surfaces.page
  }, !transparent && {
    paddingTop: insets.top
  }, style]}>
      {children}
    </View>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
export default Screen;
