import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  Pressable, ScrollView, Alert,
} from 'react-native';
import { useRealm } from '@realm/react';
import { useAuth } from '../context/AuthContext';
import { Habit } from '../db/schema';
import { createRecord, updateRecord } from '../db/writeHelper';
import IconPicker from '../components/IconPicker';
import ColorPicker from '../components/ColorPicker';

export default function HabitFormScreen({ route, navigation }: any) {
  const habitId = route.params?.habitId as string | undefined;
  const realm = useRealm();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [color, setColor] = useState('#7c83ff');

  useEffect(() => {
    if (!habitId) return;
    const habit = realm.objectForPrimaryKey(Habit, habitId);
    if (!habit) return;

    setName(habit.name);
    setIcon(habit.icon);
    setColor(habit.color);
  }, [habitId, realm]);

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }

    const freq = JSON.stringify({ type: 'daily' });

    if (habitId) {
      await updateRecord(realm, Habit, habitId, {
        name: name.trim(),
        icon,
        color,
        frequency: freq,
      });
    } else {
      await createRecord(realm, Habit, {
        userId: user!.id,
        name: name.trim(),
        icon,
        color,
        frequency: freq,
        isDeleted: false,
        createdAt: new Date(),
      });
    }

    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{habitId ? 'Edit Habit' : 'New Habit'}</Text>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning run"
        placeholderTextColor="#555"
        maxLength={50}
      />

      <Text style={styles.label}>Icon</Text>
      <IconPicker selected={icon} onSelect={setIcon} />

      <Text style={[styles.label, { marginTop: 20 }]}>Color</Text>
      <ColorPicker selected={color} onSelect={setColor} />

      <Pressable style={[styles.saveBtn, { backgroundColor: color }]} onPress={save}>
        <Text style={styles.saveBtnText}>{habitId ? 'Save' : 'Create Habit'}</Text>
      </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  backText: {
    color: '#7c83ff',
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 20,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
