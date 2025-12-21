import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';

import {
  getAuth,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

import { firebaseConfig } from './firebaseConfig.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function setError(inputId, message) {
  const errorEl = document.querySelector(`[data-error-for="${inputId}"]`);
  if (errorEl) {
    errorEl.textContent = message || '';
  }
}

function clearErrors(form) {
  form.querySelectorAll('.error').forEach(e => (e.textContent = ''));
}

function showMessage(message, type = 'success') {
  const messageEl = document.getElementById('reset-message');
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `reset-message ${type}`;
  messageEl.style.display = 'block';

  if (type === 'success') {
    messageEl.style.color = '#10b981';
  } else {
    messageEl.style.color = '#f97373';
  }
}

function hideMessage() {
  const messageEl = document.getElementById('reset-message');
  if (messageEl) {
    messageEl.style.display = 'none';
    messageEl.textContent = '';
  }
}

function getErrorMessage(errorCode) {
  const errorMap = {
    'auth/invalid-email': 'Invalid email address. Please check and try again.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/too-many-requests': 'Too many requests. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };

  return errorMap[errorCode] || 'An error occurred. Please try again.';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('reset-email');
  const submitBtn = document.getElementById('reset-submit-btn');

  if (!form || !emailInput || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);
    hideMessage();

    const email = emailInput.value.trim();

    if (!email) {
      setError('reset-email', 'Email is required.');
      emailInput.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      setError('reset-email', 'Please enter a valid email address.');
      emailInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      await sendPasswordResetEmail(auth, email);
      
      showMessage('Reset link sent. Check your email.', 'success');
      
      const goToLoginBtn = document.createElement('button');
      goToLoginBtn.type = 'button';
      goToLoginBtn.textContent = 'Go to Login';
      goToLoginBtn.style.cssText = 'width: 100%; padding: 12px; border-radius: 10px; background: linear-gradient(90deg, #2563eb, #0ea5e9); border: none; color: #fff; font-size: 18px; cursor: pointer; margin-top: 12px; transition: filter 0.15s ease, transform 0.1s ease;';
      goToLoginBtn.addEventListener('mouseenter', () => {
        goToLoginBtn.style.filter = 'brightness(1.08)';
        goToLoginBtn.style.transform = 'translateY(-1px)';
      });
      goToLoginBtn.addEventListener('mouseleave', () => {
        goToLoginBtn.style.filter = '';
        goToLoginBtn.style.transform = '';
      });
      goToLoginBtn.addEventListener('click', () => {
        window.location.href = '/login.html';
      });

      const existingBtn = form.querySelector('.go-to-login-btn');
      if (existingBtn) {
        existingBtn.remove();
      }

      goToLoginBtn.classList.add('go-to-login-btn');
      form.appendChild(goToLoginBtn);

      submitBtn.style.display = 'none';
    } catch (error) {
      console.error('[Forgot Password] Error:', error);
      const errorMessage = getErrorMessage(error.code);
      setError('reset-email', errorMessage);
      showMessage(errorMessage, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  });
});

