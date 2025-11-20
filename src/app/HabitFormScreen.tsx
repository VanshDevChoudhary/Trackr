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
import { colors, fonts, border } from '../theme';
import type { Frequency, FrequencyType } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitFormScreen({ route, navigation }: any) {
  const habitId = route.params?.habitId as string | undefined;
  const realm = useRealm();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [color, setColor] = useState('#FFDB58');
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
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>TRACKR</Text>
        </View>
        <Pressable style={styles.saveHeaderBtn} onPress={save}>
          <Text style={styles.saveHeaderText}>SAVE HABIT</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <Text style={styles.heroLabel}>
        {habitId ? 'Edit your habit' : 'What is your new habit?'}
      </Text>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Read for 30 minutes"
        placeholderTextColor={colors.textLight}
        maxLength={50}
      />

      <Text style={styles.label}>Icon</Text>
      <IconPicker selected={icon} onSelect={setIcon} />

      <Text style={styles.sectionTitle}>Frequency</Text>
      <View style={styles.freqGrid}>
        {(['daily', 'weekly', 'custom'] as FrequencyType[]).map((ft) => (
          <Pressable
            key={ft}
            style={[styles.freqBtn, freqType === ft && styles.freqBtnActive]}
            onPress={() => setFreqType(ft)}
          >
            <Text style={[styles.freqBtnText, freqType === ft && styles.freqBtnTextActive]}>
              {ft.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {freqType === 'weekly' && (
        <View style={styles.weekRow}>
          {WEEKDAYS.map((label, i) => (
            <Pressable
              key={i}
              style={[styles.dayBtn, weekDays.includes(i) && styles.dayBtnActive]}
              onPress={() => toggleWeekDay(i)}
            >
              <Text style={[styles.dayBtnText, weekDays.includes(i) && styles.dayBtnTextActive]}>
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

      <Text style={styles.sectionTitle}>Identify with color</Text>
      <ColorPicker selected={color} onSelect={setColor} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 52,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  saveHeaderBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveHeaderText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text,
  },
  divider: {
    height: border.width,
    backgroundColor: colors.border,
    marginBottom: 24,
  },
  heroLabel: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: colors.surface,
    fontFamily: fonts.body,
    fontSize: 16,
    marginBottom: 28,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
    marginBottom: 16,
    marginTop: 28,
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: border.width,
    borderColor: colors.border,
  },
  freqBtn: {
    width: '50%',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: border.width / 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  freqBtnActive: {
    backgroundColor: colors.primary,
  },
  freqBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  freqBtnTextActive: {
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: border.width,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  dayBtnActive: {
    backgroundColor: colors.text,
  },
  dayBtnText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    fontSize: 11,
  },
  dayBtnTextActive: {
    color: colors.surface,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  customLabel: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 15,
  },
  customInput: {
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.text,
    padding: 10,
    color: colors.surface,
    fontFamily: fonts.mono,
    fontSize: 16,
    width: 60,
    textAlign: 'center',
  },
});
