import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, Platform,
} from 'react-native';
import { useQuery, useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Workout } from '../db/schema';
import { createRecord } from '../db/writeHelper';
import { getDeviceId } from '../lib/api';
import { healthBridge } from '../bridges/HealthBridge';
import type { HealthWorkout } from '../bridges/types';
import type { WorkoutType } from '../types';
import WorkoutCard from '../components/WorkoutCard';
import ImportableWorkoutCard from '../components/ImportableWorkoutCard';
import { WorkoutListSkeleton } from '../components/Skeleton';

function mapHealthType(raw: string): WorkoutType {
  const lower = raw.toLowerCase();
  if (lower.includes('run') || lower.includes('walk') || lower.includes('cycl') || lower.includes('swim')) return 'cardio';
  if (lower.includes('yoga') || lower.includes('stretch') || lower.includes('flex')) return 'flexibility';
  return 'strength';
}

export default function WorkoutsScreen({ navigation }: any) {
  const realm = useRealm();
  const { user } = useAuth();
  const [importable, setImportable] = useState<HealthWorkout[]>([]);
  const [ready, setReady] = useState(false);

  const workouts = useQuery(Workout, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id).sorted('startedAt', true),
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchImportable() {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const healthWorkouts = await healthBridge.getWorkouts(weekAgo, now);

      // filter out already-imported ones by matching startDate
      const existingStarts = new Set<number>();
      for (const w of workouts) {
        if (w.source !== 'manual') existingStarts.add(w.startedAt.getTime());
      }

      const filtered = healthWorkouts.filter(
        (hw) => !existingStarts.has(hw.startDate.getTime()),
      );
      if (!cancelled) setImportable(filtered);
    }

    fetchImportable().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, [workouts.length]);

  const handleImport = useCallback(async (hw: HealthWorkout) => {
    const deviceId = await getDeviceId();
    const source = Platform.OS === 'ios' ? 'healthkit' : 'healthconnect';
    await createRecord(realm, Workout, {
      userId: user!.id,
      type: mapHealthType(hw.type),
      name: hw.type.charAt(0).toUpperCase() + hw.type.slice(1),
      exercises: [],
      durationSeconds: hw.duration,
      startedAt: hw.startDate,
      source,
      isDeleted: false,
      deviceId,
      createdAt: new Date(),
    });
    setImportable((prev) => prev.filter((w) => w.id !== hw.id));
  }, [realm, user]);

  function handleStartWorkout() {
    const options: Array<{ label: string; type: WorkoutType }> = [
      { label: 'Strength', type: 'strength' },
      { label: 'Cardio', type: 'cardio' },
      { label: 'Flexibility', type: 'flexibility' },
    ];

    Alert.alert('Workout Type', 'Choose the type of workout', [
      ...options.map((opt) => ({
        text: opt.label,
        onPress: () => navigation.navigate('ActiveWorkout', { type: opt.type }),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  const renderWorkout = useCallback(({ item }: { item: Workout }) => (
    <WorkoutCard
      type={item.type}
      name={item.name}
      date={item.startedAt}
      durationSeconds={item.durationSeconds}
      exerciseCount={item.exercises.length}
      source={item.source}
      onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item._id })}
    />
  ), [navigation]);

  const hasImportable = importable.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>

      {!ready ? (
        <WorkoutListSkeleton />
      ) : null}

      {ready && hasImportable && (
        <View style={styles.importSection}>
          <Text style={styles.sectionLabel}>Available to Import</Text>
          {importable.map((hw) => (
            <ImportableWorkoutCard
              key={hw.id}
              workout={hw}
              onImport={() => handleImport(hw)}
            />
          ))}
        </View>
      )}

      {ready && workouts.length === 0 && !hasImportable ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySub}>Start your first session</Text>
        </View>
      ) : ready ? (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      <Pressable style={styles.fab} onPress={handleStartWorkout}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  importSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySub: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c83ff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#7c83ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
    marginTop: -2,
  },
});
