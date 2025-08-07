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

// RefreshToken
const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
