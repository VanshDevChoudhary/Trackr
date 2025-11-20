import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, fonts, border } from '../theme';

type Props = {
  steps: number;
  goal: number;
};

const BOX_SIZE = '100%';

export default function StepCounter({ steps, goal }: Props) {
  const displayVal = useRef(new Animated.Value(0)).current;

  const pct = Math.min(steps / goal, 1);

  useEffect(() => {
    Animated.timing(displayVal, {
      toValue: steps,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [steps]);

  return (
    <View style={styles.outer}>
      <View style={styles.progressFrame}>
        {/* Yellow border that fills based on progress */}
        <View style={[styles.progressBorder, { width: `${pct * 100}%` }]} />
        <View style={styles.innerWhite}>
          <AnimatedNumber value={displayVal} />
          <Text style={styles.goalLabel}>
            STEPS OF {(goal / 1000).toFixed(0)}K
          </Text>
        </View>
      </View>
    </View>
  );
}

function AnimatedNumber({ value }: { value: Animated.Value }) {
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    const id = value.addListener(({ value: v }) => {
      setDisplay(Math.round(v).toLocaleString());
    });
    return () => value.removeListener(id);
  }, [value]);

  return <Text style={styles.count}>{display}</Text>;
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 24,
  },
  progressFrame: {
    aspectRatio: 1,
    width: '100%',
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    zIndex: 0,
  },
  innerWhite: {
    flex: 1,
    backgroundColor: colors.surface,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 56,
    color: colors.text,
  },
  goalLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
});
