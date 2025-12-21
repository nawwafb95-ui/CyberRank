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

    const usersNow = getUsers();
    const lower = username.toLowerCase();
    for (const emailKey in usersNow) {
      const u = usersNow[emailKey];
      if (!u) continue;
      const uname = (u.username || emailKey.split('@')[0]).toLowerCase();
      if (uname === lower) {
        setError('signup-username', 'This username is already taken.');
        return false;
      }
    }

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
    } else {
      const users = getUsers();
      if (users[email]) {
        setError('signup-email', 'An account with this email already exists.');
        ok = false;
      }
    }

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

    const users = getUsers();
    if (users[values.email]) {
      setError('signup-email', 'An account with this email already exists.');
      return;
    }

    const signupStatus = document.getElementById('signup-status');

    // ================== OTP Bypass Logic ==================
    if (!OTP_ENABLED) {
      console.log('[Signup] OTP disabled - creating account directly');

      if (signupStatus) {
        signupStatus.textContent = 'Creating account...';
        signupStatus.className = '';
      }

      try {
        const { username, email, password } = values;

        users[email] = {
          email,
          username,
          password,
          createdAt: new Date().toISOString(),
          verified: true
        };
        saveUsers(users);

        localStorage.setItem('currentUser', email);

        if (signupStatus) {
          signupStatus.textContent = 'Account created successfully!';
          signupStatus.className = 'success';
        }

        setTimeout(() => {
          window.location.href = '/index.html';
        }, 300);
      } catch (err) {
        console.error('[Signup] Error creating account:', err);
        const errorMsg = 'Failed to create account. Please try again.';
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

      window.location.href = '/success.html';
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
