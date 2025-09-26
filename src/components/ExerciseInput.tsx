import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import SetRow from './SetRow';

export type SetData = { reps: string; weight: string; completed: boolean };

type Props = {
  name: string;
  sets: SetData[];
  onNameChange: (val: string) => void;
  onSetChange: (setIdx: number, field: keyof SetData, val: string | boolean) => void;
  onAddSet: () => void;
  onRemoveSet: (setIdx: number) => void;
  onRemove: () => void;
};

export default function ExerciseInput({
  name, sets, onNameChange, onSetChange, onAddSet, onRemoveSet, onRemove,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={onNameChange}
          placeholder="Exercise name"
          placeholderTextColor="#666"
        />
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.removeExercise}>Remove</Text>
        </Pressable>
      </View>

      {sets.map((set, i) => (
        <SetRow
          key={i}
          index={i}
          reps={set.reps}
          weight={set.weight}
          completed={set.completed}
          onRepsChange={(v) => onSetChange(i, 'reps', v)}
          onWeightChange={(v) => onSetChange(i, 'weight', v)}
          onToggle={() => onSetChange(i, 'completed', !set.completed)}
          onRemove={() => onRemoveSet(i)}
        />
      ))}

      <Pressable style={styles.addSet} onPress={onAddSet}>
        <Text style={styles.addSetText}>+ Add Set</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
    marginRight: 12,
  },
  removeExercise: {
    color: '#dc2626',
    fontSize: 13,
  },
  addSet: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSetText: {
    color: '#7c83ff',
    fontSize: 13,
    fontWeight: '500',
  },
});
