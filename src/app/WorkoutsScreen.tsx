import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Workout } from '../db/schema';

export default function WorkoutsScreen({ navigation }: any) {
  const { user } = useAuth();

  const workouts = useQuery(Workout, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id).sorted('startedAt', true),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>

      {workouts.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💪</Text>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySub}>Start your first session</Text>
        </View>
      )}
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
});
