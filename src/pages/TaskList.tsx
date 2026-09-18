import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, formatDate, isOverdue, STATUS_LABELS, type TaskPage } from '../api';

export default function TaskList() {
  const [data, setData] = useState<TaskPage>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait until the user stops typing before searching
    const timer = setTimeout(() => {
      api.getTasks(search, status, page).then(setData).catch((err) => setError(err.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <div className="row">
        <h1>My tasks</h1>
        <Link to="/tasks/new" className="button">+ New task</Link>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All tasks</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {data.tasks.length === 0 && <p className="muted">No tasks found.</p>}

      <ul className="task-list">
        {data.tasks.map((task) => (
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

      {data.totalPages > 1 && (
        <div className="pagination">
          <button className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>Page {page} of {data.totalPages}</span>
          <button className="secondary" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </>
  );
}
