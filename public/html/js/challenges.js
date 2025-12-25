// public/js/challenges.js
// SERVER-SIDE ENFORCED: Uses Cloud Functions to check level access

import { auth, db, waitForAuthReady, app } from './firebaseInit.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  const isAuthenticated = await waitForAuthReady();
  if (!isAuthenticated || !auth.currentUser) {
    // Redirect to login with message
    const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
    window.location.href = `${loginPath}?next=${encodeURIComponent('/html/challenges.html')}&message=${encodeURIComponent('Login required to start challenges.')}`;
    return;
  }

  // Cloud Function references
  const functions = getFunctions(app);
  const canStartLevel = httpsCallable(functions, 'canStartLevel');

  // Helper to check level access via Cloud Function
  async function checkLevelAccess(level) {
    try {
      const result = await canStartLevel({ level });
      return result.data;
    } catch (error) {
      console.error(`[challenges] Error checking level access for ${level}:`, error);
      return { allowed: false, reason: 'Failed to check level access. Please try again.' };
    }
  }

  // Update UI based on server-side access checks
  async function updateLevelUI() {
    // Easy is always enabled (but still check server-side)
    const easyCard = document.getElementById('level-easy');
    const easyBtn = document.getElementById('btn-easy');
    if (easyCard && easyBtn) {
      const easyAccess = await checkLevelAccess('easy');
      if (easyAccess.allowed) {
        easyCard.classList.remove('level-locked');
        easyBtn.disabled = false;
      } else {
        easyCard.classList.add('level-locked');
        easyBtn.disabled = true;
        console.warn('[challenges] Easy level not accessible:', easyAccess.reason);
      }
    }

    // Medium: check server-side access
    const mediumCard = document.getElementById('level-medium');
    const mediumBtn = document.getElementById('btn-medium');
    const mediumBadge = mediumCard?.querySelector('.level-locked-badge');
    const mediumHint = mediumCard?.querySelector('p:last-of-type');
    
    if (mediumCard && mediumBtn) {
      const mediumAccess = await checkLevelAccess('medium');
      if (mediumAccess.allowed) {
        mediumCard.classList.remove('level-locked');
        mediumBtn.disabled = false;
        if (mediumBadge) mediumBadge.style.display = 'none';
        if (mediumHint) mediumHint.style.display = 'none';
      } else {
        mediumCard.classList.add('level-locked');
        mediumBtn.disabled = true;
        if (mediumBadge) mediumBadge.style.display = 'block';
        if (mediumHint) {
          mediumHint.textContent = mediumAccess.reason || 'Complete Easy level to unlock';
          mediumHint.style.display = 'block';
        }
      }
    }

    // Hard: check server-side access
    const hardCard = document.getElementById('level-hard');
    const hardBtn = document.getElementById('btn-hard');
    const hardBadge = hardCard?.querySelector('.level-locked-badge');
    const hardHint = hardCard?.querySelector('p:last-of-type');
    
    if (hardCard && hardBtn) {
      const hardAccess = await checkLevelAccess('hard');
      if (hardAccess.allowed) {
        hardCard.classList.remove('level-locked');
        hardBtn.disabled = false;
        if (hardBadge) hardBadge.style.display = 'none';
        if (hardHint) hardHint.style.display = 'none';
      } else {
        hardCard.classList.add('level-locked');
        hardBtn.disabled = true;
        if (hardBadge) hardBadge.style.display = 'block';
        if (hardHint) {
          hardHint.textContent = hardAccess.reason || 'Complete Medium level to unlock';
          hardHint.style.display = 'block';
        }
      }
    }
  }

  // Open a level (with server-side verification)
  async function openLevel(level) {
    // Check server-side access before redirecting
    const access = await checkLevelAccess(level);
    
    if (!access.allowed) {
      alert(access.reason || `You cannot access the ${level} level yet.`);
      return;
    }

    // Server-side check passed, redirect to question page
    window.location.href = `/html/question.html?level=${level}&q=1`;
  }

  // Attach event listeners to buttons
  const easyBtn = document.getElementById('btn-easy');
  const mediumBtn = document.getElementById('btn-medium');
  const hardBtn = document.getElementById('btn-hard');

  if (easyBtn) {
    easyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!easyBtn.disabled) {
        openLevel('easy');
      }
    });
  }

  if (mediumBtn) {
    mediumBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!mediumBtn.disabled) {
        openLevel('medium');
      }
    });
  }

  if (hardBtn) {
    hardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!hardBtn.disabled) {
        openLevel('hard');
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

