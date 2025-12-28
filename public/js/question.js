// public/js/question.js
// Question Page - Reads from Firestore collection: questions
// Robust query + safe DOM init + local validation (demo mode)

import { auth, db, waitForAuthReady, getCurrentAuthUser } from './firebaseInit.js';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// ==================== STATE ====================

const STATE = {
  level: null,
  questionSet: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  questionIds: [],
  timerInterval: null,
  timerStartTime: null,
  timerTarget: 120,
  isSubmitted: false,
  selectedAnswer: null
};

// Will be initialized after DOMContentLoaded
const elements = {};

// ==================== STORAGE ====================

function getStorageKey() {
  const user = (getCurrentAuthUser ? getCurrentAuthUser() : null) || auth.currentUser;
  if (!user) return null;
  const level = STATE.level || 'easy';
  return `question_progress_${user.uid}_${level}`;
}

function saveProgress() {
  const key = getStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        questionIndex: STATE.currentQuestionIndex,
        questionIds: STATE.questionIds,
        level: STATE.level
      })
    );
  } catch (e) {
    console.warn('[Question] Failed to save progress:', e);
  }
}

function loadProgress() {
  const key = getStorageKey();
  if (!key) return null;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('[Question] Failed to load progress:', e);
  }
  return null;
}

function clearProgress() {
  const key = getStorageKey();
  if (!key) return;
  try { localStorage.removeItem(key); } catch (_) {}
}

// ==================== TIMER ====================

function startTimer() {
  if (STATE.timerInterval) clearInterval(STATE.timerInterval);
  STATE.timerStartTime = Date.now();
  STATE.timerInterval = setInterval(updateTimer, 250);
  updateTimer();
}

function stopTimer() {
  if (STATE.timerInterval) {
    clearInterval(STATE.timerInterval);
    STATE.timerInterval = null;
  }
}

function updateTimer() {
  if (!STATE.timerStartTime || !elements.timer) return;

  const elapsed = Math.floor((Date.now() - STATE.timerStartTime) / 1000);
  const remaining = Math.max(0, STATE.timerTarget - elapsed);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  elements.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const timerEl = elements.timer.parentElement;
  if (timerEl) {
    if (remaining <= 30 && remaining > 0) timerEl.classList.add('timer-warning');
    else timerEl.classList.remove('timer-warning');

    if (remaining === 0) timerEl.classList.add('timer-expired');
    else timerEl.classList.remove('timer-expired');
  }
}

function getElapsedSeconds() {
  if (!STATE.timerStartTime) return 0;
  return Math.floor((Date.now() - STATE.timerStartTime) / 1000);
}

// ==================== UI HELPERS ====================

function showLoading() {
  if (elements.loading) elements.loading.style.display = 'block';
  if (elements.content) elements.content.style.display = 'none';
  if (elements.error) elements.error.style.display = 'none';
}

function hideLoading() {
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.content) elements.content.style.display = 'block';
  if (elements.error) elements.error.style.display = 'none';
}

function showError(message) {
  console.error('[Question] UI Error:', message);
  if (elements.errorMessage) elements.errorMessage.textContent = message;
  if (elements.error) elements.error.style.display = 'block';
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.content) elements.content.style.display = 'none';
}

// ==================== FIRESTORE LOADING ====================

async function runQuestionsQuery(normalizedLevel, useFlags, useOrderBy) {
  const questionsRef = collection(db, 'questions');
  const parts = [where('level', '==', normalizedLevel)];

  // Optional flags (in case some docs don't have them)
  if (useFlags) {
    parts.push(where('isActive', '==', true));
    parts.push(where('isHidden', '==', false));
  }

  if (useOrderBy) {
    parts.push(orderBy('order'));
  }

  const q = query(questionsRef, ...parts);
  return await getDocs(q);
}

async function loadQuestionSet(level) {
  try {
    console.log('[Question] Loading question set for level:', level);

    const normalizedLevel = String(level || '').toLowerCase().trim();
    if (!['easy', 'medium', 'hard'].includes(normalizedLevel)) {
      throw new Error(`Invalid level: ${level}. Must be one of: easy, medium, hard`);
    }

    let snap = null;

    // 1) Best query: with flags + orderBy
    try {
      snap = await runQuestionsQuery(normalizedLevel, true, true);
    } catch (e1) {
      console.warn('[Question] Query(flags+orderBy) failed:', e1?.message || e1);

      // 2) Fallback: with flags only (no orderBy)
      try {
        snap = await runQuestionsQuery(normalizedLevel, true, false);
      } catch (e2) {
        console.warn('[Question] Query(flags only) failed:', e2?.message || e2);

        // 3) Fallback: level only + orderBy
        try {
          snap = await runQuestionsQuery(normalizedLevel, false, true);
        } catch (e3) {
          console.warn('[Question] Query(level+orderBy) failed:', e3?.message || e3);

          // 4) Last resort: level only
          snap = await runQuestionsQuery(normalizedLevel, false, false);
        }
      }
    }

    console.log('[Question] Query returned', snap.size, 'questions');

    if (!snap || snap.empty) {
      throw new Error(
        `No questions found for level: ${normalizedLevel}. ` +
        `Check Firestore docs: do they have level="${normalizedLevel}"?`
      );
    }

    const questionsWithOrder = [];
    snap.forEach((d) => {
      const data = d.data();
      const orderValue =
        data.order !== undefined && data.order !== null ? Number(data.order) : Infinity;
      questionsWithOrder.push({ id: d.id, order: orderValue });
    });

    // Stable sort
    questionsWithOrder.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });

    const questionIds = questionsWithOrder.map((x) => x.id);

    const data = { level: normalizedLevel, questionIds, totalQuestions: questionIds.length };

    STATE.questionSet = data;
    STATE.questionIds = questionIds;
    STATE.level = normalizedLevel;

    console.log('[Question] Loaded question set OK:', {
      level: data.level,
      totalQuestions: data.totalQuestions,
      firstQuestionId: questionIds[0] || 'none'
    });

    return data;
  } catch (error) {
    console.error('[Question] Failed to load question set:', error);

    let msg = error?.message || 'Failed to load questions. Please try again.';
    if (error?.code === 'permission-denied') msg = 'Permission denied. Firestore rules must allow reading questions.';
    if (error?.code === 'unavailable') msg = 'Firestore temporarily unavailable. Try again later.';

    throw new Error(msg);
  }
}

async function loadQuestion(questionId) {
  const ref = doc(db, 'questions', questionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(`Question ${questionId} not found`);

  const data = snap.data();

  const options = data.options || data.choices || [];
  const title = data.title || data.text || '';
  const text = data.title ? (data.text || '') : '';

  const correctAnswer =
    data.correctAnswer !== undefined ? data.correctAnswer :
    (data.correct !== undefined ? data.correct : null);

  const type = data.type || (options.length > 0 ? 'mcq' : 'short');

  return {
    id: questionId,
    title,
    text,
    type,
    options,
    imageUrl: data.imageUrl || null,
    scenario: data.scenario || null,
    difficulty: (data.difficulty || data.level || STATE.level || 'medium'),
    correctAnswer
  };
}

// ==================== RENDERING ====================

function renderAnswerArea(question) {
  const type = question.type;

  if (elements.radioOptions) elements.radioOptions.style.display = 'none';
  if (elements.shortAnswerContainer) elements.shortAnswerContainer.style.display = 'none';

  const enableSubmit = () => { if (elements.btnSubmit) elements.btnSubmit.disabled = false; };

  if (type === 'mcq' || type === 'tf') {
    if (!elements.radioOptions) return;
    elements.radioOptions.innerHTML = '';

    const options =
      type === 'tf'
        ? [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }]
        : (question.options || []);

    options.forEach((option, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'radio-option';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'answer';
      radio.id = `option-${index}`;
      radio.value = typeof option === 'string' ? option : option.value;

      radio.addEventListener('change', () => {
        STATE.selectedAnswer = radio.value;
        enableSubmit();
      });

      const label = document.createElement('label');
      label.htmlFor = `option-${index}`;
      label.textContent = typeof option === 'string' ? option : (option.label || option.value);

      optionEl.appendChild(radio);
      optionEl.appendChild(label);
      elements.radioOptions.appendChild(optionEl);
    });

    elements.radioOptions.style.display = 'block';
    return;
  }

  // short answer
  if (!elements.shortAnswerContainer || !elements.shortAnswerInput) return;

  const newInput = elements.shortAnswerInput.cloneNode(true);
  elements.shortAnswerInput.parentNode.replaceChild(newInput, elements.shortAnswerInput);
  elements.shortAnswerInput = newInput;

  newInput.value = '';
  newInput.addEventListener('input', () => {
    STATE.selectedAnswer = newInput.value.trim();
    if (elements.btnSubmit) elements.btnSubmit.disabled = !STATE.selectedAnswer;
  });

  elements.shortAnswerContainer.style.display = 'block';
  newInput.focus();
}

function renderQuestion(question) {
  STATE.currentQuestion = question;
  STATE.isSubmitted = false;
  STATE.selectedAnswer = null;

  const difficultyTargets = { easy: 120, medium: 240, hard: 360 };
  const normalizedDifficulty = String(question.difficulty || 'medium').toLowerCase().trim();
  STATE.timerTarget = difficultyTargets[normalizedDifficulty] || 240;

  if (elements.questionTitle) elements.questionTitle.textContent = question.title || 'Question';

  if (elements.questionText) {
    elements.questionText.textContent = question.text || '';
    elements.questionText.style.display = question.text ? 'block' : 'none';
  }

  if (elements.scenarioText) {
    if (question.scenario) {
      elements.scenarioText.textContent = question.scenario;
      elements.scenarioText.style.display = 'block';
    } else {
      elements.scenarioText.style.display = 'none';
    }
  }

  if (question.imageUrl && elements.imageContainer && elements.questionImage) {
    elements.questionImage.src = question.imageUrl;
    elements.questionImage.alt = question.title || 'Question image';
    elements.imageContainer.style.display = 'block';
  } else if (elements.imageContainer) {
    elements.imageContainer.style.display = 'none';
  }

  renderAnswerArea(question);

  if (elements.btnSubmit) {
    elements.btnSubmit.disabled = true;
    elements.btnSubmit.style.display = 'block';
    const txt = elements.btnSubmit.querySelector('.btn-text');
    if (txt) txt.textContent = 'Submit';
  }
  if (elements.btnNext) elements.btnNext.style.display = 'none';
  if (elements.feedbackPanel) elements.feedbackPanel.style.display = 'none';

  startTimer();
}

// ==================== SUBMIT ====================

function showFeedback(data) {
  if (!elements.feedbackPanel) return;

  const isCorrect = !!data.isCorrect;
  const baseScore = data.baseScore || 0;
  const timeBonus = data.timeBonus || 0;
  const finalScore = data.finalScore || 0;
  const explanation = data.explanation || null;

  if (elements.feedbackStatus) {
    elements.feedbackStatus.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    elements.feedbackStatus.className = `feedback-status ${isCorrect ? 'correct' : 'incorrect'}`;
  }

  if (elements.scoreBreakdown) {
    let html = `
      <div class="score-item">
        <span class="score-label">Base Score:</span>
        <span class="score-value">${baseScore} pts</span>
      </div>
    `;

    if (timeBonus > 0) {
      html += `
        <div class="score-item">
          <span class="score-label">Time Bonus:</span>
          <span class="score-value">+${timeBonus} pts</span>
        </div>
      `;
    }

    html += `
      <div class="score-item total">
        <span class="score-label">Total:</span>
        <span class="score-value">${finalScore} pts</span>
      </div>
    `;

    elements.scoreBreakdown.innerHTML = html;
  }

  if (elements.explanation) {
    elements.explanation.textContent = explanation || '';
    elements.explanation.style.display = explanation ? 'block' : 'none';
  }

  elements.feedbackPanel.style.display = 'block';
}

async function updateUserStats(finalScore) {
  const user = getCurrentAuthUser ? getCurrentAuthUser() : (auth.currentUser || window.__authUser);
  if (!user || !user.uid) {
    console.warn('[Question] Cannot update stats: no user');
    return false;
  }

  try {
    const userStatsRef = doc(db, 'userStats', user.uid);
    const userStatsSnap = await getDoc(userStatsRef);

    if (userStatsSnap.exists()) {
      // Document exists, use atomic increment
      await updateDoc(userStatsRef, {
        points: increment(finalScore),
        xp: increment(finalScore),
        updatedAt: serverTimestamp()
      });
    } else {
      // Document doesn't exist, create it with initial values
      await setDoc(userStatsRef, {
        points: finalScore,
        xp: finalScore,
        level: 1,
        updatedAt: serverTimestamp()
      });
    }

    console.log(`[Question] Updated user stats: +${finalScore} points`);
    return true;
  } catch (error) {
    console.warn('[Question] Failed to update user stats:', error);
    return false;
  }
}

async function handleSubmit() {
  if (STATE.isSubmitted || !STATE.selectedAnswer) return;

  STATE.isSubmitted = true;
  stopTimer();

  const elapsed = getElapsedSeconds();

  if (elements.btnSubmit) {
    elements.btnSubmit.disabled = true;
    const txt = elements.btnSubmit.querySelector('.btn-text');
    if (txt) txt.textContent = 'Checking...';
  }

  try {
    let isCorrect = false;

    if (STATE.currentQuestion && STATE.currentQuestion.correctAnswer !== null && STATE.currentQuestion.correctAnswer !== undefined) {
      const userAnswer = String(STATE.selectedAnswer).trim().toLowerCase();
      const correctAnswer = String(STATE.currentQuestion.correctAnswer).trim().toLowerCase();
      isCorrect = userAnswer === correctAnswer;
    } else {
      isCorrect = true; // demo
    }

    const baseScore = isCorrect ? 10 : 0;
    const timeBonus = isCorrect && elapsed < 60 ? Math.max(0, 60 - elapsed) : 0;
    const finalScore = baseScore + timeBonus;

    showFeedback({
      isCorrect,
      baseScore,
      timeBonus: Math.floor(timeBonus),
      finalScore,
      explanation: isCorrect ? 'Correct!' : 'Incorrect. Keep practicing!'
    });

    // Update user stats with points (non-blocking)
    updateUserStats(finalScore).catch(err => {
      console.warn('[Question] Stats update failed (non-critical):', err);
    });

    if (elements.btnNext) elements.btnNext.style.display = 'block';
    if (elements.btnSubmit) elements.btnSubmit.style.display = 'none';

    saveProgress();
  } catch (e) {
    showError(e?.message || 'Failed to process answer.');
    STATE.isSubmitted = false;

    if (elements.btnSubmit) {
      elements.btnSubmit.disabled = false;
      const txt = elements.btnSubmit.querySelector('.btn-text');
      if (txt) txt.textContent = 'Submit';
    }
  }
}

// ==================== NAV ====================

async function markLevelCompleted(level, totalQuestions) {
  const user = getCurrentAuthUser ? getCurrentAuthUser() : (auth.currentUser || window.__authUser);
  if (!user || !user.uid) {
    console.warn('[Question] Cannot mark completion: no user');
    return false;
  }

  try {
    const progressRef = doc(db, 'userProgress', user.uid);
    const progressSnap = await getDoc(progressRef);
    
    const now = serverTimestamp();
    const levelData = {
      completed: true,
      completedAt: now,
      totalQuestions: totalQuestions
    };

    if (progressSnap.exists()) {
      const existing = progressSnap.data();
      await setDoc(progressRef, {
        uid: user.uid,
        levels: {
          ...(existing.levels || {}),
          [level]: levelData
        }
      }, { merge: true });
    } else {
      await setDoc(progressRef, {
        uid: user.uid,
        levels: {
          [level]: levelData
        }
      });
    }

    console.log(`[Question] Marked level ${level} as completed`);
    return true;
  } catch (error) {
    console.error('[Question] Failed to mark level completion:', error);
    return false;
  }
}

async function showCompletion() {
  if (elements.content) {
    elements.content.innerHTML = `
      <div class="completion-message">
        <h2>🎉 Level Complete!</h2>
        <p>You've completed all questions in the ${STATE.level} level.</p>
        <button class="btn btn-primary" id="completion-btn">
          Continue
        </button>
      </div>
    `;
    
    // Handle redirect based on level
    const completionBtn = document.getElementById('completion-btn');
    if (completionBtn) {
      completionBtn.addEventListener('click', async () => {
        // Mark level as completed in Firestore
        const saved = await markLevelCompleted(STATE.level, STATE.questionIds.length);
        if (!saved) {
          console.warn('[Question] Failed to save completion, but continuing anyway');
        }

        // Redirect based on level
        if (STATE.level === 'easy') {
          window.location.href = '/question?level=medium&q=1';
        } else if (STATE.level === 'medium') {
          window.location.href = '/question?level=hard&q=1';
        } else if (STATE.level === 'hard') {
          window.location.href = '/challenges?message=' + encodeURIComponent('🎉 Congratulations! You\'ve completed all levels!');
        } else {
          window.location.href = '/challenges';
        }
      });
    }
  }
  clearProgress();
}

async function loadCurrentQuestion() {
  if (STATE.currentQuestionIndex >= STATE.questionIds.length) {
    await showCompletion();
    return;
  }

  try {
    showLoading();

    const qid = STATE.questionIds[STATE.currentQuestionIndex];
    const question = await loadQuestion(qid);
    renderQuestion(question);

    if (elements.currentQuestion) elements.currentQuestion.textContent = STATE.currentQuestionIndex + 1;

    const newUrl = new URL(window.location);
    newUrl.searchParams.set('q', STATE.currentQuestionIndex + 1);
    window.history.replaceState({}, '', newUrl);

    hideLoading();
  } catch (e) {
    showError(e?.message || 'Failed to load question.');
  }
}

async function handleNext() {
  STATE.currentQuestionIndex++;
  if (STATE.currentQuestionIndex >= STATE.questionIds.length) {
    await showCompletion();
    return;
  }
  loadCurrentQuestion();
}

// ==================== INIT ====================

function initElements() {
  elements.loading = document.getElementById('loading-state');
  elements.content = document.getElementById('question-content');
  elements.error = document.getElementById('error-state');
  elements.errorMessage = document.getElementById('error-message');
  elements.levelBadge = document.getElementById('level-badge');
  elements.currentQuestion = document.getElementById('current-question');
  elements.totalQuestions = document.getElementById('total-questions');
  elements.timer = document.getElementById('timer-text');

  elements.imageContainer = document.getElementById('question-image-container');
  elements.questionImage = document.getElementById('question-image');
  elements.questionTitle = document.getElementById('question-title');
  elements.questionText = document.getElementById('question-text');
  elements.scenarioText = document.getElementById('scenario-text');

  elements.radioOptions = document.getElementById('radio-options');
  elements.shortAnswerContainer = document.getElementById('short-answer-container');
  elements.shortAnswerInput = document.getElementById('short-answer-input');

  elements.btnSubmit = document.getElementById('btn-submit');
  elements.btnNext = document.getElementById('btn-next');

  elements.feedbackPanel = document.getElementById('feedback-panel');
  elements.feedbackStatus = document.getElementById('feedback-status');
  elements.scoreBreakdown = document.getElementById('score-breakdown');
  elements.explanation = document.getElementById('explanation');

  if (elements.btnSubmit) elements.btnSubmit.addEventListener('click', handleSubmit);
  if (elements.btnNext) elements.btnNext.addEventListener('click', handleNext);
}

async function initialize() {
  initElements();

  // ✅ Wait for auth to resolve (then retry a bit to avoid false redirects)
  await waitForAuthReady();

  let user =
    auth.currentUser ||
    (getCurrentAuthUser ? getCurrentAuthUser() : null) ||
    window.__authUser ||
    null;

  for (let i = 0; i < 15 && !user; i++) {
    await new Promise((r) => setTimeout(r, 200)); // up to ~3 seconds
    user =
      auth.currentUser ||
      (getCurrentAuthUser ? getCurrentAuthUser() : null) ||
      window.__authUser ||
      null;
  }

  console.log('[Question] Final auth user:', user?.uid || null);

  if (!user) {
    const loginPath = (typeof window.getPath === 'function') ? window.getPath('login') : '/login';
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href =
      `${loginPath}?next=${next}&message=${encodeURIComponent('Login required to access questions.')}`;
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const level = (urlParams.get('level') || 'easy').toLowerCase();
  const questionParam = urlParams.get('q');

  if (!['easy', 'medium', 'hard'].includes(level)) {
    showError(`Invalid level: ${level}. Please select easy/medium/hard.`);
    return;
  }

  STATE.level = level;

  if (elements.levelBadge) {
    elements.levelBadge.textContent = STATE.level.charAt(0).toUpperCase() + STATE.level.slice(1);
    elements.levelBadge.className = `level-badge level-${STATE.level}`;
  }

  try {
    showLoading();

    const set = await loadQuestionSet(STATE.level);
    STATE.questionIds = set.questionIds;

    if (elements.totalQuestions) elements.totalQuestions.textContent = set.totalQuestions;

    if (questionParam) {
      const n = parseInt(questionParam, 10);
      STATE.currentQuestionIndex = (!isNaN(n) && n >= 1 && n <= set.totalQuestions) ? (n - 1) : 0;
    } else {
      const saved = loadProgress();
      if (
        saved &&
        saved.questionIds &&
        JSON.stringify(saved.questionIds) === JSON.stringify(STATE.questionIds) &&
        saved.level === STATE.level
      ) {
        STATE.currentQuestionIndex = saved.questionIndex || 0;
      } else {
        STATE.currentQuestionIndex = 0;
      }
    }

    await loadCurrentQuestion();
  } catch (e) {
    showError(e?.message || 'Failed to initialize questions.');
  }
}

document.addEventListener('DOMContentLoaded', initialize);
