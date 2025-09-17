import type { Frequency } from '../types';

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isDueOn(date: Date, freq: Frequency, createdAt?: Date): boolean {
  if (freq.type === 'daily') return true;

  if (freq.type === 'weekly') {
    return freq.days?.includes(date.getDay()) ?? false;
  }

  if (freq.type === 'custom' && freq.days?.[0] && createdAt) {
    const start = startOfDay(createdAt);
    const target = startOfDay(date);
    const diff = Math.round((target.getTime() - start.getTime()) / 86400000);
    return diff >= 0 && diff % freq.days[0] === 0;
  }

  return true;
}

export function calculateCurrentStreak(
  completions: string[],
  frequency: Frequency,
  createdAt?: Date,
): number {
  if (completions.length === 0) return 0;

  const set = new Set(completions);
  const today = startOfDay(new Date());
  let date = new Date(today);

  // today isn't over — don't penalize for not completing yet
  if (!set.has(toDateStr(date))) {
    date = addDays(date, -1);
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (!isDueOn(date, frequency, createdAt)) {
      date = addDays(date, -1);
      continue;
    }
    if (set.has(toDateStr(date))) {
      streak++;
      date = addDays(date, -1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateBestStreak(
  completions: string[],
  frequency: Frequency,
  createdAt?: Date,
): number {
  if (completions.length === 0) return 0;

  const sorted = [...completions].sort();
  const set = new Set(sorted);
  const first = new Date(sorted[0]);
  const last = new Date(sorted[sorted.length - 1]);

  let best = 0;
  let current = 0;
  let date = new Date(first);

  while (date <= last) {
    if (!isDueOn(date, frequency, createdAt)) {
      date = addDays(date, 1);
      continue;
    }
    if (set.has(toDateStr(date))) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
    date = addDays(date, 1);
  }

  return best;
}

export function parseFrequency(raw: string): Frequency {
  try { return JSON.parse(raw); }
  catch { return { type: 'daily' }; }
}
