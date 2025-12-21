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

  // ===== Local Users Storage (legacy; keep only if you still use it for profile extras) =====
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('users') || '{}');
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  function findUserByUsername(username) {
    const users = getUsers();
    for (const email in users) {
      const u = users[email];
      if (!u) continue;
      const uname = u.username || (email.split('@')[0]);
      if (uname.toLowerCase() === username.toLowerCase()) return u;
    }
    return null;
  }

  function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;
    return findUserByUsername(username);
  }

  function isLoggedIn() {
    return !!(window.auth && window.auth.currentUser);
  }

  // ===== Centralized Path Helpers =====
  // BASE_PATH: All internal navigation uses this base to ensure same-origin navigation
  // This prevents localStorage/auth state loss when navigating between different origins/ports
  const BASE_PATH = '';
  
  // Path constants for all pages (origin-relative, no /html prefix since root is public/html)
  const PATHS = {
    home: '/index.html',
    login: '/login.html',
    signup: '/signup.html',
    profile: '/profile.html',
    otp: '/success.html',
    forgotPassword: '/forgot-password.html',
    challenges: '/challenges.html',
    question: '/question.html',
    leaderboard: '/leaderboard.html',
    settings: '/settings.html',
    about: '/about.html',
    quizzes: '/quizzes.html',
    dashboard: '/dashboard.html'
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
   * Sanitize path to remove /html/html/ duplication
   * @param {string} path - Path to sanitize
   * @returns {string} Sanitized path
   */
  function sanitizePath(path) {
    if (!path) return PATHS.home;
    
    // Remove any /html/ prefix and /html/html/ duplication
    path = path.replace(/^\/html\//, '/');
    path = path.replace(/\/html\/html\//g, '/');
    
    // If path doesn't start with / and ends with .html, ensure it's absolute
    if (path.endsWith('.html') && !path.startsWith('/')) {
      if (path.startsWith('./') || path.startsWith('../')) {
        // Keep relative paths as-is for same-directory navigation
        return path;
      }
      path = '/' + path.replace(/^\.?\//, '');
    }
    
    return path;
  }

  /**
   * Sanitize and validate next parameter for redirects
   * @param {string} nextPath - Path from next parameter
   * @returns {string} Safe, normalized absolute path
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
    
    // Remove any /html/ prefix and /html/html/ duplication
    decoded = decoded.replace(/^\/html\//, '/');
    decoded = decoded.replace(/\/html\/html\//g, '/');
    
    // Sanitize path
    const sanitized = sanitizePath(decoded);
    
    // Ensure it starts with / (origin-relative, no protocol/host/port)
    let finalPath = sanitized;
    if (!finalPath.startsWith('/')) {
      if (finalPath.startsWith('./') || finalPath.startsWith('../')) {
        // Keep relative paths as-is
        finalPath = sanitized;
      } else {
        finalPath = '/' + finalPath.replace(/^\.?\//, '');
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
    try { localStorage.removeItem('currentUser'); } catch {}
    try { localStorage.removeItem('user'); } catch {}

    if (window.auth && typeof window.auth.signOut === 'function') {
      try { await window.auth.signOut(); } catch (e) { console.error(e); }
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
      const u = window.auth.currentUser;

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
    
    // Check if path contains /html/ and convert to root-relative
    if (currentPath.includes('/html/')) {
      const fixedPath = sanitizePath(currentPath);
      const fixedUrl = fixedPath + search;
      console.warn('[Path Fix] Correcting path:', currentPath, '->', fixedPath);
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
  window.getUsers = getUsers;
  window.saveUsers = saveUsers;
  window.findUserByUsername = findUserByUsername;
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

