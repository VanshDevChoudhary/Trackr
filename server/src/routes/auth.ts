import { Router } from 'express';
import { validate, registerBody, loginBody } from '../middleware/validate';
import { wrap } from '../middleware/error';
import * as authService from '../services/auth';

const router = Router();

router.post('/auth/register', validate(registerBody), wrap(async (req, res) => {
  const { email, password, deviceId, name } = req.body;
  const result = await authService.register(email, password, deviceId, name);
  res.status(201).json(result);
}));

router.post('/auth/login', validate(loginBody), wrap(async (req, res) => {
  const { email, password, deviceId } = req.body;
  const result = await authService.login(email, password, deviceId);
  res.json(result);
}));

export default router;
