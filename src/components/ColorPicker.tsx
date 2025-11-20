import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, border } from '../theme';

const PALETTE = [
  '#FFDB58', '#22c55e', '#38bdf8', '#f87171', '#a78bfa',
  '#f97316', '#0f172a',
];

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {PALETTE.map((color) => (
        <Pressable
          key={color}
          style={[
            styles.swatch,
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
  swatch: {
    width: 44,
    height: 44,
    borderWidth: border.width,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.border,
  },
});
