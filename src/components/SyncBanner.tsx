import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSyncStatus } from '../context/SyncContext';

const STATUS_COLORS = {
  idle: 'transparent',
  syncing: '#2563eb',
  offline: '#ca8a04',
  error: '#dc2626',
} as const;

const STATUS_TEXT = {
  idle: '',
  syncing: 'Syncing...',
  offline: 'Offline',
  error: 'Sync error',
} as const;

export default function SyncBanner() {
  const { syncStatus, lastSyncAt, pendingRecords, errorMessage, triggerSync } = useSyncStatus();
  const [expanded, setExpanded] = useState(false);

  if (syncStatus === 'idle') return null;

  const bg = STATUS_COLORS[syncStatus];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.label}>{STATUS_TEXT[syncStatus]}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          {lastSyncAt && (
            <Text style={styles.detail}>
              Last sync: {formatTime(lastSyncAt)}
            </Text>
          )}
          {pendingRecords > 0 && (
            <Text style={styles.detail}>
              {pendingRecords} pending {pendingRecords === 1 ? 'record' : 'records'}
            </Text>
          )}
          {errorMessage && (
            <Text style={styles.detail}>{errorMessage}</Text>
          )}
          {syncStatus === 'error' && (
            <TouchableOpacity onPress={triggerSync} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  details: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  detail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 2,
  },
  retryBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
