import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { HomeScreen } from '../screens/Home';
import { DiscoverScreen } from '../screens/Discover';
import { FamilyScreen } from '../screens/Family';
import { MessageScreen } from '../screens/Message';
import { ProfileScreen } from '../screens/Profile';

export type MainTabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  FamilyTab: undefined;
  MessageTab: undefined;
  MeTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function renderTabBar(props: React.ComponentProps<typeof CustomTabBar>) {
  return <CustomTabBar {...props} />;
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={renderTabBar}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="FamilyTab" component={FamilyScreen} options={{ title: 'Family' }} />
      <Tab.Screen name="MessageTab" component={MessageScreen} options={{ title: 'Message' }} />
      <Tab.Screen name="MeTab" component={ProfileScreen} options={{ title: 'Me' }} />
    </Tab.Navigator>
  );
}

export default MainTabNavigator;
