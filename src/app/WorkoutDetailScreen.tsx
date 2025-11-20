import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRealm } from '@realm/react';
import { Workout } from '../db/schema';
import { colors, fonts, border } from '../theme';

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

function formatDurationShort(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m} mins`;
}

export default function WorkoutDetailScreen({ route, navigation }: any) {
  const { workoutId } = route.params as { workoutId: string };
  const realm = useRealm();
  const workout = realm.objectForPrimaryKey(Workout, workoutId);

  if (!workout) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Workout Summary</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Workout not found</Text>
        </View>
      </View>
    );
  }

  const displayName = workout.name || workout.type.charAt(0).toUpperCase() + workout.type.slice(1);
  const dateStr = workout.startedAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate total volume for strength workouts
  let totalVolume = 0;
  let totalSets = 0;
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      totalSets++;
      if (set.weight > 0 && set.reps > 0) {
        totalVolume += set.weight * set.reps;
      }
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Workout Summary</Text>
        <Text style={styles.menuDots}>···</Text>
      </View>

      <View style={styles.divider} />

      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroMeta}>
          📅 {dateStr}  ·  ⏱ {workout.durationSeconds ? formatDurationShort(workout.durationSeconds) : '—'}
        </Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{workout.type.toUpperCase()}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{sourceLabels[workout.source] ?? workout.source}</Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCell, styles.statBorderRight, { flex: 2 }]}>
          <Text style={styles.statLabel}>TOTAL VOLUME</Text>
          <Text style={styles.statValue}>
            {totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '—'}
          </Text>
        </View>
        <View style={[styles.statCell, styles.statBorderRight]}>
          <Text style={styles.statLabel}>TOTAL SETS</Text>
          <Text style={styles.statValue}>{totalSets > 0 ? String(totalSets).padStart(2, '0') : '—'}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>EXERCISES</Text>
          <Text style={styles.statValue}>{String(workout.exercises.length).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Exercises */}
      {workout.exercises.map((exercise, exIdx) => (
        <View key={exIdx} style={styles.exerciseSection}>
          <Text style={styles.exerciseName}>
            {String(exIdx + 1).padStart(2, '0')}. {exercise.name}
          </Text>

          {exercise.durationSeconds != null && exercise.durationSeconds > 0 && (
            <Text style={styles.exerciseDuration}>
              {formatDuration(exercise.durationSeconds)}
            </Text>
          )}

          {exercise.sets.length > 0 && (
            <View style={styles.setsTable}>
              <View style={styles.setsHeader}>
                <Text style={[styles.colHeader, { width: 48 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1 }]}>WEIGHT (KG)</Text>
                <Text style={[styles.colHeader, { width: 56 }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 48 }]}>RPE</Text>
              </View>
              {exercise.sets.map((set, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <Text style={[styles.setCell, { width: 48 }]}>
                    {String(setIdx + 1).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.setCell, { flex: 1 }]}>
                    {set.weight > 0 ? set.weight.toFixed(1) : '—'}
                  </Text>
                  <Text style={[styles.setCell, { width: 56 }]}>
                    {set.reps > 0 ? String(set.reps).padStart(2, '0') : '—'}
                  </Text>
                  <Text style={[styles.setCell, { width: 48 }]}>
                    {set.completed ? '✓' : '—'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {exercise.notes && (
            <Text style={styles.notes}>{exercise.notes}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 52,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  menuDots: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  divider: {
    height: border.width,
    backgroundColor: colors.border,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  notFoundText: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 16,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heroName: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  heroMeta: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    borderWidth: border.width,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderWidth: border.width,
    borderColor: colors.border,
    marginBottom: 32,
  },
  statCell: {
    flex: 1,
    padding: 14,
  },
  statBorderRight: {
    borderRightWidth: border.width,
    borderRightColor: colors.border,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 6,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.text,
  },
  exerciseSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  exerciseName: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 17,
    marginBottom: 12,
  },
  exerciseDuration: {
    fontFamily: fonts.monoMedium,
    color: colors.primary,
    fontSize: 13,
    marginBottom: 8,
  },
  setsTable: {
    borderWidth: border.width,
    borderColor: colors.border,
  },
  setsHeader: {
    flexDirection: 'row',
    borderBottomWidth: border.width,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
  },
  colHeader: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'left',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: border.width,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  setCell: {
    fontFamily: fonts.monoMedium,
    color: colors.text,
    fontSize: 14,
    textAlign: 'left',
  },
  notes: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
