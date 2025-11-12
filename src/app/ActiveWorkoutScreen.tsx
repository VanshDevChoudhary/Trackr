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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{typeLabels[type]}</Text>
        <Pressable onPress={confirmFinish}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.nameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder={`${typeLabels[type]} Workout`}
          placeholderTextColor="#555"
        />

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
              <Text style={styles.addExerciseText}>+ Add Exercise</Text>
            </Pressable>
          </>
        ) : (
          <>
            <WorkoutTimer onElapsed={(s) => { elapsedRef.current = s; }} />

            <TextInput
              style={styles.timedInput}
              value={timedExerciseName}
              onChangeText={setTimedExerciseName}
              placeholder="What are you doing? (e.g. Running)"
              placeholderTextColor="#555"
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  finishText: {
    color: '#7c83ff',
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameInput: {
    backgroundColor: '#161616',
    borderRadius: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  addExercise: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3a',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: '#7c83ff',
    fontSize: 15,
    fontWeight: '500',
  },
  timedInput: {
    backgroundColor: '#161616',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
});
