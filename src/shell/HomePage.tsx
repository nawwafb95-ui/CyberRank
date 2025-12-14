import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../features/auth/store';

export function HomePage() {
  const navigate = useNavigate();
  const onQuizzes = () => {
    if (isAuthenticated()) navigate('/quizzes');
    else navigate('/login');
  };
  return (
    <section className="hero">
      <div className="hero-card">
        <h1 className="hero-title">Welcome to SOCyberX</h1>
        <p className="hero-sub">Practice cybersecurity skills with guided quizzes and AI feedback.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={onQuizzes}>Quizzes</button>
        </div>
      </div>
    </section>
  );
}


