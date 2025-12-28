// public/js/auth-guard.js
// Shared authentication guard module
// Firebase Auth is the single source of truth
// Uses firebaseInit.js for auth readiness

(function () {
  'use strict';

  /**
   * Wait for auth state to be ready (no timeout - waits for Firebase to resolve)
   * Uses waitForAuthReady from firebaseInit.js
   * @returns {Promise<boolean>} True if authenticated, false otherwise
   */
  async function waitForAuthState() {
    // Use waitForAuthReady from firebaseInit.js
    if (typeof window.waitForAuthReady === 'function') {
      return await window.waitForAuthReady();
    }
    
    // Fallback if firebaseInit.js hasn't loaded yet
    // This should not happen if scripts are loaded in correct order
    console.warn('[auth-guard] waitForAuthReady not available, waiting...');
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (typeof window.waitForAuthReady === 'function') {
          clearInterval(checkInterval);
          window.waitForAuthReady().then(resolve);
        } else if (window.__authReady) {
          clearInterval(checkInterval);
          resolve(!!window.__authUser);
        }
      }, 50);
      
      // Safety timeout after 5 seconds (should never happen)
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Synchronous auth check (may return false if auth not ready yet)
   * Use waitForAuthState() for reliable checks
   * @returns {boolean} True if authenticated
   */
  function isAuthenticatedSync() {
    return !!(window.__authUser);
  }

  /**
   * Guard function - waits for auth readiness before making decision
   * @param {string|null} redirectPath - Path to redirect to if not authenticated
   * @param {Function|null} onAuthenticated - Callback if authenticated
   * @returns {Promise<boolean>} True if authenticated, false if redirected
   */
  async function guard(redirectPath = null, onAuthenticated = null) {
    // Wait for auth state to be ready (no arbitrary timeout)
    const isAuth = await waitForAuthState();

    if (!isAuth) {
      // Get current path (origin-relative, no protocol/host/port) to preserve localStorage/auth state
      const rawPath = redirectPath || (window.location.pathname + window.location.search);
      
      // Sanitize path to ensure it's in BASE_PATH and prevent duplication
      const pathOnly = rawPath.split('?')[0];
      const queryOnly = rawPath.includes('?') ? rawPath.split('?')[1] : '';
      const sanitizedPathOnly = typeof sanitizePath === 'function' 
        ? sanitizePath(pathOnly)
        : pathOnly;
      const sanitizedPath = sanitizedPathOnly + (queryOnly ? '?' + queryOnly : '');
      
      // Build login URL with next parameter (all origin-relative)
      const params = new URLSearchParams();
      params.set('next', sanitizedPath);
      const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/login';
      
      // Use origin-relative path (no protocol/host/port) to stay on same origin
      window.location.href = `${loginPath}?${params.toString()}`;
      return false;
    }

    if (typeof onAuthenticated === 'function') onAuthenticated();
    return true;
  }

  window.waitForAuthState = waitForAuthState;
  window.isAuthenticatedSync = isAuthenticatedSync;
  window.authGuard = guard;
})();
