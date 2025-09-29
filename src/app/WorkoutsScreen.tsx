import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert,
} from 'react-native';
import { useQuery } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Workout } from '../db/schema';
import type { WorkoutType } from '../types';
import WorkoutCard from '../components/WorkoutCard';

export default function WorkoutsScreen({ navigation }: any) {
  const { user } = useAuth();

  const workouts = useQuery(Workout, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id).sorted('startedAt', true),
  );

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>

      {workouts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySub}>Start your first session</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkout}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

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
