import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { routes } from './routes';
import { MainTabNavigator } from './MainTabNavigator';
import { SplashScreen } from '../screens/Splash';
import { AuthScreen } from '../screens/Auth';
import { PhoneAuthScreen } from '../screens/PhoneAuth';
import { SignupDetailsScreen } from '../screens/SignupDetails';
import { OnboardingScreen } from '../screens/Onboarding';
import { TermsAndConditionsScreen } from '../screens/TermsAndConditions';
import { RoomScreen } from '../screens/Room';
import { ProfileScreen } from '../screens/Profile';
import { BannedScreen } from '../screens/Banned';
import { SettingsScreen } from '../screens/Settings';
import { EditProfileScreen } from '../screens/EditProfile';
import { BannerDetailScreen } from '../screens/BannerDetail';
import { CreateAgencyScreen } from '../screens/CreateAgency';
import { ChangeAvatarScreen } from '../screens/ChangeAvatar';
import { DemoRoomScreen } from '../screens/DemoRoom';
import { UserProfileScreen } from '../screens/UserProfile';
import { ComingSoonScreen } from '../screens/ComingSoon';
import { InAppBrowserScreen } from '../screens/InAppBrowser';
const Stack = createNativeStackNavigator();
export function AppNavigator() {
  return <Stack.Navigator screenOptions={{
    headerShown: false,
    contentStyle: {
      backgroundColor: 'transparent'
    }
  }} initialRouteName={routes.splash}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={MainTabNavigator} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="SignupDetails" component={SignupDetailsScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <Stack.Screen name="Room" component={RoomScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Banned" component={BannedScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="BannerDetail" component={BannerDetailScreen} />
      <Stack.Screen name="CreateAgency" component={CreateAgencyScreen} />
      <Stack.Screen name="ChangeAvatar" component={ChangeAvatarScreen} />
      <Stack.Screen name="DemoRoom" component={DemoRoomScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="InAppBrowser" component={InAppBrowserScreen} />
    </Stack.Navigator>;
}
export default AppNavigator;
