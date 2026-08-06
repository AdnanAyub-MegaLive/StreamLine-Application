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
import { AgencyChoiceScreen } from '../screens/AgencyChoice';
import { CreateAgencyScreen } from '../screens/CreateAgency';
import { JoinAgencyScreen } from '../screens/JoinAgency';
import { AgencyDashboardScreen } from '../screens/AgencyDashboard';
import { ChangeAvatarScreen } from '../screens/ChangeAvatar';
import { DemoRoomScreen } from '../screens/DemoRoom';
import { UserProfileScreen } from '../screens/UserProfile';
import { ComingSoonScreen } from '../screens/ComingSoon';
import { InAppBrowserScreen } from '../screens/InAppBrowser';
import { ConversationScreen } from '../screens/Conversation';
import { UserSearchScreen } from '../screens/UserSearch';
import { FriendRequestsScreen } from '../screens/FriendRequests';
import { ConnectionsScreen } from '../screens/Connections';
import { StoreScreen } from '../screens/Store';
import { CreatePostScreen } from '../screens/CreatePost';
import { RankingsScreen } from '../screens/Rankings';
import { VipMembershipScreen } from '../screens/VipMembership';
import { NotificationsScreen } from '../screens/Notifications';
import { MyLevelScreen } from '../screens/MyLevel';
import { MyWalletScreen } from '../screens/MyWallet';
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
      <Stack.Screen name="AgencyChoice" component={AgencyChoiceScreen} />
      <Stack.Screen name="CreateAgency" component={CreateAgencyScreen} />
      <Stack.Screen name="JoinAgency" component={JoinAgencyScreen} />
      <Stack.Screen name="AgencyDashboard" component={AgencyDashboardScreen} />
      <Stack.Screen name="ChangeAvatar" component={ChangeAvatarScreen} />
      <Stack.Screen name="DemoRoom" component={DemoRoomScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="InAppBrowser" component={InAppBrowserScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="UserSearch" component={UserSearchScreen} />
      <Stack.Screen name="FriendRequests" component={FriendRequestsScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Rankings" component={RankingsScreen} />
      <Stack.Screen name="VipMembership" component={VipMembershipScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="MyLevel" component={MyLevelScreen} />
      <Stack.Screen name="MyWallet" component={MyWalletScreen} />
    </Stack.Navigator>;
}
export default AppNavigator;
