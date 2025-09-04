import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import TodayScreen from './src/app/TodayScreen';
import HabitsScreen from './src/app/HabitsScreen';
import WorkoutsScreen from './src/app/WorkoutsScreen';
import ProfileScreen from './src/app/ProfileScreen';
import LoginScreen from './src/app/LoginScreen';
import RegisterScreen from './src/app/RegisterScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

const tabIcons: Record<string, string> = {
  Today: '📋',
  Habits: '🔄',
  Workouts: '💪',
  Profile: '👤',
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{tabIcons[name] ?? '?'}</Text>;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
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
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthNavigator />;
}

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
        <StatusBar style="light" />
      </AuthProvider>
    </NavigationContainer>
  );
}
