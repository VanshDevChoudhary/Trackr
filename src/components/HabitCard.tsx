import React, { useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  Animated, PanResponder, Alert,
} from 'react-native';

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

const SWIPE_THRESHOLD = -80;

export default function HabitCard({
  name, icon, color, streak, isCompletedToday,
  onPress, onToggle, onDelete,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 20,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  function confirmDelete() {
    Alert.alert('Delete habit?', `"${name}" will be removed.`, [
      {
        text: 'Cancel',
        onPress: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.deleteZone} onPress={confirmDelete}>
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.colorBar, { backgroundColor: color }]} />

        <Pressable style={styles.content} onPress={onPress}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            {streak > 0 && (
              <Text style={styles.streak}>{streak} day streak</Text>
            )}
          </View>
        </Pressable>

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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    position: 'relative',
  },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
