import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

import { firebaseConfig } from './firebaseConfig.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(console.warn);

function updateAuthButton(user) {
  const loginBtn = document.getElementById('nav-login');
  const signupBtn = document.getElementById('nav-signup');
  const userInfoDropdown = document.getElementById('user-info-dropdown');
  const infoFullName = document.getElementById('info-fullname');
  const infoEmail = document.getElementById('info-email');
  const infoPhoto = document.getElementById('info-photo');

  if (user && loginBtn) {
    loginBtn.textContent = 'Logout';
    loginBtn.dataset.state = 'logout';
    // Set onclick handler directly - this replaces any previous handler
    loginBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (loginBtn.disabled) return;
      loginBtn.disabled = true;
      
      try {
        // Clear localStorage on explicit logout
        try { localStorage.removeItem('currentUser'); } catch {}
        
        // Sign out from Firebase
        if (auth) {
          await signOut(auth);
        }
        
        window.location.href = './index.html';
      } catch (err) {
        console.error('[Logout] Error:', err);
        loginBtn.disabled = false;
      }
    };
  } else if (loginBtn) {
    loginBtn.textContent = 'Login';
    loginBtn.dataset.state = 'login';
    // Set onclick handler directly - this replaces any previous handler
    loginBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = './login.html';
    };
  }

  if (signupBtn) {
    signupBtn.style.display = user ? 'none' : 'inline-block';
  }

  if (userInfoDropdown) {
    userInfoDropdown.style.display = user ? 'inline-flex' : 'none';
  }

  if (user) {
    const getProfileFn = typeof window.getProfile === 'function' ? window.getProfile : null;
    const profile = getProfileFn ? getProfileFn() : null;
    const fullName = profile?.fullName || user.displayName || (user.email ? user.email.split('@')[0] : '—');
    const email = profile?.email || user.email || '—';

    if (infoFullName) infoFullName.textContent = fullName || '—';
    if (infoEmail) infoEmail.textContent = email || '—';
    if (infoPhoto) {
      const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
      infoPhoto.src = profile?.photo || user.photoURL || defaultSrc || infoPhoto.src;
    }
    // Only update localStorage when user is authenticated
    // Don't remove it when user is null - that happens on explicit logout only
    try { localStorage.setItem('currentUser', user.email || user.uid); } catch {}
  } else {
    // When user is null, only clear UI - DON'T remove localStorage
    // localStorage is only cleared on explicit logout (see logout handlers)
    if (infoFullName) infoFullName.textContent = '—';
    if (infoEmail) infoEmail.textContent = '—';
    if (infoPhoto) {
      const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
      if (defaultSrc) infoPhoto.src = defaultSrc;
    }
    // REMOVED: localStorage.removeItem('currentUser') - this was causing logout on navigation
  }
}

onAuthStateChanged(auth, (user) => {
  console.log('[Auth State]', user ? 'Logged in' : 'Logged out');
  updateAuthButton(user);
});

// Export auth instance for use in other modules
window.auth = auth;
window.firebaseApp = app;


