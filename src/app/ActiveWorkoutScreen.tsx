import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { WorkoutType } from '../types';

export default function ActiveWorkoutScreen({ route, navigation }: any) {
  const { type } = route.params as { type: WorkoutType };

  const isStrength = type === 'strength';
  const startedAt = useRef(new Date()).current;

  const [workoutName, setWorkoutName] = useState('');

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
        <Pressable>
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
});
