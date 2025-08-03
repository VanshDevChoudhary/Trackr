import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import TodayScreen from './src/app/TodayScreen';
import HabitsScreen from './src/app/HabitsScreen';
import WorkoutsScreen from './src/app/WorkoutsScreen';
import ProfileScreen from './src/app/ProfileScreen';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, string> = {
  Today: '📋',
  Habits: '🔄',
  Workouts: '💪',
  Profile: '👤',
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{tabIcons[name] ?? '?'}</Text>;
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222' },
          tabBarActiveTintColor: '#7c83ff',
          tabBarInactiveTintColor: '#555',
          tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Workouts" component={WorkoutsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
