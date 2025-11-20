import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, border } from '../theme';

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
    <View style={[styles.row, completed && styles.rowCompleted]}>
      <Text style={styles.setNum}>{String(index + 1).padStart(2, '0')}</Text>

      <Text style={styles.prevLabel}>—</Text>

      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={onWeightChange}
        placeholder="0"
        placeholderTextColor={colors.textLight}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />

      <TextInput
        style={styles.input}
        value={reps}
        onChangeText={onRepsChange}
        placeholder="--"
        placeholderTextColor={colors.textLight}
        keyboardType="number-pad"
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  rowCompleted: {
    backgroundColor: '#fefce8',
  },
  setNum: {
    fontFamily: fonts.mono,
    color: colors.text,
    fontSize: 14,
    width: 36,
  },
  prevLabel: {
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 12,
    flex: 1,
  },
  input: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 72,
    textAlign: 'center',
  },
});
