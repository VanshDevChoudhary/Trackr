import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, border } from '../theme';

const ICONS = [
  '🏃', '🚴', '💪', '🧘', '🏋️', '🤸', '🏊', '⚽', '🎯', '🧗',
  '📚', '✍️', '🎨', '🎵', '💊', '💧', '🥗', '🍎', '😴', '🧠',
  '🎬', '📱', '🏠', '🌱', '☀️', '🌙', '❤️', '⭐', '🔥', '✅',
];

type Props = {
  selected: string;
  onSelect: (icon: string) => void;
};

export default function IconPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {ICONS.map((icon) => (
        <Pressable
          key={icon}
          style={[styles.cell, selected === icon && styles.selected]}
          onPress={() => onSelect(icon)}
        >
          <Text style={styles.icon}>{icon}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: border.width,
    borderColor: colors.borderLight,
  },
  selected: {
    borderColor: colors.border,
    backgroundColor: colors.primary + '33',
  },
  icon: {
    fontSize: 22,
  },
});
