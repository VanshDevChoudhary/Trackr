import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, border } from '../theme';

type Props = {
  type: string;
  name?: string;
  date: Date;
  durationSeconds?: number;
  exerciseCount: number;
  source: string;
  onPress: () => void;
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatDate(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function WorkoutCard({
  type, name, date, durationSeconds, exerciseCount, source, onPress,
}: Props) {
  const displayName = name || type.charAt(0).toUpperCase() + type.slice(1);
  const typeLabel = type.toUpperCase();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{typeLabel}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.metaRow}>
          {durationSeconds != null && durationSeconds > 0 && (
            <Text style={styles.meta}>⏱ {formatDuration(durationSeconds)}</Text>
          )}
          {exerciseCount > 0 && (
            <Text style={styles.meta}>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</Text>
          )}
          <Text style={styles.metaDate}>{formatDate(date)}</Text>
        </View>
      </View>

      <Pressable style={styles.viewBtn} onPress={onPress}>
        <Text style={styles.viewBtnText}>VIEW DATA LOGS</Text>
      </Pressable>

      {source !== 'manual' && (
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>{source === 'healthkit' ? 'HK' : 'HC'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: border.width,
    borderColor: colors.border,
    marginBottom: -border.width,
    padding: 20,
    position: 'relative',
  },
  typeBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.text,
  },
  body: {
    marginBottom: 14,
  },
  name: {
    fontFamily: fonts.serif,
    color: colors.text,
    fontSize: 20,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  meta: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 11,
  },
  metaDate: {
    fontFamily: fonts.monoMedium,
    color: colors.textLight,
    fontSize: 11,
  },
  viewBtn: {
    backgroundColor: colors.primary,
    borderWidth: border.width,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text,
  },
  sourceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontFamily: fonts.monoMedium,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
});
