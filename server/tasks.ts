import { Router } from 'express';
import { db } from './db';

export const tasksRouter = Router();

const COLUMNS = 'id, title, description, status, dueDate, createdAt';
const STATUSES = ['todo', 'in_progress', 'done'];
const PAGE_SIZE = 5;

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
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Every query includes userId, so users can only see and change their own tasks
function findTask(id: unknown, userId: number) {
  return db.prepare(`SELECT ${COLUMNS} FROM tasks WHERE id = ? AND userId = ?`).get(id, userId);
}

// GET /api/tasks?search=report&status=todo&due=overdue&today=2026-09-18&page=2
tasksRouter.get('/', (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page)) || 1);
  const params = {
    userId: res.locals.user.id,
    search: `%${req.query.search ?? ''}%`,
    status: String(req.query.status ?? ''),
    due: String(req.query.due ?? ''),
    // The browser sends its own date, so "today" matches the user's timezone
    today: isValidDate(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10),
  };

  // An empty status or due means "any"
  const where = `WHERE userId = @userId
    AND (title LIKE @search OR description LIKE @search)
    AND (@status = '' OR status = @status)
    AND (@due = ''
      OR (@due = 'today' AND dueDate = @today)
      OR (@due = 'overdue' AND dueDate < @today AND status != 'done')
      OR (@due = 'upcoming' AND dueDate > @today))`;

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM tasks ${where}`).get(params) as { total: number };
  const tasks = db
    .prepare(`SELECT ${COLUMNS} FROM tasks ${where} ORDER BY dueDate LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });

  res.json({ tasks, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
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

// Must come before '/:id', otherwise "done" would be treated as a task id
tasksRouter.delete('/done', (req, res) => {
  const { changes } = db
    .prepare("DELETE FROM tasks WHERE userId = ? AND status = 'done'")
    .run(res.locals.user.id);
  res.json({ deleted: changes });
});

tasksRouter.delete('/:id', (req, res) => {
  const { changes } = db
    .prepare('DELETE FROM tasks WHERE id = ? AND userId = ?')
    .run(req.params.id, res.locals.user.id);

  if (!changes) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});
