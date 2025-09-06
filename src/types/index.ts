export type HealthReading = {
  type: 'steps' | 'calories' | 'activeMinutes' | 'heartRate';
  value: number;
  timestamp: Date;
  source: 'healthkit' | 'healthconnect' | 'manual';
};

export type SyncStatus = 'idle' | 'pushing' | 'pulling' | 'resolving' | 'error' | 'offline';

export type SyncDirection = 'push' | 'pull';

export type FrequencyType = 'daily' | 'weekly' | 'custom';

export type Frequency = {
  type: FrequencyType;
  days?: number[];
};

export type VersionVector = Record<string, number>;

export type WorkoutType = 'strength' | 'cardio' | 'flexibility';

export type WorkoutSource = 'manual' | 'healthkit' | 'healthconnect';
