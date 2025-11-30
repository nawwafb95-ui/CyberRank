import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from './store';
import { showToast } from '../../lib/toast';

export function SignupPage() {
  const [form, setForm] = React.useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    age: '',
    major: '',
    university: '',
    country: ''
  });
  const [showA, setShowA] = React.useState(false);
  const [showB, setShowB] = React.useState(false);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ ...form, photo: photo || undefined });
      showToast('Account created. Signed in.');
      nav('/'); // Always Home after signup
    } catch (e: any) {
      showToast(e?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Sign Up</h2>
        <form onSubmit={onSubmit}>
          <div className="avatar-wrap" style={{ marginBottom: 10 }}>
            <img className="avatar-lg" alt="Profile preview" src={photo || ("data:image/svg+xml;utf8," +
              "<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none'>" +
              "<circle cx='12' cy='8' r='4' stroke='%23aab1c9' stroke-width='1.5'/>" +
              "<path d='M4 20c2.2-3 5-4.5 8-4.5s5.8 1.5 8 4.5' stroke='%23aab1c9' stroke-width='1.5' stroke-linecap='round'/>" +
              "</svg>")} />
            <div className="avatar-actions">
              <label className="btn" htmlFor="react-signup-photo">Upload Photo</label>
              {photo ? <button className="btn" type="button" onClick={() => setPhoto(null)}>Remove</button> : null}
              <input id="react-signup-photo" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setPhoto(reader.result as string);
                  reader.readAsDataURL(f);
                }} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Username</label>
              <input value={form.username} onChange={e => set('username', e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <div className="pw-wrap">
                <input type={showA ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} />
                <button type="button" className="pw-toggle" onClick={() => setShowA(s => !s)} aria-label={showA ? 'Hide password' : 'Show password'}>{showA ? '🙈' : '👁️'}</button>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Full Name</label>
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Age</label>
              <input value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div className="field">
              <label>Major (Specialization)</label>
              <input value={form.major} onChange={e => set('major', e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>University (optional)</label>
              <input value={form.university} onChange={e => set('university', e.target.value)} />
            </div>
            <div className="field">
              <label>Country (optional)</label>
              <input value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Confirm Password</label>
              <div className="pw-wrap">
                <input type={showB ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Re-enter password" />
                <button type="button" className="pw-toggle" onClick={() => setShowB(s => !s)} aria-label={showB ? 'Hide password' : 'Show password'}>{showB ? '🙈' : '👁️'}</button>
              </div>
            </div>
          </div>
          <div className="row">
            <button className="btn primary" disabled={loading} type="submit">{loading ? 'Creating…' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


