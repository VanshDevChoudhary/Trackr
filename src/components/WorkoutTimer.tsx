import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, border } from '../theme';

type Props = {
  onElapsed?: (seconds: number) => void;
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function WorkoutTimer({ onElapsed }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const baseRef = useRef(0);

  const tick = useCallback(() => {
    const now = Date.now();
    const total = baseRef.current + Math.floor((now - startTimeRef.current) / 1000);
    setElapsed(total);
    onElapsed?.(total);
  }, [onElapsed]);

  useEffect(() => {
    // auto-start
    start();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start() {
    if (running) return;
    startTimeRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }

  function pause() {
    if (!running) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    baseRef.current = elapsed;
    setRunning(false);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
    onElapsed?.(0);
  }

  return (
    <Pressable style={styles.timerBadge} onPress={running ? pause : start}>
      <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timerBadge: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timerText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.text,
  },
});
