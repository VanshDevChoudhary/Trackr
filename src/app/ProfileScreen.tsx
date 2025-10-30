import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../db/schema';
import { createRecord, updateRecord } from '../db/writeHelper';

export default function ProfileScreen() {
  const { user } = useAuth();
  const realm = useRealm();

  const profiles = useQuery(UserProfile, (c) =>
    c.filtered('userId == $0', user!.id),
  );
  const profile = profiles.length > 0 ? profiles[0] : null;

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.identitySection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
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
                placeholderTextColor="#555"
              />
              <Pressable onPress={saveName} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEditName}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.editHint}>tap to edit</Text>
            </Pressable>
          )}
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Goals</Text>
      <View style={styles.card}>
        <View style={styles.goalRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalTitle}>Daily Steps</Text>
            <Text style={styles.goalValue}>{stepGoal.toLocaleString()}</Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustStepGoal(-1000)}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustStepGoal(1000)}
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.goalRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalTitle}>Weekly Workouts</Text>
            <Text style={styles.goalValue}>{workoutGoal}</Text>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustWorkoutGoal(-1)}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => adjustWorkoutGoal(1)}
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
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
  identitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c83ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  editHint: {
    fontSize: 11,
    color: '#555',
    marginTop: 1,
  },
  email: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#7c83ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  goalTitle: {
    color: '#ccc',
    fontSize: 14,
  },
  goalValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },
});
