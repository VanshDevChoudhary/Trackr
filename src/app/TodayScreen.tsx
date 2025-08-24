import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { healthBridge } from '../bridges/HealthBridge';

export default function TodayScreen() {
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const granted = await healthBridge.requestPermissions();
      setPermGranted(granted);
      if (!granted) return;

      const cal = await healthBridge.getCalories(new Date());
      setCalories(cal);

      unsub = healthBridge.subscribeToSteps((s) => setSteps(s));
    })();

    return () => unsub?.();
  }, []);

  async function retryPermissions() {
    const granted = await healthBridge.requestPermissions();
    setPermGranted(granted);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>

      {permGranted === false && (
        <View style={styles.permCard}>
          <Text style={styles.permText}>
            Health data access is needed to show your activity
          </Text>
          <Pressable style={styles.permBtn} onPress={retryPermissions}>
            <Text style={styles.permBtnText}>Grant Access</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Steps</Text>
          <Text style={styles.cardValue}>{steps.toLocaleString()}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Calories</Text>
          <Text style={styles.cardValue}>{calories.toLocaleString()}</Text>
          <Text style={styles.cardUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Health access</Text>
        <View style={[styles.dot, { backgroundColor: permGranted ? '#4ade80' : '#f87171' }]} />
        <Text style={styles.statusValue}>
          {permGranted === null ? '...' : permGranted ? 'yes' : 'no'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  cardUnit: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusLabel: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusValue: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  permCard: {
    backgroundColor: '#1a1520',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#332244',
  },
  permText: {
    color: '#c4b5fd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  permBtn: {
    backgroundColor: '#7c83ff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  permBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
