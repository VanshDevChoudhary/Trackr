import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  RefreshControl, Animated,
} from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import * as Haptics from 'expo-haptics';
import { healthBridge } from '../bridges/HealthBridge';
import { useAuth } from '../context/AuthContext';
import { useSyncStatus } from '../context/SyncContext';
import { Habit, HabitCompletion, HealthSnapshot, Workout } from '../db/schema';
import { createRecord, updateRecord } from '../db/writeHelper';
import { getDeviceId } from '../lib/api';
import { isDueOn, parseFrequency, toDateStr } from '../lib/streaks';
import StepCounter from '../components/StepCounter';
import WeeklyStepsChart from '../components/WeeklyStepsChart';
import { colors, fonts, border } from '../theme';

const STEP_GOAL = 8000;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export default function TodayScreen() {
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const realm = useRealm();
  const { user } = useAuth();
  const { triggerSync } = useSyncStatus();
  const todayStr = toDateStr(new Date());
  const today = new Date();

  const habits = useQuery(Habit, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id),
  );

  const todayCompletions = useQuery(HabitCompletion, (c) =>
    c.filtered('userId == $0 AND date == $1', user!.id, todayStr),
  );

  const dueToday: Habit[] = [];
  for (const h of habits) {
    const freq = parseFrequency(h.frequency);
    if (isDueOn(today, freq, h.createdAt)) dueToday.push(h);
  }

  const recentWorkouts = useQuery(Workout, (c) =>
    c.filtered('isDeleted == false AND userId == $0 SORT(startedAt DESC) LIMIT(3)', user!.id),
  );

  const weekSnapshots = useQuery(HealthSnapshot, (c) =>
    c.filtered('userId == $0 AND date >= $1', user!.id, toDateStr(daysAgo(6))),
  );

  const completedIds = new Set<string>();
  for (const c of todayCompletions) completedIds.add(c.habitId);

  const snapshotMap = new Map<string, number>();
  for (const s of weekSnapshots) snapshotMap.set(s.date, s.steps);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgo(6 - i);
    const key = toDateStr(d);
    return {
      label: DAY_LABELS[d.getDay()],
      steps: snapshotMap.get(key) ?? 0,
    };
  });

  const saveSnapshot = useCallback(async (s: number, cal: number) => {
    const deviceId = await getDeviceId();
    const existing = realm
      .objects(HealthSnapshot)
      .filtered('userId == $0 AND date == $1', user!.id, todayStr);

    if (existing.length > 0) {
      await updateRecord(realm, HealthSnapshot, existing[0]._id, {
        steps: s,
        calories: cal,
        activeMinutes,
      });
    } else {
      await createRecord(realm, HealthSnapshot, {
        userId: user!.id,
        date: todayStr,
        steps: s,
        calories: cal,
        activeMinutes: 0,
        deviceId,
      });
    }
  }, [realm, user, todayStr, activeMinutes]);

  async function fetchHealthData() {
    if (!permGranted) return;

    const cal = await healthBridge.getCalories(new Date());
    setCalories(cal);

    const mins = Math.min(Math.floor(steps / 100), 180);
    setActiveMinutes(mins);

    await saveSnapshot(steps, cal);
  }

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const granted = await healthBridge.requestPermissions();
      setPermGranted(granted);
      if (!granted) return;

      const cal = await healthBridge.getCalories(new Date());
      setCalories(cal);

      unsub = healthBridge.subscribeToSteps((s) => setSteps(s));

      intervalId = setInterval(() => fetchHealthData(), 5 * 60 * 1000);
    })();

    return () => {
      unsub?.();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const lastSaved = useRef(0);
  useEffect(() => {
    if (steps - lastSaved.current > 50 && permGranted) {
      lastSaved.current = steps;
      saveSnapshot(steps, calories);
    }
  }, [steps]);

  async function retryPermissions() {
    const granted = await healthBridge.requestPermissions();
    setPermGranted(granted);
  }

  const handleToggle = useCallback(async (habitId: string) => {
    const existing = realm
      .objects(HabitCompletion)
      .filtered('habitId == $0 AND date == $1', habitId, todayStr);

    if (existing.length > 0) {
      realm.write(() => realm.delete(existing[0]));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      const deviceId = await getDeviceId();
      await createRecord(realm, HabitCompletion, {
        habitId,
        userId: user!.id,
        date: todayStr,
        completedAt: new Date(),
        deviceId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [realm, user, todayStr]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHealthData();
    triggerSync();
    setRefreshing(false);
  }, [permGranted, steps, triggerSync]);

  const completedCount = dueToday.filter((h) => completedIds.has(h._id)).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>trackr</Text>
      </View>

      <Text style={styles.title}>Today</Text>
      <Text style={styles.dateLabel}>{formatDate(today).toUpperCase()}</Text>

      {permGranted === false && (
        <View style={styles.permCard}>
          <Text style={styles.permLock}>🔒</Text>
          <Text style={styles.permTitle}>Health Data Locked</Text>
          <Text style={styles.permText}>
            To view your activity, sleep, and heart rate trends, we need your permission to access HealthKit.
          </Text>
          <Pressable style={styles.permBtn} onPress={retryPermissions}>
            <Text style={styles.permBtnText}>Grant Access  →</Text>
          </Pressable>
        </View>
      )}

      {permGranted !== false && (
        <StepCounter steps={steps} goal={STEP_GOAL} />
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <View style={styles.statBottom}>
            <Text style={styles.statValue}>{calories.toLocaleString()}</Text>
            <Text style={styles.statLabel}>KCAL</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📍</Text>
          <View style={styles.statBottom}>
            <Text style={styles.statValue}>{(steps * 0.0007).toFixed(1)}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱</Text>
          <View style={styles.statBottom}>
            <Text style={styles.statValue}>{activeMinutes}</Text>
            <Text style={styles.statLabel}>MIN</Text>
          </View>
        </View>
      </View>

      {/* Weekly Goal Banner */}
      {permGranted !== false && (
        <View style={styles.weeklyBanner}>
          <View>
            <Text style={styles.weeklyLabel}>WEEKLY GOAL</Text>
            <Text style={styles.weeklyTitle}>Activity Streak</Text>
          </View>
          <Text style={styles.weeklyCount}>
            {String(weekData.filter(d => d.steps >= STEP_GOAL).length).padStart(2, '0')}
          </Text>
        </View>
      )}

      {dueToday.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HABITS</Text>
            <Text style={styles.sectionCount}>
              {completedCount}/{dueToday.length}
            </Text>
          </View>
          {dueToday.map((h) => (
            <HabitCheckRow
              key={h._id}
              habit={h}
              done={completedIds.has(h._id)}
              onToggle={() => handleToggle(h._id)}
            />
          ))}
        </View>
      ) : habits.length === 0 ? (
        <EmptyCard
          title="No habits yet"
          subtitle="Create your first habit to start tracking"
        />
      ) : null}

      {weekData.some((d) => d.steps > 0) ? (
        <View style={styles.section}>
          <WeeklyStepsChart data={weekData} goal={STEP_GOAL} />
        </View>
      ) : permGranted && (
        <EmptyCard
          title="No step data yet"
          subtitle="Waiting for health data to populate..."
        />
      )}

      {recentWorkouts.length === 0 && (
        <EmptyCard
          title="No workouts logged"
          subtitle="Log a workout to see it here"
        />
      )}
    </ScrollView>
  );
}

function HabitCheckRow({
  habit,
  done,
  onToggle,
}: {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: done ? 1 : 0,
      useNativeDriver: true,
      friction: 4,
      tension: 200,
    }).start();
  }, [done]);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={styles.habitRow} onPress={handlePress}>
        <Text style={styles.habitIcon}>{habit.icon}</Text>
        <Text style={[styles.habitName, done && styles.habitDone]}>
          {habit.name.toUpperCase()}
        </Text>
        <View
          style={[
            styles.habitCheck,
            done && { backgroundColor: colors.primary, borderColor: colors.border },
          ]}
        >
          {done && (
            <Animated.Text
              style={[
                styles.checkMark,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              ✓
            </Animated.Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 52,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerLogo: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 64,
    color: colors.text,
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    justifyContent: 'space-between',
  },
  statIcon: {
    fontSize: 16,
  },
  statBottom: {},
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textLight,
    marginTop: 2,
  },
  weeklyBanner: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  weeklyLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.text,
    marginBottom: 4,
  },
  weeklyTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
  },
  weeklyCount: {
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.text,
  },
  permCard: {
    backgroundColor: '#1a1a2e',
    borderWidth: border.width,
    borderColor: colors.border,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  permLock: {
    fontSize: 28,
    marginBottom: 16,
  },
  permTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.surface,
    fontSize: 20,
    marginBottom: 8,
  },
  permText: {
    fontFamily: fonts.body,
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  permBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  permBtnText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
  },
  sectionCount: {
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 13,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    padding: 16,
    marginBottom: -border.width,
  },
  habitIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  habitName: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  habitDone: {
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
  habitCheck: {
    width: 28,
    height: 28,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  emptyCard: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
