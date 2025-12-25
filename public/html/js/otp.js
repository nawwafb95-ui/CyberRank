// ================== OTP Feature Flag ==================
// Set to false to bypass OTP verification during development
// Set to true to re-enable OTP email verification flow
// NOTE: This flag must match the one in signup.js
const OTP_ENABLED = false;

// Firebase Auth OTP - uses Firebase Auth from firebaseInit.js
import { auth, db } from './firebaseInit.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const FUNCTIONS_BASE_URL = "http://localhost:5001/cyberrank-a4380/us-central1";

function logRequest(endpoint, payload) {
  console.log(`[OTP] Request to: ${endpoint}`);
  console.log(`[OTP] Payload:`, payload);
}

document.addEventListener('DOMContentLoaded', () => {
  // ================== Check OTP Feature Flag ==================
  if (!OTP_ENABLED) {
    console.log('[OTP] OTP is disabled - redirecting to signup');
    const signupPath = typeof window.getPath === 'function' ? window.getPath('signup') : '/html/signup.html';
    window.location.href = signupPath;
    return;
  }

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

  const pendingRaw = localStorage.getItem('pendingSignup');
  const signupPath = typeof window.getPath === 'function' ? window.getPath('signup') : '/html/signup.html';
  
  if (!pendingRaw) {
    window.location.href = signupPath;
    return;
  }

  let pendingSignup;
  try {
    pendingSignup = JSON.parse(pendingRaw);
  } catch (err) {
    console.error('Error parsing pendingSignup:', err);
    window.location.href = signupPath;
    return;
  }

  if (!pendingSignup.email) {
    window.location.href = signupPath;
    return;
  }

  const { email, username, password } = pendingSignup;
  if (emailEl) emailEl.textContent = email;

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
    otpInputs[0].focus();
  }

  function focusNext(i) {
    if (i < 5) otpInputs[i + 1].focus();
  }

  function focusPrev(i) {
    if (i > 0) otpInputs[i - 1].focus();
  }

  otpInputs.forEach((input, index) => {
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
        verifyBtn.click();
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
        otpInputs[5].focus();
      }
    });

    input.addEventListener('focus', () => input.select());
  });

  // 🔁 Resend OTP
  if (resendLink) {
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!OTP_ENABLED) {
        const signupPath = typeof window.getPath === 'function' ? window.getPath('signup') : '/html/signup.html';
        window.location.href = signupPath;
        return;
      }

      setStatus('Resending OTP...');

      const endpoint = `${FUNCTIONS_BASE_URL}/sendOtp`;
      logRequest(endpoint, { email });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const text = await res.text();
        if (!res.ok) {
          setStatus(text || 'Failed to resend OTP.', 'error');
          return;
        }

        setStatus('OTP resent. Check your email.', 'success');
        clearOTP();
        setTimeout(() => setStatus(''), 3000);
      } catch (err) {
        console.error('[OTP] Error resending OTP:', err);
        setStatus('Network error. Is the emulator running?', 'error');
      }
    });
  }

  // ✅ Verify OTP
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      if (!OTP_ENABLED) {
        const signupPath = typeof window.getPath === 'function' ? window.getPath('signup') : '/html/signup.html';
        window.location.href = signupPath;
        return;
      }

      const otp = getOTP();
      if (otp.length !== 6) {
        setStatus('Please enter the complete 6-digit code.', 'error');
        return;
      }

      setStatus('Verifying OTP...');
      verifyBtn.disabled = true;

      const endpoint = `${FUNCTIONS_BASE_URL}/verifyOtp`;
      logRequest(endpoint, { email, otp: '******' });

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });

        const text = await res.text();
        if (!res.ok) {
          setStatus(text || 'OTP verification failed.', 'error');
          verifyBtn.disabled = false;
          clearOTP();
          return;
        }

        // Use Firebase Auth createUserWithEmailAndPassword
        // Firebase Auth is the single source of truth - no localStorage needed
        try {
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
            console.log('[OTP] User document created in Firestore at users/' + user.uid);
          } catch (firestoreError) {
            // Log Firestore error but don't block account creation
            console.error('[OTP] Firestore profile creation error:', firestoreError);
            // Account was created successfully, so continue with success flow
          }
          // END AUTO USER DOC
          
          localStorage.removeItem('pendingSignup');

          setStatus('OTP verified! Account created. Redirecting...', 'success');
          const homePath = typeof getPath === 'function' ? getPath('home') : '/html/index.html';
          setTimeout(() => (window.location.href = homePath), 500);
        } catch (err) {
          console.error('[OTP] Firebase Auth error:', err);
          let errorMsg = 'Failed to create account. Please try again.';
          
          // Handle Firebase Auth errors
          if (err.code === 'auth/email-already-in-use') {
            errorMsg = 'An account with this email already exists.';
          } else if (err.code === 'auth/weak-password') {
            errorMsg = 'Password is too weak. Please use a stronger password.';
          }
          
          setStatus(errorMsg, 'error');
          verifyBtn.disabled = false;
          clearOTP();
        }
      } catch (err) {
        console.error('[OTP] Verify error:', err);
        setStatus('Network error. Is the emulator running?', 'error');
        verifyBtn.disabled = false;
      }
    });
  }

  otpInputs[0].focus();
});
