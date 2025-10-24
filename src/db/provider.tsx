import React from 'react';
import { RealmProvider as RealmCtxProvider } from '@realm/react';
import { Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog } from './schema';

const schema = [Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog];

export default function RealmProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealmCtxProvider schema={schema} schemaVersion={2} deleteRealmIfMigrationNeeded>
      {children}
    </RealmCtxProvider>
  );
}
