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
