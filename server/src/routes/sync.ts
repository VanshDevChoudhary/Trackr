import { Router } from 'express';
import { z } from 'zod';
import { Habit, HabitCompletion, Workout, HealthSnapshot, SyncCursor } from '../models';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { wrap } from '../middleware/error';
import type { Model } from 'mongoose';

const router = Router();

type EntityType = 'habits' | 'completions' | 'workouts' | 'snapshots';

const ENTITY_MODELS: Record<EntityType, Model<any>> = {
  habits: Habit,
  completions: HabitCompletion,
  workouts: Workout,
  snapshots: HealthSnapshot,
};

// --- Version vector helpers (server-side) ---

type VV = Record<string, number>;

function compareVectors(a: VV, b: VV): 'a_dominates' | 'b_dominates' | 'conflict' | 'equal' {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aGreater = false;
  let bGreater = false;
  for (const key of allKeys) {
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    if (aVal > bVal) aGreater = true;
    if (bVal > aVal) bGreater = true;
  }
  if (aGreater && !bGreater) return 'a_dominates';
  if (bGreater && !aGreater) return 'b_dominates';
  if (!aGreater && !bGreater) return 'equal';
  return 'conflict';
}

function mergeVectors(a: VV, b: VV): VV {
  const merged: VV = { ...a };
  for (const [key, val] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, val);
  }
  return merged;
}

function mapToObj(map: Map<string, number> | Record<string, number> | undefined): VV {
  if (!map) return {};
  if (map instanceof Map) {
    const obj: VV = {};
    map.forEach((v, k) => { obj[k] = v; });
    return obj;
  }
  return map;
}

function objToMap(obj: VV): Map<string, number> {
  return new Map(Object.entries(obj));
}

// --- Validation ---

const syncRecordSchema = z.object({
  _id: z.string(),
  entityType: z.enum(['habits', 'completions', 'workouts', 'snapshots']),
  data: z.record(z.string(), z.unknown()),
  versionVector: z.record(z.string(), z.number()),
  lastModifiedBy: z.string(),
  lastModifiedAt: z.string(),
});

const pushBody = z.object({
  records: z.array(syncRecordSchema).max(500),
  deviceId: z.string(),
});

const pullBody = z.object({
  cursors: z.object({
    habits: z.string().optional().default(''),
    completions: z.string().optional().default(''),
    workouts: z.string().optional().default(''),
    snapshots: z.string().optional().default(''),
  }),
  deviceId: z.string(),
});

// --- Push ---

router.post('/sync/push', requireAuth, validate(pushBody), wrap(async (req, res) => {
  const { records, deviceId } = req.body;
  const userId = req.userId!;

  let accepted = 0;
  const conflicts: Array<{
    _id: string;
    entityType: EntityType;
    resolution: 'local_wins' | 'remote_wins';
    mergedVector: VV;
  }> = [];

  for (const record of records) {
    const model = ENTITY_MODELS[record.entityType as EntityType];
    if (!model) continue;

    const existing = await model.findById(record._id);

    if (!existing) {
      // New record
      const doc: Record<string, unknown> = {
        ...record.data,
        _id: record._id,
        userId,
        versionVector: objToMap(record.versionVector),
        lastModifiedBy: record.lastModifiedBy,
        lastModifiedAt: new Date(record.lastModifiedAt),
      };

      // Remove Realm-only fields
      delete doc.versionVector;
      await model.create({
        ...doc,
        versionVector: objToMap(record.versionVector),
      });
      accepted++;
      continue;
    }

    const serverVector = mapToObj(existing.versionVector);
    const clientVector = record.versionVector;
    const comparison = compareVectors(clientVector, serverVector);

    if (comparison === 'a_dominates' || comparison === 'equal') {
      // Client is ahead or equal — accept
      existing.set({
        ...record.data,
        versionVector: objToMap(clientVector),
        lastModifiedBy: record.lastModifiedBy,
        lastModifiedAt: new Date(record.lastModifiedAt),
      });
      await existing.save();
      accepted++;
    } else if (comparison === 'b_dominates') {
      // Server is ahead — reject (client needs to pull)
      accepted++;
    } else {
      // Conflict
      const resolution = resolveConflict(record.entityType as EntityType);
      const merged = mergeVectors(clientVector, serverVector);
      merged[deviceId] = (merged[deviceId] ?? 0) + 1;

      if (resolution === 'local_wins') {
        existing.set({
          ...record.data,
          versionVector: objToMap(merged),
          lastModifiedBy: deviceId,
          lastModifiedAt: new Date(),
        });
        await existing.save();
      } else {
        // Server data stays, but update vector
        existing.versionVector = objToMap(merged);
        existing.lastModifiedAt = new Date();
        await existing.save();
      }

      conflicts.push({
        _id: record._id,
        entityType: record.entityType as EntityType,
        resolution,
        mergedVector: merged,
      });
    }
  }

  // Update sync cursor
  await SyncCursor.findOneAndUpdate(
    { userId, deviceId },
    { $set: { lastPushAt: new Date() } },
    { upsert: true },
  );

  res.json({ accepted, conflicts });
}));

// --- Pull ---

router.post('/sync/pull', requireAuth, validate(pullBody), wrap(async (req, res) => {
  const { cursors, deviceId } = req.body;
  const userId = req.userId!;

  const allRecords: Array<{
    _id: string;
    entityType: EntityType;
    data: Record<string, unknown>;
    versionVector: VV;
    lastModifiedBy: string;
    lastModifiedAt: string;
  }> = [];

  const newCursors: Record<EntityType, string> = {
    habits: '',
    completions: '',
    workouts: '',
    snapshots: '',
  };

  let totalRecords = 0;
  const PER_ENTITY_LIMIT = 500;

  for (const [entityType, model] of Object.entries(ENTITY_MODELS) as [EntityType, Model<any>][]) {
    const cursor = cursors[entityType];
    const query: Record<string, unknown> = { userId };

    if (cursor) {
      query.lastModifiedAt = { $gt: new Date(cursor) };
    }

    const docs = await model
      .find(query)
      .sort({ lastModifiedAt: 1 })
      .limit(PER_ENTITY_LIMIT)
      .lean();

    for (const doc of docs) {
      const raw = doc as Record<string, unknown>;
      allRecords.push({
        _id: raw._id as string,
        entityType,
        data: raw,
        versionVector: mapToObj(raw.versionVector as Map<string, number>),
        lastModifiedBy: raw.lastModifiedBy as string,
        lastModifiedAt: (raw.lastModifiedAt as Date).toISOString(),
      });
    }

    if (docs.length > 0) {
      const last = docs[docs.length - 1] as Record<string, unknown>;
      newCursors[entityType] = (last.lastModifiedAt as Date).toISOString();
    } else {
      newCursors[entityType] = cursor || '';
    }

    totalRecords += docs.length;
  }

  // Update pull cursor
  await SyncCursor.findOneAndUpdate(
    { userId, deviceId },
    { $set: { lastPullAt: new Date(), entityCursors: newCursors } },
    { upsert: true },
  );

  const hasMore = Object.entries(ENTITY_MODELS).some(([entityType]) => {
    const cursor = newCursors[entityType as EntityType];
    return cursor !== '' && allRecords.filter(r => r.entityType === entityType).length >= PER_ENTITY_LIMIT;
  });

  res.json({ records: allRecords, cursors: newCursors, hasMore });
}));

function resolveConflict(entityType: EntityType): 'local_wins' | 'remote_wins' {
  // "local" here means the pushing device (the client that sent the data)
  // All entity types currently use device-wins strategy
  return 'local_wins';
}

export default router;
