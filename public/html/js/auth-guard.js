// public/js/auth-guard.js
// Shared authentication guard module
// Firebase Auth is the single source of truth

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

(function () {
  'use strict';

  async function waitForAuthState(maxWaitMs = 3000) {
    if (!window.auth) return false;

    return new Promise((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        resolve(!!window.auth.currentUser);
      }, maxWaitMs);

      const unsubscribe = onAuthStateChanged(window.auth, (user) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  function isAuthenticatedSync() {
    return !!(window.auth && window.auth.currentUser);
  }

  async function guard(redirectPath = null, onAuthenticated = null) {
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
      const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/login.html';
      
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
