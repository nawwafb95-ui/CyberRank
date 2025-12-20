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

  // ================== Helpers from core.js ==================
  // clearErrors(form), setError(inputId, message),
  // getUsers(), saveUsers(), emailRegex
  // Available in core.js

  // ================== Username Validation ==================
  function validateUsername(username) {
    // First letter must be Capital, rest lowercase, numbers, -, or _
    // Minimum 4 characters
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

    // Check for duplicate username (from locally stored users)
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

    // At minimum:
    // 1 Uppercase, 1 Digit, 1 Symbol, length 8+
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

    // Username
    if (!validateUsername(username)) ok = false;

    // Email
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

    // Password
    if (!validatePassword(password)) ok = false;

    // Confirm Password
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

    // 1) نحفظ بيانات التسجيل مؤقتاً لغاية ما الـ OTP ينجح
    // username + email + password
    try {
      localStorage.setItem('pendingSignup', JSON.stringify(values));
    } catch (err) {
      console.error('Error saving pending signup', err);
    }

    // 2) نرسل طلب sendOtp إلى Cloud Function
    const functionsUrl =
      // window.FIREBASE_FUNCTIONS_URL ||
      'http://localhost:5001/cyberrank-a4380/us-central1';
    const endpoint = `${functionsUrl}/sendOtp`;
    
    console.log('[Signup] Sending OTP request to:', endpoint);
    console.log('[Signup] Request payload:', { email: values.email });

    const signupStatus = document.getElementById('signup-status');
    if (signupStatus) {
      signupStatus.textContent = 'Sending OTP...';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });
      
      console.log('[Signup] Response status:', res.status, res.statusText);

      const text = await res.text();

      if (!res.ok) {
        console.error('[Signup] OTP send failed. Status:', res.status);
        console.error('[Signup] Response text:', text);
        const errorMsg = text || `Failed to send OTP (${res.status}). Please check emulator logs.`;
        if (signupStatus) {
          signupStatus.textContent = errorMsg;
          signupStatus.className = 'error';
        } else {
          // Fallback: show alert if status element doesn't exist
          alert(errorMsg);
        }
        // Clean up on error
        localStorage.removeItem('pendingSignup');
        return;
      }

      console.log('[Signup] OTP sent successfully. Response:', text);
      if (signupStatus) {
        signupStatus.textContent = 'OTP sent. Check your email.';
        signupStatus.className = 'success';
      }

      // Redirect to OTP verification page (success.html is the OTP page)
      // signup.html is in public/html/, so success.html is in the same directory
      window.location.href = './success.html';
    } catch (err) {
      console.error('[Signup] Network/Request error:', err);
      console.error('[Signup] Error details:', {
        message: err.message,
        stack: err.stack,
        endpoint: endpoint
      });
      // Show error to user
      const errorMsg = err.message || 'Network error. Is the emulator running on http://localhost:5001?';
      if (signupStatus) {
        signupStatus.textContent = errorMsg;
        signupStatus.className = 'error';
      } else {
        // Fallback: show alert if status element doesn't exist
        alert(errorMsg);
      }
      // Clean up on error
      localStorage.removeItem('pendingSignup');
    }
  });
});
