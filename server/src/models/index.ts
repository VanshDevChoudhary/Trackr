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
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
