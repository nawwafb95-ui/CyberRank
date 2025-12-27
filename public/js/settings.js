// public/js/settings.js
document.addEventListener('DOMContentLoaded', () => {
  const darkBtn = document.getElementById('settings-dark');
  const lightBtn = document.getElementById('settings-light');

  if (darkBtn) {
    darkBtn.addEventListener('click', () => {
      document.body.setAttribute('data-theme', 'night');
      try {
        localStorage.setItem('theme', 'night');
      } catch (e) {
        console.warn('Failed to save theme preference');
      }
    });
  }

  if (lightBtn) {
    lightBtn.addEventListener('click', () => {
      document.body.setAttribute('data-theme', 'light');
      try {
        localStorage.setItem('theme', 'light');
      } catch (e) {
        console.warn('Failed to save theme preference');
      }
    });
  }

  // Load saved theme
  if (window.initThemeControls) {
    window.initThemeControls();
  }

  // Update navigation state
  if (window.updateNavigationState) {
    window.updateNavigationState();
  }
});


