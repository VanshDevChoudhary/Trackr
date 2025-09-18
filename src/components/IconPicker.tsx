import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#7c83ff',
    backgroundColor: '#1a1830',
  },
  icon: {
    fontSize: 22,
  },
});
