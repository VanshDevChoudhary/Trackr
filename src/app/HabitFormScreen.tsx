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
import type { Frequency, FrequencyType } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitFormScreen({ route, navigation }: any) {
  const habitId = route.params?.habitId as string | undefined;
  const realm = useRealm();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [color, setColor] = useState('#7c83ff');
  const [freqType, setFreqType] = useState<FrequencyType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([1, 3, 5]);
  const [customInterval, setCustomInterval] = useState('2');

  useEffect(() => {
    if (!habitId) return;
    const habit = realm.objectForPrimaryKey(Habit, habitId);
    if (!habit) return;

    setName(habit.name);
    setIcon(habit.icon);
    setColor(habit.color);
    try {
      const freq: Frequency = JSON.parse(habit.frequency);
      setFreqType(freq.type);
      if (freq.type === 'weekly' && freq.days) setWeekDays(freq.days);
      if (freq.type === 'custom' && freq.days?.[0]) setCustomInterval(String(freq.days[0]));
    } catch { /* defaults are fine */ }
  }, [habitId, realm]);

  function buildFrequency(): Frequency {
    switch (freqType) {
      case 'weekly':
        return { type: 'weekly', days: weekDays };
      case 'custom':
        return { type: 'custom', days: [Math.max(2, parseInt(customInterval, 10) || 2)] };
      default:
        return { type: 'daily' };
    }
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }

    const freq = JSON.stringify(buildFrequency());

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

  function toggleWeekDay(day: number) {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
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

      <Text style={[styles.label, { marginTop: 20 }]}>Frequency</Text>
      <View style={styles.freqRow}>
        {(['daily', 'weekly', 'custom'] as FrequencyType[]).map((ft) => (
          <Pressable
            key={ft}
            style={[styles.freqBtn, freqType === ft && styles.freqBtnActive]}
            onPress={() => setFreqType(ft)}
          >
            <Text style={[styles.freqBtnText, freqType === ft && styles.freqBtnTextActive]}>
              {ft.charAt(0).toUpperCase() + ft.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {freqType === 'weekly' && (
        <View style={styles.weekRow}>
          {WEEKDAYS.map((label, i) => (
            <Pressable
              key={i}
              style={[styles.dayBtn, weekDays.includes(i) && { backgroundColor: color }]}
              onPress={() => toggleWeekDay(i)}
            >
              <Text style={[styles.dayBtnText, weekDays.includes(i) && { color: '#fff' }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {freqType === 'custom' && (
        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Every</Text>
          <TextInput
            style={styles.customInput}
            value={customInterval}
            onChangeText={setCustomInterval}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.customLabel}>days</Text>
        </View>
      )}

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
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  freqBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#222',
  },
  freqBtnActive: {
    backgroundColor: '#1a1830',
    borderColor: '#7c83ff',
  },
  freqBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  freqBtnTextActive: {
    color: '#7c83ff',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  dayBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  customLabel: {
    color: '#888',
    fontSize: 15,
  },
  customInput: {
    backgroundColor: '#161616',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 16,
    width: 60,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#222',
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
