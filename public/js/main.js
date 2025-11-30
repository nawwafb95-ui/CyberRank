// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    if (window.initThemeControls) window.initThemeControls();
    if (window.initTranslateControls) window.initTranslateControls();
    if (window.initTopNav) window.initTopNav();
  
    // Password toggles
    try {
      document.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = targetId ? document.getElementById(targetId) : btn.previousElementSibling;
          if (input && input.tagName === 'INPUT') {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            btn.textContent = isPassword ? '🙈' : '👁️';
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
          }
        });
      });
    } catch {}
  });
  