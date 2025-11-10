import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';

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
        { width: width as any, height, backgroundColor: '#222', borderRadius: 6, opacity },
        style,
      ]}
    />
  );
}

export function HabitCardSkeleton() {
  return (
    <View style={styles.habitCard}>
      <Bone width={4} height={56} style={{ borderRadius: 2 }} />
      <Bone width={28} height={28} style={{ borderRadius: 8, marginLeft: 14 }} />
      <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
        <Bone width="55%" height={16} />
        <Bone width="30%" height={11} />
      </View>
      <Bone width={26} height={26} style={{ borderRadius: 13, marginRight: 14 }} />
    </View>
  );
}

export function WorkoutCardSkeleton() {
  return (
    <View style={styles.workoutCard}>
      <Bone width={36} height={36} style={{ borderRadius: 10 }} />
      <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
        <Bone width="45%" height={16} />
        <Bone width="65%" height={12} />
      </View>
    </View>
  );
}

export function HabitListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function WorkoutListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 10 }}>
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
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    height: 60,
    overflow: 'hidden',
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    height: 66,
  },
});
