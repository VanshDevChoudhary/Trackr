import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RealmProvider as RealmCtxProvider } from '@realm/react';
import { Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog } from './schema';
import { colors, fonts, border } from '../theme';

const schema = [Habit, HabitCompletion, WorkoutSet, Exercise, Workout, HealthSnapshot, UserProfile, SyncLog];

function RealmFallback() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 10));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={styles.loading}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>▣</Text>
      </View>

      <Text style={styles.label}>INITIALISING REALM</Text>
      <Text style={styles.pct}>{progress}%</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.status}>Loading schema and migrating data…</Text>

      <Text style={styles.footer}>SWISS MINIMALIST DESIGN • V1.0</Text>
    </View>
  );
}

export default function RealmProvider({ children }: { children: React.ReactNode }) {
  return (
    <RealmCtxProvider schema={schema} schemaVersion={2} deleteRealmIfMigrationNeeded fallback={<RealmFallback />}>
      {children}
    </RealmCtxProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconText: {
    fontSize: 28,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 4,
  },
  pct: {
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.text,
    marginBottom: 16,
  },
  barTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.borderLight,
    marginBottom: 16,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  status: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 48,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    color: colors.textLight,
    letterSpacing: 1.5,
  },
});
