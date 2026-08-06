import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AppNavigator, consumePendingRoomNavigation, navigateToRoom, navigationRef, routes } from './src/navigation';
import { PermissionsGate, ThemedAlertHost, VideoBackground } from './src/components';
import { useSessionGuard } from './src/hooks';
import { registerLiveRoomNotificationTapHandler } from './src/utils';
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
const VIDEO_BACKGROUND_ROUTES = new Set([routes.splash, routes.auth]);
function AppContent() {
  const [showVideoBackground, setShowVideoBackground] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = registerLiveRoomNotificationTapHandler(navigateToRoom);
    return unsubscribe;
  }, []);

  const syncVideoBackground = React.useCallback(() => {
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    setShowVideoBackground(!currentRoute || VIDEO_BACKGROUND_ROUTES.has(currentRoute));
  }, []);

  return <PermissionsGate>
      <View style={styles.root}>
        {showVideoBackground ? <VideoBackground /> : null}

        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => {
            consumePendingRoomNavigation();
            syncVideoBackground();
          }}
          onStateChange={syncVideoBackground}
        >
          {/* Transparent everywhere now, not just on a few specific
          routes — every screen's own background already paints all the
          way up to the top edge, so a transparent bar lets that show
          through consistently across the whole app. */}
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <AppNavigator />
          <SessionGuard />
        </NavigationContainer>
        <ThemedAlertHost />
      </View>
    </PermissionsGate>;
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
