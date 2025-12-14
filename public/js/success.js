// public/js/success.js
document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('currentUser');
  const el   = document.getElementById('success-user');

  if (el && user) {
    // Security: Use textContent to prevent XSS, then add safe HTML via DOM
    el.textContent = '';
    const strong = document.createElement('strong');
    strong.textContent = user;
    el.appendChild(document.createTextNode('Welcome, '));
    el.appendChild(strong);
    el.appendChild(document.createTextNode(' — your journey starts now.'));
  }

  const confettiBox = document.getElementById('confetti');
  if (confettiBox) {
    confettiBox.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = (Math.random() * 1.2) + 's';
      s.style.background = Math.random() > 0.5
        ? 'linear-gradient(180deg, var(--brand-blue), var(--brand-cyan))'
        : 'linear-gradient(180deg, #ff8cc6, #ffc46b)';
      confettiBox.appendChild(s);
    }
  }

  const toHome  = document.getElementById('success-home');
  const toLogin = document.getElementById('success-login');

  if (toHome) {
    toHome.addEventListener('click', () => {
      // go() available from core.js
      if (typeof go === 'function') {
        go('index.html');
      } else {
        location.href = './index.html';
      }
    });
  }

  if (toLogin) {
    toLogin.addEventListener('click', () => {
      if (typeof go === 'function') {
        go('login.html');
      } else {
        location.href = './login.html';
      }
    });
  }
});
