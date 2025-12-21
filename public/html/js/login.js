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
      if (typeof sanitizeNextPath === 'function') {
        nextSafe = sanitizeNextPath(nextRaw || '');
      } else if (typeof normalizeNextPath === 'function') {
        nextSafe = normalizeNextPath(nextRaw || '');
      } else {
        // Fallback: basic sanitization
        if (!nextDecoded || nextDecoded.startsWith('http://') || nextDecoded.startsWith('https://') || 
            nextDecoded.startsWith('javascript:') || nextDecoded === '/login.html' || 
            nextDecoded === '/signup.html' || nextDecoded === '/html/login.html' || 
            nextDecoded === '/html/signup.html') {
          nextSafe = typeof getPath === 'function' ? getPath('home') : '/index.html';
        } else {
          const sanitized = typeof sanitizePath === 'function' ? sanitizePath(nextDecoded) : nextDecoded;
          // Convert /html/ paths to root paths, or ensure absolute path
          nextSafe = sanitized.startsWith('/html/') ? sanitized.replace(/^\/html\//, '/') : 
                     sanitized.startsWith('/') ? sanitized : '/' + sanitized.replace(/^\.?\//, '');
        }
      }
  
      // Perform redirect using replace to prevent back button issues
      // nextSafe is origin-relative (starts with /) - no protocol/host/port
      // This ensures we stay on the same origin and preserve localStorage/auth state
      window.location.replace(nextSafe);
    });
  });
  