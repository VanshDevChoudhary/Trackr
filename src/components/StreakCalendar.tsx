import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Frequency } from '../types';
import { isDueOn, toDateStr } from '../lib/streaks';

type Props = {
  completions: string[];
  frequency: Frequency;
  createdAt?: Date;
};

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const CELL_SIZE = 12;
const GAP = 2;

type CellData = { key: string; color: string };
type MonthLabel = { label: string; weekIdx: number };

export default function StreakCalendar({ completions, frequency, createdAt }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setMonth(start.getMonth() - 3);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const completionSet = new Set(completions);
    const wks: CellData[][] = [];
    const labels: MonthLabel[] = [];

    let d = new Date(start);
    let prevMonth = -1;

    while (d <= end) {
      const week: CellData[] = [];
      for (let i = 0; i < 7; i++) {
        const ds = toDateStr(d);
        const isFuture = d > today;
        const done = completionSet.has(ds);
        const due = !isFuture && isDueOn(d, frequency, createdAt);

        let color = '#1a1a1a';
        if (!isFuture && done) color = '#4ade80';
        else if (due) color = '#2a2a2a';

        if (i === 0 && d.getMonth() !== prevMonth && !isFuture) {
          labels.push({
            label: d.toLocaleDateString('en', { month: 'short' }),
            weekIdx: wks.length,
          });
          prevMonth = d.getMonth();
        }

        week.push({ key: ds, color });
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      }
      wks.push(week);
    }

    return { weeks: wks, monthLabels: labels };
  }, [completions, frequency, createdAt]);

  return (
    <View>
      <View style={styles.monthRow}>
        <View style={{ width: 18 }} />
        {weeks.map((_, i) => {
          const lbl = monthLabels.find((m) => m.weekIdx === i);
          return (
            <View key={i} style={styles.monthCell}>
              {lbl ? <Text style={styles.monthText}>{lbl.label}</Text> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.grid}>
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Text style={styles.dayLabelText}>{label}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((day) => (
              <View
                key={day.key}
                style={[styles.cell, { backgroundColor: day.color }]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthCell: {
    width: CELL_SIZE + GAP,
  },
  monthText: {
    color: '#666',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 4,
  },
  dayLabelCell: {
    height: CELL_SIZE + GAP,
    justifyContent: 'center',
  },
  dayLabelText: {
    color: '#555',
    fontSize: 9,
    width: 14,
    textAlign: 'right',
  },
  weekCol: {
    gap: GAP,
    marginRight: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
});
