import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { colors, border } from '../theme';

function Bone({ width, height = 14, style }: { width: number | string; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, backgroundColor: colors.borderLight, opacity },
        style,
      ]}
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <View style={styles.habitCard}>
      <Bone width={24} height={24} style={{ marginLeft: 18 }} />
      <View style={{ flex: 1, gap: 8, marginLeft: 14 }}>
        <Bone width="55%" height={14} />
        <Bone width="30%" height={10} />
      </View>
      <Bone width={28} height={28} style={{ marginRight: 18 }} />
    </View>
  );
}

export function WorkoutCardSkeleton() {
  return (
    <View style={styles.workoutCard}>
      <Bone width="30%" height={10} style={{ marginBottom: 8 }} />
      <Bone width="60%" height={18} style={{ marginBottom: 6 }} />
      <Bone width="45%" height={10} style={{ marginBottom: 12 }} />
      <Bone width="100%" height={40} />
    </View>
  );
}

export function HabitListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function WorkoutListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <WorkoutCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    height: 62,
    marginBottom: -border.width,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    padding: 20,
    marginBottom: -border.width,
  },
});
