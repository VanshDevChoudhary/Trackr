import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { wrap, AppError } from '../middleware/error';
import { User } from '../models';

const router = Router();

router.get('/user/profile', requireAuth, wrap(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new AppError('User not found', 404);

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    goals: user.goals,
  });
}));

router.put('/user/profile', requireAuth, wrap(async (req, res) => {
  const { name, goals } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (goals !== undefined) updates.goals = goals;

  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
  if (!user) throw new AppError('User not found', 404);

  res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    goals: user.goals,
  });
}));

export default router;
