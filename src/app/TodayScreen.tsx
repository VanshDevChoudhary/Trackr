import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.sub}>Your daily overview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  sub: { color: '#888', marginTop: 8 },
});
