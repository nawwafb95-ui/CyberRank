// public/js/question.js
// SERVER-SIDE ENFORCED: Questions fetched from Firestore with level gating
// Score submission via Cloud Functions (submitQuizResult)

import { auth, db, waitForAuthReady, app } from './firebaseInit.js';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ================== AUTH CHECK ==================
  const isAuthenticated = await waitForAuthReady();
  if (!isAuthenticated || !auth.currentUser) {
    // Redirect to login with message
    const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
    const currentPath = window.location.pathname + window.location.search;
    window.location.href = `${loginPath}?next=${encodeURIComponent(currentPath)}&message=${encodeURIComponent('Login required to start challenges.')}`;
    return;
  }

  const qs = new URLSearchParams(location.search);
  
  // Support both old quiz parameter and new level parameter
  const level = qs.get('level'); // 'easy', 'medium', or 'hard'
  const quiz = qs.get('quiz'); // Legacy support
  const qNum = Number(qs.get('q') || '1');

  // Determine current level
  let currentLevel = level;
  if (!currentLevel && quiz) {
    // Map legacy quiz to level
    if (quiz === '1') currentLevel = 'easy';
    else if (quiz === '2') currentLevel = 'medium';
    else if (quiz === '3') currentLevel = 'hard';
  }
  if (!currentLevel) currentLevel = 'easy'; // Default

  // ================== FETCH QUESTIONS FROM FIRESTORE ==================
  // Firestore Security Rules will enforce level gating server-side
  let questions = [];
  try {
    const questionsRef = collection(db, 'questions');
    const q = query(
      questionsRef,
      where('level', '==', currentLevel),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Fallback to hardcoded questions if Firestore is empty (for migration period)
      console.warn('[question.js] No questions found in Firestore, using fallback');
      questions = getFallbackQuestions(currentLevel);
    } else {
      questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
        correct: doc.data().correct
      }));
    }
  } catch (error) {
    console.error('[question.js] Error fetching questions:', error);
    // If error is permission denied, user doesn't have access to this level
    if (error.code === 'permission-denied') {
      alert(`You don't have access to the ${currentLevel} level yet. Complete the previous level first (score >= 60%).`);
      window.location.href = typeof window.getPath === 'function' ? window.getPath('challenges') : '/html/challenges.html';
      return;
    }
    // Fallback to hardcoded questions
    questions = getFallbackQuestions(currentLevel);
  }

  // Fallback questions (for migration period or if Firestore is empty)
  function getFallbackQuestions(level) {
    const QUESTIONS_BY_LEVEL = {
      easy: [
        { id: 'easy_1', text: 'What does CIA triad stand for?', correct: 'Confidentiality, Integrity, Availability' },
        { id: 'easy_2', text: 'Which protocol secures web traffic?', correct: 'HTTPS' },
        { id: 'easy_3', text: 'What is phishing?', correct: 'Social engineering attempt' },
        { id: 'easy_4', text: 'What is a firewall used for?', correct: 'Network security' },
        { id: 'easy_5', text: 'What does SSL/TLS provide?', correct: 'Encryption' }
      ],
      medium: [
        { id: 'medium_1', text: 'Port for HTTP?', correct: '80' },
        { id: 'medium_2', text: 'SQL injection affects which layer?', correct: 'Application' },
        { id: 'medium_3', text: 'One strong password trait?', correct: 'Length' },
        { id: 'medium_4', text: 'What is a DDoS attack?', correct: 'Distributed Denial of Service' },
        { id: 'medium_5', text: 'What is the purpose of a VPN?', correct: 'Secure remote access' },
        { id: 'medium_6', text: 'What does IDS stand for?', correct: 'Intrusion Detection System' }
      ],
      hard: [
        { id: 'hard_1', text: 'What is MFA?', correct: 'Multi-factor authentication' },
        { id: 'hard_2', text: 'Firewall purpose?', correct: 'Traffic filtering' },
        { id: 'hard_3', text: 'TLS provides?', correct: 'Encryption' },
        { id: 'hard_4', text: 'What is a zero-day vulnerability?', correct: 'Unknown security flaw' },
        { id: 'hard_5', text: 'What is the principle of least privilege?', correct: 'Minimum necessary access' },
        { id: 'hard_6', text: 'What is APT in cybersecurity?', correct: 'Advanced Persistent Threat' },
        { id: 'hard_7', text: 'What is social engineering?', correct: 'Manipulation technique' },
        { id: 'hard_8', text: 'What does SIEM stand for?', correct: 'Security Information and Event Management' }
      ]
    };
    return QUESTIONS_BY_LEVEL[level] || QUESTIONS_BY_LEVEL.easy;
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

  // ================== Finalize Attempt and Submit Score via Cloud Function ==================
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
      const scorePercent = maxScore > 0 ? Math.round((finalScore / maxScore) * 100) : 0;
      
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
      
      // Submit score via Cloud Function (SERVER-SIDE ENFORCED)
      const functions = getFunctions(app);
      const submitQuizResult = httpsCallable(functions, 'submitQuizResult');
      
      try {
        const result = await submitQuizResult({
          level: ATTEMPT_TRACKER.level,
          score: scorePercent,
          attemptId: ATTEMPT_TRACKER.attemptId
        });
        
        console.log('[Attempt Tracker] Score submitted via Cloud Function:', result.data);
        
        // Show success message if level was unlocked
        if (result.data.levelUnlocked) {
          const nextLevel = ATTEMPT_TRACKER.level === 'easy' ? 'Medium' : ATTEMPT_TRACKER.level === 'medium' ? 'Hard' : null;
          if (nextLevel) {
            console.log(`[Attempt Tracker] ${nextLevel} level unlocked!`);
          }
        }
      } catch (submitError) {
        console.error('[Attempt Tracker] Failed to submit score via Cloud Function:', submitError);
        // Non-blocking - show error but don't block UI
        const statusEl = document.getElementById('quiz-status');
        if (statusEl) {
          statusEl.textContent = 'Quiz completed, but saving results failed. Please try again.';
          statusEl.className = 'error';
        }
      }
      
      // Clear attempt tracker
      ATTEMPT_TRACKER.clear();
      
    } catch (error) {
      console.error('[Attempt Tracker] Failed to finalize attempt:', error);
      // Non-blocking - quiz completion UI still shows
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
    
    // Use question ID from Firestore or fallback
    const qId = question.id || `${currentLevel || 'unknown'}_q${qNum}`;
    
    // Add to answers buffer
    ATTEMPT_TRACKER.answersBuffer.push({
      qId: qId,
      answer: status === 'answered' ? question.correct : null, // Store correct answer or null if skipped
      isCorrect: isCorrect,
      points: points,
      timeSpentSec: elapsedSec
    });
    
    ATTEMPT_TRACKER.persist();
    
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
    if (next > totalQuestions) {
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
    let nextUrl = '/html/question.html?';
    
    if (level) {
      nextUrl += `level=${encodeURIComponent(level)}&q=${next}`;
    } else if (quiz) {
      nextUrl += `quiz=${encodeURIComponent(quiz)}&q=${next}`;
    } else {
      nextUrl += `level=${encodeURIComponent(currentLevel)}&q=${next}`;
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
        // Finalize attempt before redirecting
        await finalizeAttempt();
        setTimeout(goNext, 1000);
      } else {
        setTimeout(goNext, 600);
      }
    });
  }
});
