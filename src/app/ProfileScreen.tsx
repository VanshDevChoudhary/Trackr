import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { useSyncStatus } from '../context/SyncContext';
import { UserProfile, SyncLog } from '../db/schema';
import { createRecord, updateRecord } from '../db/writeHelper';
import { colors, fonts, border } from '../theme';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { syncStatus, lastSyncAt, pendingRecords, triggerSync } = useSyncStatus();
  const realm = useRealm();

  const profiles = useQuery(UserProfile, (c) =>
    c.filtered('userId == $0', user!.id),
  );
  const profile = profiles.length > 0 ? profiles[0] : null;

  const syncLogs = useQuery(SyncLog, (c) =>
    c.sorted('timestamp', true),
  ).slice(0, 5);

  useEffect(() => {
    if (!profile && user) {
      createRecord(realm, UserProfile, {
        userId: user.id,
        name: user.name ?? '',
        dailyStepGoal: 8000,
        weeklyWorkoutGoal: 3,
      });
    }
  }, [profile, user]);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [stepGoal, setStepGoal] = useState(8000);
  const [workoutGoal, setWorkoutGoal] = useState(3);

  useEffect(() => {
    if (profile) {
      setStepGoal(profile.dailyStepGoal);
      setWorkoutGoal(profile.weeklyWorkoutGoal);
    }
  }, [profile?.dailyStepGoal, profile?.weeklyWorkoutGoal]);

  const displayName = profile?.name || user?.name || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  function startEditName() {
    setNameInput(profile?.name || user?.name || '');
    setEditingName(true);
  }

  const saveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !profile) {
      setEditingName(false);
      return;
    }
    await updateRecord(realm, UserProfile, profile._id, { name: trimmed });
    setEditingName(false);
  }, [nameInput, profile, realm]);

  const adjustStepGoal = useCallback(async (delta: number) => {
    if (!profile) return;
    const next = Math.max(1000, Math.min(50000, stepGoal + delta));
    setStepGoal(next);
    await updateRecord(realm, UserProfile, profile._id, { dailyStepGoal: next });
  }, [stepGoal, profile, realm]);

  const adjustWorkoutGoal = useCallback(async (delta: number) => {
    if (!profile) return;
    const next = Math.max(1, Math.min(14, workoutGoal + delta));
    setWorkoutGoal(next);
    await updateRecord(realm, UserProfile, profile._id, { weeklyWorkoutGoal: next });
  }, [workoutGoal, profile, realm]);

  function formatTime(d: Date): string {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return d.toLocaleDateString();
  }

  const syncing = syncStatus === 'syncing';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>
      <View style={styles.divider} />

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
              placeholder="Your name"
              placeholderTextColor={colors.textLight}
            />
            <Pressable onPress={saveName} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>SAVE</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={startEditName}>
            <Text style={styles.name}>{displayName}</Text>
          </Pressable>
        )}
        <Text style={styles.email}>@{user?.email?.split('@')[0]}</Text>

        <Pressable style={styles.editProfileBtn} onPress={startEditName}>
          <Text style={styles.editProfileText}>EDIT PROFILE</Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCell, styles.statBorderRight]}>
          <Text style={styles.statValue}>{stepGoal.toLocaleString()}</Text>
          <Text style={styles.statLabel}>STEPS</Text>
        </View>
        <View style={[styles.statCell, styles.statBorderRight]}>
          <Text style={styles.statValue}>{workoutGoal}</Text>
          <Text style={styles.statLabel}>GOALS</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{pendingRecords}</Text>
          <Text style={styles.statLabel}>PENDING</Text>
        </View>
      </View>

      {/* Goals section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalCardInfo}>
            <Text style={styles.goalName}>Daily Steps</Text>
            <Text style={styles.goalMeta}>
              Target: {stepGoal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjustStepGoal(-1000)}>
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Pressable style={[styles.stepperBtn, styles.stepperBtnActive]} onPress={() => adjustStepGoal(1000)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalCardInfo}>
            <Text style={styles.goalName}>Weekly Workouts</Text>
            <Text style={styles.goalMeta}>
              Target: {workoutGoal}/week
            </Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => adjustWorkoutGoal(-1)}>
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Pressable style={[styles.stepperBtn, styles.stepperBtnActive]} onPress={() => adjustWorkoutGoal(1)}>
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Sync section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SYNC</Text>
        <View style={styles.card}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot,
                syncStatus === 'idle' && { backgroundColor: colors.success },
                syncStatus === 'syncing' && { backgroundColor: colors.primary },
                syncStatus === 'offline' && { backgroundColor: colors.textLight },
                syncStatus === 'error' && { backgroundColor: colors.error },
              ]} />
              <Text style={styles.syncValue}>{syncStatus.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last synced</Text>
            <Text style={styles.syncValue}>
              {lastSyncAt ? formatTime(lastSyncAt) : 'never'}
            </Text>
          </View>

          <Pressable
            style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            onPress={triggerSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.syncBtnText}>SYNC NOW</Text>
            )}
          </Pressable>

          {syncLogs.length > 0 && (
            <>
              <Text style={styles.logHeader}>RECENT</Text>
              {syncLogs.map((log) => (
                <View key={log._id} style={styles.logRow}>
                  <View style={[
                    styles.logDot,
                    log.status === 'success' ? { backgroundColor: colors.success } : { backgroundColor: colors.error },
                  ]} />
                  <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                  <Text style={styles.logDetail}>
                    {log.status === 'success'
                      ? `↑${log.recordsPushed} ↓${log.recordsPulled}${log.conflicts > 0 ? ` ⚡${log.conflicts}` : ''}`
                      : log.errorMessage ?? 'failed'}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>

      <View style={styles.versionRow}>
        <Text style={styles.versionText}>TRACKR V{APP_VERSION}</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>LOG OUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 52,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.text,
  },
  divider: {
    height: border.width,
    backgroundColor: colors.border,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 32,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  editProfileBtn: {
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  editProfileText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    borderWidth: border.width,
    borderColor: colors.border,
    padding: 10,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: border.width,
    borderBottomWidth: border.width,
    borderColor: colors.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statBorderRight: {
    borderRightWidth: border.width,
    borderRightColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.textLight,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: -border.width,
  },
  goalCardInfo: {
    flex: 1,
  },
  goalName: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
    marginBottom: 2,
  },
  goalMeta: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepperBtnActive: {
    backgroundColor: colors.primary,
  },
  stepperText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 18,
  },
  card: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  syncLabel: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  syncValue: {
    fontFamily: fonts.monoMedium,
    color: colors.text,
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  syncBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text,
  },
  logHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logTime: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 11,
    width: 60,
  },
  logDetail: {
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 11,
    flex: 1,
  },
  versionRow: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textLight,
  },
  logoutBtn: {
    marginHorizontal: 24,
    borderWidth: border.width,
    borderColor: colors.error,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.error,
  },
});
