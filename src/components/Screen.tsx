import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
}>;

export function Screen({ children, style, transparent }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: transparent ? 'transparent' : theme.surfaces.page },
        !transparent && { paddingTop: insets.top },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
