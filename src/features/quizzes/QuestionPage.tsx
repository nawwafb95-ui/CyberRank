import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timer, useDeadline, validateDeadline } from '../../components/Timer';
import { requestAiFeedback } from '../../lib/ai';
import { showToast } from '../../lib/toast';
import { Skeleton } from '../../components/ToastHost';

const MOCK_QUESTIONS: Record<string, Array<{ id: string; text: string; correct: string }>> = {
  '1': [
    { id: 'q1', text: 'What does CIA triad stand for?', correct: 'Confidentiality, Integrity, Availability' },
    { id: 'q2', text: 'Which protocol secures web traffic?', correct: 'HTTPS' },
    { id: 'q3', text: 'What is phishing?', correct: 'Social engineering attempt' }
  ],
  '2': [
    { id: 'q1', text: 'Port for HTTP?', correct: '80' },
    { id: 'q2', text: 'SQL injection affects which layer?', correct: 'Application' },
    { id: 'q3', text: 'One strong password trait?', correct: 'Length' }
  ],
  '3': [
    { id: 'q1', text: 'What is MFA?', correct: 'Multi-factor authentication' },
    { id: 'q2', text: 'Firewall purpose?', correct: 'Traffic filtering' },
    { id: 'q3', text: 'TLS provides?', correct: 'Encryption' }
  ]
};

const DURATION_MS = 60_000; // 60s per question for demo

export function QuestionPage() {
  const { quizId = '1', index = '0' } = useParams();
  const i = Math.max(0, Number(index)); // zero-based
  const list = MOCK_QUESTIONS[quizId] || [];
  const q = list[i];
  const navigate = useNavigate();
  const persistKey = `cr_deadline_${quizId}_${i}`;
  const { deadline, isExpired } = useDeadline(DURATION_MS, persistKey);
  const startedAtRef = React.useRef<number>(Date.now());
  const [aiText, setAiText] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    if (isExpired) {
      saveAttempt('skipped', null, false);
      showToast('Time expired. Auto-skipped.');
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  function goNext() {
    const next = i + 1;
    if (next >= list.length) {
      navigate('/quizzes');
    } else {
      navigate(`/question/${quizId}/${next}`);
    }
  }

  function saveAttempt(kind: 'answered' | 'skipped', userAnswer: string | null, isCorrect: boolean) {
    const answeredAt = Date.now();
    const attempt = {
      quizId,
      questionId: q?.id || `q${i}`,
      userAnswer,
      startedAt: startedAtRef.current,
      answeredAt,
      isCorrect,
      timeSpentMs: answeredAt - startedAtRef.current
    };
    const key = 'cr_attempts';
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push(attempt);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
    return attempt;
  }

  async function onNext() {
    if (!q) return goNext();
    if (!validateDeadline(deadline)) return; // auto-skipped already handled
    const userAnswer = q.correct; // demo: treat as correct flow
    const isCorrect = true;
    saveAttempt('answered', userAnswer, isCorrect);
    const ai = await requestAiFeedback({ question: q.text, userAnswer, isCorrect });
    setAiText(ai.text);
    setTimeout(goNext, 600);
  }

  async function onSkip() {
    if (!q) return goNext();
    saveAttempt('skipped', null, false);
    const ai = await requestAiFeedback({ question: q.text, userAnswer: null, isCorrect: false });
    setAiText(ai.text);
    setTimeout(goNext, 600);
  }

  if (!q) {
    return (
      <div className="q-body">
        <div className="q-card card">No question available.</div>
      </div>
    );
  }

  return (
    <>
      <Timer deadline={deadline} />
      <div className="q-body">
        <div className="q-card card">
          {loading ? (
            <>
              <Skeleton height={28} />
              <Skeleton height={52} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 'clamp(18px,4vw,24px)' }}>{q.text}</div>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn primary" onClick={onNext}>Next</button>
                <button className="btn" onClick={onSkip}>Skip</button>
              </div>
              {aiText ? (
                <div className="card" style={{ padding: 12 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div className="muted" style={{ paddingRight: 8 }}>{aiText}</div>
                    <button className="link-btn" onClick={() => setAiText('')}>Dismiss</button>
                  </div>
                </div>
              ) : <div style={{ minHeight: 18 }} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}


