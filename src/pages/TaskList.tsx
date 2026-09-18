import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, formatDate, isOverdue, STATUS_LABELS, type Task } from '../api';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>();
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTasks().then(setTasks).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!tasks) return <p>Loading...</p>;

  const visible = filter === 'all' ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <>
      <div className="row">
        <h1>My tasks</h1>
        <Link to="/tasks/new" className="button">+ New task</Link>
      </div>

      <select className="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All tasks</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {visible.length === 0 && <p className="muted">No tasks here yet.</p>}

      <ul className="task-list">
        {visible.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/${task.id}`} className="card">
              <strong>{task.title}</strong>
              <span className={`badge ${task.status}`}>{STATUS_LABELS[task.status]}</span>
              <small className={isOverdue(task) ? 'overdue' : 'muted'}>
                Due {formatDate(task.dueDate)} {isOverdue(task) && '(overdue)'}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
