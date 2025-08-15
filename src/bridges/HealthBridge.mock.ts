import type { HealthBridge, HeartRateReading, HealthWorkout } from './types';

function hourOfDay(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

// piecewise step curve — morning slow ramp, midday peak, evening taper
function baseStepsForTime(): number {
  const h = hourOfDay();
  if (h < 6) return Math.floor(h * 12);
  if (h < 9) return Math.floor(70 + (h - 6) * 280);
  if (h < 12) return Math.floor(910 + (h - 9) * 550);
  if (h < 14) return Math.floor(2560 + (h - 12) * 480);
  if (h < 17) return Math.floor(3520 + (h - 14) * 620);
  if (h < 20) return Math.floor(5380 + (h - 17) * 430);
  if (h < 22) return Math.floor(6670 + (h - 20) * 180);
  return Math.floor(7030 + (h - 22) * 40);
}

const seededWorkouts: HealthWorkout[] = [
  {
    id: 'mock-run-01',
    type: 'running',
    duration: 1920,
    calories: 347,
    startDate: new Date(Date.now() - 86400000 * 2 + 25200000),
    endDate: new Date(Date.now() - 86400000 * 2 + 27120000),
  },
  {
    id: 'mock-lift-01',
    type: 'strength',
    duration: 2580,
    calories: 198,
    startDate: new Date(Date.now() - 86400000 + 61200000),
    endDate: new Date(Date.now() - 86400000 + 63780000),
  },
];

export class MockHealthBridge implements HealthBridge {
  private stepCount = baseStepsForTime();

  async requestPermissions() {
    return true;
  }

  async getSteps(_date: Date) {
    return this.stepCount;
  }

  async getHeartRate(start: Date, end: Date): Promise<HeartRateReading[]> {
    const readings: HeartRateReading[] = [];
    const gap = 5 * 60_000;
    let cursor = start.getTime();
    while (cursor <= end.getTime()) {
      readings.push({
        timestamp: new Date(cursor),
        bpm: 58 + Math.floor(Math.random() * 40),
      });
      cursor += gap;
    }
    return readings;
  }

  async getCalories(_date: Date) {
    return Math.floor(1850 + this.stepCount * 0.04);
  }

  async getWorkouts(_start: Date, _end: Date) {
    return seededWorkouts;
  }

  subscribeToSteps(callback: (steps: number) => void): () => void {
    callback(this.stepCount);
    const id = setInterval(() => {
      this.stepCount += 2 + Math.floor(Math.random() * 5);
      callback(this.stepCount);
    }, 2000);
    return () => clearInterval(id);
  }
}
