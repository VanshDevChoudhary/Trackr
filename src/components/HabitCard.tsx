import React, { useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  Animated, PanResponder, Alert,
} from 'react-native';
import { colors, fonts, border } from '../theme';

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
        <Text style={styles.deleteText}>DELETE</Text>
      </Pressable>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable style={styles.content} onPress={onPress}>
          <Text style={styles.icon}>{icon}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{name.toUpperCase()}</Text>
            {streak > 0 && (
              <Text style={styles.streak}>{streak}d streak</Text>
            )}
          </View>
        </Pressable>

        <Pressable style={styles.toggle} onPress={onToggle}>
          <View
            style={[
              styles.checkbox,
              isCompletedToday && { backgroundColor: colors.primary },
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
    marginBottom: -border.width,
    position: 'relative',
  },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontFamily: fonts.bodyBold,
    color: colors.surface,
    fontSize: 10,
    letterSpacing: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  streak: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggle: {
    paddingRight: 18,
    paddingVertical: 18,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
