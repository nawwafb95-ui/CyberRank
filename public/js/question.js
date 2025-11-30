// public/js/question.js
document.addEventListener('DOMContentLoaded', () => {
  const qs   = new URLSearchParams(location.search);
  const quiz = qs.get('quiz') || '1';
  const qNum = Number(qs.get('q') || '1');

  const QUESTIONS = {
    '1': [
      { text: 'What does CIA triad stand for?', correct: 'Confidentiality, Integrity, Availability' },
      { text: 'Which protocol secures web traffic?', correct: 'HTTPS' },
      { text: 'What is phishing?', correct: 'Social engineering attempt' }
    ],
    '2': [
      { text: 'Port for HTTP?', correct: '80' },
      { text: 'SQL injection affects which layer?', correct: 'Application' },
      { text: 'One strong password trait?', correct: 'Length' }
    ],
    '3': [
      { text: 'What is MFA?', correct: 'Multi-factor authentication' },
      { text: 'Firewall purpose?', correct: 'Traffic filtering' },
      { text: 'TLS provides?', correct: 'Encryption' }
    ]
  };

  const question = (QUESTIONS[quiz] || [])[qNum - 1];

  const elQ      = document.getElementById('question-text');
  const elF      = document.getElementById('ai-feedback');
  const elT      = document.getElementById('timer');
  const btnNext  = document.getElementById('btn-next');
  const btnSkip  = document.getElementById('btn-skip');

  if (!question) {
    if (elQ) elQ.textContent = 'No more questions in this quiz.';
    if (btnNext) btnNext.disabled = true;
    if (btnSkip) btnSkip.disabled = true;
    return;
  }

  if (elQ) elQ.textContent = question.text;

  // Simple timer (mm:ss)
  let start = Date.now();
  let tId;

  function tick() {
    const s  = Math.floor((Date.now() - start) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    if (elT) elT.textContent = mm + ':' + ss;
  }

  tId = setInterval(tick, 1000);
  tick();

  function saveAnswer(status) {
    clearInterval(tId);
    const elapsedMs = Date.now() - start;
    const key = 'cr_answers_' + quiz;
    let arr = [];
    try {
      arr = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {}
    arr.push({ q: qNum, status, ms: elapsedMs });
    localStorage.setItem(key, JSON.stringify(arr));
    return { elapsedMs };
  }

  async function fakeAI(isCorrect) {
    // Placeholder integration — replace with real endpoint call
    // Example:
    // const res = await fetch('/api/ai', { method:'POST', body: JSON.stringify({ isCorrect, ... }) })
    await new Promise(r => setTimeout(r, 350));
    if (isCorrect) {
      return {
        type: 'summary',
        text: 'Good job! You identified the core concept correctly.'
      };
    }
    return {
      type: 'hint',
      text: 'Think about the security property this protects.'
    };
  }

  function goNext() {
    const base = location.pathname.replace(/[^/]+$/, '');
    const next = qNum + 1;
    location.href = base + 'question.html?quiz=' +
      encodeURIComponent(quiz) +
      '&q=' + next;
  }

  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      saveAnswer('answered');
      const ai = await fakeAI(true);
      if (elF && ai && ai.text) elF.textContent = ai.text;
      setTimeout(goNext, 600);
    });
  }

  if (btnSkip) {
    btnSkip.addEventListener('click', async () => {
      saveAnswer('skipped');
      const ai = await fakeAI(false);
      if (elF && ai && ai.text) elF.textContent = ai.text;
      setTimeout(goNext, 600);
    });
  }
});
