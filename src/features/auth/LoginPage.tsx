import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from './store';
import { getNextFromSearch } from '../../lib/utils';
import { showToast } from '../../lib/toast';

export function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const next = getNextFromSearch(loc.search);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ username, password });
      showToast('Logged in');
      nav(next || '/'); // Always redirect to Home per spec (unless deep-link guard provided via next)
    } catch (e: any) {
      showToast(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="cyber_analyst" />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="pw-wrap">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
              <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? '🙈' : '👁️'}</button>
            </div>
          </div>
          <div className="row">
            <button className="btn primary" disabled={loading} type="submit">{loading ? 'Signing in…' : 'Login'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


