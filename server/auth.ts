import bcrypt from 'bcryptjs';
import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret';

type User = { id: number; username: string; passwordHash: string };

export const authRouter = Router();

function setLoginCookie(res: Response, userId: number) {
  const token = jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
  // httpOnly: JavaScript on the page can't read the token
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

authRouter.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || !/^\w{3,30}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 letters, numbers or underscores' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ error: 'That username is already taken' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)')
    .run(username, passwordHash);

  setLoginCookie(res, Number(lastInsertRowid));
  res.status(201).json({ id: Number(lastInsertRowid), username });
});

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  // Same message either way, so nobody can find out which usernames exist
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  setLoginCookie(res, user.id);
  res.json({ id: user.id, username: user.username });
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(res.locals.user);
});

// Only lets the request through if the login cookie is valid
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromToken(req.cookies.token);
  if (!user) {
    return res.status(401).json({ error: 'Please log in' });
  }
  res.locals.user = user;
  next();
}

function getUserFromToken(token: string) {
  try {
    const { userId } = jwt.verify(token, SECRET) as { userId: number };
    return db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  } catch {
    return undefined; // missing, expired or fake token
  }
}
