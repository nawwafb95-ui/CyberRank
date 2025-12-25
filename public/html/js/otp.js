// ================== OTP Verification Handler ==================
// Handles OTP verification for both signup and password reset flows
// OTP is now ENABLED by default for security

import { auth, db } from './firebaseInit.js';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { handleError } from './errorMessages.js';

// Cloud Functions base URL from config.js
const FUNCTIONS_BASE_URL = window.SOCYBERX_CONFIG?.FUNCTIONS_BASE_URL ?? 
  window.__SOCYBERX_CONFIG__?.FUNCTIONS_BASE_URL ?? 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/cyberrank-a4380/us-central1'
    : 'https://us-central1-cyberrank-a4380.cloudfunctions.net');

document.addEventListener('DOMContentLoaded', () => {
  const otpInputs = [
    document.getElementById('otp-0'),
    document.getElementById('otp-1'),
    document.getElementById('otp-2'),
    document.getElementById('otp-3'),
    document.getElementById('otp-4'),
    document.getElementById('otp-5')
  ];

  const emailEl = document.getElementById('otp-email');
  const resendLink = document.getElementById('resend-otp');
  const verifyBtn = document.getElementById('verify-otp');
  const statusEl = document.getElementById('otp-status');

  // Check for pending signup or password reset
  const pendingSignupRaw = localStorage.getItem('pendingSignup');
  const pendingPasswordResetRaw = localStorage.getItem('pendingPasswordReset');

  let purpose = null;
  let email = null;
  let pendingData = null;

  // Determine flow type
  if (pendingSignupRaw) {
    try {
      pendingData = JSON.parse(pendingSignupRaw);
      purpose = 'signup';
      email = pendingData.email;
    } catch (err) {
      console.error('[OTP] Error parsing pendingSignup:', err);
      redirectToSignup();
      return;
    }
  } else if (pendingPasswordResetRaw) {
    try {
      pendingData = JSON.parse(pendingPasswordResetRaw);
      purpose = 'reset_password';
      email = pendingData.email;
    } catch (err) {
      console.error('[OTP] Error parsing pendingPasswordReset:', err);
      redirectToForgotPassword();
      return;
    }
  } else {
    // No pending operation - redirect
    redirectToSignup();
    return;
  }

  if (!email) {
    if (purpose === 'signup') redirectToSignup();
    else redirectToForgotPassword();
    return;
  }

  // Display email
  if (emailEl) {
    emailEl.textContent = email;
  }

  function redirectToSignup() {
    const signupPath = typeof window.getPath === 'function' ? window.getPath('signup') : '/html/signup.html';
    window.location.href = signupPath;
  }

  function redirectToForgotPassword() {
    const forgotPath = typeof window.getPath === 'function' ? window.getPath('forgotPassword') : '/html/forgot-password.html';
    window.location.href = forgotPath;
  }

  function setStatus(message, type = '') {
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = 'otp-status' + (type ? ' ' + type : '');
    }
  }

  function getOTP() {
    return otpInputs.map(input => input.value.trim()).join('');
  }

  function clearOTP() {
    otpInputs.forEach(input => (input.value = ''));
    if (otpInputs[0]) otpInputs[0].focus();
  }

  function focusNext(i) {
    if (i < 5 && otpInputs[i + 1]) otpInputs[i + 1].focus();
  }

  function focusPrev(i) {
    if (i > 0 && otpInputs[i - 1]) otpInputs[i - 1].focus();
  }

  // Setup OTP input handlers
  otpInputs.forEach((input, index) => {
    if (!input) return;

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (value && !/^\d$/.test(value)) {
        e.target.value = '';
        return;
      }
      if (value) focusNext(index);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        e.preventDefault();
        focusPrev(index);
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusPrev(index);
      } else if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        focusNext(index);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (verifyBtn) verifyBtn.click();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);

      if (pasted.length === 6) {
        pasted.split('').forEach((d, i) => {
          if (otpInputs[i]) otpInputs[i].value = d;
        });
        if (otpInputs[5]) otpInputs[5].focus();
      }
    });

    input.addEventListener('focus', () => input.select());
  });

  // 🔁 Resend OTP
  if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      setStatus('Resending verification code...');

      try {
        const endpoint = `${FUNCTIONS_BASE_URL}/requestOtp`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purpose }),
        });

        const data = await res.json().catch(() => ({ 
          success: false, 
          error: res.statusText || 'Unknown error' 
        }));

        if (!res.ok || !data.success) {
          const error = new Error(data.error || 'Failed to resend OTP');
          error.code = 'otp-send-failed';
          const friendlyMsg = handleError('otp-form', error, {
            errorType: 'form',
            logToConsole: true
          });
          setStatus(friendlyMsg, 'error');
          return;
        }

        setStatus('Verification code resent. Check your email. (تم إعادة إرسال رمز التحقق، تحقق من بريدك الإلكتروني)', 'success');
        clearOTP();
        setTimeout(() => setStatus(''), 3000);
      } catch (err) {
        const friendlyMsg = handleError('otp-form', err, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: 'Network error. Please check your connection. (خطأ في الشبكة، يرجى التحقق من اتصالك)'
        });
        setStatus(friendlyMsg, 'error');
      }
    });
  }

  // ✅ Verify OTP
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const otp = getOTP();
      if (otp.length !== 6) {
        setStatus('Please enter the complete 6-digit code. (يرجى إدخال رمز التحقق المكون من 6 أرقام)', 'error');
        return;
      }

      setStatus('Verifying code...');
      verifyBtn.disabled = true;

      try {
        // Verify OTP with secure backend
        const endpoint = `${FUNCTIONS_BASE_URL}/verifyOtp`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, purpose }),
        });

        const data = await res.json().catch(() => ({ 
          success: false, 
          error: res.statusText || 'Unknown error' 
        }));

        if (!res.ok || !data.success) {
          const error = new Error(data.error || 'OTP verification failed');
          error.code = 'otp-invalid';
          const friendlyMsg = handleError('otp-form', error, {
            errorType: 'form',
            logToConsole: true
          });
          setStatus(friendlyMsg, 'error');
          verifyBtn.disabled = false;
          clearOTP();
          return;
        }

        // OTP verified successfully - proceed with flow
        if (purpose === 'signup') {
          await handleSignupFlow(pendingData);
        } else if (purpose === 'reset_password') {
          await handlePasswordResetFlow(email);
        }
      } catch (err) {
        console.error('[OTP] Verification error:', err);
        const friendlyMsg = handleError('otp-form', err, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: 'Network error. Please check your connection. (خطأ في الشبكة، يرجى التحقق من اتصالك)'
        });
        setStatus(friendlyMsg, 'error');
        verifyBtn.disabled = false;
      }
    });
  }

  /**
   * Handle signup flow after OTP verification
   * ONLY creates account after OTP is verified
   */
  async function handleSignupFlow(signupData) {
    try {
      setStatus('Creating your account...', '');
      const { email, password, username } = signupData;

      // NOW create Firebase Auth account (OTP already verified)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
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
        console.log('[OTP] User document created in Firestore at users/' + user.uid);
      } catch (firestoreError) {
        // Log Firestore error but don't block account creation
        handleError('otp-form', firestoreError, {
          errorType: 'form',
          logToConsole: true,
          fallbackMessage: null
        });
      }

      // Clear pending signup
      localStorage.removeItem('pendingSignup');

      setStatus('Account created successfully! Redirecting... (تم إنشاء الحساب بنجاح! جاري إعادة التوجيه...)', 'success');
      const homePath = typeof window.getPath === 'function' ? window.getPath('home') : '/html/index.html';
      setTimeout(() => {
        window.location.href = homePath;
      }, 1500);
    } catch (err) {
      console.error('[OTP] Signup error:', err);
      const friendlyMsg = handleError('otp-form', err, {
        errorType: 'form',
        logToConsole: true
      });
      setStatus(friendlyMsg, 'error');
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  /**
   * Handle password reset flow after OTP verification
   * Sends Firebase password reset email after OTP verification
   */
  async function handlePasswordResetFlow(email) {
    try {
      setStatus('Sending password reset link...', '');

      // OTP verified - now send Firebase password reset email
      await sendPasswordResetEmail(auth, email);

      // Clear pending password reset
      localStorage.removeItem('pendingPasswordReset');

      setStatus('Password reset link sent! Check your email. (تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك الإلكتروني)', 'success');

      // Show option to go to login
      setTimeout(() => {
        const loginPath = typeof window.getPath === 'function' ? window.getPath('login') : '/html/login.html';
        window.location.href = loginPath;
      }, 3000);
    } catch (err) {
      console.error('[OTP] Password reset error:', err);
      const friendlyMsg = handleError('otp-form', err, {
        errorType: 'form',
        logToConsole: true
      });
      setStatus(friendlyMsg, 'error');
      if (verifyBtn) verifyBtn.disabled = false;
    }
  }

  // Focus first input
  if (otpInputs[0]) otpInputs[0].focus();
});
