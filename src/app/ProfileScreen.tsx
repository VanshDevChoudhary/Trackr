import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user?.name ? <Text style={styles.name}>{user.name}</Text> : null}
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 18, color: '#fff', marginTop: 24 },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutText: { color: '#ff4d4d', fontSize: 16, fontWeight: '500' },
});
