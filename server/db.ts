import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import fs from 'node:fs';

fs.mkdirSync('data', { recursive: true });

export const db = new Database(process.env.DB_PATH ?? 'data/tasks.db');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    passwordHash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
    dueDate TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

// Demo account so testers can try the app without signing up
if (!db.prepare('SELECT id FROM users WHERE username = ?').get('demo')) {
  const { lastInsertRowid: userId } = db
    .prepare('INSERT INTO users (username, passwordHash) VALUES (?, ?)')
    .run('demo', bcrypt.hashSync('demo1234', 10));

  const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA');
  const addTask = db.prepare(
    'INSERT INTO tasks (userId, title, description, status, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const now = new Date().toISOString();

  addTask.run(userId, 'Welcome to the demo account', 'Try editing, completing or deleting this task.', 'todo', daysFromNow(3), now);
  addTask.run(userId, 'Prepare weekly report', 'Summarise progress and blockers for the team.', 'in_progress', daysFromNow(0), now);
  addTask.run(userId, 'Pay electricity bill', 'Pay before the end of the week to avoid a late fee.', 'todo', daysFromNow(-2), now);
  addTask.run(userId, 'Book dentist appointment', '', 'done', daysFromNow(-5), now);
  addTask.run(userId, 'Plan team lunch', 'Find a place that works for everyone.', 'todo', daysFromNow(7), now);
  addTask.run(userId, 'Renew car insurance', '', 'todo', daysFromNow(10), now);
  addTask.run(userId, 'Update CV', 'Add the latest project.', 'done', daysFromNow(-3), now);
}
