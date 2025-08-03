import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function HabitsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits</Text>
      <Text style={styles.sub}>Manage your tracked habits</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  sub: { color: '#888', marginTop: 8 },
});

export default HabitsScreen;
