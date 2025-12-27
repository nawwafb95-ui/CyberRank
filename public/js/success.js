// public/js/success.js
// Success page - uses Firebase Auth from firebaseInit.js
import { auth, waitForAuthReady } from './firebaseInit.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('success-user');

  // Wait for auth state to be ready to avoid showing wrong user state on initial load
  const isAuthenticated = await waitForAuthReady();
  const user = window.__authUser;

  // Update UI with current user state
  if (el && user) {
    // Security: Use textContent to prevent XSS, then add safe HTML via DOM
    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    el.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = displayName;
    el.appendChild(document.createTextNode('Welcome, '));
    el.appendChild(strong);
    el.appendChild(document.createTextNode(' — your journey starts now.'));
  } else if (el) {
    // User not logged in - clear welcome message
    el.textContent = '';
  }

  // Listen for auth state changes (logout, etc.)
  onAuthStateChanged(auth, (user) => {
    if (el && user) {
      const displayName = user.displayName || user.email?.split('@')[0] || 'User';
      el.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = displayName;
      el.appendChild(document.createTextNode('Welcome, '));
      el.appendChild(strong);
      el.appendChild(document.createTextNode(' — your journey starts now.'));
    } else if (el) {
      el.textContent = '';
    }
  });

  const confettiBox = document.getElementById('confetti');
  if (confettiBox) {
    confettiBox.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 1.2) + 's';
      s.style.background = Math.random() > 0.5
        ? 'linear-gradient(180deg, var(--brand-blue), var(--brand-cyan))'
        : 'linear-gradient(180deg, #ff8cc6, #ffc46b)';
      confettiBox.appendChild(s);
    }
  }

  const toHome  = document.getElementById('success-home');
  const toLogin = document.getElementById('success-login');

  if (toHome) {
    toHome.addEventListener('click', () => {
      const homePath = typeof getPath === 'function' ? getPath('home') : '/html/index.html';
      location.href = homePath;
    });
  }

  if (toLogin) {
    toLogin.addEventListener('click', () => {
      const loginPath = typeof getPath === 'function' ? getPath('login') : '/html/login.html';
      location.href = loginPath;
    });
  }
});
