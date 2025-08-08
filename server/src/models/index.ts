import mongoose, { Schema } from 'mongoose';

const versionVectorSchema = {
  type: Map,
  of: Number,
  required: true,
};

const syncFields = {
  versionVector: versionVectorSchema,
  lastModifiedBy: { type: String, required: true },
  lastModifiedAt: { type: Date, required: true },
};

// User
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: String,
  goals: {
    dailySteps: { type: Number, default: 10000 },
    weeklyWorkouts: { type: Number, default: 3 },
  },
  deviceIds: [String],
}, { timestamps: true });

// Habit
const habitSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  frequency: { type: Schema.Types.Mixed, required: true },
  isDeleted: { type: Boolean, default: false },
  ...syncFields,
  createdAt: { type: Date, required: true },
}, { _id: false });

habitSchema.index({ userId: 1, lastModifiedAt: 1 });

// HabitCompletion
const habitCompletionSchema = new Schema({
  _id: { type: String, required: true },
  habitId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  completedAt: { type: Date, required: true },
  deviceId: { type: String, required: true },
  ...syncFields,
}, { _id: false });

habitCompletionSchema.index({ userId: 1, lastModifiedAt: 1 });
habitCompletionSchema.index({ habitId: 1, date: 1 });

// Workout
const setSchema = new Schema({
  reps: Number,
  weight: Number,
  completed: { type: Boolean, default: false },
}, { _id: false });

const exerciseSchema = new Schema({
  name: { type: String, required: true },
  sets: [setSchema],
  durationSeconds: Number,
  notes: String,
}, { _id: false });

const workoutSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['strength', 'cardio', 'flexibility'] },
  name: String,
  exercises: [exerciseSchema],
  durationSeconds: Number,
  startedAt: { type: Date, required: true },
  source: { type: String, required: true, enum: ['manual', 'healthkit', 'healthconnect'] },
  isDeleted: { type: Boolean, default: false },
  deviceId: { type: String, required: true },
  ...syncFields,
  createdAt: { type: Date, required: true },
}, { _id: false });

workoutSchema.index({ userId: 1, lastModifiedAt: 1 });

// HealthSnapshot
const healthSnapshotSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  steps: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  activeMinutes: { type: Number, default: 0 },
  heartRateAvg: Number,
  heartRateMin: Number,
  heartRateMax: Number,
  deviceId: { type: String, required: true },
  ...syncFields,
}, { _id: false });

healthSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });
healthSnapshotSchema.index({ userId: 1, lastModifiedAt: 1 });

// SyncCursor
const syncCursorSchema = new Schema({
  userId: { type: String, required: true },
  deviceId: { type: String, required: true },
  lastPushAt: { type: Date, required: true },
  lastPullAt: { type: Date, required: true },
  entityCursors: {
    habits: Date,
    completions: Date,
    workouts: Date,
    snapshots: Date,
  },
});

syncCursorSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// RefreshToken
const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
export const Habit = mongoose.model('Habit', habitSchema);
export const HabitCompletion = mongoose.model('HabitCompletion', habitCompletionSchema);
export const Workout = mongoose.model('Workout', workoutSchema);
export const HealthSnapshot = mongoose.model('HealthSnapshot', healthSnapshotSchema);
export const SyncCursor = mongoose.model('SyncCursor', syncCursorSchema);
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
