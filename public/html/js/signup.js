// ================== OTP Feature Flag ==================
// Set to false to bypass OTP verification during development
// Set to true to re-enable OTP email verification flow
const OTP_ENABLED = false;

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  if (!signupForm) return;

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
      setError('signup-username', 'Username is required.');
      return false;
    }

    if (!usernameRegex.test(username)) {
      setError(
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
      setError('signup-password', 'Password is required.');
      return false;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{};:,.?/~_+\-=|<>]).{8,}$/;

    if (!passwordRegex.test(password)) {
      setError(
        'signup-password',
        'Password must be at least 8 characters and include at least 1 uppercase letter, 1 number, and 1 symbol.'
      );
      return false;
    }

    return true;
  }

  function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      setError('signup-confirm', 'Please confirm your password.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('signup-confirm', 'Passwords do not match.');
      return false;
    }
    return true;
  }

  // ================== Form Validation ==================
  function validateSignup(form) {
    clearErrors(form);
    let ok = true;

    const username        = form.username?.value.trim();
    const email           = form.email?.value.trim();
    const password        = form.password?.value;
    const confirmPassword = form.confirmPassword?.value;

    if (!validateUsername(username)) ok = false;

    if (!email || !emailRegex.test(email)) {
      setError('signup-email', 'Enter a valid email.');
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
          console.error('[Signup] Firestore profile creation error:', firestoreError);
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
        console.error('[Signup] Firebase Auth error:', err);
        let errorMsg = 'Failed to create account. Please try again.';
        
        // Handle Firebase Auth errors
        if (err.code === 'auth/email-already-in-use') {
          errorMsg = 'An account with this email already exists.';
          setError('signup-email', errorMsg);
        } else if (err.code === 'auth/weak-password') {
          errorMsg = 'Password is too weak. Please use a stronger password.';
          setError('signup-password', errorMsg);
        } else if (err.code === 'auth/invalid-email') {
          errorMsg = 'Invalid email address.';
          setError('signup-email', errorMsg);
        }
        
        if (signupStatus) {
          signupStatus.textContent = errorMsg;
          signupStatus.className = 'error';
        } else {
          alert(errorMsg);
        }
      }
      return;
    }

    // ================== OTP Enabled Flow (kept for later) ==================
    try {
      localStorage.setItem('pendingSignup', JSON.stringify(values));
    } catch (err) {
      console.error('Error saving pending signup', err);
    }

    const functionsUrl = 'http://localhost:5001/cyberrank-a4380/us-central1';
    const endpoint = `${functionsUrl}/sendOtp`;

    if (signupStatus) {
      signupStatus.textContent = 'Sending OTP...';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const text = await res.text();

      if (!res.ok) {
        const errorMsg = text || `Failed to send OTP (${res.status}).`;
        if (signupStatus) {
          signupStatus.textContent = errorMsg;
          signupStatus.className = 'error';
        } else {
          alert(errorMsg);
        }
        localStorage.removeItem('pendingSignup');
        return;
      }

      if (signupStatus) {
        signupStatus.textContent = 'OTP sent. Check your email.';
        signupStatus.className = 'success';
      }

      const successPath = typeof window.getPath === 'function' ? window.getPath('otp') : '/html/success.html';
      window.location.href = successPath;
    } catch (err) {
      const errorMsg = err.message || 'Network error. Is functions emulator running?';
      if (signupStatus) {
        signupStatus.textContent = errorMsg;
        signupStatus.className = 'error';
      } else {
        alert(errorMsg);
      }
      localStorage.removeItem('pendingSignup');
    }
  });
});
