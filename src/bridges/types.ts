export type HeartRateReading = {
  timestamp: Date;
  bpm: number;
};

export type HealthWorkout = {
  id: string;
  type: string;
  duration: number;
  calories: number;
  startDate: Date;
  endDate: Date;
};

export interface HealthBridge {
  requestPermissions(): Promise<boolean>;
  getSteps(date: Date): Promise<number>;
  getHeartRate(start: Date, end: Date): Promise<HeartRateReading[]>;
  getCalories(date: Date): Promise<number>;
  getWorkouts(start: Date, end: Date): Promise<HealthWorkout[]>;
  subscribeToSteps(callback: (steps: number) => void): () => void;
}
