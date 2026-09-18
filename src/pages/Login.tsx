import { Eye, EyeOff } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { api, type User } from '../api';

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      const user = isSignUp ? await api.register(username, password) : await api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function loginAsDemo() {
    api.login('demo', 'demo1234').then(onLogin).catch((err) => setError(err.message));
  }

  return (
    <form className="card narrow" onSubmit={handleSubmit}>
      <h1>{isSignUp ? 'Create an account' : 'Log in'}</h1>
      <p className="muted">Keep track of what you need to get done.</p>
      {error && <p className="error">{error}</p>}

      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
      </label>
      <label>
        Password
        <span className="password">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <button>{isSignUp ? 'Sign up' : 'Log in'}</button>

      <p>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button type="button" className="link" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
          {isSignUp ? 'Log in' : 'Sign up'}
        </button>
      </p>

      <p className="demo">
        Just testing? Use <b>demo</b> / <b>demo1234</b> or{' '}
        <button type="button" className="link" onClick={loginAsDemo}>log in as demo</button>
      </p>
    </form>
  );
}
