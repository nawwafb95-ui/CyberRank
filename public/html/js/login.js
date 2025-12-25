// public/js/login.js
// Firebase Auth login - single source of truth
// Import auth from unified firebaseInit module
import { auth } from './firebaseInit.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { handleError, clearAllErrors } from './errorMessages.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
  
    // Access window globals from core.js (module-safe)
    const { setError, clearErrors, emailRegex, getPath, sanitizePath, sanitizeNextPath, normalizeNextPath } = window;
  
    function validateLogin(form) {
      // Use window globals safely
      if (clearErrors) clearErrors(form);
      clearAllErrors(form);
      let ok = true;
      // Firebase Auth requires email - accept both email and username fields from form
      // but validate that input is actually an email (no username-to-email hacks)
      const emailOrUsername = form.email?.value.trim() || form.username?.value.trim();
      const password = form.password?.value;
      
      if (!emailOrUsername) { 
        if (setError) setError('login-username', 'Email is required.'); 
        ok = false; 
      } else if (emailRegex && !emailRegex.test(emailOrUsername)) {
        if (setError) setError('login-username', 'Enter a valid email address.'); 
        ok = false; 
      }
      
      if (!password) { 
        if (setError) setError('login-password', 'Password is required.');  
        ok = false; 
      }
      
      return { ok, values: { email: emailOrUsername, password } };
    }
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const { ok, values } = validateLogin(loginForm);
      if (!ok) return;
  
      const loginStatus = document.getElementById('login-status');
      if (loginStatus) {
        loginStatus.textContent = 'Signing in...';
        loginStatus.className = '';
      }
  
      try {
        // Use Firebase Auth signInWithEmailAndPassword
        // Firebase Auth is the single source of truth - no localStorage needed
        await signInWithEmailAndPassword(auth, values.email, values.password);
  
        // Check for ?next parameter for redirect after login
        const urlParams = new URLSearchParams(window.location.search);
        const nextRaw = urlParams.get('next');
        
        // Decode and sanitize next parameter
        let nextDecoded = null;
        if (nextRaw) {
          try {
            nextDecoded = decodeURIComponent(nextRaw);
          } catch (e) {
            console.warn('[Login] Failed to decode next parameter:', nextRaw);
            nextDecoded = null;
          }
        }
        
        // Sanitize next path: reject external URLs, fix duplicates, prevent loops
        let nextSafe;
        if (sanitizeNextPath && typeof sanitizeNextPath === 'function') {
          nextSafe = sanitizeNextPath(nextRaw || '');
        } else if (normalizeNextPath && typeof normalizeNextPath === 'function') {
          nextSafe = normalizeNextPath(nextRaw || '');
        } else {
        // Fallback: basic sanitization
        // All paths must be under /html/ base
        if (!nextDecoded || nextDecoded.startsWith('http://') || nextDecoded.startsWith('https://') || 
            nextDecoded.startsWith('javascript:') || nextDecoded === '/html/login.html' || 
            nextDecoded === '/html/signup.html' || nextDecoded === '/login.html' || 
            nextDecoded === '/signup.html') {
          // Prevent redirect loops to login/signup pages
          nextSafe = (getPath && typeof getPath === 'function') ? getPath('home') : '/html/index.html';
        } else {
          const sanitized = (sanitizePath && typeof sanitizePath === 'function') ? sanitizePath(nextDecoded) : nextDecoded;
          // Ensure path has /html/ prefix - sanitizePath should handle this, but ensure it
          if (sanitized.startsWith('/') && !sanitized.startsWith('/html/')) {
            // Absolute path without /html/: add it
            nextSafe = '/html' + sanitized;
          } else if (!sanitized.startsWith('/')) {
            // Relative path: add /html/ prefix
            nextSafe = '/html/' + sanitized.replace(/^\.?\//, '');
          } else {
            // Already has /html/ or sanitizePath handled it
            nextSafe = sanitized;
          }
        }
        }
        
        // Perform redirect using replace to prevent back button issues
        // nextSafe is origin-relative (starts with /) - no protocol/host/port
        // This ensures we stay on the same origin and preserve Firebase auth state
        window.location.replace(nextSafe);
      } catch (err) {
        // Use centralized error handling
        const friendlyMsg = handleError('login-form', err, {
          errorType: 'form',
          logToConsole: true
        });
        
        // Also set field-specific errors for better UX
        if (err.code === 'auth/invalid-email') {
          handleError('login-username', err, { errorType: 'field' });
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          handleError('login-password', err, { errorType: 'field' });
        }
        
        // Update status element if it exists
        if (loginStatus) {
          loginStatus.textContent = friendlyMsg;
          loginStatus.className = 'error';
        }
      }
    });
  });
  