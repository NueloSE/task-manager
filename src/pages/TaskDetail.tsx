import { ArrowLeft, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, formatDate, isOverdue, STATUS_LABELS, type Task } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function TaskDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task>();
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.getTask(id).then(setTask).catch((err) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    await api.deleteTask(id);
    navigate('/');
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
        <button className="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete</button>
        <Link to={`/tasks/${id}/edit`} className="button"><Pencil size={16} /> Edit</Link>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete task?"
        message={`"${task.title}" will be deleted. This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
