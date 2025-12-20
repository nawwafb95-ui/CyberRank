// public/js/auth-guard.js
// Shared authentication guard module
// Waits for Firebase auth state resolution before making decisions

(function() {
  'use strict';

  /**
   * Wait for Firebase auth to initialize and resolve auth state
   * @param {number} maxWaitMs - Maximum time to wait in milliseconds (default: 3000)
   * @returns {Promise<boolean>} - true if authenticated, false otherwise
   */
  async function waitForAuthState(maxWaitMs = 3000) {
    // If Firebase auth is not available, check localStorage only
    if (!window.auth) {
      return !!localStorage.getItem('currentUser');
    }

    // Wait for auth state to be resolved
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Timeout: fallback to localStorage check
          resolve(!!localStorage.getItem('currentUser'));
        }
      }, maxWaitMs);

      // Use onAuthStateChanged to wait for initial state
      const unsubscribe = window.auth.onAuthStateChanged((user) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          unsubscribe();
          
          // Check both Firebase auth and localStorage
          const firebaseAuth = user !== null;
          const localAuth = !!localStorage.getItem('currentUser');
          resolve(firebaseAuth || localAuth);
        }
      });
    });
  }

  /**
   * Check if user is authenticated (synchronous check)
   * @returns {boolean}
   */
  function isAuthenticatedSync() {
    // Check Firebase auth first if available
    if (window.auth && window.auth.currentUser) {
      return true;
    }
    // Fallback to localStorage check
    return !!localStorage.getItem('currentUser');
  }

  /**
   * Guard a protected page - redirects to login if not authenticated
   * @param {string} redirectPath - Path to redirect to after login (default: current page)
   * @param {Function} onAuthenticated - Callback when authenticated
   */
  async function guard(redirectPath = null, onAuthenticated = null) {
    const isAuth = await waitForAuthState();
    
    if (!isAuth) {
      // Build redirect URL with next parameter
      const currentPath = redirectPath || window.location.pathname;
      const params = new URLSearchParams();
      params.set('next', currentPath);
      const loginUrl = `./login.html?${params.toString()}`;
      
      window.location.href = loginUrl;
      return false;
    }
    
    if (onAuthenticated && typeof onAuthenticated === 'function') {
      onAuthenticated();
    }
    
    return true;
  }

  // Export functions
  window.waitForAuthState = waitForAuthState;
  window.isAuthenticatedSync = isAuthenticatedSync;
  window.authGuard = guard;
})();

