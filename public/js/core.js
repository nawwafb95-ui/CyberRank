// public/js/core.js
(function () {
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Dropdowns
  function wireDropdown(rootSel, btnSel) {
    const root = $(rootSel);
    const btn  = $(btnSel);
    if (!root || !btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      root.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) root.classList.remove('open');
    });
  }

  function initThemeControls() {
    wireDropdown('#settings-dd', '#settings-btn');
    wireDropdown('#user-info-dropdown', '#user-info-btn');
  }

  // ===== Firebase Auth - Single Source of Truth =====
  // All authentication state comes from Firebase Auth via window.__authUser
  // localStorage is NOT used for authentication
  
  /**
   * Check if user is logged in
   * Uses window.__authUser (Firebase auth state) - set by firebaseInit.js
   * @returns {boolean} True if user is authenticated
   */
  function isLoggedIn() {
    // Use window.__authUser which is set by firebaseInit.js after auth state resolves
    return !!(window.__authUser);
  }
  
  /**
   * Get current authenticated user
   * Returns Firebase auth user from window.__authUser (set by firebaseInit.js)
   * @returns {User|null} Firebase auth user or null
   */
  function getCurrentUser() {
    // Use window.__authUser which is set by firebaseInit.js
    return window.__authUser || null;
  }
  
  // ===== REMOVED: localStorage-based auth functions =====
  // These functions have been completely removed as they were used for
  // localStorage-based authentication which is insecure and has been replaced
  // with Firebase Auth.
  // 
  // REMOVED: getUsers() - was storing users/passwords in localStorage
  // REMOVED: saveUsers() - was storing users/passwords in localStorage
  // REMOVED: findUserByUsername() - was using localStorage for user lookup
  // 
  // If you need user profile data, use Firestore (users collection) instead.

  // ===== Centralized Path Helpers =====
  // BASE_PATH: All internal navigation uses /html/ as the base path
  // The app is served under /html/ subfolder, so all paths must include this prefix
  const BASE_PATH = '/html';
  
  // Path constants for all pages - ALL paths must be prefixed with /html/
  const PATHS = {
    home: '/html/index.html',
    login: '/html/login.html',
    signup: '/html/signup.html',
    profile: '/html/profile.html',
    otp: '/html/success.html',
    forgotPassword: '/html/forgot-password.html',
    challenges: '/html/challenges.html',
    question: '/html/question.html',
    leaderboard: '/html/leaderboard.html',
    settings: '/html/settings.html',
    about: '/html/about.html',
    quizzes: '/html/quizzes.html',
    dashboard: '/html/dashboard.html'
  };

  /**
   * Get absolute path for a page
   * @param {string} page - Page name (e.g., 'home', 'login', 'profile')
   * @returns {string} Absolute path starting with /html/
   */
  function getPath(page) {
    return PATHS[page] || PATHS.home;
  }

  /**
   * Sanitize path to fix /html/html/ duplication while preserving /html/ base
   * @param {string} path - Path to sanitize
   * @returns {string} Sanitized path with /html/ prefix
   */
  function sanitizePath(path) {
    if (!path) return PATHS.home;
    
    // Fix /html/html/ duplication (keep only one /html/)
    path = path.replace(/\/html\/html\//g, '/html/');
    path = path.replace(/\/html\/html\//g, '/html/'); // Run twice to catch nested duplications
    
    // Ensure path starts with /html/ if it's an absolute path
    if (path.startsWith('/') && !path.startsWith('/html/')) {
      // If it's an absolute path without /html/, add it
      if (path.endsWith('.html') || path.includes('/')) {
        path = '/html' + path;
      }
    }
    
    // If path doesn't start with / and ends with .html, ensure it's absolute with /html/
    if (path.endsWith('.html') && !path.startsWith('/')) {
      if (path.startsWith('./') || path.startsWith('../')) {
        // Keep relative paths as-is for same-directory navigation
        return path;
      }
      path = '/html/' + path.replace(/^\.?\//, '');
    }
    
    // Final check: ensure all absolute paths have /html/ prefix
    if (path.startsWith('/') && !path.startsWith('/html/') && path.endsWith('.html')) {
      path = '/html' + path;
    }
    
    return path;
  }

  /**
   * Sanitize and validate next parameter for redirects
   * @param {string} nextPath - Path from next parameter
   * @returns {string} Safe, normalized absolute path with /html/ prefix
   */
  function sanitizeNextPath(nextPath) {
    if (!nextPath) return PATHS.home;
    
    // Decode URL-encoded path
    let decoded;
    try {
      decoded = decodeURIComponent(nextPath);
    } catch (e) {
      console.warn('[Path Sanitize] Failed to decode next parameter:', nextPath);
      return PATHS.home;
    }
    
    // Reject external URLs (security: prevent open redirect)
    if (decoded.startsWith('http://') || decoded.startsWith('https://') || 
        decoded.startsWith('//') || decoded.startsWith('javascript:') ||
        decoded.startsWith('data:') || decoded.startsWith('file:')) {
      console.warn('[Path Sanitize] Rejected external URL:', decoded);
      return PATHS.home;
    }
    
    // Fix /html/html/ duplication (keep only one /html/)
    decoded = decoded.replace(/\/html\/html\//g, '/html/');
    decoded = decoded.replace(/\/html\/html\//g, '/html/'); // Run twice to catch nested duplications
    
    // Sanitize path (this will ensure /html/ prefix)
    const sanitized = sanitizePath(decoded);
    
    // Ensure it starts with /html/ (all paths must be under /html/ base)
    let finalPath = sanitized;
    if (!finalPath.startsWith('/html/')) {
      if (finalPath.startsWith('./') || finalPath.startsWith('../')) {
        // Relative paths: convert to absolute with /html/ prefix
        // Remove ./ or ../ and prepend /html/
        finalPath = '/html/' + finalPath.replace(/^\.\.?\//, '');
      } else if (finalPath.startsWith('/')) {
        // Absolute path without /html/: add it
        finalPath = '/html' + finalPath;
      } else {
        // No leading slash: add /html/ prefix
        finalPath = '/html/' + finalPath.replace(/^\.?\//, '');
      }
    }
    
    // Prevent redirect loops: don't redirect to login or signup pages
    if (finalPath === PATHS.login || finalPath === PATHS.signup) {
      console.warn('[Path Sanitize] Prevented redirect loop to:', finalPath);
      return PATHS.home;
    }
    
    return finalPath;
  }

  /**
   * Normalize next parameter for redirects (alias for sanitizeNextPath)
   * @param {string} nextPath - Path from next parameter
   * @returns {string} Normalized absolute path
   */
  function normalizeNextPath(nextPath) {
    return sanitizeNextPath(nextPath);
  }

  function go(target) {
    // Use sanitizePath to handle all cases
    // Always use origin-relative paths (no protocol/host/port) to preserve localStorage/auth state
    const path = sanitizePath(target || PATHS.home);
    window.location.href = path;
  }

  async function logout() {
    // REFACTORED: Use Firebase signOut only - removed localStorage clearing
    // Firebase Auth manages session state, no need to clear localStorage
    if (window.auth) {
      try {
        // Try to use signOut if available (imported in navAuth.js)
        // If signOut is not in scope, navAuth.js's logout handler will handle it
        if (typeof signOut === 'function') {
          await signOut(window.auth);
        } else {
          // Fallback: trigger logout via navAuth.js's handler or redirect
          // The actual signOut is handled by navAuth.js's updateAuthButton logout handler
          console.warn('[Logout] signOut not available, redirecting to home');
        }
      } catch (e) { 
        console.error('[Logout] Error:', e); 
      }
    }

    updateNavigationState();
    go(getPath('home'));
  }

  function updateNavigationState() {
    const navLogin = document.getElementById('nav-login');
    const navSignup = document.getElementById('nav-signup');
    const userInfoDropdown = document.getElementById('user-info-dropdown');
    const infoFullName = document.getElementById('info-fullname');
    const infoEmail = document.getElementById('info-email');
    const infoPhoto = document.getElementById('info-photo');

    if (isLoggedIn()) {
      const u = window.__authUser || getCurrentUser();

      if (navLogin) navLogin.textContent = 'Logout';
      if (navSignup) navSignup.style.display = 'none';
      if (userInfoDropdown) userInfoDropdown.style.display = 'inline-flex';

      const email = u?.email || '—';
      const name =
        u?.displayName ||
        (email && email.includes('@') ? email.split('@')[0] : '') ||
        '—';

      if (infoFullName) infoFullName.textContent = name;
      if (infoEmail) infoEmail.textContent = email;

      if (infoPhoto) {
        const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
        // If you later store photoURL in Firebase profile, use u.photoURL
        infoPhoto.src = u?.photoURL || defaultSrc || infoPhoto.src;
      }
    } else {
      if (navLogin) {
        navLogin.textContent = 'Login';
        navLogin.onclick = () => go(getPath('login'));
      }
      if (navSignup) {
        navSignup.style.display = 'inline-block';
        navSignup.onclick = () => go(getPath('signup'));
      }
      if (userInfoDropdown) userInfoDropdown.style.display = 'none';
      if (infoFullName) infoFullName.textContent = '—';
      if (infoEmail) infoEmail.textContent = '—';
      if (infoPhoto) {
        const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
        if (defaultSrc) infoPhoto.src = defaultSrc;
      }
    }
  }

  function initTopNav() {
    const homeBtn = document.getElementById('go-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        go(getPath('home'));
      });
    }

    const navQuizzes = document.getElementById('nav-quizzes');
    if (navQuizzes) {
      navQuizzes.addEventListener('click', () => {
        if (isLoggedIn()) go(getPath('quizzes'));
        else go(getPath('login'));
      });
    }

    updateNavigationState();
  }

  // ===== Error helpers =====
  function setError(inputId, message) {
    const p = document.querySelector(`[data-error-for="${inputId}"]`);
    if (p) p.textContent = message || '';
  }

  function clearErrors(form) {
    form.querySelectorAll('.error').forEach(e => (e.textContent = ''));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  // ===== Defensive Fix: Auto-correct duplicated paths on page load =====
  function fixDuplicatedPaths() {
    const currentPath = window.location.pathname;
    const search = window.location.search;
    
    // Fix /html/html/ duplication while preserving /html/ base
    // If path doesn't start with /html/, add it (shouldn't happen but defensive)
    if (currentPath.startsWith('/') && !currentPath.startsWith('/html/') && currentPath.endsWith('.html')) {
      const fixedPath = '/html' + currentPath;
      const fixedUrl = fixedPath + search;
      console.warn('[Path Fix] Adding /html/ prefix:', currentPath, '->', fixedPath);
      window.location.replace(fixedUrl);
      return;
    }
    
    // Fix /html/html/ duplication
    if (currentPath.includes('/html/html/')) {
      const fixedPath = sanitizePath(currentPath);
      const fixedUrl = fixedPath + search;
      console.warn('[Path Fix] Correcting duplication:', currentPath, '->', fixedPath);
      window.location.replace(fixedUrl);
      return;
    }
    
    // Check and fix next parameter in query string
    if (search) {
      const urlParams = new URLSearchParams(search);
      const nextParam = urlParams.get('next');
      if (nextParam) {
        const normalized = sanitizeNextPath(nextParam);
        // Always update if different (handles encoding, sanitization, etc.)
        if (normalized !== nextParam && normalized !== decodeURIComponent(nextParam)) {
          urlParams.set('next', normalized);
          const fixedSearch = '?' + urlParams.toString();
          const fixedUrl = currentPath + fixedSearch;
          console.warn('[Path Fix] Correcting next parameter:', nextParam, '->', normalized);
          window.location.replace(fixedUrl);
          return;
        }
      }
    }
  }

  // Run defensive fix immediately
  if (typeof window !== 'undefined') {
    fixDuplicatedPaths();
  }

  // Expose to window
  window.$ = $;
  window.$$ = $$;
  window.go = go;
  window.getPath = getPath;
  window.sanitizePath = sanitizePath;
  window.sanitizeNextPath = sanitizeNextPath;
  window.normalizeNextPath = normalizeNextPath;
  window.PATHS = PATHS;
  window.BASE_PATH = BASE_PATH;
  // REMOVED: getUsers, saveUsers, findUserByUsername exports
  // These functions have been removed as they were used for localStorage-based auth
  window.getCurrentUser = getCurrentUser;
  window.isLoggedIn = isLoggedIn;
  window.logout = logout;
  window.initThemeControls = initThemeControls;
  window.initTopNav = initTopNav;
  window.updateNavigationState = updateNavigationState;
  window.setError = setError;
  window.clearErrors = clearErrors;
  window.emailRegex = emailRegex;
})();

