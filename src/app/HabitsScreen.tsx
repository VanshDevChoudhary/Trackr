import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, LayoutAnimation, UIManager, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import { useQuery, useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Habit, HabitCompletion } from '../db/schema';
import { createRecord, softDelete } from '../db/writeHelper';
import { getDeviceId } from '../lib/api';
import { calculateCurrentStreak, parseFrequency, toDateStr } from '../lib/streaks';
import HabitCard from '../components/HabitCard';
import { HabitListSkeleton } from '../components/Skeleton';
import { colors, fonts, border } from '../theme';

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const today = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerLogo}>TRACKR</Text>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.dateLabel}>
          {days[today.getDay()]}, {months[today.getMonth()]} {today.getDate()}
        </Text>
      </View>

      {!ready ? (
        <HabitListSkeleton />
      ) : habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyHeading}>Focus on what matters</Text>
          <Text style={styles.emptySub}>
            Your habit list is currently empty. Start building your daily routine by adding your first goal.
          </Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => navigation.navigate('HabitForm')}
          >
            <Text style={styles.createBtnText}>+  Create Habit</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item._id}
          renderItem={renderHabit}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Pressable
              style={styles.addBtn}
              onPress={() => navigation.navigate('HabitForm')}
            >
              <Text style={styles.addBtnText}>+  ADD NEW HABIT</Text>
            </Pressable>
          }
        />
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
    borderBottomWidth: border.width,
    borderBottomColor: colors.border,
  },
  headerLogo: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 28,
    color: colors.text,
    marginBottom: 2,
  },
  dateLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40,
  },
  emptyHeading: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 32,
  },
  createBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },
  createBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.text,
  },
  addBtn: {
    marginTop: 24,
    marginHorizontal: 24,
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.text,
  },
});
