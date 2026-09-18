import { ArrowLeft, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, formatDate, isOverdue, STATUS_LABELS, type Task } from '../api';

export default function TaskDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task>();
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTask(id).then(setTask).catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (error) return <p className="error">{error}. <Link to="/">Back to tasks</Link></p>;
  if (!task) return <p>Loading...</p>;

  return (
    <div className="card">
      <div className="row">
        <h1>{task.title}</h1>
        <span className={`badge ${task.status}`}>{STATUS_LABELS[task.status]}</span>
      </div>

      <p className="description">{task.description || <span className="muted">No description</span>}</p>
      <p className="icon-text">
        <Calendar size={16} /> Due: {formatDate(task.dueDate)}
        {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
      </p>
      <p className="muted">Created: {new Date(task.createdAt).toLocaleString()}</p>

      <div className="actions">
        <Link to="/" className="icon-text"><ArrowLeft size={16} /> Back</Link>
        <button className="danger" onClick={handleDelete}><Trash2 size={16} /> Delete</button>
        <Link to={`/tasks/${id}/edit`} className="button"><Pencil size={16} /> Edit</Link>
      </div>
    </div>
  );
}
