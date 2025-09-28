import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { HealthWorkout } from '../bridges/types';

type Props = {
  workout: HealthWorkout;
  onImport: () => void;
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function ImportableWorkoutCard({ workout, onImport }: Props) {
  const dateStr = workout.startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = workout.startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.type}>{workout.type}</Text>
        <Text style={styles.details}>
          {dateStr} at {timeStr} · {formatDuration(workout.duration)} · {workout.calories} cal
        </Text>
      </View>
      <Pressable style={styles.importBtn} onPress={onImport}>
        <Text style={styles.importText}>Import</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  info: {
    flex: 1,
  },
  type: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  importBtn: {
    backgroundColor: '#7c83ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  importText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
