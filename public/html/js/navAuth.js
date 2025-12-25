// Navigation auth UI updates
// Uses Firebase Auth from firebaseInit.js (single source of truth)
import { auth } from './firebaseInit.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

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
        // REFACTORED: Use Firebase signOut only - removed localStorage clearing
        // Firebase Auth manages session state, no need to clear localStorage
        if (auth) {
          await signOut(auth);
        }
        
        const homePath = typeof window.getPath === 'function' ? window.getPath('home') : '/html/index.html';
        window.location.href = homePath;
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
      const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
      window.location.href = loginPath;
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
    // REMOVED: localStorage.setItem('currentUser') - Firebase Auth manages session state
  } else {
    // When user is null, only clear UI
    // Firebase Auth state is managed by onAuthStateChanged, no localStorage needed
    if (infoFullName) infoFullName.textContent = '—';
    if (infoEmail) infoEmail.textContent = '—';
    if (infoPhoto) {
      const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
      if (defaultSrc) infoPhoto.src = defaultSrc;
    }
    // REMOVED: localStorage operations - Firebase Auth is single source of truth
  }
}

// Listen for auth state changes (firebaseInit.js sets up the initial listener)
// We listen to the custom events to update UI
window.addEventListener('auth:ready', (e) => {
  updateAuthButton(e.detail.user);
});

window.addEventListener('auth:state-changed', (e) => {
  updateAuthButton(e.detail.user);
});

// Initial UI update when page loads (if auth is already ready)
if (window.__authReady) {
  updateAuthButton(window.__authUser);
}


