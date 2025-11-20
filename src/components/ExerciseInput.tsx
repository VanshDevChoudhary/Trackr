import React from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import SetRow from './SetRow';
import { colors, fonts, border } from '../theme';

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
        <Text style={styles.currentLabel}>CURRENT</Text>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.menuDots}>⋮</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={onNameChange}
        placeholder="Exercise name"
        placeholderTextColor={colors.textLight}
      />

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colLabel, { width: 36 }]}>SET</Text>
        <Text style={[styles.colLabel, { flex: 1 }]}>PREVIOUS</Text>
        <Text style={[styles.colLabel, { width: 72 }]}>WEIGHT</Text>
        <Text style={[styles.colLabel, { width: 56 }]}>REPS</Text>
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

      <Pressable style={styles.completeBtn} onPress={onAddSet}>
        <Text style={styles.completeBtnText}>+ ADD SET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  currentLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  menuDots: {
    fontSize: 20,
    color: colors.textMuted,
  },
  nameInput: {
    fontFamily: fonts.serif,
    color: colors.text,
    fontSize: 22,
    paddingVertical: 4,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 4,
  },
  colLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textLight,
  },
  completeBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  completeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.text,
  },
});
