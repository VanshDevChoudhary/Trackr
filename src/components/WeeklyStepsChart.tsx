import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type DayData = {
  label: string;
  steps: number;
};

type Props = {
  data: DayData[];
  goal: number;
};

const BAR_MAX_HEIGHT = 100;

export default function WeeklyStepsChart({ data, goal }: Props) {
  const maxVal = Math.max(...data.map((d) => d.steps), goal);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.chart}>
        {data.map((day, i) => {
          const height = maxVal > 0 ? (day.steps / maxVal) * BAR_MAX_HEIGHT : 0;
          const hitGoal = day.steps >= goal;

          return (
            <View key={i} style={styles.barGroup}>
              <Text style={styles.value}>
                {day.steps >= 1000
                  ? `${(day.steps / 1000).toFixed(1)}k`
                  : day.steps || ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 2),
                      backgroundColor: hitGoal ? '#4ade80' : '#7c83ff',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, hitGoal && styles.dayLabelHit]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.goalLine}>
        <View style={styles.goalDash} />
        <Text style={styles.goalLabel}>
          {(goal / 1000).toFixed(0)}k goal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  title: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 40,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    color: '#666',
    fontSize: 9,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    width: 20,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  dayLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
  dayLabelHit: {
    color: '#4ade80',
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  goalDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#444',
  },
  goalLabel: {
    color: '#555',
    fontSize: 11,
  },
});
