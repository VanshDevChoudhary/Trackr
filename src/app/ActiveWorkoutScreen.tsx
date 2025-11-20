import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { createRecord } from '../db/writeHelper';
import { getDeviceId } from '../lib/api';
import { Workout } from '../db/schema';
import type { WorkoutType } from '../types';
import ExerciseInput, { type SetData } from '../components/ExerciseInput';
import WorkoutTimer from '../components/WorkoutTimer';
import { colors, fonts, border } from '../theme';

type ExerciseState = {
  name: string;
  sets: SetData[];
};

const defaultSet = (): SetData => ({ reps: '', weight: '', completed: false });

export default function ActiveWorkoutScreen({ route, navigation }: any) {
  const { type } = route.params as { type: WorkoutType };
  const realm = useRealm();
  const { user } = useAuth();

  const isStrength = type === 'strength';
  const startedAt = useRef(new Date()).current;

  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseState[]>(
    isStrength ? [{ name: '', sets: [defaultSet()] }] : [],
  );
  const [timedExerciseName, setTimedExerciseName] = useState('');
  const elapsedRef = useRef(0);

  const addExercise = useCallback(() => {
    setExercises((prev) => [...prev, { name: '', sets: [defaultSet()] }]);
  }, []);

  const removeExercise = useCallback((idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateExerciseName = useCallback((idx: number, val: string) => {
    setExercises((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: val };
      return next;
    });
  }, []);

  const updateSet = useCallback((exIdx: number, setIdx: number, field: keyof SetData, val: string | boolean) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      sets[setIdx] = { ...sets[setIdx], [field]: val };
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  }, []);

  const addSet = useCallback((exIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = [...ex.sets, defaultSet()];
      next[exIdx] = ex;
      return next;
    });
  }, []);

  const removeSet = useCallback((exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.sets = ex.sets.filter((_, i) => i !== setIdx);
      next[exIdx] = ex;
      return next;
    });
  }, []);

  async function finishWorkout() {
    const deviceId = await getDeviceId();
    const now = new Date();
    const duration = isStrength
      ? Math.floor((now.getTime() - startedAt.getTime()) / 1000)
      : elapsedRef.current;

    const exerciseData = isStrength
      ? exercises
          .filter((e) => e.name.trim())
          .map((e) => ({
            name: e.name.trim(),
            sets: e.sets
              .filter((s) => s.reps || s.weight)
              .map((s) => ({
                reps: parseInt(s.reps, 10) || 0,
                weight: parseFloat(s.weight) || 0,
                completed: s.completed,
              })),
          }))
      : timedExerciseName.trim()
        ? [{ name: timedExerciseName.trim(), sets: [], durationSeconds: elapsedRef.current }]
        : [];

    if (exerciseData.length === 0) {
      Alert.alert('Nothing to save', 'Add at least one exercise');
      return;
    }

    const typeLabels: Record<WorkoutType, string> = {
      strength: 'Strength',
      cardio: 'Cardio',
      flexibility: 'Flexibility',
    };
    const name = workoutName.trim() || typeLabels[type];

    await createRecord(realm, Workout, {
      userId: user!.id,
      type,
      name,
      exercises: exerciseData,
      durationSeconds: duration,
      startedAt,
      source: 'manual',
      isDeleted: false,
      deviceId,
      createdAt: new Date(),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }

  function confirmFinish() {
    Alert.alert('Finish workout?', 'This will save your session.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Finish', onPress: finishWorkout },
    ]);
  }

  const typeLabels: Record<WorkoutType, string> = {
    strength: 'Strength',
    cardio: 'Cardio',
    flexibility: 'Flexibility',
  };

  const completedExercises = exercises.filter(e => e.name.trim()).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Yellow header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerLogo}>trackr</Text>
        </View>
        <WorkoutTimer onElapsed={(s) => { elapsedRef.current = s; }} />
      </View>

      <View style={styles.progressSection}>
        <TextInput
          style={styles.nameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder={`${typeLabels[type]} A`}
          placeholderTextColor={colors.textLight}
        />
        {isStrength && (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min((completedExercises / Math.max(exercises.length, 1)) * 100, 100)}%` }]} />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressLabel}>PROGRESS</Text>
              <Text style={styles.progressCount}>{completedExercises} OF {exercises.length} EXERCISES</Text>
            </View>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isStrength ? (
          <>
            {exercises.map((ex, i) => (
              <ExerciseInput
                key={i}
                name={ex.name}
                sets={ex.sets}
                onNameChange={(v) => updateExerciseName(i, v)}
                onSetChange={(si, f, v) => updateSet(i, si, f, v)}
                onAddSet={() => addSet(i)}
                onRemoveSet={(si) => removeSet(i, si)}
                onRemove={() => removeExercise(i)}
              />
            ))}

            <Pressable style={styles.addExercise} onPress={addExercise}>
              <Text style={styles.addExerciseText}>+ ADD EXERCISE</Text>
            </Pressable>
          </>
        ) : (
          <TextInput
            style={styles.timedInput}
            value={timedExerciseName}
            onChangeText={setTimedExerciseName}
            placeholder="What are you doing? (e.g. Running)"
            placeholderTextColor={colors.textLight}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.finishBtn} onPress={confirmFinish}>
          <Text style={styles.finishBtnText}>FINISH WORKOUT</Text>
        </Pressable>
        <Text style={styles.footerNote}>SESSION DATA WILL BE SYNCED TO YOUR LOG</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: border.width,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  headerLogo: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    fontStyle: 'italic',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  nameInput: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    marginBottom: 12,
    padding: 0,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.borderLight,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: colors.text,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.text,
  },
  progressCount: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  addExercise: {
    borderWidth: border.width,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addExerciseText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  timedInput: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    padding: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  finishBtn: {
    backgroundColor: colors.text,
    paddingVertical: 18,
    alignItems: 'center',
  },
  finishBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.surface,
  },
  footerNote: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
});
