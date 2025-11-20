import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import { Habit, HabitCompletion } from '../db/schema';
import { calculateCurrentStreak, calculateBestStreak, parseFrequency } from '../lib/streaks';
import StreakCalendar from '../components/StreakCalendar';
import { colors, fonts, border } from '../theme';

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
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>HABIT DETAIL</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.divider} />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundText}>Habit not found</Text>
        </View>
      </View>
    );
  }

  const frequency = parseFrequency(habit.frequency);
  const completionDates: string[] = [];
  for (const c of allCompletions) completionDates.push(c.date);

  const currentStreak = calculateCurrentStreak(completionDates, frequency, habit.createdAt);
  const bestStreak = calculateBestStreak(completionDates, frequency, habit.createdAt);
  const completionRate = allCompletions.length > 0 ? Math.round((currentStreak / Math.max(bestStreak, 1)) * 100) : 0;

  const recentCompletions: Array<{ id: string; date: string; time: string }> = [];
  const limit = Math.min(allCompletions.length, 15);
  for (let i = 0; i < limit; i++) {
    const c = allCompletions[i];
    recentCompletions.push({
      id: c._id,
      date: c.date,
      time: c.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>HABIT DETAIL</Text>
        <Pressable onPress={() => navigation.navigate('HabitForm', { habitId })}>
          <Text style={styles.editDots}>⋮</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* Hero card */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroIcon}>{habit.icon}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakBadgeText}>ACTIVE STREAK: {currentStreak}</Text>
        </View>
      </View>

      <View style={styles.heroMeta}>
        <Text style={styles.heroName}>{habit.name.toUpperCase()}</Text>
        <Text style={styles.heroFreq}>
          {frequency.type === 'daily' ? 'DAILY' : frequency.type === 'weekly' ? 'WEEKLY' : `EVERY ${frequency.days?.[0]}D`}
        </Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCell, styles.statBorderRight, styles.statBorderBottom]}>
          <Text style={styles.statLabel}>COMPLETION</Text>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
          </View>
        </View>
        <View style={[styles.statCell, styles.statBorderBottom]}>
          <Text style={styles.statLabel}>BEST STREAK</Text>
          <Text style={styles.statValue}>{bestStreak}</Text>
          <Text style={styles.statSub}>DAYS TOTAL</Text>
        </View>
        <View style={[styles.statCell, styles.statBorderRight]}>
          <Text style={styles.statLabel}>TOTAL LOGS</Text>
          <Text style={styles.statValue}>{allCompletions.length}</Text>
          <Text style={styles.statSub}>IN SESSIONS</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>CONSISTENCY</Text>
          <Text style={styles.statValue}>{currentStreak > 0 ? '+' : ''}{currentStreak}</Text>
          <Text style={styles.statSub}>CURRENT</Text>
        </View>
      </View>

      {/* Activity Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVITY MAP</Text>
        <View style={styles.calendarWrap}>
          <StreakCalendar
            completions={completionDates}
            frequency={frequency}
            createdAt={habit.createdAt}
          />
        </View>
      </View>

      {allCompletions.length === 0 && (
        <Text style={styles.emptyText}>No completions yet</Text>
      )}
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
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.text,
  },
  editDots: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  divider: {
    height: border.width,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  heroCard: {
    marginHorizontal: 24,
    aspectRatio: 1.3,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroIcon: {
    fontSize: 64,
  },
  streakBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: colors.text,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  streakBadgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.surface,
    letterSpacing: 1,
  },
  heroMeta: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  heroName: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroFreq: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 24,
    borderWidth: border.width,
    borderColor: colors.border,
    marginBottom: 24,
  },
  statCell: {
    width: '50%',
    padding: 16,
  },
  statBorderRight: {
    borderRightWidth: border.width,
    borderRightColor: colors.border,
  },
  statBorderBottom: {
    borderBottomWidth: border.width,
    borderBottomColor: colors.border,
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
    fontSize: 28,
    color: colors.text,
  },
  statSub: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    color: colors.textLight,
    letterSpacing: 1,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 12,
  },
  calendarWrap: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
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
  emptyText: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
