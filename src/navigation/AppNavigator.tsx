import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes, type RootStackParamList } from './routes';
import { SplashScreen } from '../screens/Splash';
import { HomeScreen } from '../screens/Home';
import { AuthScreen } from '../screens/Auth';
import { OnboardingScreen } from '../screens/Onboarding';
import { TermsAndConditionsScreen } from '../screens/TermsAndConditions';
import { RoomScreen } from '../screens/Room';
import { ProfileScreen } from '../screens/Profile';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={routes.splash}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="Room" component={RoomScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
