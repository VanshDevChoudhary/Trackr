import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, Platform,
  LayoutAnimation, UIManager,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
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
import { colors, fonts, border } from '../theme';

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      <View style={styles.headerBar}>
        <Text style={styles.headerLogo}>TRACKR</Text>
      </View>
      <View style={styles.divider} />

      {!ready ? (
        <View style={styles.content}><WorkoutListSkeleton /></View>
      ) : null}

      {ready && hasImportable && (
        <View style={styles.importSection}>
          <Text style={styles.sectionLabel}>AVAILABLE TO IMPORT</Text>
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
          <Text style={styles.emptyHeading}>No sessions recorded</Text>
          <Text style={styles.emptySub}>
            Your fitness journey starts here. Record your first session to see your progress, peak performance, and detailed body insights.
          </Text>
          <Pressable style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>START WORKOUT</Text>
          </Pressable>

          <View style={styles.emptyStats}>
            <View style={styles.emptyStatItem}>
              <Text style={styles.emptyStatLabel}>VOLUME</Text>
              <Text style={styles.emptyStatValue}>0 kg</Text>
            </View>
            <View style={styles.emptyStatItem}>
              <Text style={styles.emptyStatLabel}>TIME</Text>
              <Text style={styles.emptyStatValue}>0m</Text>
            </View>
          </View>
        </View>
      ) : ready ? (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {workouts.length > 0 && (
        <Pressable style={styles.fab} onPress={handleStartWorkout}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 52,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLogo: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  divider: {
    height: border.width,
    backgroundColor: colors.border,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  importSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyHeading: {
    fontFamily: fonts.serif,
    color: colors.text,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySub: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 32,
  },
  startBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    letterSpacing: 2,
    color: colors.text,
  },
  emptyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 48,
  },
  emptyStatItem: {
    alignItems: 'center',
  },
  emptyStatLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textLight,
    marginBottom: 4,
  },
  emptyStatValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.text,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    backgroundColor: colors.text,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: fonts.bodyBold,
  },
});
