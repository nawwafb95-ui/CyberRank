import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout, getUserPublic, getProfile } from '../features/auth/store';
import { clsx } from '../lib/utils';

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const [authed, setAuthed] = React.useState(isAuthenticated());
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // re-evaluate auth on navigation
    setAuthed(isAuthenticated());
  }, [location.pathname, location.search]);

  const onLogout = () => {
    logout();
    setAuthed(false);
    navigate('/');
  };

  const user = getUserPublic();
  const [profile, setProfileState] = React.useState(getProfile());

  return (
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-dot" />SOCyberX</Link>
      <div />
      <nav className="nav">
        {!authed && (
          <>
            <Link className="link-btn" to="/login">Login</Link>
            <Link className="link-btn" to="/signup">Sign Up</Link>
            <Link className="link-btn" to="/about">About</Link>
          </>
        )}
        {authed && (
          <>
            <button className="link-btn" onClick={onLogout}>Logout</button>
            <div className={clsx('dropdown', open && 'open')}>
              <button className="link-btn" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>Info</button>
              <div className="dropdown-panel" role="menu">
                <div className="info-box">
                  <div className="avatar-wrap">
                    {profile?.photo ? (
                      <img className="avatar" src={profile.photo} alt="Profile photo" />
                    ) : (
                      <img
                        className="avatar"
                        alt="Profile photo"
                        src={"data:image/svg+xml;utf8," +
                          "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none'>" +
                          "<circle cx='12' cy='8' r='4' stroke='%23aab1c9' stroke-width='1.5'/>" +
                          "<path d='M4 20c2.2-3 5-4.5 8-4.5s5.8 1.5 8 4.5' stroke='%23aab1c9' stroke-width='1.5' stroke-linecap='round'/>" +
                          "</svg>"} />
                    )}
                    <div className="avatar-actions">
                      <label className="btn" htmlFor="react-info-photo">Edit Picture</label>
                      {profile?.photo ? <button className="btn" onClick={() => { const p = { ...(getProfile()||{}) }; delete (p as any).photo; updateProfile(p); setProfileState(getProfile()); }}>Remove</button> : null}
                      <input id="react-info-photo" type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (!f) return;
                          const reader = new FileReader();
                          reader.onload = () => { updateProfile({ photo: reader.result as string }); setProfileState(getProfile()); };
                          reader.readAsDataURL(f);
                        }} />
                    </div>
                  </div>
                  <div className="muted">Signed in as</div>
                  <div className="strong">{profile?.fullName || user?.id}</div>
                  <div className="muted">{profile?.email || user?.email}</div>
                  <div className="muted">Age: {profile?.age || '—'}</div>
                  <div className="muted">Major: {profile?.major || '—'}</div>
                  {profile?.university ? <div className="muted">University: {profile.university}</div> : null}
                  {profile?.country ? <div className="muted">Country: {profile.country}</div> : null}
                </div>
                <div style={{ height: 8 }} />
                <div className="row">
                  <Link className="link-btn" to="/profile" onClick={() => setOpen(false)}>Profile</Link>
                  <button className="link-btn" disabled>Results/Review</button>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}


