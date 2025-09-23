import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import { Habit, HabitCompletion } from '../db/schema';
import { calculateCurrentStreak, calculateBestStreak, parseFrequency } from '../lib/streaks';

export default function HabitDetailScreen({ route, navigation }: any) {
  const { habitId } = route.params as { habitId: string };
  const realm = useRealm();

  const habit = realm.objectForPrimaryKey(Habit, habitId);

  const allCompletions = useQuery(HabitCompletion, (c) =>
    c.filtered('habitId == $0', habitId).sorted('completedAt', true),
  );

  if (!habit) {
    return (
      <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.notFound}>Habit not found</Text>
      </View>
    );
  }

  const frequency = parseFrequency(habit.frequency);
  const completionDates: string[] = [];
  for (const c of allCompletions) completionDates.push(c.date);

  const currentStreak = calculateCurrentStreak(completionDates, frequency, habit.createdAt);
  const bestStreak = calculateBestStreak(completionDates, frequency, habit.createdAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('HabitForm', { habitId })}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.heroRow}>
        <View style={[styles.iconBg, { backgroundColor: habit.color + '22' }]}>
          <Text style={styles.heroIcon}>{habit.icon}</Text>
        </View>
        <Text style={styles.heroName}>{habit.name}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bestStreak}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{allCompletions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backText: {
    color: '#7c83ff',
    fontSize: 16,
  },
  editText: {
    color: '#7c83ff',
    fontSize: 16,
    fontWeight: '500',
  },
  notFound: {
    color: '#888',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  heroRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    fontSize: 36,
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
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
    fontSize: 28,
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
