// ================== OTP Feature Flag ==================
const OTP_ENABLED = window.SOCYBERX_CONFIG?.OTP_ENABLED ??
  window.__SOCYBERX_CONFIG__?.OTP_ENABLED ?? false;

// Cloud Functions base URL
const FUNCTIONS_BASE_URL = window.SOCYBERX_CONFIG?.FUNCTIONS_BASE_URL ??
  window.__SOCYBERX_CONFIG__?.FUNCTIONS_BASE_URL ??
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/cyberrank-a4380/us-central1'
    : 'https://us-central1-cyberrank-a4380.cloudfunctions.net');

// Import Firebase modules
import { auth, db } from './firebaseInit.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Import error handling utilities
import { handleError, clearAllErrors } from './errorMessages.js';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) {
    console.log('[SIGNUP] EARLY RETURN: signup-form element not found');
    return;
  }

  // Access window globals from core.js (module-safe)
  const { setError, clearErrors, emailRegex } = window;

  const usernameInput        = document.getElementById('signup-username');
  const emailInput           = document.getElementById('signup-email');
  const passwordInput        = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm');

  const usernameHint         = document.getElementById('username-hint');
  const passwordHint         = document.getElementById('password-hint');

  // ================== Solution B: Alert Box (reuse error-box) ==================
  const alertBox = document.getElementById('signup-alert') || signupForm.querySelector('.error-box');

  function showAlert(message, type = 'error') {
    if (!alertBox) return;
    
    // If message contains newlines, format as HTML with line breaks
    if (message.includes('\n')) {
      alertBox.innerHTML = message.replace(/\n/g, '<br>');
    } else {
      alertBox.textContent = message;
    }

    // reset classes
    alertBox.classList.remove('success', 'error', 'warning', 'info');
    alertBox.classList.add('visible', type);
  }

  function clearAlert() {
    if (!alertBox) return;
    alertBox.textContent = '';
    alertBox.innerHTML = '';
    alertBox.classList.remove('visible', 'success', 'error', 'warning', 'info');
  }

  // clear alert when user types
  [usernameInput, emailInput, passwordInput, confirmPasswordInput].forEach((el) => {
    if (!el) return;
    el.addEventListener('input', () => {
      if (alertBox?.classList.contains('visible')) clearAlert();
    });
  });

  // ================== Username Hint ==================
  if (usernameInput && usernameHint) {
    usernameInput.addEventListener('focus', () => usernameHint.classList.add('visible'));
    usernameInput.addEventListener('blur', () => {
      if (!usernameInput.value.trim()) usernameHint.classList.remove('visible');
    });
  }

  // ================== Password Hint ==================
  if (passwordInput && passwordHint) {
    passwordInput.addEventListener('focus', () => passwordHint.classList.add('visible'));
    passwordInput.addEventListener('blur', () => {
      if (!passwordInput.value.trim()) passwordHint.classList.remove('visible');
    });
  }

  // ================== Username Validation ==================
  // NOTE: Username is display name only
  // These functions are kept for potential real-time validation but
  // validateSignup handles all error display during form submission
  function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-z0-9_-]{3,}$/;
    if (!username) return false;
    return usernameRegex.test(username);
  }

  // ================== Password Validation ==================
  function validatePassword(password) {
    if (!password) return false;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:,.?/~_+\-=|<>]).{8,}$/;
    return passwordRegex.test(password);
  }

  function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) return false;
    return password === confirmPassword;
  }

  // ================== Helper Functions ==================
  function setFieldError(fieldId, message) {
    const errorElement = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (errorElement) {
      errorElement.textContent = message || '';
      errorElement.classList.add('visible');
    }
  }

  function clearFieldError(fieldId) {
    const errorElement = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  function clearAllFieldErrors(form) {
    const formElement = typeof form === 'string' ? document.getElementById(form) : form;
    if (formElement) {
      formElement.querySelectorAll('.error[data-error-for]').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });
    }
  }

  // ================== Form Validation ==================
  function validateSignup(form) {
    // Clear all previous errors
    if (clearErrors) clearErrors(form);
    clearAllFieldErrors(form);
    clearAlert();

    const errors = [];
    let firstErrorField = null;

    const username        = form.username?.value.trim();
    const email           = form.email?.value.trim();
    const password        = form.password?.value;
    const confirmPassword = form.confirmPassword?.value;

    // Validate username
    if (!username) {
      const message = 'Username is required.';
      errors.push('• Username is required');
      setFieldError('signup-username', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-username');
    } else {
      const usernameRegex = /^[A-Z][a-z0-9_-]{3,}$/;
      if (!usernameRegex.test(username)) {
        const message = 'Username must start with a capital letter and can contain lowercase letters, numbers, "-" or "_". Minimum 4 characters.';
        errors.push('• Username must start with a capital letter');
        setFieldError('signup-username', message);
        if (!firstErrorField) firstErrorField = document.getElementById('signup-username');
      }
    }

    // Validate email
    if (!email) {
      const message = 'Email is required.';
      errors.push('• Email is required');
      setFieldError('signup-email', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-email');
    } else if (emailRegex && !emailRegex.test(email)) {
      const message = 'Enter a valid email.';
      errors.push('• Email is invalid');
      setFieldError('signup-email', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-email');
    }

    // Validate password
    if (!password) {
      const message = 'Password is required.';
      errors.push('• Password is required');
      setFieldError('signup-password', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-password');
    } else {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:,.?/~_+\-=|<>]).{8,}$/;
      if (!passwordRegex.test(password)) {
        const message = 'Password must be at least 8 characters and include at least 1 uppercase letter, 1 number, and 1 symbol.';
        errors.push('• Password must be at least 8 characters with uppercase, number, and symbol');
        setFieldError('signup-password', message);
        if (!firstErrorField) firstErrorField = document.getElementById('signup-password');
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      const message = 'Please confirm your password.';
      errors.push('• Please confirm your password');
      setFieldError('signup-confirm', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-confirm');
    } else if (password !== confirmPassword) {
      const message = 'Passwords do not match.';
      errors.push('• Passwords do not match');
      setFieldError('signup-confirm', message);
      if (!firstErrorField) firstErrorField = document.getElementById('signup-confirm');
    }

    // If there are errors, show them in the alert box and focus first error field
    if (errors.length > 0) {
      const alertMessage = 'Please fix the following:\n' + errors.join('\n');
      showAlert(alertMessage, 'error');
      
      // Focus the first field with an error
      if (firstErrorField) {
        firstErrorField.focus();
      }
      
      return { ok: false, values: { username, email, password } };
    }

    return { ok: true, values: { username, email, password } };
  }

  // ================== Submit Handler ==================
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[SIGNUP] STEP 1: Submit fired');

    const { ok, values } = validateSignup(signupForm);

    console.log('[SIGNUP] STEP 2: After reading inputs', {
      ok,
      email: values?.email,
      username: values?.username,
      hasPassword: !!values?.password
    });

    if (!ok) {
      console.log('[SIGNUP] EARLY RETURN: Validation failed');
      // Error messages are already shown by validateSignup
      return;
    }

    const signupStatus = document.getElementById('signup-status');
    console.log('[SIGNUP] OTP_ENABLED:', OTP_ENABLED);

    // ================== OTP Disabled ==================
    if (!OTP_ENABLED) {
      showAlert('Creating your account... (جاري إنشاء الحساب)', 'info');

      if (signupStatus) {
        signupStatus.textContent = 'Creating account...';
        signupStatus.className = '';
      }

      try {
        const { email, password, username } = values;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestore user doc
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            userId: user.uid,
            username,
            email: user.email,
            role: 'user',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            stats: { totalPoints: 0, attemptsCount: 0, bestScore: 0 },
            progress: { easyCompleted: false, mediumCompleted: false, hardCompleted: false }
          }, { merge: true });

          console.log('[Signup] Firestore user doc created');
        } catch (firestoreError) {
          console.error('[Signup] Firestore write failed:', firestoreError);

          handleError('signup-form', firestoreError, {
            errorType: 'form',
            logToConsole: true,
            fallbackMessage: 'Account created but profile setup failed. Please try logging in.'
          });

          showAlert(
            'Account created, but profile setup failed. Try logging in. (تم إنشاء الحساب لكن فشل إعداد الملف الشخصي، جرّب تسجيل الدخول)',
            'warning'
          );
        }

        if (signupStatus) {
          signupStatus.textContent = 'Account created successfully!';
          signupStatus.className = 'success';
        }

        showAlert('Account created successfully! Redirecting... (تم إنشاء الحساب بنجاح، جاري التحويل)', 'success');

        const homePath = (typeof window.getPath === 'function' ? window.getPath('home') : '/');
        setTimeout(() => { window.location.href = homePath; }, 700);

      } catch (err) {
        console.error('[SIGNUP] CATCH ERROR:', err.code, err.message, err);

        const friendlyMsg = handleError('signup-form', err, {
          errorType: 'form',
          logToConsole: true
        });

        showAlert(`Signup failed: ${friendlyMsg}`, 'error');

        // field hints
        if (err.code === 'auth/email-already-in-use') {
          handleError('signup-email', err, { errorType: 'field' });
        } else if (err.code === 'auth/weak-password') {
          handleError('signup-password', err, { errorType: 'field' });
        } else if (err.code === 'auth/invalid-email') {
          handleError('signup-email', err, { errorType: 'field' });
        }

        if (signupStatus) {
          signupStatus.textContent = friendlyMsg + (err.code ? ` [${err.code}]` : '');
          signupStatus.className = 'error';
        }
      }

      return;
    }

    // ================== OTP Enabled Flow ==================
    showAlert('Sending verification code... (جاري إرسال رمز التحقق)', 'info');

    if (signupStatus) {
      signupStatus.textContent = 'Sending verification code...';
      signupStatus.className = '';
    }

    try {
      localStorage.setItem('pendingSignup', JSON.stringify({
        ...values,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('[Signup] Error saving pending signup:', err);
      showAlert('Failed to save signup data. Try again. (فشل حفظ بيانات التسجيل، حاول مرة أخرى)', 'error');
      return;
    }

    try {
      const endpoint = `${FUNCTIONS_BASE_URL}/requestOtp`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, purpose: 'signup' }),
      });

      const data = await res.json().catch(() => ({ success: false, error: res.statusText || 'Unknown error' }));

      if (!res.ok || !data.success) {
        const error = new Error(data.error || `Failed to send OTP (${res.status})`);
        error.code = 'otp-send-failed';

        const friendlyMsg = handleError('signup-form', error, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: data.error || 'Failed to send verification code. Please try again.'
        });

        showAlert(friendlyMsg, 'error');

        if (signupStatus) {
          signupStatus.textContent = friendlyMsg;
          signupStatus.className = 'error';
        }

        localStorage.removeItem('pendingSignup');
        return;
      }

      showAlert('Verification code sent! Check your email. (تم إرسال الرمز، افحص بريدك)', 'success');

      if (signupStatus) {
        signupStatus.textContent = 'Verification code sent! Check your email.';
        signupStatus.className = 'success';
      }

      const otpPath = typeof window.getPath === 'function' ? window.getPath('otp') : '/success';
      setTimeout(() => { window.location.href = otpPath; }, 900);

    } catch (err) {
      console.error('[Signup] OTP request failed:', err);

      const friendlyMsg = handleError('signup-form', err, {
        errorType: 'form',
        logToConsole: true,
        fallbackMessage: 'Network error. Please try again. (خطأ في الشبكة، حاول مرة أخرى)'
      });

      showAlert(friendlyMsg, 'error');

      if (signupStatus) {
        signupStatus.textContent = friendlyMsg;
        signupStatus.className = 'error';
      }

      localStorage.removeItem('pendingSignup');
    }
  });
});
