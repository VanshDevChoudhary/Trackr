import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, border } from '../theme';

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
      <Text style={styles.title}>THIS WEEK</Text>
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
                      backgroundColor: hitGoal ? colors.primary : colors.text,
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
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textMuted,
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
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 9,
    marginBottom: 4,
  },
  barTrack: {
    width: 20,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: 20,
  },
  dayLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  dayLabelHit: {
    color: colors.text,
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
    borderColor: colors.borderLight,
  },
  goalLabel: {
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 11,
  },
});
