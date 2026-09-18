import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router';
import { api, type User } from './api';
import Login from './pages/Login';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import TaskList from './pages/TaskList';

export default function App() {
  const [user, setUser] = useState<User | null>(); // undefined while we check the login cookie
  const navigate = useNavigate();

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  async function logout() {
    await api.logout();
    setUser(null);
    navigate('/');
  }

  if (user === undefined) return null;

  return (
    <>
      <header>
        <Link to="/" className="logo"><span className="logo-icon">✓</span> Task Manager</Link>
        {user && (
          <div>
            <span className="muted">{user.username}</span> <button className="secondary" onClick={logout}>Log out</button>
          </div>
        )}
      </header>

      <main>
        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/tasks/new" element={<TaskForm key="new" />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/tasks/:id/edit" element={<TaskForm key="edit" />} />
            <Route path="*" element={<p>Page not found. <Link to="/">Go to tasks</Link></p>} />
          </Routes>
        )}
      </main>
    </>
  );
}
