import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../server/app';
import { db } from '../server/db';

const task = { title: 'Write README', description: 'Explain setup', status: 'todo', dueDate: '2026-10-01' };

// agent keeps the login cookie between requests, like a browser
async function signUp(username: string) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password: 'password123' }).expect(201);
  return agent;
}

beforeEach(() => {
  db.exec("DELETE FROM users WHERE username != 'demo'"); // their tasks are deleted too (ON DELETE CASCADE)
});

describe('tasks', () => {
  it('creates, reads, updates and deletes a task', async () => {
    const user = await signUp('alice');

    const created = await user.post('/api/tasks').send(task).expect(201);
    expect(created.body).toMatchObject(task);
    expect(created.body.createdAt).toBeTruthy();
    const url = `/api/tasks/${created.body.id}`;

    expect((await user.get('/api/tasks')).body.tasks).toHaveLength(1);
    expect((await user.get(url)).body.title).toBe('Write README');

    const updated = await user.put(url).send({ ...task, status: 'done' }).expect(200);
    expect(updated.body.status).toBe('done');

    await user.delete(url).expect(204);
    await user.get(url).expect(404);
  });

  it('searches, filters and pages through tasks', async () => {
    const user = await signUp('alice');
    for (let day = 1; day <= 6; day++) {
      await user.post('/api/tasks').send({ ...task, title: `Task ${day}`, dueDate: `2026-10-0${day}` });
    }
    await user.post('/api/tasks').send({ ...task, title: 'Buy milk', status: 'done' });

    const page1 = await user.get('/api/tasks');
    expect(page1.body.tasks).toHaveLength(5);
    expect(page1.body.totalPages).toBe(2);

    const page2 = await user.get('/api/tasks?page=2');
    expect(page2.body.tasks).toHaveLength(2);

    const search = await user.get('/api/tasks?search=MILK');
    expect(search.body.tasks.map((t: { title: string }) => t.title)).toEqual(['Buy milk']);

    const done = await user.get('/api/tasks?status=done');
    expect(done.body.tasks).toHaveLength(1);
  });

  it('rejects invalid tasks', async () => {
    const user = await signUp('alice');

    const cases = [
      [{ ...task, title: '  ' }, 'Title is required'],
      [{ ...task, status: 'finished' }, 'Status must be todo, in_progress or done'],
      [{ ...task, dueDate: '2026-02-30' }, 'Due date must be a valid date (YYYY-MM-DD)'],
      [{ title: 'No due date' }, 'Due date must be a valid date (YYYY-MM-DD)'],
    ] as const;

    for (const [body, error] of cases) {
      const res = await user.post('/api/tasks').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(error);
    }
  });

  it('returns 400 for broken JSON', async () => {
    const user = await signUp('alice');
    const res = await user.post('/api/tasks').set('Content-Type', 'application/json').send('{"title":');
    expect(res.status).toBe(400);
  });

  it('returns 404 for a task that does not exist', async () => {
    const user = await signUp('alice');
    await user.get('/api/tasks/999').expect(404);
    await user.put('/api/tasks/999').send(task).expect(404);
    await user.delete('/api/tasks/999').expect(404);
  });

  it("does not let users see or change each other's tasks", async () => {
    const alice = await signUp('alice');
    const bob = await signUp('bob');
    const { body } = await alice.post('/api/tasks').send(task).expect(201);

    expect((await bob.get('/api/tasks')).body.tasks).toEqual([]);
    await bob.get(`/api/tasks/${body.id}`).expect(404);
    await bob.put(`/api/tasks/${body.id}`).send(task).expect(404);
    await bob.delete(`/api/tasks/${body.id}`).expect(404);
  });
});

describe('auth', () => {
  it('requires login for task routes', async () => {
    await request(app).get('/api/tasks').expect(401);
    await request(app).get('/api/tasks').set('Cookie', 'token=fake').expect(401);
  });

  it('logs in and out', async () => {
    await signUp('alice');
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({ username: 'alice', password: 'password123' }).expect(200);
    expect((await agent.get('/api/auth/me')).body.username).toBe('alice');

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('rejects a wrong password', async () => {
    await signUp('alice');
    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'wrong-pass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid username or password');
  });

  it('rejects a taken username and a short password', async () => {
    await signUp('alice');
    await request(app).post('/api/auth/register').send({ username: 'ALICE', password: 'password123' }).expect(409);
    await request(app).post('/api/auth/register').send({ username: 'carol', password: 'short' }).expect(400);
  });

  it('stores a hash, not the password', async () => {
    await signUp('alice');
    const { passwordHash } = db.prepare('SELECT passwordHash FROM users WHERE username = ?').get('alice') as {
      passwordHash: string;
    };
    expect(passwordHash).not.toBe('password123');
    expect(passwordHash.startsWith('$2')).toBe(true);
  });

  it('has a demo account with sample tasks', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: 'demo', password: 'demo1234' }).expect(200);
    expect((await agent.get('/api/tasks')).body.tasks.length).toBeGreaterThan(0);
  });
});
