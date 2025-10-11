import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type DayData = {
  label: string;
  steps: number;
};

type Props = {
  data: DayData[];
};

const BAR_MAX_HEIGHT = 100;

export default function WeeklyStepsChart({ data }: Props) {
  const maxVal = Math.max(...data.map((d) => d.steps), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.chart}>
        {data.map((day, i) => {
          const height = (day.steps / maxVal) * BAR_MAX_HEIGHT;
          return (
            <View key={i} style={styles.barGroup}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(height, 2), backgroundColor: '#7c83ff' },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{day.label}</Text>
            </View>
          );
        })}
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
});
