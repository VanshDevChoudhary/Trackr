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

export function parseFrequency(raw: string): Frequency {
  try { return JSON.parse(raw); }
  catch { return { type: 'daily' }; }
}
