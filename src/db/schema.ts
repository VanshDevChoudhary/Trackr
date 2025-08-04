import Realm from 'realm';

export class Habit extends Realm.Object<Habit> {
  _id!: string;
  userId!: string;
  name!: string;
  icon!: string;
  color!: string;
  frequency!: string;
  isDeleted!: boolean;
  versionVector!: string;
  lastModifiedBy!: string;
  lastModifiedAt!: Date;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Habit',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      userId: { type: 'string', indexed: true },
      name: 'string',
      icon: 'string',
      color: 'string',
      frequency: 'string',
      isDeleted: { type: 'bool', default: false },
      versionVector: 'string',
      lastModifiedBy: 'string',
      lastModifiedAt: 'date',
      createdAt: 'date',
    },
  };
}

export class HabitCompletion extends Realm.Object<HabitCompletion> {
  _id!: string;
  habitId!: string;
  userId!: string;
  date!: string;
  completedAt!: Date;
  deviceId!: string;
  versionVector!: string;
  lastModifiedBy!: string;
  lastModifiedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'HabitCompletion',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      habitId: { type: 'string', indexed: true },
      userId: { type: 'string', indexed: true },
      date: 'string',
      completedAt: 'date',
      deviceId: 'string',
      versionVector: 'string',
      lastModifiedBy: 'string',
      lastModifiedAt: 'date',
    },
  };
}

export class WorkoutSet extends Realm.Object<WorkoutSet> {
  reps!: number;
  weight!: number;
  completed!: boolean;

  static schema: Realm.ObjectSchema = {
    name: 'WorkoutSet',
    embedded: true,
    properties: {
      reps: 'int',
      weight: 'double',
      completed: { type: 'bool', default: false },
    },
  };
}

export class Exercise extends Realm.Object<Exercise> {
  name!: string;
  sets!: Realm.List<WorkoutSet>;
  durationSeconds?: number;
  notes?: string;

  static schema: Realm.ObjectSchema = {
    name: 'Exercise',
    embedded: true,
    properties: {
      name: 'string',
      sets: 'WorkoutSet[]',
      durationSeconds: 'int?',
      notes: 'string?',
    },
  };
}

export class Workout extends Realm.Object<Workout> {
  _id!: string;
  userId!: string;
  type!: string;
  name?: string;
  exercises!: Realm.List<Exercise>;
  durationSeconds?: number;
  startedAt!: Date;
  source!: string;
  isDeleted!: boolean;
  deviceId!: string;
  versionVector!: string;
  lastModifiedBy!: string;
  lastModifiedAt!: Date;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Workout',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      userId: { type: 'string', indexed: true },
      type: 'string',
      name: 'string?',
      exercises: 'Exercise[]',
      durationSeconds: 'int?',
      startedAt: 'date',
      source: 'string',
      isDeleted: { type: 'bool', default: false },
      deviceId: 'string',
      versionVector: 'string',
      lastModifiedBy: 'string',
      lastModifiedAt: 'date',
      createdAt: 'date',
    },
  };
}

export class HealthSnapshot extends Realm.Object<HealthSnapshot> {
  _id!: string;
  userId!: string;
  date!: string;
  steps!: number;
  calories!: number;
  activeMinutes!: number;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  deviceId!: string;
  versionVector!: string;
  lastModifiedBy!: string;
  lastModifiedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'HealthSnapshot',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      userId: { type: 'string', indexed: true },
      date: { type: 'string', indexed: true },
      steps: { type: 'int', default: 0 },
      calories: { type: 'int', default: 0 },
      activeMinutes: { type: 'int', default: 0 },
      heartRateAvg: 'int?',
      heartRateMin: 'int?',
      heartRateMax: 'int?',
      deviceId: 'string',
      versionVector: 'string',
      lastModifiedBy: 'string',
      lastModifiedAt: 'date',
    },
  };
}

export class SyncLog extends Realm.Object<SyncLog> {
  _id!: string;
  timestamp!: Date;
  direction!: string;
  recordsPushed!: number;
  recordsPulled!: number;
  conflicts!: number;
  status!: string;
  errorMessage?: string;

  static schema: Realm.ObjectSchema = {
    name: 'SyncLog',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      timestamp: 'date',
      direction: 'string',
      recordsPushed: { type: 'int', default: 0 },
      recordsPulled: { type: 'int', default: 0 },
      conflicts: { type: 'int', default: 0 },
      status: 'string',
      errorMessage: 'string?',
    },
  };
}
