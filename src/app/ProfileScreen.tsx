import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRealm, useQuery } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../db/schema';
import { createRecord } from '../db/writeHelper';

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

  const displayName = profile?.name || user?.name || 'User';

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
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
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
  email: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
