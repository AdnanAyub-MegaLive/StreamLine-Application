import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme';
import { AppNavigator } from './src/navigation';

const queryClient = new QueryClient();

function AppContent() {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={theme.surfaces.page} />
      <AppNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
