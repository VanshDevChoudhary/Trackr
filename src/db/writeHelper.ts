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

type SchemaClass = { schema: Realm.ObjectSchema; new (...args: any[]): any };

/**
 * Creates a new record with sync metadata pre-filled.
 * Use this instead of raw realm.write() for any syncable entity.
 */
export async function createRecord<T = any>(
  realm: Realm,
  schemaClass: SchemaClass,
  data: Record<string, any>,
): Promise<T> {
  const deviceId = await ensureDeviceId();
  const id = data._id || genId();
  const vector = incrementVersion({}, deviceId);

  let created: any;
  realm.write(() => {
    created = realm.create(schemaClass as any, {
      ...data,
      _id: id,
      versionVector: serializeVector(vector),
      lastModifiedBy: deviceId,
      lastModifiedAt: new Date(),
    });
  });

  return created as T;
}

/**
 * Updates an existing record and bumps its version vector.
 */
export async function updateRecord<T = any>(
  realm: Realm,
  schemaClass: SchemaClass,
  id: string,
  changes: Record<string, any>,
): Promise<T | null> {
  const obj = realm.objectForPrimaryKey(schemaClass.schema.name, id as any);
  if (!obj) return null;

  const deviceId = await ensureDeviceId();
  const currentVector = parseVector((obj as any).versionVector);
  const newVector = incrementVersion(currentVector, deviceId);

  realm.write(() => {
    Object.assign(obj, {
      ...changes,
      versionVector: serializeVector(newVector),
      lastModifiedBy: deviceId,
      lastModifiedAt: new Date(),
    });
  });

  return obj as T;
}

/**
 * Soft-deletes a record (sets isDeleted = true and bumps version).
 */
export async function softDelete(
  realm: Realm,
  schemaClass: SchemaClass,
  id: string,
): Promise<boolean> {
  const result = await updateRecord(realm, schemaClass, id, { isDeleted: true });
  return result !== null;
}
