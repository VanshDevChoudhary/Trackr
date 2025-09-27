import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

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
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
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
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(elapsed)}</Text>
      <View style={styles.controls}>
        {!running ? (
          <Pressable style={styles.btn} onPress={start}>
            <Text style={styles.btnText}>{elapsed > 0 ? 'Resume' : 'Start'}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.pauseBtn]} onPress={pause}>
            <Text style={styles.btnText}>Pause</Text>
          </Pressable>
        )}
        {elapsed > 0 && (
          <Pressable style={[styles.btn, styles.resetBtn]} onPress={reset}>
            <Text style={[styles.btnText, { color: '#aaa' }]}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  time: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    backgroundColor: '#7c83ff',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  pauseBtn: {
    backgroundColor: '#e6a817',
  },
  resetBtn: {
    backgroundColor: '#2a2a2a',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
