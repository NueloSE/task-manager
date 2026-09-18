import { Router } from 'express';
import { db } from './db';

export const tasksRouter = Router();

const COLUMNS = 'id, title, description, status, dueDate, createdAt';
const STATUSES = ['todo', 'in_progress', 'done'];

// Checks the request body and returns either an error message or the cleaned-up task
function readTask(body: any) {
  const { title, description = '', status = 'todo', dueDate } = body ?? {};

  if (typeof title !== 'string' || !title.trim()) return { error: 'Title is required' };
  if (title.trim().length > 100) return { error: 'Title must be 100 characters or less' };
  if (typeof description !== 'string' || description.length > 1000) {
    return { error: 'Description must be 1000 characters or less' };
  }
  if (!STATUSES.includes(status)) return { error: 'Status must be todo, in_progress or done' };
  if (!isValidDate(dueDate)) return { error: 'Due date must be a valid date (YYYY-MM-DD)' };

  return { task: { title: title.trim(), description: description.trim(), status, dueDate } };
}

// JavaScript turns 2026-02-30 into March 2, so check the date didn't change
function isValidDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Every query includes userId, so users can only see and change their own tasks
function findTask(id: unknown, userId: number) {
  return db.prepare(`SELECT ${COLUMNS} FROM tasks WHERE id = ? AND userId = ?`).get(id, userId);
}

tasksRouter.get('/', (req, res) => {
  const tasks = db
    .prepare(`SELECT ${COLUMNS} FROM tasks WHERE userId = ? ORDER BY dueDate`)
    .all(res.locals.user.id);
  res.json(tasks);
});

tasksRouter.get('/:id', (req, res) => {
  const task = findTask(req.params.id, res.locals.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

tasksRouter.post('/', (req, res) => {
  const { task, error } = readTask(req.body);
  if (!task) return res.status(400).json({ error });

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO tasks (userId, title, description, status, dueDate, createdAt)
       VALUES (@userId, @title, @description, @status, @dueDate, @createdAt)`,
    )
    .run({ ...task, userId: res.locals.user.id, createdAt: new Date().toISOString() });

  res.status(201).json(findTask(lastInsertRowid, res.locals.user.id));
});

tasksRouter.put('/:id', (req, res) => {
  const { task, error } = readTask(req.body);
  if (!task) return res.status(400).json({ error });

  const { changes } = db
    .prepare(
      `UPDATE tasks SET title = @title, description = @description, status = @status, dueDate = @dueDate
       WHERE id = @id AND userId = @userId`,
    )
    .run({ ...task, id: req.params.id, userId: res.locals.user.id });

  if (!changes) return res.status(404).json({ error: 'Task not found' });
  res.json(findTask(req.params.id, res.locals.user.id));
});

tasksRouter.delete('/:id', (req, res) => {
  const { changes } = db
    .prepare('DELETE FROM tasks WHERE id = ? AND userId = ?')
    .run(req.params.id, res.locals.user.id);

  if (!changes) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});
