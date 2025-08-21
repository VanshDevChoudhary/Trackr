export type { HeartRateReading, HealthWorkout, HealthBridge } from './types';
import type { HealthBridge, HeartRateReading, HealthWorkout } from './types';
import { MockHealthBridge } from './HealthBridge.mock';

let NativeHealthBridge: Record<string, (...args: unknown[]) => unknown> | null = null;
let emitter: { addListener: (name: string, fn: (e: Record<string, number>) => void) => { remove(): void } } | null = null;

try {
  const ExpoModules = require('expo-modules-core');
  NativeHealthBridge = ExpoModules.requireNativeModule('HealthBridge');
  emitter = new ExpoModules.EventEmitter(NativeHealthBridge);
} catch {
  // native module unavailable (Expo Go, web, etc)
}

class IOSHealthBridge implements HealthBridge {
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

  subscribeToSteps(callback: (steps: number) => void): () => void {
    const sub = emitter!.addListener('onStepUpdate', (event) => {
      callback(event.steps);
    });
    (NativeHealthBridge!.startStepObserver as () => void)();
    return () => {
      sub.remove();
      (NativeHealthBridge!.stopStepObserver as () => void)();
    };
  }
}

const mock = new MockHealthBridge();
export const healthBridge: HealthBridge = NativeHealthBridge ? new IOSHealthBridge() : mock;
