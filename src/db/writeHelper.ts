import Realm from 'realm';
import { getDeviceId } from '../lib/api';
import { incrementVersion, parseVector, serializeVector } from '../sync/versionVector';

let cachedDeviceId: string | null = null;

async function ensureDeviceId(): Promise<string> {
  if (!cachedDeviceId) cachedDeviceId = await getDeviceId();
  return cachedDeviceId;
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type SyncableSchema = {
  _id: string;
  versionVector: string;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  [key: string]: unknown;
};

/**
 * Creates a new record with sync metadata pre-filled.
 * Use this instead of raw realm.write() for any syncable entity.
 */
export async function createRecord<T extends SyncableSchema>(
  realm: Realm,
  schemaClass: { new (): T } & Realm.ObjectClass,
  data: Omit<T, '_id' | 'versionVector' | 'lastModifiedBy' | 'lastModifiedAt'> & { _id?: string },
): Promise<T> {
  const deviceId = await ensureDeviceId();
  const id = data._id || genId();
  const vector = incrementVersion({}, deviceId);

  let created: T | undefined;
  realm.write(() => {
    created = realm.create(schemaClass, {
      ...data,
      _id: id,
      versionVector: serializeVector(vector),
      lastModifiedBy: deviceId,
      lastModifiedAt: new Date(),
    } as unknown as T);
  });

  return created!;
}

/**
 * Updates an existing record and bumps its version vector.
 */
export async function updateRecord<T extends SyncableSchema>(
  realm: Realm,
  schemaClass: { new (): T } & Realm.ObjectClass,
  id: string,
  changes: Partial<Omit<T, '_id' | 'versionVector' | 'lastModifiedBy' | 'lastModifiedAt'>>,
): Promise<T | null> {
  const obj = realm.objectForPrimaryKey(schemaClass, id) as T | null;
  if (!obj) return null;

  const deviceId = await ensureDeviceId();
  const currentVector = parseVector(obj.versionVector);
  const newVector = incrementVersion(currentVector, deviceId);

  realm.write(() => {
    Object.assign(obj, {
      ...changes,
      versionVector: serializeVector(newVector),
      lastModifiedBy: deviceId,
      lastModifiedAt: new Date(),
    });
  });

  return obj;
}

/**
 * Soft-deletes a record (sets isDeleted = true and bumps version).
 */
export async function softDelete<T extends SyncableSchema & { isDeleted: boolean }>(
  realm: Realm,
  schemaClass: { new (): T } & Realm.ObjectClass,
  id: string,
): Promise<boolean> {
  const result = await updateRecord(realm, schemaClass, id, { isDeleted: true } as Partial<Omit<T, '_id' | 'versionVector' | 'lastModifiedBy' | 'lastModifiedAt'>>);
  return result !== null;
}
