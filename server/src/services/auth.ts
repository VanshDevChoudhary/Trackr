import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, RefreshToken } from '../models';
import { AppError } from '../middleware/error';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function signAccessToken(userId: string, deviceId: string) {
  return jwt.sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '15m' });
}

async function issueRefreshToken(userId: unknown, deviceId: string) {
  const raw = crypto.randomBytes(40).toString('hex');
  await RefreshToken.create({
    userId,
    token: hashToken(raw),
    deviceId,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
  });
  return raw;
}

export async function register(email: string, password: string, deviceId: string, name?: string) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name, deviceIds: [deviceId] });

  const accessToken = signAccessToken(user._id.toString(), deviceId);
  const refreshToken = await issueRefreshToken(user._id, deviceId);

  return {
    user: { id: user._id, email: user.email, name: user.name },
    accessToken,
    refreshToken,
  };
}
