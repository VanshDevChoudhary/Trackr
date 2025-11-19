import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
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
import { colors, fonts } from './src/theme';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const HabitsNav = createNativeStackNavigator();
const WorkoutsNav = createNativeStackNavigator();

const tabConfig: Record<string, { icon: string; filled: string }> = {
  Today: { icon: '☐', filled: '☑' },
  Habits: { icon: '◇', filled: '◆' },
  Workouts: { icon: '△', filled: '▲' },
  Profile: { icon: '○', filled: '●' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const cfg = tabConfig[name];
  return (
    <Text style={{
      fontSize: 18,
      color: focused ? colors.text : colors.textLight,
      fontFamily: fonts.body,
    }}>
      {focused ? cfg?.filled : cfg?.icon}
    </Text>
  );
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
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1.5,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 28,
          height: 80,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 10,
          textTransform: 'uppercase' as const,
          letterSpacing: 1.5,
          marginTop: 4,
        },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
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

function AuthLoading() {
  return (
    <View style={loadStyles.container}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={loadStyles.label}>AUTHORIZING</Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 3,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
});

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <AuthLoading />;

  return isAuthenticated ? <MainApp /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_900Black,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
        <StatusBar style="dark" />
      </AuthProvider>
    </NavigationContainer>
  );
}
