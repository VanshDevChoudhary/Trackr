import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts</Text>
      <Text style={styles.sub}>Log and track your sessions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  sub: { color: '#888', marginTop: 8 },
});
