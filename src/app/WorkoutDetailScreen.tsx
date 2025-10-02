import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRealm } from '@realm/react';
import { Workout } from '../db/schema';

const typeIcons: Record<string, string> = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
};

const sourceLabels: Record<string, string> = {
  manual: 'Manual',
  healthkit: 'Apple Health',
  healthconnect: 'Health Connect',
};

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function WorkoutDetailScreen({ route, navigation }: any) {
  const { workoutId } = route.params as { workoutId: string };
  const realm = useRealm();
  const workout = realm.objectForPrimaryKey(Workout, workoutId);

  if (!workout) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>Workout not found</Text>
      </View>
    );
  }

  const icon = typeIcons[workout.type] ?? '💪';
  const displayName = workout.name || workout.type.charAt(0).toUpperCase() + workout.type.slice(1);
  const dateStr = workout.startedAt.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = workout.startedAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.heroIcon}>{icon}</Text>
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroDate}>{dateStr} at {timeStr}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {workout.durationSeconds ? formatDuration(workout.durationSeconds) : '—'}
          </Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{workout.exercises.length}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sourceLabels[workout.source] ?? workout.source}</Text>
          <Text style={styles.statLabel}>Source</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backText: {
    color: '#7c83ff',
    fontSize: 16,
    marginBottom: 24,
  },
  notFound: {
    color: '#888',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  heroDate: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
