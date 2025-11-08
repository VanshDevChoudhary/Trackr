import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RealmProvider from './src/db/provider';
import { SyncProvider } from './src/context/SyncContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import SyncBanner from './src/components/SyncBanner';
import TodayScreen from './src/app/TodayScreen';
import HabitsScreen from './src/app/HabitsScreen';
import HabitFormScreen from './src/app/HabitFormScreen';
import HabitDetailScreen from './src/app/HabitDetailScreen';
import WorkoutsScreen from './src/app/WorkoutsScreen';
import ActiveWorkoutScreen from './src/app/ActiveWorkoutScreen';
import WorkoutDetailScreen from './src/app/WorkoutDetailScreen';
import ProfileScreen from './src/app/ProfileScreen';
import LoginScreen from './src/app/LoginScreen';
import RegisterScreen from './src/app/RegisterScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const HabitsNav = createNativeStackNavigator();
const WorkoutsNav = createNativeStackNavigator();

const tabIcons: Record<string, string> = {
  Today: '📋',
  Habits: '🔄',
  Workouts: '💪',
  Profile: '👤',
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{tabIcons[name] ?? '?'}</Text>;
}

function WrappedToday() {
  return <ErrorBoundary fallbackLabel="Today"><TodayScreen /></ErrorBoundary>;
}

function WrappedProfile() {
  return <ErrorBoundary fallbackLabel="Profile"><ProfileScreen /></ErrorBoundary>;
}

function HabitsNavigator() {
  return (
    <ErrorBoundary fallbackLabel="Habits">
      <HabitsNav.Navigator screenOptions={{ headerShown: false }}>
        <HabitsNav.Screen name="HabitsList" component={HabitsScreen} />
        <HabitsNav.Screen name="HabitForm" component={HabitFormScreen} />
        <HabitsNav.Screen name="HabitDetail" component={HabitDetailScreen} />
      </HabitsNav.Navigator>
    </ErrorBoundary>
  );
}

function WorkoutsNavigator() {
  return (
    <ErrorBoundary fallbackLabel="Workouts">
      <WorkoutsNav.Navigator screenOptions={{ headerShown: false }}>
        <WorkoutsNav.Screen name="WorkoutsList" component={WorkoutsScreen} />
        <WorkoutsNav.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <WorkoutsNav.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      </WorkoutsNav.Navigator>
    </ErrorBoundary>
  );
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
      <Tab.Screen name="Today" component={WrappedToday} />
      <Tab.Screen name="Habits" component={HabitsNavigator} />
      <Tab.Screen name="Workouts" component={WorkoutsNavigator} />
      <Tab.Screen name="Profile" component={WrappedProfile} />
    </Tab.Navigator>
  );
}

function MainApp() {
  return (
    <RealmProvider>
      <SyncProvider>
        <SyncBanner />
        <MainTabs />
      </SyncProvider>
    </RealmProvider>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return isAuthenticated ? <MainApp /> : <AuthNavigator />;
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
