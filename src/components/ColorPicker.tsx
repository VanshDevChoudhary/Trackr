import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#7c83ff', '#6b7280',
];

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {COLORS.map((color) => (
        <Pressable
          key={color}
          style={[
            styles.circle,
            { backgroundColor: color },
            selected === color && styles.selected,
          ]}
          onPress={() => onSelect(color)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#fff',
  },
});
