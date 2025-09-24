import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useQuery, useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Habit, HabitCompletion } from '../db/schema';
import { toDateStr } from '../lib/streaks';
import HabitCard from '../components/HabitCard';

export default function HabitsScreen({ navigation }: any) {
  const realm = useRealm();
  const { user } = useAuth();
  const todayStr = toDateStr(new Date());

  const habits = useQuery(Habit, (c) =>
    c.filtered('isDeleted == false AND userId == $0', user!.id),
  );

  const todayCompletions = useQuery(HabitCompletion, (c) =>
    c.filtered('userId == $0 AND date == $1', user!.id, todayStr),
  );

  const todayCompleted = new Set<string>();
  for (const c of todayCompletions) todayCompleted.add(c.habitId);

  const renderHabit = useCallback(({ item }: { item: Habit }) => {
    return (
      <HabitCard
        name={item.name}
        icon={item.icon}
        color={item.color}
        streak={0}
        isCompletedToday={todayCompleted.has(item._id)}
        onPress={() => navigation.navigate('HabitDetail', { habitId: item._id })}
        onToggle={() => {}}
        onDelete={() => {}}
      />
    );
  }, [todayCompleted, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>

      {habits.length === 0 ? (
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
