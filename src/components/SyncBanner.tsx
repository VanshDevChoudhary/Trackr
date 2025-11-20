import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSyncStatus } from '../context/SyncContext';
import { colors, fonts, border } from '../theme';

const STATUS_BG = {
  idle: 'transparent',
  syncing: colors.primary,
  offline: colors.borderLight,
  error: colors.primary,
} as const;

const STATUS_TEXT = {
  idle: '',
  syncing: 'SYNCING',
  offline: 'OFFLINE',
  error: 'SYNC INTERRUPTED',
} as const;

export default function SyncBanner() {
  const { syncStatus, lastSyncAt, pendingRecords, errorMessage, triggerSync } = useSyncStatus();
  const [expanded, setExpanded] = useState(false);

  if (syncStatus === 'idle') return null;

  const bg = STATUS_BG[syncStatus];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text style={styles.label}>{STATUS_TEXT[syncStatus]}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          {lastSyncAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>LAST SYNC</Text>
              <Text style={styles.detailValue}>{formatTime(lastSyncAt)}</Text>
            </View>
          )}
          {pendingRecords > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PENDING</Text>
              <Text style={styles.detailValue}>{pendingRecords} records</Text>
            </View>
          )}
          {errorMessage && (
            <Text style={styles.errorMsg}>{errorMessage}</Text>
          )}
          {syncStatus === 'error' && (
            <View style={styles.btnRow}>
              <Pressable onPress={triggerSync} style={styles.retryBtn}>
                <Text style={styles.retryText}>RETRY</Text>
              </Pressable>
              <Pressable onPress={() => setExpanded(false)} style={styles.dismissBtn}>
                <Text style={styles.dismissText}>DISMISS</Text>
              </Pressable>
            </View>
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
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderBottomWidth: border.width,
    borderBottomColor: colors.border,
  },
  label: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'center',
  },
  details: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: border.width,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text,
  },
  detailValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.text,
  },
  errorMsg: {
    fontFamily: fonts.body,
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: colors.text,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: {
    fontFamily: fonts.bodyBold,
    color: colors.surface,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  dismissBtn: {
    flex: 1,
    borderWidth: border.width,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
