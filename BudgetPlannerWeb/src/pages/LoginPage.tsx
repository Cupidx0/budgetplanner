import { useState, type FormEvent } from 'react';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(username.trim(), password);
      else await register(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="auth-screen">
      <form className="panel auth-card" onSubmit={handleSubmit}>
        <div className="brand brand--dark">
          <div className="brand-mark">BP</div>
          <div>
            <p className="eyebrow">Finance suite</p>
            <p className="brand-title">Budget Planner</p>
          </div>
        </div>

        <h1 className="panel-title">{isLogin ? 'Sign in' : 'Create an account'}</h1>

        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          className="btn-link"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login');
            setError(null);
          }}
        >
          {isLogin ? "Don't have an account? Register" : 'Already registered? Sign in'}
        </button>
      </form>
    </div>
  );
}
