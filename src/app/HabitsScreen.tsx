import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useQuery, useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Habit, HabitCompletion } from '../db/schema';
import { createRecord, softDelete } from '../db/writeHelper';
import { getDeviceId } from '../lib/api';
import { calculateCurrentStreak, parseFrequency, toDateStr } from '../lib/streaks';
import HabitCard from '../components/HabitCard';
import { HabitListSkeleton } from '../components/Skeleton';

export default function HabitsScreen({ navigation }: any) {
  const realm = useRealm();
  const { user } = useAuth();
  const todayStr = toDateStr(new Date());
  const [ready, setReady] = useState(false);

  const habits = useQuery(Habit, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id),
  );

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  const todayCompletions = useQuery(HabitCompletion, (c) =>
    c.filtered('userId == $0 AND date == $1', user!.id, todayStr),
  );

  const allCompletions = useQuery(HabitCompletion, (c) =>
    c.filtered('userId == $0', user!.id),
  );

  // build lookup maps each render — cheap for habit-scale data
  const todayCompleted = new Set<string>();
  for (const c of todayCompletions) todayCompleted.add(c.habitId);

  const completionsByHabit = new Map<string, string[]>();
  for (const c of allCompletions) {
    const arr = completionsByHabit.get(c.habitId) ?? [];
    arr.push(c.date);
    completionsByHabit.set(c.habitId, arr);
  }

  const handleToggle = useCallback(async (habitId: string) => {
    const existing = realm
      .objects(HabitCompletion)
      .filtered('habitId == $0 AND date == $1', habitId, todayStr);

    if (existing.length > 0) {
      // TODO: hard delete doesn't propagate via sync — revisit when sync supports tombstones
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

  const handleDelete = useCallback(async (habitId: string) => {
    await softDelete(realm, Habit, habitId);
  }, [realm]);

  const renderHabit = useCallback(({ item }: { item: Habit }) => {
    const freq = parseFrequency(item.frequency);
    const dates = completionsByHabit.get(item._id) ?? [];
    const streak = calculateCurrentStreak(dates, freq, item.createdAt);

    return (
      <HabitCard
        name={item.name}
        icon={item.icon}
        color={item.color}
        streak={streak}
        isCompletedToday={todayCompleted.has(item._id)}
        onPress={() => navigation.navigate('HabitDetail', { habitId: item._id })}
        onToggle={() => handleToggle(item._id)}
        onDelete={() => handleDelete(item._id)}
      />
    );
  }, [completionsByHabit, todayCompleted, navigation, handleToggle, handleDelete]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>

      {!ready ? (
        <HabitListSkeleton />
      ) : habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>No habits yet</Text>
          <Text style={styles.emptySub}>Create one to start tracking</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item._id}
          renderItem={renderHabit}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('HabitForm')}
      >
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
