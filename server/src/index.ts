import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import syncRouter from './routes/sync';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trackr';

app.use(cors());
app.use(express.json());

app.use('/api/v1', healthRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1', userRouter);
app.use('/api/v1', syncRouter);

app.use(errorHandler);

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
