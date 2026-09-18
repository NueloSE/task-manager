export type Status = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: Status;
  dueDate: string;
  createdAt: string;
};

export type TaskInput = Omit<Task, 'id' | 'createdAt'>;

export type User = { id: number; username: string };

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

// Sends a JSON request and throws the server's error message if it fails
async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
  return data;
}

export const api = {
  me: () => request<User>('/auth/me'),
  login: (username: string, password: string) => request<User>('/auth/login', 'POST', { username, password }),
  register: (username: string, password: string) => request<User>('/auth/register', 'POST', { username, password }),
  logout: () => request<void>('/auth/logout', 'POST'),

  getTasks: () => request<Task[]>('/tasks'),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (task: TaskInput) => request<Task>('/tasks', 'POST', task),
  updateTask: (id: string, task: TaskInput) => request<Task>(`/tasks/${id}`, 'PUT', task),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, 'DELETE'),
};

// Adding T00:00 makes the browser read the date in local time instead of UTC
export const formatDate = (date: string) => new Date(date + 'T00:00').toDateString();

// en-CA formats dates as YYYY-MM-DD, so it can be compared with dueDate
export const isOverdue = (task: Task) =>
  task.status !== 'done' && task.dueDate < new Date().toLocaleDateString('en-CA');
