import React from 'react';
import { RealmProvider as RealmCtxProvider } from '@realm/react';
import { Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, SyncLog } from './schema';

const schema = [Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, SyncLog];

export default function RealmProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealmCtxProvider schema={schema} schemaVersion={1}>
      {children}
    </RealmCtxProvider>
  );
}
