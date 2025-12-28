// public/js/challenges.js
// SERVER-SIDE ENFORCED: Uses Cloud Functions to check level access

import { auth, db, waitForAuthReady, app, getCurrentAuthUser } from './firebaseInit.js';
// import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first - wait for auth state to be ready
  console.log('[challenges] Waiting for auth to be ready...');
  await waitForAuthReady();
  
  // Get current user after auth is ready (use getCurrentAuthUser for reliability)
  const user = getCurrentAuthUser();
  const isAuthenticated = !!user;
  
  console.log('[challenges] Auth ready. isAuthenticated:', isAuthenticated, 'user:', user ? user.uid : 'null');
  console.log('[challenges] auth.currentUser:', auth.currentUser ? auth.currentUser.uid : 'null');
  
  if (!isAuthenticated) {
    console.log('[challenges] User not authenticated, redirecting to login');
    // Redirect to login with message (use clean paths: /login and /challenges)
    const loginPath = '/login';
    const nextPath = '/challenges';
    window.location.href = `${loginPath}?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent('Login required to start challenges.')}`;
    return;
  }
  
  console.log('[challenges] User authenticated, continuing...');

  // Cloud Function references
  const functions = getFunctions(app, "us-central1");
  
  // Connect to Functions emulator if running locally
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    connectFunctionsEmulator(functions, "127.0.0.1", 5002);
    console.log("[challenges] Using Functions Emulator");
  }
  
  const canStartLevel = httpsCallable(functions, 'canStartLevel');

  // Helper to check level access via Cloud Function (only for medium/hard)
  // TEMPORARY WORKAROUND: Server validation disabled until Cloud Functions are deployed
  // Set ENABLE_MEDIUM_HARD_ACCESS to true to allow medium/hard levels
  const ENABLE_MEDIUM_HARD_ACCESS = false; // TEMPORARY: Set to true to enable medium/hard when server is ready
  
  async function checkLevelAccess(level) {
    // TEMPORARY: Always allow easy level
    if (level === 'easy') {
      return { allowed: true, reason: '' };
    }
    
    // TEMPORARY: Disable medium/hard until Cloud Functions are deployed
    if (!ENABLE_MEDIUM_HARD_ACCESS) {
      return {
        allowed: false,
        reason: 'Server validation temporarily disabled. Medium and Hard levels will be available soon.'
      };
    }
    
    // TEMPORARY: Original code commented out - uncomment when Cloud Functions are deployed
    /*
    try {
      const result = await canStartLevel({ level });
      // Ensure we always get a valid response object
      const data = result?.data || {};
      return {
        allowed: data.allowed === true,
        reason: data.reason || ''
      };
    } catch (error) {
      console.error(`[challenges] Error checking level access for ${level}:`, error);
      // Return a safe fallback response
      return {
        allowed: false,
        reason: 'Failed to check level access. Please try again.'
      };
    }
    */
    
    // TEMPORARY: This should never be reached if ENABLE_MEDIUM_HARD_ACCESS is false
    return {
      allowed: false,
      reason: 'Server validation temporarily disabled.'
    };
  }

  // Load user progress from Firestore
  async function loadUserProgress() {
    const user = getCurrentAuthUser();
    if (!user || !user.uid) {
      console.warn('[challenges] Cannot load progress: no user');
      return null;
    }

    try {
      const progressRef = doc(db, 'userProgress', user.uid);
      const progressSnap = await getDoc(progressRef);
      
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        console.log('[challenges] Loaded user progress:', data);
        return data.levels || null;
      } else {
        console.log('[challenges] No user progress found, treating as all locked except easy');
        return null;
      }
    } catch (error) {
      console.error('[challenges] Failed to load user progress:', error);
      return null;
    }
  }

  // Update UI based on user progress
  async function updateLevelUI() {
    const levels = await loadUserProgress();
    
    // Easy is always enabled
    const easyCard = document.getElementById('level-easy');
    const easyBtn = document.getElementById('btn-easy');
    if (easyCard && easyBtn) {
      easyCard.classList.remove('level-locked');
      easyBtn.disabled = false;
      console.log('[challenges] Easy level enabled (always accessible)');
    }

    // Medium: unlocked if easy.completed == true
    const mediumCard = document.getElementById('level-medium');
    const mediumBtn = document.getElementById('btn-medium');
    const mediumBadge = mediumCard?.querySelector('.level-locked-badge');
    const mediumHint = mediumCard?.querySelector('p:last-of-type');
    
    const easyCompleted = levels?.easy?.completed === true;

    if (mediumCard && mediumBtn) {
      if (easyCompleted) {
        mediumCard.classList.remove('level-locked');
        mediumBtn.disabled = false;
        if (mediumBadge) mediumBadge.style.display = 'none';
        if (mediumHint) mediumHint.style.display = 'none';
        console.log('[challenges] Medium level unlocked (easy completed)');
      } else {
        mediumCard.classList.add('level-locked');
        mediumBtn.disabled = true;
        if (mediumBadge) mediumBadge.style.display = 'block';
        if (mediumHint) {
          mediumHint.textContent = 'Complete Easy level to unlock';
          mediumHint.style.display = 'block';
        }
        console.log('[challenges] Medium level locked (easy not completed)');
      }
    }

    // Hard: unlocked if medium.completed == true
    const hardCard = document.getElementById('level-hard');
    const hardBtn = document.getElementById('btn-hard');
    const hardBadge = hardCard?.querySelector('.level-locked-badge');
    const hardHint = hardCard?.querySelector('p:last-of-type');
    
    const mediumCompleted = levels?.medium?.completed === true;

    if (hardCard && hardBtn) {
      if (mediumCompleted) {
        hardCard.classList.remove('level-locked');
        hardBtn.disabled = false;
        if (hardBadge) hardBadge.style.display = 'none';
        if (hardHint) hardHint.style.display = 'none';
        console.log('[challenges] Hard level unlocked (medium completed)');
      } else {
        hardCard.classList.add('level-locked');
        hardBtn.disabled = true;
        if (hardBadge) hardBadge.style.display = 'block';
        if (hardHint) {
          hardHint.textContent = 'Complete Medium level to unlock';
          hardHint.style.display = 'block';
        }
        console.log('[challenges] Hard level locked (medium not completed)');
      }
    }
  }

  // Open a level (with progress-based verification)
  async function openLevel(level) {
    console.log(`[challenges] Opening level: ${level}`);

    // Easy level: always allowed
    if (level === 'easy') {
      console.log(`[challenges] Easy level - always accessible, redirecting directly`);
      window.location.href = `/question?level=easy&q=1`;
      return;
    }

    // For medium and hard, check progress
    const levels = await loadUserProgress();
    
    if (level === 'medium') {
      const easyCompleted = levels?.easy?.completed === true;
      if (!easyCompleted) {
        console.warn(`[challenges] Access denied for medium: easy not completed`);
        alert('Complete the Easy level to unlock Medium.');
        return;
      }
    } else if (level === 'hard') {
      const mediumCompleted = levels?.medium?.completed === true;
      if (!mediumCompleted) {
        console.warn(`[challenges] Access denied for hard: medium not completed`);
        alert('Complete the Medium level to unlock Hard.');
        return;
      }
    }

    // Access granted, redirect to question page
    console.log(`[challenges] Access granted, redirecting to question page for level: ${level}`);
    window.location.href = `/question?level=${level}&q=1`;
  }

  // Attach event listeners to buttons
  const easyBtn = document.getElementById('btn-easy');
  const mediumBtn = document.getElementById('btn-medium');
  const hardBtn = document.getElementById('btn-hard');

  if (easyBtn) {
    console.log('[challenges] Easy button found, attaching event listener');
    easyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('[challenges] Easy button clicked');
      if (!easyBtn.disabled) {
        await openLevel('easy');
      } else {
        console.warn('[challenges] Easy button is disabled');
      }
    });
  } else {
    console.error('[challenges] Easy button not found!');
  }

  if (mediumBtn) {
    mediumBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!mediumBtn.disabled) {
        await openLevel('medium');
      }
    });
  }

  if (hardBtn) {
    hardBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!hardBtn.disabled) {
        await openLevel('hard');
      }
    });
  }

  // Initial UI update
  updateLevelUI();

  // Side menu toggle
  const sideMenu = document.getElementById('cyber-side-menu');
  const sideDot = document.getElementById('cyber-side-dot');

  if (sideDot && sideMenu) {
    sideDot.addEventListener('click', (e) => {
      e.stopPropagation();
      sideMenu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sideMenu.contains(e.target)) {
        sideMenu.classList.remove('open');
      }
    });
  }

  // Update side menu navigation state
  if (window.updateSideMenuState) {
    window.updateSideMenuState();
  }
});

