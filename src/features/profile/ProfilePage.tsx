import React from 'react';
import { getProfile, updateProfile } from '../auth/store';
import { showToast } from '../../lib/toast';

export function ProfilePage() {
  const [form, setForm] = React.useState(() => {
    const p = getProfile();
    return {
      fullName: p?.fullName || '',
      email: p?.email || '',
      age: p?.age || '',
      major: p?.major || '',
      university: p?.university || '',
      country: p?.country || ''
    };
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile(form);
    showToast('Profile updated');
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <form onSubmit={onSave}>
          <div className="row">
            <div className="field"><label>Full Name</label><input value={form.fullName} onChange={e=>set('fullName', e.target.value)} /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e=>set('email', e.target.value)} /></div>
          </div>
          <div className="row">
            <div className="field"><label>Age</label><input value={form.age} onChange={e=>set('age', e.target.value)} /></div>
            <div className="field"><label>Major</label><input value={form.major} onChange={e=>set('major', e.target.value)} /></div>
          </div>
          <div className="row">
            <div className="field"><label>University</label><input value={form.university} onChange={e=>set('university', e.target.value)} /></div>
            <div className="field"><label>Country</label><input value={form.country} onChange={e=>set('country', e.target.value)} /></div>
          </div>
          <div className="row"><button className="btn primary" type="submit">Save</button></div>
        </form>
      </div>
    </div>
  );
}


