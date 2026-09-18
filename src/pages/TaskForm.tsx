import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, STATUS_LABELS, type TaskInput } from '../api';

// Used for both creating and editing. The URL has an id when editing.
export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<TaskInput>({ title: '', description: '', status: 'todo', dueDate: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .getTask(id)
      .then(({ title, description, status, dueDate }) => setForm({ title, description, status, dueDate }))
      .catch((err) => setError(err.message));
  }, [id]);

  function update(field: keyof TaskInput, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const task = id ? await api.updateTask(id, form) : await api.createTask(form);
      navigate(`/tasks/${task.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>{id ? 'Edit task' : 'New task'}</h1>
      {error && <p className="error">{error}</p>}

      <label>
        Title
        <input value={form.title} onChange={(e) => update('title', e.target.value)} required maxLength={100} />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          maxLength={1000}
        />
      </label>
      <label>
        Status
        <select value={form.status} onChange={(e) => update('status', e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Due date
        <input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} required />
      </label>

      <div className="actions">
        <Link to={id ? `/tasks/${id}` : '/'}>Cancel</Link>
        <button disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
