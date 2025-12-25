// ================== OTP Feature Flag ==================
// OTP verification is now ENABLED by default for security
// Controlled by config.js - can be overridden via window.__SOCYBERX_CONFIG__
const OTP_ENABLED = window.SOCYBERX_CONFIG?.OTP_ENABLED ?? 
  window.__SOCYBERX_CONFIG__?.OTP_ENABLED ?? true;

// Cloud Functions base URL from config.js
const FUNCTIONS_BASE_URL = window.SOCYBERX_CONFIG?.FUNCTIONS_BASE_URL ?? 
  window.__SOCYBERX_CONFIG__?.FUNCTIONS_BASE_URL ?? 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/cyberrank-a4380/us-central1'
    : 'https://us-central1-cyberrank-a4380.cloudfunctions.net');

// Import Firebase modules
import { auth, db } from './firebaseInit.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Import error handling utilities
import { handleError, clearAllErrors } from './errorMessages.js';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

  // Access window globals from core.js (module-safe)
  const { setError, clearErrors, emailRegex } = window;

  const usernameInput        = document.getElementById('signup-username');
  const emailInput           = document.getElementById('signup-email');
  const passwordInput        = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm');

  const usernameHint         = document.getElementById('username-hint');
  const passwordHint         = document.getElementById('password-hint');

  // ================== Username Hint (shows on focus) ==================
  if (usernameInput && usernameHint) {
    usernameInput.addEventListener('focus', () => {
      usernameHint.classList.add('visible');
    });

    usernameInput.addEventListener('blur', () => {
      if (!usernameInput.value.trim()) {
        usernameHint.classList.remove('visible');
      }
    });
  }

  // ================== Password Hint (same as username) ==================
  if (passwordInput && passwordHint) {
    passwordInput.addEventListener('focus', () => {
      passwordHint.classList.add('visible');
    });

    passwordInput.addEventListener('blur', () => {
      if (!passwordInput.value.trim()) {
        passwordHint.classList.remove('visible');
      }
    });
  }

  // ================== Username Validation ==================
  // NOTE: Username is now used as display name only, not for authentication
  // Firebase Auth uses email/password, username uniqueness is not enforced here
  function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-z0-9_-]{3,}$/;

    if (!username) {
      if (setError) setError('signup-username', 'Username is required.');
      return false;
    }

    if (!usernameRegex.test(username)) {
      if (setError) setError(
        'signup-username',
        'Username must start with a capital letter and can contain lowercase letters, numbers, "-" or "_". Minimum 4 characters.'
      );
      return false;
    }

    // REMOVED: localStorage-based username uniqueness check
    // Firebase Auth handles email uniqueness automatically

    return true;
  }

  // ================== Password Validation ==================
  function validatePassword(password) {
    if (!password) {
      if (setError) setError('signup-password', 'Password is required.');
      return false;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:,.?/~_+\-=|<>]).{8,}$/;

    if (!passwordRegex.test(password)) {
      if (setError) setError(
        'signup-password',
        'Password must be at least 8 characters and include at least 1 uppercase letter, 1 number, and 1 symbol.'
      );
      return false;
    }

    return true;
  }

  function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      if (setError) setError('signup-confirm', 'Please confirm your password.');
      return false;
    }
    if (password !== confirmPassword) {
      if (setError) setError('signup-confirm', 'Passwords do not match.');
      return false;
    }
    return true;
  }

  // ================== Form Validation ==================
  function validateSignup(form) {
    if (clearErrors) clearErrors(form);
    clearAllErrors(form);
    let ok = true;

    const username        = form.username?.value.trim();
    const email           = form.email?.value.trim();
    const password        = form.password?.value;
    const confirmPassword = form.confirmPassword?.value;

    if (!validateUsername(username)) ok = false;

    if (!email || (emailRegex && !emailRegex.test(email))) {
      if (setError) setError('signup-email', 'Enter a valid email.');
      ok = false;
    }
    // REMOVED: localStorage-based email check
    // Firebase Auth will handle email uniqueness automatically

    if (!validatePassword(password)) ok = false;

    if (!validateConfirmPassword(password, confirmPassword)) ok = false;

    return {
      ok,
      values: { username, email, password }
    };
  }

  // ================== Submit Handler ==================
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { ok, values } = validateSignup(signupForm);
    if (!ok) return;

    const signupStatus = document.getElementById('signup-status');

    // ================== OTP Bypass Logic ==================
    if (!OTP_ENABLED) {
      console.log('[Signup] OTP disabled - creating account with Firebase Auth');

      if (signupStatus) {
        signupStatus.textContent = 'Creating account...';
        signupStatus.className = '';
      }

      try {
        const { email, password, username } = values;

        // Use Firebase Auth createUserWithEmailAndPassword
        // Firebase Auth is the single source of truth - no localStorage needed
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // START AUTO USER DOC
        // Automatically create user document in Firestore with default data
        // This happens once at signup - role is hardcoded to "user"
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            email: user.email,
            username: username,
            role: 'user', // Hardcoded role - never set from user input
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            stats: {
              totalPoints: 0,
              attemptsCount: 0,
              bestScore: 0
            },
            progress: {
              easyCompleted: false,
              mediumCompleted: false,
              hardCompleted: false
            }
          }, { merge: true });
          console.log('[Signup] User document created in Firestore at users/' + user.uid);
        } catch (firestoreError) {
          // Log Firestore error but don't block account creation
          // Use error handler to log technical details while showing nothing to user
          handleError('signup-form', firestoreError, {
            errorType: 'form',
            logToConsole: true,
            fallbackMessage: null // Don't show Firestore errors to user during signup
          });
          // Account was created successfully, so continue with success flow
        }
        // END AUTO USER DOC

        if (signupStatus) {
          signupStatus.textContent = 'Account created successfully!';
          signupStatus.className = 'success';
        }

        // Redirect to home page after successful signup
        const homePath = typeof getPath === 'function' ? getPath('home') : '/html/index.html';
        setTimeout(() => {
          window.location.href = homePath;
        }, 300);
      } catch (err) {
        // Use centralized error handling
        const friendlyMsg = handleError('signup-form', err, {
          errorType: 'form',
          logToConsole: true
        });
        
        // Also set field-specific errors for better UX
        if (err.code === 'auth/email-already-in-use') {
          handleError('signup-email', err, { errorType: 'field' });
        } else if (err.code === 'auth/weak-password') {
          handleError('signup-password', err, { errorType: 'field' });
        } else if (err.code === 'auth/invalid-email') {
          handleError('signup-email', err, { errorType: 'field' });
        }
        
        // Update status element if it exists
        if (signupStatus) {
          signupStatus.textContent = friendlyMsg;
          signupStatus.className = 'error';
        }
      }
      return;
    }

    // ================== SECURE OTP FLOW ==================
    // Step 1: Validate inputs locally
    // Step 2: Request OTP from backend (NO account creation yet)
    // Step 3: Redirect to OTP verification page
    // Step 4: Account creation happens ONLY after OTP verification (in otp.js)

    if (signupStatus) {
      signupStatus.textContent = 'Sending verification code...';
      signupStatus.className = '';
    }

    // Store signup data temporarily (will be used after OTP verification)
    try {
      localStorage.setItem('pendingSignup', JSON.stringify({
        ...values,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('[Signup] Error saving pending signup:', err);
      handleError('signup-form', new Error('Failed to save signup data. Please try again.'), {
        errorType: 'form',
        logToConsole: true
      });
      return;
    }

    // Request OTP from secure backend
    try {
      const endpoint = `${FUNCTIONS_BASE_URL}/requestOtp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          purpose: 'signup'
        }),
      });

      const data = await res.json().catch(() => ({ 
        success: false, 
        error: res.statusText || 'Unknown error' 
      }));

      if (!res.ok || !data.success) {
        const error = new Error(data.error || `Failed to send OTP (${res.status})`);
        error.code = 'otp-send-failed';
        const friendlyMsg = handleError('signup-form', error, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: data.error || 'Failed to send verification code. Please try again.'
        });
        
        if (signupStatus) {
          signupStatus.textContent = friendlyMsg;
          signupStatus.className = 'error';
        }
        
        // Clear pending signup on error
        localStorage.removeItem('pendingSignup');
        return;
      }

      // OTP sent successfully - redirect to verification page
      if (signupStatus) {
        signupStatus.textContent = 'Verification code sent! Check your email.';
        signupStatus.className = 'success';
      }

      // Redirect to OTP verification page
      const otpPath = typeof window.getPath === 'function' ? window.getPath('otp') : '/html/success.html';
      setTimeout(() => {
        window.location.href = otpPath;
      }, 1000);
      
    } catch (err) {
      console.error('[Signup] Error requesting OTP:', err);
      const friendlyMsg = handleError('signup-form', err, {
        errorType: 'form',
        logToConsole: true,
        fallbackMessage: 'Network error. Please check your connection and try again. (خطأ في الشبكة، يرجى التحقق من اتصالك والمحاولة مرة أخرى)'
      });
      
      if (signupStatus) {
        signupStatus.textContent = friendlyMsg;
        signupStatus.className = 'error';
      }
      
      // Clear pending signup on error
      localStorage.removeItem('pendingSignup');
    }
  });
});
