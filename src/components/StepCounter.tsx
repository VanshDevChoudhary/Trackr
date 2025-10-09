import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  steps: number;
  goal: number;
};

const RING_SIZE = 180;
const STROKE = 10;

export default function StepCounter({ steps, goal }: Props) {
  const pct = Math.min(steps / goal, 1);

  return (
    <View style={styles.container}>
      <View style={styles.ring}>
        <View style={styles.bgRing} />
        <View style={styles.inner}>
          <Text style={styles.count}>{steps.toLocaleString()}</Text>
          <Text style={styles.label}>steps</Text>
          <Text style={styles.goalText}>
            {Math.round(pct * 100)}% of {goal.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#1e1e1e',
  },
  inner: {
    width: RING_SIZE - STROKE * 2 - 8,
    height: RING_SIZE - STROKE * 2 - 8,
    borderRadius: (RING_SIZE - STROKE * 2 - 8) / 2,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  count: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: '#888',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  goalText: {
    color: '#555',
    fontSize: 11,
    marginTop: 4,
  },
});
