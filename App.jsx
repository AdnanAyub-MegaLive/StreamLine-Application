import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { AppNavigator, navigationRef } from './src/navigation';
import { LocationGate, VideoBackground } from './src/components';
import { useSessionGuard } from './src/hooks';
const queryClient = new QueryClient();
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent'
  }
};
function SessionGuard() {
  useSessionGuard();
  return null;
}
function AppContent() {
  const theme = useTheme();
  return <LocationGate>
      <View style={styles.root}>
        <VideoBackground />

        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.surfaces.page} translucent />
          <AppNavigator />
          <SessionGuard />
        </NavigationContainer>
      </View>
    </LocationGate>;
}
const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
function App() {
  return <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>;
}
export default App;
