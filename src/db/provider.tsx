import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RealmProvider as RealmCtxProvider } from '@realm/react';
import { Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog } from './schema';

const schema = [Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog];

function RealmFallback() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color="#7c83ff" />
    </View>
  );
}

export default function RealmProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealmCtxProvider schema={schema} schemaVersion={2} deleteRealmIfMigrationNeeded fallback={<RealmFallback />}>
      {children}
    </RealmCtxProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
