import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRealm } from '@realm/react';
import { SyncEngine, SyncListener } from '../sync/engine';
import { useAuth } from './AuthContext';

type SyncContextValue = {
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  lastSyncAt: Date | null;
  pendingRecords: number;
  errorMessage: string | null;
  triggerSync: () => void;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSyncStatus() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSyncStatus outside SyncProvider');
  return ctx;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const realm = useRealm();
  const { isAuthenticated } = useAuth();
  const engineRef = useRef<SyncEngine | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncContextValue['syncStatus']>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !realm) return;

    const engine = new SyncEngine();
    engineRef.current = engine;

    const listener: SyncListener = (state, meta) => {
      switch (state) {
        case 'pushing':
        case 'pulling':
        case 'resolving':
          setSyncStatus('syncing');
          break;
        case 'offline':
          setSyncStatus('offline');
          break;
        case 'error':
          setSyncStatus('error');
          setErrorMessage(meta?.error ?? 'Unknown error');
          break;
        default:
          setSyncStatus('idle');
          setErrorMessage(null);
      }

      if (meta?.lastSyncAt) setLastSyncAt(meta.lastSyncAt);
      if (meta?.pending !== undefined) setPendingRecords(meta.pending);
    };

    engine.subscribe(listener);
    engine.init(realm).then(() => {
      engine.triggerSync();
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [isAuthenticated, realm]);

  const triggerSync = useCallback(() => {
    engineRef.current?.triggerSync();
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, lastSyncAt, pendingRecords, errorMessage, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}
