import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  index: number;
  reps: string;
  weight: string;
  completed: boolean;
  onRepsChange: (val: string) => void;
  onWeightChange: (val: string) => void;
  onToggle: () => void;
  onRemove: () => void;
};

export default function SetRow({
  index, reps, weight, completed,
  onRepsChange, onWeightChange, onToggle, onRemove,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.setNum}>{index + 1}</Text>

      <TextInput
        style={styles.input}
        value={reps}
        onChangeText={onRepsChange}
        placeholder="0"
        placeholderTextColor="#555"
        keyboardType="number-pad"
        returnKeyType="done"
      />
      <Text style={styles.label}>reps</Text>

      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={onWeightChange}
        placeholder="0"
        placeholderTextColor="#555"
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
      <Text style={styles.label}>kg</Text>

      <Pressable onPress={onToggle} style={styles.checkWrap}>
        <View style={[styles.check, completed && styles.checkDone]}>
          {completed && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </Pressable>

      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.remove}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  setNum: {
    color: '#666',
    fontSize: 13,
    width: 18,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 56,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  label: {
    color: '#666',
    fontSize: 12,
  },
  checkWrap: {
    marginLeft: 'auto',
    paddingHorizontal: 4,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  remove: {
    color: '#555',
    fontSize: 20,
    paddingHorizontal: 4,
  },
});
