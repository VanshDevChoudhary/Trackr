import type { VersionVector } from '../types';

export function incrementVersion(vector: VersionVector, deviceId: string): VersionVector {
  return { ...vector, [deviceId]: (vector[deviceId] ?? 0) + 1 };
}

type CompareResult = 'a_dominates' | 'b_dominates' | 'conflict' | 'equal';

export function compareVectors(a: VersionVector, b: VersionVector): CompareResult {
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

export function mergeVectors(a: VersionVector, b: VersionVector): VersionVector {
  const merged: VersionVector = { ...a };
  for (const [key, val] of Object.entries(b)) {
    merged[key] = Math.max(merged[key] ?? 0, val);
  }
  return merged;
}

// Realm stores version vectors as JSON strings
export function parseVector(raw: string): VersionVector {
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

export function serializeVector(v: VersionVector): string {
  return JSON.stringify(v);
}
