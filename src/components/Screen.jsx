import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
export function Screen({
  children,
  style,
  transparent,
  avoidKeyboard
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const backgroundColor = transparent ? 'transparent' : theme.surfaces.page;
  const content = <View style={[styles.container, {
    backgroundColor
  }, !transparent && {
    paddingTop: insets.top
  }, style]}>
      {children}
    </View>;

  // Opt-in only (Auth/Signup/EditProfile forms) so screens that don't need
  // it keep their exact current layout. Android already resizes around the
  // keyboard via windowSoftInputMode="adjustResize" in the manifest, so
  // behavior is undefined there — this is a no-op on Android and only
  // actually does something on iOS while the keyboard is open.
  if (avoidKeyboard) {
    return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>;
  }

  return content;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
export default Screen;
