import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  name: string;
  icon: string;
  color: string;
  streak: number;
  isCompletedToday: boolean;
  onPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

export default function HabitCard({
  name, icon, color, streak, isCompletedToday,
  onPress, onToggle, onDelete,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.card} onPress={onPress} onLongPress={onDelete}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />

        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            {streak > 0 && (
              <Text style={styles.streak}>{streak} day streak</Text>
            )}
          </View>
        </View>

        <Pressable style={styles.toggle} onPress={onToggle}>
          <View
            style={[
              styles.checkbox,
              isCompletedToday && { backgroundColor: color, borderColor: color },
            ]}
          >
            {isCompletedToday && <Text style={styles.check}>✓</Text>}
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  streak: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    paddingRight: 14,
    paddingVertical: 14,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
