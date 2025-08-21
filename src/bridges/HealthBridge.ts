export type { HeartRateReading, HealthWorkout, HealthBridge } from './types';
import type { HealthBridge } from './types';
import { MockHealthBridge } from './HealthBridge.mock';

export const healthBridge: HealthBridge = new MockHealthBridge();
