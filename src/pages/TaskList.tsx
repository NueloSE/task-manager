import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, formatDate, isOverdue, STATUS_LABELS, type Task, type TaskPage } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';

const TABS = [
  { value: '', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
];

export default function TaskList() {
  const [data, setData] = useState<TaskPage>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [due, setDue] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0); // change it to fetch the list again
  const [error, setError] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [confirmDeleteDone, setConfirmDeleteDone] = useState(false);

  useEffect(() => {
    // Wait until the user stops typing before searching
    const timer = setTimeout(() => {
      api
        .getTasks({ search, status, due, page })
        .then((result) => {
          setData(result);
          // e.g. after deleting the only task on the last page
          if (page > result.totalPages) setPage(result.totalPages);
        })
        .catch((err) => setError(err.message));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, due, page, reload]);

  async function toggleDone(task: Task) {
    try {
      const updated = await api.updateTask(task.id, { ...task, status: task.status === 'done' ? 'todo' : 'done' });
      setData((current) => current && { ...current, tasks: current.tasks.map((t) => (t.id === task.id ? updated : t)) });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteTask() {
    await api.deleteTask(taskToDelete!.id);
    setTaskToDelete(null);
    setReload(reload + 1);
  }

  async function deleteDoneTasks() {
    await api.deleteDoneTasks();
    setConfirmDeleteDone(false);
    setReload(reload + 1);
  }

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <>
      <div className="row">
        <h1>My tasks</h1>
        <Link to="/tasks/new" className="button"><Plus size={16} /> New task</Link>
      </div>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={due === tab.value ? 'tab active' : 'tab'}
            onClick={() => { setDue(tab.value); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
        <button className="delete-done" onClick={() => setConfirmDeleteDone(true)}>
          <Trash2 size={14} /> Delete done tasks
        </button>
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
          <li key={task.id} className={`card task ${task.status}`}>
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => toggleDone(task)}
              aria-label={`Mark "${task.title}" as done`}
            />
            <Link to={`/tasks/${task.id}`} className="task-link">
              <strong>{task.title}</strong>
              <small className="muted icon-text">
                <Calendar size={14} /> Due {formatDate(task.dueDate)}
                {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
              </small>
            </Link>
            <span className={`badge ${task.status}`}>{STATUS_LABELS[task.status]}</span>
            <button className="icon-button" onClick={() => setTaskToDelete(task)} aria-label={`Delete "${task.title}"`}>
              <Trash2 size={16} />
            </button>
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

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Delete task?"
        message={`"${taskToDelete?.title}" will be deleted. This can't be undone.`}
        onConfirm={deleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
      <ConfirmDialog
        open={confirmDeleteDone}
        title="Delete done tasks?"
        message="All tasks marked as done will be deleted. This can't be undone."
        onConfirm={deleteDoneTasks}
        onCancel={() => setConfirmDeleteDone(false)}
      />
    </>
  );
}
