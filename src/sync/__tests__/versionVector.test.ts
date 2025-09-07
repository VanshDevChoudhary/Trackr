import { incrementVersion, compareVectors, mergeVectors, parseVector, serializeVector } from '../versionVector';

describe('incrementVersion', () => {
  test('new device', () => {
    expect(incrementVersion({}, 'phone')).toEqual({ phone: 1 });
  });

  test('existing device', () => {
    expect(incrementVersion({ phone: 3 }, 'phone')).toEqual({ phone: 4 });
  });

  test('second device added', () => {
    expect(incrementVersion({ phone: 2 }, 'tablet')).toEqual({ phone: 2, tablet: 1 });
  });

  test('does not mutate input', () => {
    const v = { phone: 1 };
    incrementVersion(v, 'phone');
    expect(v).toEqual({ phone: 1 });
  });
});

describe('compareVectors', () => {
  test('empty vectors', () => {
    expect(compareVectors({}, {})).toBe('equal');
  });

  test('equal vectors', () => {
    expect(compareVectors({ phone: 2, tablet: 1 }, { phone: 2, tablet: 1 })).toBe('equal');
  });

  test('a dominates', () => {
    expect(compareVectors({ phone: 3 }, { phone: 2 })).toBe('a_dominates');
  });

  test('b dominates', () => {
    expect(compareVectors({ phone: 1 }, { phone: 2 })).toBe('b_dominates');
  });

  test('a dominates - multiple keys', () => {
    expect(compareVectors({ phone: 3, tablet: 2 }, { phone: 2, tablet: 1 })).toBe('a_dominates');
  });

  test('conflict - concurrent edits', () => {
    expect(compareVectors({ phone: 2 }, { phone: 1, tablet: 1 })).toBe('conflict');
  });

  test('missing key treated as 0', () => {
    expect(compareVectors({ phone: 1 }, { tablet: 1 })).toBe('conflict');
  });

  test('a dominates with missing key in b', () => {
    expect(compareVectors({ phone: 1, tablet: 1 }, { phone: 1 })).toBe('a_dominates');
  });

  test('b dominates with missing key in a', () => {
    expect(compareVectors({ phone: 1 }, { phone: 1, tablet: 1 })).toBe('b_dominates');
  });

  test('three devices - no conflict', () => {
    const a = { phone: 3, tablet: 2, watch: 1 };
    const b = { phone: 2, tablet: 2, watch: 1 };
    expect(compareVectors(a, b)).toBe('a_dominates');
  });

  test('three devices - conflict', () => {
    const a = { phone: 3, tablet: 1, watch: 2 };
    const b = { phone: 2, tablet: 2, watch: 2 };
    expect(compareVectors(a, b)).toBe('conflict');
  });

  test('empty vs non-empty', () => {
    expect(compareVectors({}, { phone: 1 })).toBe('b_dominates');
    expect(compareVectors({ phone: 1 }, {})).toBe('a_dominates');
  });
});

describe('mergeVectors', () => {
  test('empty vectors', () => {
    expect(mergeVectors({}, {})).toEqual({});
  });

  test('disjoint keys', () => {
    expect(mergeVectors({ phone: 2 }, { tablet: 3 })).toEqual({ phone: 2, tablet: 3 });
  });

  test('overlapping keys - takes max', () => {
    expect(mergeVectors({ phone: 2, tablet: 3 }, { phone: 5, tablet: 1 }))
      .toEqual({ phone: 5, tablet: 3 });
  });

  test('three devices merge', () => {
    const a = { phone: 3, tablet: 1 };
    const b = { tablet: 2, watch: 1 };
    expect(mergeVectors(a, b)).toEqual({ phone: 3, tablet: 2, watch: 1 });
  });

  test('does not mutate inputs', () => {
    const a = { phone: 1 };
    const b = { phone: 2 };
    mergeVectors(a, b);
    expect(a).toEqual({ phone: 1 });
    expect(b).toEqual({ phone: 2 });
  });
});

describe('serialization', () => {
  test('round trip', () => {
    const v = { phone: 3, tablet: 1 };
    expect(parseVector(serializeVector(v))).toEqual(v);
  });

  test('parse empty string', () => {
    expect(parseVector('')).toEqual({});
  });

  test('parse garbage', () => {
    expect(parseVector('not json')).toEqual({});
  });
});
