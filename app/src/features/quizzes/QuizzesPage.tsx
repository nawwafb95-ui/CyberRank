import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../components/ToastHost';

export function QuizzesPage() {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Choose a Quiz</h2>
        {loading ? (
          <div className="grid-3">
            <Skeleton height={52} /><Skeleton height={52} /><Skeleton height={52} />
          </div>
        ) : (
          <div className="quiz-buttons">
            <Link className="btn primary" to="/question/1/0">Quiz 1</Link>
            <Link className="btn primary" to="/question/2/0">Quiz 2</Link>
            <Link className="btn primary" to="/question/3/0">Quiz 3</Link>
          </div>
        )}
      </div>
    </div>
  );
}


