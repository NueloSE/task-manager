import { Calendar, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
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
        <Link to="/tasks/new" className="button"><Plus size={16} /> New task</Link>
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All tasks</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <ul className="task-list">
        {data.tasks.length === 0 && <li className="empty">No tasks found.</li>}
        {data.tasks.map((task) => (
          <li key={task.id}>
            <Link to={`/tasks/${task.id}`} className={`card ${task.status}`}>
              <strong>{task.title}</strong>
              <span className={`badge ${task.status}`}>{STATUS_LABELS[task.status]}</span>
              <small className="muted icon-text">
                <Calendar size={14} /> Due {formatDate(task.dueDate)}
                {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
              </small>
            </Link>
          </li>
        ))}
      </ul>

      <div className="pagination">
        <button className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={16} /> Previous
        </button>
        <span>Page {page} of {data.totalPages}</span>
        <button className="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
