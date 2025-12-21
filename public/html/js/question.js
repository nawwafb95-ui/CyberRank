// public/js/question.js
document.addEventListener('DOMContentLoaded', () => {
  const qs = new URLSearchParams(location.search);
  
  // Support both old quiz parameter and new level parameter
  const level = qs.get('level'); // 'easy', 'medium', or 'hard'
  const quiz = qs.get('quiz'); // Legacy support
  const qNum = Number(qs.get('q') || '1');

  // Questions organized by level
  const QUESTIONS_BY_LEVEL = {
    easy: [
      { text: 'What does CIA triad stand for?', correct: 'Confidentiality, Integrity, Availability' },
      { text: 'Which protocol secures web traffic?', correct: 'HTTPS' },
      { text: 'What is phishing?', correct: 'Social engineering attempt' },
      { text: 'What is a firewall used for?', correct: 'Network security' },
      { text: 'What does SSL/TLS provide?', correct: 'Encryption' }
    ],
    medium: [
      { text: 'Port for HTTP?', correct: '80' },
      { text: 'SQL injection affects which layer?', correct: 'Application' },
      { text: 'One strong password trait?', correct: 'Length' },
      { text: 'What is a DDoS attack?', correct: 'Distributed Denial of Service' },
      { text: 'What is the purpose of a VPN?', correct: 'Secure remote access' },
      { text: 'What does IDS stand for?', correct: 'Intrusion Detection System' }
    ],
    hard: [
      { text: 'What is MFA?', correct: 'Multi-factor authentication' },
      { text: 'Firewall purpose?', correct: 'Traffic filtering' },
      { text: 'TLS provides?', correct: 'Encryption' },
      { text: 'What is a zero-day vulnerability?', correct: 'Unknown security flaw' },
      { text: 'What is the principle of least privilege?', correct: 'Minimum necessary access' },
      { text: 'What is APT in cybersecurity?', correct: 'Advanced Persistent Threat' },
      { text: 'What is social engineering?', correct: 'Manipulation technique' },
      { text: 'What does SIEM stand for?', correct: 'Security Information and Event Management' }
    ]
  };

  // Legacy quiz-based questions (for backward compatibility)
  const QUESTIONS_BY_QUIZ = {
    '1': QUESTIONS_BY_LEVEL.easy,
    '2': QUESTIONS_BY_LEVEL.medium,
    '3': QUESTIONS_BY_LEVEL.hard
  };

  // Determine current level and questions
  let currentLevel = level;
  let questions = [];
  
  if (level && QUESTIONS_BY_LEVEL[level]) {
    // New level-based system
    questions = QUESTIONS_BY_LEVEL[level];
  } else if (quiz && QUESTIONS_BY_QUIZ[quiz]) {
    // Legacy quiz-based system
    questions = QUESTIONS_BY_QUIZ[quiz];
    // Map quiz to level for completion tracking
    if (quiz === '1') currentLevel = 'easy';
    else if (quiz === '2') currentLevel = 'medium';
    else if (quiz === '3') currentLevel = 'hard';
  } else {
    // Default to easy
    currentLevel = 'easy';
    questions = QUESTIONS_BY_LEVEL.easy;
  }

  const question = questions[qNum - 1];

  const elQ = document.getElementById('question-text');
  const elF = document.getElementById('ai-feedback');
  const elT = document.getElementById('timer');
  const btnNext = document.getElementById('btn-next');
  const btnSkip = document.getElementById('btn-skip');

  // Check if level is completed (all questions answered)
  function markLevelCompleted(level) {
    if (!level) return;
    
    if (level === 'easy') {
      localStorage.setItem('socyberx_easy_completed', 'true');
    } else if (level === 'medium') {
      localStorage.setItem('socyberx_medium_completed', 'true');
    } else if (level === 'hard') {
      localStorage.setItem('socyberx_hard_completed', 'true');
    }
  }

  // Check if all questions for current level are completed
  function checkLevelCompletion(level, questionNum, totalQuestions) {
    if (questionNum >= totalQuestions) {
      // All questions completed for this level
      markLevelCompleted(level);
      return true;
    }
    return false;
  }

  // No more questions - level completed
  if (!question) {
    if (elQ) {
      elQ.textContent = currentLevel 
        ? `Level completed! You finished all ${currentLevel} level questions.`
        : 'No more questions in this quiz.';
    }
    if (btnNext) {
      btnNext.textContent = 'Back to Challenges';
      btnNext.disabled = false;
      btnNext.onclick = () => {
        window.location.href = '/challenges.html';
      };
    }
    if (btnSkip) btnSkip.style.display = 'none';
    
    // Mark level as completed if we just finished the last question
    if (currentLevel && qNum > questions.length) {
      markLevelCompleted(currentLevel);
    }
    
    return;
  }

  if (elQ) elQ.textContent = question.text;

  // Simple timer (mm:ss)
  let start = Date.now();
  let tId;

  function tick() {
    const s = Math.floor((Date.now() - start) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    if (elT) elT.textContent = mm + ':' + ss;
  }

  tId = setInterval(tick, 1000);
  tick();

  function saveAnswer(status) {
    clearInterval(tId);
    const elapsedMs = Date.now() - start;
    
    // Save answer with level context
    const key = level 
      ? `cr_answers_${level}_${qNum}` 
      : `cr_answers_${quiz || 'default'}_${qNum}`;
    
    const answerData = {
      q: qNum,
      status,
      ms: elapsedMs,
      level: currentLevel || null
    };
    
    try {
      const existing = JSON.parse(localStorage.getItem(key) || 'null');
      if (!existing) {
        localStorage.setItem(key, JSON.stringify(answerData));
      }
    } catch (e) {
      console.warn('Failed to save answer:', e);
    }
    
    return { elapsedMs };
  }

  async function fakeAI(isCorrect) {
    // Placeholder integration — replace with real endpoint call
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
    const next = qNum + 1;
    const totalQuestions = questions.length;
    
    // Check if this was the last question
    if (checkLevelCompletion(currentLevel, next, totalQuestions)) {
      // Level completed - show completion message and redirect
      if (elQ) {
        elQ.textContent = `🎉 Congratulations! You completed the ${currentLevel} level!`;
      }
      if (btnNext) {
        btnNext.textContent = 'Back to Challenges';
        btnNext.onclick = () => {
          window.location.href = '/challenges.html';
        };
      }
      if (btnSkip) btnSkip.style.display = 'none';
      return;
    }

    // Continue to next question - use absolute path
    let nextUrl = '/question.html?';
    
    if (level) {
      nextUrl += `level=${encodeURIComponent(level)}&q=${next}`;
    } else {
      nextUrl += `quiz=${encodeURIComponent(quiz || '1')}&q=${next}`;
    }
    
    location.href = nextUrl;
  }

  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      saveAnswer('answered');
      const ai = await fakeAI(true);
      if (elF && ai && ai.text) elF.textContent = ai.text;
      
      // Check if this is the last question
      const isLastQuestion = qNum >= questions.length;
      if (isLastQuestion) {
        // Mark level as completed before showing completion
        if (currentLevel) {
          markLevelCompleted(currentLevel);
        }
        setTimeout(goNext, 1000); // Give time to show completion message
      } else {
        setTimeout(goNext, 600);
      }
    });
  }

  if (btnSkip) {
    btnSkip.addEventListener('click', async () => {
      saveAnswer('skipped');
      const ai = await fakeAI(false);
      if (elF && ai && ai.text) elF.textContent = ai.text;
      
      // Check if this is the last question
      const isLastQuestion = qNum >= questions.length;
      if (isLastQuestion) {
        // Mark level as completed even if skipped
        if (currentLevel) {
          markLevelCompleted(currentLevel);
        }
        setTimeout(goNext, 1000);
      } else {
        setTimeout(goNext, 600);
      }
    });
  }
});
