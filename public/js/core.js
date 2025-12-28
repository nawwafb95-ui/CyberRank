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
  // All paths use clean routes (no .html extension, no /html/ prefix)
  // Firebase Hosting rewrites handle routing to /html/ folder
  
  // Path constants for all pages - clean routes
  const PATHS = {
    home: '/',
    login: '/login',
    signup: '/signup',
    profile: '/profile',
    otp: '/success',
    forgotPassword: '/forgot-password',
    challenges: '/challenges',
    question: '/question',
    leaderboard: '/leaderboard',
    settings: '/settings',
    about: '/about',
    quizzes: '/quizzes',
    dashboard: '/dashboard'
  };

  /**
   * Get absolute path for a page
   * @param {string} page - Page name (e.g., 'home', 'login', 'profile')
   * @returns {string} Clean route path (e.g., '/login', '/profile')
   */
  function getPath(page) {
    return PATHS[page] || PATHS.home;
  }

  /**
   * Sanitize path to use clean routes
   * @param {string} path - Path to sanitize
   * @returns {string} Sanitized clean route
   */
  function sanitizePath(path) {
    if (!path) return PATHS.home;
    
    // Remove .html extension and /html/ prefix for clean routes
    path = path.replace(/\.html$/, '');
    path = path.replace(/^\/html\//, '/');
    
    // Ensure path starts with /
    if (!path.startsWith('/') && !path.startsWith('./') && !path.startsWith('../')) {
      path = '/' + path;
    }
    
    return path;
  }

  /**
   * Sanitize and validate next parameter for redirects
   * @param {string} nextPath - Path from next parameter
   * @returns {string} Safe, normalized clean route
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
    
    // Fix /html/html/ duplication (convert to clean route)
    decoded = decoded.replace(/\/html\/html\//g, '/');
    decoded = decoded.replace(/\/html\/html\//g, '/'); // Run twice to catch nested duplications
    
    // Sanitize path (converts to clean route)
    const sanitized = sanitizePath(decoded);
    
    // Remove .html extension and /html/ prefix for clean routes
    let finalPath = sanitized;
    if (finalPath.startsWith('./') || finalPath.startsWith('../')) {
      // Relative paths: convert to absolute clean route
      finalPath = finalPath.replace(/^\.\.?\//, '');
    }
    
    // Remove .html extension and /html/ prefix for clean routes
    finalPath = finalPath.replace(/\.html$/, '');
    finalPath = finalPath.replace(/^\/html\//, '/');
    
    // Ensure path starts with /
    if (!finalPath.startsWith('/')) {
      finalPath = '/' + finalPath;
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
    
    // Fix /html/html/ duplication (convert to clean route)
    if (currentPath.includes('/html/html/')) {
      const fixedPath = sanitizePath(currentPath);
      const fixedUrl = fixedPath + search;
      console.warn('[Path Fix] Correcting duplication:', currentPath, '->', fixedPath);
      window.location.replace(fixedUrl);
      return;
    }
    
    // Fix paths that have /html/ prefix (convert to clean route)
    if (currentPath.startsWith('/html/') && currentPath.endsWith('.html')) {
      const fixedPath = sanitizePath(currentPath);
      const fixedUrl = fixedPath + search;
      console.warn('[Path Fix] Converting /html/ path to clean route:', currentPath, '->', fixedPath);
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

