import Realm from 'realm';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { api, getDeviceId } from '../lib/api';
import { Habit, HabitCompletion, Workout, HealthSnapshot, UserProfile, SyncLog } from '../db/schema';
import { compareVectors, mergeVectors, incrementVersion, parseVector, serializeVector } from './versionVector';
import type { VersionVector } from '../types';

type SyncState = 'idle' | 'pushing' | 'pulling' | 'resolving' | 'error' | 'offline';

type EntityType = 'habits' | 'completions' | 'workouts' | 'snapshots' | 'profiles';

type SyncableRecord = {
  _id: string;
  entityType: EntityType;
  data: Record<string, unknown>;
  versionVector: VersionVector;
  lastModifiedBy: string;
  lastModifiedAt: string;
};

type PushResponse = {
  accepted: number;
  conflicts: Array<{
    _id: string;
    entityType: EntityType;
    resolution: 'local_wins' | 'remote_wins';
    mergedVector: VersionVector;
  }>;
};

type PullResponse = {
  records: SyncableRecord[];
  cursors: Record<EntityType, string>;
  hasMore: boolean;
};

export type SyncListener = (state: SyncState, meta?: { error?: string; pending?: number; lastSyncAt?: Date }) => void;

const ENTITY_CLASSES: Record<EntityType, typeof Habit | typeof HabitCompletion | typeof Workout | typeof HealthSnapshot | typeof UserProfile> = {
  habits: Habit,
  completions: HabitCompletion,
  workouts: Workout,
  snapshots: HealthSnapshot,
  profiles: UserProfile,
};

const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const FOREGROUND_SYNC_THRESHOLD = 30_000; // 30s
const CONNECTIVITY_DEBOUNCE = 2_000;

export class SyncEngine {
  private realm: Realm | null = null;
  private deviceId: string = '';
  private state: SyncState = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private lastSyncAt: Date | null = null;
  private retryCount = 0;
  private syncInProgress = false;
  private connectivityTimer: ReturnType<typeof setTimeout> | null = null;
  private netInfoUnsub: (() => void) | null = null;
  private appStateUnsub: ReturnType<typeof AppState.addEventListener> | null = null;
  private cursors: Record<EntityType, string> = {
    habits: '',
    completions: '',
    workouts: '',
    snapshots: '',
    profiles: '',
  };

  async init(realm: Realm) {
    this.realm = realm;
    this.deviceId = await getDeviceId();

    this.netInfoUnsub = NetInfo.addEventListener(this.onNetworkChange);

    this.appStateUnsub = AppState.addEventListener('change', this.onAppStateChange);

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      this.setState('offline');
    }
  }

  destroy() {
    this.netInfoUnsub?.();
    this.appStateUnsub?.remove();
    if (this.connectivityTimer) clearTimeout(this.connectivityTimer);
    this.listeners.clear();
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getState() { return this.state; }
  getLastSyncAt() { return this.lastSyncAt; }
  getDeviceId() { return this.deviceId; }

  getPendingCount(): number {
    if (!this.realm) return 0;
    let count = 0;
    for (const entityType of Object.keys(ENTITY_CLASSES) as EntityType[]) {
      count += this.getDirtyRecords(entityType).length;
    }
    return count;
  }

  async triggerSync() {
    if (this.syncInProgress) return;
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      this.setState('offline');
      return;
    }
    await this.runSyncCycle();
  }

  // --- Private ---

  private setState(state: SyncState, meta?: { error?: string }) {
    this.state = state;
    this.listeners.forEach(fn => fn(state, {
      error: meta?.error,
      pending: this.getPendingCount(),
      lastSyncAt: this.lastSyncAt ?? undefined,
    }));
  }

  private onNetworkChange = (state: NetInfoState) => {
    if (state.isConnected && this.state === 'offline') {
      if (this.connectivityTimer) clearTimeout(this.connectivityTimer);
      this.connectivityTimer = setTimeout(() => this.triggerSync(), CONNECTIVITY_DEBOUNCE);
    } else if (!state.isConnected) {
      this.setState('offline');
    }
  };

  private onAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      const elapsed = this.lastSyncAt ? Date.now() - this.lastSyncAt.getTime() : Infinity;
      if (elapsed > FOREGROUND_SYNC_THRESHOLD) {
        this.triggerSync();
      }
    }
  };

  private async runSyncCycle() {
    if (this.syncInProgress || !this.realm) return;
    this.syncInProgress = true;
    this.retryCount = 0;

    try {
      // Push first, then pull
      this.setState('pushing');
      await this.push();

      this.setState('pulling');
      await this.pull();

      this.lastSyncAt = new Date();
      this.logSync('push', 'success');
      this.setState('idle');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      if (this.retryCount < MAX_RETRIES) {
        this.retryCount++;
        this.syncInProgress = false;
        const backoff = Math.pow(2, this.retryCount) * 1000;
        setTimeout(() => this.runSyncCycle(), backoff);
        return;
      }
      this.logSync('push', 'error', msg);
      this.setState('error', { error: msg });
    } finally {
      this.syncInProgress = false;
    }
  }

  private getDirtyRecords(entityType: EntityType): Realm.Results<Realm.Object> {
    if (!this.realm) return [] as unknown as Realm.Results<Realm.Object>;

    const SchemaClass = ENTITY_CLASSES[entityType];
    const cursor = this.cursors[entityType];

    if (!cursor) {
      // No cursor means first sync — nothing is "dirty" per se,
      // but we push everything that has our deviceId as lastModifiedBy
      return this.realm.objects(SchemaClass).filtered(
        'lastModifiedBy == $0', this.deviceId,
      );
    }

    return this.realm.objects(SchemaClass).filtered(
      'lastModifiedAt > $0', new Date(cursor),
    );
  }

  private serializeRecord(obj: Realm.Object, entityType: EntityType): SyncableRecord {
    const raw = obj.toJSON() as Record<string, unknown>;
    return {
      _id: raw._id as string,
      entityType,
      data: raw,
      versionVector: parseVector(raw.versionVector as string),
      lastModifiedBy: raw.lastModifiedBy as string,
      lastModifiedAt: (raw.lastModifiedAt as Date).toISOString(),
    };
  }

  private async push() {
    if (!this.realm) return;

    for (const entityType of Object.keys(ENTITY_CLASSES) as EntityType[]) {
      const dirty = this.getDirtyRecords(entityType);
      if (dirty.length === 0) continue;

      const records = dirty.slice(0, BATCH_SIZE).map(obj => this.serializeRecord(obj, entityType));

      const response = await api<PushResponse>('/sync/push', {
        method: 'POST',
        body: JSON.stringify({ records, deviceId: this.deviceId }),
      });

      // Handle conflicts
      if (response.conflicts?.length) {
        this.setState('resolving');
        for (const conflict of response.conflicts) {
          this.applyConflictResolution(conflict.entityType, conflict._id, conflict.mergedVector);
        }
      }
    }
  }

  private async pull() {
    if (!this.realm) return;

    let hasMore = true;
    while (hasMore) {
      const response = await api<PullResponse>('/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ cursors: this.cursors, deviceId: this.deviceId }),
      });

      for (const record of response.records) {
        this.applyPulledRecord(record);
      }

      // Update cursors
      for (const [entity, cursor] of Object.entries(response.cursors)) {
        if (cursor) this.cursors[entity as EntityType] = cursor;
      }

      hasMore = response.hasMore;
    }
  }

  private applyPulledRecord(record: SyncableRecord) {
    if (!this.realm) return;

    const SchemaClass = ENTITY_CLASSES[record.entityType];
    const local = this.realm.objectForPrimaryKey(SchemaClass, record._id);

    if (!local) {
      // New record — insert
      this.realm.write(() => {
        this.realm!.create(SchemaClass, {
          ...record.data,
          versionVector: serializeVector(record.versionVector),
          lastModifiedAt: new Date(record.lastModifiedAt),
        });
      });
      return;
    }

    const localRaw = local.toJSON() as Record<string, unknown>;
    const localVector = parseVector(localRaw.versionVector as string);
    const comparison = compareVectors(localVector, record.versionVector);

    switch (comparison) {
      case 'b_dominates':
        // Server is ahead — update local
        this.realm.write(() => {
          const updates = { ...record.data };
          updates.versionVector = serializeVector(record.versionVector);
          updates.lastModifiedAt = new Date(record.lastModifiedAt);
          this.realm!.create(SchemaClass, updates, Realm.UpdateMode.Modified);
        });
        break;

      case 'a_dominates':
      case 'equal':
        // Local is ahead or equal — skip
        break;

      case 'conflict':
        this.resolveAndApply(record.entityType, local, localVector, record);
        break;
    }
  }

  private resolveAndApply(
    entityType: EntityType,
    local: Realm.Object,
    localVector: VersionVector,
    remote: SyncableRecord,
  ) {
    if (!this.realm) return;

    const winner = this.resolveConflict(entityType, local, remote);
    const merged = incrementVersion(
      mergeVectors(localVector, remote.versionVector),
      this.deviceId,
    );

    if (winner === 'local') {
      // Keep local data but update the vector
      this.realm.write(() => {
        const obj = this.realm!.objectForPrimaryKey(ENTITY_CLASSES[entityType], remote._id);
        if (obj) {
          (obj as unknown as Record<string, unknown>).versionVector = serializeVector(merged);
        }
      });
    } else {
      this.realm.write(() => {
        const updates = { ...remote.data };
        updates.versionVector = serializeVector(merged);
        updates.lastModifiedAt = new Date(remote.lastModifiedAt);
        this.realm!.create(ENTITY_CLASSES[entityType], updates, Realm.UpdateMode.Modified);
      });
    }
  }

  private resolveConflict(
    entityType: EntityType,
    local: Realm.Object,
    remote: SyncableRecord,
  ): 'local' | 'remote' {
    // Profile/settings → last write wins
    // Everything else → device wins (current pusher wins)
    if (entityType === 'habits') {
      // For habits, device wins means: the version whose lastModifiedBy matches
      // the pushing device wins. On pull conflicts, we favor local since user is on this device.
      return 'local';
    }

    // healthSnapshot, habitCompletion, workout → device wins
    // The device that has the record is the authority
    return 'local';
  }

  private applyConflictResolution(entityType: EntityType, recordId: string, mergedVector: VersionVector) {
    if (!this.realm) return;
    const SchemaClass = ENTITY_CLASSES[entityType];
    const obj = this.realm.objectForPrimaryKey(SchemaClass, recordId);
    if (!obj) return;

    this.realm.write(() => {
      (obj as unknown as Record<string, unknown>).versionVector = serializeVector(mergedVector);
    });
  }

  private logSync(direction: string, status: string, errorMessage?: string) {
    if (!this.realm) return;
    try {
      this.realm.write(() => {
        this.realm!.create(SyncLog, {
          _id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          timestamp: new Date(),
          direction,
          status,
          recordsPushed: 0,
          recordsPulled: 0,
          conflicts: 0,
          errorMessage,
        });
      });
    } catch {
      // non-critical, don't break sync
    }
  }
}
