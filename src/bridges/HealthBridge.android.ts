export type { HeartRateReading, HealthWorkout, HealthBridge } from './types';
import type { HealthBridge, HeartRateReading, HealthWorkout } from './types';
import { MockHealthBridge } from './HealthBridge.mock';

let NativeHealthBridge: Record<string, (...args: unknown[]) => unknown> | null = null;

try {
  const ExpoModules = require('expo-modules-core');
  NativeHealthBridge = ExpoModules.requireNativeModule('HealthBridge');
} catch {
  // Health Connect not available
}

class AndroidHealthBridge implements HealthBridge {
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  async requestPermissions(): Promise<boolean> {
    return (NativeHealthBridge!.requestPermissions as () => Promise<boolean>)();
  }

  async getSteps(date: Date): Promise<number> {
    return (NativeHealthBridge!.getSteps as (ts: number) => Promise<number>)(date.getTime());
  }

  async getHeartRate(start: Date, end: Date): Promise<HeartRateReading[]> {
    const raw = await (NativeHealthBridge!.getHeartRate as (s: number, e: number) => Promise<Array<{ timestamp: number; bpm: number }>>)(
      start.getTime(),
      end.getTime()
    );
    return raw.map((r) => ({ timestamp: new Date(r.timestamp), bpm: r.bpm }));
  }

  async getCalories(date: Date): Promise<number> {
    return (NativeHealthBridge!.getCalories as (ts: number) => Promise<number>)(date.getTime());
  }

  async getWorkouts(start: Date, end: Date): Promise<HealthWorkout[]> {
    const raw = await (NativeHealthBridge!.getWorkouts as (s: number, e: number) => Promise<Array<{
      id: string; type: string; duration: number; calories: number; startDate: number; endDate: number;
    }>>)(start.getTime(), end.getTime());
    return raw.map((w) => ({
      ...w,
      startDate: new Date(w.startDate),
      endDate: new Date(w.endDate),
    }));
  }

  // Android has no push-based step updates — poll every 30s
  subscribeToSteps(callback: (steps: number) => void): () => void {
    const poll = async () => {
      try {
        const steps = await this.getSteps(new Date());
        callback(steps);
      } catch { /* swallow */ }
    };
    poll();
    this.pollTimer = setInterval(poll, 30_000);
    return () => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    };
  }
}

const mock = new MockHealthBridge();
export const healthBridge: HealthBridge = NativeHealthBridge ? new AndroidHealthBridge() : mock;
