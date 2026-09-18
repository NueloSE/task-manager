import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import { authRouter, requireAuth } from './auth';
import { tasksRouter } from './tasks';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Handles broken JSON bodies and any unexpected errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});
