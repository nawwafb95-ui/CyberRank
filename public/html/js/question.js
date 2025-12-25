// public/js/question.js
// Import Firebase modules
import { auth, db, waitForAuthReady } from './firebaseInit.js';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

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

  // ================== Attempt Tracker Module ==================
  const ATTEMPT_TRACKER = {
    attemptId: null,
    answersBuffer: [],
    quizStartTime: null,
    totalDurationSec: 0,
    pointsPerQuestion: 10, // Points awarded per correct answer
    level: currentLevel,
    totalQuestions: questions.length,
    
    // Initialize attempt tracking
    init() {
      // Restore from sessionStorage if available
      const stored = sessionStorage.getItem('cr_attempt_tracker');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.attemptId = data.attemptId;
          this.answersBuffer = data.answersBuffer || [];
          this.quizStartTime = data.quizStartTime ? new Date(data.quizStartTime) : null;
          this.totalDurationSec = data.totalDurationSec || 0;
          this.level = data.level || currentLevel;
          this.totalQuestions = data.totalQuestions || questions.length;
        } catch (e) {
          console.warn('[Attempt Tracker] Failed to restore from sessionStorage:', e);
        }
      }
    },
    
    // Save to sessionStorage
    persist() {
      try {
        sessionStorage.setItem('cr_attempt_tracker', JSON.stringify({
          attemptId: this.attemptId,
          answersBuffer: this.answersBuffer,
          quizStartTime: this.quizStartTime ? this.quizStartTime.getTime() : null,
          totalDurationSec: this.totalDurationSec,
          level: this.level,
          totalQuestions: this.totalQuestions
        }));
      } catch (e) {
        console.warn('[Attempt Tracker] Failed to persist to sessionStorage:', e);
      }
    },
    
    // Clear tracking data
    clear() {
      this.attemptId = null;
      this.answersBuffer = [];
      this.quizStartTime = null;
      this.totalDurationSec = 0;
      try {
        sessionStorage.removeItem('cr_attempt_tracker');
      } catch (e) {
        // Ignore
      }
    }
  };
  
  // Initialize attempt tracker
  ATTEMPT_TRACKER.init();

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

  // ================== Finalize Attempt and Update User Stats ==================
  async function finalizeAttempt() {
    if (!ATTEMPT_TRACKER.attemptId) {
      console.log('[Attempt Tracker] No attempt ID, skipping finalization');
      return;
    }
    
    try {
      // Wait for auth to be ready
      const isAuthenticated = await waitForAuthReady();
      if (!isAuthenticated || !auth.currentUser) {
        console.log('[Attempt Tracker] User not authenticated, skipping attempt finalization');
        return;
      }
      
      // Calculate final score and correct count
      const finalScore = ATTEMPT_TRACKER.answersBuffer.reduce((sum, ans) => sum + ans.points, 0);
      const correctCount = ATTEMPT_TRACKER.answersBuffer.filter(ans => ans.isCorrect).length;
      const maxScore = ATTEMPT_TRACKER.pointsPerQuestion * ATTEMPT_TRACKER.totalQuestions;
      
      // Update attempt document
      const attemptRef = doc(db, 'attempts', ATTEMPT_TRACKER.attemptId);
      await updateDoc(attemptRef, {
        finishedAt: serverTimestamp(),
        durationSec: ATTEMPT_TRACKER.totalDurationSec,
        score: finalScore,
        maxScore: maxScore,
        correctCount: correctCount,
        totalQuestions: ATTEMPT_TRACKER.totalQuestions,
        answers: ATTEMPT_TRACKER.answersBuffer
      });
      
      console.log('[Attempt Tracker] Attempt finalized:', ATTEMPT_TRACKER.attemptId);
      
      // Update user stats
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Read current user data first (for bestScore calculation)
      let currentBestScore = 0;
      let currentStats = {};
      let currentProgress = {};
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          currentStats = userData?.stats || {};
          currentProgress = userData?.progress || {};
          currentBestScore = currentStats.bestScore || 0;
        }
      } catch (readError) {
        console.warn('[Attempt Tracker] Failed to read user data, using defaults:', readError);
      }
      
      // Prepare update object with nested field paths
      const userUpdate = {
        'stats.attemptsCount': increment(1),
        'stats.totalPoints': increment(finalScore),
        'stats.bestScore': Math.max(currentBestScore, finalScore)
      };
      
      // Mark level as completed in progress
      const progressField = `progress.${ATTEMPT_TRACKER.level}Completed`;
      userUpdate[progressField] = true;
      
      // Update user document (updateDoc handles nested paths)
      await updateDoc(userRef, userUpdate);
      
      console.log('[Attempt Tracker] User stats updated');
      
      // Clear attempt tracker
      ATTEMPT_TRACKER.clear();
      
    } catch (error) {
      console.error('[Attempt Tracker] Failed to finalize attempt:', error);
      // Non-blocking - quiz completion UI still shows
      // Show non-blocking message if status element exists
      const statusEl = document.getElementById('quiz-status');
      if (statusEl) {
        statusEl.textContent = 'Quiz completed, but saving results failed. Please try again.';
        statusEl.className = 'error';
      }
    }
  }

  // No more questions - level completed
  if (!question) {
    // Finalize attempt if it exists (quiz completed)
    finalizeAttempt(); // Fire and forget - non-blocking
    
    if (elQ) {
      elQ.textContent = currentLevel 
        ? `Level completed! You finished all ${currentLevel} level questions.`
        : 'No more questions in this quiz.';
    }
    if (btnNext) {
      btnNext.textContent = 'Back to Challenges';
      btnNext.disabled = false;
      btnNext.onclick = () => {
        const challengesPath = typeof window.getPath === 'function' ? window.getPath('challenges') : '/html/challenges.html';
        window.location.href = challengesPath;
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

  // ================== Initialize Attempt on First Question ==================
  if (qNum === 1) {
    // Quiz starts - create attempt document
    (async () => {
      try {
        // Wait for auth to be ready
        const isAuthenticated = await waitForAuthReady();
        if (!isAuthenticated || !auth.currentUser) {
          console.log('[Attempt Tracker] User not authenticated, skipping attempt creation');
          return;
        }
        
        // Create attempt document
        const attemptData = {
          userId: auth.currentUser.uid,
          level: currentLevel || 'unknown',
          startedAt: serverTimestamp(),
          finishedAt: null,
          durationSec: 0,
          score: 0,
          maxScore: ATTEMPT_TRACKER.pointsPerQuestion * questions.length,
          correctCount: 0,
          totalQuestions: questions.length,
          answers: []
        };
        
        const attemptRef = await addDoc(collection(db, 'attempts'), attemptData);
        ATTEMPT_TRACKER.attemptId = attemptRef.id;
        ATTEMPT_TRACKER.quizStartTime = new Date();
        ATTEMPT_TRACKER.level = currentLevel || 'unknown';
        ATTEMPT_TRACKER.totalQuestions = questions.length;
        ATTEMPT_TRACKER.persist();
        
        console.log('[Attempt Tracker] Attempt created:', attemptRef.id);
      } catch (error) {
        console.error('[Attempt Tracker] Failed to create attempt:', error);
        // Non-blocking - quiz continues normally
      }
    })();
  }

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
    const elapsedSec = Math.floor(elapsedMs / 1000);
    
    // Update total duration
    ATTEMPT_TRACKER.totalDurationSec += elapsedSec;
    
    // Determine if answer is correct (answered = correct, skipped = incorrect)
    const isCorrect = status === 'answered';
    const points = isCorrect ? ATTEMPT_TRACKER.pointsPerQuestion : 0;
    
    // Generate question ID (use level + question index since questions are hardcoded)
    // If questions are fetched from Firestore in the future, use question.id instead
    const qId = `${currentLevel || 'unknown'}_q${qNum}`;
    
    // Add to answers buffer
    ATTEMPT_TRACKER.answersBuffer.push({
      qId: qId,
      answer: status === 'answered' ? question.correct : null, // Store correct answer or null if skipped
      isCorrect: isCorrect,
      points: points,
      timeSpentSec: elapsedSec
    });
    
    ATTEMPT_TRACKER.persist();
    
    // Save answer with level context (existing localStorage logic)
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
      // Level completed - finalize attempt and show completion message
      finalizeAttempt(); // Fire and forget - non-blocking
      
      if (elQ) {
        elQ.textContent = `🎉 Congratulations! You completed the ${currentLevel} level!`;
      }
      if (btnNext) {
        btnNext.textContent = 'Back to Challenges';
        btnNext.onclick = () => {
          const challengesPath = typeof window.getPath === 'function' ? window.getPath('challenges') : '/html/challenges.html';
        window.location.href = challengesPath;
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
        // Finalize attempt before redirecting
        await finalizeAttempt();
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
        // Finalize attempt before redirecting
        await finalizeAttempt();
        setTimeout(goNext, 1000);
      } else {
        setTimeout(goNext, 600);
      }
    });
  }
});
