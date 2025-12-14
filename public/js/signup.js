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

  // ================== Toggle Show / Hide Password (👁️ / 🙈) ==================
  function attachToggleButtons() {
    const toggles = document.querySelectorAll('.toggle-visibility');
    toggles.forEach((btn) => {
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;
      const input = document.getElementById(targetId);
      if (!input) return;

      // Initial state: eye icon
      btn.textContent = '👁️';
      btn.setAttribute('aria-label', 'Show password');

      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';

        if (isPassword) {
          input.type = 'text';
          btn.textContent = '🙈';
          btn.setAttribute('aria-label', 'Hide password');
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
          btn.setAttribute('aria-label', 'Show password');
        }
      });
    });
  }

  attachToggleButtons();

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
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { ok, values } = validateSignup(signupForm);
    if (!ok) return;

    const users = getUsers();
    if (users[values.email]) {
      setError('signup-email', 'An account with this email already exists.');
      return;
    }

    users[values.email] = {
      email: values.email,
      username: values.username,
      password: values.password,
      createdAt: new Date().toISOString()
    };
    saveUsers(users);

    try {
      localStorage.removeItem('currentUser');
    } catch {}

    const popup = document.getElementById('successPopup');
    const okBtn = document.getElementById('popupOkBtn');

    if (popup && okBtn) {
      popup.style.display = 'flex';

      const handleOk = () => {
        popup.style.display = 'none';
        okBtn.removeEventListener('click', handleOk);
        // signup.html is inside html folder
        window.location.href = './login.html';
      };

      okBtn.addEventListener('click', handleOk);
    } else {
      window.location.href = './login.html';
    }
  });
});
