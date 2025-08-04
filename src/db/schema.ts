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
