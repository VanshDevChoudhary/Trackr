import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  type: string;
  name?: string;
  date: Date;
  durationSeconds?: number;
  exerciseCount: number;
  source: string;
  onPress: () => void;
};

const typeIcons: Record<string, string> = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
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
  const icon = typeIcons[type] ?? '💪';
  const displayName = name || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{formatDate(date)}</Text>
          {durationSeconds != null && durationSeconds > 0 && (
            <Text style={styles.meta}> · {formatDuration(durationSeconds)}</Text>
          )}
          {exerciseCount > 0 && (
            <Text style={styles.meta}> · {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>
      {source !== 'manual' && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{source === 'healthkit' ? 'HK' : 'HC'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
    gap: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  meta: {
    color: '#888',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#7c83ff22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#7c83ff',
    fontSize: 11,
    fontWeight: '600',
  },
});
