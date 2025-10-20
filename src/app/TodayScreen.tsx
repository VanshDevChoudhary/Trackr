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

const STEP_GOAL = 8000;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
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

  // filter to habits due today
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

  // build weekly chart data
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

      // refresh snapshot every 5 min
      intervalId = setInterval(async () => {
        const c = await healthBridge.getCalories(new Date());
        setCalories(c);
      }, 5 * 60 * 1000);
    })();

    return () => {
      unsub?.();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // save snapshot when steps change meaningfully
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
    if (permGranted) {
      const cal = await healthBridge.getCalories(new Date());
      setCalories(cal);
      await saveSnapshot(steps, cal);
    }
    triggerSync();
    setRefreshing(false);
  }, [permGranted, steps, triggerSync, saveSnapshot]);

  const completedCount = dueToday.filter((h) => completedIds.has(h._id)).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#7c83ff"
          colors={['#7c83ff']}
        />
      }
    >
      <Text style={styles.title}>Today</Text>

      {permGranted === false && (
        <View style={styles.permCard}>
          <Text style={styles.permEmoji}>🔒</Text>
          <Text style={styles.permTitle}>Health data access needed</Text>
          <Text style={styles.permText}>
            Grant access to see your steps, calories, and activity data on this screen.
          </Text>
          <Pressable style={styles.permBtn} onPress={retryPermissions}>
            <Text style={styles.permBtnText}>Grant Access</Text>
          </Pressable>
        </View>
      )}

      {permGranted !== false && (
        <StepCounter steps={steps} goal={STEP_GOAL} />
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👟</Text>
          <Text style={styles.statValue}>{steps.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Steps</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{calories.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>{activeMinutes}</Text>
          <Text style={styles.statLabel}>Active min</Text>
        </View>
      </View>

      {dueToday.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Habits</Text>
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
          icon="🎯"
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
          icon="📊"
          title="No step data yet"
          subtitle="Waiting for health data to populate..."
        />
      )}

      {recentWorkouts.length === 0 && (
        <EmptyCard
          icon="💪"
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
          {habit.name}
        </Text>
        <View
          style={[
            styles.habitCheck,
            done && { backgroundColor: habit.color, borderColor: habit.color },
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
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
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
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  permCard: {
    backgroundColor: '#1a1520',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#332244',
    alignItems: 'center',
  },
  permEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  permTitle: {
    color: '#e2d4f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  permText: {
    color: '#a78bba',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  permBtn: {
    backgroundColor: '#7c83ff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    color: '#555',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  habitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  habitName: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  habitDone: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  habitCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
});
