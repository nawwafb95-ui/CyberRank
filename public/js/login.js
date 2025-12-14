// public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
  
    function validateLogin(form) {
      clearErrors(form);
      let ok = true;
      const username = form.username?.value.trim();
      const password = form.password?.value;
      if (!username) { setError('login-username', 'Enter a valid username.'); ok = false; }
      if (!password) { setError('login-password', 'Password is required.');  ok = false; }
      return { ok, values: { username, password } };
    }
  
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validateLogin(loginForm);
      if (!ok) return;
  
      const user = findUserByUsername(values.username);
      if (!user || user.password !== values.password) {
        setError('login-password', 'Invalid username or password.');
        return;
      }
  
      const username = user.username || (user.email.split('@')[0]);
      localStorage.setItem('currentUser', username);
  
      // Use go() function for consistent navigation, or relative path
      if (typeof go === 'function') {
        go('./index.html');
      } else {
        window.location.href = './index.html';
      }
    });
  });
  