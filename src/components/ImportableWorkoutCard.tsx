import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { HealthWorkout } from '../bridges/types';
import { colors, fonts, border } from '../theme';

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
        <Text style={styles.type}>{workout.type.toUpperCase()}</Text>
        <Text style={styles.details}>
          {dateStr} at {timeStr} · {formatDuration(workout.duration)} · {workout.calories} cal
        </Text>
      </View>
      <Pressable style={styles.importBtn} onPress={onImport}>
        <Text style={styles.importText}>IMPORT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    padding: 16,
    marginBottom: -border.width,
  },
  info: {
    flex: 1,
  },
  type: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  details: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  importBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  importText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
